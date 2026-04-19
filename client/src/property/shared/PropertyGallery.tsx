/**
 * shared/PropertyGallery.tsx
 *
 * Shared image gallery and carousel shell used by PropertyDetails and LandDetails.
 * Avoids duplicating ~250 lines of nearly-identical component logic.
 */

import { ArrowLeft, Pause, Play, X, ZoomIn } from "lucide-react"
import React, { useCallback, useEffect, useState } from "react"
import { Card } from "../../local/components/ui/card"

// ---------------------------------------------------------------------------
// Shared constant
// ---------------------------------------------------------------------------

export const NOT_SPECIFIED = "Not specified"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GalleryImage {
  id: string
  src: string
  alt: string
  category: string
}

// ---------------------------------------------------------------------------
// ImageGallery
// ---------------------------------------------------------------------------

interface PropertyImageGalleryProps {
  images: GalleryImage[]
  /** Emoji shown when image list is empty. */
  emptyIcon?: string
  /** Text shown when image list is empty. */
  emptyText?: string
  /** Tailwind border class applied to the active thumbnail. */
  activeThumbnailClass?: string
  /** Optional icon rendered before the counter (e.g. <TreePine />). */
  counterIcon?: React.ReactNode
}

/**
 * @deprecated Use ImageGallery or AdvancedGallery from `local/components/images/gallery` instead.
 * This component is maintained for backward compatibility with older pages but will be removed
 * in a future architectural update to consolidate image viewing infrastructure.
 */
export const PropertyImageGallery: React.FC<PropertyImageGalleryProps> = ({
  images,
  emptyIcon = "📷",
  emptyText = "No images available",
  activeThumbnailClass = "border-primary",
  counterIcon,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [showFullscreen, setShowFullscreen] = useState(false)

  // Use functional updater so handlePrevious / handleNext never go stale.
  const handlePrevious = useCallback(() => {
    setSelectedIndex(prev => (prev > 0 ? prev - 1 : images.length - 1))
  }, [images.length])

  const handleNext = useCallback(() => {
    setSelectedIndex(prev => (prev < images.length - 1 ? prev + 1 : 0))
  }, [images.length])

  // Functional updater removes showFullscreen from the dependency list.
  const toggleFullscreen = useCallback(() => {
    setShowFullscreen(prev => !prev)
  }, [])

  useEffect(() => {
    if (!showFullscreen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowFullscreen(false)
      else if (e.key === "ArrowLeft") handlePrevious()
      else if (e.key === "ArrowRight") handleNext()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [showFullscreen, handlePrevious, handleNext])

  const selectedImage = images[selectedIndex]

  if (images.length === 0 || !selectedImage) {
    return (
      <Card className="p-8 text-center">
        <div className="text-gray-400 text-4xl mb-2">{emptyIcon}</div>
        <p className="text-gray-500">{emptyText}</p>
      </Card>
    )
  }

  const counter = (
    <div className="flex items-center gap-2">
      {counterIcon}
      {selectedIndex + 1} of {images.length}
    </div>
  )

  return (
    <div className="space-y-4">
      {/* ── Main display ── */}
      <Card className="overflow-hidden">
        <div className="relative aspect-video bg-gray-100">
          <img
            src={selectedImage.src}
            alt={selectedImage.alt}
            className="w-full h-full object-cover"
          />

          {images.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
                aria-label="Previous image"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
                aria-label="Next image"
              >
                <ArrowLeft className="w-5 h-5 rotate-180" />
              </button>
            </>
          )}

          <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
            {counter}
          </div>

          <button
            onClick={toggleFullscreen}
            className="absolute top-4 right-4 p-2 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
            aria-label="View fullscreen"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </Card>

      {/* ── Thumbnail strip ── */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedIndex(index)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                index === selectedIndex
                  ? `${activeThumbnailClass} shadow-md`
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* ── Fullscreen modal ── */}
      {showFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/95">
          <div className="relative w-full h-full flex items-center justify-center">
            <button
              onClick={() => setShowFullscreen(false)}
              className="absolute top-12 left-1/2 -translate-x-1/2 z-50 p-3 bg-black/90 backdrop-blur-sm text-white rounded-full hover:bg-red-600 transition-all duration-200 shadow-xl border-2 border-white/20 hover:border-red-400"
              aria-label="Close fullscreen"
            >
              <X className="w-6 h-6" />
            </button>

            <img
              src={selectedImage.src}
              alt={selectedImage.alt}
              className="max-w-full max-h-full object-contain"
            />

            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
                  aria-label="Previous image"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
                  aria-label="Next image"
                >
                  <ArrowLeft className="w-6 h-6 rotate-180" />
                </button>
              </>
            )}

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm">
              {counter}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// CarouselShell
//
// Provides navigation controls, auto-play, slide indicators, and pause-on-
// hover. The caller supplies the card grid via `children`.
// ---------------------------------------------------------------------------

interface CarouselShellProps {
  /** Rendered inside the header section (e.g. icon + title). */
  title: React.ReactNode
  subtitle?: string
  totalSlides: number
  currentSlide: number
  isAutoPlaying: boolean
  onSlideChange: (index: number) => void
  onPrev: () => void
  onNext: () => void
  onToggleAutoPlay: () => void
  onMouseEnter: () => void
  onMouseLeave: () => void
  /** Tailwind class for the active slide dot (e.g. "bg-primary" or "bg-green-600"). */
  activeDotClass?: string
  /** Tailwind classes applied to the nav icon buttons. */
  navButtonClass?: string
  children: React.ReactNode
}

/**
 * @deprecated Use generic carousel components provided by the shared gallery suite.
 */
export const CarouselShell: React.FC<CarouselShellProps> = ({
  title,
  subtitle,
  totalSlides,
  currentSlide,
  isAutoPlaying,
  onSlideChange,
  onPrev,
  onNext,
  onToggleAutoPlay,
  onMouseEnter,
  onMouseLeave,
  activeDotClass = "bg-primary",
  navButtonClass = "bg-gray-100 hover:bg-gray-200",
  children,
}) => (
  <div className="mt-8">
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>

        {totalSlides > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleAutoPlay}
              className={`p-2 rounded-full ${navButtonClass} transition-colors`}
              aria-label={isAutoPlaying ? "Pause slideshow" : "Play slideshow"}
            >
              {isAutoPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={onPrev}
              className={`p-2 rounded-full ${navButtonClass} transition-colors`}
              aria-label="Previous slide"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-500">
              {currentSlide + 1} / {totalSlides}
            </span>
            <button
              onClick={onNext}
              className={`p-2 rounded-full ${navButtonClass} transition-colors`}
              aria-label="Next slide"
            >
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </button>
          </div>
        )}
      </div>

      {/* Cards grid — pause auto-play on hover */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {children}
      </div>

      {/* Slide indicators */}
      {totalSlides > 1 && (
        <div className="flex justify-center mt-4 gap-2">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button
              key={index}
              onClick={() => onSlideChange(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentSlide ? activeDotClass : "bg-gray-300"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </Card>
  </div>
)

// ---------------------------------------------------------------------------
// useCarousel — shared carousel state and logic
// ---------------------------------------------------------------------------

interface UseCarouselOptions {
  totalItems: number
  itemsPerSlide?: number
  autoPlayInterval?: number
}

interface UseCarouselReturn {
  currentSlide: number
  totalSlides: number
  isAutoPlaying: boolean
  currentSliceRange: [number, number]
  handlePrev: () => void
  handleNext: () => void
  handleSlideChange: (index: number) => void
  setIsAutoPlaying: React.Dispatch<React.SetStateAction<boolean>>
}

/**
 * @deprecated Please use built-in state tools within AdvancedGallery.
 */
export function useCarousel({
  totalItems,
  itemsPerSlide = 3,
  autoPlayInterval = 4000,
}: UseCarouselOptions): UseCarouselReturn {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  const totalSlides = Math.ceil(totalItems / itemsPerSlide)

  const handleSlideChange = useCallback((index: number) => {
    setCurrentSlide(index)
    setIsAutoPlaying(false)
  }, [])

  const handlePrev = useCallback(() => {
    setCurrentSlide(prev => (prev > 0 ? prev - 1 : totalSlides - 1))
    setIsAutoPlaying(false)
  }, [totalSlides])

  const handleNext = useCallback(() => {
    setCurrentSlide(prev => (prev < totalSlides - 1 ? prev + 1 : 0))
    setIsAutoPlaying(false)
  }, [totalSlides])

  useEffect(() => {
    if (!isAutoPlaying || totalSlides <= 1) return
    const id = setInterval(() => {
      setCurrentSlide(prev => (prev < totalSlides - 1 ? prev + 1 : 0))
    }, autoPlayInterval)
    return () => clearInterval(id)
  }, [isAutoPlaying, totalSlides, autoPlayInterval])

  return {
    currentSlide,
    totalSlides,
    isAutoPlaying,
    currentSliceRange: [
      currentSlide * itemsPerSlide,
      (currentSlide + 1) * itemsPerSlide,
    ],
    handlePrev,
    handleNext,
    handleSlideChange,
    setIsAutoPlaying,
  }
}
