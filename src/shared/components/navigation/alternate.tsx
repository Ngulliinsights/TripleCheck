import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Logo, Wordmark, Button, ThemeToggle, NavigationSearch } from '@/ui';
import { MobileNav, MobileNavFallback } from '@/navigation';
import { SafeNavigation } from '@/navigation/SafeNavigation';
import { useScrollSpy } from '@/hooks/useScrollSpy';
import { useDropdownManager } from '@/hooks/useDropdownManager';
import { navItems } from '@/data/navItems';
import { cn } from '@/lib/utils';

export function Navigation({ className, variant = 'transparent' }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isScrolled = useScrollSpy(20);
  const { active, open, close } = useDropdownManager();

  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;

  if (!isDesktop) {
    return (
      <SafeNavigation fallback={<MobileNavFallback />}>
        <MobileNav />
      </SafeNavigation>
    );
  }

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        variant === 'transparent' && !isScrolled
          ? 'bg-transparent py-4'
          : 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 py-2',
        className
      )}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        {/* Brand */}
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-4 hover:opacity-90 transition-opacity"
          aria-label="Home"
        >
          <Logo size="md" variant={variant === 'transparent' && !isScrolled ? 'light' : 'default'} />
          <Wordmark size="md" variant={variant === 'transparent' && !isScrolled ? 'light' : 'default'} />
        </button>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center gap-8">
          {navItems.map((item) =>
            item.dropdown ? (
              <div key={item.label} className="relative">
                <button
                  onMouseEnter={() => open(item.label)}
                  onMouseLeave={close}
                  aria-expanded={active === item.label}
                  className={cn(
                    'flex items-center gap-1 px-3 py-2 rounded-md transition',
                    variant === 'transparent' && !isScrolled
                      ? 'text-white hover:bg-white/10'
                      : 'text-gray-700 hover:text-primary'
                  )}
                >
                  {item.label}
                </button>

                {active === item.label && (
                  <div
                    className="absolute top-full left-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 py-2"
                    onMouseEnter={() => open(item.label)}
                    onMouseLeave={close}
                  >
                    {item.dropdown.map((d) => (
                      <a
                        key={d.href}
                        href={d.href}
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(d.href);
                        }}
                        className="block px-4 py-2 hover:bg-gray-50"
                      >
                        <div className="font-medium text-gray-900">{d.label}</div>
                        <div className="text-xs text-gray-500">{d.description}</div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <button
                key={item.label}
                onClick={() => navigate(item.href)}
                className={cn(
                  'px-3 py-2 rounded-md transition',
                  variant === 'transparent' && !isScrolled
                    ? 'text-white hover:bg-white/10'
                    : 'text-gray-700 hover:text-primary',
                  pathname === item.href && 'font-semibold text-primary'
                )}
              >
                {item.label}
              </button>
            )
          )}
        </div>

        {/* Search & Actions */}
        <div className="hidden lg:flex items-center gap-4">
          <NavigationSearch variant="compact" />
          <ThemeToggle />
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/auth/login')}
          >
            Login
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/auth/register')}
          >
            Get Started
          </Button>
        </div>

        {/* Mobile */}
        <SafeNavigation fallback={<MobileNavFallback />}>
          <MobileNav />
        </SafeNavigation>
      </div>
    </nav>
  );
}