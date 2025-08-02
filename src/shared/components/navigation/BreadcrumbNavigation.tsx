import { ChevronRight, Home } from "lucide-react";
import React from "react";

import { cn } from "@/shared/lib/utils";

interface BreadcrumbItem {
  readonly label: string;
  readonly href?: string | undefined;
  readonly isActive?: boolean;
}

interface BreadcrumbNavigationProps {
  readonly items: BreadcrumbItem[];
  readonly className?: string;
  readonly showHome?: boolean;
  readonly separator?: React.ReactNode;
  readonly maxItems?: number;
}

/**
 * Renders a breadcrumb navigation component with customizable styling and behavior.
 * Supports home icon, custom separators, and automatic truncation for long paths.
 */
export function BreadcrumbNavigation({
  items,
  className,
  showHome = true,
  separator,
  maxItems = 5,
}: BreadcrumbNavigationProps) {
  // Add home item if requested - this creates the foundation of our navigation path
  const allItems =
    showHome ?
      [{ label: "Home", href: "/", isActive: false } as const, ...items]
    : items;

  // Handle truncation logic when we have too many items to display cleanly
  const displayItems =
    allItems.length > maxItems ?
      [
        allItems[0], // Always keep the first item (usually Home)
        { label: "...", href: undefined, isActive: false } as const, // Ellipsis indicator
        ...allItems.slice(-2), // Keep the last two items for context
      ]
    : allItems;

  const defaultSeparator = separator || (
    <ChevronRight className="w-4 h-4 text-gray-400" />
  );

  return (
    <nav
      className={cn("flex items-center space-x-2 text-sm", className)}
      aria-label="Breadcrumb navigation"
    >
      <ol className="flex items-center space-x-2">
        {displayItems.map(
          (item, index) =>
            item && (
              <BreadcrumbItem
                key={`${item.label}-${index}`}
                item={item}
                index={index}
                showHome={showHome}
                separator={defaultSeparator}
              />
            )
        )}
      </ol>
    </nav>
  );
}

/**
 * Props for the individual breadcrumb item component
 */
interface BreadcrumbItemProps {
  readonly item: BreadcrumbItem;
  readonly index: number;
  readonly showHome: boolean;
  readonly separator: React.ReactNode;
}

/**
 * Individual breadcrumb item component - extracted to reduce complexity
 * and improve maintainability of the main component.
 */
function BreadcrumbItem({
  item,
  index,
  showHome,
  separator,
}: BreadcrumbItemProps) {
  const isHomeItem = index === 0 && showHome && item.label === "Home";
  const shouldShowIcon = isHomeItem;

  return (
    <li className="flex items-center">
      {index > 0 && (
        <span className="mx-2" aria-hidden="true">
          {separator}
        </span>
      )}

      {renderBreadcrumbContent(item, shouldShowIcon)}
    </li>
  );
}

/**
 * Renders the actual content of a breadcrumb item (link or span)
 * based on whether it's active and has an href.
 */
function renderBreadcrumbContent(
  item: BreadcrumbItem,
  shouldShowIcon: boolean
) {
  const content = shouldShowIcon ? <Home className="w-4 h-4" /> : item.label;

  // If item has href and is not active, render as a clickable link
  if (item.href && !item.isActive) {
    return (
      <a
        href={item.href}
        className={cn(
          "hover:text-primary transition-colors duration-150",
          shouldShowIcon ? "flex items-center" : "",
          "text-gray-600 hover:text-gray-900"
        )}
        aria-current={item.isActive ? "page" : undefined}
      >
        {content}
      </a>
    );
  }

  // Otherwise, render as a span (for active items or items without links)
  return (
    <span
      className={cn(
        item.isActive ? "text-gray-900 font-medium" : "text-gray-500",
        shouldShowIcon ? "flex items-center" : ""
      )}
      aria-current={item.isActive ? "page" : undefined}
    >
      {content}
    </span>
  );
}

/**
 * Custom hook to generate breadcrumbs from the current browser path.
 * Converts URL segments into readable labels and manages breadcrumb state.
 */
export function useBreadcrumbs(customItems?: BreadcrumbItem[]) {
  const [breadcrumbs, setBreadcrumbs] = React.useState<BreadcrumbItem[]>([]);

  React.useEffect(() => {
    // If custom items are provided, use those instead of generating from path
    if (customItems) {
      setBreadcrumbs(customItems);
      return;
    }

    // Extract meaningful segments from the current URL path
    const path = window.location.pathname;
    const segments = path.split("/").filter(Boolean);

    // Transform each URL segment into a breadcrumb item
    const items: BreadcrumbItem[] = segments.map((segment, index) => {
      // Build the href by joining segments up to current index
      const href = `/${segments.slice(0, index + 1).join("/")}`;
      const isLast = index === segments.length - 1;

      // Convert kebab-case segments to readable Title Case labels
      const label = segment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      return {
        label,
        // Only add href if not the last item (last item is current page)
        ...(isLast ? {} : { href }),
        isActive: isLast,
      };
    });

    setBreadcrumbs(items);
  }, [customItems]);

  return breadcrumbs;
}
