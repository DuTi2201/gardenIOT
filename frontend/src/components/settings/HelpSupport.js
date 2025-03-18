import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Link,
  Alert,
  CircularProgress,
  styled,
  alpha
} from '@mui/material';
import {
  Help as HelpIcon,
  Send as SendIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Forum as ForumIcon,
  Book as BookIcon,
  PlayCircle as VideoIcon,
  Code as CodeIcon,
  ExpandMore as ExpandMoreIcon,
  WhatsApp as WhatsAppIcon,
  QuestionAnswer as FaqIcon,
  BugReport as BugIcon,
  Feedback as FeedbackIcon,
  Description as DocumentIcon
} from '@mui/icons-material';
import AnimatedMascot from '../common/AnimatedMascot';

const HelpCard = styled(Card)(({ theme }) => ({
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

const ResourceItem = styled(ListItemButton)(({ theme }) => ({
  borderRadius: 12,
  marginBottom: theme.spacing(1),
  padding: theme.spacing(1.5, 2),
  transition: 'all 0.2s ease',
  backgroundColor: alpha(theme.palette.primary.main, 0.04),
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    transform: 'translateY(-2px)',
  }
}));

const MascotContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  marginTop: -20,
  marginBottom: -20,
  display: 'flex',
  justifyContent: 'center',
}));

const ContactMethodCard = styled(Card)(({ theme, method }) => {
  let bgColor, color;
  
  switch (method) {
    case 'email':
      bgColor = alpha(theme.palette.info.main, 0.1);
      color = theme.palette.info.main;
      break;
    case 'phone':
      bgColor = alpha(theme.palette.success.main, 0.1);
      color = theme.palette.success.main;
      break;
    case 'whatsapp':
      bgColor = alpha('#25D366', 0.1);
      color = '#25D366';
      break;
    default:
      bgColor = alpha(theme.palette.primary.main, 0.1);
      color = theme.palette.primary.main;
  }
  
  return {
    borderRadius: 12,
    padding: theme.spacing(2),
    backgroundColor: bgColor,
    border: '1px solid',
    borderColor: alpha(color, 0.2),
    height: '100%',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: alpha(color, 0.15),
      transform: 'translateY(-3px)',
      boxShadow: `0 8px 20px ${alpha(color, 0.2)}`,
    }
  };
});

const HelpSupport = () => {
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  const faqs = [
    {
      question: 'Làm thế nào để kết nối thiết bị mới với hệ thống?',
      answer: 'Để kết nối thiết bị mới, hãy đảm bảo thiết bị đã được bật nguồn và trong chế độ ghép nối. Sau đó, vào phần "Thiết bị" trong ứng dụng, nhấn nút "Thêm thiết bị" và làm theo hướng dẫn trên màn hình.'
    },
    {
      question: 'Tôi không nhận được thông báo khi nhiệt độ vượt ngưỡng?',
      answer: 'Đầu tiên, hãy kiểm tra cài đặt thông báo trong phần "Cài đặt > Thông báo" và đảm bảo đã bật thông báo cho cảnh báo nhiệt độ. Nếu vẫn không nhận được thông báo, hãy kiểm tra cài đặt thông báo trên thiết bị di động của bạn và đảm bảo ứng dụng có quyền gửi thông báo.'
    },
    {
      question: 'Làm cách nào để tùy chỉnh lịch tưới cây tự động?',
      answer: 'Để tùy chỉnh lịch tưới cây, hãy truy cập vào phần "Lịch trình" trong ứng dụng. Tại đây, bạn có thể tạo, chỉnh sửa hoặc xóa các lịch tưới cây tự động. Bạn có thể đặt thời gian, tần suất và lượng nước cho mỗi lần tưới phù hợp với từng loại cây trồng.'
    },
    {
      question: 'Ứng dụng có hỗ trợ hoạt động offline không?',
      answer: 'Ứng dụng Garden IoT cần kết nối internet để đồng bộ dữ liệu và điều khiển thiết bị từ xa. Tuy nhiên, một số tính năng cơ bản như xem dữ liệu đã lưu trước đó vẫn có thể hoạt động trong chế độ offline. Các thiết bị thông minh vẫn sẽ tiếp tục hoạt động theo lịch trình đã cài đặt ngay cả khi không có kết nối internet.'
    },
    {
      question: 'Tôi có thể chia sẻ quyền quản lý vườn với người khác không?',
      answer: 'Có, bạn có thể chia sẻ quyền quản lý vườn với người khác. Vào phần "Cài đặt > Chia sẻ & Quyền", chọn vườn bạn muốn chia sẻ, sau đó nhập email của người bạn muốn mời và chọn cấp quyền phù hợp (Xem, Điều khiển hoặc Quản trị viên).'
    }
  ];
  
  const resources = [
    { 
      title: 'Hướng dẫn sử dụng',
      description: 'Tìm hiểu chi tiết về cách sử dụng ứng dụng Garden IoT',
      icon: <BookIcon />,
      link: '#'
    },
    { 
      title: 'Video hướng dẫn',
      description: 'Xem các video hướng dẫn trực quan để làm quen với ứng dụng',
      icon: <VideoIcon />,
      link: '#'
    },
    { 
      title: 'Tài liệu API',
      description: 'Tìm hiểu về API để tích hợp với hệ thống của bạn',
      icon: <CodeIcon />,
      link: '#'
    },
    { 
      title: 'Cộng đồng',
      description: 'Tham gia cộng đồng người dùng Garden IoT',
      icon: <ForumIcon />,
      link: '#'
    },
    { 
      title: 'Báo lỗi',
      description: 'Báo cáo lỗi hoặc vấn đề kỹ thuật',
      icon: <BugIcon />,
      link: '#'
    }
  ];
  
  const handleContactFormChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleContactSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Mô phỏng gửi form
    setTimeout(() => {
      setLoading(false);
      
      if (Math.random() > 0.1) { // Giả định 90% thành công
        setSuccess(true);
        setContactForm({
          name: '',
          email: '',
          subject: '',
          message: ''
        });
        setTimeout(() => setSuccess(false), 5000);
      } else {
        setError('Có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại sau hoặc liên hệ qua các phương thức khác.');
      }
    }, 1500);
  };
  
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
          Trợ giúp & Hỗ trợ
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Tìm kiếm trợ giúp, gửi yêu cầu hỗ trợ hoặc tìm hiểu về sản phẩm
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Yêu cầu hỗ trợ của bạn đã được gửi thành công! Chúng tôi sẽ phản hồi trong thời gian sớm nhất.
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <HelpCard>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <FaqIcon sx={{ mr: 1.5, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="600">
                  Câu hỏi thường gặp
                </Typography>
              </Box>
              
              {faqs.map((faq, index) => (
                <Accordion 
                  key={index} 
                  sx={{ 
                    mb: 2, 
                    boxShadow: 'none', 
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '12px !important',
                    '&:before': { display: 'none' },
                    overflow: 'hidden'
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{ 
                      backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.03),
                      '&:hover': {
                        backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.05)
                      }
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight="500">
                      {faq.question}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" color="text.secondary">
                      {faq.answer}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
              
              <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Không tìm thấy câu trả lời bạn cần?
                </Typography>
                <Button
                  variant="text"
                  color="primary"
                  sx={{ mt: 1 }}
                  endIcon={<SendIcon />}
                  href="#contact-form"
                >
                  Gửi câu hỏi cho chúng tôi
                </Button>
              </Box>
            </CardContent>
          </HelpCard>
        </Grid>
        
        <Grid item xs={12} md={5}>
          <HelpCard>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <DocumentIcon sx={{ mr: 1.5, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="600">
                  Tài nguyên
                </Typography>
              </Box>
              
              <List sx={{ p: 0 }}>
                {resources.map((resource, index) => (
                  <ResourceItem 
                    key={index}
                    component={Link}
                    href={resource.link}
                    target="_blank"
                    sx={{ textDecoration: 'none' }}
                  >
                    <ListItemIcon sx={{ color: 'primary.main' }}>
                      {resource.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={resource.title}
                      secondary={resource.description}
                      primaryTypographyProps={{ fontWeight: 500 }}
                    />
                  </ResourceItem>
                ))}
              </List>
            </CardContent>
          </HelpCard>
        </Grid>
      </Grid>
      
      <Box sx={{ my: 4 }}>
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
          Liên hệ với chúng tôi
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <ContactMethodCard method="email">
              <Box sx={{ textAlign: 'center' }}>
                <EmailIcon sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6" fontWeight="600" sx={{ mb: 1 }}>
                  Email
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Gửi email cho đội ngũ hỗ trợ của chúng tôi
                </Typography>
                <Link 
                  href="mailto:support@gardeniot.example.com"
                  sx={{ 
                    fontWeight: 500,
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  support@gardeniot.example.com
                </Link>
              </Box>
            </ContactMethodCard>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <ContactMethodCard method="phone">
              <Box sx={{ textAlign: 'center' }}>
                <PhoneIcon sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6" fontWeight="600" sx={{ mb: 1 }}>
                  Điện thoại
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Gọi điện trong giờ hành chính
                </Typography>
                <Link 
                  href="tel:+842812345678"
                  sx={{ 
                    fontWeight: 500,
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  +84 28 1234 5678
                </Link>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Thứ 2 - Thứ 6: 8:00 - 17:00
                </Typography>
              </Box>
            </ContactMethodCard>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <ContactMethodCard method="whatsapp">
              <Box sx={{ textAlign: 'center' }}>
                <WhatsAppIcon sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6" fontWeight="600" sx={{ mb: 1 }}>
                  WhatsApp
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Hỗ trợ qua WhatsApp
                </Typography>
                <Link 
                  href="https://wa.me/84123456789"
                  target="_blank"
                  sx={{ 
                    fontWeight: 500,
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  +84 123 456 789
                </Link>
              </Box>
            </ContactMethodCard>
          </Grid>
        </Grid>
      </Box>
      
      <HelpCard id="contact-form">
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <FeedbackIcon sx={{ mr: 1.5, color: 'primary.main' }} />
            <Typography variant="h6" fontWeight="600">
              Gửi yêu cầu hỗ trợ
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <form onSubmit={handleContactSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Họ và tên"
                      name="name"
                      value={contactForm.name}
                      onChange={handleContactFormChange}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      type="email"
                      value={contactForm.email}
                      onChange={handleContactFormChange}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Chủ đề"
                      name="subject"
                      value={contactForm.subject}
                      onChange={handleContactFormChange}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Nội dung"
                      name="message"
                      multiline
                      rows={4}
                      value={contactForm.message}
                      onChange={handleContactFormChange}
                      required
                      placeholder="Mô tả chi tiết vấn đề bạn đang gặp phải..."
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      size="large"
                      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                      disabled={loading}
                    >
                      {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </Grid>
            
            <Grid item xs={12} md={5}>
              <MascotContainer>
                <AnimatedMascot size="medium" useVideo={true} />
              </MascotContainer>
              
              <Box sx={{ 
                p: 3, 
                borderRadius: 2, 
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                mt: 2
              }}>
                <Typography variant="h6" fontWeight="600" sx={{ mb: 1 }}>
                  Linh vật Garden IoT
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tôi là trợ lý ảo của Garden IoT. Bạn có thể tìm kiếm sự trợ giúp từ tôi bất cứ lúc nào bằng cách nhấp vào biểu tượng trợ giúp ở góc phải trên cùng của ứng dụng.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </HelpCard>
    </Box>
  );
};

export default HelpSupport; 