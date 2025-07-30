import {
  Scale,
  Shield,
  FileCheck,
  Users,
  CheckCircle,
  ArrowRight,
  Award,
  BookOpen,
  Gavel,
  AlertTriangle,
  Star,
  Phone,
  Download,
} from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";

const LegalExperts: React.FC = () => {
  const keyBenefits = [
    {
      icon: <Scale className="h-6 w-6 text-blue-600" />,
      title: "Enhanced Due Diligence",
      description:
        "Access comprehensive property verification reports that strengthen your legal opinions and reduce liability exposure.",
    },
    {
      icon: <Shield className="h-6 w-6 text-green-600" />,
      title: "Risk Mitigation",
      description:
        "Identify potential fraud, title defects, and legal complications before they become costly problems for your clients.",
    },
    {
      icon: <FileCheck className="h-6 w-6 text-purple-600" />,
      title: "Document Authentication",
      description:
        "Verify the authenticity of title deeds, sale agreements, and other critical documents with AI-powered analysis.",
    },
    {
      icon: <Users className="h-6 w-6 text-orange-600" />,
      title: "Expert Network Access",
      description:
        "Connect with verified surveyors, valuers, and other professionals for comprehensive property assessments.",
    },
  ];

  const practiceAreas = [
    {
      area: "Conveyancing & Property Transfers",
      challenges: [
        "Fraudulent title deeds and duplicate ownership claims",
        "Incomplete or missing documentation",
        "Boundary disputes and survey discrepancies",
        "Unresolved succession and inheritance issues",
      ],
      solutions: [
        "Comprehensive title verification and chain of ownership analysis",
        "Real-time fraud detection and risk assessment",
        "Professional surveyor network for boundary verification",
        "Succession and probate documentation validation",
      ],
    },
    {
      area: "Real Estate Litigation",
      challenges: [
        "Gathering evidence for property fraud cases",
        "Establishing ownership and title authenticity",
        "Proving damages in fraud and breach cases",
        "Expert witness coordination and testimony",
      ],
      solutions: [
        "Forensic document analysis and authentication reports",
        "Comprehensive property history and transaction records",
        "Damage assessment tools and market analysis",
        "Expert witness network and testimony support",
      ],
    },
    {
      area: "Commercial Property Law",
      challenges: [
        "Complex ownership structures and corporate entities",
        "Large-scale development project verification",
        "Investment fund due diligence requirements",
        "Cross-border transaction complications",
      ],
      solutions: [
        "Corporate ownership verification and beneficial interest analysis",
        "Development project authenticity and permit verification",
        "Institutional-grade due diligence reports",
        "International property verification capabilities",
      ],
    },
  ];

  const caseStudies = [
    {
      title: "Prevented Kshs 45M Fraud in Kiambu Land Deal",
      client: "Leading Nairobi Law Firm",
      challenge:
        "Client was purchasing 10-acre plot for commercial development. Initial documents appeared legitimate.",
      solution:
        "TripleCheck&apos;s verification revealed the title deed was a sophisticated forgery, and the &lsquo;seller&rsquo; was using stolen identity documents.",
      outcome:
        "Transaction halted, client saved Kshs 45M, fraudster arrested by DCI Land Fraud Unit.",
      impact:
        "Law firm enhanced reputation for thorough due diligence, gained 3 new corporate clients.",
    },
    {
      title: "Resolved Complex Succession Dispute in 6 Months",
      client: "Family Law Practice in Mombasa",
      challenge:
        "Multiple heirs claiming ownership of prime beachfront property, conflicting documentation spanning 40 years.",
      solution:
        "Comprehensive family tree verification, historical document analysis, and community intelligence gathering.",
      outcome:
        "Clear ownership established, fair distribution agreed, family relationships preserved.",
      impact:
        "Case resolved 18 months faster than typical succession disputes.",
    },
    {
      title: "Streamlined Due Diligence for Kshs 2B Development",
      client: "Corporate Law Firm",
      challenge:
        "International investor required comprehensive due diligence on 50-property portfolio within 30 days.",
      solution:
        "Parallel verification of all properties using TripleCheck&apos;s expert network and AI-powered analysis.",
      outcome:
        "Complete due diligence delivered in 25 days, investment proceeded successfully.",
      impact:
        "Law firm secured ongoing relationship with international investment fund.",
    },
  ];

  const pricingPlans = [
    {
      name: "Professional",
      price: "Kshs 15,000",
      period: "per month",
      description: "For individual practitioners and small firms",
      features: [
        "Up to 20 property verifications per month",
        "Basic document authentication",
        "Standard verification reports",
        "Email support",
        "Legal template library access",
      ],
      popular: false,
    },
    {
      name: "Firm",
      price: "Kshs 45,000",
      period: "per month",
      description: "For established law firms with regular property work",
      features: [
        "Up to 100 property verifications per month",
        "Advanced document forensics",
        "Priority expert network access",
        "Custom report branding",
        "Phone and email support",
        "Client portal access",
        "Bulk verification discounts",
      ],
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "pricing",
      description: "For large firms and corporate legal departments",
      features: [
        "Unlimited property verifications",
        "Dedicated account manager",
        "Custom integration with case management systems",
        "White-label solutions",
        "24/7 priority support",
        "Advanced analytics and reporting",
        "Training and certification programs",
      ],
      popular: false,
    },
  ];

  const testimonials = [
    {
      name: "Sarah Wanjiku",
      title: "Senior Partner, Wanjiku & Associates",
      location: "Nairobi",
      quote:
        "TripleCheck has transformed our conveyancing practice. We&apos;ve prevented three major fraud cases this year alone, saving our clients over Kshs 80 million. Our professional indemnity premiums have actually decreased due to our enhanced due diligence.",
      rating: 5,
    },
    {
      name: "James Ochieng",
      title: "Managing Partner, Ochieng Legal Consultants",
      location: "Kisumu",
      quote:
        "The expert network is invaluable. Within hours, I can have a qualified surveyor on-site anywhere in Western Kenya. This has cut our transaction timelines by 60% while improving accuracy.",
      rating: 5,
    },
    {
      name: "Dr. Fatuma Hassan",
      title: "Head of Legal, Coastal Development Corporation",
      location: "Mombasa",
      quote:
        "For our large-scale developments, TripleCheck's verification gives our investors confidence. The comprehensive reports are exactly what international funders expect to see.",
      rating: 5,
    },
  ];

  const resources = [
    {
      title: "Kenya Property Law Updates",
      description:
        "Monthly briefings on changes in land law, court decisions, and regulatory updates",
      type: "Newsletter",
    },
    {
      title: "Due Diligence Checklist",
      description:
        "Comprehensive 47-point checklist for property transaction due diligence",
      type: "Template",
    },
    {
      title: "Fraud Prevention Guide",
      description:
        "Complete guide to identifying and preventing property fraud in Kenya",
      type: "Guide",
    },
    {
      title: "Expert Witness Directory",
      description:
        "Vetted directory of property experts available for litigation support",
      type: "Directory",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-blue-100 p-4 rounded-full">
                <Scale className="h-12 w-12 text-blue-600" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Legal Excellence Through
              <span className="text-blue-600 block">Verified Intelligence</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Empower your legal practice with comprehensive property
              verification, expert networks, and forensic analysis. Reduce
              liability, enhance client service, and build your reputation as
              Kenya&apos;s most thorough property lawyers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/auth/register"
                className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                Start Free Trial
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/contact"
                className="border border-blue-600 text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
              >
                Schedule Demo
                <Phone className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Leading Law Firms Choose TripleCheck
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Transform your property practice with tools designed specifically
              for legal professionals
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {keyBenefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="bg-gray-50 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Practice Areas */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Solutions for Every Practice Area
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Specialized tools and expertise for different areas of property
              law
            </p>
          </div>
          <div className="space-y-8">
            {practiceAreas.map((area, index) => (
              <div key={index} className="bg-white rounded-lg p-8 shadow-sm">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <Gavel className="h-6 w-6 text-blue-600" />
                  {area.area}
                </h3>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-lg font-semibold text-red-700 mb-4 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Common Challenges
                    </h4>
                    <ul className="space-y-2">
                      {area.challenges.map((challenge, idx) => (
                        <li
                          key={idx}
                          className="text-gray-600 flex items-start gap-2"
                        >
                          <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                          {challenge}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-green-700 mb-4 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      TripleCheck Solutions
                    </h4>
                    <ul className="space-y-2">
                      {area.solutions.map((solution, idx) => (
                        <li
                          key={idx}
                          className="text-gray-600 flex items-start gap-2"
                        >
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          {solution}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Studies */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Real Results from Real Law Firms
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              See how TripleCheck has helped legal professionals across Kenya
            </p>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            {caseStudies.map((study, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm font-medium text-gray-600">
                    {study.client}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {study.title}
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-red-700">Challenge:</span>
                    <p className="text-gray-600 mt-1">{study.challenge}</p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-700">Solution:</span>
                    <p className="text-gray-600 mt-1">{study.solution}</p>
                  </div>
                  <div>
                    <span className="font-medium text-green-700">Outcome:</span>
                    <p className="text-gray-600 mt-1">{study.outcome}</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                    <span className="font-medium text-blue-800">Impact:</span>
                    <p className="text-blue-700 mt-1">{study.impact}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Transparent Pricing for Legal Professionals
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose the plan that fits your practice size and verification
              needs
            </p>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`bg-white rounded-lg p-8 shadow-sm relative ${plan.popular ? "ring-2 ring-blue-500" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {plan.price}
                    <span className="text-lg text-gray-500 font-normal">
                      /{plan.period}
                    </span>
                  </div>
                  <p className="text-gray-600">{plan.description}</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/auth/register"
                  className={`w-full py-3 px-4 rounded-lg font-semibold text-center block transition-colors ${
                    plan.popular ?
                      "bg-blue-600 text-white hover:bg-blue-700"
                    : "border border-blue-600 text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  {plan.name === "Enterprise" ?
                    "Contact Sales"
                  : "Start Free Trial"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Trusted by Kenya&apos;s Leading Legal Professionals
            </h2>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
                <blockquote className="text-gray-700 mb-4 italic">
                  "                  &ldquo;{testimonial.quote}&rdquo;&quot;
                </blockquote>
                <div>
                  <div className="font-semibold text-gray-900">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {testimonial.title}
                  </div>
                  <div className="text-sm text-blue-600">
                    {testimonial.location}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Professional Resources & Support
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Access exclusive resources designed for legal professionals
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {resources.map((resource, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-600">
                    {resource.type}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {resource.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {resource.description}
                </p>
                <button className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1">
                  <Download className="h-4 w-4" />
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Elevate Your Legal Practice?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join over 200 legal professionals who trust TripleCheck for their
            property verification needs. Start your free trial today and see the
            difference comprehensive verification makes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/auth/register"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
            >
              Start Free 30-Day Trial
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to="/contact"
              className="border border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              Schedule Personal Demo
              <Phone className="h-5 w-5" />
            </Link>
          </div>
          <p className="text-blue-200 text-sm mt-4">
            No credit card required • Full access to all features • Cancel
            anytime
          </p>
        </div>
      </section>
    </div>
  );
};

export default LegalExperts;
