import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Button } from '../../shared/components/ui/button';
import { Badge } from '../../shared/components/ui/badge';
import { COMMERCIAL_IMAGES, RESIDENTIAL_IMAGES } from '../utils/propertyImages';

type ImageCategory = 'all' | 'residential' | 'commercial';

export default function ImageGallery() {
  const [selectedCategory, setSelectedCategory] = useState<ImageCategory>('all');

  const allImages = [...RESIDENTIAL_IMAGES, ...COMMERCIAL_IMAGES];
  
  const filteredImages = selectedCategory === 'all' 
    ? allImages 
    : selectedCategory === 'residential' 
      ? RESIDENTIAL_IMAGES 
      : COMMERCIAL_IMAGES;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Property Image Gallery
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Browse our collection of high-quality property images used throughout the platform.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Category Filter */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filter by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('all')}
              >
                All Images ({allImages.length})
              </Button>
              <Button
                variant={selectedCategory === 'residential' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('residential')}
              >
                Residential ({RESIDENTIAL_IMAGES.length})
              </Button>
              <Button
                variant={selectedCategory === 'commercial' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('commercial')}
              >
                Commercial ({COMMERCIAL_IMAGES.length})
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Image Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredImages.map((image) => (
            <Card key={image.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video relative">
                <img
                  src={image.url}
                  alt={image.alt}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute top-2 right-2">
                  <Badge 
                    variant={image.category === 'residential' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {image.category}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-medium text-sm text-foreground mb-2 line-clamp-2">
                  {image.alt}
                </h3>
                <div className="text-xs text-muted-foreground">
                  ID: {image.id}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{allImages.length}</div>
                <div className="text-sm text-muted-foreground">Total Images</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-secondary">{RESIDENTIAL_IMAGES.length}</div>
                <div className="text-sm text-muted-foreground">Residential Images</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-accent">{COMMERCIAL_IMAGES.length}</div>
                <div className="text-sm text-muted-foreground">Commercial Images</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}