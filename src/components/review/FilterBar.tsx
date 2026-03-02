import { Search, X } from 'lucide-react';
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
}

const STATUS_OPTIONS = [
  {
    key: 'pending' as const,
    label: 'Pendentes',
    icon: '⏳',
    active: 'bg-yellow-500 text-white border-yellow-600 shadow-md shadow-yellow-200',
    inactive: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100',
  },
  {
    key: 'approved' as const,
    label: 'Aprovados',
    icon: '✅',
    active: 'bg-green-500 text-white border-green-600 shadow-md shadow-green-200',
    inactive: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
  },
  {
    key: 'rejected' as const,
    label: 'Rejeitados',
    icon: '❌',
    active: 'bg-red-500 text-white border-red-600 shadow-md shadow-red-200',
    inactive: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
  },
] as const;

const VISUAL_CONFIG = {
  HOT: {
    icon: '🔥',
    active: 'bg-red-500 text-white border-red-600 shadow-md shadow-red-200',
    inactive: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
  },
  WARM: {
    icon: '🟡',
    active: 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-200',
    inactive: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
  },
  COLD: {
    icon: '❄️',
    active: 'bg-blue-500 text-white border-blue-600 shadow-md shadow-blue-200',
    inactive: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
  },
  LAND: {
    icon: '🏜️',
    active: 'bg-stone-500 text-white border-stone-600 shadow-md shadow-stone-200',
    inactive: 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100',
  },
} as const;

const VISUAL_ORDER = ['HOT', 'WARM', 'COLD', 'LAND'] as const;

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
}: FilterBarProps) => {
  const hasVisualData = Object.keys(visualCounts).length > 0;

  return (
    <div className="space-y-2">
      {/* Address search - always visible */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por endereço..."
          className="w-full pl-8 pr-8 py-1.5 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
          data-field="address-search"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {/* Status filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_OPTIONS.map(s => (
          <button
            key={s.key}
            onClick={() => onStatusChange(s.key)}
            className={`shrink-0 flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold border transition-all ${
              statusFilter === s.key ? s.active : s.inactive
            }`}
          >
            <span>{s.icon}</span>
            {s.label}
            <span className={`font-bold ${statusFilter === s.key ? 'bg-white/25 px-1.5 py-0.5 rounded-md' : ''}`}>
              {statusCounts[s.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Visual filter */}
      {hasVisualData && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => onVisualChange('all')}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              visualFilter === 'all'
                ? 'bg-slate-700 text-white border-slate-800 shadow-md shadow-slate-200'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Todos
            <span className={`font-bold ${visualFilter === 'all' ? 'bg-white/25 px-1.5 py-0.5 rounded-md' : ''}`}>
              {totalProperties}
            </span>
          </button>
          {VISUAL_ORDER.map(v => {
            const count = visualCounts[v] || 0;
            if (count === 0) return null;
            const config = VISUAL_CONFIG[v];
            return (
              <button
                key={v}
                onClick={() => onVisualChange(v)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  visualFilter === v ? config.active : config.inactive
                }`}
              >
                <span>{config.icon}</span>
                {v}
                <span className={`font-bold ${visualFilter === v ? 'bg-white/25 px-1.5 py-0.5 rounded-md' : ''}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
