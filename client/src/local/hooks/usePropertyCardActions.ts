import { useCallback, useEffect, useRef, useState } from "react"
import type { NormalizedProperty } from '@shared/types/property'

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
 * Shared hook for managing property card actions.
 * Handles save, share, view details, verify, and card click actions with comprehensive error handling.
 * Used by PropertyCard, EnhancedLandCard, and other property components.
 *
 * @param property - The property to create actions for
 * @param callbacks - Action callbacks and configuration
 * @returns Action handlers and state
 *
 * @note Pass stable (memoised) `callbacks` and `property` references to avoid unnecessary handler
 * recreation. The hook uses the latest-ref pattern internally so stale closures are not a concern,
 * but recreating these objects on every parent render does cause React to flush extra paint cycles.
 */
export function usePropertyCardActions(
  property: NormalizedProperty,
  callbacks: PropertyActionCallbacks
): UsePropertyCardActionsReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);

  // --- Stable refs -----------------------------------------------------------
  // isProcessingRef lets handleAction guard against concurrent actions without
  // being included in its dependency array (which would cause all derived
  // handlers to be recreated each time isProcessing flips).
  const isProcessingRef = useRef(false);

  // callbacksRef always holds the latest callbacks object so handlers that were
  // created on a previous render still call the current version.
  const callbacksRef = useRef(callbacks);
  useEffect(() => { callbacksRef.current = callbacks; });

  // propertyRef similarly stabilises the property identity used inside handlers.
  const propertyRef = useRef(property);
  useEffect(() => { propertyRef.current = property; });

  // ---------------------------------------------------------------------------

  const handleAction = useCallback(
    async (
      event: React.MouseEvent | undefined,
      action: () => Promise<void> | void,
      actionName: 'save' | 'share' | 'view' | 'verify' | 'click'
    ) => {
      event?.stopPropagation();

      if (isProcessingRef.current) return;

      isProcessingRef.current = true;
      setIsProcessing(true);
      setLastError(null);

      try {
        await action();
        callbacksRef.current.onAnalyticsEvent?.(actionName, propertyRef.current.id);
      } catch (error) {
        const actionError = error instanceof Error ? error : new Error(`${actionName} action failed`);
        setLastError(actionError);
        callbacksRef.current.onError?.(actionName, actionError);

        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.error(`[usePropertyCardActions] ${actionName} failed:`, actionError);
        }
      } finally {
        isProcessingRef.current = false;
        setIsProcessing(false);
      }
    },
    [] // No deps: all values are accessed through stable refs
  );

  const handleSave = useCallback(
    (event: React.MouseEvent) => {
      handleAction(event, () => callbacksRef.current.onSave?.(propertyRef.current.id), 'save');
    },
    [handleAction]
  );

  const handleShare = useCallback(
    (event: React.MouseEvent) => {
      handleAction(
        event,
        async () => {
          const { id, title, type, category } = propertyRef.current;
          const shareUrl = `${window.location.origin}/property/${id}`;
          const shareTitle = title || 'Property Listing';
          const shareText = `Check out this ${type || category || 'property'}: ${shareTitle}`;

          // Prefer the native share sheet on mobile devices.
          if (navigator.share && navigator.canShare?.({ title: shareTitle, text: shareText, url: shareUrl })) {
            await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
          } else if (navigator.clipboard) {
            await navigator.clipboard.writeText(shareUrl);
          } else {
            await callbacksRef.current.onShare?.(id);
          }
        },
        'share'
      );
    },
    [handleAction]
  );

  const handleViewDetails = useCallback(
    (event?: React.MouseEvent) => {
      handleAction(
        event,
        () => callbacksRef.current.onViewDetails?.(propertyRef.current.id),
        'view'
      );
    },
    [handleAction]
  );

  const handleVerify = useCallback(
    (event: React.MouseEvent) => {
      handleAction(event, () => callbacksRef.current.onVerify?.(propertyRef.current.id), 'verify');
    },
    [handleAction]
  );

  // Card-click is synchronous and must not be blocked by isProcessing, so we
  // route it through handleAction separately to ensure stopPropagation fires
  // only when an onClick handler is actually registered.
  const handleCardClick = useCallback(
    (event: React.MouseEvent) => {
      if (!callbacksRef.current.onClick) return;
      // Prevent navigation bubbling when a handler is present.
      event.preventDefault();
      handleAction(
        event,
        () => callbacksRef.current.onClick!(propertyRef.current),
        'click'
      );
    },
    [handleAction]
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