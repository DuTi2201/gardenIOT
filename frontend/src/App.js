import React, { lazy, Suspense, useEffect, useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useAuth } from './context/AuthContext';
import socketService from './services/socketService';
import { Box, CircularProgress, Backdrop, Typography } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import { MascotAlertProvider } from './context/MascotAlertContext';
import { NotificationProvider } from './context/NotificationContext';
import AnimatedMascot from './components/common/AnimatedMascot';

// Lazy load các layout
const MainLayout = lazy(() => import('./components/layouts/MainLayout'));
const AuthLayout = lazy(() => import('./components/layouts/AuthLayout'));

// Lazy load các page
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const GardenList = lazy(() => import('./pages/GardenList'));
const GardenDetail = lazy(() => import('./pages/GardenDetail'));
const GardenConnect = lazy(() => import('./pages/GardenConnect'));
const GardenSettings = lazy(() => import('./pages/GardenSettings'));
const ScheduleList = lazy(() => import('./pages/ScheduleList'));
const Profile = lazy(() => import('./pages/Profile'));
const NotFound = lazy(() => import('./pages/NotFound'));
const GardenAnalysis = lazy(() => import('./pages/GardenAnalysis'));
const Settings = lazy(() => import('./pages/Settings'));
const MascotDemo = lazy(() => import('./pages/MascotDemo'));
const GardenImagesPage = lazy(() => import('./pages/GardenImagesPage'));

// Component fallback khi đang lazy loading
const LoadingFallback = () => (
  <Backdrop
    sx={{
      color: '#fff',
      zIndex: (theme) => theme.zIndex.drawer + 1,
      flexDirection: 'column',
      gap: 3,
      backgroundColor: 'rgba(255, 255, 255, 0.8)'
    }}
    open={true}
  >
    <AnimatedMascot size="large" animation="bounce" />
    <Typography variant="h6" color="primary">
      Đang tải trang...
    </Typography>
    <CircularProgress color="primary" />
  </Backdrop>
);

// Tạo ProtectedRoute component để bảo vệ các route yêu cầu đăng nhập
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingFallback />;
  }

  return user ? children : <Navigate to="/login" replace />;
};

// Tạo PublicOnlyRoute component để chuyển hướng nếu đã đăng nhập
const PublicOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingFallback />;
  }

  return !user ? children : <Navigate to="/dashboard" replace />;
};

// App component
function App() {
  const { user, loading, theme: userTheme } = useAuth();

  // Tạo theme dựa trên cài đặt người dùng
  const theme = useMemo(() => {
    return createTheme({
      palette: {
        mode: userTheme || 'light',
        primary: {
          main: '#2E7D32', // Xanh lá thanh lịch
          light: '#4CAF50',
          dark: '#1B5E20',
        },
        secondary: {
          main: '#00796B', // Xanh ngọc đậm
          light: '#26A69A',
          dark: '#004D40',
        },
        accent: {
          main: '#8BC34A', // Xanh lá nhạt
          light: '#AED581',
          dark: '#689F38',
        },
        error: {
          main: '#F44336',
          light: '#FFCDD2',
        },
        warning: {
          main: '#FFC107',
          light: '#FFF8E1',
        },
        info: {
          main: '#2196F3',
          light: '#E3F2FD',
        },
        success: {
          main: '#4CAF50',
          light: '#E8F5E9',
        },
        background: {
          default: userTheme === 'dark' ? '#121212' : '#FFFFFF',
          paper: userTheme === 'dark' ? '#1E1E1E' : '#FFFFFF',
        },
        text: {
          primary: userTheme === 'dark' ? '#E0E0E0' : '#333333',
          secondary: userTheme === 'dark' ? '#AAAAAA' : '#757575',
        },
        divider: userTheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
      },
      typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
          fontWeight: 700,
          fontSize: '2.5rem',
        },
        h2: {
          fontWeight: 700,
          fontSize: '2rem',
        },
        h3: {
          fontWeight: 600,
          fontSize: '1.75rem',
        },
        h4: {
          fontWeight: 600,
          fontSize: '1.5rem',
        },
        h5: {
          fontWeight: 600,
          fontSize: '1.25rem',
        },
        h6: {
          fontWeight: 600,
          fontSize: '1rem',
        },
        button: {
          fontWeight: 600,
          textTransform: 'none',
        },
      },
      shape: {
        borderRadius: 12,
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              scrollbarWidth: 'thin',
              '&::-webkit-scrollbar': {
                width: '8px',
                height: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: userTheme === 'dark' ? '#333' : '#f1f1f1',
              },
              '&::-webkit-scrollbar-thumb': {
                background: userTheme === 'dark' ? '#555' : '#c1c1c1',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: userTheme === 'dark' ? '#777' : '#a8a8a8',
              },
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: 8,
              boxShadow: 'none',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              },
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: 16,
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              '&:hover': {
                transform: 'translateY(-5px)',
              },
            },
          },
        },
      },
    });
  }, [userTheme]);

  // Kết nối socket khi user đăng nhập
  useEffect(() => {
    if (user) {
      socketService.initializeSocket();
    }
    return () => {
      socketService.disconnectSocket();
    };
  }, [user]);

  if (loading) {
    return <LoadingFallback />;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Protected Routes */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="gardens" element={<GardenList />} />
            <Route path="gardens/:id" element={<GardenDetail />} />
            <Route path="gardens/connect" element={<GardenConnect />} />
            <Route path="gardens/:id/settings" element={<GardenSettings />} />
            <Route path="gardens/:id/analysis" element={<GardenAnalysis />} />
            <Route path="gardens/:id/images" element={<GardenImagesPage />} />
            <Route path="gardens/:id/schedules" element={<ScheduleList />} />
            <Route path="schedules" element={<ScheduleList />} />
            <Route path="profile" element={<Profile />} />
            <Route path="analysis" element={<GardenAnalysis />} />
            <Route path="settings/*" element={<Settings />} />
            <Route path="mascot-demo" element={<MascotDemo />} />
          </Route>

          {/* Public Routes */}
          <Route 
            element={
              <PublicOnlyRoute>
                <AuthLayout />
              </PublicOnlyRoute>
            }
          >
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
          </Route>

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ThemeProvider>
  );
}

// Cấu trúc wrapper cho toàn bộ ứng dụng với các providers
const AppWithProviders = () => {
  return (
    <AuthProvider>
      <MascotAlertProvider>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </MascotAlertProvider>
    </AuthProvider>
  );
};

export default AppWithProviders;