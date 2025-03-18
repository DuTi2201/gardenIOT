import React from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link,
  Button,
  Paper
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import GardenImageGallery from '../components/garden/GardenImageGallery';

const GardenImagesPage = () => {
  const { id } = useParams();

  return (
    <Box>
      {/* Breadcrumbs navigation */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link 
          component={RouterLink} 
          to="/"
          color="inherit"
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <HomeIcon fontSize="small" sx={{ mr: 0.5 }} />
          Trang chủ
        </Link>
        <Link
          component={RouterLink}
          to="/gardens"
          color="inherit"
        >
          Danh sách vườn
        </Link>
        <Link
          component={RouterLink}
          to={`/gardens/${id}`}
          color="inherit"
        >
          Chi tiết vườn
        </Link>
        <Typography color="text.primary">Hình ảnh</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Thư viện hình ảnh cây trồng
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          component={RouterLink}
          to={`/gardens/${id}`}
        >
          Quay lại vườn
        </Button>
      </Box>

      {/* Main content */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          borderRadius: 2,
          bgcolor: 'background.paper',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
        }}
      >
        <GardenImageGallery gardenId={id} />
      </Paper>
    </Box>
  );
};

export default GardenImagesPage; 