import { useEffect, useRef } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface SwipeOptions {
  threshold?: number; // Minimum distance for swipe (default: 50px)
  velocityThreshold?: number; // Minimum velocity (default: 0.3)
}

export const useSwipeGesture = (
  handlers: SwipeHandlers,
  options: SwipeOptions = {}
) => {
  const { threshold = 50, velocityThreshold = 0.3 } = options;
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartRef.current.time;

      const velocityX = Math.abs(deltaX) / deltaTime;
      const velocityY = Math.abs(deltaY) / deltaTime;

      // Determine swipe direction
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (Math.abs(deltaX) > threshold && velocityX > velocityThreshold) {
          if (deltaX > 0 && handlers.onSwipeRight) {
            handlers.onSwipeRight();
          } else if (deltaX < 0 && handlers.onSwipeLeft) {
            handlers.onSwipeLeft();
          }
        }
      } else {
        // Vertical swipe
        if (Math.abs(deltaY) > threshold && velocityY > velocityThreshold) {
          if (deltaY > 0 && handlers.onSwipeDown) {
            handlers.onSwipeDown();
          } else if (deltaY < 0 && handlers.onSwipeUp) {
            handlers.onSwipeUp();
          }
        }
      }

      touchStartRef.current = null;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handlers, threshold, velocityThreshold]);
};
