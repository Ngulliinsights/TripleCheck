import React, { useState, useCallback } from 'react';
import { Card, CardContent } from '../../shared/components/ui/card';
import { Button } from '../../shared/components/ui/button';
import { Badge } from '../../shared/components/ui/badge';
import { ChevronLeft, ChevronRight, X, Maximize2, Download, Share2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '../../shared/components/ui/dialog';

interface PropertyImage {
  id: string;
  url: string;
  alt: string;
  caption?: string;
  type: 'exterior' | 'interior' | 'amenity' | 'floorplan';
}

interface PropertyGalleryProps {
  images: PropertyImage[];
  propertyTitle: string;
  onImageClick?: (image: PropertyImage, index: number) => void;
  onDownload?: (image: PropertyImage) => void;
  onShare?: (image: PropertyImage) => void;
  className?: string;
}

export function PropertyGallery({
  images,
  propertyTitle,
  onImageClick,
  onDownload,
  onShare,
  className = '',
}: PropertyGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handlePrevious = useCallback(() => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setSelectedIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  const handleImageSelect = useCallback((index: number) => {
    setSelectedIndex(index);
    const image = images[index];
    onImageClick?.(image, index);
  }, [images, onImageClick]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'ArrowLeft') {
      handlePrevious();
    } else if (event.key === 'ArrowRight') {
      handleNext();
    } else if (event.key === 'Escape') {
      setIsFullscreen(false);
    }
  }, [handlePrevious, handleNext]);

  const getTypeColor = (type: PropertyImage['type']) => {
    switch (type) {
      case 'exterior': return 'bg-blue-100 text-blue-800';
      case 'interior': return 'bg-green-100 text-green-800';
      case 'amenity': return 'bg-purple-100 text-purple-800';
      case 'floorplan': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (images.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-gray-500">No images available</p>
        </CardContent>
      </Card>
    );
  }

  const currentImage = images[selectedIndex];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Image Display */}
      <Card>
        <CardContent className="p-0 relative">
          <div className="relative aspect-[16/10] overflow-hidden rounded-lg">
            <img
              src={currentImage.url}
              alt={currentImage.alt}
              className="w-full h-full object-cover"
            />
            
            {/* Image Type Badge */}
            <div className="absolute top-4 left-4">
              <Badge className={getTypeColor(currentImage.type)}>
                {currentImage.type.charAt(0).toUpperCase() + currentImage.type.slice(1)}
              </Badge>
            </div>

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
                  onClick={handlePrevious}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
                  onClick={handleNext}
                  aria-label="Next image"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}

            {/* Action Buttons */}
            <div className="absolute top-4 right-4 flex space-x-2">
              <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
                <DialogTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="bg-white/80 hover:bg-white"
                    aria-label="View fullscreen"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-7xl w-full h-full p-0">
                  <div className="relative w-full h-full" onKeyDown={handleKeyDown} tabIndex={0}>
                    <img
                      src={currentImage.url}
                      alt={currentImage.alt}
                      className="w-full h-full object-contain"
                    />
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute top-4 right-4"
                      onClick={() => setIsFullscreen(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {onDownload && (
                <Button
                  variant="secondary"
                  size="icon"
                  className="bg-white/80 hover:bg-white"
                  onClick={() => onDownload(currentImage)}
                  aria-label="Download image"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}

              {onShare && (
                <Button
                  variant="secondary"
                  size="icon"
                  className="bg-white/80 hover:bg-white"
                  onClick={() => onShare(currentImage)}
                  aria-label="Share image"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Image Counter */}
            <div className="absolute bottom-4 right-4">
              <Badge variant="secondary" className="bg-black/50 text-white">
                {selectedIndex + 1} / {images.length}
              </Badge>
            </div>
          </div>

          {/* Image Caption */}
          {currentImage.caption && (
            <div className="p-4">
              <p className="text-sm text-gray-600">{currentImage.caption}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Thumbnail Grid */}
      {images.length > 1 && (
        <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                index === selectedIndex
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleImageSelect(index)}
              aria-label={`View image ${index + 1}: ${image.alt}`}
            >
              <img
                src={image.url}
                alt={image.alt}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}