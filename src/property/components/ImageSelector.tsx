import { X, Plus, Image as ImageIcon } from 'lucide-react';
import { useState, useCallback } from 'react';

import { Button } from '../../shared/components/ui/button';
import { Card } from '../../shared/components/ui/card';
import { 
  PropertyImage, 
  getImagesByPropertyType, 
  getRandomImages 
} from '../utils/propertyImages';

interface ImageSelectorProps {
  propertyType: string;
  selectedImages: PropertyImage[];
  onImagesChange: (images: PropertyImage[]) => void;
  maxImages?: number;
}

export function ImageSelector({ 
  propertyType, 
  selectedImages, 
  onImagesChange, 
  maxImages = 10 
}: ImageSelectorProps) {
  const [showImageGrid, setShowImageGrid] = useState(false);
  const availableImages = getImagesByPropertyType(propertyType);

  const handleImageSelect = useCallback((image: PropertyImage) => {
    if (selectedImages.find(img => img.id === image.id)) {
      // Remove if already selected
      onImagesChange(selectedImages.filter(img => img.id !== image.id));
    } else if (selectedImages.length < maxImages) {
      // Add if not at max limit
      onImagesChange([...selectedImages, image]);
    }
  }, [selectedImages, onImagesChange, maxImages]);

  const handleRemoveImage = useCallback((imageId: string) => {
    onImagesChange(selectedImages.filter(img => img.id !== imageId));
  }, [selectedImages, onImagesChange]);

  const handleAddRandomImages = useCallback(() => {
    const randomImages = getRandomImages(propertyType, Math.min(3, maxImages - selectedImages.length));
    const newImages = randomImages.filter(img => 
      !selectedImages.find(selected => selected.id === img.id)
    );
    onImagesChange([...selectedImages, ...newImages]);
  }, [propertyType, selectedImages, onImagesChange, maxImages]);

  return (
    <div className="space-y-4">
      {/* Selected Images Display */}
      {selectedImages.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Selected Images ({selectedImages.length}/{maxImages})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {selectedImages.map((image) => (
              <div key={image.id} className="relative group">
                <img
                  src={image.url}
                  alt={image.alt}
                  className="w-full h-24 object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(image.id)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Remove ${image.alt}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowImageGrid(!showImageGrid)}
          className="flex items-center gap-2"
        >
          <ImageIcon className="h-4 w-4" />
          {showImageGrid ? 'Hide' : 'Choose'} Sample Images
        </Button>

        {selectedImages.length < maxImages && (
          <Button
            type="button"
            variant="outline"
            onClick={handleAddRandomImages}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Random Images
          </Button>
        )}
      </div>

      {/* Image Grid */}
      {showImageGrid && (
        <Card className="p-4">
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-1">
              Sample {propertyType === 'commercial' ? 'Commercial' : 'Residential'} Images
            </h4>
            <p className="text-xs text-gray-500">
              Click images to select/deselect them for your property listing
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 max-h-96 overflow-y-auto">
            {availableImages.map((image) => {
              const isSelected = selectedImages.find(img => img.id === image.id);
              const canSelect = selectedImages.length < maxImages || isSelected;
              
              return (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => handleImageSelect(image)}
                  disabled={!canSelect}
                  className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
                    isSelected 
                      ? 'border-blue-500 ring-2 ring-blue-200' 
                      : canSelect 
                        ? 'border-gray-200 hover:border-gray-300' 
                        : 'border-gray-100 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <img
                    src={image.url}
                    alt={image.alt}
                    className="w-full h-20 object-cover"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                      <div className="bg-blue-500 text-white rounded-full p-1">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {/* Upload Custom Images Placeholder */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <ImageIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
        <p className="text-sm text-gray-600 mb-2">Upload your own property photos</p>
        <p className="text-xs text-gray-500 mb-4">
          JPG, PNG up to 2MB each (coming soon)
        </p>
        <Button type="button" variant="outline" size="sm" disabled>
          <Plus className="h-4 w-4 mr-2" />
          Upload Photos
        </Button>
      </div>
    </div>
  );
}