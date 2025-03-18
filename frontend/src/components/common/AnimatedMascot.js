import React, { useEffect, useRef, useState, useCallback, useMemo, memo } from 'react';
import { Box, styled } from '@mui/material';

// Styles cho container được tối ưu để tránh tính toán lại
const getMascotContainerStyles = (size, withShadow) => ({
  position: 'relative',
  width: size === 'small' ? '80px' : size === 'large' ? '200px' : '150px',
  height: size === 'small' ? '80px' : size === 'large' ? '200px' : '150px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  filter: withShadow ? 'drop-shadow(0 8px 15px rgba(0,0,0,0.15))' : 'none',
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-5px) scale(1.03)',
    filter: withShadow ? 'drop-shadow(0 12px 20px rgba(0,0,0,0.2))' : 'none',
  },
});

const MascotContainer = styled(Box)(({ theme, size = 'medium', withShadow = true }) => 
  getMascotContainerStyles(size, withShadow)
);

// Animations được pre-defined để tránh tính toán lại
const animations = {
  float: 'float 3s ease-in-out infinite',
  bounce: 'bounce 2s infinite',
  pulse: 'pulse 2s infinite ease-in-out',
  wave: 'wave 2s ease-in-out infinite',
  pop: 'pop 0.5s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards'
};

// AnimatedImage với tối ưu hóa để tránh tạo lại
const AnimatedImage = styled('img')(({ animation = 'float' }) => ({
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  animation: animations[animation] || animations.float,
}));

// Component Video được tách riêng và memoized
const MascotVideo = memo(({ videoRef, onError, loop, onCanPlay, onEnded }) => {
  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      loop={loop}
      playsInline
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain',
      }}
      onError={onError}
      onCanPlay={onCanPlay}
      onEnded={onEnded}
    >
      {/* Ưu tiên sử dụng WebM với alpha channel (nền trong suốt) */}
      <source src="/linh_vat_transparent.webm" type="video/webm" />
      <source src="/linh_vat_optimized.mp4" type="video/mp4" />
    </video>
  );
});

MascotVideo.displayName = 'MascotVideo';

// Component chính, được memoized
const AnimatedMascot = memo(({ 
  size = 'large', 
  useVideo = true, 
  withShadow = true,
  onClick = null,
  style = {},
  className = '',
  loop = true,
  animation = 'float', // 'float', 'bounce', 'pulse', 'wave', 'pop'
  forceImage = false, // Force using image instead of video
  withBackground = false,
  backgroundOpacity = 0.1
}) => {
  const videoRef = useRef(null);
  const [fallbackToImage, setFallbackToImage] = useState(forceImage);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  
  // Memoize this check to avoid recalculating on every render
  const isBrowserSupportVideo = useMemo(() => 
    typeof window !== 'undefined' && !!document.createElement('video').canPlayType,
    []
  );

  // Tối ưu các hàm xử lý sự kiện bằng useCallback
  const handleError = useCallback((e) => {
    console.log('Video không tải được, chuyển sang dùng hình ảnh', e);
    setVideoError(true);
    setFallbackToImage(true);
  }, []);
  
  const handleCanPlay = useCallback(() => {
    setVideoLoaded(true);
  }, []);
  
  const handleEnded = useCallback(() => {
    if (loop && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {
        console.log('Không thể tự động phát lại video');
      });
    }
  }, [loop]);

  // Video timeout check
  useEffect(() => {
    // Chỉ thực hiện nếu sử dụng video và không force sử dụng hình ảnh
    if (useVideo && !forceImage && isBrowserSupportVideo) {
      // Đặt timeout để chuyển sang hình ảnh nếu video không tải được sau 3 giây
      const timeoutId = setTimeout(() => {
        if (!videoLoaded && !videoError) {
          console.log('Video không tải được sau 3 giây, chuyển sang dùng hình ảnh');
          setFallbackToImage(true);
        }
      }, 3000);
      
      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [useVideo, forceImage, isBrowserSupportVideo, videoLoaded, videoError]);

  // Video event listeners
  useEffect(() => {
    const videoElement = videoRef.current;
    
    // Nếu sử dụng video, thêm sự kiện để xử lý
    if (useVideo && videoElement && !forceImage && isBrowserSupportVideo) {
      videoElement.addEventListener('error', handleError);
      videoElement.addEventListener('canplay', handleCanPlay);
      videoElement.addEventListener('ended', handleEnded);
      
      return () => {
        videoElement.removeEventListener('error', handleError);
        videoElement.removeEventListener('canplay', handleCanPlay);
        videoElement.removeEventListener('ended', handleEnded);
      };
    }
  }, [useVideo, forceImage, isBrowserSupportVideo, handleError, handleCanPlay, handleEnded]);

  // Memoize this condition to avoid recalculating on every render
  const shouldUseImage = useMemo(() => 
    forceImage || fallbackToImage || !isBrowserSupportVideo || !useVideo,
    [forceImage, fallbackToImage, isBrowserSupportVideo, useVideo]
  );

  // Memoize cái container style để tránh việc tạo lại đối tượng style mỗi lần render
  const containerStyle = useMemo(() => ({
    ...style,
    ...(withBackground ? {
      '&::before': {
        content: '""',
        position: 'absolute',
        width: '150%',
        height: '150%',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        borderRadius: '50%',
        backgroundColor: `rgba(129, 199, 132, ${backgroundOpacity})`,
        zIndex: -1,
      }
    } : {})
  }), [style, withBackground, backgroundOpacity]);

  return (
    <MascotContainer 
      size={size} 
      withShadow={withShadow} 
      onClick={onClick}
      style={containerStyle}
      className={className}
    >
      {!shouldUseImage ? (
        <MascotVideo 
          videoRef={videoRef}
          onError={handleError}
          loop={loop}
          onCanPlay={handleCanPlay}
          onEnded={handleEnded}
        />
      ) : (
        <AnimatedImage
          src="/linh_vat_2.png"
          alt="Linh vật Garden IoT"
          animation={animation}
        />
      )}
    </MascotContainer>
  );
});

AnimatedMascot.displayName = 'AnimatedMascot';

export default AnimatedMascot;