import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Star, MessageCircle, ThumbsUp, Flag, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Review, User as UserType } from "@shared/schema";

interface PropertyReviewsProps {
  propertyId: number;
}

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(10, "Comment must be at least 10 characters").max(500, "Comment must not exceed 500 characters"),
});

type ReviewForm = z.infer<typeof reviewSchema>;

export default function PropertyReviews({ propertyId }: PropertyReviewsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Check if user is authenticated
  const { data: user } = useQuery<UserType>({
    queryKey: ['/api/auth/me'],
    retry: false,
  });

  // Fetch reviews
  const { data: reviews = [], isLoading } = useQuery<Review[]>({
    queryKey: [`/api/properties/${propertyId}/reviews`],
  });

  const form = useForm<ReviewForm>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 5,
      comment: "",
    },
  });

  const createReviewMutation = useMutation({
    mutationFn: async (reviewData: ReviewForm) => {
      const response = await apiRequest("POST", `/api/properties/${propertyId}/reviews`, reviewData);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/properties/${propertyId}/reviews`] });
      toast({
        title: "Review submitted",
        description: "Thank you for your feedback!",
      });
      form.reset();
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

  const onSubmit = (data: ReviewForm) => {
    createReviewMutation.mutate(data);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="rating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rating</FormLabel>
                        <Select 
                          value={field.value.toString()} 
                          onValueChange={(value) => field.onChange(parseInt(value))}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select rating" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {[5, 4, 3, 2, 1].map((rating) => (
                              <SelectItem key={rating} value={rating.toString()}>
                                <div className="flex items-center gap-2">
                                  <div className="flex">{renderStars(rating)}</div>
                                  <span>{rating} Star{rating !== 1 ? 's' : ''}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="comment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Comment</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Share your thoughts about this property..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex gap-2">
                    <Button 
                      type="submit" 
                      disabled={createReviewMutation.isPending}
                    >
                      {createReviewMutation.isPending ? "Submitting..." : "Submit Review"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowReviewForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
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