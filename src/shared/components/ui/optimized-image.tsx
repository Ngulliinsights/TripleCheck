import React from 'react';

interface OptimizedImageProps {
  webpSrc?: string;
  fallbackSrc: string;
  alt: string;
  className?: string;
}

export function OptimizedImage({ webpSrc, fallbackSrc, alt, className }: OptimizedImageProps) {
  return (
    <picture>
      {webpSrc && <source srcSet={webpSrc} type="image/webp" />}
      <img src={fallbackSrc} alt={alt} className={className} />
    </picture>
  );
}