/**
 * VirtualizedPropertyList
 *
 * Renders a large property collection in grid or list mode using
 * EnterpriseVirtualizedList / GridVirtualizedList from VirtualizedList.tsx.
 * All scroll management, end-reached throttling, and ref forwarding are
 * delegated to those wrappers — not re-implemented here.
 */

import React, {
  forwardRef,
  memo,
  useMemo,
  useCallback,
  useState,
  useEffect,
  useRef,
} from "react";

import {
  EnterpriseVirtualizedList,
  GridVirtualizedList,
  type EnterpriseVirtualizedListHandle,
  type VirtualisedRenderFn,
} from "./VirtualizedList";

import type { Property, ViewMode } from "@shared/types/property";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CardComponentProps {
  property:  Property;
  onClick?:  (property: Property) => void;
  className?: string;
}

export interface VirtualizedPropertyListProps {
  properties:        readonly Property[];
  viewMode:          ViewMode;
  height:            number;
  width?:            number;
  onPropertyClick?:  (property: Property) => void;
  onEndReached?:     () => void;
  loading?:          boolean;
  className?:        string;
  CardComponent:     React.ComponentType<CardComponentProps>;
  // Grid sizing (ignored in list mode)
  gridItemWidth?:    number;
  gridItemHeight?:   number;
  // List sizing (ignored in grid mode)
  listItemHeight?:   number;
}

// ─── Loading / empty states ───────────────────────────────────────────────────

const LoadingState = memo(() => (
  <div className="flex items-center justify-center h-full">
    <div
      className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"
      role="status"
      aria-label="Loading properties"
    />
    <span className="ml-3 text-sm text-muted-foreground">Loading properties…</span>
  </div>
));
LoadingState.displayName = "LoadingState";

const EmptyState = memo(() => (
  <div
    className="flex flex-col items-center justify-center h-full text-muted-foreground"
    role="status"
    aria-label="No properties found"
  >
    <div className="w-24 h-24 mb-4 bg-muted rounded-full flex items-center justify-center" aria-hidden>
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      </svg>
    </div>
    <p className="font-medium text-base mb-2">No properties found</p>
    <p className="text-sm">Try adjusting your search or filters.</p>
  </div>
));
EmptyState.displayName = "EmptyState";

// ─── Responsive grid hook ─────────────────────────────────────────────────────

interface ResponsiveGridResult {
  itemsPerRow:     number;
  actualItemWidth: number;
}

function useResponsiveGrid(
  containerWidth: number,
  itemWidth:      number,
  minCols = 1,
  maxCols = 6,
): ResponsiveGridResult {
  return useMemo(() => {
    const available = Math.max(0, containerWidth - 32); // 16px gutter each side
    const count     = Math.max(minCols, Math.min(maxCols, Math.floor(available / itemWidth)));
    return { itemsPerRow: count, actualItemWidth: Math.floor(available / count) };
  }, [containerWidth, itemWidth, minCols, maxCols]);
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * Forward the ref typed as EnterpriseVirtualizedListHandle so parent
 * components can call scrollToItem / scrollToTop / etc. The ref is forwarded
 * directly to the inner EnterpriseVirtualizedList or GridVirtualizedList,
 * both of which implement the full handle.
 */
export const VirtualizedPropertyList = memo(
  forwardRef<EnterpriseVirtualizedListHandle, VirtualizedPropertyListProps>(
    (
      {
        properties,
        viewMode,
        height,
        width,
        onPropertyClick,
        onEndReached,
        loading        = false,
        className      = "",
        CardComponent,
        gridItemWidth  = 320,
        gridItemHeight = 400,
        listItemHeight = 200,
      },
      ref,
    ) => {
      const containerRef    = useRef<HTMLDivElement>(null);
      const [containerWidth, setContainerWidth] = useState(width ?? 1200);

      // Sync measured width unless the parent provides an explicit value
      useEffect(() => {
        if (width !== undefined) {
          setContainerWidth(width);
          return;
        }
        if (!containerRef.current) return;
        const observer = new ResizeObserver(([entry]) => {
          setContainerWidth(entry.contentRect.width);
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
      }, [width]);

      const { itemsPerRow, actualItemWidth } = useResponsiveGrid(containerWidth, gridItemWidth);

      // ── List render fn ────────────────────────────────────────────────────

      const renderListItem = useCallback<VirtualisedRenderFn<Property>>(
        (property, _index, style) => (
          <div style={style} className="p-2 w-full">
            <CardComponent
              property={property}
              onClick={onPropertyClick}
              className="flex flex-row w-full"
            />
          </div>
        ),
        [CardComponent, onPropertyClick],
      );

      // ── Grid render fn ────────────────────────────────────────────────────

      const renderGridItem = useCallback<VirtualisedRenderFn<Property>>(
        (property, _index, style) => (
          <div style={style} className="p-2">
            <CardComponent property={property} onClick={onPropertyClick} />
          </div>
        ),
        [CardComponent, onPropertyClick],
      );

      const keyExtractor = useCallback(
        (property: Property) => property.id,
        [],
      );

      // ── Loading / empty ───────────────────────────────────────────────────

      if (loading) {
        return (
          <div ref={containerRef} className={`${className} h-full`}>
            <LoadingState />
          </div>
        );
      }

      if (properties.length === 0) {
        return (
          <div ref={containerRef} className={`${className} h-full`}>
            <EmptyState />
          </div>
        );
      }

      // ── Grid mode ─────────────────────────────────────────────────────────

      if (viewMode === "grid") {
        return (
          <div ref={containerRef} className={`${className} w-full`}>
            <GridVirtualizedList
              ref={ref as React.Ref<import("./VirtualizedList").GridVirtualizedListHandle>}
              items={properties}
              itemWidth={actualItemWidth}
              itemHeight={gridItemHeight}
              containerWidth={containerWidth}
              containerHeight={height}
              renderItem={renderGridItem}
              keyExtractor={keyExtractor}
              overscanCount={2}
              onEndReached={onEndReached}
            />
          </div>
        );
      }

      // ── List mode ─────────────────────────────────────────────────────────

      return (
        <div ref={containerRef} className={`${className} w-full`}>
          <EnterpriseVirtualizedList
            ref={ref}
            items={properties}
            itemHeight={listItemHeight}
            containerHeight={height}
            containerWidth={containerWidth}
            renderItem={renderListItem}
            keyExtractor={keyExtractor}
            overscanCount={5}
            onEndReached={onEndReached}
          />
        </div>
      );
    },
  ),
);
VirtualizedPropertyList.displayName = "VirtualizedPropertyList";

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Measures a container element and returns dimensions suitable for passing
 * to VirtualizedPropertyList as `width` and `height`.
 */
export function useVirtualizedDimensions(
  containerRef: React.RefObject<HTMLDivElement>,
): { width: number; height: number } {
  const [dimensions, setDimensions] = useState({ width: 1200, height: 600 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const { width, top } = el.getBoundingClientRect();
      setDimensions({ width, height: Math.max(400, window.innerHeight - top - 100) });
    };

    const observer = new ResizeObserver(update);
    observer.observe(el);
    update();
    return () => observer.disconnect();
  }, [containerRef]);

  return dimensions;
}