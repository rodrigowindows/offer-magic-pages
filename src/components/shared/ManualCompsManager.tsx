/**
 * Manual Comps Manager - Refactored
 * Orchestrates sub-components: CompFormCard, CompsLinksTable, CompsSummaryCard
 * Reduced from 1505 → ~120 lines
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link, CheckCircle2 } from 'lucide-react';
import { useManualComps } from '@/hooks/useManualComps';
import { CompFormCard } from './manual-comps/CompFormCard';
import { CompsLinksTable } from './manual-comps/CompsLinksTable';
import { CompsSummaryCard } from './manual-comps/CompsSummaryCard';

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  estimated_value?: number;
  cash_offer_amount?: number;
  square_feet?: number;
}

interface ManualCompsManagerProps {
  preSelectedPropertyId?: string;
  preSelectedProperty?: Property;
  onLinkAdded?: () => void;
}

export const ManualCompsManager = ({ preSelectedPropertyId, preSelectedProperty, onLinkAdded }: ManualCompsManagerProps = {}) => {
  const mc = useManualComps(preSelectedPropertyId, preSelectedProperty, onLinkAdded);
  const filteredLinks = mc.getFilteredLinks();

  return (
    <div className="space-y-6">
      {/* Info card - only when not pre-selected */}
      {!preSelectedPropertyId && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Link className="w-5 h-5" />
              Opção Manual - Simples e Rápido
            </CardTitle>
            <CardDescription>
              Salve links de páginas de comparáveis do Trulia, Zillow, Redfin, etc.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Pre-selected property header */}
      {preSelectedPropertyId && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Adicionar Comps Manuais para esta Propriedade
            </CardTitle>
            <CardDescription>
              Cole links de comparáveis para complementar a análise automática
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-white rounded-lg border">
                <p className="text-xs text-muted-foreground mb-1">Endereço</p>
                <p className="font-semibold text-sm">{mc.form.propertyAddress || '⚠️ Loading...'}</p>
              </div>
              {mc.properties.find(p => p.id === preSelectedPropertyId)?.estimated_value && (
                <div className="p-3 bg-white rounded-lg border">
                  <p className="text-xs text-muted-foreground mb-1">Valor Estimado</p>
                  <p className="font-semibold text-green-600">
                    ${mc.properties.find(p => p.id === preSelectedPropertyId)!.estimated_value!.toLocaleString()}
                  </p>
                </div>
              )}
              {(() => {
                const prop = mc.properties.find(p => p.id === preSelectedPropertyId);
                return prop?.cash_offer_amount && prop.cash_offer_amount > 0 ? (
                  <div className="p-3 bg-white rounded-lg border">
                    <p className="text-xs text-muted-foreground mb-1">Oferta Atual</p>
                    <p className="font-semibold text-blue-600">${prop.cash_offer_amount.toLocaleString()}</p>
                  </div>
                ) : null;
              })()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      <CompFormCard
        form={mc.form}
        updateForm={mc.updateForm}
        properties={mc.properties}
        preSelectedPropertyId={preSelectedPropertyId}
        saving={mc.saving}
        loading={mc.loading}
        onPropertySelect={mc.handlePropertySelect}
        onSave={mc.handleSaveLink}
        onUpdate={mc.handleUpdateLink}
        onCancelEdit={mc.cancelEdit}
        onAutoFill={mc.handleAutoFill}
        onBulkAdd={mc.handleBulkAdd}
      />

      {/* Saved links table */}
      <CompsLinksTable
        links={filteredLinks}
        allLinks={mc.savedLinks}
        properties={mc.properties}
        loading={mc.loading}
        filterPropertyId={mc.filterPropertyId}
        onFilterChange={mc.setFilterPropertyId}
        preSelectedPropertyId={preSelectedPropertyId}
        onEdit={mc.startEdit}
        onDelete={mc.handleDelete}
        onCopy={mc.handleCopyLink}
      />

      {/* Summary & calculator */}
      {filteredLinks.length > 0 && (
        <CompsSummaryCard
          links={filteredLinks}
          properties={mc.properties}
          selectedPropertyId={mc.form.selectedPropertyId}
        />
      )}

      {/* How to use guide */}
      <Card className="border-gray-200 bg-gray-50">
        <CardHeader>
          <CardTitle className="text-lg">💡 Como Usar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div><strong>1. Trulia:</strong> <a href="https://www.trulia.com/sold/Orlando,FL/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Trulia Sold Homes</a></div>
          <div><strong>2. Zillow:</strong> <a href="https://www.zillow.com/orlando-fl/sold/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Zillow Sold</a></div>
          <div><strong>3. Redfin:</strong> <a href="https://www.redfin.com/city/13654/FL/Orlando/filter/include=sold-3mo" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Redfin Sold</a></div>
          <div className="pt-2 border-t"><strong>📍 Busque por área:</strong> Digite o endereço, filtre por vendas recentes, copie a URL e salve aqui!</div>
        </CardContent>
      </Card>
    </div>
  );
};
