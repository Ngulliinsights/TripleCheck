import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Star, User, ThumbsUp, Flag, MessageSquare, TrendingUp } from "lucide-react"
import React, { useState, useCallback, useRef, useMemo } from "react"

import { EnterpriseVirtualizedList } from "../../local/components"
import FormField from "../../local/components/forms/FormField"
import { Button } from "../../local/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../local/components/ui/card"
import { Label } from "../../local/components/ui/label"
import { Progress } from "../../local/components/ui/progress"
import { useFormValidation } from "../../local/hooks/useFormValidation"
import { useReviewListVirtualization } from "../../local/hooks/useMemoryOptimization"
import { formatDate } from "../../local/utils/date-utils"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Review {
  id: number
  userId: number
  propertyId: number
  rating: number
  comment: string
  userName: string
  createdAt: string
  helpful: number
  [key: string]: unknown
}

interface RatingStats {
  averageRating: number
  totalReviews: number
  /** Percentages for stars 5 → 1 */
  ratingDistribution: [number, number, number, number, number]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Derive live stats from the fetched reviews array. Falls back to empty state. */
function computeStats(reviews: Review[] | undefined): RatingStats {
  if (!reviews || reviews.length === 0) {
    return { averageRating: 0, totalReviews: 0, ratingDistribution: [0, 0, 0, 0, 0] }
  }

  const total = reviews.length
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
  const counts = [5, 4, 3, 2, 1].map(
    (star) => Math.round((reviews.filter((r) => r.rating === star).length / total) * 100)
  ) as [number, number, number, number, number]

  return {
    averageRating: Math.round((sum / total) * 10) / 10,
    totalReviews: total,
    ratingDistribution: counts,
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StarDisplayProps {
  rating: number
  size?: "sm" | "md" | "lg"
  interactive?: false
}

interface InteractiveStarProps {
  rating: number
  size?: "sm" | "md" | "lg"
  interactive: true
  onRate: (value: number) => void
}

type StarRatingProps = StarDisplayProps | InteractiveStarProps

const sizeClasses = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-8 w-8" }

const StarRating: React.FC<StarRatingProps> = (props) => {
  const [hovered, setHovered] = useState<number | null>(null)
  const cls = sizeClasses[props.size ?? "sm"]

  return (
    <div className="flex gap-0.5" role={props.interactive ? "group" : undefined}>
      {Array.from({ length: 5 }, (_, i) => {
        const filled = props.interactive
          ? i < (hovered ?? props.rating)
          : i < props.rating

        return (
          <Star
            key={i}
            className={`${cls} transition-colors ${
              filled ? "text-amber-400 fill-amber-400" : "text-gray-200"
            } ${props.interactive ? "cursor-pointer hover:scale-110 transition-transform" : ""}`}
            {...(props.interactive && {
              onClick: () => (props as InteractiveStarProps).onRate(i + 1),
              onMouseEnter: () => setHovered(i + 1),
              onMouseLeave: () => setHovered(null),
              onKeyDown: (e: React.KeyboardEvent) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  ;(props as InteractiveStarProps).onRate(i + 1)
                }
              },
              tabIndex: 0,
              role: "button",
              "aria-label": `Rate ${i + 1} star${i + 1 !== 1 ? "s" : ""}`,
            })}
          />
        )
      })}
    </div>
  )
}

// ─── Review Card ──────────────────────────────────────────────────────────────

interface ReviewCardProps {
  review: Review
  onHelpful?: (id: number) => void
}

const ReviewCard: React.FC<ReviewCardProps> = React.memo(({ review, onHelpful }) => (
  <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
    <CardContent className="pt-5 pb-4">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="shrink-0">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#2C5282] to-[#4A7FC1] flex items-center justify-center shadow-sm">
            <User className="h-5 w-5 text-white" />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 truncate">{review.userName}</span>
            <time
              dateTime={review.createdAt}
              className="text-xs text-gray-400 shrink-0"
            >
              {formatDate(review.createdAt)}
            </time>
          </div>

          <div className="mt-1 mb-2">
            <StarRating rating={review.rating} size="sm" />
          </div>

          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
            {review.comment}
          </p>

          <div className="flex items-center gap-3 mt-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 h-7 px-2"
              onClick={() => onHelpful?.(review.id)}
              aria-label={`Mark review by ${review.userName} as helpful`}
            >
              <ThumbsUp className="h-3.5 w-3.5 mr-1" />
              Helpful ({review.helpful})
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 h-7 px-2"
              aria-label={`Report review by ${review.userName}`}
            >
              <Flag className="h-3.5 w-3.5 mr-1" />
              Report
            </Button>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
))

ReviewCard.displayName = "ReviewCard"

// ─── Virtualized List ─────────────────────────────────────────────────────────

const ITEM_BASE_HEIGHT = 150

const VirtualizedReviewsList: React.FC<{
  reviews: Review[]
  onHelpful?: (id: number) => void
}> = ({ reviews, onHelpful }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerHeight, setContainerHeight] = useState(500)

  React.useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect()
      const available = window.innerHeight - rect.top - 100
      setContainerHeight(Math.max(400, Math.min(700, available)))
    })

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const estimateItemHeight = useCallback(
    (review: Review) => ITEM_BASE_HEIGHT + Math.ceil(review.comment.length / 4),
    []
  )

  const listProps = useReviewListVirtualization<Review>(
    reviews,
    containerHeight,
    estimateItemHeight
  )

  const renderReviewItem = useCallback(
    (review: Review, _index: number, style: React.CSSProperties) => (
      <div style={style} className="px-0.5 py-1.5">
        <ReviewCard review={review} onHelpful={onHelpful} />
      </div>
    ),
    [onHelpful]
  )

  return (
    <div ref={containerRef} className="w-full">
      <EnterpriseVirtualizedList {...listProps} renderItem={renderReviewItem} />
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const ReviewSkeleton: React.FC = () => (
  <Card className="animate-pulse">
    <CardContent className="pt-5">
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 rounded-full bg-gray-200 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-3 bg-gray-200 rounded w-1/6" />
          </div>
          <div className="h-3 bg-gray-200 rounded w-1/3" />
          <div className="h-16 bg-gray-200 rounded" />
          <div className="h-3 bg-gray-200 rounded w-1/4" />
        </div>
      </div>
    </CardContent>
  </Card>
)

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReviewsPage() {
  const queryClient = useQueryClient()

  const { data: reviews, isLoading, isError } = useQuery<Review[]>({
    queryKey: ["/api/reviews"],
    queryFn: async (): Promise<Review[]> => {
      const res = await fetch("/api/reviews")
      if (!res.ok) throw new Error("Failed to load reviews")
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  // Optimistic helpful mutation
  const helpfulMutation = useMutation({
    mutationFn: async (reviewId: number) => {
      const res = await fetch(`/api/reviews/${reviewId}/helpful`, { method: "POST" })
      if (!res.ok) throw new Error("Failed to mark as helpful")
      return res.json()
    },
    onMutate: async (reviewId) => {
      await queryClient.cancelQueries({ queryKey: ["/api/reviews"] })
      const previous = queryClient.getQueryData<Review[]>(["/api/reviews"])
      queryClient.setQueryData<Review[]>(["/api/reviews"], (old) =>
        old?.map((r) => (r.id === reviewId ? { ...r, helpful: r.helpful + 1 } : r))
      )
      return { previous }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(["/api/reviews"], ctx.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] })
    },
  })

  const stats = useMemo(() => computeStats(reviews), [reviews])

  const {
    formState: { data: values, isValid, isSubmitting },
    handleSubmit,
    setValue,
    getFieldProps,
    getFieldError,
  } = useFormValidation({
    initialData: { rating: 0, comment: "" },
    validationRules: {
      rating: {
        required: true,
        custom: (value: unknown) => {
          const n = Number(value)
          return isNaN(n) || n < 1 ? "Please select a rating" : null
        },
      },
      comment: {
        required: true,
        minLength: 10,
        maxLength: 500,
      },
    },
    onSubmit: async (formData) => {
      const { formService } = await import("../../local/services/FormService")
      const result = await formService.submitReview({ ...formData, reviewType: "service" })

      if (result.success) {
        setValue("rating", 0)
        setValue("comment", "")
        // Refresh the reviews list after a successful submission
        await queryClient.invalidateQueries({ queryKey: ["/api/reviews"] })
      } else {
        throw new Error(result.message)
      }
    },
  })

  // ── Render: Loading ──────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <PageHeader />
          <div className="space-y-3">
            {Array.from({ length: 3 }, (_, i) => <ReviewSkeleton key={i} />)}
          </div>
        </div>
      </div>
    )
  }

  // ── Render: Error ────────────────────────────────────────────────────────

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <PageHeader />
          <Card className="mt-8 border-red-100">
            <CardContent className="pt-6 text-center text-red-600">
              <p className="font-medium">Unable to load reviews.</p>
              <p className="text-sm text-gray-500 mt-1">Please try again later.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ── Render: Main ─────────────────────────────────────────────────────────

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <PageHeader />

        {/* Stats */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-700">
              <TrendingUp className="h-4 w-4 text-[#2C5282]" />
              Rating Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-8 pt-2">
            <div className="text-center flex flex-col items-center justify-center">
              <span className="text-6xl font-bold tracking-tight text-gray-900">
                {stats.averageRating || "—"}
              </span>
              <div className="flex justify-center my-2">
                <StarRating rating={Math.round(stats.averageRating)} size="md" />
              </div>
              <p className="text-sm text-gray-400">
                Based on {stats.totalReviews} review{stats.totalReviews !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="space-y-2.5">
              {stats.ratingDistribution.map((pct, i) => (
                <div key={5 - i} className="flex items-center gap-2 text-sm">
                  <span className="w-8 text-right text-gray-500 shrink-0">{5 - i} ★</span>
                  <Progress
                    value={pct}
                    className="h-2 flex-1 bg-gray-100"
                    aria-label={`${5 - i} stars: ${pct}%`}
                  />
                  <span className="w-8 text-gray-400 shrink-0">{pct}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Write Review */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-700">
              <MessageSquare className="h-4 w-4 text-[#2C5282]" />
              Write a Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Star picker */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="rating"
                  className={`text-sm font-medium ${
                    getFieldError("rating") ? "text-red-600" : "text-gray-700"
                  }`}
                >
                  Rating <span aria-hidden>*</span>
                </Label>
                <div className="mt-1">
                  <StarRating
                    rating={values.rating as number}
                    size="lg"
                    interactive
                    onRate={(v) => setValue("rating", v)}
                  />
                </div>
                {getFieldError("rating") && (
                  <p className="text-xs text-red-600 mt-1" role="alert">
                    {getFieldError("rating")}
                  </p>
                )}
              </div>

              <FormField
                label="Your Review"
                type="textarea"
                rows={4}
                placeholder="Share your experience…"
                required
                helpText="Between 10 and 500 characters"
                {...getFieldProps("comment")}
              />

              <Button
                type="submit"
                disabled={isSubmitting || !isValid}
                className="w-full bg-[#2C5282] hover:bg-[#1A365D] text-white transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Submitting…" : "Submit Review"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Reviews List */}
        <section aria-labelledby="reviews-heading">
          <h2
            id="reviews-heading"
            className="text-lg font-semibold text-gray-800 mb-4"
          >
            Recent Reviews
            {reviews && reviews.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({reviews.length})
              </span>
            )}
          </h2>

          {reviews && reviews.length > 0 ? (
            <VirtualizedReviewsList
              reviews={reviews}
              onHelpful={(id) => helpfulMutation.mutate(id)}
            />
          ) : (
            <Card className="border border-dashed border-gray-200">
              <CardContent className="py-12 text-center">
                <Star className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">
                  No reviews yet. Be the first to share your experience!
                </p>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </div>
  )
}

// ─── Shared sub-component ─────────────────────────────────────────────────────

const PageHeader: React.FC = () => (
  <div className="text-center">
    <h1 className="text-3xl font-bold tracking-tight text-gray-900">
      Community Reviews & Ratings
    </h1>
    <p className="mt-2 text-sm text-gray-500">
      Real experiences from verified users in our trust network
    </p>
  </div>
)