
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Shield, Users, Zap } from "lucide-react";

export default function PartnersPage() {
  const partnerCategories = [
    {
      title: "Technology Partners",
      icon: <Zap className="h-8 w-8" />,
      partners: [
        { name: "Google Cloud", role: "AI/ML Infrastructure", logo: "🔵" },
        { name: "Blockchain Kenya", role: "Document Security", logo: "⛓️" },
        { name: "M-Pesa API", role: "Payment Integration", logo: "💳" }
      ]
    },
    {
      title: "Real Estate Partners",
      icon: <Building2 className="h-8 w-8" />,
      partners: [
        { name: "Kenya Association of Real Estate Agents", role: "Industry Standards", logo: "🏢" },
        { name: "Nairobi Property Exchange", role: "Market Data", logo: "📊" },
        { name: "Land Registry Kenya", role: "Official Records", logo: "📋" }
      ]
    },
    {
      title: "Security Partners",
      icon: <Shield className="h-8 w-8" />,
      partners: [
        { name: "CyberSecurity Kenya", role: "Platform Security", logo: "🔒" },
        { name: "ID Verification Services", role: "Identity Checks", logo: "🆔" },
        { name: "Legal Advisory Group", role: "Compliance", logo: "⚖️" }
      ]
    },
    {
      title: "Community Partners",
      icon: <Users className="h-8 w-8" />,
      partners: [
        { name: "Property Buyers Association", role: "Consumer Protection", logo: "🏠" },
        { name: "Landlords Association", role: "Property Management", logo: "🔑" },
        { name: "Real Estate Developers", role: "New Projects", logo: "🏗️" }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#2C5282] mb-4">Our Partners</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Working together with industry leaders to build Kenya's most comprehensive property verification ecosystem
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {partnerCategories.map((category, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="text-[#2C5282]">{category.icon}</div>
                  <CardTitle className="text-xl text-[#2C5282]">{category.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {category.partners.map((partner, partnerIndex) => (
                    <div key={partnerIndex} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <span className="text-2xl">{partner.logo}</span>
                      <div>
                        <h3 className="font-semibold text-gray-800">{partner.name}</h3>
                        <p className="text-sm text-gray-600">{partner.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-center text-2xl text-[#2C5282]">Partnership Benefits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-[#2C5282]" />
                </div>
                <h3 className="font-semibold mb-2">Enhanced Security</h3>
                <p className="text-gray-600 text-sm">Multi-layered verification through trusted partner networks</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-8 w-8 text-[#2C5282]" />
                </div>
                <h3 className="font-semibold mb-2">Wider Coverage</h3>
                <p className="text-gray-600 text-sm">Access to comprehensive property data across Kenya</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-[#2C5282]" />
                </div>
                <h3 className="font-semibold mb-2">Community Trust</h3>
                <p className="text-gray-600 text-sm">Building confidence through established industry relationships</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl text-[#2C5282]">Become a Partner</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-700 mb-6">
              Join our growing network of partners committed to transforming Kenya's real estate landscape.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-semibold text-[#2C5282] mb-2">For Technology Companies</h3>
                <p className="text-sm text-gray-600">Integrate your solutions with our verification platform</p>
              </div>
              <div>
                <h3 className="font-semibold text-[#2C5282] mb-2">For Real Estate Professionals</h3>
                <p className="text-sm text-gray-600">Enhance your credibility with verified listings</p>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Contact our partnerships team: partnerships@triplecheck.co.ke
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
