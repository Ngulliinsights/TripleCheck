/**
 * Utility functions for image gallery operations
 */

import type { GalleryImage, AdvancedImage, SortMode } from "./types";

// ---------------------------------------------------------------------------
// Type guard
// ---------------------------------------------------------------------------

export const isAdvancedImage = (img: GalleryImage): img is AdvancedImage =>
  "approvalStatus" in img;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getAlt = (img: GalleryImage): string => img.alt ?? "";

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export const matchesTextQuery = (img: GalleryImage, query: string): boolean => {
  const q = query.toLowerCase();
  if (getAlt(img).toLowerCase().includes(q)) return true;
  if (img.category?.toLowerCase().includes(q)) return true;

  if (isAdvancedImage(img)) {
    if (img.tags?.some((t) => t.toLowerCase().includes(q))) return true;
    if (img.aiTags?.some((t) => t.toLowerCase().includes(q))) return true;
    if (img.collections?.some((c) => c.toLowerCase().includes(q))) return true;
  }

  return false;
};

// ---------------------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------------------

export const sortImages = (
  images: GalleryImage[],
  sortMode: SortMode,
  ascending = true
): GalleryImage[] =>
  [...images].sort((a, b) => {
    let cmp = 0;

    switch (sortMode) {
      case "name":
        cmp = getAlt(a).localeCompare(getAlt(b));
        break;
      case "date":
        cmp =
          (isAdvancedImage(a) ? a.uploadDate?.getTime() ?? 0 : 0) -
          (isAdvancedImage(b) ? b.uploadDate?.getTime() ?? 0 : 0);
        break;
      case "size":
        cmp =
          (isAdvancedImage(a) ? a.fileSize ?? 0 : 0) -
          (isAdvancedImage(b) ? b.fileSize ?? 0 : 0);
        break;
      case "rating":
        cmp =
          (isAdvancedImage(a) ? a.rating ?? 0 : 0) -
          (isAdvancedImage(b) ? b.rating ?? 0 : 0);
        break;
      case "usage":
        cmp =
          (isAdvancedImage(a) ? a.usage ?? 0 : 0) -
          (isAdvancedImage(b) ? b.usage ?? 0 : 0);
        break;
    }

    return ascending ? cmp : -cmp;
  });