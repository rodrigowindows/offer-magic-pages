import type { StatusFilter, StatusCounts } from './types';
import { VISUAL_COLORS } from './constants';

interface FilterBarProps {
  statusFilter: StatusFilter;
  onStatusChange: (status: StatusFilter) => void;
  statusCounts: StatusCounts;
  visualFilter: string;
  onVisualChange: (visual: string) => void;
  visualCounts: Record<string, number>;
  totalProperties: number;
}

const STATUS_OPTIONS = [
  { key: 'pending' as const, label: 'Pendentes', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { key: 'approved' as const, label: 'Aprovados', color: 'bg-green-100 text-green-800 border-green-300' },
  { key: 'rejected' as const, label: 'Rejeitados', color: 'bg-red-100 text-red-800 border-red-300' },
] as const;

const VISUAL_ORDER = ['HOT', 'WARM', 'COLD', 'LAND'] as const;

export const FilterBar = ({
  statusFilter,
  onStatusChange,
  statusCounts,
  visualFilter,
  onVisualChange,
  visualCounts,
  totalProperties,
}: FilterBarProps) => {
  const hasVisualData = Object.keys(visualCounts).length > 0;

  return (
    <div className="space-y-2">
      {/* Status filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {STATUS_OPTIONS.map(s => (
          <button
            key={s.key}
            onClick={() => onStatusChange(s.key)}
            className={`shrink-0 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium border transition-colors ${
              statusFilter === s.key
                ? s.color + ' ring-2 ring-offset-1 ring-current'
                : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'
            }`}
          >
            {s.label} <span className="font-bold">{statusCounts[s.key]}</span>
          </button>
        ))}
      </div>

      {/* Visual filter */}
      {hasVisualData && (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => onVisualChange('all')}
            className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
              visualFilter === 'all'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'
            }`}
          >
            Todos {totalProperties}
          </button>
          {VISUAL_ORDER.map(v => {
            const count = visualCounts[v] || 0;
            if (count === 0) return null;
            const colors = VISUAL_COLORS[v];
            return (
              <button
                key={v}
                onClick={() => onVisualChange(v)}
                className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                  visualFilter === v
                    ? `${colors.bg} ${colors.text} ${colors.border} ring-2 ring-offset-1 ring-current`
                    : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'
                }`}
              >
                {v} <span className="font-bold">{count}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
