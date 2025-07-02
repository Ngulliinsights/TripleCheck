
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Download, ExternalLink, FileText, Image, Video } from "lucide-react";

export default function PressMediaPage() {
  const pressReleases = [
    {
      title: "TripleCheck Launches AI-Powered Property Verification in Kenya",
      date: "2024-01-15",
      excerpt: "Revolutionary platform aims to eliminate property fraud through advanced verification technology",
      category: "Product Launch"
    },
    {
      title: "Partnership with Kenya Association of Real Estate Agents Announced",
      date: "2024-02-28",
      excerpt: "Strategic alliance to enhance property verification standards across Kenya",
      category: "Partnership"
    },
    {
      title: "TripleCheck Prevents KSh 50M in Property Fraud in First Quarter",
      date: "2024-03-30",
      excerpt: "Platform's fraud detection capabilities save thousands of Kenyan property buyers",
      category: "Impact Report"
    }
  ];

  const mediaKit = [
    { name: "Company Logo Package", type: "image", size: "2.3 MB" },
    { name: "Product Screenshots", type: "image", size: "8.7 MB" },
    { name: "Executive Photos", type: "image", size: "5.1 MB" },
    { name: "Company Fact Sheet", type: "document", size: "1.2 MB" },
    { name: "Platform Demo Video", type: "video", size: "45 MB" }
  ];

  const mediaFeatures = [
    {
      outlet: "Business Daily",
      title: "Tech Startup Tackles Kenya's Property Fraud Crisis",
      date: "2024-01-20",
      type: "Article"
    },
    {
      outlet: "KTN News",
      title: "TripleCheck: Securing Real Estate Transactions",
      date: "2024-02-15",
      type: "TV Interview"
    },
    {
      outlet: "Capital FM",
      title: "Property Verification Revolution in Kenya",
      date: "2024-03-05",
      type: "Radio Interview"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#2C5282] mb-4">Press & Media</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Latest news, press releases, and media resources about TripleCheck's mission to transform Kenya's real estate market
          </p>
        </div>

        {/* Press Releases */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-2xl text-[#2C5282] flex items-center">
              <FileText className="mr-2" />
              Latest Press Releases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {pressReleases.map((release, index) => (
                <div key={index} className="border-l-4 border-[#2C5282] pl-6 py-2">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">{release.title}</h3>
                    <Badge className="bg-[#2C5282] text-white">{release.category}</Badge>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(release.date).toLocaleDateString()}
                  </div>
                  <p className="text-gray-600 mb-3">{release.excerpt}</p>
                  <Button variant="outline" size="sm">
                    Read Full Release <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Media Kit */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-2xl text-[#2C5282] flex items-center">
              <Download className="mr-2" />
              Media Kit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-6">
              Download high-resolution images, logos, and other media assets for your stories about TripleCheck.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mediaKit.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {item.type === 'image' && <Image className="h-6 w-6 text-[#2C5282]" />}
                    {item.type === 'document' && <FileText className="h-6 w-6 text-[#2C5282]" />}
                    {item.type === 'video' && <Video className="h-6 w-6 text-[#2C5282]" />}
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.size}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Media Coverage */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-2xl text-[#2C5282]">Media Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mediaFeatures.map((feature, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold text-gray-800">{feature.title}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      <span className="font-medium">{feature.outlet}</span>
                      <span>•</span>
                      <span>{new Date(feature.date).toLocaleDateString()}</span>
                      <Badge variant="outline">{feature.type}</Badge>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    View <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-[#2C5282]">Media Contact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold mb-4">For Press Inquiries</h3>
                <div className="space-y-2">
                  <p><strong>Sarah Wanjiku</strong></p>
                  <p>Chief Technology Officer</p>
                  <p>Email: press@triplecheck.co.ke</p>
                  <p>Phone: +254 700 123 456</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-4">For Partnership Inquiries</h3>
                <div className="space-y-2">
                  <p><strong>John Kariuki</strong></p>
                  <p>Chief Executive Officer</p>
                  <p>Email: partnerships@triplecheck.co.ke</p>
                  <p>Phone: +254 700 654 321</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
