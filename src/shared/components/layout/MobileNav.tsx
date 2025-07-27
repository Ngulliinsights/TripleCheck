import React, { useState } from 'react';
import { Menu, X, Shield, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Logo } from '../ui/logo';
import { Wordmark } from '../ui/wordmark';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface MobileNavProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function MobileNav({ isOpen, onToggle }: MobileNavProps) {
  const [servicesOpen, setServicesOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        className="md:hidden"
        onClick={onToggle}
        aria-label="Toggle mobile menu"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile menu overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 md:hidden" onClick={onToggle} />
      )}

      {/* Mobile menu panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Logo size="sm" variant="default" />
              <Wordmark 
                size="sm"
                variant="default"
                animated={true}
              />
            </div>
            <Button variant="ghost" size="sm" onClick={onToggle}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation items */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {/* Home */}
              <a
                href="/"
                className="block py-2 text-gray-700 hover:text-primary transition-colors"
                onClick={onToggle}
              >
                Home
              </a>

              {/* Services */}
              <div>
                <button
                  className="flex items-center justify-between w-full py-2 text-gray-700 hover:text-primary transition-colors"
                  onClick={() => setServicesOpen(!servicesOpen)}
                >
                  Services
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      servicesOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {servicesOpen && (
                  <div className="ml-4 mt-2 space-y-2">
                    <a
                      href="/services/basic-checks"
                      className="block py-1 text-sm text-gray-600 hover:text-primary transition-colors"
                      onClick={onToggle}
                    >
                      Property Verification
                    </a>
                    <a
                      href="/services/fraud-detection"
                      className="block py-1 text-sm text-gray-600 hover:text-primary transition-colors"
                      onClick={onToggle}
                    >
                      Fraud Detection
                    </a>
                    <a
                      href="/services/document-auth"
                      className="block py-1 text-sm text-gray-600 hover:text-primary transition-colors"
                      onClick={onToggle}
                    >
                      Document Authentication
                    </a>
                    <a
                      href="/services/reputation"
                      className="block py-1 text-sm text-gray-600 hover:text-primary transition-colors"
                      onClick={onToggle}
                    >
                      Trust & Reputation
                    </a>
                  </div>
                )}
              </div>

              {/* Solutions */}
              <div>
                <button
                  className="flex items-center justify-between w-full py-2 text-gray-700 hover:text-primary transition-colors"
                  onClick={() => setSolutionsOpen(!solutionsOpen)}
                >
                  Solutions
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      solutionsOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {solutionsOpen && (
                  <div className="ml-4 mt-2 space-y-2">
                    <a
                      href="/solutions/buyers"
                      className="block py-1 text-sm text-gray-600 hover:text-primary transition-colors"
                      onClick={onToggle}
                    >
                      For Buyers
                    </a>
                    <a
                      href="/solutions/sellers"
                      className="block py-1 text-sm text-gray-600 hover:text-primary transition-colors"
                      onClick={onToggle}
                    >
                      For Sellers
                    </a>
                    <a
                      href="/solutions/agents"
                      className="block py-1 text-sm text-gray-600 hover:text-primary transition-colors"
                      onClick={onToggle}
                    >
                      For Agents
                    </a>
                    <a
                      href="/solutions/developers"
                      className="block py-1 text-sm text-gray-600 hover:text-primary transition-colors"
                      onClick={onToggle}
                    >
                      For Developers
                    </a>
                  </div>
                )}
              </div>

              {/* Properties */}
              <a
                href="/properties"
                className="block py-2 text-gray-700 hover:text-primary transition-colors"
                onClick={onToggle}
              >
                Properties
              </a>

              {/* Pricing */}
              <a
                href="/pricing"
                className="block py-2 text-gray-700 hover:text-primary transition-colors"
                onClick={onToggle}
              >
                Pricing
              </a>

              {/* Help */}
              <a
                href="/help"
                className="block py-2 text-gray-700 hover:text-primary transition-colors"
                onClick={onToggle}
              >
                Help
              </a>
            </div>
          </nav>

          {/* Footer actions */}
          <div className="p-4 border-t space-y-3">
            <Button variant="outline" className="w-full" onClick={onToggle}>
              Sign In
            </Button>
            <Button className="w-full" onClick={onToggle}>
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default MobileNav;