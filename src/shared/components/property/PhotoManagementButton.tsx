import { Camera, Image, Upload, Edit3 } from "lucide-react"
import React, { useCallback } from "react"
import { useNavigate } from "react-router-dom"

import { Badge } from "../ui/badge"
import { Button } from "../ui/button"

type PropertyType = "land" | "residential" | "commercial";
type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost";
type ButtonSize = "default" | "sm" | "lg" | "icon";

interface PhotoManagementButtonProps {
  readonly propertyId: string;
  readonly propertyType: PropertyType;
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly className?: string;
  readonly photoCount?: number;
  readonly showPhotoCount?: boolean;
  readonly disabled?: boolean;
}

/**
 * Shared photo management button component
 * Provides consistent photo management functionality across all property types
 */
export function PhotoManagementButton({
  propertyId,
  propertyType,
  variant = "outline",
  size = "default",
  className = "",
  photoCount = 0,
  showPhotoCount = true,
  disabled = false,
}: PhotoManagementButtonProps): React.ReactElement {
  const navigate = useNavigate();

  // Navigate to property photos page
  const handlePhotoManagement = useCallback(() => {
    if (disabled) return;

    // Navigate to the appropriate photo management page based on property type
    const photoPath = `/property/${propertyId}/photos`;
    navigate(photoPath, {
      state: {
        propertyType,
        propertyId,
        returnPath: window.location.pathname,
      },
    });
  }, [propertyId, propertyType, navigate, disabled]);

  // Get appropriate icon based on photo count
  const getIcon = () => {
    if (photoCount === 0) {
      return Upload;
    } else if (photoCount < 5) {
      return Camera;
    } else {
      return Image;
    }
  };

  // Get button text based on photo count and property type
  const getButtonText = () => {
    if (photoCount === 0) {
      return "Add Photos";
    } else {
      return "Manage Photos";
    }
  };

  // Get variant styling based on photo status
  const getVariant = (): ButtonVariant => {
    if (photoCount === 0) {
      return "default"; // Encourage photo upload
    }
    return variant || "outline";
  };

  // Helper function to get icon size based on button size
  const getIconSize = (buttonSize: ButtonSize): string => {
    switch (buttonSize) {
      case "sm":
        return "w-3 h-3";
      case "lg":
        return "w-5 h-5";
      default:
        return "w-4 h-4";
    }
  };

  const Icon = getIcon();
  const buttonText = getButtonText();
  const buttonVariant = getVariant();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={buttonVariant}
        size={size}
        onClick={handlePhotoManagement}
        disabled={disabled}
        className={`flex items-center gap-2 ${className}`}
      >
        <Icon className={getIconSize(size)} />
        <span>{buttonText}</span>
      </Button>

      {/* Photo count badge */}
      {showPhotoCount && photoCount > 0 && (
        <Badge
          variant={photoCount >= 5 ? "default" : "secondary"}
          className="flex items-center gap-1"
        >
          <Image className="w-3 h-3" />
          {photoCount}
        </Badge>
      )}

      {/* Photo status indicator */}
      {photoCount === 0 && (
        <Badge variant="outline" className="text-muted-foreground">
          No photos
        </Badge>
      )}
    </div>
  );
}

/**
 * Enhanced photo management button with additional features
 */
interface EnhancedPhotoManagementButtonProps {
  readonly propertyId: string;
  readonly propertyType: PropertyType;
  readonly photoCount?: number;
  readonly maxPhotos?: number;
  readonly className?: string;
}

export function EnhancedPhotoManagementButton({
  propertyId,
  propertyType,
  photoCount = 0,
  maxPhotos = 20,
  className = "",
}: EnhancedPhotoManagementButtonProps): React.ReactElement {
  const navigate = useNavigate();

  const handlePhotoManagement = useCallback(() => {
    navigate(`/property/${propertyId}/photos`, {
      state: {
        propertyType,
        propertyId,
        returnPath: window.location.pathname,
      },
    });
  }, [propertyId, propertyType, navigate]);

  // Calculate photo completion percentage
  const completionPercentage = Math.min((photoCount / 5) * 100, 100); // 5 photos = 100%
  const isComplete = photoCount >= 5;
  const isFull = photoCount >= maxPhotos;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Main button */}
      <Button
        variant={photoCount === 0 ? "default" : "outline"}
        onClick={handlePhotoManagement}
        className="w-full flex items-center gap-2"
        disabled={isFull}
      >
        {photoCount === 0 ?
          <>
            <Upload className="w-4 h-4" />
            Add Property Photos
          </>
        : <>
            <Edit3 className="w-4 h-4" />
            Manage Photos ({photoCount})
          </>
        }
      </Button>

      {/* Progress indicator */}
      {photoCount > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Photo completion</span>
            <span>{Math.round(completionPercentage)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                isComplete ? "bg-green-500" : "bg-blue-500"
              }`}
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {photoCount} of {maxPhotos} photos
            </span>
            {isComplete && (
              <Badge variant="default" className="text-xs">
                Complete
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Photo tips */}
      {photoCount < 5 && (
        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
          💡 Add at least 5 high-quality photos to increase property visibility
        </div>
      )}
    </div>
  );
}

/**
 * Compact photo management button for list views
 */
interface CompactPhotoManagementButtonProps {
  readonly propertyId: string;
  readonly propertyType: PropertyType;
  readonly photoCount?: number;
}

export function CompactPhotoManagementButton({
  propertyId,
  propertyType,
  photoCount = 0,
}: CompactPhotoManagementButtonProps): React.ReactElement {
  const navigate = useNavigate();

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      navigate(`/property/${propertyId}/photos`, {
        state: {
          propertyType,
          propertyId,
          returnPath: window.location.pathname,
        },
      });
    },
    [propertyId, propertyType, navigate]
  );

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className="flex items-center gap-1 text-xs"
    >
      {photoCount === 0 ?
        <>
          <Upload className="w-3 h-3" />
          Add
        </>
      : <>
          <Image className="w-3 h-3" />
          {photoCount}
        </>
      }
    </Button>
  );
}

/**
 * Property type specific photo management buttons
 */
export function LandPhotoManagementButton(
  props: Readonly<Omit<PhotoManagementButtonProps, "propertyType">>
) {
  return <PhotoManagementButton {...props} propertyType="land" />;
}

export function ResidentialPhotoManagementButton(
  props: Readonly<Omit<PhotoManagementButtonProps, "propertyType">>
) {
  return <PhotoManagementButton {...props} propertyType="residential" />;
}

export function CommercialPhotoManagementButton(
  props: Readonly<Omit<PhotoManagementButtonProps, "propertyType">>
) {
  return <PhotoManagementButton {...props} propertyType="commercial" />;
}

// Export with display names for debugging
PhotoManagementButton.displayName = "PhotoManagementButton";
EnhancedPhotoManagementButton.displayName = "EnhancedPhotoManagementButton";
CompactPhotoManagementButton.displayName = "CompactPhotoManagementButton";

export default PhotoManagementButton;
