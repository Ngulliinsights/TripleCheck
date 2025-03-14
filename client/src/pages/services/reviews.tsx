import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star, User, ThumbsUp, Flag } from "lucide-react";
import { Progress } from "@/components/ui/progress";

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
  const [selectedRating, setSelectedRating] = useState(0);
  const [comment, setComment] = useState("");

  // Simulated reviews data
  const { data: reviews, isLoading } = useQuery<Review[]>({
    queryKey: ["/api/reviews"],
    initialData: [
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
    ]
  });

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    // Handle review submission
    console.log({ rating: selectedRating, comment });
  };

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
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <Label htmlFor="rating">Rating</Label>
                <div className="flex gap-1 mt-2">
                  {Array(5).fill(0).map((_, index) => (
                    <Star
                      key={index}
                      className={`h-8 w-8 cursor-pointer ${
                        index < selectedRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                      }`}
                      onClick={() => setSelectedRating(index + 1)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="comment">Your Review</Label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience..."
                  className="h-32"
                />
              </div>
              <Button type="submit">Submit Review</Button>
            </form>
          </CardContent>
        </Card>

        {/* Reviews List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Recent Reviews</h2>
          {reviews?.map((review) => (
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
                        {new Date(review.createdAt).toLocaleDateString()}
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
          ))}
        </div>
      </div>
    </div>
  );
}
