/**
 * Visual overlay shown during swipe gestures on mobile.
 * Shows approve (green) or reject (red) indicator based on swipe direction.
 */
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface SwipeOverlayProps {
  swiping: boolean;
  direction: 'left' | 'right' | 'up' | 'down' | null;
  deltaX: number;
}

export const SwipeOverlay = ({ swiping, direction, deltaX }: SwipeOverlayProps) => {
  if (!swiping || !direction || (direction !== 'left' && direction !== 'right')) return null;

  const progress = Math.min(Math.abs(deltaX) / 80, 1);
  const isApprove = direction === 'right';

  return (
    <div
      className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center rounded-lg transition-opacity"
      style={{ opacity: progress * 0.8 }}
    >
      <div
        className={`flex flex-col items-center gap-2 p-6 rounded-2xl ${
          isApprove
            ? 'bg-green-500/20 border-2 border-green-500'
            : 'bg-red-500/20 border-2 border-red-500'
        }`}
        style={{ transform: `scale(${0.8 + progress * 0.2})` }}
      >
        {isApprove ? (
          <>
            <ThumbsUp className="h-10 w-10 text-green-600" />
            <span className="text-sm font-bold text-green-700">APROVAR</span>
          </>
        ) : (
          <>
            <ThumbsDown className="h-10 w-10 text-red-600" />
            <span className="text-sm font-bold text-red-700">REJEITAR</span>
          </>
        )}
      </div>
    </div>
  );
};
