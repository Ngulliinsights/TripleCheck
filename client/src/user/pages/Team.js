"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TeamPage;
var badge_1 = require("../../local/components/ui/badge");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var lucide_react_1 = require("lucide-react");
function TeamPage() {
    // Team member data with proper typing
    var teamMembers = [
        {
            name: "John Kariuki",
            role: "CEO & Co-Founder",
            bio: "Real estate veteran with 15+ years experience in Kenya's property market, leading our mission to eliminate property fraud.",
            image: "/api/placeholder/150/150",
            linkedin: "#",
            email: "john@triplecheck.co.ke"
        },
        {
            name: "Sarah Wanjiku",
            role: "CTO & Co-Founder",
            bio: "Tech leader specializing in AI/ML and blockchain verification systems, architecting our fraud detection platform.",
            image: "/api/placeholder/150/150",
            linkedin: "#",
            email: "sarah@triplecheck.co.ke"
        },
        {
            name: "David Makau",
            role: "Head of Verification",
            bio: "Legal expert in property law and document authentication, ensuring compliance with Kenyan regulations.",
            image: "/api/placeholder/150/150",
            linkedin: "#",
            email: "david@triplecheck.co.ke"
        },
        {
            name: "Grace Achieng",
            role: "Community Manager",
            bio: "Building trust networks and user engagement across Kenya, fostering our community-driven approach.",
            image: "/api/placeholder/150/150",
            linkedin: "#",
            email: "grace@triplecheck.co.ke"
        }
    ];
    // Job openings data with proper typing
    var jobOpenings = [
        { title: "Senior Software Engineer", id: "sse-001", department: "Engineering" },
        { title: "Data Scientist - Fraud Detection", id: "ds-002", department: "AI/ML" },
        { title: "Regional Sales Manager", id: "rsm-003", department: "Sales" },
        { title: "Customer Success Specialist", id: "css-004", department: "Support" }
    ];
    // Constants for maintainability
    var CAREER_EMAIL = "careers@triplecheck.co.ke";
    return (<div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-primary/10 rounded-full">
                <lucide_react_1.Users className="w-12 h-12 text-primary"/>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Meet Our Team
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              The passionate professionals behind Kenya{"'"}s most trusted property verification platform
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16">

        {/* Team Members Grid */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Leadership Team</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Meet the experienced professionals driving innovation in Kenya&apos;s real estate verification
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map(function (member, index) { return (<card_1.Card key={"team-member-".concat(index)} className="text-center hover:shadow-lg transition-all duration-300 hover:scale-105 border-border">
                <card_1.CardContent className="pt-6">
                  {/* Profile Picture Placeholder */}
                  <div className="w-24 h-24 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center border-2 border-border" role="img" aria-label={"Profile picture of ".concat(member.name)}>
                    <lucide_react_1.Users className="w-8 h-8 text-muted-foreground" aria-hidden="true"/>
                  </div>

                  {/* Member Information */}
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    {member.name}
                  </h3>
                  <badge_1.Badge className="mb-3 bg-primary text-primary-foreground">
                    {member.role}
                  </badge_1.Badge>
                  <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                    {member.bio}
                  </p>

                  {/* Social Links */}
                  <div className="flex justify-center space-x-3">
                    <button_1.Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
                      <a href={member.linkedin} aria-label={"".concat(member.name, "&apos;s LinkedIn profile")}>
                        <lucide_react_1.Linkedin className="h-4 w-4"/>
                      </a>
                    </button_1.Button>
                    <button_1.Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
                      <a href={"mailto:".concat(member.email)} aria-label={"Email ".concat(member.name)}>
                        <lucide_react_1.Mail className="h-4 w-4"/>
                      </a>
                    </button_1.Button>
                  </div>
                </card_1.CardContent>
              </card_1.Card>); })}
          </div>
        </section>

        {/* Careers Section */}
        <section>
          <card_1.Card className="border-border">
            <card_1.CardHeader>
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-secondary/10 rounded-full">
                    <lucide_react_1.Briefcase className="w-8 h-8 text-secondary"/>
                  </div>
                </div>
                <card_1.CardTitle className="text-3xl text-foreground mb-4">
                  Join Our Mission
                </card_1.CardTitle>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  We&apos;re always looking for passionate individuals to join our team and help transform Kenya&apos;s real estate landscape.
                </p>
              </div>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-foreground mb-6 text-center">
                    Open Positions
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {jobOpenings.map(function (job) { return (<div key={job.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border hover:shadow-md transition-shadow">
                        <div>
                          <h4 className="font-medium text-foreground">{job.title}</h4>
                          <p className="text-sm text-muted-foreground">{job.department}</p>
                        </div>
                        <lucide_react_1.ArrowRight className="w-4 h-4 text-muted-foreground"/>
                      </div>); })}
                  </div>
                </div>
                
                <div className="text-center p-6 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-muted-foreground mb-4">
                    Ready to make a difference in Kenya&apos;s real estate industry?
                  </p>
                  <button_1.Button asChild>
                    <a href={"mailto:".concat(CAREER_EMAIL)}>
                      <lucide_react_1.Mail className="w-4 h-4 mr-2"/>
                      Send Your CV
                    </a>
                  </button_1.Button>
                  <p className="text-sm text-muted-foreground mt-3">
                    {CAREER_EMAIL}
                  </p>
                </div>
              </div>
            </card_1.CardContent>
          </card_1.Card>
        </section>
      </div>
    </div>);
}
