

## Phần 1: Đánh giá mã nguồn hiện tại

Sau khi phân tích mã nguồn của Wemos (NodeMcu_Master) và Arduino (Arduino_Uno_Slave), tôi nhận thấy:

### 1.1. Phân tích mã nguồn Wemos D1 (NodeMcu_Master)

**Ưu điểm:**
- Kiến trúc mã nguồn tổ chức tốt, phân chia chức năng rõ ràng
- Đã có logic xử lý cảm biến và điều khiển thiết bị đầy đủ
- Có cơ chế tiết kiệm năng lượng thông qua chế độ deep sleep
- Xử lý lỗi và nhật ký hoạt động chi tiết
- Có cơ chế lưu trạng thái vào EEPROM

**Hạn chế cần điều chỉnh:**
- Hiện tại Wemos đang hoạt động như một web server độc lập, cần chuyển sang mô hình giao tiếp với server bên ngoài
- Chưa có cơ chế xác thực và bảo mật cho kết nối mạng
- Thiếu cơ chế định danh duy nhất (serial) để kết nối với hệ thống quản lý bên ngoài

### 1.2. Phân tích mã nguồn Arduino Uno (Arduino_Uno_Slave)

**Ưu điểm:**
- Mã nguồn xử lý cảm biến và điều khiển đầu ra tốt
- Giao tiếp với Wemos thông qua SoftwareSerial hiệu quả
- Hiển thị thông tin trên LCD rõ ràng, trực quan
- Có cơ chế kiểm tra trạng thái thiết bị và phản hồi

**Điểm cần lưu ý:**
- Không cần thay đổi nhiều trong mã Arduino vì nó chỉ giao tiếp với Wemos

## Phần 2: Kiến trúc hệ thống mới

### 2.1. Sơ đồ tổng quan

```
+----------------+     +----------------+     +------------------+
|                |     |                |     |                  |
| Arduino Uno    |<--->| Wemos D1       |<--->| Node.js Server   |<----> Người dùng
| (Các cảm biến  |     | (Kết nối mạng, |     | (Xác thực, lưu   |       (Webapp)
|  và thiết bị)  |     |  gửi/nhận dữ   |     |  trữ, giao diện) |
|                |     |  liệu)         |     |                  |
+----------------+     +----------------+     +------------------+
      Serial                 MQTT/HTTP             Webapp/API
```

### 2.2. Luồng dữ liệu

1. **Kết nối ban đầu:**
   - Người dùng đăng ký Wemos bằng mã serial trên webapp
   - Wemos kết nối tới Node.js server qua MQTT/HTTP
   - Server xác thực Wemos thông qua mã serial

2. **Truyền dữ liệu cảm biến:**
   - Arduino đọc dữ liệu cảm biến -> gửi cho Wemos qua Serial
   - Wemos định kỳ gửi dữ liệu cảm biến lên server qua MQTT/HTTP
   - Server lưu trữ dữ liệu và cập nhật giao diện người dùng

3. **Điều khiển thiết bị:**
   - Người dùng gửi lệnh điều khiển trên webapp
   - Server gửi lệnh đến Wemos qua MQTT/HTTP
   - Wemos gửi lệnh đến Arduino qua Serial
   - Arduino điều khiển thiết bị và gửi xác nhận ngược lại

## Phần 3: Kế hoạch triển khai

### 3.1. Chỉnh sửa mã nguồn Wemos

#### Chỉnh sửa NodeMcu_Master.ino:

```cpp
// Thêm thư viện MQTT và HTTP client
#include <PubSubClient.h>
#include <ESP8266HTTPClient.h>
#include <ArduinoJson.h>

// Biến cấu hình kết nối
const char* mqtt_server = "your_mqtt_server";
const int mqtt_port = 1883;
const char* mqtt_user = "";  // Để trống nếu không cần
const char* mqtt_pass = "";  // Để trống nếu không cần
String deviceSerial = "";  // Sẽ được đọc từ EEPROM hoặc flash

// Chủ đề MQTT
String mqttTopicData;      // Sẽ được tạo dựa trên deviceSerial
String mqttTopicCommand;   // Sẽ được tạo dựa trên deviceSerial
String mqttTopicStatus;    // Sẽ được tạo dựa trên deviceSerial

// Client MQTT
WiFiClient espClient;
PubSubClient mqttClient(espClient);

// Tần suất gửi dữ liệu
unsigned long lastDataSent = 0;
const unsigned long DATA_SEND_INTERVAL = 30000; // 30 giây

// Lấy mã serial từ flash hoặc EEPROM
void getDeviceSerial() {
  // Đọc từ EEPROM ở địa chỉ thích hợp
  EEPROM.begin(64);  // Kích thước đủ để lưu mã serial
  char serialBuf[32] = {0};
  
  for (int i = 0; i < 16; i++) { // Đọc 16 byte cho mã serial
    serialBuf[i] = EEPROM.read(16 + i);
  }
  
  // Nếu chưa có mã serial, tạo mới từ MAC
  if (serialBuf[0] == 0 || serialBuf[0] == 255) {
    String macAddress = WiFi.macAddress();
    macAddress.replace(":", "");
    String serialPrefix = "GARDEN";
    deviceSerial = serialPrefix + macAddress.substring(6);
    
    // Lưu vào EEPROM
    for (int i = 0; i < deviceSerial.length(); i++) {
      EEPROM.write(16 + i, deviceSerial[i]);
    }
    EEPROM.commit();
  } else {
    deviceSerial = String(serialBuf);
  }
  
  // Tạo chủ đề MQTT dựa trên mã serial
  mqttTopicData = "garden/" + deviceSerial + "/data";
  mqttTopicCommand = "garden/" + deviceSerial + "/command";
  mqttTopicStatus = "garden/" + deviceSerial + "/status";
  
  logEvent("Mã serial thiết bị: " + deviceSerial);
}

// Kết nối MQTT
void connectMQTT() {
  // Thiết lập server MQTT
  mqttClient.setServer(mqtt_server, mqtt_port);
  mqttClient.setCallback(mqttCallback);
  
  int retries = 0;
  while (!mqttClient.connected() && retries < 5) {
    String clientId = "GardenESP-" + deviceSerial;
    logEvent("Đang kết nối MQTT với ID: " + clientId);
    
    if (mqttClient.connect(clientId.c_str(), mqtt_user, mqtt_pass)) {
      logEvent("Kết nối MQTT thành công");
      
      // Đăng ký kênh lệnh điều khiển
      mqttClient.subscribe(mqttTopicCommand.c_str());
      
      // Gửi thông báo kết nối
      mqttClient.publish(mqttTopicStatus.c_str(), "{\"status\":\"connected\"}");
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
        autoMode = state;
        saveState();
        logEvent("Chuyển chế độ tự động: " + String(autoMode ? "BẬT" : "TẮT"));
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
  
  logEvent("Gửi dữ liệu cảm biến qua MQTT");
  mqttClient.publish(mqttTopicData.c_str(), jsonStr.c_str());
}

// Sửa hàm setup() để loại bỏ web server và thêm kết nối MQTT
void setup() {
  // Code hiện tại...
  
  // Lấy mã serial
  getDeviceSerial();
  
  // Kết nối MQTT
  connectMQTT();
  
  // Loại bỏ phần khởi tạo web server
  logEvent("Hệ thống khởi động hoàn tất, chờ lệnh từ server");
}

// Sửa hàm loop() để xử lý MQTT và gửi dữ liệu định kỳ
void loop() {
  // Xử lý client MQTT
  if (!mqttClient.connected()) {
    connectMQTT();
  }
  mqttClient.loop();
  
  // Các phần code hiện tại
  reconnectWiFi();
  unsigned long currentMillis = millis();
  
  // Đọc dữ liệu từ Arduino định kỳ
  if (currentMillis - lastSensorRead >= SENSOR_READ_INTERVAL) { 
    readArduinoData(); 
    lastSensorRead = currentMillis; 
  }
  
  // Gửi dữ liệu cảm biến lên server định kỳ
  if (currentMillis - lastDataSent >= DATA_SEND_INTERVAL) {
    sendSensorData();
    lastDataSent = currentMillis;
  }
  
  // Các phần còn lại của code hiện tại
  if (currentMillis - lastRelayCheckTime >= RELAY_CHECK_INTERVAL) { 
    requestRelayStatus(); 
  }
  
  if (currentMillis - lastScheduleCheck >= SCHEDULE_CHECK_INTERVAL) {
    checkSchedules();
    lastScheduleCheck = currentMillis;
  }
  
  if (currentMillis - lastDeepSleepCheck >= DEEP_SLEEP_CHECK_INTERVAL) {
    checkEnergySaving();
    lastDeepSleepCheck = currentMillis;
  }
  
  autoControl();
  
  // Xử lý tràn bộ nhớ millis()
  // ... (giữ nguyên code hiện tại)
}
```

### 3.2. Thiết kế cơ sở dữ liệu (MongoDB)

#### 3.2.1. Mô hình dữ liệu

1. **Người dùng (Users)**
```json
{
  "_id": "ObjectId",
  "username": "String",
  "email": "String",
  "password": "String (hash)",
  "name": "String",
  "created_at": "Date",
  "last_login": "Date"
}
```

2. **Vườn (Gardens)**
```json
{
  "_id": "ObjectId",
  "name": "String",
  "description": "String",
  "location": "String",
  "device_serial": "String",
  "user_id": "ObjectId (ref: Users)",
  "created_at": "Date",
  "last_connected": "Date",
  "settings": {
    "auto_mode": "Boolean",
    "temperature_threshold_high": "Number",
    "temperature_threshold_low": "Number",
    "humidity_threshold_high": "Number",
    "humidity_threshold_low": "Number",
    "light_threshold_high": "Number",
    "light_threshold_low": "Number",
    "soil_threshold_high": "Number",
    "soil_threshold_low": "Number"
  }
}
```

3. **Dữ liệu cảm biến (SensorData)**
```json
{
  "_id": "ObjectId",
  "garden_id": "ObjectId (ref: Gardens)",
  "timestamp": "Date",
  "temperature": "Number",
  "humidity": "Number",
  "light": "Number",
  "soil": "Number",
  "fan_status": "Boolean",
  "light_status": "Boolean",
  "pump_status": "Boolean",
  "auto_mode": "Boolean"
}
```

4. **Lịch sử thiết bị (DeviceHistory)**
```json
{
  "_id": "ObjectId",
  "garden_id": "ObjectId (ref: Gardens)",
  "timestamp": "Date",
  "device": "String (FAN/LIGHT/PUMP/AUTO)",
  "action": "String (ON/OFF)",
  "source": "String (AUTO/USER/SCHEDULE)",
  "user_id": "ObjectId (ref: Users)"
}
```

5. **Lịch trình (Schedules)**
```json
{
  "_id": "ObjectId",
  "garden_id": "ObjectId (ref: Gardens)",
  "device": "String (FAN/LIGHT/PUMP)",
  "action": "Boolean",
  "hour": "Number",
  "minute": "Number",
  "days": ["Number"], // 0-6 (Chủ nhật - Thứ bảy)
  "active": "Boolean",
  "created_at": "Date",
  "created_by": "ObjectId (ref: Users)"
}
```

### 3.3. Thiết kế API cho Node.js Server

#### 3.3.1. RESTful API

1. **Xác thực và Đăng ký**
   - POST `/api/auth/login` - Đăng nhập người dùng
   - POST `/api/auth/register` - Đăng ký người dùng mới
   - GET `/api/auth/profile` - Lấy thông tin người dùng

2. **Quản lý vườn**
   - GET `/api/gardens` - Lấy danh sách vườn của người dùng
   - POST `/api/gardens` - Tạo vườn mới
   - GET `/api/gardens/:id` - Lấy thông tin chi tiết vườn
   - PUT `/api/gardens/:id` - Cập nhật thông tin vườn
   - DELETE `/api/gardens/:id` - Xóa vườn

3. **Kết nối thiết bị**
   - POST `/api/gardens/connect` - Kết nối vườn mới bằng mã serial
   - PUT `/api/gardens/:id/settings` - Cập nhật cài đặt vườn
   - GET `/api/gardens/:id/status` - Kiểm tra trạng thái kết nối

4. **Điều khiển thiết bị**
   - POST `/api/gardens/:id/devices/:device/control` - Điều khiển thiết bị (BẬT/TẮT)
   - GET `/api/gardens/:id/devices/status` - Lấy trạng thái các thiết bị

5. **Dữ liệu cảm biến**
   - GET `/api/gardens/:id/data` - Lấy dữ liệu cảm biến mới nhất
   - GET `/api/gardens/:id/data/history` - Lấy lịch sử dữ liệu cảm biến

6. **Quản lý lịch trình**
   - GET `/api/gardens/:id/schedules` - Lấy danh sách lịch trình
   - POST `/api/gardens/:id/schedules` - Tạo lịch trình mới
   - PUT `/api/gardens/:id/schedules/:scheduleId` - Cập nhật lịch trình
   - DELETE `/api/gardens/:id/schedules/:scheduleId` - Xóa lịch trình

#### 3.3.2. MQTT API

1. **Chủ đề MQTT**
   - `garden/{deviceSerial}/data` - Dữ liệu từ Wemos gửi đến server
   - `garden/{deviceSerial}/command` - Lệnh từ server gửi đến Wemos
   - `garden/{deviceSerial}/status` - Trạng thái kết nối của Wemos

2. **Định dạng thông điệp MQTT**
   - Dữ liệu cảm biến:
     ```json
     {
       "temperature": 28.5,
       "humidity": 65.2,
       "light": 45.0,
       "soil": 38.7,
       "fan": true,
       "light_status": false,
       "pump": true,
       "auto": true,
       "timestamp": 1625482365000,
       "error": false
     }
     ```
   - Lệnh điều khiển:
     ```json
     {
       "device": "FAN", // hoặc "LIGHT", "PUMP", "AUTO", "ALL"
       "state": true // true=BẬT, false=TẮT
     }
     ```
   - Trạng thái kết nối:
     ```json
     {
       "status": "connected", // hoặc "disconnected", "error"
       "message": "...",
       "timestamp": 1625482365000
     }
     ```

### 3.4. Triển khai Server Node.js

#### 3.4.1. Cấu trúc thư mục dự án

```
server/
├── config/
│   ├── db.js           # Cấu hình MongoDB
│   ├── mqtt.js         # Cấu hình MQTT broker
│   └── passport.js     # Cấu hình xác thực
├── controllers/
│   ├── authController.js
│   ├── gardenController.js
│   ├── deviceController.js
│   └── scheduleController.js
├── middleware/
│   ├── auth.js         # Middleware xác thực
│   └── validators.js   # Kiểm tra đầu vào
├── models/
│   ├── User.js
│   ├── Garden.js
│   ├── SensorData.js
│   ├── DeviceHistory.js
│   └── Schedule.js
├── routes/
│   ├── authRoutes.js
│   ├── gardenRoutes.js
│   ├── deviceRoutes.js
│   └── scheduleRoutes.js
├── services/
│   ├── mqttService.js  # Xử lý kết nối MQTT
│   └── scheduleService.js # Xử lý lịch trình
├── utils/
│   ├── logger.js
│   └── helpers.js
├── app.js              # Ứng dụng Express
├── server.js           # Khởi động server
└── package.json
```

#### 3.4.2. Mã nguồn quan trọng

**1. Xử lý MQTT trong Node.js (services/mqttService.js)**

```javascript
const mqtt = require('mqtt');
const Garden = require('../models/Garden');
const SensorData = require('../models/SensorData');
const DeviceHistory = require('../models/DeviceHistory');
const logger = require('../utils/logger');

// Kết nối MQTT broker
const client = mqtt.connect('mqtt://mqtt_broker_address:1883', {
  username: 'mqtt_username',
  password: 'mqtt_password'
});

// Xử lý kết nối
client.on('connect', () => {
  logger.info('Kết nối thành công đến MQTT broker');
  // Đăng ký kênh nhận dữ liệu từ tất cả các vườn
  client.subscribe('garden/+/data');
  client.subscribe('garden/+/status');
});

// Xử lý thông điệp
client.on('message', async (topic, message) => {
  try {
    // Phân tích chủ đề
    const topicParts = topic.split('/');
    const deviceSerial = topicParts[1];
    const messageType = topicParts[2];
    
    // Tìm vườn tương ứng
    const garden = await Garden.findOne({ device_serial: deviceSerial });
    if (!garden) {
      logger.warn(`Không tìm thấy vườn với mã serial: ${deviceSerial}`);
      return;
    }
    
    // Phân tích thông điệp JSON
    const data = JSON.parse(message.toString());
    
    // Xử lý theo loại thông điệp
    if (messageType === 'data') {
      // Lưu dữ liệu cảm biến
      const sensorData = new SensorData({
        garden_id: garden._id,
        timestamp: new Date(),
        temperature: data.temperature,
        humidity: data.humidity,
        light: data.light,
        soil: data.soil,
        fan_status: data.fan,
        light_status: data.light_status,
        pump_status: data.pump,
        auto_mode: data.auto
      });
      
      await sensorData.save();
      logger.info(`Đã lưu dữ liệu cảm biến cho vườn: ${garden.name}`);
      
      // Cập nhật thời gian kết nối cuối
      garden.last_connected = new Date();
      await garden.save();
      
      // Gửi dữ liệu cho socket.io để cập nhật real-time
      io.to(`garden_${garden._id}`).emit('sensor_data', {
        gardenId: garden._id,
        data: sensorData
      });
      
    } else if (messageType === 'status') {
      logger.info(`Trạng thái thiết bị ${deviceSerial}: ${data.status}`);
      
      // Cập nhật trạng thái kết nối
      garden.last_connected = new Date();
      await garden.save();
      
      // Thông báo trạng thái qua socket.io
      io.to(`garden_${garden._id}`).emit('connection_status', {
        gardenId: garden._id,
        status: data.status
      });
    }
  } catch (error) {
    logger.error(`Lỗi xử lý thông điệp MQTT: ${error.message}`);
  }
});

// Gửi lệnh điều khiển đến thiết bị
const sendCommand = async (gardenId, device, state, userId) => {
  try {
    const garden = await Garden.findById(gardenId);
    if (!garden) {
      throw new Error('Không tìm thấy vườn');
    }
    
    const commandData = JSON.stringify({
      device: device,
      state: state
    });
    
    // Gửi lệnh qua MQTT
    const topic = `garden/${garden.device_serial}/command`;
    client.publish(topic, commandData);
    
    // Lưu lịch sử thiết bị
    const deviceHistory = new DeviceHistory({
      garden_id: garden._id,
      timestamp: new Date(),
      device: device,
      action: state ? 'ON' : 'OFF',
      source: 'USER',
      user_id: userId
    });
    
    await deviceHistory.save();
    logger.info(`Đã gửi lệnh: ${device} ${state ? 'BẬT' : 'TẮT'} cho vườn: ${garden.name}`);
    
    return true;
  } catch (error) {
    logger.error(`Lỗi gửi lệnh: ${error.message}`);
    throw error;
  }
};

module.exports = {
  client,
  sendCommand
};
```

**2. Xử lý kết nối và đăng ký vườn (controllers/gardenController.js)**

```javascript
const Garden = require('../models/Garden');
const User = require('../models/User');
const logger = require('../utils/logger');

// Kết nối vườn mới bằng mã serial
exports.connectGarden = async (req, res) => {
  try {
    const { serial, name, location, description } = req.body;
    const userId = req.user.id;
    
    // Kiểm tra xem vườn đã được đăng ký chưa
    const existingGarden = await Garden.findOne({ device_serial: serial });
    if (existingGarden) {
      return res.status(400).json({ 
        message: 'Vườn với mã serial này đã được đăng ký' 
      });
    }
    
    // Tạo vườn mới
    const garden = new Garden({
      name,
      description,
      location,
      device_serial: serial,
      user_id: userId,
      created_at: new Date(),
      last_connected: null,
      settings: {
        auto_mode: true,
        temperature_threshold_high: 30,
        temperature_threshold_low: 28,
        humidity_threshold_high: 70,
        humidity_threshold_low: 50,
        light_threshold_high: 50,
        light_threshold_low: 30,
        soil_threshold_high: 60,
        soil_threshold_low: 30
      }
    });
    
    await garden.save();
    logger.info(`Người dùng ${req.user.username} đã đăng ký vườn mới: ${name} (${serial})`);
    
    res.status(201).json({
      success: true,
      garden: {
        id: garden._id,
        name: garden.name,
        description: garden.description,
        location: garden.location,
        device_serial: garden.device_serial
      }
    });
    
  } catch (error) {
    logger.error(`Lỗi kết nối vườn: ${error.message}`);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Lấy danh sách vườn của người dùng
exports.getGardens = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const gardens = await Garden.find({ user_id: userId })
      .select('name description location device_serial created_at last_connected');
    
    res.json({
      success: true,
      count: gardens.length,
      gardens
    });
    
  } catch (error) {
    logger.error(`Lỗi lấy danh sách vườn: ${error.message}`);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Các API khác...
```

### 3.5. Bảo mật hệ thống

#### 3.5.1. Bảo mật kết nối

1. **Xác thực người dùng**
   - Sử dụng JWT (JSON Web Token) cho xác thực API
   - Bảo vệ tất cả các API bằng middleware xác thực

2. **Bảo mật kết nối MQTT**
   - Sử dụng xác thực người dùng/mật khẩu cho MQTT broker
   - Xem xét sử dụng TLS/SSL cho kết nối MQTT

3. **Mã hóa mật khẩu**
   - Sử dụng bcrypt để mã hóa mật khẩu người dùng
   - Không lưu mật khẩu dưới dạng văn bản thuần túy

4. **Bảo vệ dữ liệu nhạy cảm**
   - Sử dụng biến môi trường (.env) cho thông tin nhạy cảm
   - Giới hạn quyền truy cập đến cơ sở dữ liệu

5. **Rate limiting và CORS**
   - Áp dụng rate limiting cho API để ngăn chặn tấn công DDoS
   - Cấu hình CORS đúng cách để ngăn chặn yêu cầu từ nguồn không được phép

## Phần 4: Hướng dẫn triển khai chi tiết

### 4.1. Cài đặt môi trường phát triển

#### 4.1.1. Yêu cầu phần mềm

- Node.js (v14 trở lên)
- MongoDB (v4.4 trở lên)
- MQTT Broker (Mosquitto, HiveMQ, hoặc EMQX)
- Arduino IDE (để lập trình Wemos và Arduino Uno)

#### 4.1.2. Thiết lập dự án Node.js

```bash
# Tạo thư mục dự án
mkdir -p /Users/duong/Desktop/IOT/server
cd /Users/duong/Desktop/IOT/server

# Khởi tạo dự án Node.js
npm init -y

# Cài đặt các gói cần thiết
npm install express mongoose dotenv bcryptjs jsonwebtoken mqtt cors helmet express-validator socket.io morgan winston

# Cài đặt các gói phát triển
npm install --save-dev nodemon
```

#### 4.1.3. Cấu hình cơ bản

Tạo file `.env`:

```
PORT=3000
MONGO_URI=mongodb://localhost:27017/iot_garden
JWT_SECRET=your_secret_key_here
MQTT_URI=mqtt://localhost:1883
MQTT_USER=your_mqtt_username
MQTT_PASS=your_mqtt_password
NODE_ENV=development
```

### 4.2. Triển khai server Node.js

#### 4.2.1. Khởi tạo server

```javascript
// server.js
const express = require('express');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const socketIO = require('socket.io');
const mqttService = require('./services/mqttService');
const logger = require('./utils/logger');

// Tải biến môi trường
dotenv.config();

// Kết nối đến cơ sở dữ liệu
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan('combined', { stream: logger.stream }));

// Định nghĩa các route
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/gardens', require('./routes/gardenRoutes'));
app.use('/api/gardens', require('./routes/deviceRoutes'));
app.use('/api/gardens', require('./routes/scheduleRoutes'));

// Route mặc định
app.get('/', (req, res) => {
  res.json({ message: 'API Hệ thống IoT Smart Garden' });
});

// Xử lý lỗi
app.use((err, req, res, next) => {
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  res.status(err.status || 500).json({
    message: err.message,
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Tạo HTTP server
const server = http.createServer(app);

// Khởi tạo Socket.io
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Socket.io handlers
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);
  
  // Tham gia phòng cho vườn cụ thể
  socket.on('join_garden', (gardenId) => {
    socket.join(`garden_${gardenId}`);
    logger.info(`Socket ${socket.id} đã tham gia phòng garden_${gardenId}`);
  });
  
  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// Biến toàn cục cho socket.io (để sử dụng ở các module khác)
global.io = io;

// Khởi động server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  logger.info(`Server đang chạy trên cổng ${PORT}`);
});
```

<think>Tôi cần tiếp tục phần hướng dẫn triển khai chi tiết. Đang ở phần 4.3 nên sẽ tiếp tục từ đó.</think>### 4.3. Chỉnh sửa và nạp mã cho Wemos

#### 4.3.1. Cài đặt thư viện cần thiết

Mở Arduino IDE và cài đặt các thư viện sau:
- PubSubClient (cho MQTT)
- ArduinoJson (cho xử lý JSON)
- ESP8266WiFi (cho kết nối WiFi)
- ESP8266HTTPClient (cho yêu cầu HTTP)

#### 4.3.2. Nạp mã nguồn Wemos

Nạp mã nguồn NodeMcu_Master đã chỉnh sửa vào Wemos. Lưu ý đặt mã serial cho mỗi thiết bị nếu cần, hoặc sử dụng mã tự động tạo dựa trên địa chỉ MAC.

#### 4.3.3. Kiểm tra kết nối

Sau khi nạp mã, sử dụng Serial Monitor để kiểm tra:
- Kết nối WiFi
- Lấy mã serial
- Kết nối MQTT
- Gửi dữ liệu đến server

### 4.4. Thiết lập MQTT Broker

#### 4.4.1. Cài đặt Mosquitto MQTT Broker

```bash
# Cài đặt Mosquitto trên Ubuntu/Debian
sudo apt-get update
sudo apt-get install mosquitto mosquitto-clients

# Hoặc trên macOS
brew install mosquitto
```

#### 4.4.2. Cấu hình Mosquitto

Tạo file cấu hình `/etc/mosquitto/conf.d/default.conf`:

```
# Thiết lập cơ bản
allow_anonymous false
password_file /etc/mosquitto/passwd

# Lắng nghe trên cổng 1883
listener 1883

# Cho phép WebSockets (nếu cần)
listener 9001
protocol websockets
```

#### 4.4.3. Tạo tài khoản người dùng

```bash
# Tạo file mật khẩu và thêm tài khoản
sudo mosquitto_passwd -c /etc/mosquitto/passwd iot_garden
# Nhập mật khẩu khi được yêu cầu
```

#### 4.4.4. Khởi động dịch vụ

```bash
sudo systemctl restart mosquitto
```

### 4.5. Tích hợp giao diện người dùng

#### 4.5.1. Phát triển giao diện người dùng

Tích hợp các tính năng sau vào webapp Node.js:

1. **Trang đăng nhập và đăng ký**
   - Form đăng nhập
   - Form đăng ký tài khoản mới

2. **Bảng điều khiển người dùng**
   - Hiển thị danh sách vườn
   - Thêm vườn mới bằng mã serial
   - Xem chi tiết từng vườn

3. **Trang chi tiết vườn**
   - Hiển thị dữ liệu cảm biến (nhiệt độ, độ ẩm, ánh sáng, độ ẩm đất)
   - Điều khiển thiết bị (quạt, đèn, máy bơm)
   - Bật/tắt chế độ tự động
   - Quản lý lịch trình
   - Biểu đồ dữ liệu theo thời gian

#### 4.5.2. Kết nối Socket.io cho cập nhật real-time

```javascript
// Ví dụ code frontend (React)
import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

const GardenDetail = ({ gardenId }) => {
  const [sensorData, setSensorData] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  
  useEffect(() => {
    // Kết nối đến socket.io
    const socket = io('http://your-server-url');
    
    // Tham gia phòng cho vườn cụ thể
    socket.emit('join_garden', gardenId);
    
    // Lắng nghe cập nhật dữ liệu cảm biến
    socket.on('sensor_data', (data) => {
      if (data.gardenId === gardenId) {
        setSensorData(data.data);
      }
    });
    
    // Lắng nghe trạng thái kết nối
    socket.on('connection_status', (data) => {
      if (data.gardenId === gardenId) {
        setConnectionStatus(data.status);
      }
    });
    
    // Dọn dẹp khi component unmount
    return () => {
      socket.disconnect();
    };
  }, [gardenId]);
  
  // Hiển thị giao diện...
};
```

### 4.6. Quản lý lịch trình và tự động hóa

#### 4.6.1. Triển khai dịch vụ lịch trình

```javascript
// services/scheduleService.js
const Schedule = require('../models/Schedule');
const Garden = require('../models/Garden');
const mqttService = require('./mqttService');
const logger = require('../utils/logger');
const cron = require('node-cron');

// Khởi động dịch vụ lịch trình
const startScheduleService = async () => {
  logger.info('Khởi động dịch vụ lịch trình');
  
  // Chạy mỗi phút để kiểm tra lịch trình
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentDay = now.getDay(); // 0 = Chủ nhật, 1-6 = Thứ hai đến thứ bảy
      
      // Tìm các lịch trình cần thực hiện
      const schedulesToRun = await Schedule.find({
        active: true,
        hour: currentHour,
        minute: currentMinute,
        days: currentDay
      }).populate('garden_id');
      
      // Thực hiện từng lịch trình
      for (const schedule of schedulesToRun) {
        logger.info(`Thực hiện lịch trình: ${schedule._id} - ${schedule.device} - ${schedule.action ? 'BẬT' : 'TẮT'}`);
        
        // Gửi lệnh thông qua MQTT
        await mqttService.sendCommand(
          schedule.garden_id._id,
          schedule.device,
          schedule.action,
          schedule.created_by
        );
      }
    } catch (error) {
      logger.error(`Lỗi thực hiện lịch trình: ${error.message}`);
    }
  });
};

module.exports = {
  startScheduleService
};
```

#### 4.6.2. Khởi động dịch vụ lịch trình trong server.js

```javascript
// Thêm vào server.js
const scheduleService = require('./services/scheduleService');

// Khởi động dịch vụ lịch trình
scheduleService.startScheduleService();
```

### 4.7. Kiểm thử hệ thống

#### 4.7.1. Kiểm thử kết nối thiết bị

1. Kết nối Wemos với WiFi và MQTT broker
2. Kiểm tra khả năng nhận và gửi thông điệp MQTT
3. Xác minh dữ liệu cảm biến được gửi đến server
4. Kiểm tra khả năng nhận lệnh điều khiển từ server

#### 4.7.2. Kiểm thử API

1. Sử dụng Postman hoặc công cụ tương tự để kiểm tra API
2. Kiểm tra tất cả các endpoint API
3. Xác minh xác thực và phân quyền hoạt động đúng

#### 4.7.3. Kiểm thử giao diện người dùng

1. Kiểm tra tất cả các tính năng trên giao diện
2. Xác minh cập nhật real-time thông qua Socket.io
3. Kiểm tra trải nghiệm người dùng trên nhiều thiết bị và trình duyệt

### 4.8. Triển khai sản phẩm

#### 4.8.1. Triển khai server trên VPS hoặc dịch vụ đám mây

```bash
# Cài đặt PM2 để quản lý ứng dụng Node.js
npm install -g pm2

# Khởi động ứng dụng với PM2
pm2 start server.js --name "iot-garden-server"

# Đảm bảo ứng dụng tự khởi động khi server khởi động lại
pm2 startup
pm2 save
```

#### 4.8.2. Thiết lập tự động hóa

1. Cấu hình webhook để tự động triển khai khi có cập nhật từ Git
2. Thiết lập sao lưu tự động cho cơ sở dữ liệu
3. Cấu hình giám sát hệ thống với công cụ như Grafana hoặc Prometheus

#### 4.8.3. Tài liệu người dùng

1. Tạo hướng dẫn sử dụng cho người dùng cuối
2. Tạo tài liệu kỹ thuật cho nhà phát triển
3. Tạo video hướng dẫn cho các tác vụ phổ biến

## Phần 5: Kế hoạch vận hành và bảo trì

### 5.1. Giám sát hệ thống

#### 5.1.1. Giám sát server

1. Sử dụng công cụ giám sát như New Relic, Datadog hoặc Prometheus
2. Thiết lập thông báo khi có sự cố
3. Theo dõi sử dụng tài nguyên (CPU, RAM, đĩa)

#### 5.1.2. Giám sát thiết bị

1. Theo dõi trạng thái kết nối của các thiết bị Wemos
2. Phát hiện và cảnh báo khi thiết bị mất kết nối
3. Giám sát dữ liệu cảm biến để phát hiện dữ liệu bất thường

### 5.2. Nâng cấp và cập nhật

#### 5.2.1. Cập nhật firmware OTA (Over-The-Air)

Triển khai giải pháp cập nhật firmware từ xa cho các thiết bị Wemos:

```cpp
// Thêm vào code NodeMcu_Master.ino
#include <ESP8266httpUpdate.h>

void checkForUpdates() {
  logEvent("Kiểm tra cập nhật firmware...");
  
  WiFiClient client;
  t_httpUpdate_return ret = ESPhttpUpdate.update(client, "http://your-server/firmware/latest.bin");
  
  switch (ret) {
    case HTTP_UPDATE_FAILED:
      logEvent("Cập nhật thất bại: " + String(ESPhttpUpdate.getLastError()) + " " + ESPhttpUpdate.getLastErrorString(), "ERROR");
      break;
    case HTTP_UPDATE_NO_UPDATES:
      logEvent("Không có cập nhật mới");
      break;
    case HTTP_UPDATE_OK:
      logEvent("Cập nhật thành công, khởi động lại...");
      break;
  }
}
```

#### 5.2.2. Backup và khôi phục dữ liệu

Triển khai giải pháp sao lưu tự động cho cơ sở dữ liệu MongoDB:

```bash
# Script backup MongoDB hàng ngày
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/backup/mongodb"
DB_NAME="iot_garden"

# Tạo thư mục backup nếu chưa tồn tại
mkdir -p $BACKUP_DIR

# Sao lưu cơ sở dữ liệu
mongodump --db $DB_NAME --out $BACKUP_DIR/$TIMESTAMP

# Xóa các backup cũ (giữ lại 7 ngày gần nhất)
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} \;
```

### 5.3. Mở rộng hệ thống

#### 5.3.1. Thêm các loại cảm biến mới

Phương pháp mở rộng hệ thống để hỗ trợ các loại cảm biến mới:

1. Cập nhật mã Arduino để đọc dữ liệu từ cảm biến mới
2. Mở rộng giao thức giao tiếp giữa Arduino và Wemos
3. Cập nhật mã Wemos để gửi dữ liệu cảm biến mới lên server
4. Mở rộng mô hình dữ liệu và API trên server
5. Cập nhật giao diện người dùng để hiển thị dữ liệu mới

#### 5.3.2. Mở rộng quy mô

Hướng dẫn mở rộng hệ thống cho nhiều người dùng và nhiều vườn:

1. Sử dụng cơ sở dữ liệu có khả năng mở rộng (MongoDB Sharding)
2. Triển khai cân bằng tải cho API server
3. Sử dụng MQTT cluster cho khả năng xử lý nhiều kết nối
4. Triển khai kiến trúc microservice nếu cần

## Phần 6: Xử lý sự cố

### 6.1. Các vấn đề phổ biến và giải pháp

#### 6.1.1. Vấn đề kết nối

1. **Wemos không kết nối được WiFi**
   - Kiểm tra cấu hình WiFi (SSID, mật khẩu)
   - Kiểm tra cường độ tín hiệu WiFi
   - Khởi động lại Wemos

2. **Wemos không kết nối được MQTT**
   - Kiểm tra địa chỉ MQTT broker
   - Xác minh thông tin đăng nhập MQTT
   - Kiểm tra tường lửa

3. **Mất kết nối giữa Arduino và Wemos**
   - Kiểm tra kết nối vật lý giữa Arduino và Wemos
   - Xác minh tốc độ baud khớp nhau
   - Kiểm tra chân RX/TX kết nối đúng

#### 6.1.2. Vấn đề dữ liệu

1. **Dữ liệu cảm biến không chính xác**
   - Kiểm tra hệ số hiệu chỉnh cảm biến
   - Kiểm tra và thay thế cảm biến nếu cần
   - Kiểm tra nguồn điện cung cấp

2. **Thiết bị không phản hồi lệnh điều khiển**
   - Kiểm tra relay và kết nối vật lý
   - Đảm bảo lệnh được gửi đúng định dạng
   - Kiểm tra nguồn điện cho thiết bị

### 6.2. Tài liệu hỗ trợ

#### 6.2.1. Checklist khắc phục sự cố

```
# Checklist khắc phục sự cố kết nối

1. Kiểm tra nguồn điện cho Wemos và Arduino
2. Kiểm tra kết nối WiFi và MQTT
   - Trạng thái WiFi (đèn LED trên Wemos)
   - Thông tin MQTT trong log
3. Kiểm tra giao tiếp Serial
   - Đèn TX/RX nháy khi truyền dữ liệu
   - Kết nối vật lý giữa Arduino và Wemos
4. Kiểm tra server
   - MQTT broker hoạt động
   - Node.js server hoạt động
   - Cơ sở dữ liệu MongoDB kết nối
5. Kiểm tra log
   - Log trên Wemos qua Serial
   - Log trên server
```

#### 6.2.2. Hướng dẫn reset và khôi phục

1. **Reset Wemos về cài đặt gốc**
   - Nạp firmware mới
   - Xóa cấu hình EEPROM
   - Khởi động lại thiết bị

2. **Khôi phục cơ sở dữ liệu**
   - Sử dụng công cụ MongoDB để khôi phục từ backup
   - Kiểm tra tính toàn vẹn dữ liệu sau khi khôi phục

## Phần 7: Nguồn tài nguyên

### 7.1. Tài liệu tham khảo

1. Tài liệu kỹ thuật ESP8266 (Wemos D1)
2. Tài liệu Arduino
3. Hướng dẫn MQTT
4. Tài liệu Node.js và MongoDB

### 7.2. Mã nguồn mẫu và dự án liên quan

1. Repository GitHub với mã nguồn đầy đủ
2. Các dự án IoT tương tự để tham khảo

## Kết luận

Tài liệu này đã trình bày kế hoạch triển khai chi tiết cho hệ thống điều khiển và giám sát vườn thông minh IoT. Bằng cách tích hợp thiết bị Wemos và Arduino với một webapp Node.js, hệ thống cho phép người dùng theo dõi và điều khiển các thiết bị như quạt, đèn, máy bơm từ xa thông qua giao diện web.

Kiến trúc hệ thống đã được thiết kế với việc tập trung vào khả năng mở rộng, bảo mật và dễ bảo trì. Mỗi thiết bị Wemos có một mã serial duy nhất, cho phép người dùng dễ dàng kết nối và quản lý nhiều "vườn" từ một tài khoản.

Việc triển khai theo hướng dẫn này sẽ cung cấp một giải pháp IoT hoàn chỉnh, từ phần cứng đến phần mềm, đáp ứng được các yêu cầu về chức năng và hiệu suất của hệ thống vườn thông minh.

