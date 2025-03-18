import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Box, Grid, Card, CardMedia, CardContent, 
  Typography, Button, CircularProgress, 
  Dialog, DialogContent, IconButton,
  Tabs, Tab, useMediaQuery, useTheme,
  LinearProgress, Chip, Tooltip
} from '@mui/material';
import { 
  Close as CloseIcon, 
  Camera as CameraIcon,
  Timelapse as TimelapseIcon,
  CompareArrows as CompareIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  BrightnessMedium as LightIcon,
  Battery50 as BatteryIcon
} from '@mui/icons-material';
import axios from 'axios';
import { formatDate } from '../../utils/formatters';

// Hàm gọi API lấy danh sách hình ảnh
const getGardenImages = async (gardenId, page = 1, limit = 10) => {
  try {
    const response = await axios.get(`/api/gardens/${gardenId}/images?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi tải hình ảnh:', error);
    throw error;
  }
};

// Hàm gọi API lấy hình ảnh mới nhất
const getLatestImage = async (gardenId) => {
  try {
    const response = await axios.get(`/api/gardens/${gardenId}/images/latest`);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi tải hình ảnh mới nhất:', error);
    throw error;
  }
};

// Hàm gọi API yêu cầu chụp ảnh
const requestCaptureImage = async (gardenId) => {
  try {
    const response = await axios.post(`/api/gardens/${gardenId}/images/capture`);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi yêu cầu chụp ảnh:', error);
    throw error;
  }
};

const GardenImageGallery = ({ gardenId }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [capturingImage, setCapturingImage] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusMessage, setStatusMessage] = useState('');

  // Phân loại hình ảnh
  const categorizedImages = useMemo(() => {
    return {
      all: images,
      healthy: images.filter(img => 
        img.analysis_results?.health_status?.includes('khỏe mạnh')
      ),
      issues: images.filter(img => 
        img.analysis_results?.health_status && 
        !img.analysis_results.health_status.includes('khỏe mạnh')
      ),
      unanalyzed: images.filter(img => !img.analysis_results)
    };
  }, [images]);

  // Mảng danh sách hình ảnh theo tab đang chọn
  const displayedImages = useMemo(() => {
    switch (tabValue) {
      case 0: return categorizedImages.all;
      case 1: return categorizedImages.healthy;
      case 2: return categorizedImages.issues;
      case 3: return categorizedImages.unanalyzed;
      default: return categorizedImages.all;
    }
  }, [tabValue, categorizedImages]);

  // Tải danh sách hình ảnh
  const fetchImages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getGardenImages(gardenId, page, 9);
      
      if (response.success) {
        setImages(response.data.images);
        setTotalPages(response.data.pagination.pages);
      } else {
        setStatusMessage('Không thể tải hình ảnh');
      }
    } catch (error) {
      setStatusMessage('Lỗi khi tải hình ảnh');
    } finally {
      setLoading(false);
    }
  }, [gardenId, page]);

  // Tải hình ảnh mới nhất
  const fetchLatestImage = useCallback(async () => {
    try {
      const response = await getLatestImage(gardenId);
      
      if (response.success && response.data.image) {
        // Kiểm tra xem hình ảnh đã có trong danh sách chưa
        const exists = images.some(img => img._id === response.data.image._id);
        
        if (!exists) {
          setImages(prevImages => [response.data.image, ...prevImages]);
        }
      }
    } catch (error) {
      console.error('Lỗi khi tải hình ảnh mới nhất:', error);
    }
  }, [gardenId, images]);

  // Yêu cầu chụp ảnh mới
  const handleCaptureRequest = useCallback(async () => {
    try {
      setCapturingImage(true);
      setStatusMessage('Đang gửi yêu cầu chụp ảnh...');
      
      const response = await requestCaptureImage(gardenId);
      
      if (response.success) {
        setStatusMessage('Đã gửi yêu cầu chụp ảnh thành công! Hình ảnh sẽ được tải lên trong vài phút.');
        
        // Kiểm tra hình ảnh mới sau 15 giây
        setTimeout(() => {
          fetchLatestImage();
          setStatusMessage('');
        }, 15000);
      } else {
        setStatusMessage('Không thể gửi yêu cầu chụp ảnh');
      }
    } catch (error) {
      setStatusMessage('Lỗi khi yêu cầu chụp ảnh');
    } finally {
      setCapturingImage(false);
    }
  }, [gardenId, fetchLatestImage]);

  // Thay đổi trang
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  // Thay đổi tab
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Mở dialog xem chi tiết
  const handleImageClick = (image) => {
    setSelectedImage(image);
    setDialogOpen(true);
  };

  // Tải ảnh khi component mount hoặc khi page thay đổi
  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  // Tải xuống hình ảnh
  const handleDownload = (image) => {
    const link = document.createElement('a');
    link.href = image.image_url || image.webp_url || image.thumbnail_url;
    link.download = `garden-${gardenId}-${new Date(image.capture_date).toISOString().split('T')[0]}.jpg`;
    link.click();
  };

  // Chia sẻ hình ảnh nếu trình duyệt hỗ trợ
  const handleShare = async (image) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Ảnh cây trồng',
          text: `Ảnh cây trồng chụp lúc ${formatDate(image.capture_date)}`,
          url: image.image_url || image.webp_url || image.thumbnail_url
        });
      } catch (error) {
        console.error('Lỗi khi chia sẻ:', error);
      }
    } else {
      // Fallback khi trình duyệt không hỗ trợ Web Share API
      const url = image.image_url || image.webp_url || image.thumbnail_url;
      navigator.clipboard.writeText(url);
      setStatusMessage('Đã sao chép URL hình ảnh vào clipboard');
      setTimeout(() => setStatusMessage(''), 2000);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Tiêu đề và nút chức năng */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        flexWrap: 'wrap',
        alignItems: 'center', 
        mb: 3 
      }}>
        <Typography variant="h6">Hình ảnh cây trồng</Typography>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {images.length >= 2 && (
            <>
              <Button
                variant="outlined"
                startIcon={<TimelapseIcon />}
                size={isMobile ? 'small' : 'medium'}
                disabled={loading || images.length < 2}
              >
                Timelapse
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<CompareIcon />}
                size={isMobile ? 'small' : 'medium'}
                disabled={loading || images.length < 2}
              >
                So sánh
              </Button>
            </>
          )}
          
          <Button
            variant="contained"
            startIcon={capturingImage ? <CircularProgress size={20} color="inherit" /> : <CameraIcon />}
            onClick={handleCaptureRequest}
            disabled={capturingImage}
            size={isMobile ? 'small' : 'medium'}
          >
            {capturingImage ? 'Đang gửi...' : 'Chụp ảnh'}
          </Button>
        </Box>
      </Box>
      
      {/* Thông báo trạng thái */}
      {statusMessage && (
        <Box sx={{ mb: 2, p: 1, bgcolor: 'primary.light', color: 'primary.contrastText', borderRadius: 1 }}>
          <Typography variant="body2">{statusMessage}</Typography>
        </Box>
      )}
      
      {/* Tabs phân loại */}
      <Tabs 
        value={tabValue} 
        onChange={handleTabChange} 
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2 }}
      >
        <Tab label={`Tất cả (${categorizedImages.all.length})`} />
        <Tab 
          label={`Khỏe mạnh (${categorizedImages.healthy.length})`} 
          sx={{ color: categorizedImages.healthy.length > 0 ? 'success.main' : 'inherit' }}
        />
        <Tab 
          label={`Có vấn đề (${categorizedImages.issues.length})`} 
          sx={{ color: categorizedImages.issues.length > 0 ? 'error.main' : 'inherit' }}
        />
        <Tab 
          label={`Chưa phân tích (${categorizedImages.unanalyzed.length})`} 
        />
      </Tabs>
      
      {/* Trạng thái tải */}
      {loading ? (
        <Box sx={{ width: '100%', my: 4 }}>
          <LinearProgress />
        </Box>
      ) : displayedImages.length === 0 ? (
        <Box sx={{ 
          textAlign: 'center', 
          my: 4, 
          p: 3, 
          border: '1px dashed',
          borderColor: 'divider',
          borderRadius: 1
        }}>
          <CameraIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography color="text.secondary" gutterBottom>
            {tabValue === 0 
              ? 'Chưa có hình ảnh nào' 
              : tabValue === 1 
                ? 'Không có cây khỏe mạnh'
                : tabValue === 2
                  ? 'Không có cây có vấn đề'
                  : 'Không có hình ảnh cần phân tích'}
          </Typography>
          {tabValue === 0 && (
            <>
              <Typography variant="body2" color="text.secondary" paragraph>
                Chụp ảnh để theo dõi sự phát triển của cây trồng
              </Typography>
              <Button
                variant="contained"
                startIcon={<CameraIcon />}
                onClick={handleCaptureRequest}
                sx={{ mt: 1 }}
              >
                Chụp ảnh ngay
              </Button>
            </>
          )}
        </Box>
      ) : (
        <>
          {/* Hiển thị lưới hình ảnh */}
          <Grid container spacing={2}>
            {displayedImages.map((image) => (
              <Grid item xs={12} sm={6} md={4} key={image._id}>
                <Card 
                  elevation={2}
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'scale(1.02)'
                    }
                  }}
                >
                  <CardMedia
                    component="img"
                    height="180"
                    image={image.webp_url || image.thumbnail_url || image.image_url}
                    alt={`Ảnh cây trồng ${formatDate(image.capture_date)}`}
                    sx={{ cursor: 'pointer', objectFit: 'cover' }}
                    onClick={() => handleImageClick(image)}
                  />
                  <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(image.capture_date)}
                    </Typography>
                    
                    {image.analysis_results ? (
                      <>
                        <Typography 
                          variant="body2" 
                          color={
                            image.analysis_results.health_status?.includes('khỏe mạnh') 
                              ? 'success.main' 
                              : 'error.main'
                          }
                          fontWeight="bold"
                          sx={{ mt: 1 }}
                        >
                          {image.analysis_results.health_status}
                        </Typography>
                        
                        {image.analysis_results.fruit_count > 0 && (
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            Quả: {image.analysis_results.fruit_count}
                          </Typography>
                        )}
                      </>
                    ) : (
                      <Typography variant="body2" color="text.secondary" fontStyle="italic" sx={{ mt: 1 }}>
                        Đang phân tích...
                      </Typography>
                    )}
                    
                    {/* Thông tin cảm biến */}
                    {image.metadata && (
                      <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                        {image.metadata.light_level && (
                          <Tooltip title={`Độ sáng: ${image.metadata.light_level}`}>
                            <Chip 
                              icon={<LightIcon />} 
                              label={image.metadata.light_level} 
                              size="small" 
                              variant="outlined" 
                            />
                          </Tooltip>
                        )}
                        
                        {image.metadata.battery_level && (
                          <Tooltip title={`Pin: ${image.metadata.battery_level}%`}>
                            <Chip 
                              icon={<BatteryIcon />} 
                              label={`${image.metadata.battery_level}%`} 
                              size="small" 
                              variant="outlined" 
                            />
                          </Tooltip>
                        )}
                      </Box>
                    )}
                  </CardContent>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end',
                    p: 1
                  }}>
                    <IconButton
                      size="small"
                      onClick={() => handleShare(image)}
                      title="Chia sẻ"
                    >
                      <ShareIcon fontSize="small" />
                    </IconButton>
                    
                    <IconButton
                      size="small"
                      onClick={() => handleDownload(image)}
                      title="Tải xuống"
                    >
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          {/* Phân trang */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Button 
                disabled={page === 1} 
                onClick={() => handlePageChange(page - 1)}
                variant="outlined"
                sx={{ mx: 1 }}
              >
                Trước
              </Button>
              
              <Typography sx={{ mx: 2, lineHeight: '36px' }}>
                Trang {page} / {totalPages}
              </Typography>
              
              <Button 
                disabled={page === totalPages} 
                onClick={() => handlePageChange(page + 1)}
                variant="outlined"
                sx={{ mx: 1 }}
              >
                Sau
              </Button>
            </Box>
          )}
        </>
      )}
      
      {/* Dialog xem chi tiết */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogContent sx={{ p: 0, position: 'relative' }}>
          <IconButton
            onClick={() => setDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8, bgcolor: 'rgba(0,0,0,0.2)', color: 'white', zIndex: 2 }}
          >
            <CloseIcon />
          </IconButton>
          
          {selectedImage && (
            <Box>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                mb: 2,
                position: 'relative',
                bgcolor: '#000'
              }}>
                <img
                  src={selectedImage.image_url || selectedImage.webp_url}
                  alt="Chi tiết cây trồng"
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '70vh',
                    objectFit: 'contain'
                  }}
                />
              </Box>
              
              <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      Thông tin hình ảnh
                    </Typography>
                    
                    <Typography variant="body1">
                      Thời gian chụp: {formatDate(selectedImage.capture_date)}
                    </Typography>
                    
                    {selectedImage.metadata && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Thông số kỹ thuật:
                        </Typography>
                        
                        <Grid container spacing={1}>
                          {selectedImage.metadata.width && selectedImage.metadata.height && (
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">
                                Độ phân giải: {selectedImage.metadata.width} x {selectedImage.metadata.height}
                              </Typography>
                            </Grid>
                          )}
                          
                          {selectedImage.metadata.light_level && (
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">
                                Độ sáng: {selectedImage.metadata.light_level}
                              </Typography>
                            </Grid>
                          )}
                          
                          {selectedImage.metadata.battery_level && (
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">
                                Pin: {selectedImage.metadata.battery_level}%
                              </Typography>
                            </Grid>
                          )}
                          
                          {selectedImage.metadata.format && (
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">
                                Định dạng: {selectedImage.metadata.format}
                              </Typography>
                            </Grid>
                          )}
                        </Grid>
                      </Box>
                    )}
                    
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleDownload(selectedImage)}
                        size="small"
                      >
                        Tải xuống
                      </Button>
                      
                      <Button
                        variant="outlined"
                        startIcon={<ShareIcon />}
                        onClick={() => handleShare(selectedImage)}
                        size="small"
                      >
                        Chia sẻ
                      </Button>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    {selectedImage.analysis_results ? (
                      <>
                        <Typography variant="h6" gutterBottom>
                          Kết quả phân tích
                        </Typography>
                        
                        <Typography 
                          variant="subtitle1" 
                          color={
                            selectedImage.analysis_results.health_status?.includes('khỏe mạnh') 
                              ? 'success.main' 
                              : 'error.main'
                          }
                          gutterBottom
                        >
                          Tình trạng: {selectedImage.analysis_results.health_status}
                        </Typography>
                        
                        {selectedImage.analysis_results.confidence_score && (
                          <Typography variant="body2" gutterBottom>
                            Độ tin cậy: {Math.round(selectedImage.analysis_results.confidence_score * 100)}%
                          </Typography>
                        )}
                        
                        {selectedImage.analysis_results.growth_stage && (
                          <Typography variant="body2" gutterBottom>
                            Giai đoạn phát triển: {selectedImage.analysis_results.growth_stage}
                          </Typography>
                        )}
                        
                        {selectedImage.analysis_results.fruit_count > 0 && (
                          <Typography variant="body2" gutterBottom>
                            Số lượng quả ước tính: {selectedImage.analysis_results.fruit_count}
                          </Typography>
                        )}
                        
                        {selectedImage.analysis_results.detected_issues?.length > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Vấn đề phát hiện:
                            </Typography>
                            
                            <Box component="ul" sx={{ pl: 2 }}>
                              {selectedImage.analysis_results.detected_issues.map((issue, idx) => (
                                <Typography component="li" key={idx} variant="body2">
                                  {issue}
                                </Typography>
                              ))}
                            </Box>
                          </Box>
                        )}
                        
                        {selectedImage.analysis_results.analysis_date && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                            Phân tích lúc: {formatDate(selectedImage.analysis_results.analysis_date)}
                          </Typography>
                        )}
                      </>
                    ) : (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="h6" gutterBottom>
                          Chưa có kết quả phân tích
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Hình ảnh này đang được xử lý. Kết quả phân tích sẽ được hiển thị sau khi hoàn tất.
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default GardenImageGallery; 