/**
 * Utility functions for image gallery operations
 */

import type { GalleryImage, AdvancedImage, SortMode } from "./types";
import { ImageUtils } from "../../../utils/images/unified-utils";

export const isAdvancedImage = (img: GalleryImage): img is AdvancedImage => {
  return "approvalStatus" in img;
};

export const matchesTextQuery = (img: GalleryImage, query: string): boolean => {
  const normalizedQuery = query.toLowerCase();
  const alt = ImageUtils.getAlt(img).toLowerCase();
  const category = img.category?.toLowerCase() ?? "";

  if (isAdvancedImage(img)) {
    const tags = img.tags?.map((t) => t.toLowerCase()) ?? [];
    const aiTags = img.aiTags?.map((t) => t.toLowerCase()) ?? [];
    const collections = img.collections?.map((c) => c.toLowerCase()) ?? [];

    return (
      alt.includes(normalizedQuery) ||
      category.includes(normalizedQuery) ||
      tags.some((tag) => tag.includes(normalizedQuery)) ||
      aiTags.some((tag) => tag.includes(normalizedQuery)) ||
      collections.some((collection) => collection.includes(normalizedQuery))
    );
  }

  return alt.includes(normalizedQuery) || category.includes(normalizedQuery);
};

export const sortImages = (
  images: GalleryImage[],
  sortMode: SortMode,
  ascending: boolean = true
): GalleryImage[] => {
  return [...images].sort((a, b) => {
    let comparison = 0;

    if (sortMode === "name") {
      comparison = ImageUtils.getAlt(a).localeCompare(ImageUtils.getAlt(b));
    } else if (sortMode === "date") {
      const dateA = isAdvancedImage(a) ? a.uploadDate : undefined;
      const dateB = isAdvancedImage(b) ? b.uploadDate : undefined;
      comparison = (dateA?.getTime() || 0) - (dateB?.getTime() || 0);
    } else if (sortMode === "size") {
      const sizeA = isAdvancedImage(a) ? a.fileSize : 0;
      const sizeB = isAdvancedImage(b) ? b.fileSize : 0;
      comparison = (sizeA || 0) - (sizeB || 0);
    } else if (sortMode === "rating") {
      const ratingA = isAdvancedImage(a) ? a.rating : 0;
      const ratingB = isAdvancedImage(b) ? b.rating : 0;
      comparison = (ratingA || 0) - (ratingB || 0);
    } else if (sortMode === "usage") {
      const usageA = isAdvancedImage(a) ? a.usage : 0;
      const usageB = isAdvancedImage(b) ? b.usage : 0;
      comparison = (usageA || 0) - (usageB || 0);
    }

    return ascending ? comparison : -comparison;
  });
};
