# IoT Smart Garden - Backend

Backend cho hệ thống IoT Smart Garden, cung cấp API và kết nối MQTT cho việc quản lý và giám sát vườn thông minh.

## Yêu cầu

- Node.js (v14 trở lên)
- MongoDB (v4.4 trở lên)
- MQTT Broker (Mosquitto, HiveMQ, hoặc EMQX)

## Cài đặt

1. Clone repository:
```bash
git clone <repository-url>
cd iot-garden/backend
```

2. Cài đặt các gói phụ thuộc:
```bash
npm install
```

3. Tạo file `.env` với nội dung:
```
PORT=3000
MONGO_URI=mongodb://localhost:27017/iot_garden
JWT_SECRET=your_secret_key_here
MQTT_URI=mqtt://localhost:1883
MQTT_USER=your_mqtt_username
MQTT_PASS=your_mqtt_password
NODE_ENV=development
```

4. Khởi động MongoDB:
```bash
# Trên macOS/Linux
mongod --dbpath=/path/to/data/db

# Hoặc sử dụng Docker
docker run -d -p 27017:27017 --name mongodb mongo
```

5. Khởi động MQTT Broker:
```bash
# Trên macOS/Linux
mosquitto -c /path/to/mosquitto.conf

# Hoặc sử dụng Docker
docker run -d -p 1883:1883 -p 9001:9001 --name mosquitto eclipse-mosquitto
```

## Chạy ứng dụng

### Chế độ phát triển
```bash
npm run dev
```

### Chế độ sản xuất
```bash
npm start
```

## API Endpoints

### Xác thực
- `POST /api/auth/register` - Đăng ký người dùng mới
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/profile` - Lấy thông tin người dùng
- `PUT /api/auth/profile` - Cập nhật thông tin người dùng
- `PUT /api/auth/change-password` - Đổi mật khẩu

### Quản lý vườn
- `GET /api/gardens` - Lấy danh sách vườn
- `POST /api/gardens` - Tạo vườn mới
- `GET /api/gardens/:id` - Lấy thông tin chi tiết vườn
- `PUT /api/gardens/:id` - Cập nhật thông tin vườn
- `DELETE /api/gardens/:id` - Xóa vườn
- `PUT /api/gardens/:id/settings` - Cập nhật cài đặt vườn
- `GET /api/gardens/:id/status` - Kiểm tra trạng thái kết nối

### Dữ liệu cảm biến
- `GET /api/gardens/:id/data` - Lấy dữ liệu cảm biến mới nhất
- `GET /api/gardens/:id/data/history` - Lấy lịch sử dữ liệu cảm biến

### Điều khiển thiết bị
- `GET /api/gardens/:id/devices/status` - Lấy trạng thái các thiết bị
- `GET /api/gardens/:id/devices/history` - Lấy lịch sử điều khiển thiết bị
- `POST /api/gardens/:id/devices/:device/control` - Điều khiển thiết bị

### Quản lý lịch trình
- `GET /api/gardens/:id/schedules` - Lấy danh sách lịch trình
- `POST /api/gardens/:id/schedules` - Tạo lịch trình mới
- `PUT /api/gardens/:id/schedules/:scheduleId` - Cập nhật lịch trình
- `DELETE /api/gardens/:id/schedules/:scheduleId` - Xóa lịch trình

## Kết nối MQTT

### Chủ đề MQTT
- `garden/{deviceSerial}/data` - Dữ liệu từ thiết bị gửi đến server
- `garden/{deviceSerial}/command` - Lệnh từ server gửi đến thiết bị
- `garden/{deviceSerial}/status` - Trạng thái kết nối của thiết bị
- `garden/{deviceSerial}/settings` - Cài đặt từ server gửi đến thiết bị

### Định dạng thông điệp
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
  "timestamp": 1625482365000
}
```

- Lệnh điều khiển:
```json
{
  "device": "FAN", // hoặc "LIGHT", "PUMP", "AUTO", "ALL"
  "state": true // true=BẬT, false=TẮT
}
```

## Socket.IO

### Kết nối
```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your_jwt_token'
  }
});
```

### Sự kiện
- `join_garden` - Tham gia phòng cho vườn cụ thể
- `leave_garden` - Rời phòng của vườn
- `sensor_data` - Nhận dữ liệu cảm biến mới
- `connection_status` - Nhận trạng thái kết nối
- `device_status` - Nhận trạng thái thiết bị

## Giấy phép
MIT 