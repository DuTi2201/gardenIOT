import React from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Analytics as AnalyticsIcon,
  Schedule as ScheduleIcon,
  Edit as EditIcon,
  Camera as CameraIcon
} from '@mui/icons-material';

const GardenActions = ({ garden }) => {
  // Kiểm tra garden và garden.id
  if (!garden) {
    console.error('Garden is null or undefined');
    return null;
  }

  // Sử dụng garden.id thay vì garden._id
  if (!garden.id) {
    console.error('Garden.id is missing:', garden);
    return null;
  }

  // Log để debug
  console.log('Garden in GardenActions:', garden);
  console.log('Garden ID:', garden.id);

  // Lấy ID vườn từ garden.id
  const gardenId = garden.id;

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      {/* Nút xem hình ảnh cây trồng */}
      <Tooltip title="Hình ảnh cây trồng">
        <IconButton
          component={Link}
          to={`/gardens/${gardenId}/images`}
          color="primary"
          size="small"
          sx={{ 
            border: '1px solid #3f51b5', 
            backgroundColor: '#e8eaf6',
            '&:hover': {
              backgroundColor: '#c5cae9',
            }
          }}
        >
          <CameraIcon />
        </IconButton>
      </Tooltip>

      {/* Nút phân tích dữ liệu */}
      <Tooltip title="Phân tích dữ liệu">
        <IconButton
          component={Link}
          to={`/gardens/${gardenId}/analysis`}
          color="primary"
          size="small"
          sx={{ 
            border: '1px solid #3f51b5', 
            backgroundColor: '#e8eaf6',
            '&:hover': {
              backgroundColor: '#c5cae9',
            }
          }}
        >
          <AnalyticsIcon />
        </IconButton>
      </Tooltip>

      {/* Nút lịch trình */}
      <Tooltip title="Lịch trình">
        <IconButton
          component={Link}
          to={`/gardens/${gardenId}/schedules`}
          color="primary"
          size="small"
          sx={{ 
            border: '1px solid #3f51b5', 
            backgroundColor: '#e8eaf6',
            '&:hover': {
              backgroundColor: '#c5cae9',
            }
          }}
        >
          <ScheduleIcon />
        </IconButton>
      </Tooltip>

      {/* Nút cài đặt */}
      <Tooltip title="Cài đặt">
        <IconButton
          component={Link}
          to={`/gardens/${gardenId}/settings`}
          color="primary"
          size="small"
          sx={{ 
            border: '1px solid #3f51b5', 
            backgroundColor: '#e8eaf6',
            '&:hover': {
              backgroundColor: '#c5cae9',
            }
          }}
        >
          <SettingsIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default GardenActions; 