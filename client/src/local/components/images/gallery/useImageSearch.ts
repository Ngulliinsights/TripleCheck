/**
 * Image search and filtering hook
 */

import { useMemo } from "react";
import type {
  GalleryImage,
  SearchFacets,
  SelectedFacets,
  SortMode,
} from "./types";
import { matchesTextQuery, sortImages, isAdvancedImage } from "./utils";

interface SearchResult {
  filtered: GalleryImage[];
  facets: SearchFacets;
  total: number;
}

const matchesFacetFilter = (
  img: GalleryImage,
  facetType: keyof SelectedFacets,
  values: string[]
): boolean => {
  if (values.length === 0) return true;

  if (facetType === "categories") {
    return img.category ? values.includes(img.category) : false;
  }

  if (facetType === "approvalStatus") {
    return isAdvancedImage(img) && img.approvalStatus
      ? values.includes(img.approvalStatus)
      : false;
  }

  if (facetType === "tags") {
    return isAdvancedImage(img) && img.tags
      ? img.tags.some((tag) => values.includes(tag))
      : false;
  }

  if (facetType === "users") {
    return isAdvancedImage(img) && img.assignedTo
      ? img.assignedTo.some((user) => values.includes(user))
      : false;
  }

  if (facetType === "collections") {
    return isAdvancedImage(img) && img.collections
      ? img.collections.some((collection) => values.includes(collection))
      : false;
  }

  return true;
};

const buildFacetCounts = (images: GalleryImage[]): SearchFacets => {
  const facets: SearchFacets = {
    categories: new Map(),
    tags: new Map(),
    approvalStatus: new Map(),
    users: new Map(),
    collections: new Map(),
  };

  images.forEach((img) => {
    if (img.category) {
      const count = facets.categories.get(img.category) || 0;
      facets.categories.set(img.category, count + 1);
    }

    if (isAdvancedImage(img)) {
      if (img.approvalStatus) {
        const count = facets.approvalStatus.get(img.approvalStatus) || 0;
        facets.approvalStatus.set(img.approvalStatus, count + 1);
      }

      img.tags?.forEach((tag) => {
        const count = facets.tags.get(tag) || 0;
        facets.tags.set(tag, count + 1);
      });

      img.assignedTo?.forEach((user) => {
        const count = facets.users.get(user) || 0;
        facets.users.set(user, count + 1);
      });

      img.collections?.forEach((collection) => {
        const count = facets.collections.get(collection) || 0;
        facets.collections.set(collection, count + 1);
      });
    }
  });

  return facets;
};

export const useImageSearch = (
  images: GalleryImage[],
  query: string,
  selectedFacets: SelectedFacets,
  sortMode: SortMode,
  sortAscending: boolean
): SearchResult => {
  return useMemo(() => {
    let filtered = images;

    // Apply text search
    if (query.trim()) {
      filtered = filtered.filter((img) => matchesTextQuery(img, query));
    }

    // Apply facet filters
    (Object.entries(selectedFacets) as Array<[keyof SelectedFacets, string[]]>).forEach(
      ([facetType, values]) => {
        if (values.length > 0) {
          filtered = filtered.filter((img) =>
            matchesFacetFilter(img, facetType, values)
          );
        }
      }
    );

    // Apply sorting
    filtered = sortImages(filtered, sortMode, sortAscending);

    // Build facet counts from all images (not just filtered)
    const facets = buildFacetCounts(images);

    return {
      filtered,
      facets,
      total: filtered.length,
    };
  }, [images, query, selectedFacets, sortMode, sortAscending]);
};