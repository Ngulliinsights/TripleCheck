import React, { useState, useMemo, useCallback } from "react";

import { Badge } from "../../shared/components/ui/badge";
import { Button } from "../../shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../shared/components/ui/card";
import { COMMERCIAL_IMAGES, RESIDENTIAL_IMAGES } from "../utils/propertyImages";

// Type definitions for better type safety and maintainability
type ImageCategory = "all" | "residential" | "commercial";

interface ImageItem {
  id: string;
  url: string;
  alt: string;
  category: "residential" | "commercial";
}

interface CategoryStats {
  total: number;
  residential: number;
  commercial: number;
}

// Component constants to avoid recreating objects on each render
const CATEGORY_CONFIG = {
  all: { label: "All Images", variant: "default" as const },
  residential: { label: "Residential", variant: "default" as const },
  commercial: { label: "Commercial", variant: "default" as const },
} as const;

export default function ImageGallery(): JSX.Element {
  const [selectedCategory, setSelectedCategory] =
    useState<ImageCategory>("all");

  // Memoize the combined images array to prevent unnecessary recalculations
  const allImages = useMemo<ImageItem[]>(
    () => [...RESIDENTIAL_IMAGES, ...COMMERCIAL_IMAGES],
    []
  );

  // Memoize category statistics for performance
  const categoryStats = useMemo<CategoryStats>(
    () => ({
      total: allImages.length,
      residential: RESIDENTIAL_IMAGES.length,
      commercial: COMMERCIAL_IMAGES.length,
    }),
    [allImages.length]
  );

  // Memoize filtered images to avoid recalculating on every render
  const filteredImages = useMemo<ImageItem[]>(() => {
    switch (selectedCategory) {
      case "residential":
        return RESIDENTIAL_IMAGES;
      case "commercial":
        return COMMERCIAL_IMAGES;
      default:
        return allImages;
    }
  }, [selectedCategory, allImages]);

  // Use useCallback to prevent unnecessary re-renders of child components
  const handleCategoryChange = useCallback((category: ImageCategory) => {
    setSelectedCategory(category);
  }, []);

  // Helper function to get button variant based on selection state
  const getButtonVariant = useCallback(
    (category: ImageCategory) =>
      selectedCategory === category ? "default" : "outline",
    [selectedCategory]
  );

  // Helper function to get category count for display - using explicit mapping for security
  const getCategoryCount = useCallback(
    (category: ImageCategory): number => {
      switch (category) {
        case "all":
          return categoryStats.total;
        case "residential":
          return categoryStats.residential;
        case "commercial":
          return categoryStats.commercial;
        default:
          return 0;
      }
    },
    [categoryStats]
  );

  // Helper function to safely get category config
  const getCategoryConfig = useCallback((category: ImageCategory) => {
    switch (category) {
      case "all":
        return CATEGORY_CONFIG.all;
      case "residential":
        return CATEGORY_CONFIG.residential;
      case "commercial":
        return CATEGORY_CONFIG.commercial;
      default:
        return CATEGORY_CONFIG.all;
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section - Semantic structure for better accessibility */}
      <header className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Property Image Gallery
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Browse our collection of high-quality property images used
              throughout the platform.
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Category Filter Section */}
        <section aria-label="Image category filters">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Filter by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="flex flex-wrap gap-3"
                role="group"
                aria-label="Category filter buttons"
              >
                {(Object.keys(CATEGORY_CONFIG) as ImageCategory[]).map(
                  (category) => {
                    // Explicit key access to avoid ESLint security warnings about dynamic object injection
                    const categoryConfig = getCategoryConfig(category);

                    return (
                      <Button
                        key={category}
                        variant={getButtonVariant(category)}
                        onClick={() => handleCategoryChange(category)}
                        aria-pressed={selectedCategory === category}
                        aria-label={`Filter by ${categoryConfig.label}`}
                      >
                        {categoryConfig.label} ({getCategoryCount(category)})
                      </Button>
                    );
                  }
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Image Grid Section */}
        <section aria-label="Property images" aria-live="polite">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredImages.map((image: ImageItem) => (
              <Card
                key={image.id}
                className="overflow-hidden hover:shadow-lg transition-all duration-200 focus-within:ring-2 focus-within:ring-primary/50"
              >
                <div className="aspect-video relative">
                  <img
                    src={image.url}
                    alt={image.alt}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    // Add error handling for broken images - using a more production-friendly approach
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      // In production, you might want to use a proper logging service instead
                      // console.warn(`Failed to load image: ${image.url}`);
                    }}
                  />
                  <div className="absolute top-2 right-2">
                    <Badge
                      variant={
                        image.category === "residential" ?
                          "default"
                        : "secondary"
                      }
                      className="text-xs capitalize"
                      aria-label={`Category: ${image.category}`}
                    >
                      {image.category}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium text-sm text-foreground mb-2 line-clamp-2">
                    {image.alt}
                  </h3>
                  <div
                    className="text-xs text-muted-foreground"
                    aria-label={`Image ID: ${image.id}`}
                  >
                    ID: {image.id}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty state handling */}
          {filteredImages.length === 0 && (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">
                No images found for the selected category.
              </p>
            </div>
          )}
        </section>

        {/* Statistics Section */}
        <section aria-label="Image statistics">
          <Card className="mt-8">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div
                    className="text-2xl font-bold text-primary"
                    aria-label={`Total images: ${categoryStats.total}`}
                  >
                    {categoryStats.total}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Images
                  </div>
                </div>
                <div>
                  <div
                    className="text-2xl font-bold text-secondary"
                    aria-label={`Residential images: ${categoryStats.residential}`}
                  >
                    {categoryStats.residential}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Residential Images
                  </div>
                </div>
                <div>
                  <div
                    className="text-2xl font-bold text-accent"
                    aria-label={`Commercial images: ${categoryStats.commercial}`}
                  >
                    {categoryStats.commercial}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Commercial Images
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
