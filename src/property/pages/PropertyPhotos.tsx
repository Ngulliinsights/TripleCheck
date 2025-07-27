import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSafePropertiesQuery } from "@shared/hooks/useSafeQuery";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Button } from "@shared/components/ui/button";
import { Badge } from "@shared/components/ui/badge";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { Textarea } from "@shared/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@shared/components/ui/dialog";
import { Progress } from "@shared/components/ui/progress";
import { useToast } from "@/shared/hooks/use-toast";
import { apiRequest } from "@/infrastructure/api/queryClient";
import { Property } from "@shared/schema";
import { 
  Upload, 
  Camera, 
  Image as ImageIcon, 
  Trash2, 
  Edit, 
  Eye, 
  Star,
  CheckCircle,
  AlertTriangle,
  Plus,
  Download,
  Maximize,
  RotateCw,
  Crop,
  Palette,
  Zap
} from "lucide-react";

// Enhanced type definitions with better constraints
interface PhotoUpload {
  readonly id: string;
  readonly file: File;
  readonly preview: string;
  status: 'uploading' | 'uploaded' | 'error';
  progress: number;
  description?: string;
  isPrimary?: boolean;
}

// Type for upload mutation parameters
interface UploadMutationParams {
  readonly propertyId: string;
  readonly photos: ReadonlyArray<PhotoUpload>;
}

// Constants moved outside component to prevent recreation on each render
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const UPLOAD_PROGRESS_INTERVAL = 200;
const UPLOAD_SIMULATION_DURATION = 3000;

// Photography tips constant to prevent recreation
const PHOTO_TIPS = [
  {
    icon: <Camera className="w-5 h-5 text-blue-500" />,
    title: "Use Natural Light",
    description: "Take photos during the day with plenty of natural light for the best results"
  },
  {
    icon: <Maximize className="w-5 h-5 text-green-500" />,
    title: "Show Space", 
    description: "Capture wide angles to show the full room and make spaces appear larger"
  },
  {
    icon: <Star className="w-5 h-5 text-yellow-500" />,
    title: "Highlight Features",
    description: "Focus on unique selling points like views, fixtures, or architectural details"
  },
  {
    icon: <Palette className="w-5 h-5 text-purple-500" />,
    title: "Stage the Space",
    description: "Clean, declutter, and arrange furniture to make rooms look inviting"
  }
] as const;

export default function PropertyPhotosPage() {
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [photos, setPhotos] = useState<PhotoUpload[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<PhotoUpload | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Memoized file validation function to prevent recreation
  const validateFile = useCallback((file: File): { isValid: boolean; error?: string } => {
    if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      return { 
        isValid: false, 
        error: `${file.name} is not a supported image format. Please use JPG, PNG, or WebP.` 
      };
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return { 
        isValid: false, 
        error: `${file.name} is larger than 10MB. Please compress the image and try again.` 
      };
    }
    
    return { isValid: true };
  }, []);

  // Fetch user's properties with enhanced safety and validation
  const { data: properties, isLoading, error, hasValidData } = useSafePropertiesQuery(
    undefined,
    {
      context: 'property-photos',
      staleTime: 5 * 60 * 1000, // 5 minutes - properties don't change frequently
      gcTime: 10 * 60 * 1000, // 10 minutes cache time
    });

  // Optimized upload mutation with better error handling
  const uploadMutation = useMutation({
    mutationFn: async ({ propertyId, photos }: UploadMutationParams) => {
      // Enhanced mock API call with better error simulation
      return new Promise<{ success: boolean; uploadedPhotos: PhotoUpload[] }>((resolve, reject) => {
        // Simulate occasional failures for better UX testing
        const shouldFail = Math.random() < 0.1; // 10% failure rate in development
        
        setTimeout(() => {
          if (shouldFail) {
            reject(new Error('Upload failed due to network error'));
          } else {
            resolve({ 
              success: true, 
              uploadedPhotos: photos as PhotoUpload[] 
            });
          }
        }, 2000);
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Photos uploaded successfully",
        description: `${data.uploadedPhotos.length} photos have been uploaded to your property`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      // Clear photos after successful upload
      setPhotos([]);
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload photos. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Optimized drag handlers with better event handling
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const isEnteringOrOver = e.type === "dragenter" || e.type === "dragover";
    const isLeaving = e.type === "dragleave";
    
    if (isEnteringOrOver) {
      setDragActive(true);
    } else if (isLeaving) {
      // Only set drag inactive if we're leaving the actual drop zone
      const rect = e.currentTarget.getBoundingClientRect();
      const isOutside = (
        e.clientX < rect.left || 
        e.clientX > rect.right || 
        e.clientY < rect.top || 
        e.clientY > rect.bottom
      );
      
      if (isOutside) {
        setDragActive(false);
      }
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFiles(files);
    }
  }, []);

  // Enhanced file handling with better validation and error reporting
  const handleFiles = useCallback((files: File[]) => {
    const validatedFiles: { file: File; validation: ReturnType<typeof validateFile> }[] = 
      files.map(file => ({ file, validation: validateFile(file) }));

    // Separate valid and invalid files
    const validFiles = validatedFiles
      .filter(({ validation }) => validation.isValid)
      .map(({ file }) => file);

    const invalidFiles = validatedFiles
      .filter(({ validation }) => !validation.isValid);

    // Show errors for invalid files
    invalidFiles.forEach(({ validation }) => {
      if (validation.error) {
        toast({
          title: "Invalid file",
          description: validation.error,
          variant: "destructive"
        });
      }
    });

    // Process valid files
    if (validFiles.length > 0) {
      const newPhotos: PhotoUpload[] = validFiles.map((file, index) => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // More unique ID
        file,
        preview: URL.createObjectURL(file),
        status: 'uploading' as const,
        progress: 0,
        isPrimary: photos.length === 0 && index === 0 // Only first photo of first batch is primary
      }));

      setPhotos(prev => [...prev, ...newPhotos]);

      // Enhanced upload progress simulation with more realistic behavior
      newPhotos.forEach(photo => {
        let currentProgress = 0;
        const interval = setInterval(() => {
          setPhotos(prev => prev.map(p => {
            if (p.id === photo.id) {
              // More realistic progress curve - slower at start and end
              const increment = currentProgress < 20 ? 
                Math.random() * 10 : 
                currentProgress > 80 ? 
                  Math.random() * 5 : 
                  Math.random() * 15;
              
              currentProgress = Math.min(currentProgress + increment, 100);
              
              return {
                ...p,
                progress: currentProgress,
                status: currentProgress === 100 ? 'uploaded' as const : 'uploading' as const
              };
            }
            return p;
          }));
        }, UPLOAD_PROGRESS_INTERVAL);

        setTimeout(() => {
          clearInterval(interval);
          // Ensure final state is set
          setPhotos(prev => prev.map(p => 
            p.id === photo.id ? { ...p, progress: 100, status: 'uploaded' as const } : p
          ));
        }, UPLOAD_SIMULATION_DURATION);
      });
    }
  }, [photos.length, toast, validateFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
      // Reset input value to allow selecting same files again
      e.target.value = '';
    }
  }, [handleFiles]);

  // Optimized photo removal with cleanup
  const removePhoto = useCallback((photoId: string) => {
    setPhotos(prev => {
      const photoToRemove = prev.find(p => p.id === photoId);
      
      // Clean up object URL to prevent memory leaks
      if (photoToRemove?.preview) {
        URL.revokeObjectURL(photoToRemove.preview);
      }
      
      const updated = prev.filter(p => p.id !== photoId);
      
      // If we removed the primary photo, make the first remaining photo primary
      if (updated.length > 0 && !updated.some(p => p.isPrimary)) {
        updated[0] = { ...updated[0], isPrimary: true };
      }
      
      return updated;
    });
  }, []);

  const setPrimaryPhoto = useCallback((photoId: string) => {
    setPhotos(prev => prev.map(p => ({
      ...p,
      isPrimary: p.id === photoId
    })));
  }, []);

  const handleEditPhoto = useCallback((photo: PhotoUpload) => {
    setEditingPhoto(photo);
    setShowEditDialog(true);
  }, []);

  const updatePhotoDescription = useCallback((photoId: string, description: string) => {
    setPhotos(prev => prev.map(p => 
      p.id === photoId ? { ...p, description } : p
    ));
  }, []);

  // Enhanced upload handler with better validation
  const handleUpload = useCallback(() => {
    if (!selectedProperty) {
      toast({
        title: "Select a property",
        description: "Please select a property to upload photos to",
        variant: "destructive"
      });
      return;
    }

    const uploadablePhotos = photos.filter(p => p.status === 'uploaded');
    
    if (uploadablePhotos.length === 0) {
      toast({
        title: "No photos ready",
        description: "Please wait for photos to finish uploading or add new photos",
        variant: "destructive"
      });
      return;
    }

    uploadMutation.mutate({
      propertyId: selectedProperty,
      photos: uploadablePhotos
    });
  }, [selectedProperty, photos, uploadMutation, toast]);

  // Memoized computed values to prevent unnecessary recalculations
  const uploadStats = useMemo(() => {
    const total = photos.length;
    const uploaded = photos.filter(p => p.status === 'uploaded').length;
    const uploading = photos.filter(p => p.status === 'uploading').length;
    const failed = photos.filter(p => p.status === 'error').length;
    
    return { total, uploaded, uploading, failed };
  }, [photos]);

  const canUpload = useMemo(() => {
    return selectedProperty && uploadStats.uploaded > 0 && !uploadMutation.isPending;
  }, [selectedProperty, uploadStats.uploaded, uploadMutation.isPending]);

  // Cleanup effect for object URLs
  const cleanupPhotos = useCallback(() => {
    photos.forEach(photo => {
      if (photo.preview) {
        URL.revokeObjectURL(photo.preview);
      }
    });
  }, [photos]);

  // Enhanced photo grid rendering with better performance
  const renderPhotoGrid = useCallback(() => {
    if (photos.length === 0) return null;

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            Photo Preview ({uploadStats.total})
            {uploadStats.uploading > 0 && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                {uploadStats.uploading} uploading...
              </span>
            )}
          </CardTitle>
          <Button onClick={handleUpload} disabled={!canUpload}>
            {uploadMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload {uploadStats.uploaded} Photos
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group">
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <img 
                    src={photo.preview} 
                    alt={photo.description || "Property photo preview"}
                    className="w-full h-full object-cover"
                    loading="lazy" // Add lazy loading for better performance
                  />
                  {photo.isPrimary && (
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-yellow-500">Primary</Badge>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        onClick={() => handleEditPhoto(photo)}
                        title="Edit photo"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => removePhoto(photo.id)}
                        title="Remove photo"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                {photo.status === 'uploading' && (
                  <div className="mt-2">
                    <Progress value={photo.progress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Processing... {Math.round(photo.progress)}%
                    </p>
                  </div>
                )}
                
                {photo.status === 'uploaded' && (
                  <div className="mt-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-green-600">Ready to upload</span>
                  </div>
                )}
                
                {photo.status === 'error' && (
                  <div className="mt-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="text-xs text-red-600">Processing failed</span>
                  </div>
                )}

                <div className="mt-2 flex gap-2">
                  {!photo.isPrimary && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setPrimaryPhoto(photo.id)}
                      className="text-xs"
                      title="Set as primary photo"
                    >
                      <Star className="w-3 h-3 mr-1" />
                      Set Primary
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }, [photos, uploadStats, canUpload, handleUpload, uploadMutation.isPending, handleEditPhoto, removePhoto, setPrimaryPhoto]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Property Photo Management</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Upload high-quality photos to showcase your properties. Great photos can increase 
            inquiries by up to 300% and help your listings stand out.
          </p>
        </div>

        {/* Property Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Property</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading ? (
                <div className="col-span-full text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Loading properties...</p>
                </div>
              ) : error ? (
                <div className="col-span-full text-center py-8">
                  <AlertTriangle className="w-16 h-16 mx-auto text-red-500 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Failed to load properties</h3>
                  <p className="text-muted-foreground">
                    There was an error loading your properties. Please try again.
                  </p>
                </div>
              ) : properties && properties.length > 0 ? (
                properties.map((property) => (
                  <Card 
                    key={property.id} 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedProperty === property.id.toString() ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedProperty(property.id.toString())}
                  >
                    <CardContent className="p-4">
                      <div className="aspect-video bg-gray-100 rounded-lg mb-3 overflow-hidden">
                        {property.imageUrls?.[0] ? (
                          <img 
                            src={property.imageUrls?.[0]} 
                            alt={property.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <h3 className="font-medium mb-1">{property.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{property.location}</p>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-primary">
                          KES {property.price.toLocaleString()}
                        </span>
                        <Badge variant={(property.imageUrls?.length || 0) > 0 ? "default" : "secondary"}>
                          {property.imageUrls?.length || 0} photos
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No properties found</h3>
                  <p className="text-muted-foreground">
                    You need to list a property before you can upload photos.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {selectedProperty && (
          <>
            {/* Photo Upload Area */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Photos</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive ? 'border-primary bg-primary/5' : 'border-gray-300'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    Drag and drop photos here, or click to select
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Support for JPG, PNG, WebP. Max file size: 10MB each.
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileInput}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label htmlFor="photo-upload">
                    <Button variant="outline" className="cursor-pointer">
                      <Plus className="w-4 h-4 mr-2" />
                      Select Photos
                    </Button>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Photo Preview Grid */}
            {renderPhotoGrid()}
          </>
        )}

        {/* Photography Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Photography Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {PHOTO_TIPS.map((tip, index) => (
                <div key={index} className="flex items-start gap-3">
                  {tip.icon}
                  <div>
                    <h3 className="font-medium mb-1">{tip.title}</h3>
                    <p className="text-sm text-muted-foreground">{tip.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Photo Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Photo</DialogTitle>
            </DialogHeader>
            {editingPhoto && (
              <div className="space-y-4">
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <img 
                    src={editingPhoto.preview} 
                    alt="Edit preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Photo Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Add a description for this photo..."
                    value={editingPhoto.description || ''}
                    onChange={(e) => updatePhotoDescription(editingPhoto.id, e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setShowEditDialog(false)}>
                    Save Changes
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}