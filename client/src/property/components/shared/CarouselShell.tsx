import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react"
import React, { useCallback, useEffect, useState } from "react"

import { Card } from "../../../local/components/ui/card"
import { cn } from "../../../local/lib/utils"

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
  /** Tailwind class for the active slide dot (e.g. `"bg-primary"` or `"bg-green-600"`). */
  activeDotClass?: string
  /** Tailwind classes applied to the nav icon buttons. */
  navButtonClass?: string
  children: React.ReactNode
}

export const CarouselShell = ({
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
}: CarouselShellProps) => (
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
              className={cn("p-2 rounded-full transition-colors", navButtonClass)}
              aria-label={isAutoPlaying ? "Pause slideshow" : "Play slideshow"}
            >
              {isAutoPlaying ? (
                <Pause className="w-4 h-4" aria-hidden />
              ) : (
                <Play className="w-4 h-4" aria-hidden />
              )}
            </button>

            <button
              onClick={onPrev}
              className={cn("p-2 rounded-full transition-colors", navButtonClass)}
              aria-label="Previous slide"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden />
            </button>

            <span className="text-sm text-gray-500" aria-live="polite" aria-atomic>
              {currentSlide + 1} / {totalSlides}
            </span>

            <button
              onClick={onNext}
              className={cn("p-2 rounded-full transition-colors", navButtonClass)}
              aria-label="Next slide"
            >
              <ArrowRight className="w-4 h-4" aria-hidden />
            </button>
          </div>
        )}
      </div>

      {/* Cards grid — pause auto-play on hover */}
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label={typeof title === "string" ? title : "Carousel"}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {children}
      </div>

      {/* Slide indicators */}
      {totalSlides > 1 && (
        <div className="flex justify-center mt-4 gap-2" role="tablist" aria-label="Slides">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button
              key={index}
              role="tab"
              onClick={() => onSlideChange(index)}
              aria-label={`Go to slide ${index + 1}`}
              aria-selected={index === currentSlide}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                index === currentSlide ? activeDotClass : "bg-gray-300"
              )}
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
  /** `[startIndex, endIndex]` to pass into `Array.slice`. */
  currentSliceRange: [number, number]
  handlePrev: () => void
  handleNext: () => void
  handleSlideChange: (index: number) => void
  handleToggleAutoPlay: () => void
  /** Pass to the carousel container's `onMouseEnter` to pause auto-play. */
  handleMouseEnter: () => void
  /** Pass to the carousel container's `onMouseLeave` to resume auto-play. */
  handleMouseLeave: () => void
}

export function useCarousel({
  totalItems,
  itemsPerSlide = 3,
  autoPlayInterval = 4000,
}: UseCarouselOptions): UseCarouselReturn {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  const totalSlides = Math.max(0, Math.ceil(totalItems / itemsPerSlide))

  // Manual navigation stops auto-play so the user's chosen position persists.
  const handlePrev = useCallback(() => {
    if (totalSlides === 0) return
    setCurrentSlide(prev => (prev > 0 ? prev - 1 : totalSlides - 1))
    setIsAutoPlaying(false)
  }, [totalSlides])

  const handleNext = useCallback(() => {
    if (totalSlides === 0) return
    setCurrentSlide(prev => (prev < totalSlides - 1 ? prev + 1 : 0))
    setIsAutoPlaying(false)
  }, [totalSlides])

  const handleSlideChange = useCallback((index: number) => {
    setCurrentSlide(index)
    setIsAutoPlaying(false)
  }, [])

  const handleToggleAutoPlay = useCallback(() => {
    setIsAutoPlaying(prev => !prev)
  }, [])

  // Hover pauses without permanently stopping auto-play.
  const handleMouseEnter = useCallback(() => setIsAutoPlaying(false), [])
  const handleMouseLeave = useCallback(() => setIsAutoPlaying(true), [])

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
    handleToggleAutoPlay,
    handleMouseEnter,
    handleMouseLeave,
  }
}