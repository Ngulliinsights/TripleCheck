import React, { useEffect, useRef, useState } from 'react'

import { cn } from '@/local/lib/utils'

interface ContentGridProps {
  children: React.ReactNode;
  columns?: number;
  gap?: string;
  layout?: 'masonry' | 'grid' | 'asymmetric';
  className?: string;
  minItemWidth?: string;
  autoResize?: boolean;
}

export function ContentGrid({
  children,
  columns = 3,
  gap = '1.5rem',
  layout = 'grid',
  className,
  minItemWidth = '300px',
  autoResize = true
}: ContentGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [dynamicColumns, setDynamicColumns] = useState(columns);

  useEffect(() => {
    if (!autoResize || !gridRef.current) return;

    const updateColumns = () => {
      if (gridRef.current) {
        const containerWidth = gridRef.current.offsetWidth;
        const minWidth = parseInt(minItemWidth);
        const gapWidth = parseInt(gap) || 24;
        
        // Calculate optimal columns based on container width
        const calculatedColumns = Math.max(
          1,
          Math.floor((containerWidth + gapWidth) / (minWidth + gapWidth))
        );
        
        setDynamicColumns(Math.min(calculatedColumns, columns));
      }
    };

    // Initial calculation
    updateColumns();

    // Throttled resize handler
    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(updateColumns, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, [columns, minItemWidth, gap, autoResize]);

  const getGridStyles = () => {
    const baseStyles = {
      gap,
      gridTemplateColumns: `repeat(${dynamicColumns}, 1fr)`
    };

    switch (layout) {
      case 'masonry':
        return {
          ...baseStyles,
          display: 'grid',
          gridAutoRows: 'masonry', // CSS Grid Level 3 - fallback handled below
          alignItems: 'start'
        };
      
      case 'asymmetric':
        return {
          ...baseStyles,
          display: 'grid',
          gridAutoRows: 'min-content',
          gridTemplateColumns: dynamicColumns === 1 
            ? '1fr' 
            : dynamicColumns === 2 
            ? '1.5fr 1fr' 
            : '2fr 1fr 1.5fr'
        };
      
      default: // 'grid'
        return {
          ...baseStyles,
          display: 'grid',
          gridAutoRows: '1fr',
          alignItems: 'stretch'
        };
    }
  };

  // Masonry fallback for browsers that don't support CSS Grid masonry
  useEffect(() => {
    if (layout !== 'masonry' || !gridRef.current) return () => {};

    const grid = gridRef.current;
    const items = Array.from(grid.children) as HTMLElement[];
    
    // Check if browser supports masonry
    const supportsGridMasonry = CSS.supports('grid-template-rows', 'masonry');
    
    if (!supportsGridMasonry) {
      // Implement JavaScript masonry fallback
      const resizeObserver = new ResizeObserver(() => {
        const columnHeights = new Array(dynamicColumns).fill(0);
        const gapValue = parseInt(gap) || 24;

        items.forEach((item, index) => {
          if (index < dynamicColumns) {
            // First row
            item.style.gridColumn = `${index + 1}`;
            item.style.gridRow = '1';
          } else {
            // Find shortest column
            const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));
            item.style.gridColumn = `${shortestColumnIndex + 1}`;
            
            const itemHeight = item.offsetHeight;
            columnHeights[shortestColumnIndex] += itemHeight + gapValue;
          }
        });
      });

      items.forEach(item => resizeObserver.observe(item));
      
      return () => resizeObserver.disconnect();
    }
    
    return () => {}; // Return empty cleanup function when masonry is supported
  }, [layout, dynamicColumns, gap]);

  return (
    <div
      ref={gridRef}
      className={cn('w-full', className)}
      style={getGridStyles()}
    >
      {children}
    </div>
  );
}