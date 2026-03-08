/**
 * CompsLinksTable - Table of saved comp links with actions
 * Extracted from ManualCompsManager
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Loader2, ExternalLink, Copy, Pencil, Trash2, Filter, CheckCircle2 } from 'lucide-react';
import type { SavedCompsLink, CompsProperty } from '@/hooks/useManualComps';

const SOURCE_ICONS: Record<string, string> = { trulia: '🏡', zillow: '🏠', redfin: '🔴', realtor: '🏘️', other: '🔗' };
const SOURCE_LABELS: Record<string, string> = { trulia: 'Trulia', zillow: 'Zillow', redfin: 'Redfin', realtor: 'Realtor.com', other: 'Outro' };

interface CompsLinksTableProps {
  links: SavedCompsLink[];
  allLinks: SavedCompsLink[];
  properties: CompsProperty[];
  loading: boolean;
  filterPropertyId: string;
  onFilterChange: (id: string) => void;
  preSelectedPropertyId?: string;
  onEdit: (link: SavedCompsLink) => void;
  onDelete: (id: string) => void;
  onCopy: (url: string) => void;
}

export const CompsLinksTable = ({
  links, allLinks, properties, loading,
  filterPropertyId, onFilterChange, preSelectedPropertyId,
  onEdit, onDelete, onCopy,
}: CompsLinksTableProps) => {
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (allLinks.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Links Salvos ({links.length}{filterPropertyId !== 'all' && ` de ${allLinks.length}`})
            </CardTitle>
            <CardDescription>Seus links de comps salvos</CardDescription>
          </div>
          {!preSelectedPropertyId && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={filterPropertyId} onValueChange={onFilterChange}>
                <SelectTrigger className="w-[250px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Propriedades</SelectItem>
                  {properties.filter(p => allLinks.some(l => l.property_id === p.id)).map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.address}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Propriedade</TableHead>
              <TableHead>Fonte</TableHead>
              <TableHead className="text-right">Preço</TableHead>
              <TableHead className="text-right">Sqft</TableHead>
              <TableHead className="text-right">$/Sqft</TableHead>
              <TableHead>Notas</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {links.map(link => {
              const price = link.comp_data?.sale_price;
              const sqft = link.comp_data?.square_feet;
              const pps = price && sqft ? price / sqft : null;

              return (
                <TableRow key={link.id}>
                  <TableCell className="font-medium">{link.property_address}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{SOURCE_ICONS[link.source] || '🔗'}</span>
                      <span className="text-sm">{SOURCE_LABELS[link.source] || link.source}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-green-700 dark:text-green-400">{price ? `$${price.toLocaleString()}` : '-'}</TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">{sqft ? sqft.toLocaleString() : '-'}</TableCell>
                  <TableCell className="text-right font-semibold text-blue-700 dark:text-blue-400">{pps ? `$${Math.round(pps)}` : '-'}</TableCell>
                  <TableCell className="max-w-[150px] truncate text-sm text-muted-foreground">{link.notes || '-'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(link.created_at).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => window.open(link.url, '_blank')}><ExternalLink className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => onCopy(link.url)}><Copy className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => onEdit(link)} className="text-blue-500 hover:text-blue-700"><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => onDelete(link.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
