# ESP32-Camera cho dự án GardenIOT

Module này sử dụng ESP32-CAM để chụp ảnh cây trồng định kỳ và gửi lên máy chủ GardenIOT để theo dõi sự phát triển và phân tích sức khỏe cây trồng.

## Tính năng

- **Chụp ảnh tự động**: Chụp ảnh cây trồng tự động vào các khung giờ phù hợp (8h-18h) và khi đủ ánh sáng
- **Tiết kiệm năng lượng**: Sử dụng chế độ deep sleep giữa các lần chụp ảnh để kéo dài thời gian sử dụng pin
- **Xử lý thông minh**: Chỉ chụp ảnh khi đủ ánh sáng và thời gian phù hợp, tự động sử dụng đèn flash khi ánh sáng yếu
- **Tối ưu hóa dữ liệu**: Nén ảnh và điều chỉnh chất lượng trước khi gửi
- **Kết nối an toàn**: Xác thực thông qua device_serial khi gửi dữ liệu
- **Lưu trữ cấu hình**: Lưu các thông số kết nối vào EEPROM để duy trì sau khi reset

## Phần cứng cần thiết

- ESP32-CAM (AI Thinker hoặc tương đương)
- Cảm biến ánh sáng (có thể sử dụng cảm biến quang điện trở nối với GPIO33)
- Pin Lithium hoặc nguồn điện ổn định (tùy chọn, nếu cần di động)
- Mạch nạp FTDI để nạp code (CH340, CP2102, ...)

## Kết nối phần cứng

1. **Nạp code**:
   - GPIO0 -> GND (khi nạp)
   - ESP32 RX -> FTDI TX
   - ESP32 TX -> FTDI RX
   - ESP32 GND -> FTDI GND
   - ESP32 5V/3.3V -> FTDI 5V/3.3V

2. **Cảm biến ánh sáng** (nếu có):
   - Đầu ra cảm biến -> GPIO33
   - VCC -> 3.3V
   - GND -> GND

## Cài đặt phần mềm

1. Cài đặt Arduino IDE và hỗ trợ ESP32:
   - Thêm URL `https://dl.espressif.com/dl/package_esp32_index.json` vào Preferences > Additional Board Manager URLs
   - Cài đặt "esp32" từ Tools > Board > Boards Manager

2. Cài đặt các thư viện cần thiết:
   - ArduinoJson
   - ESP32 Camera Driver

3. Cấu hình board:
   - Chọn "ESP32 Wrover Module" hoặc "AI Thinker ESP32-CAM"
   - Flash Mode: "QIO"
   - Flash Size: "4MB"
   - Partition Scheme: "Huge APP"
   - Upload Speed: 115200

## Cấu hình

Trước khi nạp code, hãy thay đổi các thông số trong file `garden_esp32_cam.ino`:

```cpp
// Cấu hình WiFi và Server
char wifi_ssid[32] = "WIFI_SSID";               // Tên WiFi
char wifi_password[64] = "WIFI_PASSWORD";       // Mật khẩu WiFi
char server_url[128] = "http://your-server/api/gardens/"; // URL máy chủ
char garden_id[36] = "YOUR_GARDEN_ID";          // ID vườn trên máy chủ
char device_serial[40] = "ESP32CAM_SERIAL";     // Serial thiết bị (phải trùng với thiết lập vườn)
```

Bạn cũng có thể tùy chỉnh các thông số khác:

```cpp
#define MIN_LIGHT_THRESHOLD 800    // Ngưỡng ánh sáng tối thiểu (0-4095)
#define SLEEP_MINUTES      60      // Số phút ngủ giữa các lần chụp
```

## Sử dụng

1. Nạp code vào ESP32-CAM
2. Ngắt kết nối GPIO0 và GND sau khi nạp xong
3. Reset ESP32-CAM
4. Đặt ESP32-CAM vào vị trí phù hợp để quan sát cây trồng
5. Thiết bị sẽ tự động chụp ảnh theo chu kỳ và gửi lên server

## Xử lý sự cố

1. **Không chụp được ảnh**:
   - Kiểm tra kết nối camera
   - Đảm bảo đủ ánh sáng hoặc điều chỉnh ngưỡng `MIN_LIGHT_THRESHOLD`
   - Kiểm tra nguồn điện (nên dùng nguồn 5V/2A)

2. **Không thể kết nối WiFi**:
   - Kiểm tra tên và mật khẩu WiFi
   - Đảm bảo ESP32 trong phạm vi phủ sóng WiFi
   - Thử reset lại thiết bị

3. **Không tải được ảnh lên server**:
   - Kiểm tra URL server, garden_id và device_serial
   - Đảm bảo server đang hoạt động và có thể truy cập
   - Kiểm tra logs từ Serial Monitor

## Tích hợp với MQTT (Tùy chọn)

Để nhận lệnh điều khiển từ server (như lệnh chụp ảnh ngay lập tức), bạn có thể mở rộng code để kết nối với MQTT broker:

```cpp
// Thêm vào đầu file
#include <PubSubClient.h>

// Thêm các biến cấu hình MQTT
char mqtt_server[40] = "your-mqtt-broker";
int mqtt_port = 1883;
char mqtt_topic[50];

// Khởi tạo MQTT client
WiFiClient espClient;
PubSubClient mqttClient(espClient);

// Xử lý tin nhắn MQTT
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  if (message == "capture") {
    // Đặt cờ yêu cầu chụp ảnh
    capture_requested = true;
    // Đánh thức ESP32 khỏi deep sleep
    esp_sleep_disable_wakeup_source(ESP_SLEEP_WAKEUP_TIMER);
    esp_restart();
  }
}

// Kết nối MQTT trong setup()
void connectMQTT() {
  // Thiết lập topic
  sprintf(mqtt_topic, "garden/%s/command", device_serial);
  
  // Cấu hình MQTT
  mqttClient.setServer(mqtt_server, mqtt_port);
  mqttClient.setCallback(mqttCallback);
  
  // Kết nối
  if (mqttClient.connect(device_serial)) {
    mqttClient.subscribe(mqtt_topic);
  }
}
```

## Tham khảo

- [ESP32-CAM AI Thinker Pinout](https://randomnerdtutorials.com/esp32-cam-ai-thinker-pinout/)
- [ESP32 Deep Sleep & Power Saving](https://randomnerdtutorials.com/esp32-deep-sleep-arduino-ide-wake-up-sources/)
- [ESP32-CAM Take Photo Save MicroSD Card](https://randomnerdtutorials.com/esp32-cam-take-photo-save-microsd-card/) 