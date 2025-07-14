import { useState } from 'react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  webpSrc?: string;
  fallbackSrc: string;
  alt: string;
  className?: string;
}

export function OptimizedImage({
  webpSrc,
  fallbackSrc,
  alt,
  className = '',
  ...props
}: OptimizedImageProps) {
  const [error, setError] = useState(false);
  const [webpSupported, setWebpSupported] = useState(true);

  // Enhanced SVG detection - checks both file extension and data URLs
  const isSvg = fallbackSrc.toLowerCase().endsWith('.svg') || 
               fallbackSrc.toLowerCase().includes('data:image/svg+xml');

  // Determine the source to use based on format and error state
  const getSrc = () => {
    // For SVGs, always use the fallback source directly
    // SVGs don't benefit from WebP conversion and should render as-is
    if (isSvg) {
      return fallbackSrc;
    }
    
    // For other images, use WebP if available and no errors occurred
    if (webpSrc && webpSupported && !error) {
      return webpSrc;
    }
    
    // Fall back to original format
    return fallbackSrc;
  };

  // Enhanced error handling that differentiates between WebP and fallback failures
  const handleError = () => {
    if (webpSrc && webpSupported && !error) {
      // First error might be WebP-related, try fallback
      setWebpSupported(false);
      setError(false);
    } else {
      // Fallback also failed, or this is an SVG/non-WebP image
      setError(true);
    }
  };

  // Enhanced loading handler to reset error state on successful loads
  const handleLoad = () => {
    // Reset error state when image loads successfully
    // This helps with dynamic src changes
    if (error) {
      setError(false);
    }
  };

  return (
    <img
      src={getSrc()}
      alt={alt}
      className={className}
      onError={handleError}
      onLoad={handleLoad}
      // Preserve SVG scalability and crispness
      style={isSvg ? { 
        ...props.style,
        // Ensure SVGs scale properly and remain crisp
        imageRendering: 'auto'
      } : props.style}
      {...props}
    />
  );
}