import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

interface BreadcrumbNavigationProps {
  items: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
  separator?: React.ReactNode;
  maxItems?: number;
}

export function BreadcrumbNavigation({
  items,
  className,
  showHome = true,
  separator,
  maxItems = 5
}: BreadcrumbNavigationProps) {
  // Add home item if requested
  const allItems = showHome 
    ? [{ label: 'Home', href: '/', isActive: false }, ...items]
    : items;

  // Truncate items if too many
  const displayItems = allItems.length > maxItems 
    ? [
        allItems[0],
        { label: '...', href: undefined, isActive: false },
        ...allItems.slice(-2)
      ]
    : allItems;

  const defaultSeparator = separator || <ChevronRight className="w-4 h-4 text-gray-400" />;

  return (
    <nav
      className={cn('flex items-center space-x-2 text-sm', className)}
      aria-label="Breadcrumb navigation"
    >
      <ol className="flex items-center space-x-2">
        {displayItems.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center">
            {index > 0 && (
              <span className="mx-2" aria-hidden="true">
                {defaultSeparator}
              </span>
            )}
            
            {item.href && !item.isActive ? (
              <a
                href={item.href}
                className={cn(
                  'hover:text-primary transition-colors duration-150',
                  index === 0 && showHome ? 'flex items-center' : '',
                  'text-gray-600 hover:text-gray-900'
                )}
                aria-current={item.isActive ? 'page' : undefined}
              >
                {index === 0 && showHome && item.label === 'Home' ? (
                  <Home className="w-4 h-4" />
                ) : (
                  item.label
                )}
              </a>
            ) : (
              <span
                className={cn(
                  item.isActive 
                    ? 'text-gray-900 font-medium' 
                    : 'text-gray-500',
                  index === 0 && showHome && item.label === 'Home' ? 'flex items-center' : ''
                )}
                aria-current={item.isActive ? 'page' : undefined}
              >
                {index === 0 && showHome && item.label === 'Home' ? (
                  <Home className="w-4 h-4" />
                ) : (
                  item.label
                )}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// Hook to generate breadcrumbs from current path
export function useBreadcrumbs(customItems?: BreadcrumbItem[]) {
  const [breadcrumbs, setBreadcrumbs] = React.useState<BreadcrumbItem[]>([]);

  React.useEffect(() => {
    if (customItems) {
      setBreadcrumbs(customItems);
      return;
    }

    // Generate breadcrumbs from current path
    const path = window.location.pathname;
    const segments = path.split('/').filter(Boolean);
    
    const items: BreadcrumbItem[] = segments.map((segment, index) => {
      const href = '/' + segments.slice(0, index + 1).join('/');
      const isLast = index === segments.length - 1;
      
      // Convert segment to readable label
      const label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      return {
        label,
        href: isLast ? undefined : href,
        isActive: isLast
      };
    });

    setBreadcrumbs(items);
  }, [customItems]);

  return breadcrumbs;
}