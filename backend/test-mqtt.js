// File test để kiểm tra kết nối MQTT
const mqtt = require('mqtt');
require('dotenv').config();

console.log('Cấu hình MQTT broker:', process.env.MQTT_URI);
const client = mqtt.connect(process.env.MQTT_URI);

client.on('connect', () => {
  console.log('Đã kết nối thành công đến MQTT broker!');
  
  client.subscribe('garden/+/data');
  client.subscribe('garden/+/status');
  
  console.log('Đã đăng ký nhận thông điệp. Đang chờ...');
});

client.on('message', (topic, message) => {
  console.log(`Nhận từ topic ${topic}:`);
  console.log(message.toString());
  
  try {
    const data = JSON.parse(message.toString());
    console.log('Dữ liệu đã phân tích:', data);
  } catch (error) {
    console.log('Không thể phân tích JSON');
  }
});

client.on('error', (error) => {
  console.error('Lỗi kết nối MQTT:', error.message);
});

// In thông tin cấu hình
console.log('--- Thông tin kết nối ---');
console.log('MQTT_URI:', process.env.MQTT_URI);
console.log('MQTT_USER:', process.env.MQTT_USER || '(không có)');
console.log('MQTT_PASS:', process.env.MQTT_PASS ? '(đã cấu hình)' : '(không có)');
console.log('------------------------');

// Giữ script chạy
console.log('Đang chờ thông điệp MQTT. Nhấn Ctrl+C để dừng.'); 