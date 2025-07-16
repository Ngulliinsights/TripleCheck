import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Shield, Users, Zap, Mail } from "lucide-react";
import { useMemo } from "react";

// Define TypeScript interfaces for better type safety
interface Partner {
  name: string;
  role: string;
  logo: string;
}

interface PartnerCategory {
  title: string;
  icon: React.ReactNode;
  partners: Partner[];
}

interface BenefitItem {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface PartnershipType {
  title: string;
  description: string;
}

export default function PartnersPage() {
  // Memoize static data to prevent unnecessary re-renders
  const partnerCategories: PartnerCategory[] = useMemo(() => [
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
  ], []);

  // Memoize benefit items for better performance
  const benefitItems: BenefitItem[] = useMemo(() => [
    {
      icon: <Shield className="h-8 w-8 text-[#2C5282]" />,
      title: "Enhanced Security",
      description: "Multi-layered verification through trusted partner networks"
    },
    {
      icon: <Building2 className="h-8 w-8 text-[#2C5282]" />,
      title: "Wider Coverage",
      description: "Access to comprehensive property data across Kenya"
    },
    {
      icon: <Users className="h-8 w-8 text-[#2C5282]" />,
      title: "Community Trust",
      description: "Building confidence through established industry relationships"
    }
  ], []);

  // Memoize partnership types for consistency
  const partnershipTypes: PartnershipType[] = useMemo(() => [
    {
      title: "For Technology Companies",
      description: "Integrate your solutions with our verification platform"
    },
    {
      title: "For Real Estate Professionals",
      description: "Enhance your credibility with verified listings"
    }
  ], []);

  // Extract reusable components for better maintainability
  const PartnerCard = ({ partner }: { partner: Partner }) => (
    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <span className="text-2xl" role="img" aria-label={`${partner.name} logo`}>
        {partner.logo}
      </span>
      <div className="flex-1">
        <h3 className="font-semibold text-gray-800">{partner.name}</h3>
        <p className="text-sm text-gray-600">{partner.role}</p>
      </div>
    </div>
  );

  const BenefitCard = ({ benefit }: { benefit: BenefitItem }) => (
    <div className="text-center">
      <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 transition-transform hover:scale-105">
        {benefit.icon}
      </div>
      <h3 className="font-semibold mb-2 text-gray-800">{benefit.title}</h3>
      <p className="text-gray-600 text-sm">{benefit.description}</p>
    </div>
  );

  const PartnershipTypeCard = ({ type }: { type: PartnershipType }) => (
    <div className="p-4 bg-blue-50 rounded-lg">
      <h3 className="font-semibold text-[#2C5282] mb-2">{type.title}</h3>
      <p className="text-sm text-gray-600">{type.description}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header section with improved semantic structure */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#2C5282] mb-4">Our Partners</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Working together with industry leaders to build Kenya's most comprehensive property verification ecosystem
          </p>
        </header>

        {/* Partner categories grid with improved accessibility */}
        <section className="mb-12" aria-labelledby="partner-categories">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {partnerCategories.map((category, index) => (
              <Card key={category.title} className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="text-[#2C5282]" aria-hidden="true">
                      {category.icon}
                    </div>
                    <CardTitle className="text-xl text-[#2C5282]">{category.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {category.partners.map((partner) => (
                      <PartnerCard key={partner.name} partner={partner} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Benefits section with improved structure */}
        <section className="mb-8" aria-labelledby="partnership-benefits">
          <Card>
            <CardHeader>
              <CardTitle id="partnership-benefits" className="text-center text-2xl text-[#2C5282]">
                Partnership Benefits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {benefitItems.map((benefit) => (
                  <BenefitCard key={benefit.title} benefit={benefit} />
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Partnership invitation section */}
        <section aria-labelledby="become-partner">
          <Card>
            <CardHeader>
              <CardTitle id="become-partner" className="text-center text-2xl text-[#2C5282]">
                Become a Partner
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-700 mb-6 leading-relaxed">
                Join our growing network of partners committed to transforming Kenya's real estate landscape.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {partnershipTypes.map((type) => (
                  <PartnershipTypeCard key={type.title} type={type} />
                ))}
              </div>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
                <Mail className="h-4 w-4" />
                <span>Contact our partnerships team: </span>
                <a 
                  href="mailto:partnerships@triplecheck.co.ke" 
                  className="text-[#2C5282] hover:underline font-medium"
                >
                  partnerships@triplecheck.co.ke
                </a>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}