import {
  ChevronLeft,
  ChevronRight,
  Download,
  Share2,
  Grid,
  Maximize2,
} from 'lucide-react'
import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react'

import { Lightbox } from './Lightbox'
import { ImageEngine } from './ImageEngine'
import type { GalleryImage } from './types'

import { Button } from '../../ui/button'
import { Card, CardContent } from '../../ui/card'
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
  /** Passed to Lightbox to enable zoom controls. */
  enableZoom?: boolean
  /** When false, the Space-bar autoplay shortcut is disabled. */
  enableAutoplay?: boolean
  autoplayInterval?: number
  showImageCounter?: boolean
  showThumbnails?: boolean
  onImageClick?: (index: number) => void
  onDownload?: (index: number, url: string) => void
  onShare?: (index: number, url: string) => void
}

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * Enhanced Image Showcase Component
 *
 * Provides a polished visual presentation for image collections with:
 * - Main image display with hover actions and cyclic navigation
 * - Thumbnail strip for quick access
 * - Full-screen lightbox with autoplay and keyboard navigation
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
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [isAutoplay, setIsAutoplay] = useState(false)

  const autoplayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const total = images.length

  // ── Derived values ──────────────────────────────────────────────────────────

  const galleryImages: GalleryImage[] = useMemo(
    () =>
      images.map((src, index) => ({
        id: `showcase-img-${index}`,
        src,
        alt: `${title} — Image ${index + 1} of ${total}`,
      })),
    [images, title, total],
  )

  const visibleThumbnails = useMemo(
    () => (showThumbnails ? galleryImages.slice(0, maxPreviewImages) : []),
    [showThumbnails, galleryImages, maxPreviewImages],
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
      setIsLightboxOpen(true)
      setIsAutoplay(false)
    },
    [onImageClick],
  )

  const closeLightbox = useCallback(() => {
    setIsLightboxOpen(false)
    setIsAutoplay(false)
  }, [])

  const goToMain = useCallback((index: number) => setCurrentMainImage(index), [])

  const prevMain = useCallback(
    () => goToMain((currentMainImage - 1 + total) % total),
    [currentMainImage, total, goToMain],
  )
  const nextMain = useCallback(
    () => goToMain((currentMainImage + 1) % total),
    [currentMainImage, total, goToMain],
  )

  const toggleAutoplay = useCallback(
    () => setIsAutoplay((prev) => !prev),
    [],
  )

  const handleShare = useCallback(
    async (index: number) => {
      const imageUrl = images[index]
      if (onShare) {
        onShare(index, imageUrl)
        return
      }
      try {
        if (navigator.share) {
          await navigator.share({
            title: `${title} — Image ${index + 1}`,
            text: `Check out this image from ${title}`,
            url: window.location.href,
          })
        } else {
          await navigator.clipboard.writeText(window.location.href)
        }
      } catch {
        // User cancelled or API unavailable — no-op
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

  // ── Keyboard: Space = autoplay toggle (Escape/Arrow handled by Lightbox) ────

  useEffect(() => {
    if (!isLightboxOpen || !enableAutoplay) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault()
        toggleAutoplay()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isLightboxOpen, enableAutoplay, toggleAutoplay])

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
              <div
                className="w-full h-full cursor-pointer"
                onClick={() => openLightbox(currentMainImage)}
              >
                <ImageEngine
                  image={galleryImages[currentMainImage]}
                  enableWatermark={false}
                  className="w-full h-full object-cover transition-opacity duration-300"
                />
              </div>

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
                role="list"
                aria-label="Image thumbnails"
              >
                {visibleThumbnails.map((image, index) => (
                  <div key={image.id} role="listitem">
                    <button
                      aria-label={`View image ${index + 1}`}
                      aria-current={currentMainImage === index ? 'true' : undefined}
                      onClick={() => goToMain(index)}
                      className={cn(
                        'relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden transition-all',
                        'hover:ring-2 hover:ring-primary hover:scale-105',
                        currentMainImage === index
                          ? 'ring-2 ring-primary scale-105'
                          : 'opacity-60',
                      )}
                    >
                      <ImageEngine
                        image={image}
                        enableWatermark={false}
                        className="w-full h-full object-cover pointer-events-none"
                      />
                    </button>
                  </div>
                ))}

                {hasMoreImages && (
                  <div role="listitem">
                    <button
                      aria-label={`View all ${total} images`}
                      onClick={() => openLightbox(maxPreviewImages)}
                      className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-200 hover:bg-gray-300 transition-all flex items-center justify-center"
                    >
                      <div className="text-center">
                        <Grid className="h-5 w-5 mx-auto mb-1" />
                        <span className="text-xs font-medium">
                          +{total - maxPreviewImages}
                        </span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Lightbox ──────────────────────────────────────────────────────── */}
      {/*
       * Lightbox handles Escape / Arrow navigation internally.
       * Space-bar autoplay toggle is registered above when enableAutoplay=true.
       */}
      <Lightbox
        images={galleryImages}
        currentIndex={lightboxIndex}
        isOpen={isLightboxOpen}
        onClose={closeLightbox}
        onNavigate={setLightboxIndex}
        enableWatermark={false}
        enableCollaboration={false}
        userRole="viewer"
      />
    </>
  )
}