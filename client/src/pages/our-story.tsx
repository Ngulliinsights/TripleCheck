
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function OurStoryPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#2C5282] mb-4">Our Story</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Built for Kenya, trusted by thousands - discover how TripleCheck is revolutionizing real estate verification
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-[#2C5282]">Our Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed mb-4">
                To eliminate property fraud in Kenya's real estate market by providing comprehensive verification services 
                that protect buyers, sellers, and investors through cutting-edge technology and community trust networks.
              </p>
              <p className="text-gray-700 leading-relaxed">
                We believe every Kenyan deserves access to verified, trustworthy property information that empowers 
                confident real estate decisions.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-[#2C5282]">Our Vision</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed mb-4">
                To become Kenya's most trusted real estate verification platform, setting the standard for property 
                transparency and fraud prevention across East Africa.
              </p>
              <p className="text-gray-700 leading-relaxed">
                A future where property fraud is eliminated through technology, community trust, and comprehensive verification.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-2xl text-[#2C5282]">The Problem We Solve</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-semibold text-red-800 mb-2">Property Fraud</h3>
                <p className="text-red-700 text-sm">Fake listings, forged documents, and fraudulent sellers cost Kenyans millions annually</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="font-semibold text-orange-800 mb-2">Information Gap</h3>
                <p className="text-orange-700 text-sm">Lack of accessible property verification tools leaves buyers vulnerable</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">Trust Deficit</h3>
                <p className="text-yellow-700 text-sm">No reliable way to verify seller credibility and property authenticity</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-[#2C5282]">Our Journey</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <Badge className="bg-[#2C5282] text-white">2023</Badge>
                <div>
                  <h3 className="font-semibold mb-2">Foundation</h3>
                  <p className="text-gray-700">TripleCheck was founded to address the growing property fraud crisis in Kenya</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <Badge className="bg-[#2C5282] text-white">2024</Badge>
                <div>
                  <h3 className="font-semibold mb-2">Platform Launch</h3>
                  <p className="text-gray-700">Launched comprehensive property verification services with AI-powered fraud detection</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <Badge className="bg-[#2C5282] text-white">Today</Badge>
                <div>
                  <h3 className="font-semibold mb-2">Growing Trust Network</h3>
                  <p className="text-gray-700">Building Kenya's largest community-driven property trust network</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
