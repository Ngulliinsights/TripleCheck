import { useMemo } from 'react';

// Specialized hooks for common virtualization use cases
// These replace the custom useVirtualization hooks with react-window based solutions

export function usePropertyListVirtualization(
  properties: any[],
  containerHeight: number,
  itemHeight: number = 280
) {
  return useMemo(() => ({
    items: properties,
    itemHeight,
    containerHeight,
    keyExtractor: (property: any, index: number) => `${property.id}-${index}`,
    overscanCount: 3,
  }), [properties, containerHeight, itemHeight]);
}

export function usePropertyGridVirtualization(
  properties: any[],
  containerWidth: number,
  containerHeight: number,
  cardWidth: number = 280,
  cardHeight: number = 320
) {
  return useMemo(() => ({
    items: properties,
    itemWidth: cardWidth,
    itemHeight: cardHeight,
    containerWidth,
    containerHeight,
    gap: 16,
    keyExtractor: (property: any, index: number) => `${property.id}-${index}`,
    overscanCount: 1,
  }), [properties, containerWidth, containerHeight, cardWidth, cardHeight]);
}

export function useNotificationListVirtualization(
  notifications: any[],
  containerHeight: number,
  itemHeight: number = 80
) {
  return useMemo(() => ({
    items: notifications,
    itemHeight,
    containerHeight,
    keyExtractor: (notification: any, index: number) => `${notification.id}-${index}`,
    overscanCount: 5,
  }), [notifications, containerHeight, itemHeight]);
}

export function useReviewListVirtualization(
  reviews: any[],
  containerHeight: number,
  getItemHeight: (review: any) => number = () => 120
) {
  return useMemo(() => ({
    items: reviews,
    itemHeight: getItemHeight,
    containerHeight,
    keyExtractor: (review: any, index: number) => `${review.id}-${index}`,
    overscanCount: 2,
  }), [reviews, containerHeight, getItemHeight]);
}

export function useTenantListVirtualization(
  tenants: any[],
  containerHeight: number,
  itemHeight: number = 200
) {
  return useMemo(() => ({
    items: tenants,
    itemHeight,
    containerHeight,
    keyExtractor: (tenant: any, index: number) => `${tenant.id}-${index}`,
    overscanCount: 3,
  }), [tenants, containerHeight, itemHeight]);
}

export function useTeamGridVirtualization(
  members: any[],
  containerWidth: number,
  containerHeight: number,
  cardWidth: number = 250,
  cardHeight: number = 300
) {
  return useMemo(() => ({
    items: members,
    itemWidth: cardWidth,
    itemHeight: cardHeight,
    containerWidth,
    containerHeight,
    gap: 24,
    keyExtractor: (member: any, index: number) => `${member.id || index}`,
    overscanCount: 1,
  }), [members, containerWidth, containerHeight, cardWidth, cardHeight]);
}