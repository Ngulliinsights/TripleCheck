import {
  Cookie,
  Settings,
  Eye,
  BarChart3,
  Shield,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import React from "react";

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

export default function Cookies() {
  const [preferences, setPreferences] = React.useState({
    essential: true, // Always required
    analytics: true,
    marketing: false,
    personalization: true,
  });

  const togglePreference = (key: keyof typeof preferences) => {
    if (key === "essential") return; // Essential cookies cannot be disabled
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const cookieTypes = [
    {
      id: "essential",
      name: "Essential Cookies",
      icon: Shield,
      required: true,
      description:
        "These cookies are necessary for the website to function and cannot be switched off.",
      examples: [
        "Authentication and session management",
        "Security and fraud prevention",
        "Basic website functionality",
        "Load balancing and performance",
      ],
      duration: "Session or up to 1 year",
    },
    {
      id: "analytics",
      name: "Analytics Cookies",
      icon: BarChart3,
      required: false,
      description:
        "These cookies help us understand how visitors interact with our website.",
      examples: [
        "Page views and user behavior",
        "Performance monitoring",
        "Error tracking and debugging",
        "Feature usage statistics",
      ],
      duration: "Up to 2 years",
    },
    {
      id: "marketing",
      name: "Marketing Cookies",
      icon: Eye,
      required: false,
      description:
        "These cookies are used to deliver relevant advertisements and track campaign effectiveness.",
      examples: [
        "Targeted advertising",
        "Social media integration",
        "Campaign performance tracking",
        "Cross-platform user identification",
      ],
      duration: "Up to 1 year",
    },
    {
      id: "personalization",
      name: "Personalization Cookies",
      icon: Settings,
      required: false,
      description:
        "These cookies enable us to provide enhanced functionality and personalization.",
      examples: [
        "User preferences and settings",
        "Language and region preferences",
        "Customized content delivery",
        "Saved searches and favorites",
      ],
      duration: "Up to 6 months",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Cookie className="h-12 w-12 text-primary mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Cookie Policy</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Learn about how we use cookies and similar technologies to improve
            your experience on TripleCheck.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Last updated: December 2024
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* What Are Cookies */}
          <Card>
            <CardHeader>
              <CardTitle>What Are Cookies?</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                Cookies are small text files that are stored on your device when
                you visit our website. They help us provide you with a better
                experience by remembering your preferences, keeping you logged
                in, and helping us understand how you use our services.
              </p>
              <p>
                We also use similar technologies like web beacons, pixels, and
                local storage to enhance functionality and gather insights about
                our platform's performance.
              </p>
            </CardContent>
          </Card>

          {/* Cookie Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Cookie Preferences</span>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="sm"
                >
                  Save Preferences
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">
                Manage your cookie preferences below. Essential cookies cannot
                be disabled as they are required for basic website
                functionality.
              </p>

              <div className="space-y-6">
                {cookieTypes.map((type) => {
                  const Icon = type.icon;
                  const isEnabled =
                    preferences[type.id as keyof typeof preferences];

                  return (
                    <div key={type.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          <Icon className="h-5 w-5 text-primary mr-3" />
                          <div>
                            <h3 className="font-semibold text-lg">
                              {type.name}
                            </h3>
                            {type.required && (
                              <Badge variant="secondary" className="mt-1">
                                Required
                              </Badge>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            togglePreference(
                              type.id as keyof typeof preferences
                            )
                          }
                          disabled={type.required}
                          className={`p-1 ${type.required ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                        >
                          {isEnabled ?
                            <ToggleRight className="h-8 w-8 text-primary" />
                          : <ToggleLeft className="h-8 w-8 text-gray-400" />}
                        </button>
                      </div>

                      <p className="text-gray-600 mb-3">{type.description}</p>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Examples:</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {type.examples.map((example, index) => (
                              <li key={index}>• {example}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Duration:</h4>
                          <p className="text-sm text-gray-600">
                            {type.duration}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* How We Use Cookies */}
          <Card>
            <CardHeader>
              <CardTitle>How We Use Cookies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-3">
                  Authentication & Security
                </h3>
                <p className="text-gray-700">
                  We use cookies to keep you logged in securely and protect
                  against unauthorized access. These cookies help us verify your
                  identity and maintain your session across page visits.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">
                  Performance & Analytics
                </h3>
                <p className="text-gray-700">
                  Analytics cookies help us understand how users interact with
                  our platform, which pages are most popular, and where
                  improvements can be made. This data is aggregated and
                  anonymous.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">Personalization</h3>
                <p className="text-gray-700">
                  We use cookies to remember your preferences, such as language
                  settings, dashboard configurations, and search filters, to
                  provide a more personalized experience.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">Fraud Prevention</h3>
                <p className="text-gray-700">
                  Cookies help us detect and prevent fraudulent activities by
                  tracking suspicious patterns and maintaining security measures
                  across our verification platform.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Third-Party Cookies */}
          <Card>
            <CardHeader>
              <CardTitle>Third-Party Cookies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                We work with trusted third-party services that may set their own
                cookies:
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Analytics Partners</h4>
                  <ul className="space-y-1 text-gray-700">
                    <li>• Google Analytics (performance tracking)</li>
                    <li>• Mixpanel (user behavior analysis)</li>
                    <li>• Hotjar (user experience insights)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Service Providers</h4>
                  <ul className="space-y-1 text-gray-700">
                    <li>• Payment processors (transaction security)</li>
                    <li>• CDN providers (content delivery)</li>
                    <li>• Support chat services (customer assistance)</li>
                  </ul>
                </div>
              </div>

              <p className="text-sm text-gray-600 mt-4">
                These third parties have their own privacy policies and cookie
                practices. We recommend reviewing their policies for more
                information about their data handling practices.
              </p>
            </CardContent>
          </Card>

          {/* Managing Cookies */}
          <Card>
            <CardHeader>
              <CardTitle>Managing Your Cookies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Browser Settings</h4>
                <p className="text-gray-700">
                  Most web browsers allow you to control cookies through their
                  settings. You can typically block or delete cookies, though
                  this may affect website functionality.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Opt-Out Tools</h4>
                <p className="text-gray-700">
                  You can opt out of certain analytics and advertising cookies
                  using industry opt-out tools:
                </p>
                <ul className="mt-2 space-y-1 text-gray-700">
                  <li>• Google Analytics Opt-out Browser Add-on</li>
                  <li>• Network Advertising Initiative opt-out page</li>
                  <li>• Digital Advertising Alliance opt-out page</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Mobile Devices</h4>
                <p className="text-gray-700">
                  On mobile devices, you can manage cookies and similar
                  technologies through your device settings or by adjusting
                  preferences within our mobile application.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Updates to This Policy */}
          <Card>
            <CardHeader>
              <CardTitle>Updates to This Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                We may update this Cookie Policy from time to time to reflect
                changes in our practices or for other operational, legal, or
                regulatory reasons. We will notify you of any material changes
                by posting the updated policy on our website.
              </p>
              <p className="text-gray-700 mt-4">
                Your continued use of our services after any changes indicates
                your acceptance of the updated Cookie Policy.
              </p>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Questions About Cookies</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                If you have questions about our use of cookies or this policy,
                please contact us:
              </p>
              <div className="space-y-2 text-gray-700">
                <p>Email: privacy@triplecheck.africa</p>
                <p>Phone: +254 (0) 800 TRIPLE (874753)</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
