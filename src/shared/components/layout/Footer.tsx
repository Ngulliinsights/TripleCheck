import React from 'react';
import { Shield, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Logo } from '../ui/logo';
import { Wordmark } from '../ui/wordmark';
import { ThemeToggle } from '../ui/theme-toggle';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      {/* Newsletter CTA Section */}
      <div className="bg-gradient-to-r from-primary to-primary/80">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold text-white mb-2">Stay Protected with TripleCheck</h3>
              <p className="text-white/90">Get the latest fraud alerts and property verification tips</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="px-4 py-2 rounded-lg text-gray-900 min-w-[250px]"
              />
              <Button variant="secondary" className="whitespace-nowrap">
                Subscribe <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <Logo size="md" variant="default" />
              <Wordmark 
                size="md"
                variant="default"
                animated={true}
              />
            </div>
            <p className="text-gray-400 mb-6 max-w-md">
              Africa's leading real estate verification platform. Protecting property transactions 
              with AI-powered fraud detection and community trust systems.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center text-gray-400">
                <Mail className="h-4 w-4 mr-3" />
                <span>support@triplecheck.africa</span>
              </div>
              <div className="flex items-center text-gray-400">
                <Phone className="h-4 w-4 mr-3" />
                <span>+254 (0) 800 TRIPLE (874753)</span>
              </div>
              <div className="flex items-center text-gray-400">
                <MapPin className="h-4 w-4 mr-3" />
                <span>Nairobi, Kenya</span>
              </div>
            </div>
          </div>
          
          {/* Services */}
          <div>
            <h3 className="font-semibold mb-4 text-white">Verification Services</h3>
            <ul className="space-y-3 text-gray-400">
              <li>
                <a href="/services/basic-checks" className="hover:text-white transition-colors flex items-center">
                  Property Verification
                  <ArrowRight className="ml-1 h-3 w-3" />
                </a>
              </li>
              <li>
                <a href="/community-resources" className="hover:text-white transition-colors flex items-center">
                  Community & Resources
                  <ArrowRight className="ml-1 h-3 w-3" />
                </a>
              </li>
              <li>
                <a href="/services/document-auth" className="hover:text-white transition-colors flex items-center">
                  Document Authentication
                  <ArrowRight className="ml-1 h-3 w-3" />
                </a>
              </li>
              <li>
                <a href="/services/reputation" className="hover:text-white transition-colors flex items-center">
                  Trust & Reputation
                  <ArrowRight className="ml-1 h-3 w-3" />
                </a>
              </li>
              <li>
                <a href="/services/list-property" className="hover:text-primary transition-colors font-medium flex items-center">
                  List Your Property
                  <ArrowRight className="ml-1 h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>
          
          {/* Solutions */}
          <div>
            <h3 className="font-semibold mb-4 text-white">Solutions</h3>
            <ul className="space-y-3 text-gray-400">
              <li>
                <a href="/solutions/buyers" className="hover:text-white transition-colors flex items-center">
                  For Property Buyers
                  <ArrowRight className="ml-1 h-3 w-3" />
                </a>
              </li>
              <li>
                <a href="/solutions/sellers" className="hover:text-white transition-colors flex items-center">
                  For Property Sellers
                  <ArrowRight className="ml-1 h-3 w-3" />
                </a>
              </li>
              <li>
                <a href="/solutions/agents" className="hover:text-white transition-colors flex items-center">
                  For Real Estate Agents
                  <ArrowRight className="ml-1 h-3 w-3" />
                </a>
              </li>
              <li>
                <a href="/solutions/developers" className="hover:text-white transition-colors flex items-center">
                  For Developers
                  <ArrowRight className="ml-1 h-3 w-3" />
                </a>
              </li>
              <li>
                <a href="/pricing" className="hover:text-primary transition-colors font-medium flex items-center">
                  View Pricing
                  <ArrowRight className="ml-1 h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>
          
          {/* Resources & Support */}
          <div>
            <h3 className="font-semibold mb-4 text-white">Resources & Support</h3>
            <ul className="space-y-3 text-gray-400">
              <li>
                <a href="/help" className="hover:text-white transition-colors flex items-center">
                  Help Center
                  <ArrowRight className="ml-1 h-3 w-3" />
                </a>
              </li>
              <li>
                <a href="/help/getting-started" className="hover:text-white transition-colors flex items-center">
                  Getting Started Guide
                  <ArrowRight className="ml-1 h-3 w-3" />
                </a>
              </li>
              <li>
                <a href="/blog" className="hover:text-white transition-colors flex items-center">
                  Blog & Insights
                  <ArrowRight className="ml-1 h-3 w-3" />
                </a>
              </li>
              <li>
                <a href="/our-story" className="hover:text-white transition-colors flex items-center">
                  About Us
                  <ArrowRight className="ml-1 h-3 w-3" />
                </a>
              </li>
              <li>
                <a href="/static/partners" className="hover:text-white transition-colors flex items-center">
                  Partners
                  <ArrowRight className="ml-1 h-3 w-3" />
                </a>
              </li>
              <li>
                <a href="/contact" className="hover:text-primary transition-colors font-medium flex items-center">
                  Contact Support
                  <ArrowRight className="ml-1 h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 mb-4 md:mb-0">
              <p>&copy; 2024 TripleCheck Africa. All rights reserved.</p>
            </div>
            
            {/* Legal Links */}
            <div className="flex flex-wrap gap-6 text-gray-400 text-sm">
              <a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="/terms" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="/cookies" className="hover:text-white transition-colors">Cookie Policy</a>
              <a href="/security" className="hover:text-white transition-colors">Security</a>
            </div>
          </div>
          
          {/* Trust Indicators */}
          <div className="mt-6 pt-6 border-t border-gray-800">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="text-sm text-gray-500 mb-4 md:mb-0">
                🔒 SSL Secured • 🛡️ SOC 2 Compliant • 🏆 ISO 27001 Certified
              </div>
              <div className="flex items-center space-x-4">
                <ThemeToggle />
                <Button variant="outline" size="sm" className="text-gray-400 border-gray-600 hover:text-white hover:border-gray-400">
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