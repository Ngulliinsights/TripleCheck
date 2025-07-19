import { Card, CardContent, CardHeader, CardTitle } from "../../shared/components/ui/card";
import { Badge } from "../../shared/components/ui/badge";
import { Linkedin, Mail } from "lucide-react";

// Type definition for team member data structure
interface TeamMember {
  name: string;
  role: string;
  bio: string;
  image: string;
  linkedin: string;
  email: string;
}

// Type definition for job opening structure
interface JobOpening {
  title: string;
  id: string;
}

export default function TeamPage(): JSX.Element {
  // Team member data with proper typing
  const teamMembers: TeamMember[] = [
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

  // Job openings data with proper typing
  const jobOpenings: JobOpening[] = [
    { title: "Senior Software Engineer", id: "sse-001" },
    { title: "Data Scientist - Fraud Detection", id: "ds-002" },
    { title: "Regional Sales Manager", id: "rsm-003" },
    { title: "Customer Success Specialist", id: "css-004" }
  ];

  // Constants for maintainability
  const BRAND_COLOR = "#2C5282";
  const CAREER_EMAIL = "careers@triplecheck.co.ke";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header Section */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#2C5282] mb-4">
            Meet Our Team
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            The passionate professionals behind Kenya's most trusted property verification platform
          </p>
        </header>

        {/* Team Members Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {teamMembers.map((member, index) => (
            <Card 
              key={`team-member-${index}`} 
              className="text-center hover:shadow-lg transition-shadow duration-300"
            >
              <CardContent className="pt-6">
                {/* Profile Picture Placeholder */}
                <div 
                  className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center"
                  role="img"
                  aria-label={`Profile picture of ${member.name}`}
                >
                  <span className="text-4xl text-gray-500" aria-hidden="true">
                    👤
                  </span>
                </div>

                {/* Member Information */}
                <h3 className="text-xl font-bold text-[#2C5282] mb-2">
                  {member.name}
                </h3>
                <Badge className="mb-3 bg-[#2C5282] text-white">
                  {member.role}
                </Badge>
                <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                  {member.bio}
                </p>

                {/* Social Links */}
                <div className="flex justify-center space-x-3">
                  <a 
                    href={member.linkedin} 
                    className="text-[#2C5282] hover:text-blue-700 transition-colors duration-200"
                    aria-label={`${member.name}'s LinkedIn profile`}
                  >
                    <Linkedin className="h-5 w-5" />
                  </a>
                  <a 
                    href={`mailto:${member.email}`} 
                    className="text-[#2C5282] hover:text-blue-700 transition-colors duration-200"
                    aria-label={`Email ${member.name}`}
                  >
                    <Mail className="h-5 w-5" />
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Careers Section */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-2xl text-[#2C5282]">
                Join Our Mission
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-700 mb-6 leading-relaxed">
                We're always looking for passionate individuals to join our team and help transform Kenya's real estate landscape.
              </p>
              
              <div className="space-y-2">
                <p className="font-semibold text-[#2C5282]">
                  Open Positions:
                </p>
                <ul className="text-gray-600 space-y-1" role="list">
                  {jobOpenings.map((job) => (
                    <li key={job.id} role="listitem">
                      • {job.title}
                    </li>
                  ))}
                </ul>
              </div>
              
              <p className="mt-6 text-sm text-gray-500">
                Send your CV to{" "}
                <a 
                  href={`mailto:${CAREER_EMAIL}`}
                  className="text-[#2C5282] hover:text-blue-700 transition-colors duration-200"
                >
                  {CAREER_EMAIL}
                </a>
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}