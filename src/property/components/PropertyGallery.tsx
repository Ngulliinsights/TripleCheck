import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent } from '../../shared/components/ui/card';
import { Button } from '../../shared/components/ui/button';
import { Badge } from '../../shared/components/ui/badge';
import { ChevronLeft, ChevronRight, X, Maximize2, Download, Share2, ZoomIn, ZoomOut, RotateCw, Move, Eye, GripVertical } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '../../shared/components/ui/dialog';
import { OptimizedImage } from '../../shared/components/ui/optimized-image';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Skeleton } from '../../shared/components/ui/skeleton';
import { useToast } from '../../shared/hooks/use-toast';

interface PropertyImage {
  id: string;
  url: string;
  webpUrl?: string;
  alt: string;
  caption?: string;
  type: 'exterior' | 'interior' | 'amenity' | 'floorplan' | 'virtual-tour';
  is360?: boolean;
  thumbnailUrl?: string;
}

interface PropertyGalleryProps {
  images: PropertyImage[];
  propertyTitle: string;
  onImageClick?: (image: PropertyImage, index: number) => void;
  onDownload?: (image: PropertyImage) => void;
  onShare?: (image: PropertyImage) => void;
  onImageReorder?: (newOrder: PropertyImage[]) => void;
  allowEdit?: boolean;
  showThumbnails?: boolean;
  enableVirtualTour?: boolean;
  lazyLoading?: boolean;
  className?: string;
}

// Sortable thumbnail component
interface SortableThumbnailProps {
  image: PropertyImage;
  index: number;
  isSelected: boolean;
  onSelect: (index: number) => void;
  allowEdit: boolean;
}

function SortableThumbnail({ image, index, isSelected, onSelect, allowEdit }: SortableThumbnailProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
        isDragging ? 'opacity-50 z-50' : ''
      } ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-200'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <button
        type="button"
        className="w-full h-full relative"
        onClick={() => onSelect(index)}
        aria-label={`View image ${index + 1}: ${image.alt}`}
      >
        <OptimizedImage
          src={image.thumbnailUrl || image.url}
          {...(image.webpUrl && { webpSrc: image.webpUrl })}
          alt={image.alt}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors" />
        
        {/* Virtual tour indicator */}
        {image.is360 && (
          <div className="absolute top-1 right-1">
            <Badge variant="secondary" className="text-xs bg-blue-500 text-white">
              360°
            </Badge>
          </div>
        )}
      </button>
      
      {/* Drag handle for editing mode */}
      {allowEdit && (
        <div
          {...attributes}
          {...listeners}
          className="absolute top-1 left-1 p-1 bg-white/80 rounded cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-3 w-3 text-gray-600" />
        </div>
      )}
    </div>
  );
}

// Enhanced fullscreen viewer component
interface FullscreenViewerProps {
  image: PropertyImage;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  hasMultiple: boolean;
  currentIndex: number;
  totalImages: number;
}

function FullscreenViewer({ 
  image, 
  onClose, 
  onPrevious, 
  onNext, 
  hasMultiple, 
  currentIndex, 
  totalImages 
}: FullscreenViewerProps) {
  const [isLoading, setIsLoading] = useState(true);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft' && hasMultiple) {
      onPrevious();
    } else if (event.key === 'ArrowRight' && hasMultiple) {
      onNext();
    } else if (event.key === 'Escape') {
      onClose();
    }
  }, [onPrevious, onNext, onClose, hasMultiple]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="relative w-full h-full bg-black">
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Skeleton className="w-full h-full" />
        </div>
      )}

      {/* Zoom and pan wrapper */}
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={5}
        centerOnInit
        wheel={{ step: 0.1 }}
        doubleClick={{ mode: 'zoomIn', step: 0.7 }}
      >
        {({ zoomIn, zoomOut, resetTransform, centerView }) => (
          <>
            {/* Zoom controls */}
            <div className="absolute top-4 left-4 z-10 flex flex-col space-y-2">
              <Button
                variant="secondary"
                size="icon"
                className="bg-black/50 hover:bg-black/70 text-white"
                onClick={() => zoomIn()}
                aria-label="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="bg-black/50 hover:bg-black/70 text-white"
                onClick={() => zoomOut()}
                aria-label="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="bg-black/50 hover:bg-black/70 text-white"
                onClick={() => resetTransform()}
                aria-label="Reset zoom"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>

            {/* Navigation arrows */}
            {hasMultiple && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white z-10"
                  onClick={onPrevious}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white z-10"
                  onClick={onNext}
                  aria-label="Next image"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}

            {/* Close button */}
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white"
              onClick={onClose}
              aria-label="Close fullscreen"
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Image counter */}
            {hasMultiple && (
              <div className="absolute bottom-4 right-4 z-10">
                <Badge className="bg-black/50 text-white">
                  {currentIndex + 1} / {totalImages}
                </Badge>
              </div>
            )}

            {/* Transform component with image */}
            <TransformComponent
              wrapperClass="w-full h-full"
              contentClass="w-full h-full flex items-center justify-center"
            >
              {image.is360 ? (
                // 360° virtual tour placeholder - would integrate with actual 360 viewer
                <div className="relative w-full h-full flex items-center justify-center">
                  <OptimizedImage
                    src={image.url}
                    {...(image.webpUrl && { webpSrc: image.webpUrl })}
                    alt={image.alt}
                    className="max-w-full max-h-full object-contain"
                    onLoad={() => setIsLoading(false)}
                  />
                  <div className="absolute top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white">
                      <Eye className="h-3 w-3 mr-1" />
                      360° Virtual Tour
                    </Badge>
                  </div>
                </div>
              ) : (
                <OptimizedImage
                  src={image.url}
                  {...(image.webpUrl && { webpSrc: image.webpUrl })}
                  alt={image.alt}
                  className="max-w-full max-h-full object-contain"
                  onLoad={() => setIsLoading(false)}
                />
              )}
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  );
}

export function PropertyGallery({
  images,
  propertyTitle,
  onImageClick,
  onDownload,
  onShare,
  onImageReorder,
  allowEdit = false,
  showThumbnails = true,
  enableVirtualTour = true,
  lazyLoading = true,
  className = '',
}: PropertyGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [orderedImages, setOrderedImages] = useState(images);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Update ordered images when images prop changes
  useEffect(() => {
    setOrderedImages(images);
  }, [images]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handlePrevious = useCallback(() => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : orderedImages.length - 1));
  }, [orderedImages.length]);

  const handleNext = useCallback(() => {
    setSelectedIndex((prev) => (prev < orderedImages.length - 1 ? prev + 1 : 0));
  }, [orderedImages.length]);

  const handleImageSelect = useCallback((index: number) => {
    setSelectedIndex(index);
    const image = orderedImages[index];
    if (image) {
      onImageClick?.(image, index);
    }
  }, [orderedImages, onImageClick]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = orderedImages.findIndex((img) => img.id === active.id);
      const newIndex = orderedImages.findIndex((img) => img.id === over.id);

      const newOrder = arrayMove(orderedImages, oldIndex, newIndex);
      setOrderedImages(newOrder);
      onImageReorder?.(newOrder);

      // Update selected index if the selected image was moved
      if (oldIndex === selectedIndex) {
        setSelectedIndex(newIndex);
      } else if (oldIndex < selectedIndex && newIndex >= selectedIndex) {
        setSelectedIndex(selectedIndex - 1);
      } else if (oldIndex > selectedIndex && newIndex <= selectedIndex) {
        setSelectedIndex(selectedIndex + 1);
      }

      toast({
        title: "Images reordered",
        description: "The image order has been updated successfully.",
      });
    }
  }, [orderedImages, selectedIndex, onImageReorder]);

  const handleImageLoad = useCallback((imageId: string) => {
    setLoadedImages(prev => new Set(prev).add(imageId));
  }, []);

  const handleShare = useCallback(async (image: PropertyImage) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${propertyTitle} - ${image.alt}`,
          text: image.caption || `Image from ${propertyTitle}`,
          url: image.url,
        });
      } catch (error) {
        // Fallback to copying URL to clipboard
        await navigator.clipboard.writeText(image.url);
        toast({
          title: "Link copied",
          description: "Image link has been copied to clipboard.",
        });
      }
    } else {
      // Fallback for browsers without Web Share API
      await navigator.clipboard.writeText(image.url);
      toast({
        title: "Link copied",
        description: "Image link has been copied to clipboard.",
      });
    }
    onShare?.(image);
  }, [propertyTitle, onShare]);

  const getTypeColor = (type: PropertyImage['type']) => {
    switch (type) {
      case 'exterior': return 'bg-blue-100 text-blue-800';
      case 'interior': return 'bg-green-100 text-green-800';
      case 'amenity': return 'bg-purple-100 text-purple-800';
      case 'floorplan': return 'bg-orange-100 text-orange-800';
      case 'virtual-tour': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (orderedImages.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-gray-500">No images available</p>
        </CardContent>
      </Card>
    );
  }

  const currentImage = orderedImages[selectedIndex];

  if (!currentImage) {
    return <div>No image available</div>;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Image Display */}
      <Card>
        <CardContent className="p-0 relative">
          <div className="relative aspect-[16/10] overflow-hidden rounded-lg">
            {/* Loading skeleton */}
            {!loadedImages.has(currentImage.id) && (
              <div className="absolute inset-0 z-10">
                <Skeleton className="w-full h-full" />
              </div>
            )}

            <OptimizedImage
              src={currentImage.url}
              {...(currentImage.webpUrl && { webpSrc: currentImage.webpUrl })}
              alt={currentImage.alt}
              className="w-full h-full object-cover"
              loading={lazyLoading ? 'lazy' : 'eager'}
              onLoad={() => handleImageLoad(currentImage.id)}
            />
            
            {/* Virtual tour indicator */}
            {currentImage.is360 && enableVirtualTour && (
              <div className="absolute top-4 left-4">
                <Badge className="bg-blue-500 text-white">
                  <Eye className="h-3 w-3 mr-1" />
                  360° Tour
                </Badge>
              </div>
            )}

            {/* Image Type Badge */}
            <div className={`absolute ${currentImage.is360 ? 'top-12' : 'top-4'} left-4`}>
              <Badge className={getTypeColor(currentImage.type)}>
                {currentImage.type.charAt(0).toUpperCase() + currentImage.type.slice(1).replace('-', ' ')}
              </Badge>
            </div>

            {/* Navigation Arrows */}
            {orderedImages.length > 1 && (
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
                  <FullscreenViewer
                    image={currentImage}
                    onClose={() => setIsFullscreen(false)}
                    onPrevious={handlePrevious}
                    onNext={handleNext}
                    hasMultiple={orderedImages.length > 1}
                    currentIndex={selectedIndex}
                    totalImages={orderedImages.length}
                  />
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

              <Button
                variant="secondary"
                size="icon"
                className="bg-white/80 hover:bg-white"
                onClick={() => handleShare(currentImage)}
                aria-label="Share image"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Image Counter */}
            <div className="absolute bottom-4 right-4">
              <Badge variant="secondary" className="bg-black/50 text-white">
                {selectedIndex + 1} / {orderedImages.length}
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

      {/* Thumbnail Grid with Drag and Drop */}
      {showThumbnails && orderedImages.length > 1 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={orderedImages.map(img => img.id)} strategy={verticalListSortingStrategy}>
            <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
              {orderedImages.map((image, index) => (
                <SortableThumbnail
                  key={image.id}
                  image={image}
                  index={index}
                  isSelected={index === selectedIndex}
                  onSelect={handleImageSelect}
                  allowEdit={allowEdit}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}