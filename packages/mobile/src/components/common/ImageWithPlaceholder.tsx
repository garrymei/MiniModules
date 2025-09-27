import React, { useState, useEffect } from 'react';
import { Image, View, Text } from '@tarojs/components';
import { ImageCompression } from '../../utils/image-compression';
import './ImageWithPlaceholder.scss';

interface ImageWithPlaceholderProps {
  src: string;
  width?: number;
  height?: number;
  mode?: 'scaleToFill' | 'aspectFit' | 'aspectFill' | 'widthFix' | 'heightFix' | 'top' | 'bottom' | 'center' | 'left' | 'right' | 'top left' | 'top right' | 'bottom left' | 'bottom right';
  placeholder?: string;
  fallback?: string;
  lazyLoad?: boolean;
  showLoading?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const ImageWithPlaceholder: React.FC<ImageWithPlaceholderProps> = ({
  src,
  width = 200,
  height = 200,
  mode = 'aspectFill',
  placeholder,
  fallback,
  lazyLoad = true,
  showLoading = true,
  onLoad,
  onError,
  className = '',
  style = {},
}) => {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [currentSrc, setCurrentSrc] = useState<string>(src);
  const [compressedSrc, setCompressedSrc] = useState<string | null>(null);

  useEffect(() => {
    loadImage();
  }, [src]);

  const loadImage = async () => {
    if (!src) {
      setImageState('error');
      return;
    }

    setImageState('loading');

    try {
      // 检查是否需要压缩
      const shouldCompress = await ImageCompression.shouldCompress(src);
      
      if (shouldCompress) {
        // 压缩图片
        const compressed = await ImageCompression.compressImage(src, {
          maxWidth: width * 2, // 2倍分辨率适配高清屏
          maxHeight: height * 2,
          quality: 0.8,
        });
        setCompressedSrc(compressed.tempFilePath);
        setCurrentSrc(compressed.tempFilePath);
      } else {
        setCurrentSrc(src);
      }

      setImageState('loaded');
      onLoad?.();
    } catch (error) {
      console.error('Failed to load image:', error);
      setImageState('error');
      onError?.();
    }
  };

  const handleImageLoad = () => {
    setImageState('loaded');
    onLoad?.();
  };

  const handleImageError = () => {
    setImageState('error');
    onError?.();
  };

  const getPlaceholderSrc = () => {
    if (placeholder) {
      return placeholder;
    }
    
    if (fallback) {
      return fallback;
    }
    
    // 生成默认占位符
    return ImageCompression.getPlaceholder(width, height, '图片');
  };

  const getImageSrc = () => {
    if (imageState === 'error') {
      return getPlaceholderSrc();
    }
    
    return currentSrc;
  };

  return (
    <View className={`image-with-placeholder ${className}`} style={{ width, height, ...style }}>
      {imageState === 'loading' && showLoading && (
        <View className="image-loading">
          <Text className="loading-text">加载中...</Text>
        </View>
      )}
      
      <Image
        src={getImageSrc()}
        mode={mode}
        lazyLoad={lazyLoad}
        onLoad={handleImageLoad}
        onError={handleImageError}
        className={`image-content ${imageState === 'error' ? 'image-error' : ''}`}
        style={{ width, height }}
      />
      
      {imageState === 'error' && (
        <View className="image-error-overlay">
          <Text className="error-text">图片加载失败</Text>
        </View>
      )}
    </View>
  );
};

export default ImageWithPlaceholder;
