"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type VirtualVariableListProps<T> = {
  items: T[];
  estimatedItemHeight: number;
  overscan?: number;
  paddingTop?: number;
  paddingBottom?: number;
  gap?: number;
  className?: string;
  contentClassName?: string;
  emptyState?: React.ReactNode;
  getItemKey?: (item: T, index: number) => React.Key;
  renderItem: (item: T, index: number) => React.ReactNode;
};

type MeasuredRowProps = {
  index: number;
  onHeightChange: (index: number, height: number) => void;
  children: React.ReactNode;
};

function MeasuredRow({ index, onHeightChange, children }: MeasuredRowProps) {
  const rowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = rowRef.current;

    if (!element) {
      return;
    }

    const emitHeight = () => {
      onHeightChange(index, element.getBoundingClientRect().height);
    };

    emitHeight();

    const observer = new ResizeObserver(() => {
      emitHeight();
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [index, onHeightChange]);

  return <div ref={rowRef}>{children}</div>;
}

export function VirtualVariableList<T>({
  items,
  estimatedItemHeight,
  overscan = 4,
  paddingTop = 0,
  paddingBottom = 0,
  gap = 0,
  className,
  contentClassName,
  emptyState = null,
  getItemKey,
  renderItem,
}: VirtualVariableListProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [heights, setHeights] = useState<Map<number, number>>(() => new Map());
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

  const layout = useMemo(() => {
    const offsets: number[] = new Array(items.length);
    let cursor = paddingTop;

    for (let index = 0; index < items.length; index += 1) {
      offsets[index] = cursor;
      cursor += (heights.get(index) ?? estimatedItemHeight) + gap;
    }

    return {
      offsets,
      totalHeight: cursor + paddingBottom - (items.length > 0 ? gap : 0),
    };
  }, [estimatedItemHeight, gap, heights, items.length, paddingBottom, paddingTop]);

  const visibleRange = useMemo(() => {
    if (items.length === 0) {
      return { startIndex: 0, endIndex: 0 };
    }

    const viewportStart = Math.max(0, scrollTop - overscan * estimatedItemHeight);
    const viewportEnd = scrollTop + viewportHeight + overscan * estimatedItemHeight;

    let startIndex = 0;
    while (
      startIndex < items.length - 1 &&
      layout.offsets[startIndex] + (heights.get(startIndex) ?? estimatedItemHeight) < viewportStart
    ) {
      startIndex += 1;
    }

    let endIndex = startIndex;
    while (endIndex < items.length) {
      const itemBottom = layout.offsets[endIndex] + (heights.get(endIndex) ?? estimatedItemHeight);
      if (itemBottom > viewportEnd) {
        break;
      }
      endIndex += 1;
    }

    return {
      startIndex: Math.max(0, startIndex - overscan),
      endIndex: Math.min(items.length, endIndex + overscan),
    };
  }, [estimatedItemHeight, heights, items.length, layout.offsets, overscan, scrollTop, viewportHeight]);

  const visibleItems = items.slice(visibleRange.startIndex, visibleRange.endIndex);

  const handleHeightChange = (index: number, height: number) => {
    const roundedHeight = Math.ceil(height);
    setHeights((current) => {
      if (current.get(index) === roundedHeight) {
        return current;
      }

      const next = new Map(current);
      next.set(index, roundedHeight);
      return next;
    });
  };

  return (
    <div
      ref={containerRef}
      className={cn("app-soft-scroll app-scroll-fade app-scroll-fade-tight overflow-auto", className)}
      onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
    >
      {items.length === 0 ? (
        emptyState
      ) : (
        <div className={cn("relative", contentClassName)} style={{ height: `${layout.totalHeight}px` }}>
          {visibleItems.map((item, visibleIndex) => {
            const index = visibleRange.startIndex + visibleIndex;

            return (
              <div
                key={getItemKey ? getItemKey(item, index) : index}
                className="absolute left-0 right-0"
                style={{ top: `${layout.offsets[index]}px` }}
              >
                <MeasuredRow index={index} onHeightChange={handleHeightChange}>
                  {renderItem(item, index)}
                </MeasuredRow>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
