import React, { useEffect } from 'react'
import { Camera, Upload, FileText } from 'lucide-react'
import { Badge } from '../../../../local/components/ui/badge'
import { Button } from '../../../../local/components/ui/button'
import { WizardStepProps } from '../types'

export function AdaptedImagesStep({ data, onUpdate, onValidation }: WizardStepProps) {
  // Validate step whenever data changes
  useEffect(() => {
    const isValid = (data.images?.length || 0) > 0 || (data.imageUrls?.length || 0) > 0;
    onValidation?.(isValid);
  }, [data.images, data.imageUrls, onValidation]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h4 className="font-medium">Property Photos *</h4>
        <p className="text-sm text-muted-foreground">
          Upload high-quality photos of your property. The first photo will be used as the main image.
        </p>
        
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
          <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            Drag and drop photos here, or click to browse
          </p>
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Choose Photos
          </Button>
        </div>

        {(data.images?.length || 0) > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.images?.map((image, index) => (
              <div key={index} className="relative">
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                  <Camera className="h-8 w-8 text-muted-foreground" />
                </div>
                {index === 0 && (
                  <Badge className="absolute top-2 left-2 text-xs">Main</Badge>
                )}
              </div>
            ))}
          </div>
        )}

        {(data.imageUrls?.length || 0) > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.imageUrls?.map((url, index) => (
              <div key={index} className="relative">
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                  <img 
                    src={url} 
                    alt={`Property ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                {index === 0 && (
                  <Badge className="absolute top-2 left-2 text-xs">Main</Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h4 className="font-medium">Additional Media</h4>
        <p className="text-sm text-muted-foreground">
          Upload videos, floor plans, or other relevant documents.
        </p>
        
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
          <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Upload Files
          </Button>
        </div>

        {(data.documents?.length || 0) > 0 && (
          <div className="space-y-2">
            <h5 className="font-medium text-sm">Uploaded Documents</h5>
            <div className="space-y-1">
              {data.documents?.map((doc, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">{doc.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}