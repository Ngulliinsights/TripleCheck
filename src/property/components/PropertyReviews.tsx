import { Badge } from "@shared/components/ui/badge";
import { Button } from "@shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Label } from "@shared/components/ui/label";
import { Separator } from "@shared/components/ui/separator";
import { Textarea } from "@shared/components/ui/textarea";
import { useSafeUserQuery } from "@shared/hooks/useSafeQuery";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, MessageCircle, ThumbsUp, Flag, User } from "lucide-react";
import { useState } from "react";

import { formatDate } from "../../shared/utils/date-utils";

import { apiRequest, getQueryFn } from "@/infrastructure/api/queryClient";
import { useToast } from "@/shared/hooks/use-toast";

interface PropertyReviewsProps {
  propertyId: string;
}

interface Review {
  id: number;
  userId: number;
  propertyId: number;
  rating: number;
  comment: string;
  createdAt: string;
}

interface User {
  id: number;
  username: string;
  email: string;
}

export function PropertyReviews({ propertyId }: PropertyReviewsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  // Check if user is authenticated with enhanced safety
  const { data: user, hasValidData: isAuthenticated } = useSafeUserQuery({
    context: 'property-reviews',
    retry: false, // Don't retry auth failures
    staleTime: 5 * 60 * 1000,
  });

  // Fetch reviews with proper error handling
  const { data: reviews = [], isLoading } = useQuery<Review[]>({
    queryKey: [`/api/properties/${propertyId}/reviews`],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", `/api/properties/${propertyId}/reviews`);
        return response || [];
      } catch (error) {
        console.error("Failed to fetch reviews:", error);
        return [];
      }
    },
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const createReviewMutation = useMutation({
    mutationFn: async (reviewData: { rating: number; comment: string }) => {
      return await apiRequest("POST", `/api/properties/${propertyId}/reviews`, reviewData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/properties/${propertyId}/reviews`] });
      toast({
        title: "Review submitted",
        description: "Thank you for your feedback!",
      });
      setRating(5);
      setComment("");
      setShowReviewForm(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to submit review",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim().length < 10) {
      toast({
        title: "Comment too short",
        description: "Please write at least 10 characters.",
        variant: "destructive",
      });
      return;
    }
    createReviewMutation.mutate({ rating, comment: comment.trim() });
  };



  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Reviews ({reviews.length})
            </CardTitle>
            {reviews.length > 0 && (
              <CardDescription className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1">
                  {renderStars(Math.round(averageRating))}
                </div>
                <span className="font-medium">{averageRating.toFixed(1)}</span>
                <span className="text-muted-foreground">
                  average from {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                </span>
              </CardDescription>
            )}
          </div>
          {user && !showReviewForm && (
            <Button onClick={() => setShowReviewForm(true)}>
              Write Review
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Review Form */}
        {showReviewForm && user && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Write a Review</CardTitle>
              <CardDescription>
                Share your experience with this property
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="rating">Rating</Label>
                  <div className="flex gap-1 mt-2">
                    {Array.from({ length: 5 }, (_, index) => (
                      <Star
                        key={index}
                        className={`w-8 h-8 cursor-pointer transition-colors ${
                          index < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 hover:text-yellow-200'
                        }`}
                        onClick={() => setRating(index + 1)}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {rating} star{rating !== 1 ? 's' : ''} selected
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="comment">Comment</Label>
                  <Textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your thoughts about this property..."
                    className="min-h-[100px] mt-2"
                    maxLength={500}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {comment.length}/500 characters (minimum 10)
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={createReviewMutation.isPending || comment.trim().length < 10}
                  >
                    {createReviewMutation.isPending ? "Submitting..." : "Submit Review"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowReviewForm(false);
                      setRating(5);
                      setComment("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {!user && (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Please log in to write a review</p>
          </div>
        )}

        {/* Reviews List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : reviews.length > 0 ? (
          <div className="space-y-6">
            {reviews.map((review, index) => (
              <div key={review.id}>
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">User #{review.userId}</span>
                          <Badge variant="outline" className="text-xs">
                            Verified Reviewer
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex">{renderStars(review.rating)}</div>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(new Date(review.createdAt).toISOString())}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 leading-relaxed ml-13">
                    {review.comment}
                  </p>
                  
                  <div className="flex items-center gap-4 ml-13">
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-gray-900">
                      <ThumbsUp className="w-4 h-4 mr-1" />
                      Helpful
                    </Button>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-gray-900">
                      <Flag className="w-4 h-4 mr-1" />
                      Report
                    </Button>
                  </div>
                </div>
                
                {index < reviews.length - 1 && <Separator className="mt-6" />}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No reviews yet</p>
            <p>Be the first to share your experience with this property!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}