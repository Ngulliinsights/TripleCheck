import { RefreshCw, ArrowRight, Download, Share2, Heart, Eye } from "lucide-react";
import { memo } from "react";

import { Button } from "./button";

interface RefreshButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  label?: string;
  variant?: "default" | "outline" | "coral" | "coral-outline" | "coral-ghost";
  size?: "sm" | "default" | "lg";
  className?: string;
}

export const RefreshButton = memo<RefreshButtonProps>(({
  onClick,
  isLoading = false,
  label,
  variant = "coral-outline",
  size = "sm",
  className = ""
}) => (
  <Button
    onClick={onClick}
    variant={variant}
    size={size}
    disabled={isLoading}
    className={className}
  >
    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
    {isLoading ? 'Refreshing...' : (label || 'Refresh')}
  </Button>
));

interface ReadMoreButtonProps {
  onClick: () => void;
  label?: string;
  variant?: "default" | "outline" | "coral" | "coral-outline";
  size?: "sm" | "default" | "lg";
  className?: string;
  showArrow?: boolean;
}

export const ReadMoreButton = memo<ReadMoreButtonProps>(({
  onClick,
  label = "Read More",
  variant = "coral",
  size = "sm",
  className = "",
  showArrow = true
}) => (
  <Button
    onClick={onClick}
    variant={variant}
    size={size}
    className={`${className} ${showArrow ? 'group' : ''}`}
  >
    {label}
    {showArrow && (
      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
    )}
  </Button>
));

interface ViewAllButtonProps {
  onClick: () => void;
  label?: string;
  variant?: "default" | "outline" | "coral" | "coral-outline";
  size?: "sm" | "default" | "lg";
  className?: string;
}

export const ViewAllButton = memo<ViewAllButtonProps>(({
  onClick,
  label = "View All",
  variant = "coral",
  size = "lg",
  className = ""
}) => (
  <Button
    onClick={onClick}
    variant={variant}
    size={size}
    className={`px-8 py-3 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl ${className}`}
  >
    {label}
    <ArrowRight className="w-5 h-5 ml-2" />
  </Button>
));

interface ActionButtonProps {
  onClick: () => void;
  icon: React.ComponentType<any>;
  label: string;
  variant?: "default" | "outline" | "coral" | "coral-outline";
  size?: "sm" | "default" | "lg";
  className?: string;
}

export const ActionButton = memo<ActionButtonProps>(({
  onClick,
  icon: Icon,
  label,
  variant = "outline",
  size = "default",
  className = ""
}) => (
  <Button
    onClick={onClick}
    variant={variant}
    size={size}
    className={`w-full ${className}`}
  >
    <Icon className="w-4 h-4 mr-2" />
    {label}
  </Button>
));

// Pre-configured common action buttons
export const SaveButton = memo<Omit<ActionButtonProps, 'icon' | 'label'>>(
  (props) => <ActionButton {...props} icon={Heart} label="Save to Favorites" />
);

export const ShareButton = memo<Omit<ActionButtonProps, 'icon' | 'label'>>(
  (props) => <ActionButton {...props} icon={Share2} label="Share" />
);

export const ViewButton = memo<Omit<ActionButtonProps, 'icon' | 'label'>>(
  (props) => <ActionButton {...props} icon={Eye} label="View Details" />
);

export const DownloadButton = memo<Omit<ActionButtonProps, 'icon' | 'label'>>(
  (props) => <ActionButton {...props} icon={Download} label="Download" />
);

RefreshButton.displayName = "RefreshButton";
ReadMoreButton.displayName = "ReadMoreButton";
ViewAllButton.displayName = "ViewAllButton";
ActionButton.displayName = "ActionButton";
SaveButton.displayName = "SaveButton";
ShareButton.displayName = "ShareButton";
ViewButton.displayName = "ViewButton";
DownloadButton.displayName = "DownloadButton";