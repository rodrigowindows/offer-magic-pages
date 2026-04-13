import { Search, X, PhoneCall } from 'lucide-react';
import type { StatusFilter, StatusCounts } from './types';

interface FilterBarProps {
  statusFilter: StatusFilter;
  onStatusChange: (status: StatusFilter) => void;
  statusCounts: StatusCounts;
  visualFilter: string;
  onVisualChange: (visual: string) => void;
  visualCounts: Record<string, number>;
  totalProperties: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  smartFilter?: string;
  onSmartFilterChange?: (filter: string) => void;
  readyToContactCount?: number;
  conditionFilter?: string;
  onConditionChange?: (condition: string) => void;
  conditionCounts?: Record<string, number>;
}

const STATUS_OPTIONS = [
  { key: 'pending' as const, label: 'Pend', icon: '⏳', color: 'yellow' },
  { key: 'approved' as const, label: 'Aprov', icon: '✅', color: 'green' },
  { key: 'rejected' as const, label: 'Rej', icon: '❌', color: 'red' },
] as const;

const VISUAL_CONFIG: Record<string, { icon: string; color: string }> = {
  HOT: { icon: '🔥', color: 'red' },
  WARM: { icon: '🟡', color: 'amber' },
  COLD: { icon: '❄️', color: 'blue' },
  LAND: { icon: '🏜️', color: 'stone' },
};

const VISUAL_ORDER = ['HOT', 'WARM', 'COLD', 'LAND'] as const;

const CONDITION_ORDER = ['SEVERE', 'POOR', 'FAIR', 'GOOD', 'EXCELLENT'] as const;

const CONDITION_CONFIG: Record<string, { icon: string; activeClass: string }> = {
  SEVERE:    { icon: '🔴', activeClass: 'bg-red-600 text-white border-red-600' },
  POOR:      { icon: '🟠', activeClass: 'bg-orange-500 text-white border-orange-500' },
  FAIR:      { icon: '🟡', activeClass: 'bg-amber-500 text-white border-amber-500' },
  GOOD:      { icon: '🟢', activeClass: 'bg-green-600 text-white border-green-600' },
  EXCELLENT: { icon: '✨', activeClass: 'bg-emerald-600 text-white border-emerald-600' },
};

export const FilterBar = ({
  statusFilter,
  onStatusChange,
  statusCounts,
  visualFilter,
  onVisualChange,
  visualCounts,
  totalProperties,
  searchQuery,
  onSearchChange,
  smartFilter = 'none',
  onSmartFilterChange,
  readyToContactCount = 0,
  conditionFilter = 'all',
  onConditionChange,
  conditionCounts = {},
}: FilterBarProps) => {
  const hasVisualData = Object.keys(visualCounts).length > 0;
  const hasConditionData = Object.keys(conditionCounts).length > 0;

  return (
    <div className="space-y-1">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar endereço..."
          aria-label="Buscar endereço"
          className="w-full pl-7 pr-7 py-1 text-xs border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary/50"
          data-field="address-search"
        />
        {searchQuery && (
          <button type="button" onClick={() => onSearchChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Limpar busca">
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Status + Visual filters - all in one row */}
      <div className="flex items-center gap-1 overflow-x-auto">
        {/* Status tabs */}
        {STATUS_OPTIONS.map(s => (
          <button
            key={s.key}
            onClick={() => onStatusChange(s.key)}
            className={`shrink-0 flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border transition-all ${
              statusFilter === s.key
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'
            }`}
          >
            <span className="text-[10px]">{s.icon}</span>
            {s.label}
            <span className="font-bold text-[10px] opacity-80">{statusCounts[s.key]}</span>
          </button>
        ))}

        {/* Smart filter: Ready to Contact */}
        {onSmartFilterChange && (
          <>
            <div className="w-px h-4 bg-border shrink-0 mx-0.5" />
            <button
              onClick={() => onSmartFilterChange(smartFilter === 'ready' ? 'none' : 'ready')}
              className={`shrink-0 flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border transition-all ${
                smartFilter === 'ready'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'
              }`}
            >
              <PhoneCall className="h-2.5 w-2.5" />
              Ready
              <span className="font-bold text-[10px] opacity-80">{readyToContactCount}</span>
            </button>
          </>
        )}

        {/* Divider */}
        {hasVisualData && <div className="w-px h-4 bg-border shrink-0 mx-0.5" />}

        {/* Visual filters */}
        {hasVisualData && (
          <>
            <button
              onClick={() => onVisualChange('all')}
              className={`shrink-0 flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border transition-all ${
                visualFilter === 'all'
                  ? 'bg-slate-700 text-white border-slate-700'
                  : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'
              }`}
            >
              All
              <span className="font-bold text-[10px] opacity-80">{totalProperties}</span>
            </button>
            {VISUAL_ORDER.map(v => {
              const count = visualCounts[v] || 0;
              if (count === 0) return null;
              const config = VISUAL_CONFIG[v];
              return (
                <button
                  key={v}
                  onClick={() => onVisualChange(v)}
                  className={`shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-semibold border transition-all ${
                    visualFilter === v
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'
                  }`}
                >
                  <span className="text-[10px]">{config.icon}</span>
                  <span className="font-bold text-[10px]">{count}</span>
                </button>
              );
            })}
          </>
        )}
      </div>

      {/* Condition filter row - only shown when Miami condition data exists */}
      {hasConditionData && onConditionChange && (
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => onConditionChange('all')}
            className={`shrink-0 flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border transition-all ${
              conditionFilter === 'all'
                ? 'bg-slate-700 text-white border-slate-700'
                : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'
            }`}
          >
            Cond
            <span className="font-bold text-[10px] opacity-80">{Object.values(conditionCounts).reduce((s, n) => s + n, 0)}</span>
          </button>
          {CONDITION_ORDER.map(c => {
            const count = conditionCounts[c] || 0;
            if (count === 0) return null;
            const config = CONDITION_CONFIG[c];
            return (
              <button
                key={c}
                onClick={() => onConditionChange(c)}
                className={`shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-semibold border transition-all ${
                  conditionFilter === c
                    ? config.activeClass + ' shadow-sm'
                    : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'
                }`}
              >
                <span className="text-[10px]">{config.icon}</span>
                <span className="font-bold text-[10px]">{count}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
