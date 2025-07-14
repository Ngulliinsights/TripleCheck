import { OptimizedImage } from "./ui/optimized-image";
import { images } from "@/config/images";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";

const blogPosts = [
  {
    id: 1,
    title: "The Future of African Real Estate Investment",
    excerpt: "Discover how technology is transforming property investment across Africa...",
    image: images.blog[1],
    date: "July 10, 2025"
  },
  {
    id: 2,
    title: "Understanding Property Verification",
    excerpt: "A comprehensive guide to our property verification process...",
    image: images.blog[2],
    date: "July 8, 2025"
  },
  {
    id: 3,
    title: "Top Growing Property Markets in Africa",
    excerpt: "Explore the most promising real estate markets across the continent...",
    image: images.blog[3],
    date: "July 5, 2025"
  }
];

export function NewsBlog() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-semibold text-center text-customPrimary mb-12">
          Latest News & Insights
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <Card key={post.id} className="overflow-hidden hover-scale">
              <div className="aspect-video relative">
                <OptimizedImage
                  webpSrc={post.image.webp}
                  fallbackSrc={post.image.jpg}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardHeader>
                <div className="text-sm text-gray-500 mb-2">{post.date}</div>
                <CardTitle className="text-xl text-customSecondary">
                  {post.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{post.excerpt}</p>
                <Button
                  variant="outline"
                  className="text-customSecondary border-customSecondary hover:bg-customSecondary hover:text-white"
                >
                  Read More
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
