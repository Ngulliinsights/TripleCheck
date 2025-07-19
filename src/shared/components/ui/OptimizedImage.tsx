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
  const [loading, setLoading] = useState(true);

  // Enhanced SVG detection - checks both file extension and data URLs
  const isSvg = fallbackSrc.toLowerCase().endsWith('.svg') || 
               fallbackSrc.toLowerCase().includes('data:image/svg+xml');

  // Determine the source to use based on format and error state
  const getSrc = () => {
    // If all sources failed, show placeholder
    if (error) {
      return '/placeholder-image.jpg';
    }
    
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
  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const currentSrc = (e.target as HTMLImageElement).src;
    
    if (webpSrc && webpSupported && !error && currentSrc.includes(webpSrc)) {
      // First error might be WebP-related, try fallback
      setWebpSupported(false);
      setError(false);
    } else if (!error && currentSrc !== '/placeholder-image.jpg') {
      // Fallback also failed, show placeholder
      setError(true);
    }
    setLoading(false);
  };

  // Enhanced loading handler to reset error state on successful loads
  const handleLoad = () => {
    // Reset error state when image loads successfully
    // This helps with dynamic src changes
    if (error) {
      setError(false);
    }
    setLoading(false);
  };

  const handleLoadStart = () => {
    setLoading(true);
  };

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="text-gray-400 text-sm">Loading...</div>
        </div>
      )}
      <img
        src={getSrc()}
        alt={alt}
        className={`${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
        onError={handleError}
        onLoad={handleLoad}
        onLoadStart={handleLoadStart}
        // Preserve SVG scalability and crispness
        style={isSvg ? { 
          ...props.style,
          // Ensure SVGs scale properly and remain crisp
          imageRendering: 'auto'
        } : props.style}
        {...props}
      />
    </div>
  );
}