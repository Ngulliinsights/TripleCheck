import { Shield, Mail, Phone, MapPin, ArrowRight } from "lucide-react";
import React from "react";

import { Button } from "../ui/button";
import { Logo } from "../ui/logo";
import { ThemeToggle } from "../ui/theme-toggle";
import { Wordmark } from "../ui/wordmark";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      {/* Newsletter CTA Section - Enhanced with better spacing and typography */}
      <div className="bg-gradient-to-r from-primary to-primary/80 relative overflow-hidden">
        {/* Subtle texture overlay for visual interest without breaking existing structure */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.05)_0%,transparent_50%)] pointer-events-none"></div>

        <div className="container mx-auto px-4 py-12 relative">
          <div className="flex flex-col md:flex-row items-center justify-between max-w-6xl mx-auto">
            <div className="mb-6 md:mb-0 text-center md:text-left">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 leading-tight">
                Stay Protected with TripleCheck
              </h3>
              <p className="text-white/90 text-lg max-w-md">
                Get the latest fraud alerts and property verification tips
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="px-6 py-3 rounded-xl text-gray-900 min-w-[280px] shadow-lg border-0 focus:ring-4 focus:ring-white/25 transition-all duration-200"
              />
              <Button
                variant="secondary"
                className="whitespace-nowrap px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Subscribe <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content - Improved spacing and visual hierarchy */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand Section - Enhanced typography and contact styling */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <Logo size="md" variant="default" />
              <Wordmark size="md" variant="default" animated={true} />
            </div>
            <p className="text-gray-300 mb-8 max-w-md text-lg leading-relaxed">
              Africa's leading real estate verification platform. Protecting
              property transactions with AI-powered fraud detection and
              community trust systems.
            </p>

            {/* Contact Info - Better visual treatment with hover effects */}
            <div className="space-y-4">
              <div className="flex items-center text-gray-300 hover:text-white transition-colors duration-200 group">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-800/50 mr-4 group-hover:bg-primary/20 transition-colors duration-200">
                  <Mail className="h-4 w-4" />
                </div>
                <span className="text-base">support@triplecheck.africa</span>
              </div>
              <div className="flex items-center text-gray-300 hover:text-white transition-colors duration-200 group">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-800/50 mr-4 group-hover:bg-primary/20 transition-colors duration-200">
                  <Phone className="h-4 w-4" />
                </div>
                <span className="text-base">+254 (0) 800 TRIPLE (874753)</span>
              </div>
              <div className="flex items-center text-gray-300">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-800/50 mr-4">
                  <MapPin className="h-4 w-4" />
                </div>
                <span className="text-base">Nairobi, Kenya</span>
              </div>
            </div>
          </div>

          {/* Services - Enhanced link styling with better hover states */}
          <div>
            <h3 className="font-semibold mb-6 text-white text-lg">
              Verification Services
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="/services/basic-checks"
                  className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center justify-between group py-2 px-3 rounded-lg hover:bg-gray-800/30"
                >
                  <span>Property Verification</span>
                  <ArrowRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </a>
              </li>
              <li>
                <a
                  href="/community-resources"
                  className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center justify-between group py-2 px-3 rounded-lg hover:bg-gray-800/30"
                >
                  <span>Community & Resources</span>
                  <ArrowRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </a>
              </li>
              <li>
                <a
                  href="/services/document-auth"
                  className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center justify-between group py-2 px-3 rounded-lg hover:bg-gray-800/30"
                >
                  <span>Document Authentication</span>
                  <ArrowRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </a>
              </li>
              <li>
                <a
                  href="/services/reputation"
                  className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center justify-between group py-2 px-3 rounded-lg hover:bg-gray-800/30"
                >
                  <span>Trust & Reputation</span>
                  <ArrowRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </a>
              </li>
              <li>
                <a
                  href="/services/list-property"
                  className="text-primary hover:text-primary/80 transition-colors duration-200 font-medium flex items-center justify-between group py-2 px-3 rounded-lg hover:bg-primary/10"
                >
                  <span>List Your Property</span>
                  <ArrowRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </a>
              </li>
            </ul>
          </div>

          {/* Solutions - Matching enhanced styling */}
          <div>
            <h3 className="font-semibold mb-6 text-white text-lg">Solutions</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="/solutions/buyers"
                  className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center justify-between group py-2 px-3 rounded-lg hover:bg-gray-800/30"
                >
                  <span>For Property Buyers</span>
                  <ArrowRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </a>
              </li>
              <li>
                <a
                  href="/solutions/sellers"
                  className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center justify-between group py-2 px-3 rounded-lg hover:bg-gray-800/30"
                >
                  <span>For Property Sellers</span>
                  <ArrowRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </a>
              </li>
              <li>
                <a
                  href="/solutions/agents"
                  className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center justify-between group py-2 px-3 rounded-lg hover:bg-gray-800/30"
                >
                  <span>For Real Estate Agents</span>
                  <ArrowRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </a>
              </li>
              <li>
                <a
                  href="/solutions/developers"
                  className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center justify-between group py-2 px-3 rounded-lg hover:bg-gray-800/30"
                >
                  <span>For Developers</span>
                  <ArrowRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </a>
              </li>
              <li>
                <a
                  href="/pricing"
                  className="text-primary hover:text-primary/80 transition-colors duration-200 font-medium flex items-center justify-between group py-2 px-3 rounded-lg hover:bg-primary/10"
                >
                  <span>View Pricing</span>
                  <ArrowRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </a>
              </li>
            </ul>
          </div>

          {/* Resources & Support - Consistent enhanced styling */}
          <div>
            <h3 className="font-semibold mb-6 text-white text-lg">
              Resources & Support
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="/help"
                  className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center justify-between group py-2 px-3 rounded-lg hover:bg-gray-800/30"
                >
                  <span>Help Center</span>
                  <ArrowRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </a>
              </li>
              <li>
                <a
                  href="/help/getting-started"
                  className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center justify-between group py-2 px-3 rounded-lg hover:bg-gray-800/30"
                >
                  <span>Getting Started Guide</span>
                  <ArrowRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </a>
              </li>
              <li>
                <a
                  href="/blog"
                  className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center justify-between group py-2 px-3 rounded-lg hover:bg-gray-800/30"
                >
                  <span>Blog & Insights</span>
                  <ArrowRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </a>
              </li>
              <li>
                <a
                  href="/our-story"
                  className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center justify-between group py-2 px-3 rounded-lg hover:bg-gray-800/30"
                >
                  <span>About Us</span>
                  <ArrowRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </a>
              </li>
              <li>
                <a
                  href="/static/partners"
                  className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center justify-between group py-2 px-3 rounded-lg hover:bg-gray-800/30"
                >
                  <span>Partners</span>
                  <ArrowRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  className="text-primary hover:text-primary/80 transition-colors duration-200 font-medium flex items-center justify-between group py-2 px-3 rounded-lg hover:bg-primary/10"
                >
                  <span>Contact Support</span>
                  <ArrowRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section - Refined spacing and styling */}
        <div className="border-t border-gray-800 mt-16 pt-12">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div className="text-gray-400 mb-6 md:mb-0 text-center md:text-left">
              <p className="text-base">
                &copy; 2024 TripleCheck Africa. All rights reserved.
              </p>
            </div>

            {/* Legal Links - Better spacing and hover effects */}
            <div className="flex flex-wrap gap-8 text-gray-400 text-sm">
              <a
                href="/privacy"
                className="hover:text-white transition-colors duration-200 py-1"
              >
                Privacy Policy
              </a>
              <a
                href="/terms"
                className="hover:text-white transition-colors duration-200 py-1"
              >
                Terms of Service
              </a>
              <a
                href="/cookies"
                className="hover:text-white transition-colors duration-200 py-1"
              >
                Cookie Policy
              </a>
              <a
                href="/security"
                className="hover:text-white transition-colors duration-200 py-1"
              >
                Security
              </a>
            </div>
          </div>

          {/* Trust Indicators - Enhanced visual treatment */}
          <div className="pt-8 border-t border-gray-800/50">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="text-sm text-gray-400 mb-6 md:mb-0 flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>SSL Secured</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>SOC 2 Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>ISO 27001 Certified</span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <ThemeToggle />
                <Button
                  variant="outline"
                  size="sm"
                  className="text-gray-400 border-gray-600 hover:text-white hover:border-gray-400 transition-all duration-200"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Security Center
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
