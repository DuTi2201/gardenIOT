#include <LiquidCrystal_I2C.h>
#include <SoftwareSerial.h>
#include <DHT.h>
#include <Wire.h>

// Khai báo Serial
SoftwareSerial UnoSerial(11, 12);

// Khai báo DHT
#define DHTPIN 2
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

// Khai báo LCD
LiquidCrystal_I2C lcd(0x27, 16, 2);

// Định nghĩa chân cắm relay
#define FAN_PIN 7
#define LIGHT_PIN 8
#define PUMP_PIN 9

// Định nghĩa chân cắm cảm biến
#define LIGHT_SENSOR_PIN A0
#define SOIL_HUMIDITY_SENSOR_PIN A1

// Hệ số hiệu chỉnh cảm biến
#define HUMIDITY_CORRECTION_FACTOR 0.8
#define TEMPERATURE_CORRECTION_FACTOR 0.9

// Thời gian
#define LCD_DISPLAY_DURATION 3000    // 3 giây hiển thị thông báo
#define SEND_INTERVAL 2000           // 2 giây gửi dữ liệu một lần
#define STATUS_CHECK_INTERVAL 1000   // 1 giây kiểm tra trạng thái
#define DISPLAY_CHANGE_INTERVAL 5000 // 5 giây thay đổi hiển thị LCD

// Khai báo trước các hàm
void SET_LCD_Boot();
void updateMainDisplay();
void createCustomChars();

// Tạo ký tự custom cho ánh sáng và cây
byte Sun[8] = {
  0b00000,
  0b10101,
  0b01110,
  0b11011,
  0b01110,
  0b10101,
  0b00000,
  0b00000
};

byte Plant[8] = {
  0b00100,
  0b00110,
  0b01110,
  0b00100,
  0b01110,
  0b00100,
  0b01010,
  0b10001
};

byte Temp[8] = {
  0b00100,
  0b01010,
  0b01010,
  0b01010,
  0b01010,
  0b10001,
  0b10001,
  0b01110
};

byte Drop[8] = {
  0b00100,
  0b00100,
  0b01010,
  0b01010,
  0b10001,
  0b10001,
  0b10001,
  0b01110
};

// Trạng thái thiết bị
bool fanStatus = false;
bool lightStatus = false;
bool pumpStatus = false;

// Biến thời gian
unsigned long lastSendTime = 0;
unsigned long lastStatusCheck = 0;
unsigned long notificationStartTime = 0;
unsigned long lastDisplayChange = 0;

// Biến hiển thị LCD
bool isShowingNotification = false;
char lcdMessage[32] = "";
int displayMode = 0; // 0: Hiển thị cảm biến, 1: Hiển thị trạng thái thiết bị

// Biến lưu giá trị cảm biến
float temperature = 0;
float humidity = 0;
float lightPercent = 0;
float soilHumidityPercent = 0;

// Biến lưu thông báo từ Wemos
char wemosMessage[32] = "";
bool hasWemosMessage = false;

void setup() {
  Serial.begin(57600);   // Khởi tạo Serial để debug trên máy tính
  UnoSerial.begin(57600); // Serial để giao tiếp với Wemos
  dht.begin();           // Khởi tạo cảm biến DHT
  lcd.init();            // Khởi tạo LCD I2C
  lcd.backlight();       // Bật đèn nền LCD
  createCustomChars();   // Tạo ký tự đặc biệt
  SET_LCD_Boot();        // Hiển thị thông báo khởi động
  
  Serial.println("Arduino Uno System Start");
  Serial.println("DEBUG - Ensure Wemos is receiving on 57600 baud rate");
  
  // Thiết lập chân relay là OUTPUT
  pinMode(FAN_PIN, OUTPUT);
  pinMode(LIGHT_PIN, OUTPUT);
  pinMode(PUMP_PIN, OUTPUT);
  
  // Tắt tất cả relay ban đầu (HIGH là TẮT đối với relay active LOW)
  digitalWrite(FAN_PIN, HIGH);
  digitalWrite(LIGHT_PIN, HIGH);
  digitalWrite(PUMP_PIN, HIGH);
  
  // Đảm bảo trạng thái ban đầu phù hợp với điều khiển relay
  fanStatus = false;     // Tương ứng với trạng thái TẮT
  lightStatus = false;   // Tương ứng với trạng thái TẮT
  pumpStatus = false;    // Tương ứng với trạng thái TẮT
  
  // Đọc cảm biến ngay khi khởi động
  readSensors();
  
  // Gửi dữ liệu ban đầu
  sendSensorData();
  sendRelayStatus();
}

void loop() {
  // Đọc cảm biến
  readSensors();
  
  // Kiểm tra và xử lý các lệnh từ Wemos
  processCommands();
  
  // Gửi dữ liệu cảm biến và trạng thái theo định kỳ
  unsigned long currentMillis = millis();
  if (currentMillis - lastSendTime >= SEND_INTERVAL) {
    sendSensorData();
    lastSendTime = currentMillis;
  }
  
  // Kiểm tra trạng thái thiết bị định kỳ
  if (currentMillis - lastStatusCheck >= STATUS_CHECK_INTERVAL) {
    checkDeviceStatus();
    lastStatusCheck = currentMillis;
  }
  
  // Kiểm tra xem có đang hiển thị thông báo không
  if (isShowingNotification) {
    if (currentMillis - notificationStartTime >= LCD_DISPLAY_DURATION) {
      isShowingNotification = false;
      updateMainDisplay();
    }
  } else if (hasWemosMessage) {
    // Hiển thị thông báo từ Wemos
    displayWemosMessage();
    isShowingNotification = true;
    notificationStartTime = currentMillis;
    hasWemosMessage = false;
  } else if (currentMillis - lastDisplayChange >= DISPLAY_CHANGE_INTERVAL) {
    // Chuyển đổi chế độ hiển thị LCD
    displayMode = (displayMode + 1) % 2;
    updateMainDisplay();
    lastDisplayChange = currentMillis;
  }
}

// Đọc giá trị cảm biến
void readSensors() {
  // Đọc nhiệt độ và độ ẩm từ DHT22
  float newTemp = dht.readTemperature();
  float newHumidity = dht.readHumidity();
  
  // Kiểm tra giá trị hợp lệ và debug
  if (!isnan(newTemp) && !isnan(newHumidity)) {
    Serial.print("DEBUG - DHT22 đọc - Nhiệt độ: ");
    Serial.print(newTemp);
    Serial.print("°C, Độ ẩm: ");
    Serial.print(newHumidity);
    Serial.println("%");
    
    temperature = newTemp * TEMPERATURE_CORRECTION_FACTOR;
    // Áp dụng hệ số hiệu chỉnh độ ẩm
    humidity = newHumidity * HUMIDITY_CORRECTION_FACTOR;
  } else {
    Serial.println("DEBUG - Lỗi đọc DHT22");
  }
  
  // Đọc giá trị cảm biến ánh sáng và chuyển đổi sang phần trăm
  int lightVal = analogRead(LIGHT_SENSOR_PIN);
  // Chuyển đổi từ 0-1023 sang 0-100% (đảo ngược vì cảm biến cho giá trị thấp khi nhiều ánh sáng)
  lightPercent = (100 - (lightVal / 1023.0 * 100)) * 0.96;
  
  // Đọc giá trị cảm biến độ ẩm đất và chuyển đổi sang phần trăm
  int soilHumidityVal = analogRead(SOIL_HUMIDITY_SENSOR_PIN);
  // Chuyển đổi từ 0-1023 sang 0-100% (đảo ngược vì cảm biến cho giá trị cao khi khô)
  soilHumidityPercent = (100 - (soilHumidityVal / 1023.0 * 100)) * 0.96;
  
  Serial.print("DEBUG - Cảm biến ánh sáng: ");
  Serial.print(lightVal);
  Serial.print(" -> ");
  Serial.print(lightPercent, 2);
  Serial.print("%, Độ ẩm đất: ");
  Serial.print(soilHumidityVal);
  Serial.print(" -> ");
  Serial.print(soilHumidityPercent, 2);
  Serial.println("%");
}

// Xử lý các lệnh từ Wemos
void processCommands() {
  if (UnoSerial.available()) {
    // Thêm một khoảng trễ nhỏ để đảm bảo đã nhận đủ dữ liệu
    delay(5);
    
    String command = UnoSerial.readStringUntil('\n');
    command.trim();
    
    Serial.print("DEBUG - Nhận lệnh từ Wemos: ");
    Serial.println(command);
    
    // Nếu là lệnh điều khiển thiết bị
    if (command.startsWith("CMD:")) {
      String parts[3];
      int partCount = 0;
      int lastIndex = 4; // Bỏ qua "CMD:"
      
      // Tách lệnh thành các phần
      for (int i = lastIndex; i < command.length() && partCount < 3; i++) {
        if (command.charAt(i) == ':') {
          parts[partCount++] = command.substring(lastIndex, i);
          lastIndex = i + 1;
        }
      }
      if (lastIndex < command.length()) {
        parts[partCount++] = command.substring(lastIndex);
      }
      
      // Nếu có đủ thông tin: thiết bị và trạng thái
      if (partCount >= 2) {
        String device = parts[0];
        int state = parts[1].toInt();
        
        Serial.print("DEBUG - Điều khiển thiết bị: ");
        Serial.print(device);
        Serial.print(" -> trạng thái: ");
        Serial.println(state);
        
        // Điều khiển relay tương ứng
        if (device == "FAN") {
          controlRelay(FAN_PIN, state != 0, "Quat", &fanStatus);
        }
        else if (device == "LIGHT") {
          controlRelay(LIGHT_PIN, state != 0, "Den", &lightStatus);
        }
        else if (device == "PUMP") {
          controlRelay(PUMP_PIN, state != 0, "Bom", &pumpStatus);
        }
        else if (device == "ALL") {
          // Điều khiển tất cả các thiết bị
          controlRelay(FAN_PIN, state != 0, "Tat ca", &fanStatus);
          controlRelay(LIGHT_PIN, state != 0, "Tat ca", &lightStatus);
          controlRelay(PUMP_PIN, state != 0, "Tat ca", &pumpStatus);
        }
        
        // Thêm một khoảng trễ nhỏ trước khi gửi phản hồi
        delay(5);
        
        // Gửi lại trạng thái hiện tại
        sendRelayStatus();
      }
    }
    else if (command == "STATUS") {
      // Gửi trạng thái relay
      sendRelayStatus();
    }
    else if (command.startsWith("MSG:")) {
      // Nhận thông báo từ Wemos
      strncpy(wemosMessage, command.substring(4).c_str(), sizeof(wemosMessage) - 1);
      wemosMessage[sizeof(wemosMessage) - 1] = '\0';
      hasWemosMessage = true;
      
      Serial.print("DEBUG - Nhận thông báo: ");
      Serial.println(wemosMessage);
    }
  }
}

// Kiểm tra trạng thái thiết bị
void checkDeviceStatus() {
  // Đọc trạng thái thực tế của các chân relay
  // QUAN TRỌNG: TỐT nhất là đọc trạng thái ngõ ra để biết trạng thái thực tế
  // Relay active LOW (LOW = ON, HIGH = OFF)
  bool newFanStatus = digitalRead(FAN_PIN) == LOW; // LOW nghĩa là đang BẬT
  bool newLightStatus = digitalRead(LIGHT_PIN) == LOW; // LOW nghĩa là đang BẬT
  bool newPumpStatus = digitalRead(PUMP_PIN) == LOW; // LOW nghĩa là đang BẬT
  
  // Thêm debug để kiểm tra giá trị thực tế
  Serial.print("DEBUG - Trạng thái chân: FAN=");
  Serial.print(digitalRead(FAN_PIN));
  Serial.print(", LIGHT=");
  Serial.print(digitalRead(LIGHT_PIN));
  Serial.print(", PUMP=");
  Serial.println(digitalRead(PUMP_PIN));
  
  // Nếu có sự thay đổi, cập nhật và gửi trạng thái mới
  if (newFanStatus != fanStatus || newLightStatus != lightStatus || newPumpStatus != pumpStatus) {
    Serial.println("DEBUG - Phát hiện thay đổi trạng thái thiết bị");
    fanStatus = newFanStatus;
    lightStatus = newLightStatus;
    pumpStatus = newPumpStatus;
    
    // Hiển thị thay đổi trên LCD
    displayStateChange();
    
    // Gửi trạng thái mới về Wemos
    sendRelayStatus();
  }
}

// Hiển thị thay đổi trạng thái trên LCD
void displayStateChange() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("\x03 Thay doi TT \x03");
  lcd.setCursor(0, 1);
  lcd.print("F:");
  lcd.print(fanStatus ? "ON" : "OFF");
  lcd.print(" L:");
  lcd.print(lightStatus ? "ON" : "OFF");
  lcd.print(" P:");
  lcd.print(pumpStatus ? "ON" : "OFF");
  
  // Đặt trạng thái hiển thị thông báo
  isShowingNotification = true;
  notificationStartTime = millis();
}

// Hiển thị thông báo từ Wemos
void displayWemosMessage() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("\x02 Wemos Message \x02");
  
  // Hiển thị thông báo từ Wemos (tối đa 16 ký tự)
  lcd.setCursor(0, 1);
  lcd.print(wemosMessage);
}

// Điều khiển relay
void controlRelay(int pin, bool turnOn, String deviceName, bool* status) {
  // Relay active LOW - LOW là BẬT, HIGH là TẮT
  digitalWrite(pin, turnOn ? LOW : HIGH);
  *status = turnOn;
  
  Serial.print("DEBUG - Điều khiển relay: Pin ");
  Serial.print(pin);
  Serial.print(" -> ");
  Serial.print(turnOn ? "BẬT (LOW)" : "TẮT (HIGH)");
  Serial.print(", Thiết bị: ");
  Serial.println(deviceName);
  
  // Hiển thị thông báo trên LCD
  lcd.clear();
  lcd.setCursor(0, 0);
  if (deviceName == "Quat") {
    lcd.print("\x01 Dieu khien Quat");
    lcd.setCursor(0, 1);
    lcd.print("Trang thai: ");
    lcd.print(turnOn ? "BAT" : "TAT");
  } 
  else if (deviceName == "Den") {
    lcd.print("\x00 Dieu khien Den");
    lcd.setCursor(0, 1);
    lcd.print("Trang thai: ");
    lcd.print(turnOn ? "BAT" : "TAT");
  }
  else if (deviceName == "Bom") {
    lcd.print("\x03 Dieu khien Bom");
    lcd.setCursor(0, 1);
    lcd.print("Trang thai: ");
    lcd.print(turnOn ? "BAT" : "TAT");
  }
  else {
    lcd.print("DK: " + deviceName);
    lcd.setCursor(0, 1);
    lcd.print("Trang thai: ");
    lcd.print(turnOn ? "BAT" : "TAT");
  }
  
  // Đặt trạng thái đang hiển thị thông báo
  isShowingNotification = true;
  notificationStartTime = millis();
}

// Gửi dữ liệu cảm biến đến Wemos
void sendSensorData() {
  // Đảm bảo rằng dữ liệu cảm biến đã được đọc lại
  readSensors();
  
  // Đảm bảo không có dữ liệu đang chờ xử lý trước khi gửi
  while (UnoSerial.available()) {
    UnoSerial.read(); // Xóa buffer
  }
  
  // Debug thông tin trước khi gửi
  Serial.print("DEBUG - Gửi dữ liệu: ");
  Serial.print(temperature, 2);
  Serial.print(" ");
  Serial.print(humidity, 2);
  Serial.print(" ");
  Serial.print(lightPercent, 2);
  Serial.print(" ");
  Serial.println(soilHumidityPercent, 2);
  
  // Gửi theo định dạng: temp humid light soil
  UnoSerial.print(temperature, 2);
  UnoSerial.print(" ");
  UnoSerial.print(humidity, 2);
  UnoSerial.print(" ");
  UnoSerial.print(lightPercent, 2);
  UnoSerial.print(" ");
  UnoSerial.println(soilHumidityPercent, 2);
  
  // Thêm một khoảng thời gian nhỏ để đảm bảo dữ liệu được gửi hoàn chỉnh
  delay(10);
}

// Gửi trạng thái relay đến Wemos
void sendRelayStatus() {
  // Đảm bảo không có dữ liệu đang chờ xử lý trước khi gửi
  while (UnoSerial.available()) {
    UnoSerial.read(); // Xóa buffer
  }
  
  // Tạo chuỗi trạng thái với định dạng chuẩn và dấu ngăn cách rõ ràng
  String status = "STATUS:FAN:";
  status += fanStatus ? "1" : "0";
  status += ",LIGHT:";
  status += lightStatus ? "1" : "0";
  status += ",PUMP:";
  status += pumpStatus ? "1" : "0";
  
  Serial.print("DEBUG - Gửi trạng thái relay: ");
  Serial.println(status);
  
  // Gửi trạng thái và đảm bảo kết thúc bằng newline
  UnoSerial.println(status);
  
  // Thêm một khoảng thời gian nhỏ để đảm bảo dữ liệu được gửi hoàn chỉnh
  delay(10);
}

// Cập nhật màn hình chính
void updateMainDisplay() {
  lcd.clear();
  
  if (displayMode == 0) {
    // Hiển thị dữ liệu cảm biến
    lcd.setCursor(0, 0);
    lcd.write(byte(2)); // Biểu tượng nhiệt độ
    lcd.print(":");
    // Làm tròn nhiệt độ đến 1 chữ số thập phân và đảm bảo đủ khoảng trống
    float roundedTemp = round(temperature * 10) / 10.0;
    if (roundedTemp < 10) lcd.print(" ");
    lcd.print(roundedTemp, 1);
    lcd.print("C ");
    
    lcd.setCursor(8, 0);
    lcd.write(byte(3)); // Biểu tượng độ ẩm
    lcd.print(":");
    // Làm tròn độ ẩm đến 1 chữ số thập phân và đảm bảo đủ khoảng trống
    float roundedHum = round(humidity * 10) / 10.0;
    if (roundedHum < 10) lcd.print(" ");
    lcd.print(roundedHum, 1);
    lcd.print("%");
    
    lcd.setCursor(0, 1);
    lcd.write(byte(0)); // Biểu tượng ánh sáng
    lcd.print(":");
    // Làm tròn phần trăm ánh sáng đến số nguyên và đảm bảo đủ khoảng trống
    int roundedLight = round(lightPercent);
    if (roundedLight < 10) lcd.print(" ");
    lcd.print(roundedLight);
    lcd.print("% ");
    
    lcd.setCursor(8, 1);
    lcd.write(byte(1)); // Biểu tượng cây (độ ẩm đất)
    lcd.print(":");
    // Làm tròn phần trăm độ ẩm đất đến số nguyên và đảm bảo đủ khoảng trống
    int roundedSoil = round(soilHumidityPercent);
    if (roundedSoil < 10) lcd.print(" ");
    lcd.print(roundedSoil);
    lcd.print("%");
  } else {
    // Hiển thị trạng thái thiết bị - Căn chỉnh cân đối hơn
    lcd.setCursor(0, 0);
    lcd.print("\x01 Trang thai TBi");
    
    lcd.setCursor(0, 1);
    lcd.print("F:");
    lcd.print(fanStatus ? "ON " : "OFF");
    lcd.print("L:");
    lcd.print(lightStatus ? "ON " : "OFF");
    lcd.print("P:");
    lcd.print(pumpStatus ? "ON" : "OFF");
  }
}

// Hàm tạo Custom Character cho LCD
void createCustomChars() {
  lcd.createChar(0, Sun);   // Biểu tượng ánh sáng
  lcd.createChar(1, Plant); // Biểu tượng cây
  lcd.createChar(2, Temp);  // Biểu tượng nhiệt độ
  lcd.createChar(3, Drop);  // Biểu tượng nước (độ ẩm)
}

// Hàm khởi động LCD
void SET_LCD_Boot() {
  lcd.begin(16, 2);
  lcd.setCursor(0, 0);
  lcd.print("\x00\x00 SMART GARDEN \x00\x00");
  lcd.setCursor(0, 1);
  lcd.print(" Dang khoi dong...");
  delay(2000);
  
  // Hiển thị màn hình chính
  updateMainDisplay();
}
