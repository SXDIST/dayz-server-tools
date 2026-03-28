"use client";

import { forwardRef, useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type VirtualListProps<T> = {
  items: T[];
  itemHeight: number;
  overscan?: number;
  paddingTop?: number;
  paddingBottom?: number;
  className?: string;
  contentClassName?: string;
  emptyState?: React.ReactNode;
  renderItem: (item: T, index: number) => React.ReactNode;
};

function VirtualListInner<T>(
  {
    items,
    itemHeight,
    overscan = 6,
    paddingTop = 0,
    paddingBottom = 0,
    className,
    contentClassName,
    emptyState = null,
    renderItem,
  }: VirtualListProps<T>,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  useEffect(() => {
    const element = containerRef.current;

    if (!element) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];

      if (!entry) {
        return;
      }

      setViewportHeight(entry.contentRect.height);
    });

    observer.observe(element);
    setViewportHeight(element.clientHeight);

    return () => {
      observer.disconnect();
    };
  }, []);

  const visibleRange = useMemo(() => {
    const itemsCount = items.length;
    const effectiveScrollTop = Math.max(0, scrollTop - paddingTop);
    const startIndex = Math.max(0, Math.floor(effectiveScrollTop / itemHeight) - overscan);
    const visibleCount =
      viewportHeight > 0 ? Math.ceil(viewportHeight / itemHeight) + overscan * 2 : Math.min(itemsCount, 20);
    const endIndex = Math.min(itemsCount, startIndex + visibleCount);

    return {
      startIndex,
      endIndex,
      totalHeight: paddingTop + paddingBottom + itemsCount * itemHeight,
    };
  }, [itemHeight, items.length, overscan, paddingBottom, paddingTop, scrollTop, viewportHeight]);

  const visibleItems = items.slice(visibleRange.startIndex, visibleRange.endIndex);

  return (
    <div
      ref={(node) => {
        containerRef.current = node;

        if (typeof forwardedRef === "function") {
          forwardedRef(node);
          return;
        }

        if (forwardedRef) {
          forwardedRef.current = node;
        }
      }}
      className={cn("app-soft-scroll app-scroll-fade app-scroll-fade-tight overflow-auto", className)}
      onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
    >
      {items.length === 0 ? (
        emptyState
      ) : (
        <div className={cn("relative", contentClassName)} style={{ height: `${visibleRange.totalHeight}px` }}>
          {visibleItems.map((item, visibleIndex) => {
            const index = visibleRange.startIndex + visibleIndex;

            return (
              <div
                key={index}
                className="absolute left-0 right-0"
                style={{
                  top: `${paddingTop + index * itemHeight}px`,
                  height: `${itemHeight}px`,
                }}
              >
                {renderItem(item, index)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const VirtualList = forwardRef(VirtualListInner) as <T>(
  props: VirtualListProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> },
) => React.ReactElement;
