import {
  ChevronLeft,
  ChevronRight,
  X,
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  Download,
  Share2,
  Grid,
  Maximize2,
  RefreshCw,
  Info,
} from 'lucide-react'
import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import type { ReactZoomPanPinchContentRef } from 'react-zoom-pan-pinch'

import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { cn } from '@/local/lib/utils'

// ─── Constants ────────────────────────────────────────────────────────────────

const ASPECT_RATIO_CLASSES = {
  square: 'aspect-square',
  video: 'aspect-video',
  wide: 'aspect-[21/9]',
  tall: 'aspect-[3/4]',
} as const

// ─── Types ────────────────────────────────────────────────────────────────────

interface EnhancedImageShowcaseProps {
  images: string[]
  title: string
  className?: string
  maxPreviewImages?: number
  aspectRatio?: keyof typeof ASPECT_RATIO_CLASSES
  enableDownload?: boolean
  enableShare?: boolean
  enableZoom?: boolean
  enableAutoplay?: boolean
  autoplayInterval?: number
  showImageCounter?: boolean
  showThumbnails?: boolean
  onImageClick?: (index: number) => void
  onDownload?: (index: number, url: string) => void
  onShare?: (index: number, url: string) => void
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

interface LoadingSpinnerProps {
  className?: string
}

function LoadingSpinner({ className }: LoadingSpinnerProps) {
  return (
    <div
      aria-label="Loading image"
      className={cn(
        'w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin',
        className,
      )}
    />
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * Enhanced Image Showcase Component
 *
 * Provides a polished visual presentation for image collections with:
 * - Main image display with hover actions and cyclic navigation
 * - Thumbnail strip for quick access
 * - Full-screen lightbox with zoom, autoplay, and keyboard navigation
 */
export function EnhancedImageShowcase({
  images,
  title,
  className = '',
  maxPreviewImages = 6,
  aspectRatio = 'video',
  enableDownload = true,
  enableShare = true,
  enableZoom = true,
  enableAutoplay = true,
  autoplayInterval = 3000,
  showImageCounter = true,
  showThumbnails = true,
  onImageClick,
  onDownload,
  onShare,
}: EnhancedImageShowcaseProps) {
  const [currentMainImage, setCurrentMainImage] = useState(0)
  const [isMainLoading, setIsMainLoading] = useState(true)

  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [isLightboxLoading, setIsLightboxLoading] = useState(true)

  const [isAutoplay, setIsAutoplay] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  const autoplayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const total = images.length

  // ── Derived values ──────────────────────────────────────────────────────────

  const visibleThumbnails = useMemo(
    () => (showThumbnails ? images.slice(0, maxPreviewImages) : []),
    [showThumbnails, images, maxPreviewImages],
  )
  const hasMoreImages = total > maxPreviewImages

  // ── Autoplay ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isAutoplay || !isLightboxOpen) {
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current)
        autoplayTimerRef.current = null
      }
      return
    }

    autoplayTimerRef.current = setInterval(() => {
      setLightboxIndex((prev) => (prev + 1) % total)
      setIsLightboxLoading(true)
    }, autoplayInterval)

    return () => {
      if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current)
    }
  }, [isAutoplay, isLightboxOpen, total, autoplayInterval])

  // ── Handlers ────────────────────────────────────────────────────────────────

  const openLightbox = useCallback(
    (index: number) => {
      onImageClick?.(index)
      setLightboxIndex(index)
      setIsLightboxLoading(true)
      setIsLightboxOpen(true)
      setIsAutoplay(false)
    },
    [onImageClick],
  )

  const closeLightbox = useCallback(() => {
    setIsLightboxOpen(false)
    setIsAutoplay(false)
    setShowInfo(false)
  }, [])

  const goToMain = useCallback((index: number) => {
    setCurrentMainImage(index)
    setIsMainLoading(true)
  }, [])

  const prevMain = useCallback(
    () => goToMain((currentMainImage - 1 + total) % total),
    [currentMainImage, total, goToMain],
  )
  const nextMain = useCallback(
    () => goToMain((currentMainImage + 1) % total),
    [currentMainImage, total, goToMain],
  )

  const goToLightbox = useCallback((index: number) => {
    setLightboxIndex(index)
    setIsLightboxLoading(true)
  }, [])

  const prevLightbox = useCallback(
    () => goToLightbox((lightboxIndex - 1 + total) % total),
    [lightboxIndex, total, goToLightbox],
  )
  const nextLightbox = useCallback(
    () => goToLightbox((lightboxIndex + 1) % total),
    [lightboxIndex, total, goToLightbox],
  )

  const toggleAutoplay = useCallback(() => setIsAutoplay((prev) => !prev), [])

  const handleShare = useCallback(
    async (index: number) => {
      const imageUrl = images[index]
      if (onShare) {
        onShare(index, imageUrl)
        return
      }
      if (navigator.share) {
        try {
          await navigator.share({
            title: `${title} — Image ${index + 1}`,
            text: `Check out this image from ${title}`,
            url: window.location.href,
          })
        } catch {
          // User cancelled or share failed — no-op
        }
      } else {
        try {
          await navigator.clipboard.writeText(window.location.href)
        } catch {
          // Clipboard unavailable — no-op
        }
      }
    },
    [images, title, onShare],
  )

  const handleDownload = useCallback(
    (index: number) => {
      const imageUrl = images[index]
      if (onDownload) {
        onDownload(index, imageUrl)
        return
      }
      const link = document.createElement('a')
      link.href = imageUrl
      link.download = `${title.replace(/\s+/g, '-').toLowerCase()}-image-${index + 1}.jpg`
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    },
    [images, title, onDownload],
  )

  // ── Keyboard navigation ─────────────────────────────────────────────────────

  // Use refs so the effect never needs to re-register due to handler identity changes
  const prevLightboxRef = useRef(prevLightbox)
  const nextLightboxRef = useRef(nextLightbox)
  const closeLightboxRef = useRef(closeLightbox)
  prevLightboxRef.current = prevLightbox
  nextLightboxRef.current = nextLightbox
  closeLightboxRef.current = closeLightbox

  useEffect(() => {
    if (!isLightboxOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          closeLightboxRef.current()
          break
        case 'ArrowLeft':
          prevLightboxRef.current()
          break
        case 'ArrowRight':
          nextLightboxRef.current()
          break
        case ' ':
          e.preventDefault()
          setIsAutoplay((prev) => !prev)
          break
        case 'i':
        case 'I':
          setShowInfo((prev) => !prev)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isLightboxOpen]) // stable — intentionally no handler deps needed

  // ── Guard ───────────────────────────────────────────────────────────────────

  if (!images || total === 0) return null

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Gallery Card ─────────────────────────────────────────────────── */}
      <Card className={cn('overflow-hidden', className)}>
        <CardContent className="p-0">
          {/* Main image */}
          <div className="relative group">
            <div
              className={cn(
                'relative overflow-hidden bg-gray-100',
                ASPECT_RATIO_CLASSES[aspectRatio],
              )}
            >
              {isMainLoading && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse" />
              )}

              <img
                src={images[currentMainImage]}
                alt={`${title} — Image ${currentMainImage + 1} of ${total}`}
                className="w-full h-full object-cover transition-opacity duration-300 cursor-pointer"
                style={{ opacity: isMainLoading ? 0 : 1 }}
                onLoad={() => setIsMainLoading(false)}
                onClick={() => openLightbox(currentMainImage)}
              />

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2 pointer-events-none group-hover:pointer-events-auto">
                <Button
                  variant="secondary"
                  size="icon"
                  className="bg-white/90 hover:bg-white"
                  onClick={() => openLightbox(currentMainImage)}
                  aria-label="Open fullscreen"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>

                {enableDownload && (
                  <Button
                    variant="secondary"
                    size="icon"
                    className="bg-white/90 hover:bg-white"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDownload(currentMainImage)
                    }}
                    aria-label="Download image"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}

                {enableShare && (
                  <Button
                    variant="secondary"
                    size="icon"
                    className="bg-white/90 hover:bg-white"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleShare(currentMainImage)
                    }}
                    aria-label="Share image"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Cyclic navigation arrows */}
              {total > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white"
                    onClick={(e) => {
                      e.stopPropagation()
                      prevMain()
                    }}
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white"
                    onClick={(e) => {
                      e.stopPropagation()
                      nextMain()
                    }}
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}

              {showImageCounter && total > 1 && (
                <div
                  aria-live="polite"
                  className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium select-none"
                >
                  {currentMainImage + 1} / {total}
                </div>
              )}
            </div>
          </div>

          {/* Thumbnail strip */}
          {showThumbnails && total > 1 && (
            <div className="p-4 bg-gray-50">
              <div
                className="flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                role="listbox"
                aria-label="Image thumbnails"
              >
                {visibleThumbnails.map((image, index) => (
                  <button
                    key={index}
                    role="option"
                    aria-selected={currentMainImage === index}
                    aria-label={`View image ${index + 1}`}
                    onClick={() => goToMain(index)}
                    className={cn(
                      'relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden transition-all',
                      'hover:ring-2 hover:ring-primary hover:scale-105',
                      currentMainImage === index
                        ? 'ring-2 ring-primary scale-105'
                        : 'opacity-60',
                    )}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}

                {hasMoreImages && (
                  <button
                    aria-label={`View all ${total} images`}
                    onClick={() => openLightbox(maxPreviewImages)}
                    className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-200 hover:bg-gray-300 transition-all flex items-center justify-center"
                  >
                    <div className="text-center">
                      <Grid className="h-5 w-5 mx-auto mb-1" />
                      <span className="text-xs font-medium">
                        +{total - maxPreviewImages}
                      </span>
                    </div>
                  </button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Lightbox ──────────────────────────────────────────────────────── */}
      {isLightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${title} — lightbox`}
          className="fixed inset-0 z-50 bg-black"
        >
          {/* Backdrop click to close */}
          <div
            className="absolute inset-0"
            onClick={closeLightbox}
            aria-hidden="true"
          />

          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent p-4">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div className="flex items-center gap-4">
                <h2 className="text-white text-lg font-semibold truncate max-w-md">
                  {title}
                </h2>
                {showImageCounter && (
                  <span aria-live="polite" className="text-white/80 text-sm select-none">
                    {lightboxIndex + 1} / {total}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn('text-white hover:bg-white/20', showInfo && 'bg-white/20')}
                  onClick={() => setShowInfo((prev) => !prev)}
                  aria-pressed={showInfo}
                  title="Toggle info (I)"
                >
                  <Info className="h-5 w-5" />
                </Button>

                {enableAutoplay && total > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={toggleAutoplay}
                    aria-pressed={isAutoplay}
                    title={isAutoplay ? 'Pause (Space)' : 'Play (Space)'}
                  >
                    {isAutoplay ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5" />
                    )}
                  </Button>
                )}

                {enableDownload && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={() => handleDownload(lightboxIndex)}
                    title="Download image"
                  >
                    <Download className="h-5 w-5" />
                  </Button>
                )}

                {enableShare && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={() => handleShare(lightboxIndex)}
                    title="Share image"
                  >
                    <Share2 className="h-5 w-5" />
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={closeLightbox}
                  title="Close (Esc)"
                  aria-label="Close lightbox"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Image area */}
          <div
            className="absolute inset-0 flex items-center justify-center pt-20 pb-32"
            onClick={(e) => e.stopPropagation()} // prevent backdrop click on image area
          >
            {enableZoom ? (
              <TransformWrapper
                key={lightboxIndex} // reset zoom on image change
                initialScale={1}
                minScale={0.5}
                maxScale={4}
                centerOnInit
              >
                {({ zoomIn, zoomOut, resetTransform }: ReactZoomPanPinchContentRef) => (
                  <>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2">
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => zoomIn()}
                        className="bg-white/90 hover:bg-white"
                        title="Zoom in"
                        aria-label="Zoom in"
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => zoomOut()}
                        className="bg-white/90 hover:bg-white"
                        title="Zoom out"
                        aria-label="Zoom out"
                      >
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => resetTransform()}
                        className="bg-white/90 hover:bg-white"
                        title="Reset zoom"
                        aria-label="Reset zoom"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>

                    <TransformComponent wrapperClass="w-full h-full flex items-center justify-center">
                      <img
                        src={images[lightboxIndex]}
                        alt={`${title} — Image ${lightboxIndex + 1} of ${total}`}
                        className="max-w-full max-h-full object-contain"
                        style={{ opacity: isLightboxLoading ? 0 : 1, transition: 'opacity 0.2s' }}
                        onLoad={() => setIsLightboxLoading(false)}
                      />
                    </TransformComponent>
                  </>
                )}
              </TransformWrapper>
            ) : (
              <img
                src={images[lightboxIndex]}
                alt={`${title} — Image ${lightboxIndex + 1} of ${total}`}
                className="max-w-full max-h-full object-contain"
                style={{ opacity: isLightboxLoading ? 0 : 1, transition: 'opacity 0.2s' }}
                onLoad={() => setIsLightboxLoading(false)}
              />
            )}
          </div>

          {/* Cyclic navigation arrows */}
          {total > 1 && (
            <>
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-white/90 hover:bg-white"
                onClick={prevLightbox}
                title="Previous (←)"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>

              <Button
                variant="secondary"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-white/90 hover:bg-white"
                onClick={nextLightbox}
                title="Next (→)"
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          {/* Bottom thumbnail strip */}
          {showThumbnails && total > 1 && (
            <div className="absolute bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div
                className="max-w-4xl mx-auto overflow-x-auto scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent"
                role="listbox"
                aria-label="Image thumbnails"
              >
                <div className="flex gap-2 justify-center min-w-max px-2">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      role="option"
                      aria-selected={lightboxIndex === index}
                      aria-label={`View image ${index + 1}`}
                      onClick={() => goToLightbox(index)}
                      className={cn(
                        'relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all',
                        'hover:ring-2 hover:ring-white hover:scale-110',
                        lightboxIndex === index
                          ? 'ring-2 ring-white scale-110'
                          : 'opacity-60',
                      )}
                    >
                      <img
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Info panel */}
          {showInfo && (
            <aside className="absolute right-4 top-24 z-50 w-80 bg-white rounded-lg shadow-xl p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
              <h3 className="font-semibold text-lg mb-3">{title}</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Total images</dt>
                  <dd className="font-medium">{total}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Current image</dt>
                  <dd className="font-medium">{lightboxIndex + 1}</dd>
                </div>
              </dl>

              <div className="mt-4 pt-4 border-t">
                <h4 className="font-medium mb-2">Keyboard shortcuts</h4>
                <dl className="space-y-1 text-xs text-gray-600">
                  {[
                    ['← / →', 'Navigate'],
                    ['Space', 'Play / Pause'],
                    ['I', 'Toggle info'],
                    ['Esc', 'Close'],
                  ].map(([key, label]) => (
                    <div key={key} className="flex justify-between">
                      <dt>
                        <kbd className="font-mono bg-gray-100 px-1 rounded">{key}</kbd>
                      </dt>
                      <dd>{label}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </aside>
          )}

          {/* Loading indicator */}
          {isLightboxLoading && (
            <div
              aria-label="Loading image"
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <LoadingSpinner />
            </div>
          )}
        </div>
      )}
    </>
  )
}