
# Fix 3 TypeScript Build Errors

## Error 1: PropertyCard.tsx (line 222)
**Problem**: `onDeleteComp` prop is typed as `(compId: string) => void` but `InlineCompsList` expects `(compId: string) => Promise<void>`.

**Fix**: Change the type in `PropertyCardProps` (line 23) from `(compId: string) => void` to `(compId: string) => Promise<void>`.

## Errors 2 & 3: UltraSimpleVariant.tsx (lines 37, 44)
**Problem**: `'clicked_schedule_call'` and `'clicked_schedule_visit'` are not valid `ABEventType` values.

**Fix**: Add both event types to the `ABEventType` union in `src/utils/abTesting.ts` (around line 126).

---

**Files to edit**:
- `src/components/review/PropertyCard.tsx` — change `onDeleteComp` type to return `Promise<void>`
- `src/utils/abTesting.ts` — add `'clicked_schedule_call'` and `'clicked_schedule_visit'` to `ABEventType`

These are minimal, safe changes that won't affect any runtime behavior.
