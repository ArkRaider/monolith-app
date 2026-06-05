import { useState, useEffect, RefObject } from 'react';

interface OptimalGridResult {
  itemWidth: number;
  itemHeight: number;
}

export function useOptimalGrid(
  containerRef: RefObject<HTMLElement | null>,
  itemCount: number,
  aspectRatio: number = 16 / 9,
  minWidth: number = 280,
  gap: number = 16
): OptimalGridResult {
  const [size, setSize] = useState<OptimalGridResult>({ itemWidth: 0, itemHeight: 0 });

  useEffect(() => {
    if (!containerRef.current || itemCount === 0) {
      setSize({ itemWidth: 0, itemHeight: 0 });
      return;
    }

    const calculateLayout = () => {
      const container = containerRef.current;
      if (!container) return;

      const { clientWidth, clientHeight } = container;
      const computedStyle = getComputedStyle(container);
      const paddingX = parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight);
      const paddingY = parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom);
      
      const usableWidth = clientWidth - paddingX;
      const usableHeight = clientHeight - paddingY;
      
      let bestArea = 0;
      let bestWidth = 0;

      for (let cols = 1; cols <= itemCount; cols++) {
        const rows = Math.ceil(itemCount / cols);
        
        const totalGapWidth = (cols - 1) * gap;
        const totalGapHeight = (rows - 1) * gap;
        
        const availableWidth = usableWidth - totalGapWidth;
        const availableHeight = usableHeight - totalGapHeight;
        
        const maxWidthByWidth = availableWidth / cols;
        const maxHeightByHeight = availableHeight / rows;
        const maxWidthByHeight = maxHeightByHeight * aspectRatio;
        
        const itemWidth = Math.min(maxWidthByWidth, maxWidthByHeight);
        const itemHeight = itemWidth / aspectRatio;
        const area = itemWidth * itemHeight;
        
        if (area > bestArea) {
          bestArea = area;
          bestWidth = itemWidth;
        }
      }

      // Enforce mobile minimum width constraint and allow overflow to handle scrolling
      const finalWidth = Math.max(bestWidth, minWidth);
      const finalHeight = finalWidth / aspectRatio;

      setSize({ itemWidth: Math.floor(finalWidth), itemHeight: Math.floor(finalHeight) });
    };

    const observer = new ResizeObserver(() => {
      calculateLayout();
    });

    observer.observe(containerRef.current);
    calculateLayout(); // Initial calculation

    return () => {
      observer.disconnect();
    };
  }, [containerRef, itemCount, aspectRatio, minWidth, gap]);

  return size;
}
