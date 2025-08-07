import { 
  Upload, 
  Camera, 
  X, 
  Image as ImageIcon, 
  Move, 
  Eye,
  AlertTriangle,
  CheckCircle,
  RotateCw
} from 'lucide-react';
import React, { useEffect, useState, useCallback, useRef } from 'react';

import PropertyImageVault from '../../../shared/components/images/PropertyImageVault';
import type { PropertyImage as VaultImage } from '../../../shared/types/images';
import { Alert, AlertDescription } from '../../../shared/components/ui/alert';
import { Badge } from '../../../shared/components/ui/badge';
import { Button } from '../../../shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { PropertyFormData } from '../PropertyListingWizard';

interface ImagesStepProps {
  data: PropertyFormData;
  onUpdate: (updates: Partial<PropertyFormData>) => void;
  onValidation: (isValid: boolean) => void;
}

interface ImageFile {
  file: File;
  preview: string;
  id: string;
  uploading?: boolean;
  uploaded?: boolean;
  error?: string;
}

const MAX_FILES = 20;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export function ImagesStep({ data, onUpdate, onValidation }: ImagesStepProps) {
  const [vaultImages, setVaultImages] = useState<VaultImage[]>([]);

  // Validate step
  useEffect(() => {
    const isValid = vaultImages.length > 0 || (data.imageUrls && data.imageUrls.length > 0);
    onValidation(isValid);
  }, [vaultImages.length, data.imageUrls, onValidation]);

  // Initialize with existing images
  useEffect(() => {
    if (data.images && data.images.length > 0) {
      const existingFiles = data.images.map((file, index) => ({
        id: `existing-${index}`,
        file,
        preview: URL.createObjectURL(file),
        status: 'uploaded' as const,
        progress: 100,
        approvalStatus: 'approved' as const,
        isPrimary: index === 0
      }));
      setVaultImages(existingFiles);
    }
  }, []);

  // Handle image vault changes
  const handleVaultChange = useCallback((images: VaultImage[]) => {
    setVaultImages(images);
    
    // Update form data
    onUpdate({
      images: images.map(img => img.file)
    });
  }, [onUpdate]);

  return (
    <div className="space-y-6">
      {/* Property Images Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Property Images
          </CardTitle>
          <p className="text-sm text-gray-600">
            Upload high-quality photos of your property. The first image will be used as the main photo.
          </p>
        </CardHeader>
        <CardContent>
          <PropertyImageVault
            maxFileSize={MAX_FILE_SIZE}
            acceptedFormats={ACCEPTED_TYPES}
            maxFiles={MAX_FILES}
            allowReorder={true}
            allowAnnotation={true}
            allowPrimaryFlag={true}
            onChange={handleVaultChange}
            defaultDocumentType="property_photo"
            showWorkflowProgress={true}
          />
        </CardContent>
      </Card>

      {/* Image Tips */}
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <h4 className="font-medium mb-2">📸 Photo Tips</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Take photos during the day with good natural lighting</li>
            <li>• Include exterior shots, all rooms, and key features</li>
            <li>• The first image will be the main photo in listings</li>
            <li>• Use high resolution images (at least 1024x768)</li>
            <li>• Show the property's best features and unique selling points</li>
            <li>• Avoid cluttered or messy spaces in photos</li>
          </ul>
        </CardContent>
      </Card>

      {/* Validation Summary */}
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Step Completion</h4>
              <p className="text-sm text-gray-600">
                Upload at least one image to proceed
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant={vaultImages.length > 0 ? 'default' : 'secondary'}>
                Images {vaultImages.length > 0 ? '✓' : '○'} ({vaultImages.length})
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}