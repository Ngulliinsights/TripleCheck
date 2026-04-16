"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pagination = void 0;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var utils_1 = require("../lib/utils");
var button_1 = require("./ui/button");
/**
 * A comprehensive pagination component that handles navigation between pages
 * with configurable features and full accessibility support.
 */
var Pagination = function (_a) {
    var currentPage = _a.currentPage, totalPages = _a.totalPages, onPageChange = _a.onPageChange, className = _a.className, _b = _a.showFirstLast, showFirstLast = _b === void 0 ? false : _b, _c = _a.showPageInfo, showPageInfo = _c === void 0 ? false : _c, _d = _a.delta, delta = _d === void 0 ? 1 : _d, _e = _a.disabled, disabled = _e === void 0 ? false : _e, _f = _a.mobileThreshold, mobileThreshold = _f === void 0 ? 5 : _f;
    // Ensure currentPage is within valid bounds to prevent runtime errors
    var safePage = Math.max(1, Math.min(currentPage, totalPages));
    /**
     * Calculates which page numbers should be visible in the pagination
     * Uses an ellipsis-based algorithm to show relevant pages around current position
     */
    var getVisiblePages = function () {
        // For small page counts, show all pages
        if (totalPages <= mobileThreshold) {
            return Array.from({ length: totalPages }, function (_, i) { return i + 1; });
        }
        var pages = [];
        // Calculate the window of pages around current page
        var leftBound = Math.max(2, safePage - delta);
        var rightBound = Math.min(totalPages - 1, safePage + delta);
        // Always include first page
        pages.push(1);
        // Add ellipsis if there's a gap after first page
        if (leftBound > 2) {
            pages.push('…');
        }
        // Add pages in the calculated window (excluding first page if already added)
        for (var i = leftBound; i <= rightBound; i++) {
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
    var handleKeyDown = function (event, page) {
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
    var changePage = function (newPage) {
        if (!disabled && newPage >= 1 && newPage <= totalPages) {
            onPageChange(newPage);
        }
    };
    // Early return for edge cases where pagination isn't needed
    if (totalPages <= 1) {
        return null;
    }
    var visiblePages = getVisiblePages();
    var isFirstPage = safePage === 1;
    var isLastPage = safePage === totalPages;
    return (<nav className={(0, utils_1.cn)('flex items-center justify-center gap-2', className)} aria-label="Pagination Navigation" role="navigation">
      {/* First page button - only shown when enabled */}
      {showFirstLast && (<button_1.Button variant="outline" size="sm" onClick={function () { return changePage(1); }} disabled={disabled || isFirstPage} className="hidden sm:flex items-center gap-1" aria-label="Go to first page">
          <lucide_react_1.ChevronsLeft className="h-4 w-4" aria-hidden="true"/>
          <span>First</span>
        </button_1.Button>)}

      {/* Previous page button */}
      <button_1.Button variant="outline" size="sm" onClick={function () { return changePage(safePage - 1); }} disabled={disabled || isFirstPage} className="flex items-center gap-1" aria-label="Go to previous page">
        <lucide_react_1.ChevronLeft className="h-4 w-4" aria-hidden="true"/>
        <span className="hidden sm:inline">Previous</span>
      </button_1.Button>

      {/* Page number buttons */}
      <ul className="flex items-center gap-1">
        {visiblePages.map(function (page, index) { return (<li key={"page-".concat(page, "-").concat(index)}>
            {page === '…' ? (<span className="px-3 py-2 text-sm text-muted-foreground select-none" aria-hidden="true">
                …
              </span>) : (<button_1.Button variant={safePage === page ? 'default' : 'outline'} size="sm" onClick={function () { return changePage(page); }} onKeyDown={function (event) { return handleKeyDown(event, page); }} disabled={disabled} className="min-w-[40px]" aria-label={"".concat(safePage === page ? 'Current page, ' : '', "Go to page ").concat(page)} aria-current={safePage === page ? 'page' : undefined}>
                {page}
              </button_1.Button>)}
          </li>); })}
      </ul>

      {/* Next page button */}
      <button_1.Button variant="outline" size="sm" onClick={function () { return changePage(safePage + 1); }} disabled={disabled || isLastPage} className="flex items-center gap-1" aria-label="Go to next page">
        <span className="hidden sm:inline">Next</span>
        <lucide_react_1.ChevronRight className="h-4 w-4" aria-hidden="true"/>
      </button_1.Button>

      {/* Last page button - only shown when enabled */}
      {showFirstLast && (<button_1.Button variant="outline" size="sm" onClick={function () { return changePage(totalPages); }} disabled={disabled || isLastPage} className="hidden sm:flex items-center gap-1" aria-label="Go to last page">
          <span>Last</span>
          <lucide_react_1.ChevronsRight className="h-4 w-4" aria-hidden="true"/>
        </button_1.Button>)}

      {/* Page information display - only shown when enabled */}
      {showPageInfo && (<div className="ml-4 text-sm text-muted-foreground" aria-live="polite">
          Page {safePage} of {totalPages}
        </div>)}
    </nav>);
};
exports.Pagination = Pagination;
