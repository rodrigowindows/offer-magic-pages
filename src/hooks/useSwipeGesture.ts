/**
 * Hook for touch swipe gesture detection.
 * Used in ReviewQueue for mobile approve/reject via swipe.
 */
import { useRef, useCallback, useEffect, useState } from 'react';

interface SwipeConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;    // min px to trigger
  containerRef: React.RefObject<HTMLElement>;
}

interface SwipeState {
  swiping: boolean;
  direction: 'left' | 'right' | 'up' | 'down' | null;
  deltaX: number;
  deltaY: number;
}

export const useSwipeGesture = ({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 80,
  containerRef,
}: SwipeConfig) => {
  const startX = useRef(0);
  const startY = useRef(0);
  const [swipeState, setSwipeState] = useState<SwipeState>({
    swiping: false,
    direction: null,
    deltaX: 0,
    deltaY: 0,
  });

  const handleTouchStart = useCallback((e: TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    setSwipeState({ swiping: false, direction: null, deltaX: 0, deltaY: 0 });
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Only track horizontal swipes
    if (absDx > 20 && absDx > absDy) {
      const dir = dx > 0 ? 'right' : 'left';
      setSwipeState({ swiping: true, direction: dir, deltaX: dx, deltaY: dy });
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    const { deltaX, direction } = swipeState;
    if (Math.abs(deltaX) >= threshold && direction) {
      if (direction === 'left') onSwipeLeft?.();
      if (direction === 'right') onSwipeRight?.();
      if (direction === 'up') onSwipeUp?.();
      if (direction === 'down') onSwipeDown?.();
    }
    setSwipeState({ swiping: false, direction: null, deltaX: 0, deltaY: 0 });
  }, [swipeState, threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: true });
    el.addEventListener('touchend', handleTouchEnd);
    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [containerRef, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return swipeState;
};
