import React from 'react';

// Logo component
interface LogoProps {
  size?: 'small' | 'medium' | 'large' | 'xl';
  variant?: 'default' | 'white';
  className?: string;
}

export function Logo({ size = 'medium', variant = 'default', className = '' }: LogoProps) {
  const sizeClasses = {
    small: 'h-8 w-8',
    medium: 'h-12 w-12',
    large: 'h-16 w-16',
    xl: 'h-20 w-20'
  };

  const variantClasses = {
    default: 'text-blue-600',
    white: 'text-white'
  };

  return (
    <div className={`${sizeClasses[size]} ${variantClasses[variant]} ${className} flex items-center justify-center bg-current rounded-lg`}>
      <span className="text-white font-bold text-xs">TC</span>
    </div>
  );
}

// PropertyImage component
interface PropertyImageProps {
  src: string;
  alt: string;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

export function PropertyImage({ src, alt, className = '', size = 'medium' }: PropertyImageProps) {
  const sizeClasses = {
    small: 'h-32 w-48',
    medium: 'h-48 w-72',
    large: 'h-64 w-96'
  };

  return (
    <img
      src={src}
      alt={alt}
      className={`${sizeClasses[size]} object-cover rounded-lg ${className}`}
      loading="lazy"
    />
  );
}

// AvatarImage component
interface AvatarImageProps {
  src?: string;
  alt: string;
  size?: 'small' | 'medium' | 'large';
  fallback?: string;
  className?: string;
}

export function AvatarImage({ src, alt, size = 'medium', fallback, className = '' }: AvatarImageProps) {
  const sizeClasses = {
    small: 'h-8 w-8',
    medium: 'h-12 w-12',
    large: 'h-16 w-16'
  };

  if (!src) {
    return (
      <div className={`${sizeClasses[size]} bg-gray-300 rounded-full flex items-center justify-center ${className}`}>
        <span className="text-gray-600 text-sm font-medium">
          {fallback || alt.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`${sizeClasses[size]} object-cover rounded-full ${className}`}
      loading="lazy"
    />
  );
}

// HeroImage component
interface HeroImageProps {
  src: string;
  alt: string;
  className?: string;
  children?: React.ReactNode;
}

export function HeroImage({ src, alt, className = '', children }: HeroImageProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        loading="eager"
      />
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}