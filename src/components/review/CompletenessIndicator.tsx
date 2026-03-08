import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getCompletenessScore, getCompletenessColor } from '@/lib/completeness';
import type { QueueProperty } from './types';

interface Props {
  property: QueueProperty;
}

export const CompletenessIndicator = ({ property }: Props) => {
  const result = useMemo(() => getCompletenessScore(property), [property]);
  const colorClass = getCompletenessColor(result.score);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`text-[10px] font-mono cursor-help ${colorClass} border-current/30`}>
            {result.score}%
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="font-bold text-xs mb-1">Completude: {result.filled}/{result.total} campos</p>
          {result.missing.length > 0 && (
            <p className="text-[10px] text-muted-foreground">
              Faltando: {result.missing.join(', ')}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
