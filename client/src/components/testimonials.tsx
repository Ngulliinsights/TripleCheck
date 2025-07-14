import { OptimizedImage } from "./ui/optimized-image";
import { images } from "@/config/images";
import { Card, CardContent } from "./ui/card";

const testimonials = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Property Investor",
    image: images.customers[1],
    quote: "African Property Trust has transformed how I invest in real estate across the continent. Their verification process gives me complete peace of mind."
  },
  {
    id: 2,
    name: "Michael Okonjo",
    role: "Real Estate Developer",
    image: images.customers[2],
    quote: "The platform's transparency and efficiency have made property transactions seamless. It's the future of African real estate."
  },
  {
    id: 3,
    name: "Lisa Mwangi",
    role: "First-time Buyer",
    image: images.customers[3],
    quote: "As a first-time buyer, I felt secure knowing every property was thoroughly verified. The process was straightforward and trustworthy."
  }
];

export function Testimonials() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-semibold text-center text-customPrimary mb-12">
          What Our Clients Say
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="hover-scale">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-full overflow-hidden mb-4">
                    <OptimizedImage
                      fallbackSrc={testimonial.image}
                      alt={testimonial.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <blockquote className="text-gray-600 italic mb-4">
                    "{testimonial.quote}"
                  </blockquote>
                  <cite className="not-italic">
                    <div className="font-semibold text-customSecondary">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {testimonial.role}
                    </div>
                  </cite>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
