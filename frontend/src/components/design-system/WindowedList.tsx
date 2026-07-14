import React, { useCallback, useState } from 'react'

interface WindowedListProps<T> {
  items: T[]
  /** Estimated row height in px — keeps the scroll range O(1) to compute. */
  estimateHeight: number
  /** Viewport height in px (must match the visible scroll container). */
  height: number
  overscan?: number
  getKey: (item: T, index: number) => string
  renderItem: (item: T, index: number) => React.ReactNode
  className?: string
  empty?: React.ReactNode
}

/**
 * Lightweight fixed-estimate windowing so scrollable ops feeds keep a bounded DOM
 * node count regardless of how many alerts/events accumulate during a long event.
 */
export function WindowedList<T>({
  items,
  estimateHeight,
  height,
  overscan = 4,
  getKey,
  renderItem,
  className,
  empty
}: WindowedListProps<T>): React.ReactElement {
  const [scrollTop, setScrollTop] = useState(0)

  const onScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop)
  }, [])

  if (items.length === 0) {
    return <div className={className}>{empty}</div>
  }

  const startIndex = Math.max(0, Math.floor(scrollTop / estimateHeight) - overscan)
  const visibleCount = Math.ceil(height / estimateHeight) + overscan * 2
  const endIndex = Math.min(items.length, startIndex + visibleCount)
  const paddingTop = startIndex * estimateHeight
  const paddingBottom = (items.length - endIndex) * estimateHeight
  const visibleItems = items.slice(startIndex, endIndex)

  // Rem units so viewport/row estimates grow with browser text size (WCAG 1.4.4).
  const heightRem = height / 16
  const estimateRem = estimateHeight / 16

  return (
    <div
      className={className}
      style={{ height: `${heightRem}rem`, overflowY: 'auto' }}
      onScroll={onScroll}
    >
      <div style={{ paddingTop: `${paddingTop / 16}rem`, paddingBottom: `${paddingBottom / 16}rem` }}>
        {visibleItems.map((item, offset) => {
          const index = startIndex + offset
          return (
            <div key={getKey(item, index)} style={{ minHeight: `${estimateRem}rem` }}>
              {renderItem(item, index)}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default WindowedList
