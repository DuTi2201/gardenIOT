const mqtt = require('mqtt');
const Garden = require('../models/Garden');
const SensorData = require('../models/SensorData');
const DeviceHistory = require('../models/DeviceHistory');
const logger = require('../utils/logger');
const { createMqttClient } = require('../config/mqtt');

// Khởi tạo MQTT client
let client;

// Khởi động dịch vụ MQTT
const startMqttService = (io) => {
  // Tạo MQTT client
  client = createMqttClient();
  console.log(`MQTT Debug: Đang kết nối đến broker: ${process.env.MQTT_URI}`);

  // Xử lý kết nối
  client.on('connect', () => {
    logger.info('Kết nối thành công đến MQTT broker');
    console.log("MQTT Debug: Kết nối thành công! Đang đăng ký các topic:");
    
    // Đăng ký kênh nhận dữ liệu từ tất cả các vườn
    client.subscribe('garden/+/data');
    console.log("MQTT Debug: Đã đăng ký topic garden/+/data");
    
    client.subscribe('garden/+/status');
    console.log("MQTT Debug: Đã đăng ký topic garden/+/status");
    
    // Đăng ký kênh đồng bộ thiết bị
    client.subscribe('garden/+/sync');
    console.log("MQTT Debug: Đã đăng ký topic garden/+/sync");
    
    // Đăng ký kênh cập nhật trạng thái thiết bị
    client.subscribe('garden/+/update');
    console.log("MQTT Debug: Đã đăng ký topic garden/+/update");
    
    logger.info('Đã đăng ký các kênh MQTT');
  });
  
  client.on('error', (error) => {
    console.log(`MQTT Debug: Lỗi kết nối: ${error.message}`);
    logger.error(`Lỗi kết nối MQTT: ${error.message}`);
  });

  // Xử lý thông điệp
  client.on('message', async (topic, message) => {
    try {
      console.log(`MQTT Debug: Nhận message từ topic: ${topic}`);
      console.log(`MQTT Debug: Nội dung: ${message.toString()}`);
      
      // Phân tích chủ đề
      const topicParts = topic.split('/');
      const deviceSerial = topicParts[1];
      const messageType = topicParts[2];
      
      console.log(`MQTT Debug: deviceSerial=${deviceSerial}, messageType=${messageType}`);
      logger.debug(`Nhận thông điệp MQTT: ${topic} - ${message.toString()}`);
      
      // Tìm vườn tương ứng
      const garden = await Garden.findOne({ device_serial: deviceSerial });
      console.log(`MQTT Debug: Tìm kiếm garden với device_serial=${deviceSerial}`);
      console.log(`MQTT Debug: Kết quả: ${garden ? 'Tìm thấy' : 'Không tìm thấy'}`);
      
      if (!garden) {
        logger.warn(`Không tìm thấy vườn với mã serial: ${deviceSerial}`);
        console.log(`MQTT Debug: KHÔNG TÌM THẤY vườn với serial=${deviceSerial}`);
        return;
      } else {
        console.log(`MQTT Debug: Garden ID: ${garden._id}, Tên: ${garden.name}`);
      }
      
      // Xử lý yêu cầu đồng bộ thiết bị
      if (messageType === 'sync') {
        try {
          // Phân tích thông điệp JSON
          const data = JSON.parse(message.toString());
          
          // Kiểm tra xem có phải là yêu cầu đồng bộ không
          if (data.sync_request) {
            console.log(`MQTT Debug: Nhận yêu cầu đồng bộ từ thiết bị ${deviceSerial}`);
            
            // Truy vấn dữ liệu cảm biến mới nhất
            const latestData = await SensorData.findOne({ garden_id: garden._id })
              .sort({ timestamp: -1 });
            
            // Tạo phản hồi đồng bộ
            const syncResponse = {
              sync_response: true,
              fan: latestData ? latestData.fan_status : false,
              light: latestData ? latestData.light_status : false,
              pump: latestData ? latestData.pump_status : false,
              auto: latestData ? latestData.auto_mode : false
            };
            
            // Chuyển đổi thành chuỗi JSON
            const responseStr = JSON.stringify(syncResponse);
            
            // Gửi phản hồi qua kênh command
            const responseTopic = `garden/${deviceSerial}/command`;
            console.log(`MQTT Debug: Gửi phản hồi đồng bộ đến ${responseTopic}`);
            console.log(`MQTT Debug: Nội dung phản hồi: ${responseStr}`);
            
            client.publish(responseTopic, responseStr);
            logger.info(`Đã gửi phản hồi đồng bộ thiết bị đến ${deviceSerial}`);
            
            return;
          }
        } catch (error) {
          console.log(`MQTT Debug: Lỗi xử lý yêu cầu đồng bộ: ${error.message}`);
          logger.error(`Lỗi xử lý yêu cầu đồng bộ: ${error.message}`);
          return;
        }
      }
      
      // Xử lý yêu cầu cập nhật trạng thái thiết bị
      if (messageType === 'update') {
        try {
          // Phân tích thông điệp JSON
          const data = JSON.parse(message.toString());
          
          // Kiểm tra xem có phải là cập nhật thiết bị không
          if (data.device_update) {
            console.log(`MQTT Debug: Nhận cập nhật trạng thái thiết bị từ ${deviceSerial}`);
            
            // Truy vấn dữ liệu cảm biến mới nhất
            let latestData = await SensorData.findOne({ garden_id: garden._id })
              .sort({ timestamp: -1 });
            
            if (!latestData) {
              // Nếu không có dữ liệu cảm biến trước đó, tạo mới
              latestData = new SensorData({
                garden_id: garden._id,
                timestamp: new Date(),
                temperature: 0,
                humidity: 0,
                light: 0,
                soil: 0
              });
            }
            
            // Cập nhật trạng thái thiết bị
            latestData.fan_status = data.fan;
            latestData.light_status = data.light;
            latestData.pump_status = data.pump;
            latestData.auto_mode = data.auto;
            
            // Lưu vào cơ sở dữ liệu
            await latestData.save();
            console.log(`MQTT Debug: Đã cập nhật trạng thái thiết bị trong cơ sở dữ liệu: 
              Fan: ${data.fan}, Light: ${data.light}, Pump: ${data.pump}, Auto: ${data.auto}`);
            
            // Cập nhật thời gian kết nối cuối
            garden.last_connected = new Date();
            await garden.save();
            
            // Gửi dữ liệu cập nhật cho socket.io
            if (io) {
              io.to(`garden_${garden._id}`).emit('device_status', {
                gardenId: garden._id,
                deviceStatus: {
                  fan: data.fan,
                  light: data.light,
                  pump: data.pump,
                  auto: data.auto
                }
              });
              console.log(`MQTT Debug: Đã gửi cập nhật đến socket.io, phòng: garden_${garden._id}`);
            }
            
            logger.info(`Đã cập nhật trạng thái thiết bị cho vườn: ${garden.name}`);
            return;
          }
        } catch (error) {
          console.log(`MQTT Debug: Lỗi xử lý cập nhật trạng thái thiết bị: ${error.message}`);
          logger.error(`Lỗi xử lý cập nhật trạng thái thiết bị: ${error.message}`);
          return;
        }
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
        logger.debug(`Đã lưu dữ liệu cảm biến cho vườn: ${garden.name}`);
        
        // Cập nhật thời gian kết nối cuối
        garden.last_connected = new Date();
        await garden.save();
        
        // Gửi dữ liệu cho socket.io để cập nhật real-time
        if (io) {
          io.to(`garden_${garden._id}`).emit('sensor_data', {
            gardenId: garden._id,
            data: sensorData
          });
        }
        
      } else if (messageType === 'status') {
        logger.info(`Trạng thái thiết bị ${deviceSerial}: ${data.status}`);
        console.log(`MQTT Debug: Nhận trạng thái kết nối từ ${deviceSerial}: ${data.status}`);
        
        // Cập nhật trạng thái kết nối
        console.log(`MQTT Debug: Cập nhật last_connected cho Garden ${garden._id}`);
        console.log(`MQTT Debug: Giá trị last_connected trước khi cập nhật:`, garden.last_connected);
        
        garden.last_connected = new Date();
        await garden.save();
        
        console.log(`MQTT Debug: Giá trị last_connected sau khi cập nhật:`, garden.last_connected);
        console.log(`MQTT Debug: Garden có đang kết nối không:`, garden.isConnected());
        
        // Thông báo trạng thái qua socket.io
        if (io) {
          console.log(`MQTT Debug: Gửi trạng thái đến socket.io, phòng: garden_${garden._id}`);
          io.to(`garden_${garden._id}`).emit('connection_status', {
            gardenId: garden._id,
            status: data.status
          });
        }
      }
    } catch (error) {
      logger.error(`Lỗi xử lý thông điệp MQTT: ${error.message}`);
    }
  });

  return client;
};

// Gửi lệnh điều khiển đến thiết bị
const sendCommand = async (gardenId, device, state, userId) => {
  try {
    if (!client || !client.connected) {
      throw new Error('MQTT client chưa kết nối');
    }
    
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

// Gửi cài đặt đến thiết bị
const sendSettings = async (gardenId, settings) => {
  try {
    if (!client || !client.connected) {
      throw new Error('MQTT client chưa kết nối');
    }
    
    const garden = await Garden.findById(gardenId);
    if (!garden) {
      throw new Error('Không tìm thấy vườn');
    }
    
    const settingsData = JSON.stringify(settings);
    
    // Gửi cài đặt qua MQTT
    const topic = `garden/${garden.device_serial}/settings`;
    client.publish(topic, settingsData);
    
    logger.info(`Đã gửi cài đặt mới cho vườn: ${garden.name}`);
    
    return true;
  } catch (error) {
    logger.error(`Lỗi gửi cài đặt: ${error.message}`);
    throw error;
  }
};

module.exports = {
  startMqttService,
  sendCommand,
  sendSettings
}; 