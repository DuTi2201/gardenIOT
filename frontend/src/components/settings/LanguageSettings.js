import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Button,
  Divider,
  Grid,
  Switch,
  Select,
  MenuItem,
  InputLabel,
  FormHelperText,
  Alert,
  styled,
  alpha,
  Paper,
  Tooltip,
  Chip
} from '@mui/material';
import {
  Language as LanguageIcon,
  Translate as TranslateIcon,
  Save as SaveIcon,
  AccessTime as TimeIcon,
  Apps as AppsIcon,
  Public as GlobalIcon,
  Check as CheckIcon
} from '@mui/icons-material';

const LanguageCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)',
  overflow: 'hidden',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  marginBottom: theme.spacing(3),
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.08)',
  }
}));

const LanguageOption = styled(Paper)(({ theme, selected }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  borderRadius: 12,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  border: `2px solid ${selected ? theme.palette.primary.main : 'transparent'}`,
  backgroundColor: selected ? alpha(theme.palette.primary.main, 0.05) : theme.palette.background.paper,
  '&:hover': {
    backgroundColor: selected ? alpha(theme.palette.primary.main, 0.08) : alpha(theme.palette.primary.main, 0.02),
    transform: 'translateY(-2px)',
    boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
  }
}));

const FlagIcon = styled('img')({
  width: 36,
  height: 24,
  objectFit: 'cover',
  borderRadius: 4,
  marginRight: 16,
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
});

const LanguageSettings = () => {
  const [language, setLanguage] = useState('vi');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [timeFormat, setTimeFormat] = useState('24h');
  const [unitSystem, setUnitSystem] = useState('metric');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [translatePlantNames, setTranslatePlantNames] = useState(true);
  const [translateInterface, setTranslateInterface] = useState(true);

  const languages = [
    { code: 'vi', name: 'Tiếng Việt', flag: 'https://flagcdn.com/w80/vn.png', native: 'Tiếng Việt' },
    { code: 'en', name: 'Tiếng Anh', flag: 'https://flagcdn.com/w80/gb.png', native: 'English' },
    { code: 'zh', name: 'Tiếng Trung', flag: 'https://flagcdn.com/w80/cn.png', native: '中文' },
    { code: 'ja', name: 'Tiếng Nhật', flag: 'https://flagcdn.com/w80/jp.png', native: '日本語' }
  ];

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
  };

  const handleDateFormatChange = (event) => {
    setDateFormat(event.target.value);
  };

  const handleTimeFormatChange = (event) => {
    setTimeFormat(event.target.value);
  };

  const handleUnitSystemChange = (event) => {
    setUnitSystem(event.target.value);
  };

  const handleTranslatePlantNamesChange = () => {
    setTranslatePlantNames(!translatePlantNames);
  };

  const handleTranslateInterfaceChange = () => {
    setTranslateInterface(!translateInterface);
  };

  const handleSaveSettings = () => {
    setLoading(true);
    
    // Mô phỏng lưu cài đặt
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      // Áp dụng ngôn ngữ (trong ứng dụng thực tế sẽ gọi API)
      console.log('Áp dụng ngôn ngữ:', language);
      console.log('Định dạng ngày:', dateFormat);
      console.log('Định dạng thời gian:', timeFormat);
      console.log('Hệ đơn vị:', unitSystem);
    }, 1000);
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
          Cài đặt ngôn ngữ & địa phương
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Tùy chỉnh ngôn ngữ, định dạng thời gian và đơn vị đo lường
        </Typography>
      </Box>
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Đã lưu cài đặt ngôn ngữ thành công!
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <LanguageCard>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <LanguageIcon sx={{ mr: 1.5, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="600">
                  Ngôn ngữ hiển thị
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Chọn ngôn ngữ bạn muốn sử dụng cho ứng dụng Garden IoT
              </Typography>
              
              <Grid container spacing={2}>
                {languages.map((lang) => (
                  <Grid item xs={12} sm={6} key={lang.code}>
                    <LanguageOption 
                      selected={language === lang.code} 
                      onClick={() => handleLanguageChange(lang.code)}
                    >
                      <FlagIcon src={lang.flag} alt={lang.code} />
                      <Box>
                        <Typography variant="subtitle1" fontWeight={language === lang.code ? 600 : 400}>
                          {lang.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {lang.native}
                        </Typography>
                      </Box>
                      {language === lang.code && (
                        <CheckIcon 
                          sx={{ 
                            ml: 'auto', 
                            color: 'primary.main',
                            fontSize: 20
                          }} 
                        />
                      )}
                    </LanguageOption>
                  </Grid>
                ))}
              </Grid>
              
              <Box sx={{ mt: 4, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 1 }}>
                  Tùy chọn dịch
                </Typography>
                
                <FormControl component="fieldset">
                  <FormControlLabel
                    control={
                      <Switch
                        checked={translatePlantNames}
                        onChange={handleTranslatePlantNamesChange}
                        color="primary"
                      />
                    }
                    label="Dịch tên cây trồng sang ngôn ngữ đã chọn"
                  />
                  
                  <FormHelperText>
                    Khi bật, tên cây trồng sẽ hiển thị bằng ngôn ngữ bạn đã chọn thay vì tên khoa học
                  </FormHelperText>
                </FormControl>
                
                <FormControl component="fieldset" sx={{ mt: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={translateInterface}
                        onChange={handleTranslateInterfaceChange}
                        color="primary"
                      />
                    }
                    label="Dịch giao diện người dùng"
                  />
                  
                  <FormHelperText>
                    Khi tắt, các thuật ngữ kỹ thuật sẽ giữ nguyên bằng tiếng Anh
                  </FormHelperText>
                </FormControl>
              </Box>
            </CardContent>
          </LanguageCard>
        </Grid>
        
        <Grid item xs={12} md={5}>
          <LanguageCard>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <TimeIcon sx={{ mr: 1.5, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="600">
                  Định dạng ngày và giờ
                </Typography>
              </Box>
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="date-format-label">Định dạng ngày</InputLabel>
                <Select
                  labelId="date-format-label"
                  id="date-format"
                  value={dateFormat}
                  label="Định dạng ngày"
                  onChange={handleDateFormatChange}
                >
                  <MenuItem value="DD/MM/YYYY">DD/MM/YYYY (31/12/2023)</MenuItem>
                  <MenuItem value="MM/DD/YYYY">MM/DD/YYYY (12/31/2023)</MenuItem>
                  <MenuItem value="YYYY-MM-DD">YYYY-MM-DD (2023-12-31)</MenuItem>
                  <MenuItem value="DD-MM-YYYY">DD-MM-YYYY (31-12-2023)</MenuItem>
                </Select>
                <FormHelperText>
                  Định dạng hiển thị ngày tháng trong ứng dụng
                </FormHelperText>
              </FormControl>
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="time-format-label">Định dạng giờ</InputLabel>
                <Select
                  labelId="time-format-label"
                  id="time-format"
                  value={timeFormat}
                  label="Định dạng giờ"
                  onChange={handleTimeFormatChange}
                >
                  <MenuItem value="24h">24 giờ (14:30)</MenuItem>
                  <MenuItem value="12h">12 giờ (2:30 PM)</MenuItem>
                </Select>
                <FormHelperText>
                  Định dạng hiển thị thời gian trong ứng dụng
                </FormHelperText>
              </FormControl>
              
              <Divider sx={{ my: 3 }} />
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <GlobalIcon sx={{ mr: 1.5, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="600">
                  Đơn vị đo lường
                </Typography>
              </Box>
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="unit-system-label">Hệ đơn vị</InputLabel>
                <Select
                  labelId="unit-system-label"
                  id="unit-system"
                  value={unitSystem}
                  label="Hệ đơn vị"
                  onChange={handleUnitSystemChange}
                >
                  <MenuItem value="metric">Hệ mét (°C, mm, kg)</MenuItem>
                  <MenuItem value="imperial">Hệ đo lường Anh (°F, inch, lb)</MenuItem>
                </Select>
                <FormHelperText>
                  Hệ đơn vị sử dụng để hiển thị dữ liệu trong ứng dụng
                </FormHelperText>
              </FormControl>
              
              <Box sx={{ mt: 3, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 2 }}>
                  Xem trước
                </Typography>
                
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Nhiệt độ:</Typography>
                    <Typography variant="body2" fontWeight="600">
                      {unitSystem === 'metric' ? '25°C' : '77°F'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Lượng mưa:</Typography>
                    <Typography variant="body2" fontWeight="600">
                      {unitSystem === 'metric' ? '25mm' : '0.98 inch'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Ngày:</Typography>
                    <Typography variant="body2" fontWeight="600">
                      {dateFormat === 'DD/MM/YYYY' && '31/12/2023'}
                      {dateFormat === 'MM/DD/YYYY' && '12/31/2023'}
                      {dateFormat === 'YYYY-MM-DD' && '2023-12-31'}
                      {dateFormat === 'DD-MM-YYYY' && '31-12-2023'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Thời gian:</Typography>
                    <Typography variant="body2" fontWeight="600">
                      {timeFormat === '24h' ? '14:30' : '2:30 PM'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </LanguageCard>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSaveSettings}
              disabled={loading}
            >
              {loading ? 'Đang lưu...' : 'Lưu cài đặt'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LanguageSettings; 