const mqtt = require('mqtt');
const logger = require('../utils/logger');

// Cấu hình MQTT client
const mqttConfig = {
  uri: process.env.MQTT_URI || 'mqtt://localhost:1883',
  options: {
    username: process.env.MQTT_USER || '',
    password: process.env.MQTT_PASS || '',
    clientId: `iot_garden_server_${Math.random().toString(16).slice(2, 8)}`,
    clean: true,
    reconnectPeriod: 5000,
    connectTimeout: 30000,
  }
};

// Tạo MQTT client
const createMqttClient = () => {
  logger.info(`Đang kết nối MQTT tới: ${mqttConfig.uri}`);
  
  try {
    const client = mqtt.connect(mqttConfig.uri, mqttConfig.options);

    client.on('connect', () => {
      logger.info('Kết nối thành công đến MQTT broker');
    });

    client.on('error', (error) => {
      logger.error(`Lỗi MQTT: ${error.message}`);
    });

    client.on('reconnect', () => {
      logger.info('Đang kết nối lại MQTT...');
    });

    client.on('disconnect', () => {
      logger.info('MQTT đã ngắt kết nối');
    });

    return client;
  } catch (err) {
    logger.error(`Lỗi khi tạo kết nối MQTT: ${err.message}`);
    // Trả về một đối tượng client giả để tránh lỗi nếu MQTT không khả dụng
    return {
      on: () => {},
      publish: () => {},
      subscribe: () => {},
      connected: false
    };
  }
};

module.exports = {
  mqttConfig,
  createMqttClient
}; 