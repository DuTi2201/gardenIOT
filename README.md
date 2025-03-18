# Garden IoT - Hệ thống Vườn Thông Minh

Hệ thống quản lý vườn thông minh sử dụng IoT, giúp theo dõi và điều khiển các thông số môi trường như nhiệt độ, độ ẩm, ánh sáng và độ ẩm đất.

## Tính năng

- **Bảng điều khiển**: Hiển thị tổng quan về tất cả các vườn và thông số quan trọng
- **Quản lý vườn**: Thêm, xem và quản lý các vườn
- **Điều khiển thiết bị**: Điều khiển các thiết bị như quạt, đèn, máy bơm
- **Theo dõi dữ liệu**: Xem biểu đồ và lịch sử dữ liệu cảm biến
- **Thông báo**: Nhận thông báo khi có bất thường
- **Chế độ tự động**: Tự động điều khiển thiết bị dựa trên thông số môi trường

## Cấu trúc dự án

Dự án được chia thành ba phần chính:

### 1. Frontend

- Xây dựng bằng React.js
- Giao diện người dùng thân thiện và đáp ứng
- Biểu đồ trực quan hóa dữ liệu

### 2. Backend

- Xây dựng bằng Node.js và Express
- API RESTful
- Xác thực và phân quyền người dùng
- Xử lý và lưu trữ dữ liệu

### 3. Arduino

- Mã nguồn cho thiết bị IoT
- Kết nối với các cảm biến và thiết bị điều khiển
- Giao tiếp với backend thông qua MQTT

## Cài đặt và chạy

### Frontend

```bash
cd frontend
npm install
npm start
```

### Backend

```bash
cd backend
npm install
npm start
```

### Arduino

Tải mã nguồn trong thư mục `arduino` lên thiết bị Arduino của bạn.

## Công nghệ sử dụng

- **Frontend**: React.js, Material-UI, Chart.js
- **Backend**: Node.js, Express, MongoDB, MQTT
- **IoT**: Arduino, ESP8266/ESP32, Cảm biến DHT22, Cảm biến độ ẩm đất, Cảm biến ánh sáng

## Tác giả

- Phạm Đức Thịnh
- Vũ Văn Dương 