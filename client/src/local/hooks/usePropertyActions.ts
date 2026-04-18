import { useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from './use-toast'

const API_BASE = '/api/properties';

/**
 * @deprecated This hook is deprecated in favour of useSafeQuery with mutation configurations.
 * Please migrate to useSafeQuery with POST/PUT methods for better error handling.
 */
export const usePropertyActions = () => {
  const queryClient = useQueryClient();

  // Run the deprecation warning once on mount, not on every render.
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn(
        '[DEPRECATED] usePropertyActions is deprecated. ' +
        'Please migrate to useSafeQuery with mutation configurations for better error handling and performance.'
      );
    }
  }, []);

  const addToFavoritesMutation = useMutation({
    mutationFn: async (propertyId: string): Promise<void> => {
      const response = await fetch(`${API_BASE}/${propertyId}/favorite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`Failed to add to favorites: ${response.status}`);
      }
    },
    onSuccess: () => {
      toast({ title: 'Property added to favourites', variant: 'default' });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
    onError: () => {
      toast({ title: 'Failed to add to favourites', variant: 'destructive' });
    },
  });

  const sharePropertyMutation = useMutation({
    mutationFn: async ({ propertyId, method }: { propertyId: string; method: 'email' | 'sms' | 'link' }): Promise<string> => {
      const response = await fetch(`${API_BASE}/${propertyId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method }),
      });
      if (!response.ok) {
        throw new Error(`Failed to share property: ${response.status}`);
      }
      const data = await response.json();
      return data.shareUrl ?? '';
    },
    onSuccess: (shareUrl: string, { method }) => {
      if (method === 'link') {
        navigator.clipboard.writeText(shareUrl);
        toast({ title: 'Share link copied to clipboard', variant: 'default' });
      } else {
        toast({ title: 'Property shared successfully', variant: 'default' });
      }
    },
    onError: () => {
      toast({ title: 'Failed to share property', variant: 'destructive' });
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