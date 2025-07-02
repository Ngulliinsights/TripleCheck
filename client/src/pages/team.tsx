
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Linkedin, Mail, Twitter } from "lucide-react";

export default function TeamPage() {
  const teamMembers = [
    {
      name: "John Kariuki",
      role: "CEO & Co-Founder",
      bio: "Real estate veteran with 15+ years experience in Kenya's property market",
      image: "/api/placeholder/150/150",
      linkedin: "#",
      email: "john@triplecheck.co.ke"
    },
    {
      name: "Sarah Wanjiku",
      role: "CTO & Co-Founder", 
      bio: "Tech leader specializing in AI/ML and blockchain verification systems",
      image: "/api/placeholder/150/150",
      linkedin: "#",
      email: "sarah@triplecheck.co.ke"
    },
    {
      name: "David Mwangi",
      role: "Head of Verification",
      bio: "Legal expert in property law and document authentication",
      image: "/api/placeholder/150/150",
      linkedin: "#",
      email: "david@triplecheck.co.ke"
    },
    {
      name: "Grace Achieng",
      role: "Community Manager",
      bio: "Building trust networks and user engagement across Kenya",
      image: "/api/placeholder/150/150",
      linkedin: "#",
      email: "grace@triplecheck.co.ke"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#2C5282] mb-4">Meet Our Team</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            The passionate professionals behind Kenya's most trusted property verification platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {teamMembers.map((member, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-4xl text-gray-500">👤</span>
                </div>
                <h3 className="text-xl font-bold text-[#2C5282] mb-2">{member.name}</h3>
                <Badge className="mb-3 bg-[#2C5282] text-white">{member.role}</Badge>
                <p className="text-gray-600 text-sm mb-4">{member.bio}</p>
                <div className="flex justify-center space-x-3">
                  <a href={member.linkedin} className="text-[#2C5282] hover:text-blue-700">
                    <Linkedin className="h-5 w-5" />
                  </a>
                  <a href={`mailto:${member.email}`} className="text-[#2C5282] hover:text-blue-700">
                    <Mail className="h-5 w-5" />
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl text-[#2C5282]">Join Our Mission</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-700 mb-6">
              We're always looking for passionate individuals to join our team and help transform Kenya's real estate landscape.
            </p>
            <div className="space-y-2">
              <p className="font-semibold text-[#2C5282]">Open Positions:</p>
              <ul className="text-gray-600 space-y-1">
                <li>• Senior Software Engineer</li>
                <li>• Data Scientist - Fraud Detection</li>
                <li>• Regional Sales Manager</li>
                <li>• Customer Success Specialist</li>
              </ul>
            </div>
            <p className="mt-6 text-sm text-gray-500">
              Send your CV to careers@triplecheck.co.ke
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
