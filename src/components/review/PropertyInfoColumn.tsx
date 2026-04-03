import { Badge } from '@/components/ui/badge';
import type { QueueProperty } from './types';
import { TAG_COLORS } from './constants';
import { parseTags, getPreDenialSuggestions } from './helpers';
import { PropertyStatusBanner } from './PropertyStatusBanner';

interface PropertyInfoColumnProps {
  property: QueueProperty;
  /** When true, hides the address block (rendered separately in parent) */
  hideAddress?: boolean;
  /** When true, hides owner name (rendered separately in parent) */
  hideOwner?: boolean;
  /** Compact alert display - single line */
  compactAlerts?: boolean;
  /** Only show tags, nothing else */
  showTagsOnly?: boolean;
}

export const PropertyInfoColumn = ({ property, hideAddress, hideOwner, compactAlerts, showTagsOnly }: PropertyInfoColumnProps) => {
  const tagList = parseTags(property.tags);

  // Hide action tags on rejected properties
  const filteredTags =
    property.approval_status === 'rejected'
      ? tagList.filter(tag => !['HOT', '1-CALL_NOW', '2-CALL_SOON'].includes(tag))
      : tagList;

  const suggestions = getPreDenialSuggestions(property);

  if (showTagsOnly) {
    return filteredTags.length > 0 ? (
      <div className="flex flex-wrap gap-1">
        {filteredTags.map(tag => (
          <Badge
            key={tag}
            variant="outline"
            className={`text-[10px] font-semibold ${TAG_COLORS[tag] || 'bg-gray-50 text-gray-600 border-gray-300'}`}
          >
            {tag.replace(/^\d+-/, '').replace(/_/g, ' ')}
          </Badge>
        ))}
      </div>
    ) : null;
  }

  return (
    <div className="flex flex-col gap-1 min-w-0">
      {/* Address - only show when not hidden */}
      {!hideAddress && (
        <div>
          <h3 className="text-base sm:text-lg font-extrabold leading-tight line-clamp-2" data-field="address">
            {property.address}
          </h3>
          <p className="text-sm text-muted-foreground font-medium">
            {[property.city, property.state, property.zip_code].filter(Boolean).join(', ')}
          </p>
          {property.neighborhood && (
            <p className="text-xs text-muted-foreground italic">{property.neighborhood}</p>
          )}
        </div>
      )}

      {/* Owner + Tags in a compact row */}
      {!hideOwner && (
        <div className="flex items-center gap-3 flex-wrap">
          {property.owner_name && (
            <p className="text-sm text-muted-foreground" data-field="owner-name">
              <span className="font-semibold">Dono:</span> {property.owner_name}
            </p>
          )}
          {property.owner_phone && (
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold">Tel:</span> {property.owner_phone}
            </p>
          )}
        </div>
      )}

      {/* Tags inline */}
      {filteredTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {filteredTags.map(tag => (
            <Badge
              key={tag}
              variant="outline"
              className={`text-[10px] font-semibold ${TAG_COLORS[tag] || 'bg-gray-50 text-gray-600 border-gray-300'}`}
            >
              {tag.replace(/^\d+-/, '').replace(/_/g, ' ')}
            </Badge>
          ))}
        </div>
      )}

      {/* Pre-denial warnings */}
      {suggestions.length > 0 && (
        <div className={compactAlerts ? 'flex flex-wrap gap-0.5 items-center' : 'p-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg'}>
          {!compactAlerts && <span className="text-[10px] font-bold text-amber-800">ALERTA:</span>}
          {suggestions.map(s => (
            <Badge key={s.reason} variant="outline" className={`text-[9px] border-amber-400 text-amber-700 bg-amber-100 ${compactAlerts ? 'px-1 py-0' : ''}`}>
              {compactAlerts ? '⚠' : ''} {s.label}
            </Badge>
          ))}
        </div>
      )}

      {/* Status banner */}
      <PropertyStatusBanner
        approvalStatus={property.approval_status}
        approvedByName={property.approved_by_name}
        approvedAt={property.approved_at}
        rejectionReason={property.rejection_reason}
        rejectionNotes={property.rejection_notes}
      />
    </div>
  );
};
