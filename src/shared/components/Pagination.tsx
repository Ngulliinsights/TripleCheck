import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import React from 'react';

import { cn } from '../lib/utils';

import { Button } from './ui/button';


/**
 * Configuration interface for pagination behavior and appearance
 */
interface PaginationProps {
  /** Current active page number (1-indexed) */
  currentPage: number;
  /** Total number of pages available */
  totalPages: number;
  /** Callback function when page changes */
  onPageChange: (page: number) => void;
  /** Additional CSS classes to apply */
  className?: string;
  /** Whether to show first/last navigation buttons */
  showFirstLast?: boolean;
  /** Whether to display page information text */
  showPageInfo?: boolean;
  /** Number of pages to show around current page */
  delta?: number;
  /** Whether pagination controls are disabled */
  disabled?: boolean;
  /** Breakpoint for responsive design (pages to show on mobile) */
  mobileThreshold?: number;
}

/**
 * A comprehensive pagination component that handles navigation between pages
 * with configurable features and full accessibility support.
 */
export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className,
  showFirstLast = false,
  showPageInfo = false,
  delta = 1,
  disabled = false,
  mobileThreshold = 5,
}) => {
  // Ensure currentPage is within valid bounds to prevent runtime errors
  const safePage = Math.max(1, Math.min(currentPage, totalPages));
  
  /**
   * Calculates which page numbers should be visible in the pagination
   * Uses an ellipsis-based algorithm to show relevant pages around current position
   */
  const getVisiblePages = (): (number | '…')[] => {
    // For small page counts, show all pages
    if (totalPages <= mobileThreshold) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | '…')[] = [];
    
    // Calculate the window of pages around current page
    const leftBound = Math.max(2, safePage - delta);
    const rightBound = Math.min(totalPages - 1, safePage + delta);

    // Always include first page
    pages.push(1);

    // Add ellipsis if there's a gap after first page
    if (leftBound > 2) {
      pages.push('…');
    }

    // Add pages in the calculated window (excluding first page if already added)
    for (let i = leftBound; i <= rightBound; i++) {
      if (i !== 1) {
        pages.push(i);
      }
    }

    // Add ellipsis if there's a gap before last page
    if (rightBound < totalPages - 1) {
      pages.push('…');
    }

    // Always include last page (if it exists and isn't already included)
    if (totalPages > 1 && !pages.includes(totalPages)) {
      pages.push(totalPages);
    }

    return pages;
  };

  /**
   * Handles keyboard navigation for accessibility
   * Responds to Enter and Space key presses
   */
  const handleKeyDown = (event: React.KeyboardEvent, page: number): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!disabled) {
        onPageChange(page);
      }
    }
  };

  /**
   * Helper function to safely change pages with bounds checking
   */
  const changePage = (newPage: number): void => {
    if (!disabled && newPage >= 1 && newPage <= totalPages) {
      onPageChange(newPage);
    }
  };

  // Early return for edge cases where pagination isn't needed
  if (totalPages <= 1) {
    return null;
  }

  const visiblePages = getVisiblePages();
  const isFirstPage = safePage === 1;
  const isLastPage = safePage === totalPages;

  return (
    <nav 
      className={cn('flex items-center justify-center gap-2', className)}
      aria-label="Pagination Navigation"
      role="navigation"
    >
      {/* First page button - only shown when enabled */}
      {showFirstLast && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => changePage(1)}
          disabled={disabled || isFirstPage}
          className="hidden sm:flex items-center gap-1"
          aria-label="Go to first page"
        >
          <ChevronsLeft className="h-4 w-4" aria-hidden="true" />
          <span>First</span>
        </Button>
      )}

      {/* Previous page button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => changePage(safePage - 1)}
        disabled={disabled || isFirstPage}
        className="flex items-center gap-1"
        aria-label="Go to previous page"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Previous</span>
      </Button>

      {/* Page number buttons */}
      <ul className="flex items-center gap-1">
        {visiblePages.map((page, index) => (
          <li key={`page-${page}-${index}`}>
            {page === '…' ? (
              <span 
                className="px-3 py-2 text-sm text-muted-foreground select-none"
                aria-hidden="true"
              >
                …
              </span>
            ) : (
              <Button
                variant={safePage === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => changePage(page)}
                onKeyDown={(event: React.KeyboardEvent<HTMLButtonElement>) => handleKeyDown(event, page)}
                disabled={disabled}
                className="min-w-[40px]"
                aria-label={`${safePage === page ? 'Current page, ' : ''}Go to page ${page}`}
                aria-current={safePage === page ? 'page' : undefined}
              >
                {page}
              </Button>
            )}
          </li>
        ))}
      </ul>

      {/* Next page button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => changePage(safePage + 1)}
        disabled={disabled || isLastPage}
        className="flex items-center gap-1"
        aria-label="Go to next page"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Button>

      {/* Last page button - only shown when enabled */}
      {showFirstLast && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => changePage(totalPages)}
          disabled={disabled || isLastPage}
          className="hidden sm:flex items-center gap-1"
          aria-label="Go to last page"
        >
          <span>Last</span>
          <ChevronsRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      )}

      {/* Page information display - only shown when enabled */}
      {showPageInfo && (
        <div className="ml-4 text-sm text-muted-foreground" aria-live="polite">
          Page {safePage} of {totalPages}
        </div>
      )}
    </nav>
  );
};