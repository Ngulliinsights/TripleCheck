import { useMutation, useQueryClient } from '@tanstack/react-query';
import { propertyApi } from '../services/propertyApi';
import { toast } from 'sonner'; // or your preferred toast library

export const usePropertyActions = () => {
  const queryClient = useQueryClient();

  const addToFavoritesMutation = useMutation({
    mutationFn: propertyApi.addToFavorites,
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
      propertyApi.shareProperty(propertyId, method),
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