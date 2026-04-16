/**
 * Search Interface Component
 * Provides search and filtering UI for the gallery
 */

import React, { memo, useCallback } from "react";
import { Search, X, Filter, ChevronDown } from "lucide-react";
import type { SearchFacets, SelectedFacets, SortMode, ViewMode } from "./types";
import { VIEW_MODES, SORT_OPTIONS } from "./constants";

interface SearchInterfaceProps {
  query: string;
  onQueryChange: (query: string) => void;
  facets: SearchFacets;
  selectedFacets: SelectedFacets;
  onFacetToggle: (facetType: keyof SelectedFacets, value: string) => void;
  sortMode: SortMode;
  onSortChange: (mode: SortMode) => void;
  sortAscending: boolean;
  onSortDirectionToggle: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  showFacets: boolean;
  onToggleFacets: () => void;
}

export const SearchInterface = memo<SearchInterfaceProps>(
  ({
    query,
    onQueryChange,
    facets,
    selectedFacets,
    onFacetToggle,
    sortMode,
    onSortChange,
    sortAscending,
    onSortDirectionToggle,
    viewMode,
    onViewModeChange,
    showFacets,
    onToggleFacets,
  }) => {
    const handleClearQuery = useCallback(() => {
      onQueryChange("");
    }, [onQueryChange]);

    return (
      <div className="space-y-4">
        {/* Search bar and controls */}
        <div className="flex items-center gap-3">
          {/* Search input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search images..."
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {query && (
              <button
                onClick={handleClearQuery}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Filter toggle */}
          <button
            onClick={onToggleFacets}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              showFacets
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Filter className="w-5 h-5" />
            <span>Filters</span>
          </button>

          {/* Sort dropdown */}
          <div className="relative">
            <select
              value={sortMode}
              onChange={(e) => onSortChange(e.target.value as SortMode)}
              className="appearance-none px-4 py-2 pr-10 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 cursor-pointer"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Sort direction */}
          <button
            onClick={onSortDirectionToggle}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            title={sortAscending ? "Ascending" : "Descending"}
          >
            {sortAscending ? "↑" : "↓"}
          </button>

          {/* View mode toggles */}
          <div className="flex gap-1 border border-gray-300 rounded-lg p-1">
            {(Object.entries(VIEW_MODES) as Array<[ViewMode, typeof VIEW_MODES[ViewMode]]>).map(
              ([mode, config]) => {
                const Icon = config.icon;
                return (
                  <button
                    key={mode}
                    onClick={() => onViewModeChange(mode)}
                    className={`p-2 rounded ${
                      viewMode === mode
                        ? "bg-blue-500 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                    title={config.label}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* Facet filters */}
        {showFacets && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            {/* Categories */}
            {facets.categories.size > 0 && (
              <FacetGroup
                title="Categories"
                items={facets.categories}
                selected={selectedFacets.categories}
                onToggle={(value) => onFacetToggle("categories", value)}
              />
            )}

            {/* Approval Status */}
            {facets.approvalStatus.size > 0 && (
              <FacetGroup
                title="Approval Status"
                items={facets.approvalStatus}
                selected={selectedFacets.approvalStatus}
                onToggle={(value) => onFacetToggle("approvalStatus", value)}
              />
            )}

            {/* Tags */}
            {facets.tags.size > 0 && (
              <FacetGroup
                title="Tags"
                items={facets.tags}
                selected={selectedFacets.tags}
                onToggle={(value) => onFacetToggle("tags", value)}
              />
            )}

            {/* Users */}
            {facets.users.size > 0 && (
              <FacetGroup
                title="Assigned To"
                items={facets.users}
                selected={selectedFacets.users}
                onToggle={(value) => onFacetToggle("users", value)}
              />
            )}

            {/* Collections */}
            {facets.collections.size > 0 && (
              <FacetGroup
                title="Collections"
                items={facets.collections}
                selected={selectedFacets.collections}
                onToggle={(value) => onFacetToggle("collections", value)}
              />
            )}
          </div>
        )}
      </div>
    );
  }
);

SearchInterface.displayName = "SearchInterface";

interface FacetGroupProps {
  title: string;
  items: Map<string, number>;
  selected: string[];
  onToggle: (value: string) => void;
}

const FacetGroup = memo<FacetGroupProps>(
  ({ title, items, selected, onToggle }) => {
    return (
      <div>
        <h4 className="font-medium text-sm text-gray-700 mb-2">{title}</h4>
        <div className="flex flex-wrap gap-2">
          {Array.from(items.entries()).map(([value, count]) => {
            const isSelected = selected.includes(value);
            return (
              <button
                key={value}
                onClick={() => onToggle(value)}
                className={`px-3 py-1 rounded-full text-sm ${
                  isSelected
                    ? "bg-blue-500 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                } border border-gray-300`}
              >
                {value} ({count})
              </button>
            );
          })}
        </div>
      </div>
    );
  }
);

FacetGroup.displayName = "FacetGroup";
