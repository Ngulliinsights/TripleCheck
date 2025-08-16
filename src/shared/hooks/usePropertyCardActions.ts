import { useCallback, useState } from "react";
import type { NormalizedProperty } from "../types/property";

export interface PropertyActionCallbacks {
  /** Callback when property is saved/bookmarked */
  onSave?: (id: string) => void | Promise<void>;
  /** Callback when property is shared */
  onShare?: (id: string) => void | Promise<void>;
  /** Callback when property details are viewed */
  onViewDetails?: (id: string) => void | Promise<void>;
  /** Callback when property verification is requested */
  onVerify?: (id: string) => void | Promise<void>;
  /** Callback when property card is clicked */
  onClick?: (property: NormalizedProperty) => void | Promise<void>;
  /** Optional analytics callback for tracking user actions */
  onAnalyticsEvent?: (action: 'save' | 'share' | 'view' | 'verify' | 'click', propertyId: string) => void;
  /** Optional error handler for action failures */
  onError?: (action: string, error: Error) => void;
}

export interface UsePropertyCardActionsReturn {
  /** Handler for save/bookmark action */
  handleSave: (event: React.MouseEvent) => void;
  /** Handler for share action */
  handleShare: (event: React.MouseEvent) => void;
  /** Handler for view details action */
  handleViewDetails: (event?: React.MouseEvent) => void;
  /** Handler for verify action */
  handleVerify: (event: React.MouseEvent) => void;
  /** Handler for card click action */
  handleCardClick: (event: React.MouseEvent) => void;
  /** Whether any action is currently processing */
  isProcessing: boolean;
  /** Last error that occurred during an action */
  lastError: Error | null;
}

/**
 * Enhanced shared hook for managing property card actions
 * Handles save, share, view details, verify, and card click actions with comprehensive error handling
 * Used by PropertyCard, EnhancedLandCard, and other property components
 * 
 * @param property - The property to create actions for
 * @param callbacks - Action callbacks and configuration
 * @returns Action handlers and state
 */
export function usePropertyCardActions(
  property: NormalizedProperty,
  callbacks: PropertyActionCallbacks
): UsePropertyCardActionsReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);

  // Enhanced generic action handler with comprehensive error handling
  const handleAction = useCallback(
    async (
      event: React.MouseEvent | undefined,
      action: () => Promise<void> | void,
      actionName: string
    ) => {
      event?.stopPropagation();
      
      if (isProcessing) {
        return; // Prevent multiple simultaneous actions
      }

      setIsProcessing(true);
      setLastError(null);

      try {
        await action();
        
        // Track successful action
        callbacks.onAnalyticsEvent?.(actionName as any, property.id);
      } catch (error) {
        const actionError = error instanceof Error ? error : new Error(`${actionName} action failed`);
        setLastError(actionError);
        
        // Call error handler if provided
        callbacks.onError?.(actionName, actionError);
        
        // Log error for debugging
        console.error(`${actionName} action failed:`, actionError);
      } finally {
        setIsProcessing(false);
      }
    },
    [isProcessing, callbacks, property.id]
  );

  const handleSave = useCallback(
    (event: React.MouseEvent) => {
      handleAction(event, async () => {
        await callbacks.onSave?.(property.id);
      }, "save");
    },
    [handleAction, callbacks, property.id]
  );

  const handleShare = useCallback(
    (event: React.MouseEvent) => {
      handleAction(
        event,
        async () => {
          const shareUrl = `${window.location.origin}/property/${property.id}`;
          const shareTitle = property.title || 'Property Listing';
          const shareText = `Check out this ${property.type || property.category || 'property'}: ${shareTitle}`;

          // Try native sharing first (mobile devices)
          if (navigator.share && navigator.canShare?.({ title: shareTitle, text: shareText, url: shareUrl })) {
            await navigator.share({
              title: shareTitle,
              text: shareText,
              url: shareUrl,
            });
          } else if (navigator.clipboard) {
            // Fallback to clipboard with user feedback
            await navigator.clipboard.writeText(shareUrl);
            
            // Could show a toast notification here
            if (process.env.NODE_ENV === 'development') {
              console.log('Property URL copied to clipboard:', shareUrl);
            }
          } else {
            // Final fallback to callback
            await callbacks.onShare?.(property.id);
          }
        },
        "share"
      );
    },
    [handleAction, callbacks, property.id, property.title, property.type, property.category]
  );

  const handleViewDetails = useCallback(
    (event?: React.MouseEvent) => {
      handleAction(
        event,
        async () => {
          await callbacks.onViewDetails?.(property.id);
        },
        "view"
      );
    },
    [handleAction, callbacks, property.id]
  );

  const handleVerify = useCallback(
    (event: React.MouseEvent) => {
      handleAction(event, async () => {
        await callbacks.onVerify?.(property.id);
      }, "verify");
    },
    [handleAction, callbacks, property.id]
  );

  const handleCardClick = useCallback(
    (event: React.MouseEvent) => {
      if (callbacks.onClick && !isProcessing) {
        event.preventDefault();
        
        try {
          callbacks.onClick(property);
          callbacks.onAnalyticsEvent?.("click", property.id);
        } catch (error) {
          const clickError = error instanceof Error ? error : new Error('Card click failed');
          setLastError(clickError);
          callbacks.onError?.("click", clickError);
        }
      }
    },
    [callbacks, property, isProcessing]
  );

  return {
    handleSave,
    handleShare,
    handleViewDetails,
    handleVerify,
    handleCardClick,
    isProcessing,
    lastError,
  };
}

export default usePropertyCardActions;