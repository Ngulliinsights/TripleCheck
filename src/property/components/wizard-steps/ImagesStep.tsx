import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Badge } from '@shared/components/ui/badge';
import { Progress } from '@shared/components/ui/progress';
import { Alert, AlertDescription } from '@shared/components/ui/alert';
import { PropertyFormData } from '../PropertyListingWizard';
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
  const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate step
  useEffect(() => {
    const isValid = imageFiles.length > 0 || (data.imageUrls && data.imageUrls.length > 0);
    onValidation(isValid);
  }, [imageFiles.length, data.imageUrls, onValidation]);

  // Initialize with existing images
  useEffect(() => {
    if (data.images && data.images.length > 0) {
      const existingFiles = data.images.map((file, index) => ({
        file,
        preview: URL.createObjectURL(file),
        id: `existing-${index}`,
        uploaded: false
      }));
      setImageFiles(existingFiles);
    }
  }, []);

  // Validate file
  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Only JPEG, PNG, and WebP images are allowed';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 10MB';
    }
    return null;
  };

  // Process files
  const processFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles: ImageFile[] = [];
    const errors: string[] = [];

    fileArray.forEach((file) => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
        return;
      }

      if (imageFiles.length + validFiles.length >= MAX_FILES) {
        errors.push(`Maximum ${MAX_FILES} images allowed`);
        return;
      }

      const imageFile: ImageFile = {
        file,
        preview: URL.createObjectURL(file),
        id: `${Date.now()}-${Math.random()}`,
        uploading: false,
        uploaded: false
      };

      validFiles.push(imageFile);
    });

    if (errors.length > 0) {
      // Show errors in toast or alert
      console.error('File validation errors:', errors);
    }

    if (validFiles.length > 0) {
      const updatedFiles = [...imageFiles, ...validFiles];
      setImageFiles(updatedFiles);
      
      // Update form data
      onUpdate({
        images: updatedFiles.map(f => f.file)
      });
    }
  }, [imageFiles, onUpdate]);

  // Handle file input change
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  // Remove image
  const removeImage = (id: string) => {
    const updatedFiles = imageFiles.filter(f => f.id !== id);
    setImageFiles(updatedFiles);
    
    // Clean up preview URL
    const fileToRemove = imageFiles.find(f => f.id === id);
    if (fileToRemove) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
    
    // Update form data
    onUpdate({
      images: updatedFiles.map(f => f.file)
    });
  };

  // Reorder images
  const moveImage = (fromIndex: number, toIndex: number) => {
    const updatedFiles = [...imageFiles];
    const [movedFile] = updatedFiles.splice(fromIndex, 1);
    if (movedFile) {
      updatedFiles.splice(toIndex, 0, movedFile);
    }
    
    setImageFiles(updatedFiles);
    onUpdate({
      images: updatedFiles.map(f => f.file)
    });
  };

  // Simulate image upload (replace with actual upload logic)
  const uploadImage = async (imageFile: ImageFile) => {
    setImageFiles(prev => 
      prev.map(f => f.id === imageFile.id ? { ...f, uploading: true } : f)
    );

    // Simulate upload progress
    for (let progress = 0; progress <= 100; progress += 10) {
      setUploadProgress(prev => ({ ...prev, [imageFile.id]: progress }));
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Mark as uploaded
    setImageFiles(prev => 
      prev.map(f => f.id === imageFile.id ? { ...f, uploading: false, uploaded: true } : f)
    );
  };

  // Upload all images
  const uploadAllImages = async () => {
    const unuploadedFiles = imageFiles.filter(f => !f.uploaded && !f.uploading);
    
    for (const file of unuploadedFiles) {
      await uploadImage(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
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
        <CardContent className="space-y-4">
          {/* Drag and Drop Area */}
          <div
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${dragActive 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
              }
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_TYPES.join(',')}
              onChange={handleFileInput}
              className="hidden"
              id="property-images-upload"
              aria-label="Upload property images"
            />
            
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <Upload className="h-8 w-8 text-gray-400" />
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Drag and drop your images here
                </h3>
                <p className="text-gray-600">
                  or{' '}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    browse to upload
                  </button>
                </p>
              </div>
              
              <div className="text-sm text-gray-500">
                <p>Supports: JPEG, PNG, WebP</p>
                <p>Max file size: 10MB each</p>
                <p>Max {MAX_FILES} images</p>
              </div>
            </div>
          </div>

          {/* Upload Button */}
          <div className="flex justify-center">
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              <Camera className="h-4 w-4" />
              Select Images
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Image Preview Grid */}
      {imageFiles.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Uploaded Images ({imageFiles.length}/{MAX_FILES})
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={uploadAllImages}
                  disabled={imageFiles.every(f => f.uploaded || f.uploading)}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {imageFiles.map((imageFile, index) => (
                <div
                  key={imageFile.id}
                  className="relative group border rounded-lg overflow-hidden bg-gray-50"
                >
                  {/* Image */}
                  <div className="aspect-square relative">
                    <img
                      src={imageFile.preview}
                      alt={`Property image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Main Photo Badge */}
                    {index === 0 && (
                      <Badge className="absolute top-2 left-2 bg-blue-600">
                        Main Photo
                      </Badge>
                    )}
                    
                    {/* Upload Status */}
                    {imageFile.uploading && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="text-center text-white">
                          <RotateCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                          <div className="text-sm">
                            {uploadProgress[imageFile.id] || 0}%
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {imageFile.uploaded && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="h-5 w-5 text-green-600 bg-white rounded-full" />
                      </div>
                    )}
                    
                    {imageFile.error && (
                      <div className="absolute top-2 right-2">
                        <AlertTriangle className="h-5 w-5 text-red-600 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                  
                  {/* Controls */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 flex gap-2">
                      {/* Move Left */}
                      {index > 0 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => moveImage(index, index - 1)}
                          className="h-8 w-8 p-0"
                        >
                          ←
                        </Button>
                      )}
                      
                      {/* Preview */}
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => window.open(imageFile.preview, '_blank')}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {/* Move Right */}
                      {index < imageFiles.length - 1 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => moveImage(index, index + 1)}
                          className="h-8 w-8 p-0"
                        >
                          →
                        </Button>
                      )}
                      
                      {/* Remove */}
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => removeImage(imageFile.id)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* File Info */}
                  <div className="p-2 bg-white">
                    <p className="text-xs text-gray-600 truncate">
                      {imageFile.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(imageFile.file.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
              <Badge variant={imageFiles.length > 0 ? 'default' : 'secondary'}>
                Images {imageFiles.length > 0 ? '✓' : '○'} ({imageFiles.length})
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}