import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner'; // or your preferred toast library

import { PropertyApi } from '../../property/services/property-api';

/**
 * @deprecated This hook is deprecated in favor of useSafeQuery with mutation configurations
 * Please migrate to useSafeQuery with custom mutation endpoints for better error handling.
 * Migration guide: Use useSafeQuery with POST/PUT methods for property actions
 */
export const usePropertyActions = () => {
  const queryClient = useQueryClient();
  
  // Add deprecation warning in development
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.warn(
      "[DEPRECATED] usePropertyActions is deprecated. Please migrate to useSafeQuery with mutation configurations for better error handling and performance."
    );
  }

  const addToFavoritesMutation = useMutation({
    mutationFn: PropertyApi.addToFavorites,
    onSuccess: () => {
      toast.success('Property added to favorites');
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
    onError: () => {
      toast.error('Failed to add to favorites');
    },
  });

  const sharePropertyMutation = useMutation({
    mutationFn: ({ propertyId, method }: { propertyId: string; method: 'email' | 'sms' | 'link' }) =>
      PropertyApi.shareProperty(propertyId, method),
    onSuccess: (shareUrl, { method }) => {
      if (method === 'link') {
        navigator.clipboard.writeText(shareUrl);
        toast.success('Share link copied to clipboard');
      } else {
        toast.success('Property shared successfully');
      }
    },
    onError: () => {
      toast.error('Failed to share property');
    },
  });

  return {
    addToFavorites: (propertyId: string) => addToFavoritesMutation.mutate(propertyId),
    shareProperty: (propertyId: string, method: 'email' | 'sms' | 'link') =>
      sharePropertyMutation.mutate({ propertyId, method }),
    isAddingToFavorites: addToFavoritesMutation.isPending,
    isSharing: sharePropertyMutation.isPending,
  };
};