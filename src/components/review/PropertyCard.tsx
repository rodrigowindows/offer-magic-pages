import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Settings2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { PropertyImageDisplay } from '../PropertyImageDisplay';
import type { QueueProperty } from './types';
import { DETAIL_FIELDS, CATEGORY_LABELS, TAG_COLORS } from './constants';
import { parseTags, hasRealValue, getPreDenialSuggestions, computeFillRates, saveVisibleFields, loadVisibleFields } from './helpers';

interface PropertyCardProps {
  property: QueueProperty;
  allProperties: QueueProperty[];
}

export const PropertyCard = ({ property, allProperties }: PropertyCardProps) => {
  const [detailsExpanded, setDetailsExpanded] = useState(true);
  const [showFieldSettings, setShowFieldSettings] = useState(false);
  const [visibleFields, setVisibleFields] = useState<Set<string>>(loadVisibleFields);

  const fillRates = useMemo(() => computeFillRates(allProperties), [allProperties]);
  const tagList = parseTags(property.tags);
  const suggestions = getPreDenialSuggestions(property);

  const toggleField = (key: string) => {
    setVisibleFields(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      saveVisibleFields(next);
      return next;
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Property Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Image */}
        <div>
          <PropertyImageDisplay
            imageUrl={property.property_image_url}
            address={property.address}
          />
        </div>

        {/* Info */}
        <div className="space-y-3 sm:space-y-4">
          {/* Address + Location */}
          <div>
            <h3 className="text-lg sm:text-2xl font-bold mb-1 line-clamp-2">{property.address}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {[property.city, property.state, property.zip_code].filter(Boolean).join(', ')}
            </p>
          </div>

          {/* Tags badges */}
          {tagList.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tagList.map(tag => (
                <Badge
                  key={tag}
                  variant="outline"
                  className={`text-[10px] sm:text-xs font-semibold ${TAG_COLORS[tag] || 'bg-gray-50 text-gray-600 border-gray-300'}`}
                >
                  {tag.replace(/^\d+-/, '').replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          )}

          {/* Pre-denial warnings */}
          {suggestions.length > 0 && (
            <div className="p-2 sm:p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs font-semibold text-amber-800 mb-1">PRE-NEGACAO SUGERIDA:</p>
              <div className="flex flex-wrap gap-1">
                {suggestions.map(s => (
                  <Badge key={s.reason} variant="outline" className="text-[10px] sm:text-xs border-amber-400 text-amber-700 bg-amber-100">
                    {s.label}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* External Links */}
          <div className="flex flex-wrap gap-1.5">
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(property.address)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold hover:bg-blue-100 transition-colors">
              <MapPin className="w-3 h-3" />Maps
            </a>
            <a href={property.zillow_url || `https://www.zillow.com/homes/${encodeURIComponent(property.address)}_rb/`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-semibold hover:bg-blue-100 transition-colors">
              <span className="font-bold">Z</span>Zillow{property.zillow_url && <ExternalLink className="w-2.5 h-2.5" />}
            </a>
            <a href={`https://www.trulia.com/homes/${encodeURIComponent(property.address)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold hover:bg-green-100 transition-colors">
              <span className="font-bold">T</span>Trulia
            </a>
            <a href={`https://www.redfin.com/search#query=${encodeURIComponent(property.address)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 rounded-full text-xs font-semibold hover:bg-red-100 transition-colors">
              <span className="font-bold">R</span>Redfin
            </a>
            <a href={`https://www.realtor.com/realestateandhomes-search/${encodeURIComponent(property.address.replace(/\s+/g, '-'))}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-orange-600 rounded-full text-xs font-semibold hover:bg-orange-100 transition-colors">
              <span className="font-bold">Re</span>Realtor
            </a>
          </div>

          {/* Keyboard hints */}
          <div className="hidden sm:flex items-center gap-3 text-[11px] text-muted-foreground">
            <span><kbd className="px-1.5 py-0.5 bg-muted border rounded text-[10px]">A</kbd> Aprovar</span>
            <span><kbd className="px-1.5 py-0.5 bg-muted border rounded text-[10px]">R</kbd> Rejeitar</span>
            <span><kbd className="px-1.5 py-0.5 bg-muted border rounded text-[10px]">&rarr;</kbd><kbd className="px-1.5 py-0.5 bg-muted border rounded text-[10px]">&larr;</kbd> Nav</span>
          </div>
        </div>
      </div>

      {/* Property Details - configurable with fill rates */}
      <div className="border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between bg-muted/50 px-3 py-2 border-b">
          <button
            onClick={() => setDetailsExpanded(!detailsExpanded)}
            className="flex items-center gap-2 text-sm font-semibold hover:text-primary transition-colors"
          >
            {detailsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            Detalhes
            <Badge variant="secondary" className="text-[10px]">{visibleFields.size} campos</Badge>
          </button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs text-muted-foreground"
            onClick={() => setShowFieldSettings(!showFieldSettings)}
          >
            <Settings2 className="h-3.5 w-3.5" />
            Colunas
          </Button>
        </div>

        {/* Field Settings Panel */}
        {showFieldSettings && (
          <div className="bg-muted/20 border-b px-3 py-3 space-y-3">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              Dados disponíveis neste batch ({allProperties.length} imóveis)
            </p>
            {(['decisao', 'financeiro', 'imovel', 'dono'] as const).map(category => {
              const fields = DETAIL_FIELDS.filter(f => f.category === category);
              return (
                <div key={category}>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5">{CATEGORY_LABELS[category]}</p>
                  <div className="space-y-1">
                    {fields.map(field => {
                      const pct = fillRates.get(field.key) ?? 0;
                      const isVisible = visibleFields.has(field.key);
                      const barColor = pct >= 80 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : pct > 0 ? 'bg-red-400' : 'bg-gray-300';
                      return (
                        <button
                          key={field.key}
                          onClick={() => toggleField(field.key)}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] border transition-all ${
                            isVisible
                              ? 'bg-primary/5 border-primary/30 text-foreground'
                              : 'bg-background border-border/50 text-muted-foreground hover:bg-accent/50'
                          }`}
                        >
                          {isVisible ? <Eye className="h-3 w-3 text-primary shrink-0" /> : <EyeOff className="h-3 w-3 shrink-0" />}
                          <span className="w-20 text-left truncate font-medium">{field.label}</span>
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className={`w-8 text-right text-[10px] font-bold ${pct >= 80 ? 'text-emerald-600' : pct >= 40 ? 'text-amber-600' : pct > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                            {pct}%
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            <p className="text-[10px] text-muted-foreground text-center pt-1">
              Clique para mostrar/ocultar. Barra = % de dados disponíveis no batch.
            </p>
          </div>
        )}

        {/* Detail Values */}
        {detailsExpanded && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
            {DETAIL_FIELDS.filter(f => visibleFields.has(f.key)).map(field => {
              const formatted = field.format(property);
              const realValue = hasRealValue(formatted);
              const isHighlight = realValue && (field.highlight?.(property) ?? false);
              return (
                <div key={field.key} className={`px-3 py-2 border-t border-r ${isHighlight ? 'bg-emerald-50' : ''}`}>
                  <p className="text-[10px] text-muted-foreground">{field.label}</p>
                  <p className={`text-xs font-semibold truncate ${realValue ? (isHighlight ? 'text-emerald-700' : '') : 'text-muted-foreground/40'}`}>
                    {realValue ? formatted : '—'}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
