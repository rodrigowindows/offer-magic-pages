import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { PROCESS_STEPS } from './processSteps';

interface StepperNavProps {
  currentIndex: number;
  compact?: boolean;
}

export const StepperNav = ({ currentIndex, compact = false }: StepperNavProps) => {
  return (
    <nav className={cn('flex items-center', compact ? 'gap-0.5' : 'justify-center')}>
      {PROCESS_STEPS.map((step, index) => {
        const Icon = step.icon;
        const isCurrent = index === currentIndex;
        const isPast = index < currentIndex;

        return (
          <div key={step.number} className="flex items-center shrink-0">
            {index > 0 && (
              <div
                className={cn(
                  'h-0.5',
                  compact ? 'w-3 mx-0.5' : 'w-10 mx-1',
                  index <= currentIndex ? 'bg-primary' : 'bg-border',
                )}
              />
            )}
            <Link
              to={step.fullPath}
              className={cn(
                'flex items-center font-medium transition-colors whitespace-nowrap',
                compact
                  ? 'gap-1 rounded-md px-2 py-1 text-xs'
                  : 'gap-2 rounded-lg px-3 py-2 text-sm',
                isCurrent
                  ? compact
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-primary text-primary-foreground shadow-sm'
                  : isPast
                  ? compact
                    ? 'text-primary/70'
                    : 'text-primary/70 hover:bg-accent hover:text-accent-foreground'
                  : compact
                  ? 'text-muted-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              {compact ? (
                <>
                  <Icon className="h-3 w-3" />
                  <span>{step.title}</span>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1">
                    <Icon className="h-4 w-4" />
                    <span className="font-semibold">{step.number}</span>
                  </div>
                  <span>{step.title}</span>
                </>
              )}
            </Link>
          </div>
        );
      })}
    </nav>
  );
};
