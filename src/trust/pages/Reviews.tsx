import { useQuery } from "@tanstack/react-query";
import { Star, User, ThumbsUp, Flag, AlertCircle } from "lucide-react";
import { useState } from "react";

import FormField from "../../shared/components/forms/FormField";
import { Button } from "../../shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../shared/components/ui/card";
import { Label } from "../../shared/components/ui/label";
import { Progress } from "../../shared/components/ui/progress";
import { Textarea } from "../../shared/components/ui/textarea";
import { useToast } from "../../shared/hooks/use-toast";
import { useForm } from "../../shared/hooks/useForm";
import { formatDate } from "../../shared/utils/date-utils";
import { ValidationRule } from "../../shared/utils/form-validation";

interface Review {
  id: number;
  userId: number;
  propertyId: number;
  rating: number;
  comment: string;
  userName: string;
  createdAt: string;
  helpful: number;
}

export default function ReviewsPage() {
  const { toast } = useToast();

  // Simulated reviews data with proper React Query configuration
  const { data: reviews, isLoading } = useQuery<Review[]>({
    queryKey: ["/api/reviews"],
    queryFn: async () => {
      // Simulate API call - replace with actual API call
      return new Promise<Review[]>((resolve) => {
        setTimeout(() => {
          resolve([
            {
              id: 1,
              userId: 1,
              propertyId: 1,
              rating: 5,
              comment: "Excellent service, very thorough verification process.",
              userName: "John Doe",
              createdAt: "2025-03-10",
              helpful: 12
            },
            {
              id: 2,
              userId: 2,
              propertyId: 1,
              rating: 4,
              comment: "Good experience overall, would recommend.",
              userName: "Jane Smith",
              createdAt: "2025-03-09",
              helpful: 8
            }
          ]);
        }, 100);
      });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const {
    values,
    errors,
    touched,
    isValid,
    isSubmitting,
    handleSubmit,
    setValue,
    getFieldProps,
    getFieldError
  } = useForm({
    initialValues: {
      rating: 0,
      comment: ''
    },
    validationRules: {
      rating: {
        required: true,
        min: 1,
        max: 5,
        custom: (value: unknown) => {
          if (!value || (typeof value === 'number' && value < 1)) {
            return 'Please select a rating';
          }
          return null;
        }
      },
      comment: {
        required: true,
        minLength: 10,
        maxLength: 500
      }
    },
    onSubmit: async (formData) => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        toast({
          title: "Review submitted successfully!",
          description: "Thank you for your feedback.",
        });
        
        // Reset form after successful submission
        setValue('rating', 0);
        setValue('comment', '');
      } catch (error) {
        toast({
          title: "Failed to submit review",
          description: "Please try again.",
          variant: "destructive",
        });
        throw error;
      }
    }
  });

  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, index) => (
      <Star
        key={index}
        className={`h-5 w-5 ${index < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  const stats = {
    averageRating: 4.5,
    totalReviews: 128,
    ratingDistribution: [5, 45, 35, 10, 5]
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Community Reviews & Ratings</h1>
            <p className="text-muted-foreground">Loading reviews...</p>
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }, (_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                      <div className="h-16 bg-gray-200 rounded" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Community Reviews & Ratings</h1>
          <p className="text-muted-foreground">
            Real experiences from verified users in our trust network
          </p>
        </div>

        {/* Statistics Section */}
        <Card>
          <CardHeader>
            <CardTitle>Rating Overview</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">{stats.averageRating}</div>
              <div className="flex justify-center mb-2">
                {renderStars(Math.round(stats.averageRating))}
              </div>
              <p className="text-muted-foreground">Based on {stats.totalReviews} reviews</p>
            </div>
            <div className="space-y-2">
              {stats.ratingDistribution.map((percentage, index) => (
                <div key={5 - index} className="flex items-center gap-2">
                  <span className="w-8 text-right">{5 - index} ★</span>
                  <Progress value={percentage} className="h-2" />
                  <span className="w-8">{percentage}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Write Review Section */}
        <Card>
          <CardHeader>
            <CardTitle>Write a Review</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="rating" className={getFieldError('rating') ? 'text-red-600' : ''}>
                  Rating *
                </Label>
                <div className="flex gap-1 mt-2">
                  {Array(5).fill(0).map((_, index) => (
                    <Star
                      key={index}
                      className={`h-8 w-8 cursor-pointer transition-colors ${
                        index < values.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 hover:text-yellow-200'
                      }`}
                      onClick={() => setValue('rating', index + 1)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setValue('rating', index + 1);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`Rate ${index + 1} star${index + 1 > 1 ? 's' : ''}`}
                    />
                  ))}
                </div>
                {getFieldError('rating') && (
                  <p className="text-sm text-red-600" role="alert">
                    {getFieldError('rating')}
                  </p>
                )}
              </div>
              
              <FormField
                label="Your Review"
                type="textarea"
                rows={4}
                placeholder="Share your experience..."
                required
                helpText="Minimum 10 characters, maximum 500 characters"
                error={getFieldError('comment')}
                touched={touched.comment}
                {...getFieldProps('comment')}
              />
              
              <Button 
                type="submit" 
                disabled={isSubmitting || !isValid}
                className="w-full"
              >
                {isSubmitting ? 'Submitting Review...' : 'Submit Review'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Reviews List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Recent Reviews</h2>
          {reviews && reviews.length > 0 ? (
            reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0">
                      <div className="h-10 w-10 rounded-full bg-[#2C5282] flex items-center justify-center">
                        <User className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{review.userName}</h3>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                      <div className="flex gap-1 my-2">
                        {renderStars(review.rating)}
                      </div>
                      <p className="text-muted-foreground">{review.comment}</p>
                      <div className="flex items-center gap-4 mt-4">
                        <Button variant="outline" size="sm" className="gap-2">
                          <ThumbsUp className="h-4 w-4" />
                          Helpful ({review.helpful})
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Flag className="h-4 w-4" />
                          Report
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No reviews yet. Be the first to leave a review!</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
