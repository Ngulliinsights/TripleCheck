import { TreePine, MapPin, Image } from 'lucide-react';
import React from 'react';

import { cn } from '../../lib/utils';

interface LandImagePlaceholderProps {
  className?: string;
  landType?: 'agricultural' | 'residential' | 'commercial' | 'industrial';
  showIcon?: boolean;
}

export function LandImagePlaceholder({ 
  className, 
  landType = 'agricultural',
  showIcon = true 
}: LandImagePlaceholderProps) {
  const getIcon = () => {
    switch (landType) {
      case 'agricultural':
        return TreePine;
      case 'residential':
        return MapPin;
      case 'commercial':
        return MapPin;
      case 'industrial':
        return MapPin;
      default:
        return TreePine;
    }
  };

  const getGradient = () => {
    switch (landType) {
      case 'agricultural':
        return 'from-green-100 to-green-200';
      case 'residential':
        return 'from-blue-100 to-blue-200';
      case 'commercial':
        return 'from-purple-100 to-purple-200';
      case 'industrial':
        return 'from-gray-100 to-gray-200';
      default:
        return 'from-green-100 to-green-200';
    }
  };

  const getIconColor = () => {
    switch (landType) {
      case 'agricultural':
        return 'text-green-500';
      case 'residential':
        return 'text-blue-500';
      case 'commercial':
        return 'text-purple-500';
      case 'industrial':
        return 'text-gray-500';
      default:
        return 'text-green-500';
    }
  };

  const Icon = getIcon();

  return (
    <div 
      className={cn(
        'flex flex-col items-center justify-center bg-gradient-to-br',
        getGradient(),
        'border border-border/50',
        className
      )}
    >
      {showIcon && (
        <>
          <Icon className={cn('w-12 h-12 mb-2', getIconColor())} />
          <span className="text-sm font-medium text-muted-foreground capitalize">
            {landType} Land
          </span>
        </>
      )}
      {!showIcon && (
        <Image className="w-8 h-8 text-muted-foreground/50" />
      )}
    </div>
  );
}