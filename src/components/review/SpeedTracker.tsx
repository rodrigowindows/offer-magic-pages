import { useState, useEffect, useMemo, useRef } from 'react';
import { Timer, Trophy, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { DailyStats } from './types';

interface SpeedTrackerProps {
  dailyStats: DailyStats | null;
  dailyGoal?: number;
}

const GOAL_STORAGE_KEY = 'review-daily-goal';

export const SpeedTracker = ({ dailyStats, dailyGoal: defaultGoal = 50 }: SpeedTrackerProps) => {
  const [goal, setGoal] = useState(() => {
    try {
      const saved = localStorage.getItem(GOAL_STORAGE_KEY);
      return saved ? parseInt(saved) : defaultGoal;
    } catch { return defaultGoal; }
  });
  const [sessionStart] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    intervalRef.current = setInterval(() => setElapsed(Date.now() - sessionStart), 1000);
    return () => clearInterval(intervalRef.current);
  }, [sessionStart]);

  const reviewed = dailyStats?.reviewed_today || 0;
  const progressPct = Math.min((reviewed / goal) * 100, 100);
  const avgSeconds = reviewed > 0 ? Math.round(elapsed / 1000 / reviewed) : 0;

  const handleGoalClick = () => {
    const newGoal = prompt('Meta diária de revisões:', String(goal));
    if (newGoal && !isNaN(parseInt(newGoal))) {
      const g = parseInt(newGoal);
      setGoal(g);
      localStorage.setItem(GOAL_STORAGE_KEY, String(g));
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Speed */}
      {reviewed > 0 && (
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Timer className="h-2.5 w-2.5" />
          <span className="font-mono font-bold">{avgSeconds}s</span>
          <span>/rev</span>
        </div>
      )}

      {/* Daily goal progress */}
      <button onClick={handleGoalClick} className="flex items-center gap-1 text-[10px] group" title="Clique para alterar meta">
        {progressPct >= 100 ? (
          <Trophy className="h-3 w-3 text-amber-500" />
        ) : (
          <Zap className="h-2.5 w-2.5 text-primary" />
        )}
        <div className="w-16 h-1.5">
          <Progress value={progressPct} className="h-1.5" />
        </div>
        <span className={`font-bold ${progressPct >= 100 ? 'text-amber-600' : 'text-foreground'}`}>
          {reviewed}/{goal}
        </span>
      </button>
    </div>
  );
};
