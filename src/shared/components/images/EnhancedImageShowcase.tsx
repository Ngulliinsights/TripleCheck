import {
  ChevronLeft,
  ChevronRight,
  X,
  Play,
  Pause,
  ZoomIn,
  Download,
  Share2,
  Grid,
  Maximize2,
} from 'lucide-react';
import React, { useState, useCallback } from 'react';

import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

interface EnhancedImageShowcaseProps {
  images: string[];
  title: string;
  className?: string;
  maxPreviewImages?: number;
  aspectRatio?: 'square' | 'video' | 'wide' | 'tall';
  enableDownload?: boolean;
  enableShare?: boolean;
  onImageClick?: (index: number) => void;
}

/**
 * Enhanced Image Showcase Component
 * Provides a better visual presentation for property images with larger previews
 * and improved user interaction
 */
export function EnhancedImageShowcase({
  images,
  title,
  className = '',
  maxPreviewImages = 6,
  aspectRatio = 'video',
  enableDownload = false,
  enableShare = false,
  onImageClick,
}: EnhancedImageShowcaseProps) {
  const [currentMainImage, setCurrentMainImage] = useState(0);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(false);

  const aspectRatioClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    wide: 'aspect-[21/9]',
    tall: 'aspect-[3/4]',
  };

  const handleImageClick = useCallback((index: number) => {
    onImageClick?.(index);
    setFullscreenIndex(index);
    setIsFullscreenOpen(true);
  }, [onImageClick]);

  const handleMainImageChange = useCallback((index: number) => {
    setCurrentMainImage(index);
  }, []);

  const handleFullscreenClose = useCallback(() => {
    setIsFullscreenOpen(false);
    setIsAutoplay(false);
  }, []);

  const handleFullscreenNext = useCallback(() => {
    setFullscreenIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const handleFullscreenPrev = useCallback(() => {
    setFullscreenIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${title} - Image Gallery`,
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled or error occurred
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  }, [title]);

  const handleDownload = useCallback(() => {
    const link = document.createElement('a');
    link.href = images[currentMainImage];
    link.download = `${title}-image-${currentMainImage + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [images, currentMainImage, title]);

  if (!images || images.length === 0) {
    return (
