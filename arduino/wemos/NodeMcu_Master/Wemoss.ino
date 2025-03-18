#include <ESP8266WiFi.h>
#include <SoftwareSerial.h>
#include <EEPROM.h>
#include <Ticker.h>
#include <time.h>
#include <PubSubClient.h>
#include <ESP8266HTTPClient.h>
#include <ArduinoJson.h>
#include <WiFiManager.h>
#include <DNSServer.h>
#include <ESP8266WebServer.h>
#include <ESP8266httpUpdate.h>

// Khai báo trước các hàm cần thiết
void logEvent(String event, String level = "INFO");

// Cấu hình MQTT - Mặc định - Luôn sử dụng các giá trị này
char mqtt_server[40] = "172.20.10.2";  // Thay đổi từ const char* sang char array
char mqtt_port[6] = "1883";            // Thay đổi từ const char* sang char array
char mqtt_user[20] = "";
char mqtt_pass[20] = "";
char deviceSerial[40] = "GARDEN123456"; // Thay đổi từ const char* sang char array

// Cờ báo cấu hình đã thay đổi
bool shouldSaveConfig = false;

// Chủ đề MQTT
String mqttTopicData;      // garden/{deviceSerial}/data
String mqttTopicCommand;   // garden/{deviceSerial}/command
String mqttTopicStatus;    // garden/{deviceSerial}/status

// Kết nối MQTT
WiFiClient espClient;
PubSubClient mqttClient(espClient);

// Tần suất gửi dữ liệu
unsigned long lastDataSent = 0;
const unsigned long DATA_SEND_INTERVAL = 30000; // 30 giây

const int RX_PIN = D6;
const int TX_PIN = D5;

float t = 0, h = 0, l = 0, s = 0;
bool autoMode = false;
bool fanStatus = false, lightStatus = false, pumpStatus = false;
bool schedulingMode = false;

// Biến theo dõi lỗi và trạng thái cảm biến
unsigned long lastSuccessfulSensorRead = 0;
int failedSensorReadCount = 0;
bool sensorError = false;

// Các thông số lập lịch
struct Schedule {
  int hour;
  int minute;
  bool active;
  int device; // 0: fan, 1: light, 2: pump
  bool action; // true: on, false: off
};

// Tối đa 10 lịch trình
Schedule schedules[10];
int scheduleCount = 0;

// Thông số thời gian
int timezone = 7; // GMT+7
struct tm timeinfo;

unsigned long lastFanChange = 0, lastLightChange = 0, lastPumpChange = 0;
const unsigned long MIN_CHANGE_INTERVAL = 5000;
unsigned long lastRelayCheckTime = 0, lastSensorRead = 0, lastScheduleCheck = 0, lastDeepSleepCheck = 0;
const unsigned long RELAY_CHECK_INTERVAL = 1000, SENSOR_READ_INTERVAL = 2000, SCHEDULE_CHECK_INTERVAL = 60000;
const unsigned long DEEP_SLEEP_CHECK_INTERVAL = 300000; // 5 phút kiểm tra chế độ ngủ
const unsigned long INACTIVITY_THRESHOLD = 1800000; // 30 phút không hoạt động sẽ vào chế độ tiết kiệm
unsigned long lastActivityTime = 0;

// Biến cho ghi nhật ký
#define LOG_BUFFER_SIZE 10
String logBuffer[LOG_BUFFER_SIZE];
int logIndex = 0;

SoftwareSerial NodeSerial(RX_PIN, TX_PIN);
Ticker deepSleepTicker;
bool isDeepSleepScheduled = false;

// Biến theo dõi trạng thái relay
unsigned long lastCommandSentTime = 0;
unsigned long lastRelayStatusUpdateTime = 0;
bool awaitingRelayResponse = false;
const unsigned long COMMAND_TIMEOUT = 5000; // 5 giây timeout cho lệnh relay

// Thêm biến để theo dõi thời gian gửi trạng thái kết nối
unsigned long lastStatusSent = 0;
const unsigned long STATUS_SEND_INTERVAL = 30000; // Giảm xuống 30 giây thay vì 60 giây

// Thêm biến để theo dõi quá trình đồng bộ
bool isInitialSyncCompleted = false;
unsigned long lastSyncRequest = 0;
const unsigned long SYNC_REQUEST_INTERVAL = 5000; // 5 giây

// Biến lưu trạng thái trước đó để kiểm tra thay đổi
bool prevFanStatus = false;
bool prevLightStatus = false; 
bool prevPumpStatus = false;
bool prevAutoMode = false;

// Callback khi cấu hình thay đổi
void saveConfigCallback() {
  Serial.println("Cần lưu cấu hình");
  shouldSaveConfig = true;
}

// Lưu cấu hình vào EEPROM
void saveConfigToEEPROM() {
  DynamicJsonDocument json(512);
  json["mqtt_server"] = mqtt_server;
  json["mqtt_port"] = mqtt_port;
  json["mqtt_user"] = mqtt_user;
  json["mqtt_pass"] = mqtt_pass;
  json["device_serial"] = deviceSerial;
  
  EEPROM.begin(512);
  EEPROM.put(100, mqtt_server);
  EEPROM.put(140, mqtt_port);
  EEPROM.put(146, mqtt_user);
  EEPROM.put(166, mqtt_pass);
  EEPROM.put(186, deviceSerial);  // Không cần .c_str() vì deviceSerial đã là char array
  EEPROM.commit();
  logEvent("Đã lưu cấu hình vào EEPROM");
}

// Tải cấu hình từ EEPROM
void loadConfigFromEEPROM() {
  EEPROM.begin(512);
  
  // Lưu giá trị mặc định trước khi tải
  char default_mqtt_server[40] = "172.20.10.2";
  char default_mqtt_port[6] = "1883";
  
  // Đọc từ EEPROM
  EEPROM.get(100, mqtt_server);
  EEPROM.get(140, mqtt_port);
  EEPROM.get(146, mqtt_user);
  EEPROM.get(166, mqtt_pass);
  
  // Kiểm tra dữ liệu sau khi tải
  Serial.println("DEBUG - Sau khi tải từ EEPROM:");
  Serial.print("MQTT Server: '");
  Serial.print(mqtt_server);
  Serial.println("'");
  Serial.print("MQTT Port: '");
  Serial.print(mqtt_port);
  Serial.println("'");

  // Kiểm tra tính hợp lệ của dữ liệu
  if (strlen(mqtt_server) < 2 || strlen(mqtt_server) > 39) {
    Serial.println("DEBUG - MQTT server không hợp lệ, khôi phục giá trị mặc định");
    strcpy(mqtt_server, default_mqtt_server); // Ok vì mqtt_server là char array
  }

  if (strlen(mqtt_port) < 2 || strlen(mqtt_port) > 5 || atoi(mqtt_port) <= 0) {
    Serial.println("DEBUG - MQTT port không hợp lệ, khôi phục giá trị mặc định");
    strcpy(mqtt_port, default_mqtt_port); // Ok vì mqtt_port là char array
  }
  
  char serial[40] = {0};
  EEPROM.get(186, serial);
  if (strlen(serial) > 0 && strlen(serial) < 30) {
    strcpy(deviceSerial, serial); // Sử dụng strcpy thay vì gán String
  }
  
  // Hiển thị thông tin cấu hình cuối cùng
  Serial.println("DEBUG - Cấu hình MQTT cuối cùng:");
  Serial.print("MQTT Server: ");
  Serial.println(mqtt_server);
  Serial.print("MQTT Port: ");
  Serial.println(mqtt_port);
  
  logEvent("Đã tải cấu hình từ EEPROM");
}

// Hàm ghi nhật ký
void logEvent(String event, String level) {
  String logEntry = String(millis() / 1000) + " [" + level + "] " + event;
  Serial.println(logEntry);
  
  // Lưu vào bộ đệm
  logBuffer[logIndex] = logEntry;
  logIndex = (logIndex + 1) % LOG_BUFFER_SIZE;
  
  // Nếu là lỗi, lưu vào EEPROM
  if (level == "ERROR") {
    // Ở đây có thể mở rộng để lưu lỗi vào EEPROM nếu cần
  }
}

// Thiết lập chủ đề MQTT dựa trên mã serial cố định
void getDeviceSerial() {
  // Tạo chủ đề MQTT dựa trên mã serial
  mqttTopicData = "garden/" + String(deviceSerial) + "/data";
  mqttTopicCommand = "garden/" + String(deviceSerial) + "/command";
  mqttTopicStatus = "garden/" + String(deviceSerial) + "/status";
  
  logEvent("Mã serial thiết bị: " + String(deviceSerial));
}

// Kết nối MQTT - Sử dụng giá trị mặc định
void connectMQTT() {
  // Debug thông tin cấu hình MQTT
  Serial.print("DEBUG - MQTT server: ");
  Serial.println(mqtt_server);
  Serial.print("DEBUG - MQTT port: ");
  Serial.println(mqtt_port);
  
  // Chuyển cổng MQTT từ chuỗi sang số
  int mqttPortInt = atoi(mqtt_port);
  if (mqttPortInt <= 0) {
    mqttPortInt = 1883;  // Sử dụng cổng mặc định nếu chuyển đổi thất bại
  }
  
  // Thiết lập server MQTT
  Serial.print("DEBUG - Kết nối MQTT tới: ");
  Serial.print(mqtt_server);
  Serial.print(":");
  Serial.println(mqttPortInt);
  
  mqttClient.setServer(mqtt_server, mqttPortInt);
  mqttClient.setCallback(mqttCallback);
  
  int retries = 0;
  while (!mqttClient.connected() && retries < 5) {
    String clientId = "GardenESP-" + String(deviceSerial);
    logEvent("Đang kết nối MQTT với ID: " + clientId + " tới " + String(mqtt_server) + ":" + String(mqttPortInt));
    
    if (mqttClient.connect(clientId.c_str(), mqtt_user, mqtt_pass)) {
      logEvent("Kết nối MQTT thành công");
      
      // Đăng ký kênh lệnh điều khiển
      mqttClient.subscribe(mqttTopicCommand.c_str());
      
      // Gửi thông báo kết nối
      String statusMsg = "{\"status\":\"connected\",\"timestamp\":" + String(millis()) + "}";
      mqttClient.publish(mqttTopicStatus.c_str(), statusMsg.c_str());
    } else {
      logEvent("Kết nối MQTT thất bại, mã lỗi: " + String(mqttClient.state()), "ERROR");
      delay(5000);
    }
    retries++;
  }
}

// Xử lý dữ liệu MQTT nhận được
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  // Chuyển payload thành chuỗi
  char message[length + 1];
  for (int i = 0; i < length; i++) {
    message[i] = (char)payload[i];
  }
  message[length] = '\0';
  
  String topicStr = String(topic);
  String payloadStr = String(message);
  
  logEvent("Nhận MQTT: " + topicStr + " - " + payloadStr);
  
  // Xử lý lệnh điều khiển
  if (topicStr == mqttTopicCommand) {
    DynamicJsonDocument doc(256);
    DeserializationError error = deserializeJson(doc, payloadStr);
    
    if (!error) {
      // Kiểm tra xem đây có phải là phản hồi cho yêu cầu đồng bộ
      if (doc.containsKey("sync_response") && doc["sync_response"].as<bool>() == true) {
        logEvent("Nhận phản hồi đồng bộ từ backend");
        
        // Cập nhật trạng thái từ backend
        if (doc.containsKey("fan")) {
          bool newFanStatus = doc["fan"].as<bool>();
          if (newFanStatus != fanStatus) {
            fanStatus = newFanStatus;
            // Gửi lệnh cập nhật đến Arduino
            NodeSerial.println("CMD:FAN:" + String(fanStatus ? "1" : "0"));
            logEvent("Đồng bộ FAN: " + String(fanStatus ? "BẬT" : "TẮT"));
          }
        }
        
        if (doc.containsKey("light")) {
          bool newLightStatus = doc["light"].as<bool>();
          if (newLightStatus != lightStatus) {
            lightStatus = newLightStatus;
            // Gửi lệnh cập nhật đến Arduino
            NodeSerial.println("CMD:LIGHT:" + String(lightStatus ? "1" : "0"));
            logEvent("Đồng bộ LIGHT: " + String(lightStatus ? "BẬT" : "TẮT"));
          }
        }
        
        if (doc.containsKey("pump")) {
          bool newPumpStatus = doc["pump"].as<bool>();
          if (newPumpStatus != pumpStatus) {
            pumpStatus = newPumpStatus;
            // Gửi lệnh cập nhật đến Arduino
            NodeSerial.println("CMD:PUMP:" + String(pumpStatus ? "1" : "0"));
            logEvent("Đồng bộ PUMP: " + String(pumpStatus ? "BẬT" : "TẮT"));
          }
        }
        
        if (doc.containsKey("auto")) {
          autoMode = doc["auto"].as<bool>();
          logEvent("Đồng bộ AUTO: " + String(autoMode ? "BẬT" : "TẮT"));
        }
        
        // Lưu trạng thái mới vào EEPROM
        saveState();
        
        // Đánh dấu đồng bộ đã hoàn thành
        isInitialSyncCompleted = true;
        logEvent("Đồng bộ trạng thái ban đầu hoàn thành");
        
        // Cập nhật giải thích về AUTO mode
        if (autoMode) {
          logEvent("Chế độ AUTO được BẬT - Lịch trình từ backend được kích hoạt");
        } else {
          logEvent("Chế độ AUTO được TẮT - Lịch trình từ backend bị vô hiệu hóa");
        }
        
        // Gửi cập nhật đến backend nếu có thay đổi
        if (prevAutoMode != autoMode) {
          sendDeviceStatusToBackend();
        }
        
        return;
      }
      
      // Xử lý lệnh điều khiển thông thường
      String device = doc["device"].as<String>();
      bool state = doc["state"].as<bool>();
      
      logEvent("Lệnh điều khiển: " + device + " -> " + String(state ? "BẬT" : "TẮT"));
      
      if (device == "FAN") {
        controlRelay("FAN", state, lastFanChange);
      } else if (device == "LIGHT") {
        controlRelay("LIGHT", state, lastLightChange);
      } else if (device == "PUMP") {
        controlRelay("PUMP", state, lastPumpChange);
      } else if (device == "AUTO") {
        // Lưu trạng thái cũ
        prevAutoMode = autoMode;
        
        // Cập nhật trạng thái mới
        autoMode = state;
        saveState();
        
        // Cập nhật giải thích về AUTO mode
        if (autoMode) {
          logEvent("Chế độ AUTO được BẬT - Lịch trình từ backend được kích hoạt");
        } else {
          logEvent("Chế độ AUTO được TẮT - Lịch trình từ backend bị vô hiệu hóa");
        }
        
        // Gửi cập nhật đến backend nếu có thay đổi
        if (prevAutoMode != autoMode) {
          sendDeviceStatusToBackend();
        }
      } else if (device == "ALL") {
        controlRelay("ALL", state, lastFanChange);
        lastLightChange = lastFanChange;
        lastPumpChange = lastFanChange;
      }
    } else {
      logEvent("Lỗi phân tích JSON: " + String(error.c_str()), "ERROR");
    }
  }
}

// Gửi dữ liệu cảm biến qua MQTT
void sendSensorData() {
  if (!mqttClient.connected()) {
    connectMQTT();
  }
  
  DynamicJsonDocument doc(256);
  doc["temperature"] = t;
  doc["humidity"] = h;
  doc["light"] = l;
  doc["soil"] = s;
  doc["fan"] = fanStatus;
  doc["light_status"] = lightStatus;
  doc["pump"] = pumpStatus;
  doc["auto"] = autoMode;
  doc["timestamp"] = millis();
  doc["error"] = sensorError;
  
  String jsonStr;
  serializeJson(doc, jsonStr);
  
  String dataTopic = mqttTopicData;
  logEvent("Gửi dữ liệu cảm biến qua MQTT - Topic: " + dataTopic);
  logEvent("Nội dung: " + jsonStr);
  
  mqttClient.publish(dataTopic.c_str(), jsonStr.c_str());
}

// Đọc dữ liệu từ Arduino (cập nhật cả cảm biến và trạng thái relay)
void readArduinoData() {
  if (NodeSerial.available() > 0) {
    String data = NodeSerial.readStringUntil('\n');
    data.trim();
    
    Serial.print("DEBUG - Nhận từ Arduino: '");
    Serial.print(data);
    Serial.println("'");
    
    // Thêm một khoảng trễ nhỏ để đảm bảo nhận đủ dữ liệu
    delay(5);

    // Nếu nhận được trạng thái relay
    if (data.startsWith("STATUS:")) {
      // Lưu trạng thái cũ để so sánh sau này
      prevFanStatus = fanStatus;
      prevLightStatus = lightStatus;
      prevPumpStatus = pumpStatus;
      
      // Xử lý cập nhật trạng thái relay
      processRelayStatusUpdate(data);
      awaitingRelayResponse = false;
      lastRelayStatusUpdateTime = millis();
      
      // Kiểm tra xem có thay đổi trạng thái nào so với trước không
      if (prevFanStatus != fanStatus || prevLightStatus != lightStatus || 
          prevPumpStatus != pumpStatus || prevAutoMode != autoMode) {
        
        // Có sự thay đổi trạng thái, gửi cập nhật đến backend
        sendDeviceStatusToBackend();
        
        // Cập nhật trạng thái tự động trước đó
        prevAutoMode = autoMode;
      }
    }
    // Nếu nhận được dữ liệu cảm biến (kiểm tra định dạng)
    else if (data.indexOf(" ") > 0 && !data.startsWith("CMD:") && !data.startsWith("MSG:")) {
      float oldT = t, oldH = h, oldL = l, oldS = s;
      
      if (sscanf(data.c_str(), "%f %f %f %f", &t, &h, &l, &s) == 4) {
        // Kiểm tra dữ liệu hợp lệ với phạm vi rộng hơn
        bool isInvalid = false;
        String invalidParams = "";
        
        // Kiểm tra từng giá trị và lưu lại tham số không hợp lệ
        if (t < -50 || t > 100) {
          invalidParams += "T=" + String(t) + " ";
          isInvalid = true;
        }
        if (h < 0 || h > 100) {
          invalidParams += "H=" + String(h) + " ";
          isInvalid = true;
        }
        if (l < 0 || l > 100) {
          invalidParams += "L=" + String(l) + " ";
          isInvalid = true;
        }
        if (s < 0 || s > 100) {
          invalidParams += "S=" + String(s) + " ";
          isInvalid = true;
        }
        
        if (isInvalid) {
          logEvent("Một số dữ liệu cảm biến không hợp lệ: " + invalidParams, "WARNING");
          
          // Chỉ khôi phục các giá trị không hợp lệ, giữ lại các giá trị hợp lệ
          if (t < -50 || t > 100) t = oldT;
          if (h < 0 || h > 100) h = oldH;
          if (l < 0 || l > 100) l = oldL;
          if (s < 0 || s > 100) s = oldS;
          
          failedSensorReadCount++;
        } else {
          // Dữ liệu hợp lệ
          logEvent("Cập nhật cảm biến: T=" + String(t) + "°C, H=" + String(h) + 
                  "%, L=" + String(l) + "%, S=" + String(s) + "%");
          lastSuccessfulSensorRead = millis();
          failedSensorReadCount = 0; // Reset bộ đếm lỗi
          sensorError = false; // Đặt lại trạng thái lỗi
        }
      } else {
        // Thử đọc với định dạng thay thế (dấu phẩy) để tương thích ngược
        if (sscanf(data.c_str(), "%f,%f,%f,%f", &t, &h, &l, &s) == 4) {
          logEvent("Cập nhật cảm biến (định dạng phẩy): T=" + String(t) + "°C, H=" + String(h) + 
                  "%, L=" + String(l) + "%, S=" + String(s) + "%");
          lastSuccessfulSensorRead = millis();
          failedSensorReadCount = 0;
          sensorError = false;
        } else {
          logEvent("Lỗi: Dữ liệu cảm biến không đúng định dạng: '" + data + "'", "ERROR");
          failedSensorReadCount++;
        }
      }
      
      // Nếu dữ liệu đã quá cũ (30 giây không nhận được dữ liệu hợp lệ)
      if (millis() - lastSuccessfulSensorRead > 30000 && lastSuccessfulSensorRead > 0) {
        logEvent("Dữ liệu cảm biến quá cũ (>30s), có thể có vấn đề kết nối", "WARNING");
      }
      
      // Chỉ đánh dấu lỗi cảm biến nếu liên tục thất bại nhiều lần
      if (failedSensorReadCount >= 5) {
        sensorError = true;
        logEvent("Cảm biến gặp lỗi liên tục sau 5 lần đọc!", "ERROR");
      }
    }
  }
  
  // Kiểm tra timeout cho lệnh relay
  if (awaitingRelayResponse && millis() - lastCommandSentTime > COMMAND_TIMEOUT) {
    logEvent("Timeout khi chờ xác nhận từ Arduino, đang yêu cầu cập nhật trạng thái", "WARNING");
    NodeSerial.println("STATUS");
    awaitingRelayResponse = false;
  }
}

// Xử lý cập nhật trạng thái relay từ Arduino
void processRelayStatusUpdate(String statusData) {
  // Định dạng: STATUS:FAN:1,LIGHT:0,PUMP:1
  Serial.print("DEBUG - Xử lý cập nhật trạng thái: ");
  Serial.println(statusData);
  
  // Đảm bảo rằng chuỗi có đúng định dạng trước khi xử lý
  if (!statusData.startsWith("STATUS:") || statusData.length() < 20) {
    Serial.println("DEBUG - Định dạng trạng thái không hợp lệ! Định dạng quá ngắn");
    logEvent("Định dạng trạng thái thiết bị không hợp lệ: " + statusData, "ERROR");
    return;
  }
  
  int fanIndex = statusData.indexOf("FAN:");
  int lightIndex = statusData.indexOf("LIGHT:");
  int pumpIndex = statusData.indexOf("PUMP:");
  
  if (fanIndex > 0 && lightIndex > 0 && pumpIndex > 0) {
    // Kiểm tra thêm xem các phần có đủ dài không
    if (lightIndex - fanIndex < 5 || pumpIndex - lightIndex < 7 || 
        statusData.length() - pumpIndex < 6) {
      Serial.println("DEBUG - Định dạng trạng thái không hợp lệ! Không đủ độ dài cho các phần");
      logEvent("Định dạng trạng thái thiết bị không đủ độ dài: " + statusData, "ERROR");
      return;
    }
    
    String fanValue = statusData.substring(fanIndex + 4, lightIndex - 1);
    String lightValue = statusData.substring(lightIndex + 6, pumpIndex - 1);
    String pumpValue = statusData.substring(pumpIndex + 5);
    
    // Kiểm tra giá trị có đúng định dạng 0/1 không
    if (fanValue != "0" && fanValue != "1" || 
        lightValue != "0" && lightValue != "1" ||
        (pumpValue != "0" && pumpValue != "1" && !pumpValue.startsWith("0") && !pumpValue.startsWith("1"))) {
      
      Serial.print("DEBUG - Giá trị không hợp lệ: FAN=");
      Serial.print(fanValue);
      Serial.print(", LIGHT=");
      Serial.print(lightValue);
      Serial.print(", PUMP=");
      Serial.println(pumpValue);
      
      // Nếu PUMP có vấn đề nhưng bắt đầu bằng 0 hoặc 1, có thể lấy ký tự đầu tiên
      if (pumpValue.startsWith("0") || pumpValue.startsWith("1")) {
        pumpValue = pumpValue.substring(0, 1);
        Serial.println("DEBUG - Đã sửa giá trị PUMP thành: " + pumpValue);
      } else {
        logEvent("Giá trị trạng thái thiết bị không hợp lệ: " + statusData, "ERROR");
        return;
      }
    }
    
    Serial.print("DEBUG - Giá trị trích xuất: FAN=");
    Serial.print(fanValue);
    Serial.print(", LIGHT=");
    Serial.print(lightValue);
    Serial.print(", PUMP=");
    Serial.println(pumpValue);
    
    bool newFanStatus = (fanValue == "1");
    bool newLightStatus = (lightValue == "1");
    bool newPumpStatus = (pumpValue == "1");
    
    // Kiểm tra sự thay đổi
    if (newFanStatus != fanStatus || newLightStatus != lightStatus || newPumpStatus != pumpStatus) {
      fanStatus = newFanStatus;
      lightStatus = newLightStatus;
      pumpStatus = newPumpStatus;
      logEvent("Cập nhật trạng thái relay: Quạt=" + String(fanStatus ? "BẬT" : "TẮT") + 
              ", Đèn=" + String(lightStatus ? "BẬT" : "TẮT") + 
              ", Máy bơm=" + String(pumpStatus ? "BẬT" : "TẮT"));
      saveState();
    }
  } else {
    Serial.println("DEBUG - Định dạng trạng thái không hợp lệ! Không tìm thấy các chỉ mục");
    logEvent("Định dạng trạng thái thiết bị không hợp lệ: " + statusData, "ERROR");
  }
}

// Hàm điều khiển relay qua Serial
void controlRelay(String device, bool turnOn, unsigned long& lastChange) {
  unsigned long currentMillis = millis();
  if (currentMillis - lastChange >= MIN_CHANGE_INTERVAL) {
    // Lưu trạng thái cũ để so sánh sau này
    prevFanStatus = fanStatus;
    prevLightStatus = lightStatus;
    prevPumpStatus = pumpStatus;
    prevAutoMode = autoMode;
    
    // Gửi lệnh qua Serial đến Arduino
    String command = "CMD:" + device + ":" + (turnOn ? "1" : "0");
    NodeSerial.println(command);
    
    // Cập nhật trạng thái ngay lập tức (sẽ được Arduino xác nhận sau)
    if (device == "FAN") fanStatus = turnOn;
    else if (device == "LIGHT") lightStatus = turnOn;
    else if (device == "PUMP") pumpStatus = turnOn;
    else if (device == "ALL") {
      fanStatus = turnOn;
      lightStatus = turnOn;
      pumpStatus = turnOn;
    }
    
    lastChange = currentMillis;
    awaitingRelayResponse = true;
    lastCommandSentTime = currentMillis;
    
    String deviceName = (device == "FAN") ? "Quạt" : ((device == "LIGHT") ? "Đèn" : ((device == "PUMP") ? "Máy bơm" : "Tất cả"));
    logEvent(deviceName + ": " + (turnOn ? "Gửi lệnh BẬT" : "Gửi lệnh TẮT"));
    
    // Gửi cập nhật trạng thái đến backend
    sendDeviceStatusToBackend();
    
    lastActivityTime = currentMillis; // Cập nhật thời gian hoạt động
    saveState();
  }
}

// Yêu cầu cập nhật trạng thái relay từ Arduino
void requestRelayStatus() {
  NodeSerial.println("STATUS");
  lastRelayCheckTime = millis();
}

void autoControl() {
  // Vô hiệu hóa chức năng tự điều khiển
  /* Phiên bản cũ:
  if (!autoMode) return;
  unsigned long currentMillis = millis();

  // Chỉ thực hiện điều khiển tự động khi không có lỗi cảm biến
  if (!sensorError) {
    // Điều khiển quạt dựa trên nhiệt độ
    if (t > 30 && !fanStatus) controlRelay("FAN", true, lastFanChange);
    else if (t < 28 && fanStatus) controlRelay("FAN", false, lastFanChange);

    // Điều khiển đèn dựa trên ánh sáng (đã chuyển sang %)
    if (l < 30 && !lightStatus) controlRelay("LIGHT", true, lastLightChange);
    else if (l >= 50 && lightStatus) controlRelay("LIGHT", false, lastLightChange);

    // Điều khiển bơm dựa trên độ ẩm đất (đã chuyển sang %)
    if (s < 30 && !pumpStatus) controlRelay("PUMP", true, lastPumpChange);
    else if (s >= 60 && pumpStatus) controlRelay("PUMP", false, lastPumpChange);
  } else {
    logEvent("Bỏ qua điều khiển tự động do lỗi cảm biến", "WARNING");
  }
  */
  
  // Phiên bản mới: Không tự điều khiển thiết bị dựa trên dữ liệu cảm biến
  // Chỉ sử dụng AUTO mode như một cờ báo hiệu xem lịch trình có được kích hoạt hay không
  if (autoMode) {
    // Chỉ log thông tin khi autoMode được bật
    // Không thực hiện bất kỳ thao tác điều khiển nào
    static unsigned long lastLogTime = 0;
    unsigned long currentMillis = millis();
    
    // Log mỗi 5 phút để tránh log quá nhiều
    if (currentMillis - lastLogTime > 300000) {
      logEvent("Chế độ AUTO đang được bật - Chờ lệnh từ backend");
      lastLogTime = currentMillis;
    }
  }
}

void saveState() {
  EEPROM.begin(16); // Tăng kích thước để lưu thêm dữ liệu
  EEPROM.write(0, autoMode ? 1 : 0);
  EEPROM.write(1, fanStatus ? 1 : 0);
  EEPROM.write(2, lightStatus ? 1 : 0);
  EEPROM.write(3, pumpStatus ? 1 : 0);
  EEPROM.write(4, schedulingMode ? 1 : 0);
  EEPROM.commit();
}

void loadState() {
  EEPROM.begin(16);
  autoMode = EEPROM.read(0);
  fanStatus = EEPROM.read(1);
  lightStatus = EEPROM.read(2);
  pumpStatus = EEPROM.read(3);
  schedulingMode = EEPROM.read(4);
  
  // Gửi lệnh khởi tạo trạng thái relay đến Arduino
  if (fanStatus) NodeSerial.println("CMD:FAN:1");
  if (lightStatus) NodeSerial.println("CMD:LIGHT:1");
  if (pumpStatus) NodeSerial.println("CMD:PUMP:1");
  delay(100);
}

void checkSchedules() {
  if (!schedulingMode) return;
  
  time_t now;
  time(&now);
  localtime_r(&now, &timeinfo);
  
  int currentHour = timeinfo.tm_hour;
  int currentMinute = timeinfo.tm_min;
  
  for (int i = 0; i < scheduleCount; i++) {
    if (schedules[i].active && 
        schedules[i].hour == currentHour && 
        schedules[i].minute == currentMinute) {
      
      // Thực hiện hành động theo lịch trình
      String device;
      switch (schedules[i].device) {
        case 0: device = "FAN"; break;
        case 1: device = "LIGHT"; break;
        case 2: device = "PUMP"; break;
      }
      
      unsigned long& lastChange = (schedules[i].device == 0) ? lastFanChange : 
                                ((schedules[i].device == 1) ? lastLightChange : lastPumpChange);
      
      logEvent("Thực hiện lịch trình: " + 
              String(schedules[i].device == 0 ? "Quạt" : (schedules[i].device == 1 ? "Đèn" : "Máy bơm")) + 
              " " + (schedules[i].action ? "BẬT" : "TẮT"));
      
      controlRelay(device, schedules[i].action, lastChange);
    }
  }
}

bool addSchedule(int hour, int minute, int device, bool action) {
  if (scheduleCount >= 10) return false;
  
  schedules[scheduleCount].hour = hour;
  schedules[scheduleCount].minute = minute;
  schedules[scheduleCount].active = true;
  schedules[scheduleCount].device = device;
  schedules[scheduleCount].action = action;
  
  scheduleCount++;
  return true;
}

void checkEnergySaving() {
  unsigned long currentMillis = millis();
  
  // Nếu không có hoạt động trong khoảng thời gian dài
  if (currentMillis - lastActivityTime > INACTIVITY_THRESHOLD && !isDeepSleepScheduled) {
    logEvent("Không hoạt động trong 30 phút, chuẩn bị vào chế độ tiết kiệm năng lượng");
    
    // Lên lịch ngủ sâu sau 10 giây
    deepSleepTicker.once(10, []() {
      logEvent("Vào chế độ tiết kiệm năng lượng trong 10 phút", "INFO");
      ESP.deepSleep(10 * 60 * 1000000); // Ngủ 10 phút
    });
    
    isDeepSleepScheduled = true;
  }
}

void cancelDeepSleep() {
  if (isDeepSleepScheduled) {
    deepSleepTicker.detach();
    isDeepSleepScheduled = false;
    logEvent("Hủy chế độ tiết kiệm năng lượng do có hoạt động mới");
  }
}

// Kiểm tra cập nhật firmware
void checkForUpdates() {
  logEvent("Kiểm tra cập nhật firmware...");
  
  WiFiClient client;
  HTTPClient http;
  
  // Thực hiện yêu cầu HTTP để kiểm tra phiên bản firmware mới
  String url = "http://localhost:3001/api/firmware/check?device=" + String(deviceSerial) + "&version=1.0.0";
  http.begin(client, url);
  
  int httpCode = http.GET();
  if (httpCode == HTTP_CODE_OK) {
    String payload = http.getString();
    DynamicJsonDocument doc(512);
    DeserializationError error = deserializeJson(doc, payload);
    
    if (!error) {
      bool hasUpdate = doc["has_update"];
      if (hasUpdate) {
        String firmwareUrl = doc["url"];
        logEvent("Phát hiện firmware mới, đang cập nhật...");
        
        // Thực hiện cập nhật OTA
        ESPhttpUpdate.setLedPin(LED_BUILTIN, LOW);
        
        // Update sử dụng HTTP, không phải HTTPS
        t_httpUpdate_return ret = ESPhttpUpdate.update(client, firmwareUrl);
        
        // Xử lý kết quả
        if (ret == HTTP_UPDATE_FAILED) {
          logEvent("Cập nhật thất bại: " + String(ESPhttpUpdate.getLastError()) + " " + ESPhttpUpdate.getLastErrorString(), "ERROR");
        } else if (ret == HTTP_UPDATE_NO_UPDATES) {
          logEvent("Không có cập nhật mới");
        } else if (ret == HTTP_UPDATE_OK) {
          logEvent("Cập nhật thành công, khởi động lại...");
        }
      } else {
        logEvent("Không có cập nhật firmware mới");
      }
    } else {
      logEvent("Lỗi phân tích JSON: " + String(error.c_str()), "ERROR");
    }
  } else {
    logEvent("Lỗi HTTP khi kiểm tra cập nhật: " + String(httpCode), "ERROR");
  }
  
  http.end();
}

void reconnectWiFi() {
  if (WiFi.status() != WL_CONNECTED) {
    logEvent("Mất kết nối WiFi, đang thử kết nối lại...", "WARNING");
    
    // Sử dụng WiFiManager để kết nối lại
    WiFiManager wifiManager;
    wifiManager.setConfigPortalTimeout(60); // Timeout 60 giây
    
    String apName = "SmartGarden-" + String(ESP.getChipId());
    if (!wifiManager.autoConnect(apName.c_str(), "smartgarden")) {
      logEvent("Không thể kết nối lại WiFi, sẽ thử lại sau...", "ERROR");
      return;
    }
    
    if (WiFi.status() == WL_CONNECTED) {
      logEvent("Đã kết nối lại WiFi! IP: " + WiFi.localIP().toString());
    }
  }
}

// Hàm thiết lập WiFi - Chỉ quản lý kết nối WiFi, không cấu hình MQTT
void setupWiFiManager() {
  // Tạo WiFiManager
  WiFiManager wifiManager;
  
  // Không cần callback lưu cấu hình vì không lưu MQTT
  
  // Không thêm các tham số MQTT vào WiFiManager
  
  // Thiết lập trang chào và tên WiFi AP
  wifiManager.setAPStaticIPConfig(IPAddress(10,0,1,1), IPAddress(10,0,1,1), IPAddress(255,255,255,0));
  wifiManager.setMinimumSignalQuality(10);
  wifiManager.setRemoveDuplicateAPs(true);
  wifiManager.setConfigPortalTimeout(180); // 3 phút timeout
  
  // Tên AP WiFi và mật khẩu
  String apName = "SmartGarden-" + String(ESP.getChipId());
  
  // Khởi động WiFiManager
  if (!wifiManager.autoConnect(apName.c_str(), "smartgarden")) {
    logEvent("Không thể kết nối WiFi, khởi động lại...", "ERROR");
    delay(3000);
    ESP.restart();
    delay(5000);
  }
  
  // Log thông tin kết nối
  logEvent("Đã kết nối WiFi thành công, IP: " + WiFi.localIP().toString());
}

void setup() {
  Serial.begin(115200);
  NodeSerial.begin(57600);
  
  // Không cần tải cấu hình MQTT từ EEPROM nữa
  
  // Khởi tạo EEPROM chỉ để lưu trạng thái thiết bị
  EEPROM.begin(16);
  
  // Tải trạng thái từ EEPROM
  loadState();
  
  // Ghi log khởi động
  logEvent("Hệ thống đang khởi động...");
  Serial.println("DEBUG - Wemos D1 khởi động");
  Serial.println("DEBUG - SoftwareSerial trên chân D5/D6 ở tốc độ 57600");
  
  // In thông tin cấu hình MQTT cố định
  Serial.println("DEBUG - Cấu hình hệ thống:");
  Serial.print("MQTT Server (mặc định): ");
  Serial.println(mqtt_server);
  Serial.print("MQTT Port (mặc định): ");
  Serial.println(mqtt_port);
  Serial.print("Device Serial (mặc định): ");
  Serial.println(deviceSerial);
  
  // Thiết lập WiFi - Chỉ quản lý kết nối WiFi
  setupWiFiManager();
  
  // Cấu hình thời gian
  configTime(timezone * 3600, 0, "pool.ntp.org", "time.nist.gov");
  
  // Kiểm tra đồng bộ thời gian
  time_t now;
  time(&now);
  localtime_r(&now, &timeinfo);
  logEvent("Thời gian hiện tại: " + String(timeinfo.tm_hour) + ":" + String(timeinfo.tm_min));
  
  // Lấy mã serial thiết bị
  getDeviceSerial();
  
  // Kết nối MQTT
  connectMQTT();
  
  // Đặt trạng thái đồng bộ ban đầu là false - sẽ gửi yêu cầu đồng bộ trong loop
  isInitialSyncCompleted = false;
  lastSyncRequest = 0;
  
  // Khởi tạo thời gian hoạt động
  lastActivityTime = millis();
  
  // Yêu cầu cập nhật trạng thái relay từ Arduino
  requestRelayStatus();
  
  logEvent("Hệ thống khởi động hoàn tất, chờ đồng bộ trạng thái thiết bị từ backend...");
}

// Nút reset cấu hình (kết nối GPIO0 với GND trong 5 giây)
void checkResetButton() {
  // Nếu nút GPIO0 được nhấn trong 5 giây (nút FLASH)
  if (digitalRead(0) == LOW) {
    unsigned long pressTime = millis();
    while (digitalRead(0) == LOW) {
      delay(100);
      if (millis() - pressTime > 5000) {
        logEvent("Xóa cấu hình và khởi động lại...");
        WiFiManager wifiManager;
        wifiManager.resetSettings();
        ESP.restart();
      }
    }
  }
}

void loop() {
  // Kiểm tra nút reset cấu hình
  checkResetButton();
  
  // Kiểm tra lệnh đặc biệt từ Serial
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    processSerialCommand(command);
  }
  
  // Xử lý client MQTT
  if (!mqttClient.connected()) {
    connectMQTT();
  }
  mqttClient.loop();
  
  // Yêu cầu đồng bộ trạng thái ban đầu sau khi kết nối MQTT thành công
  if (!isInitialSyncCompleted && mqttClient.connected()) {
    // Gửi lại yêu cầu đồng bộ mỗi 5 giây cho đến khi nhận được phản hồi
    if (millis() - lastSyncRequest >= SYNC_REQUEST_INTERVAL) {
      requestInitialSync();
    }
  }
  
  unsigned long currentMillis = millis();
  
  // Đọc dữ liệu từ Arduino theo định kỳ
  if (currentMillis - lastSensorRead >= SENSOR_READ_INTERVAL) { 
    readArduinoData(); 
    
    // In ra thông tin cảm biến mỗi 10 lần đọc (khoảng 20 giây)
    static int readCount = 0;
    if (++readCount >= 10) {
      printSensorStatus();
      readCount = 0;
    }
    
    lastSensorRead = currentMillis; 
  }
  
  // Kiểm tra và gửi dữ liệu cảm biến định kỳ
  if (millis() - lastDataSent > DATA_SEND_INTERVAL) {
    sendSensorData();
    lastDataSent = millis();
  }
  
  // Kiểm tra trạng thái relay theo định kỳ
  if (currentMillis - lastRelayCheckTime >= RELAY_CHECK_INTERVAL) { 
    requestRelayStatus(); 
  }
  
  // Kiểm tra lịch trình theo định kỳ
  if (currentMillis - lastScheduleCheck >= SCHEDULE_CHECK_INTERVAL) {
    checkSchedules();
    lastScheduleCheck = currentMillis;
  }
  
  // Kiểm tra chế độ tiết kiệm năng lượng
  if (currentMillis - lastDeepSleepCheck >= DEEP_SLEEP_CHECK_INTERVAL) {
    checkEnergySaving();
    lastDeepSleepCheck = currentMillis;
  }
  
  // Điều khiển tự động
  autoControl();
  
  // Gửi trạng thái kết nối định kỳ
  if (millis() - lastStatusSent > STATUS_SEND_INTERVAL) {
    sendConnectionStatus();
    lastStatusSent = millis();
  }
  
  // Xử lý vấn đề tràn bộ nhớ millis()
  if (lastActivityTime > currentMillis) {
    lastActivityTime = currentMillis;
  }
  if (lastSensorRead > currentMillis) {
    lastSensorRead = currentMillis;
  }
  if (lastRelayCheckTime > currentMillis) {
    lastRelayCheckTime = currentMillis;
  }
  if (lastScheduleCheck > currentMillis) {
    lastScheduleCheck = currentMillis;
  }
  if (lastDeepSleepCheck > currentMillis) {
    lastDeepSleepCheck = currentMillis;
  }
  if (lastDataSent > currentMillis) {
    lastDataSent = currentMillis;
  }
}

void printSensorStatus() {
  Serial.println("==== THÔNG TIN CẢM BIẾN ====");
  Serial.println("Nhiệt độ: " + String(t) + "°C");
  Serial.println("Độ ẩm: " + String(h) + "%");
  Serial.println("Ánh sáng: " + String(l) + "%");
  Serial.println("Độ ẩm đất: " + String(s) + "%");
  Serial.println("Trạng thái lỗi: " + String(sensorError ? "CÓ" : "KHÔNG"));
  Serial.println("Số lần đọc lỗi liên tiếp: " + String(failedSensorReadCount));
  Serial.println("Thời gian từ lần đọc thành công cuối: " + String((millis() - lastSuccessfulSensorRead)/1000) + "s");
  Serial.println("============================");
}

// Hàm gửi trạng thái kết nối
void sendConnectionStatus() {
  if (!mqttClient.connected()) {
    connectMQTT();
  }
  
  String statusTopic = mqttTopicStatus;
  String statusMsg = "{\"status\":\"connected\",\"timestamp\":" + String(millis()) + "}";
  
  logEvent("Gửi trạng thái kết nối qua MQTT - Topic: " + statusTopic);
  logEvent("Nội dung: " + statusMsg);
  
  mqttClient.publish(statusTopic.c_str(), statusMsg.c_str());
}

// Xử lý lệnh từ Serial monitor
void processSerialCommand(String command) {
  if (command == "info") {
    Serial.println("==== THÔNG TIN CẤU HÌNH ====");
    Serial.print("MQTT Server (mặc định): ");
    Serial.println(mqtt_server);
    Serial.print("MQTT Port (mặc định): ");
    Serial.println(mqtt_port);
    Serial.print("MQTT User: ");
    Serial.println(mqtt_user);
    Serial.print("Device Serial (mặc định): ");
    Serial.println(deviceSerial);
    Serial.print("WiFi IP: ");
    Serial.println(WiFi.localIP().toString());
    Serial.print("WiFi SSID: ");
    Serial.println(WiFi.SSID());
    Serial.print("MQTT Connected: ");
    Serial.println(mqttClient.connected() ? "Yes" : "No");
    if (!mqttClient.connected()) {
      Serial.print("MQTT Error code: ");
      Serial.println(mqttClient.state());
    }
    Serial.println("============================");
  }
  else if (command == "help") {
    Serial.println("==== CÁC LỆNH CÓ SẴN ====");
    Serial.println("info - Hiển thị thông tin cấu hình");
    Serial.println("help - Hiển thị danh sách lệnh");
    Serial.println("==========================");
  }
}

// Yêu cầu đồng bộ trạng thái từ backend
void requestInitialSync() {
  if (!mqttClient.connected()) {
    connectMQTT();
  }
  
  DynamicJsonDocument doc(128);
  doc["sync_request"] = true;
  doc["device_serial"] = deviceSerial;
  
  String jsonStr;
  serializeJson(doc, jsonStr);
  
  String syncTopic = "garden/" + String(deviceSerial) + "/sync";
  logEvent("Gửi yêu cầu đồng bộ trạng thái ban đầu - Topic: " + syncTopic);
  logEvent("Nội dung: " + jsonStr);
  
  mqttClient.publish(syncTopic.c_str(), jsonStr.c_str());
  lastSyncRequest = millis();
}

// Hàm gửi trạng thái thiết bị lên backend
void sendDeviceStatusToBackend() {
  if (!mqttClient.connected()) {
    connectMQTT();
  }
  
  DynamicJsonDocument doc(256);
  doc["device_update"] = true;
  doc["fan"] = fanStatus;
  doc["light"] = lightStatus;
  doc["pump"] = pumpStatus;
  doc["auto"] = autoMode;
  doc["timestamp"] = millis();
  
  String jsonStr;
  serializeJson(doc, jsonStr);
  
  // Gửi cập nhật trạng thái đến topic garden/{deviceSerial}/update
  String updateTopic = "garden/" + String(deviceSerial) + "/update";
  logEvent("Gửi cập nhật trạng thái thiết bị đến backend - Topic: " + updateTopic);
  logEvent("Nội dung: " + jsonStr);
  
  mqttClient.publish(updateTopic.c_str(), jsonStr.c_str());
}