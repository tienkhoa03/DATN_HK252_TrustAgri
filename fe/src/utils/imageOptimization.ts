/**
 * Image Optimization Utilities
 * Provides utilities for optimizing image loading and display
 */

/**
 * Image loading options
 */
interface ImageLoadOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  lazy?: boolean;
}

/**
 * Optimize image URL with parameters
 * Note: This is a placeholder - actual implementation depends on your image CDN
 */
export function optimizeImageUrl(url: string, options: ImageLoadOptions = {}): string {
  // If it's a data URL or blob, return as-is
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  // For external URLs, you might want to use an image optimization service
  // This is a simple example - adjust based on your CDN
  const params = new URLSearchParams();
  
  if (options.width) {
    params.append('w', options.width.toString());
  }
  
  if (options.height) {
    params.append('h', options.height.toString());
  }
  
  if (options.quality) {
    params.append('q', options.quality.toString());
  }
  
  if (options.format) {
    params.append('fm', options.format);
  }

  const queryString = params.toString();
  if (queryString) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${queryString}`;
  }

  return url;
}

/**
 * Lazy load image with IntersectionObserver
 */
export function lazyLoadImage(
  img: HTMLImageElement,
  src: string,
  options: ImageLoadOptions = {}
): void {
  if (!('IntersectionObserver' in window)) {
    // Fallback for browsers without IntersectionObserver
    img.src = optimizeImageUrl(src, options);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          img.src = optimizeImageUrl(src, options);
          observer.unobserve(img);
        }
      });
    },
    {
      rootMargin: '50px', // Start loading 50px before entering viewport
    }
  );

  observer.observe(img);
}

/**
 * Preload critical images
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Preload multiple images
 */
export async function preloadImages(urls: string[]): Promise<void> {
  await Promise.all(urls.map(url => preloadImage(url)));
}

/**
 * Get responsive image sizes based on screen width
 */
export function getResponsiveImageSize(): { width: number; height: number } {
  const screenWidth = window.innerWidth;
  
  // Mobile-first approach for Zalo Mini App
  if (screenWidth <= 360) {
    return { width: 360, height: 240 };
  } else if (screenWidth <= 414) {
    return { width: 414, height: 276 };
  } else {
    return { width: 480, height: 320 };
  }
}

/**
 * Compress image on client side (for user uploads)
 */
export function compressImage(
  file: File,
  maxWidth: number = 1024,
  maxHeight: number = 1024,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        
        // Calculate new dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Convert image to WebP format (if supported)
 */
export function convertToWebP(
  file: File,
  quality: number = 0.8
): Promise<Blob | null> {
  return new Promise((resolve) => {
    // Check WebP support
    const canvas = document.createElement('canvas');
    const supportsWebP = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    
    if (!supportsWebP) {
      resolve(null);
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(
          (blob) => resolve(blob),
          'image/webp',
          quality
        );
      };
      
      img.onerror = () => resolve(null);
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

/**
 * Calculate image file size reduction
 */
export function calculateSizeReduction(originalSize: number, compressedSize: number): {
  reduction: number;
  percentage: number;
} {
  const reduction = originalSize - compressedSize;
  const percentage = (reduction / originalSize) * 100;
  
  return {
    reduction,
    percentage: Math.round(percentage * 100) / 100,
  };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
