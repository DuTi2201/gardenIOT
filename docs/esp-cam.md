# Đánh giá và Kế hoạch tích hợp ESP32-Camera vào dự án GardenIOT

## I. Đánh giá tính khả thi

### Điểm mạnh của ý tưởng
- **Tăng cường dữ liệu giám sát**: Dữ liệu hình ảnh bổ sung cho dữ liệu cảm biến hiện có
- **Phân tích toàn diện hơn**: Kết hợp dữ liệu hình ảnh và dữ liệu cảm biến giúp đánh giá chính xác hơn
- **Tự động hóa cao**: Chụp ảnh tự động và phân tích không cần can thiệp của người dùng
- **Cơ sở dữ liệu phù hợp**: Dự án tham khảo ML-Plant Disease Detection cung cấp mô hình tốt cho cây cà chua

### Thách thức cần giải quyết
- **Lưu trữ dữ liệu**: Ảnh sẽ chiếm nhiều dung lượng trong database, cần có chiến lược lưu trữ hiệu quả
- **Xử lý ảnh**: Cần đảm bảo chất lượng ảnh từ ESP32-Camera đủ tốt cho ML phân tích
- **Tích hợp mô hình ML**: Cần điều chỉnh mô hình ML từ repo tham khảo cho phù hợp với dự án
- **Tối ưu hóa API**: Đảm bảo việc gửi và nhận dữ liệu ảnh không làm chậm hệ thống

## II. Kế hoạch tích hợp chi tiết

### A. Phần cứng (Hardware)

1. **Thiết lập ESP32-Camera**
   - Cài đặt firmware cho ESP32-Camera kết nối với WiFi
   - Lập trình ESP32 để chụp ảnh định kỳ (hàng ngày) hoặc theo yêu cầu
   - Tối ưu hóa ảnh (kích thước, độ phân giải) trước khi gửi đến server
   - Đảm bảo vị trí lắp đặt camera để có góc nhìn tốt nhất đến cây trồng

2. **Mã nguồn cho ESP32-Camera**
   ```cpp
   #include "esp_camera.h"
   #include <WiFi.h>
   #include <HTTPClient.h>
   #include "time.h"
   
   const char* ssid = "WIFI_SSID";
   const char* password = "WIFI_PASSWORD";
   const char* server_url = "http://your-server/api/garden/IMAGE_UPLOAD_ENDPOINT";
   const char* garden_id = "YOUR_GARDEN_ID";
   
   void setup() {
     Serial.begin(115200);
     
     // Kết nối WiFi
     WiFi.begin(ssid, password);
     
     // Cài đặt camera
     camera_config_t config;
     // [Cấu hình camera]
     
     // Khởi tạo camera
     esp_err_t err = esp_camera_init(&config);
     
     // Đồng bộ hóa thời gian NTP để lên lịch chụp
     configTime(0, 0, "pool.ntp.org");
   }
   
   void loop() {
     // Kiểm tra thời gian để chụp định kỳ
     // Hoặc kiểm tra yêu cầu từ server
     
     if (timeToCapture()) {
       captureAndSendImage();
     }
     
     delay(60000); // Kiểm tra mỗi phút
   }
   
   void captureAndSendImage() {
     // Chụp ảnh
     camera_fb_t * fb = esp_camera_fb_get();
     
     // Gửi ảnh đến server
     if (fb) {
       HTTPClient http;
       http.begin(server_url);
       http.addHeader("Content-Type", "image/jpeg");
       http.addHeader("X-Garden-ID", garden_id);
       
       int httpCode = http.POST(fb->buf, fb->len);
       
       http.end();
       esp_camera_fb_return(fb);
     }
   }
   ```

### B. Backend

1. **API mới cho dữ liệu hình ảnh**
   ```javascript
   // Thêm vào backend/routes/gardenRoutes.js
   router.post('/:id/images', uploadMiddleware, gardenController.uploadImage);
   router.get('/:id/images', gardenController.getImages);
   router.get('/:id/images/latest', gardenController.getLatestImage);
   ```

2. **Schema cho lưu trữ hình ảnh**
   ```javascript
   // Thêm mới backend/models/GardenImage.js
   const mongoose = require('mongoose');

   const GardenImageSchema = new mongoose.Schema({
     garden: {
       type: mongoose.Schema.Types.ObjectId,
       ref: 'Garden',
       required: true
     },
     image_url: {
       type: String,
       required: true
     },
     thumbnail_url: {
       type: String
     },
     capture_date: {
       type: Date,
       default: Date.now
     },
     analysis_results: {
       health_status: String,
       detected_issues: [String],
       confidence_score: Number,
       analysis_date: Date
     },
     metadata: {
       width: Number,
       height: Number,
       format: String
     }
   });

   module.exports = mongoose.model('GardenImage', GardenImageSchema);
   ```

3. **Controller xử lý hình ảnh**
   ```javascript
   // Thêm vào backend/controllers/gardenController.js
   const GardenImage = require('../models/GardenImage');
   const { uploadToStorage, resizeImage } = require('../services/imageService');
   const { analyzePlantHealth } = require('../services/mlService');
   
   exports.uploadImage = async (req, res) => {
     try {
       const gardenId = req.params.id;
       // Xử lý upload file
       const imageBuffer = req.file.buffer;
       
       // Tạo thumbnail
       const thumbnail = await resizeImage(imageBuffer, 300);
       
       // Upload lên storage (có thể là S3, hoặc lưu local)
       const imageUrl = await uploadToStorage(imageBuffer, `gardens/${gardenId}/images/full_${Date.now()}.jpg`);
       const thumbnailUrl = await uploadToStorage(thumbnail, `gardens/${gardenId}/images/thumb_${Date.now()}.jpg`);
       
       // Tạo bản ghi mới
       const gardenImage = new GardenImage({
         garden: gardenId,
         image_url: imageUrl,
         thumbnail_url: thumbnailUrl,
         metadata: {
           width: req.file.width,
           height: req.file.height,
           format: 'jpeg'
         }
       });
       
       await gardenImage.save();
       
       // Phân tích hình ảnh bằng ML (bất đồng bộ để không chặn phản hồi)
       analyzePlantHealth(gardenImage._id, imageBuffer);
       
       res.status(201).json({
         success: true,
         data: {
           image_id: gardenImage._id,
           thumbnail_url: thumbnailUrl
         }
       });
     } catch (error) {
       res.status(500).json({
         success: false,
         message: 'Lỗi khi tải lên hình ảnh',
         error: error.message
       });
     }
   };
   ```

4. **Dịch vụ Machine Learning**
   ```javascript
   // Tạo mới backend/services/mlService.js
   const GardenImage = require('../models/GardenImage');
   const Garden = require('../models/Garden');
   const { getGeminiAnalysis } = require('./geminiService');
   const tf = require('@tensorflow/tfjs-node');
   
   // Tải mô hình ML từ repo tham khảo
   let model;
   
   async function loadModel() {
     model = await tf.loadLayersModel('file://./ml_models/plant_disease/model.json');
     console.log('Model loaded successfully');
   }
   
   // Gọi hàm loadModel khi khởi động server
   loadModel();
   
   // Hàm tiền xử lý ảnh
   function preprocessImage(imageBuffer) {
     // Chuyển đổi buffer thành tensor
     const image = tf.node.decodeImage(imageBuffer);
     
     // Resize về kích thước mô hình yêu cầu (ví dụ 224x224)
     const resized = tf.image.resizeBilinear(image, [224, 224]);
     
     // Normalize [0,1]
     const normalized = resized.div(tf.scalar(255));
     
     // Mở rộng kích thước batch
     const batched = normalized.expandDims(0);
     
     return batched;
   }
   
   exports.analyzePlantHealth = async (imageId, imageBuffer) => {
     try {
       // Lấy thông tin hình ảnh từ database
       const gardenImage = await GardenImage.findById(imageId);
       if (!gardenImage) throw new Error('Không tìm thấy hình ảnh');
       
       // Lấy thông tin vườn
       const garden = await Garden.findById(gardenImage.garden);
       if (!garden) throw new Error('Không tìm thấy vườn');
       
       // Xử lý ảnh và dự đoán
       const processedImage = preprocessImage(imageBuffer);
       const predictions = await model.predict(processedImage);
       const results = predictions.arraySync();
       
       // Phân tích kết quả dự đoán
       const classLabels = [
         'Cà chua khỏe mạnh',
         'Cà chua bệnh đốm vi khuẩn',
         'Cà chua bệnh mốc sương',
         'Cà chua bệnh đốm lá',
         'Cà chua bệnh mốc lá'
       ];
       
       const topPredictionIndex = results[0].indexOf(Math.max(...results[0]));
       const confidence = results[0][topPredictionIndex];
       const predictedLabel = classLabels[topPredictionIndex];
       
       // Kết hợp với dữ liệu cảm biến
       const sensorData = await getSensorData(garden._id); // Hàm này cần được định nghĩa
       
       // Phân tích kết hợp với Gemini API
       const combinedAnalysis = await getGeminiAnalysis({
         plant_type: 'Cà chua',
         image_analysis: {
           predicted_health: predictedLabel,
           confidence: confidence,
         },
         sensor_data: sensorData
       });
       
       // Cập nhật kết quả phân tích vào database
       gardenImage.analysis_results = {
         health_status: predictedLabel,
         detected_issues: combinedAnalysis.detected_issues || [],
         confidence_score: confidence,
         analysis_date: new Date()
       };
       
       await gardenImage.save();
       
       // Tạo báo cáo phân tích mới
       await createAnalysisReport(garden._id, {
         image_analysis: gardenImage.analysis_results,
         sensor_analysis: combinedAnalysis.sensor_analysis,
         recommendations: combinedAnalysis.recommendations
       });
       
     } catch (error) {
       console.error('Lỗi khi phân tích hình ảnh:', error);
     }
   };
   ```

### C. Frontend

1. **Thêm tab hình ảnh trong trang chi tiết vườn**
   ```javascript
   // Sửa đổi frontend/src/pages/GardenDetail.js
   // Thêm tab và component hiển thị hình ảnh

   // Tab cho Image Gallery
   <Tab label="Hình ảnh" id="garden-tab-4" />
   
   // Content cho tab
   <TabPanel value={tabValue} index={4}>
     <GardenImageGallery gardenId={id} />
   </TabPanel>
   ```

2. **Tạo component Gallery hình ảnh**
   ```jsx
   // Tạo mới frontend/src/components/garden/GardenImageGallery.js
   import React, { useState, useEffect, useCallback } from 'react';
   import { 
     Box, Grid, Card, CardMedia, CardContent, 
     Typography, Button, CircularProgress, 
     Dialog, DialogContent, IconButton
   } from '@mui/material';
   import { Close as CloseIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
   import { getGardenImages, requestManualCapture } from '../../services/gardenService';
   import { formatDate } from '../../utils/formatters';
   
   const GardenImageGallery = ({ gardenId }) => {
     const [images, setImages] = useState([]);
     const [loading, setLoading] = useState(true);
     const [selectedImage, setSelectedImage] = useState(null);
     const [dialogOpen, setDialogOpen] = useState(false);
     const [capturingImage, setCapturingImage] = useState(false);
     
     // Lấy danh sách hình ảnh
     const fetchImages = useCallback(async () => {
       try {
         setLoading(true);
         const response = await getGardenImages(gardenId);
         if (response.success) {
           setImages(response.data.images);
         }
       } catch (error) {
         console.error('Lỗi khi tải hình ảnh:', error);
       } finally {
         setLoading(false);
       }
     }, [gardenId]);
     
     // Yêu cầu chụp ảnh thủ công
     const handleCaptureRequest = async () => {
       try {
         setCapturingImage(true);
         const response = await requestManualCapture(gardenId);
         if (response.success) {
           fetchImages(); // Làm mới danh sách
         }
       } catch (error) {
         console.error('Lỗi khi yêu cầu chụp ảnh:', error);
       } finally {
         setCapturingImage(false);
       }
     };
     
     useEffect(() => {
       fetchImages();
     }, [fetchImages]);
     
     // Mở dialog hiển thị hình ảnh chi tiết
     const handleImageClick = (image) => {
       setSelectedImage(image);
       setDialogOpen(true);
     };
     
     return (
       <Box>
         <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
           <Typography variant="h6">Hình ảnh cây trồng</Typography>
           <Button
             variant="contained"
             onClick={handleCaptureRequest}
             disabled={capturingImage}
           >
             {capturingImage ? 'Đang chụp...' : 'Chụp ảnh ngay'}
           </Button>
         </Box>
         
         {loading ? (
           <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
             <CircularProgress />
           </Box>
         ) : images.length === 0 ? (
           <Typography color="text.secondary" sx={{ textAlign: 'center', my: 4 }}>
             Chưa có hình ảnh nào. Nhấn nút "Chụp ảnh ngay" để bắt đầu.
           </Typography>
         ) : (
           <Grid container spacing={2}>
             {images.map((image) => (
               <Grid item xs={12} sm={6} md={4} key={image._id}>
                 <Card>
                   <CardMedia
                     component="img"
                     height="180"
                     image={image.thumbnail_url}
                     alt={`Ảnh cây trồng ${formatDate(image.capture_date)}`}
                     sx={{ cursor: 'pointer' }}
                     onClick={() => handleImageClick(image)}
                   />
                   <CardContent>
                     <Typography variant="body2" color="text.secondary">
                       {formatDate(image.capture_date)}
                     </Typography>
                     {image.analysis_results && (
                       <Typography 
                         variant="body2" 
                         color={
                           image.analysis_results.health_status.includes('khỏe mạnh') 
                             ? 'success.main' 
                             : 'error.main'
                         }
                       >
                         {image.analysis_results.health_status}
                       </Typography>
                     )}
                   </CardContent>
                 </Card>
               </Grid>
             ))}
           </Grid>
         )}
         
         {/* Dialog hiển thị hình ảnh chi tiết */}
         <Dialog
           open={dialogOpen}
           onClose={() => setDialogOpen(false)}
           maxWidth="lg"
           fullWidth
         >
           <DialogContent>
             <IconButton
               onClick={() => setDialogOpen(false)}
               sx={{ position: 'absolute', right: 8, top: 8 }}
             >
               <CloseIcon />
             </IconButton>
             
             {selectedImage && (
               <Box>
                 <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                   <img
                     src={selectedImage.image_url}
                     alt="Chi tiết cây trồng"
                     style={{ maxWidth: '100%', maxHeight: '70vh' }}
                   />
                 </Box>
                 
                 {selectedImage.analysis_results && (
                   <Box sx={{ mt: 2 }}>
                     <Typography variant="h6">
                       Kết quả phân tích
                     </Typography>
                     <Typography variant="body1">
                       Tình trạng: {selectedImage.analysis_results.health_status}
                     </Typography>
                     <Typography variant="body2">
                       Độ tin cậy: {Math.round(selectedImage.analysis_results.confidence_score * 100)}%
                     </Typography>
                     
                     {selectedImage.analysis_results.detected_issues.length > 0 && (
                       <>
                         <Typography variant="subtitle1" sx={{ mt: 1 }}>
                           Vấn đề phát hiện:
                         </Typography>
                         <ul>
                           {selectedImage.analysis_results.detected_issues.map((issue, idx) => (
                             <li key={idx}>{issue}</li>
                           ))}
                         </ul>
                       </>
                     )}
                     
                     <Typography variant="caption" color="text.secondary">
                       Phân tích lúc: {formatDate(selectedImage.analysis_results.analysis_date)}
                     </Typography>
                   </Box>
                 )}
               </Box>
             )}
           </DialogContent>
         </Dialog>
       </Box>
     );
   };
   
   export default GardenImageGallery;
   ```

3. **Thêm dịch vụ API cho hình ảnh**
   ```javascript
   // Thêm vào frontend/src/services/gardenService.js
   
   // Lấy danh sách hình ảnh vườn
   export const getGardenImages = async (gardenId) => {
     try {
       const response = await axios.get(`/gardens/${gardenId}/images`);
       return response.data;
     } catch (error) {
       console.error('Error fetching garden images:', error);
       throw error.response?.data || { message: 'Lỗi khi tải hình ảnh vườn' };
     }
   };
   
   // Yêu cầu ESP32 chụp ảnh ngay lập tức
   export const requestManualCapture = async (gardenId) => {
     try {
       const response = await axios.post(`/gardens/${gardenId}/images/capture`);
       return response.data;
     } catch (error) {
       console.error('Error requesting image capture:', error);
       throw error.response?.data || { message: 'Lỗi khi yêu cầu chụp ảnh' };
     }
   };
   ```

4. **Tích hợp kết quả phân tích hình ảnh vào GardenAnalysis**
   ```javascript
   // Sửa đổi frontend/src/pages/GardenAnalysis.js
   // Thêm phần hiển thị kết quả phân tích hình ảnh
   
   // Trong component ReportDetail, thêm:
   
   {/* Phân tích hình ảnh */}
   {report.image_analysis && (
     <Card sx={{ mb: 4 }}>
       <CardContent>
         <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
           <CameraIcon color="primary" sx={{ mr: 1 }} />
           <Typography variant="h6">Phân tích hình ảnh cây trồng</Typography>
         </Box>
         
         <Grid container spacing={2}>
           <Grid item xs={12} md={4}>
             {report.image_analysis.image_url ? (
               <img 
                 src={report.image_analysis.image_url} 
                 alt="Ảnh cây trồng"
                 style={{ width: '100%', borderRadius: '8px' }}
               />
             ) : (
               <Box sx={{ 
                 bgcolor: 'action.disabledBackground', 
                 height: 200, 
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center'
               }}>
                 <Typography color="text.secondary">
                   Không có hình ảnh
                 </Typography>
               </Box>
             )}
           </Grid>
           
           <Grid item xs={12} md={8}>
             <Typography variant="subtitle1" gutterBottom>
               Kết quả phân tích
             </Typography>
             
             <Typography variant="body1" gutterBottom>
               Tình trạng: 
               <Chip 
                 label={report.image_analysis.health_status}
                 color={report.image_analysis.health_status.includes('khỏe mạnh') ? 'success' : 'error'}
                 size="small"
                 sx={{ ml: 1 }}
               />
             </Typography>
             
             {report.image_analysis.detected_issues && report.image_analysis.detected_issues.length > 0 && (
               <>
                 <Typography variant="body2" gutterBottom sx={{ mt: 1 }}>
                   Vấn đề phát hiện:
                 </Typography>
                 <List dense>
                   {report.image_analysis.detected_issues.map((issue, index) => (
                     <ListItem key={index}>
                       <ListItemIcon sx={{ minWidth: 30 }}>
                         <WarningIcon color="warning" fontSize="small" />
                       </ListItemIcon>
                       <ListItemText primary={issue} />
                     </ListItem>
                   ))}
                 </List>
               </>
             )}
           </Grid>
         </Grid>
       </CardContent>
     </Card>
   )}
   ```

### D. Cập nhật API cho phân tích dữ liệu

1. **Thêm dữ liệu hình ảnh vào yêu cầu phân tích**
   ```javascript
   // Sửa đổi backend/services/analysisService.js
   
   exports.requestAnalysis = async (gardenId, options) => {
     try {
       // Lấy dữ liệu sensor từ khoảng thời gian được chỉ định
       const sensorData = await getSensorDataByPeriod(gardenId, options.duration);
       
       // Lấy hình ảnh gần nhất
       const latestImage = await GardenImage.findOne({ garden: gardenId })
         .sort({ capture_date: -1 })
         .limit(1);
       
       // Kết hợp dữ liệu
       const analysisData = {
         garden_id: gardenId,
         duration: options.duration,
         timestamp: new Date(),
         sensor_data: sensorData,
         image_data: latestImage ? {
           image_id: latestImage._id,
           image_url: latestImage.image_url,
           analysis_results: latestImage.analysis_results || null
         } : null
       };
       
       // Gửi đến Gemini API để phân tích
       const geminiResponse = await getGeminiAnalysis(analysisData);
       
       // Tạo báo cáo phân tích
       const report = new Report({
         garden: gardenId,
         data_period: options.duration,
         analysis_summary: geminiResponse.summary,
         environmental_conditions: geminiResponse.environmental_conditions,
         recommendations: geminiResponse.recommendations,
         image_analysis: latestImage ? {
           image_id: latestImage._id,
           image_url: latestImage.image_url,
           health_status: latestImage.analysis_results?.health_status || 'Chưa phân tích',
           detected_issues: latestImage.analysis_results?.detected_issues || []
         } : null
       });
       
       await report.save();
       
       return {
         success: true,
         report_id: report._id
       };
     } catch (error) {
       console.error('Error in analysis request:', error);
       throw error;
     }
   };
   ```

2. **Cập nhật dịch vụ Gemini API để phân tích hình ảnh**
   ```javascript
   // Sửa đổi backend/services/geminiService.js
   
   exports.getGeminiAnalysis = async (data) => {
     try {
       // Chuẩn bị prompt với dữ liệu cảm biến
       let prompt = `Tôi sẽ cung cấp dữ liệu về vườn cà chua từ các cảm biến và hình ảnh. 
       Hãy phân tích và đề xuất cách chăm sóc phù hợp:
       
       Dữ liệu cảm biến (${data.duration}):
       - Nhiệt độ trung bình: ${data.sensor_data.avg_temperature}°C
       - Độ ẩm không khí trung bình: ${data.sensor_data.avg_humidity}%
       - Độ ẩm đất trung bình: ${data.sensor_data.avg_soil_moisture}%
       - Cường độ ánh sáng trung bình: ${data.sensor_data.avg_light} lux`;
       
       // Thêm dữ liệu phân tích hình ảnh nếu có
       if (data.image_data && data.image_data.analysis_results) {
         prompt += `\n\nPhân tích hình ảnh cây trồng:
         - Tình trạng: ${data.image_data.analysis_results.health_status}
         - Độ tin cậy: ${Math.round(data.image_data.analysis_results.confidence_score * 100)}%`;
         
         if (data.image_data.analysis_results.detected_issues && 
             data.image_data.analysis_results.detected_issues.length > 0) {
           prompt += `\n- Vấn đề phát hiện: ${data.image_data.analysis_results.detected_issues.join(', ')}`;
         }
       }
       
       prompt += `\n\nDựa trên dữ liệu trên, hãy phân tích và đề xuất:
       1. Tóm tắt ngắn gọn tình trạng của vườn cà chua
       2. Đánh giá chi tiết về từng điều kiện môi trường (nhiệt độ, độ ẩm không khí, độ ẩm đất, ánh sáng)
       3. Nếu phát hiện vấn đề từ hình ảnh, hãy giải thích và cung cấp hướng dẫn điều trị
       4. Đề xuất cài đặt cho thiết bị: quạt, đèn, máy bơm
       5. Dự đoán năng suất và sức khỏe cây trồng trong tương lai gần`;
       
       // Gọi Gemini API
       const result = await callGeminiAPI(prompt);
       
       // Xử lý và cấu trúc kết quả theo yêu cầu của ứng dụng
       return processGeminiResponse(result);
     } catch (error) {
       console.error('Error in Gemini analysis:', error);
       throw error;
     }
   };
   ```

## III. Kế hoạch triển khai theo các giai đoạn

### Giai đoạn 1: Thiết lập cơ sở hạ tầng (Tuần 1-2)
1. Chuẩn bị ESP32-Camera và cài đặt firmware
2. Tạo các schema và endpoint API mới cho dữ liệu hình ảnh
3. Cài đặt hệ thống lưu trữ hình ảnh (MongoDB hoặc cloud storage)

### Giai đoạn 2: Tích hợp ML và xử lý hình ảnh (Tuần 3-4)
1. Cài đặt và điều chỉnh mô hình phát hiện bệnh từ repo tham khảo
2. Phát triển dịch vụ xử lý hình ảnh và phân tích ML
3. Tích hợp với Gemini API để phân tích kết hợp

### Giai đoạn 3: Phát triển frontend (Tuần 5-6)
1. Tạo giao diện hiển thị hình ảnh và lịch sử chụp
2. Cập nhật module phân tích để hiển thị kết quả phân tích hình ảnh
3. Tạo các controls cho chụp ảnh thủ công và xem chi tiết

### Giai đoạn 4: Kiểm thử và tối ưu hóa (Tuần 7-8)
1. Kiểm thử tích hợp toàn diện giữa ESP32-Camera, Backend và Frontend
2. Tối ưu hóa hiệu suất và tài nguyên (lưu trữ hình ảnh, xử lý ML)
3. Cải thiện chất lượng dự đoán và đề xuất

## IV. Đề xuất bổ sung

### Tối ưu hóa lưu trữ
- Sử dụng AWS S3 hoặc Firebase Storage thay vì lưu trực tiếp vào MongoDB
- Tự động xóa hình ảnh cũ sau một khoảng thời gian cài đặt (ví dụ: lưu trữ 30 ngày)

### Nâng cao chức năng
- Thêm chế độ theo dõi trực tiếp (streaming) khi cần theo dõi ngay lập tức
- Phát triển tính năng time-lapse để theo dõi sự phát triển của cây trồng theo thời gian
- Thêm khả năng so sánh ảnh trước/sau để thấy rõ sự thay đổi

### Cải thiện ML
- Fine-tune mô hình với dữ liệu cụ thể về cây cà chua trong môi trường của bạn
- Thêm phát hiện giai đoạn phát triển của cây (nảy mầm, ra hoa, kết quả)
- Đánh giá năng suất dựa trên số lượng và kích thước quả

Dự án này hoàn toàn khả thi và sẽ tạo ra một hệ thống thông minh toàn diện để theo dõi và chăm sóc cây cà chua. Việc tích hợp ESP32-Camera, ML, và Gemini API sẽ mang lại giá trị đáng kể cho người dùng thông qua việc giám sát và phân tích tự động.
