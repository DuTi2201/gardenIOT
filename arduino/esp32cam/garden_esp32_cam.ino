#include "esp_camera.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include "time.h"
#include "esp_sleep.h"
#include "driver/rtc_io.h"
#include <ArduinoJson.h>
#include <EEPROM.h>

// Cấu hình chân camera cho ESP32-CAM AI Thinker
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

// LED Flash
#define LED_GPIO_NUM       4

// Cảm biến ánh sáng (Tùy chỉnh theo phần cứng thực tế)
#define LIGHT_SENSOR_PIN   33  // ADC pin
#define MIN_LIGHT_THRESHOLD 800 // Ngưỡng ánh sáng tối thiểu để chụp ảnh (0-4095)

// Thời gian deep sleep
#define SLEEP_MINUTES      60  // Số phút ngủ giữa các lần chụp
#define uS_TO_MIN_FACTOR   60000000  // Hệ số chuyển đổi từ phút sang microgiây

// Thời gian (GMT+7)
#define GMT_OFFSET_SEC 25200 // GMT+7 = 7*3600

// Cấu hình WiFi và Server (Lưu trong EEPROM)
#define EEPROM_SIZE 512
char wifi_ssid[32] = "WIFI_SSID";
char wifi_password[64] = "WIFI_PASSWORD";
char server_url[128] = "http://your-server/api/gardens/";
char garden_id[36] = "YOUR_GARDEN_ID";
char device_serial[40] = "ESP32CAM_SERIAL";

// Số lần thử lại khi kết nối thất bại
const int MAX_CONNECT_RETRY = 3;
const int MAX_UPLOAD_RETRY = 3;

// Biến toàn cục
int upload_retry_count = 0;
int battery_level = -1; // Không có cảm biến pin mặc định
RTC_DATA_ATTR int boot_count = 0;
RTC_DATA_ATTR bool capture_requested = false;

// Cờ báo hiệu hoạt động
bool takingPicture = false;

// Khởi tạo camera
bool initCamera() {
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  
  // Khởi tạo với chất lượng cao khi xác định bộ nhớ
  if(psramFound()){
    config.frame_size = FRAMESIZE_SVGA; // 800x600
    config.jpeg_quality = 12;  // 0-63, số thấp = chất lượng cao hơn
    config.fb_count = 2;
  } else {
    config.frame_size = FRAMESIZE_VGA;  // 640x480
    config.jpeg_quality = 15;
    config.fb_count = 1;
  }
  
  // Khởi tạo camera
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x", err);
    return false;
  }
  
  // Cấu hình bổ sung: cân bằng trắng, độ sáng, độ tương phản
  sensor_t * s = esp_camera_sensor_get();
  s->set_brightness(s, 1);      // -2 to 2
  s->set_contrast(s, 1);        // -2 to 2
  s->set_saturation(s, 0);      // -2 to 2
  s->set_special_effect(s, 0);  // 0 = không hiệu ứng đặc biệt
  s->set_whitebal(s, 1);        // 0 = tắt, 1 = bật
  s->set_awb_gain(s, 1);        // 0 = tắt, 1 = bật
  s->set_wb_mode(s, 0);         // 0 to 4 - (auto, sunny, cloudy, office, home)
  s->set_aec_value(s, 300);     // Thời gian phơi sáng
  
  return true;
}

// Điều khiển LED Flash
void setLed(bool on) {
  pinMode(LED_GPIO_NUM, OUTPUT);
  digitalWrite(LED_GPIO_NUM, on ? HIGH : LOW);
}

// Đọc giá trị ánh sáng môi trường
int readLightLevel() {
  pinMode(LIGHT_SENSOR_PIN, INPUT);
  return analogRead(LIGHT_SENSOR_PIN);
}

// Kết nối WiFi với thử lại
bool connectWiFi() {
  int retry_count = 0;
  
  WiFi.begin(wifi_ssid, wifi_password);
  Serial.println("Đang kết nối WiFi...");
  
  while (WiFi.status() != WL_CONNECTED && retry_count < MAX_CONNECT_RETRY) {
    delay(500);
    Serial.print(".");
    retry_count++;
    
    if (retry_count >= 10) { // Sau 5 giây, thử kết nối lại
      WiFi.disconnect();
      delay(1000);
      WiFi.begin(wifi_ssid, wifi_password);
      retry_count = 0;
    }
  }
  
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Kết nối WiFi thất bại sau nhiều lần thử lại");
    return false;
  }
  
  Serial.println("");
  Serial.println("WiFi đã kết nối!");
  Serial.print("Địa chỉ IP: ");
  Serial.println(WiFi.localIP());
  return true;
}

// Chụp ảnh và gửi lên server
bool captureAndSendImage() {
  takingPicture = true;
  
  // Bật flash nếu cần thiết (trong điều kiện ánh sáng yếu)
  int lightLevel = readLightLevel();
  bool lowLight = lightLevel < MIN_LIGHT_THRESHOLD / 2;
  
  if (lowLight) {
    setLed(true);
    delay(200); // Chờ một chút để ánh sáng ổn định
  }
  
  // Khởi tạo camera
  if (!initCamera()) {
    if (lowLight) setLed(false);
    takingPicture = false;
    return false;
  }
  
  // Chụp ảnh
  camera_fb_t * fb = NULL;
  fb = esp_camera_fb_get();
  
  // Tắt flash sau khi chụp
  if (lowLight) setLed(false);
  
  if (!fb) {
    Serial.println("Chụp ảnh thất bại");
    takingPicture = false;
    return false;
  }
  
  Serial.println("Đã chụp ảnh thành công:");
  Serial.printf("- Kích thước: %d bytes\n", fb->len);
  Serial.printf("- Độ phân giải: %dx%d\n", fb->width, fb->height);
  
  // Gửi ảnh lên server
  bool success = uploadImage(fb, lightLevel);
  
  // Giải phóng buffer
  esp_camera_fb_return(fb);
  
  takingPicture = false;
  return success;
}

// Upload ảnh lên server
bool uploadImage(camera_fb_t *fb, int lightLevel) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Không có kết nối WiFi, đang kết nối lại...");
    if (!connectWiFi()) {
      return false;
    }
  }
  
  // Xây dựng URL đầy đủ
  String url = String(server_url) + String(garden_id) + "/images";
  Serial.println("Đang tải ảnh lên: " + url);
  
  HTTPClient http;
  http.begin(url);
  
  // Thêm headers
  http.addHeader("Content-Type", "image/jpeg");
  http.addHeader("X-Device-Serial", device_serial);
  http.addHeader("X-Light-Level", String(lightLevel));
  if (battery_level >= 0) {
    http.addHeader("X-Battery-Level", String(battery_level));
  }
  
  // Gửi request
  int httpCode = http.POST(fb->buf, fb->len);
  
  // Kiểm tra kết quả
  if (httpCode == 201 || httpCode == 200) {
    String payload = http.getString();
    Serial.println("Tải lên thành công!");
    Serial.println("Phản hồi: " + payload);
    http.end();
    return true;
  } else {
    Serial.print("Tải lên thất bại, mã lỗi HTTP: ");
    Serial.println(httpCode);
    if (httpCode > 0) {
      Serial.println("Phản hồi: " + http.getString());
    }
    http.end();
    
    // Thử lại
    upload_retry_count++;
    if (upload_retry_count < MAX_UPLOAD_RETRY) {
      Serial.printf("Đang thử lại (%d/%d)...\n", upload_retry_count, MAX_UPLOAD_RETRY);
      delay(2000);
      return uploadImage(fb, lightLevel);
    } else {
      Serial.println("Đã vượt quá số lần thử lại tối đa");
      return false;
    }
  }
}

// Kiểm tra thời gian để quyết định chụp ảnh
bool isGoodTimeToCapture() {
  // Đồng bộ hóa thời gian
  configTime(GMT_OFFSET_SEC, 0, "pool.ntp.org", "time.nist.gov");
  
  // Lấy thời gian hiện tại
  struct tm timeinfo;
  if(!getLocalTime(&timeinfo)) {
    Serial.println("Không thể lấy thời gian");
    return false; // Nếu không lấy được thời gian, giả định là thời điểm tốt
  }
  
  // Debug thông tin thời gian
  Serial.print("Thời gian hiện tại: ");
  Serial.print(timeinfo.tm_hour);
  Serial.print(":");
  Serial.print(timeinfo.tm_min);
  Serial.print(":");
  Serial.println(timeinfo.tm_sec);
  
  // Chỉ chụp ảnh từ 8h sáng đến 18h chiều
  if (timeinfo.tm_hour >= 8 && timeinfo.tm_hour < 18) {
    return true;
  }
  
  Serial.println("Không phải thời gian chụp ảnh (chỉ chụp từ 8h-18h)");
  return false;
}

// Lưu cấu hình vào EEPROM
void saveConfig() {
  EEPROM.begin(EEPROM_SIZE);
  
  int addr = 0;
  EEPROM.put(addr, wifi_ssid);
  addr += sizeof(wifi_ssid);
  
  EEPROM.put(addr, wifi_password);
  addr += sizeof(wifi_password);
  
  EEPROM.put(addr, server_url);
  addr += sizeof(server_url);
  
  EEPROM.put(addr, garden_id);
  addr += sizeof(garden_id);
  
  EEPROM.put(addr, device_serial);
  addr += sizeof(device_serial);
  
  EEPROM.commit();
  EEPROM.end();
  
  Serial.println("Đã lưu cấu hình vào EEPROM");
}

// Tải cấu hình từ EEPROM
bool loadConfig() {
  EEPROM.begin(EEPROM_SIZE);
  
  int addr = 0;
  EEPROM.get(addr, wifi_ssid);
  addr += sizeof(wifi_ssid);
  
  EEPROM.get(addr, wifi_password);
  addr += sizeof(wifi_password);
  
  EEPROM.get(addr, server_url);
  addr += sizeof(server_url);
  
  EEPROM.get(addr, garden_id);
  addr += sizeof(garden_id);
  
  EEPROM.get(addr, device_serial);
  addr += sizeof(device_serial);
  
  EEPROM.end();
  
  // Kiểm tra xem cấu hình có hợp lệ không
  if (strlen(wifi_ssid) > 0 && strlen(wifi_password) > 0 && 
      strlen(server_url) > 0 && strlen(garden_id) > 0) {
    Serial.println("Đã tải cấu hình từ EEPROM:");
    Serial.println("- WiFi SSID: " + String(wifi_ssid));
    Serial.println("- Server URL: " + String(server_url));
    Serial.println("- Garden ID: " + String(garden_id));
    Serial.println("- Device Serial: " + String(device_serial));
    return true;
  }
  
  Serial.println("Không tìm thấy cấu hình hợp lệ trong EEPROM");
  return false;
}

void setup() {
  Serial.begin(115200);
  Serial.setDebugOutput(true);
  Serial.println();
  
  boot_count++;
  Serial.printf("Boot count: %d\n", boot_count);
  
  // Tải cấu hình từ EEPROM
  if (!loadConfig()) {
    // Nếu không có cấu hình, sử dụng giá trị mặc định và lưu lại
    saveConfig();
  }
  
  // Đọc mức ánh sáng
  int lightLevel = readLightLevel();
  Serial.printf("Mức ánh sáng: %d\n", lightLevel);
  
  // Kiểm tra điều kiện chụp ảnh
  bool shouldCapture = false;
  
  // Nếu có yêu cầu chụp cụ thể từ lần khởi động trước
  if (capture_requested) {
    Serial.println("Có yêu cầu chụp ảnh từ trước");
    shouldCapture = true;
    capture_requested = false; // Đặt lại cờ
  } 
  // Hoặc nếu đủ ánh sáng và thời gian phù hợp
  else if (lightLevel >= MIN_LIGHT_THRESHOLD && isGoodTimeToCapture()) {
    Serial.println("Đủ ánh sáng và thời gian phù hợp để chụp ảnh");
    shouldCapture = true;
  }
  
  if (shouldCapture) {
    // Kết nối WiFi
    if (connectWiFi()) {
      // Chụp và gửi ảnh
      if (captureAndSendImage()) {
        Serial.println("Chụp và tải ảnh thành công");
      } else {
        Serial.println("Lỗi khi chụp hoặc tải ảnh");
      }
    } else {
      Serial.println("Không thể kết nối WiFi");
    }
  } else {
    Serial.println("Không đủ điều kiện để chụp ảnh");
  }
  
  // Ngắt kết nối WiFi để tiết kiệm điện
  WiFi.disconnect(true);
  WiFi.mode(WIFI_OFF);
  
  // Vào chế độ ngủ sâu
  Serial.printf("Đi vào chế độ deep sleep trong %d phút\n", SLEEP_MINUTES);
  esp_sleep_enable_timer_wakeup(SLEEP_MINUTES * uS_TO_MIN_FACTOR);
  
  // Tắt các GPIO để tiết kiệm điện
  rtc_gpio_isolate(GPIO_NUM_12);
  
  // Bắt đầu ngủ
  esp_deep_sleep_start();
}

void loop() {
  // Loop không được sử dụng khi dùng deep sleep
} 