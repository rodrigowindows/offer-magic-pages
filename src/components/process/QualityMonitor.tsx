/**
 * Quality Monitor - Monitoramento de qualidade dos dados e decisões
 * Step 7 do processo
 */

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, AlertCircle, CheckCircle, BarChart3, Copy, Merge, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface PropertyAlert {
  id: string;
  address: string;
  alerts: { message: string; severity: 'critical' | 'moderate' }[];
  approval_status: string | null;
}

interface DuplicateGroup {
  address: string;
  count: number;
  owner_name: string | null;
  ids: string[];
}

interface PropertyRow {
  id: string;
  address: string;
  city: string | null;
  zip_code: string | null;
  estimated_value: number;
  cash_offer_amount: number;
  arv: number | null;
  mao: number | null;
  square_feet: number | null;
  avg_price_per_sqft: number | null;
  approval_status: string | null;
  owner_name: string | null;
  tags: string[] | null;
  bedrooms: number | null;
  bathrooms: number | null;
  year_built: number | null;
  ai_score: number | null;
  batch_name: string | null;
}

export const QualityMonitor = () => {
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'moderate' | 'clean'>('all');

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('properties')
      .select('id, address, city, zip_code, estimated_value, cash_offer_amount, arv, mao, square_feet, avg_price_per_sqft, approval_status, owner_name, tags, bedrooms, bathrooms, year_built, ai_score, batch_name')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProperties(data as PropertyRow[]);
    }
    setLoading(false);
  };

  // Analyze each property for alerts
  const analyzedProperties = useMemo(() => {
    return properties.map(prop => {
      const alerts: { message: string; severity: 'critical' | 'moderate' }[] = [];

      // Critical: offer above ARV
      if (prop.arv && prop.cash_offer_amount > prop.arv) {
        alerts.push({ message: `Oferta ($${prop.cash_offer_amount.toLocaleString()}) acima do ARV ($${prop.arv.toLocaleString()})`, severity: 'critical' });
      }

      // Critical: offer above estimated value
      if (prop.cash_offer_amount > prop.estimated_value * 0.9) {
        alerts.push({ message: `Oferta muito próxima do valor estimado (${Math.round(prop.cash_offer_amount / prop.estimated_value * 100)}%)`, severity: 'critical' });
      }

      // Critical: suspicious price (too low or too high)
      if (prop.estimated_value < 5000) {
        alerts.push({ message: `Valor estimado suspeitamente baixo: $${prop.estimated_value.toLocaleString()}`, severity: 'critical' });
      }
      if (prop.estimated_value > 2000000) {
        alerts.push({ message: `Valor estimado muito alto: $${prop.estimated_value.toLocaleString()}`, severity: 'critical' });
      }

      // Critical: MAO higher than ARV
      if (prop.mao && prop.arv && prop.mao > prop.arv) {
        alerts.push({ message: `MAO ($${prop.mao.toLocaleString()}) maior que ARV ($${prop.arv.toLocaleString()})`, severity: 'critical' });
      }

      // Moderate: missing key data
      if (!prop.square_feet) alerts.push({ message: 'Sqft não informado', severity: 'moderate' });
      if (!prop.bedrooms) alerts.push({ message: 'Quartos não informados', severity: 'moderate' });
      if (!prop.bathrooms) alerts.push({ message: 'Banheiros não informados', severity: 'moderate' });
      if (!prop.year_built) alerts.push({ message: 'Ano construção não informado', severity: 'moderate' });
      if (!prop.owner_name) alerts.push({ message: 'Nome do dono não informado', severity: 'moderate' });

      // Moderate: no AI score
      if (prop.ai_score === null || prop.ai_score === undefined) {
        alerts.push({ message: 'Score IA não calculado', severity: 'moderate' });
      }

      // Moderate: contradictory tags
      const tags = Array.isArray(prop.tags) ? prop.tags : [];
      if (tags.includes('DNC') && prop.approval_status === 'approved') {
        alerts.push({ message: 'Aprovada com tag DNC', severity: 'critical' });
      }
      if (tags.includes('Deceased') && prop.approval_status === 'approved') {
        alerts.push({ message: 'Aprovada com tag Deceased', severity: 'critical' });
      }

      return { ...prop, alerts };
    });
  }, [properties]);

  // Stats
  const stats = useMemo(() => {
    const critical = analyzedProperties.filter(p => p.alerts.some(a => a.severity === 'critical')).length;
    const moderate = analyzedProperties.filter(p => p.alerts.length > 0 && !p.alerts.some(a => a.severity === 'critical')).length;
    const clean = analyzedProperties.filter(p => p.alerts.length === 0).length;
    const total = analyzedProperties.length;
    const qualityRate = total > 0 ? Math.round((clean / total) * 100) : 0;
    return { critical, moderate, clean, total, qualityRate };
  }, [analyzedProperties]);

  // Duplicates detection
  const duplicates = useMemo(() => {
    const addressMap = new Map<string, { count: number; owner_name: string | null; ids: string[] }>();
    properties.forEach(p => {
      const normalized = p.address.toLowerCase().trim().replace(/\s+/g, ' ');
      const existing = addressMap.get(normalized);
      if (existing) {
        existing.count++;
        existing.ids.push(p.id);
      } else {
        addressMap.set(normalized, { count: 1, owner_name: p.owner_name, ids: [p.id] });
      }
    });
    return Array.from(addressMap.entries())
      .filter(([, v]) => v.count > 1)
      .map(([address, v]) => ({ address, ...v }))
      .sort((a, b) => b.count - a.count);
  }, [properties]);

  // Zip code comparison
  const zipCodeStats = useMemo(() => {
    const zipMap = new Map<string, { totalPsf: number; count: number }>();
    properties.forEach(p => {
      if (p.zip_code && p.avg_price_per_sqft && p.avg_price_per_sqft > 0) {
        const existing = zipMap.get(p.zip_code);
        if (existing) {
          existing.totalPsf += p.avg_price_per_sqft;
          existing.count++;
        } else {
          zipMap.set(p.zip_code, { totalPsf: p.avg_price_per_sqft, count: 1 });
        }
      }
    });
    return Array.from(zipMap.entries()).map(([zip, v]) => ({
      zip,
      avgPsf: Math.round(v.totalPsf / v.count),
      count: v.count,
    })).sort((a, b) => a.zip.localeCompare(b.zip));
  }, [properties]);

  // Filtered properties with alerts
  const filteredAlerts = useMemo(() => {
    let filtered = analyzedProperties;
    if (severityFilter === 'critical') filtered = filtered.filter(p => p.alerts.some(a => a.severity === 'critical'));
    else if (severityFilter === 'moderate') filtered = filtered.filter(p => p.alerts.length > 0 && !p.alerts.some(a => a.severity === 'critical'));
    else if (severityFilter === 'clean') filtered = filtered.filter(p => p.alerts.length === 0);
    else filtered = filtered.filter(p => p.alerts.length > 0);
    return filtered.sort((a, b) => {
      const aCrit = a.alerts.filter(al => al.severity === 'critical').length;
      const bCrit = b.alerts.filter(al => al.severity === 'critical').length;
      return bCrit - aCrit || b.alerts.length - a.alerts.length;
    });
  }, [analyzedProperties, severityFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-2">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-destructive/30 bg-destructive/5 cursor-pointer" onClick={() => setSeverityFilter('critical')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-xs font-medium text-destructive">Alertas Críticos</span>
            </div>
            <p className="text-2xl font-bold text-destructive">{stats.critical}</p>
          </CardContent>
        </Card>

        <Card className="border-orange-500/30 bg-orange-50 dark:bg-orange-950/20 cursor-pointer" onClick={() => setSeverityFilter('moderate')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span className="text-xs font-medium text-orange-600">Alertas Moderados</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">{stats.moderate}</p>
          </CardContent>
        </Card>

        <Card className="border-green-500/30 bg-green-50 dark:bg-green-950/20 cursor-pointer" onClick={() => setSeverityFilter('clean')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-green-600">Sem Alertas</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.clean}</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer" onClick={() => setSeverityFilter('all')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">Taxa de Qualidade</span>
            </div>
            <p className="text-2xl font-bold text-primary">{stats.qualityRate}%</p>
            <p className="text-[10px] text-muted-foreground">{stats.clean}/{stats.total} limpos</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="alerts">Propriedades com Problemas ({filteredAlerts.length})</TabsTrigger>
          <TabsTrigger value="zipcode">$/Sqft por ZipCode ({zipCodeStats.length})</TabsTrigger>
          <TabsTrigger value="duplicates">Duplicatas ({duplicates.length})</TabsTrigger>
        </TabsList>

        {/* Tab: Properties with Alerts */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader className="py-3 px-4">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm">Propriedades com Alertas</CardTitle>
                <div className="flex gap-1 ml-auto">
                  {(['all', 'critical', 'moderate', 'clean'] as const).map(f => (
                    <Button
                      key={f}
                      type="button"
                      variant={severityFilter === f ? 'default' : 'outline'}
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      onClick={() => setSeverityFilter(f)}
                    >
                      {f === 'all' ? 'Todos' : f === 'critical' ? 'Críticos' : f === 'moderate' ? 'Moderados' : 'Limpos'}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="text-left p-2 font-medium">Endereço</th>
                      <th className="text-left p-2 font-medium">Alertas</th>
                      <th className="text-center p-2 font-medium">Severidade</th>
                      <th className="text-center p-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAlerts.slice(0, 100).map(prop => (
                      <tr key={prop.id} className="border-b hover:bg-muted/30">
                        <td className="p-2 font-medium max-w-[200px] truncate">{prop.address}</td>
                        <td className="p-2">
                          <div className="space-y-0.5">
                            {prop.alerts.map((alert, i) => (
                              <div key={i} className="flex items-center gap-1">
                                {alert.severity === 'critical'
                                  ? <AlertCircle className="h-3 w-3 text-destructive flex-shrink-0" />
                                  : <AlertTriangle className="h-3 w-3 text-orange-500 flex-shrink-0" />
                                }
                                <span className="text-[10px]">{alert.message}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="p-2 text-center">
                          {prop.alerts.some(a => a.severity === 'critical')
                            ? <Badge variant="destructive" className="text-[9px]">Crítico</Badge>
                            : <Badge className="text-[9px] bg-orange-500">Moderado</Badge>
                          }
                        </td>
                        <td className="p-2 text-center">
                          <Badge variant="outline" className="text-[9px]">
                            {prop.approval_status || 'pending'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {filteredAlerts.length === 0 && (
                      <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Nenhuma propriedade encontrada</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Zip Code Comparison */}
        <TabsContent value="zipcode">
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">Média $/Sqft por ZipCode (dados do sistema)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="text-left p-2 font-medium">ZipCode</th>
                      <th className="text-right p-2 font-medium">Média $/Sqft</th>
                      <th className="text-right p-2 font-medium">Propriedades</th>
                    </tr>
                  </thead>
                  <tbody>
                    {zipCodeStats.map(row => (
                      <tr key={row.zip} className="border-b hover:bg-muted/30">
                        <td className="p-2 font-medium">{row.zip}</td>
                        <td className="p-2 text-right">${row.avgPsf}</td>
                        <td className="p-2 text-right">{row.count}</td>
                      </tr>
                    ))}
                    {zipCodeStats.length === 0 && (
                      <tr><td colSpan={3} className="p-8 text-center text-muted-foreground">Nenhum dado de $/sqft disponível</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Duplicates */}
        <TabsContent value="duplicates">
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">Endereços Duplicados ({duplicates.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="text-left p-2 font-medium">Endereço</th>
                      <th className="text-center p-2 font-medium">Vezes</th>
                      <th className="text-left p-2 font-medium">Dono</th>
                      <th className="text-center p-2 font-medium">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {duplicates.map((dup, i) => (
                      <tr key={i} className="border-b hover:bg-muted/30">
                        <td className="p-2 font-medium max-w-[250px] truncate capitalize">{dup.address}</td>
                        <td className="p-2 text-center">
                          <Badge variant="destructive" className="text-[9px]">{dup.count}x</Badge>
                        </td>
                        <td className="p-2">{dup.owner_name || '—'}</td>
                        <td className="p-2 text-center">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-6 text-[10px] gap-1"
                            onClick={() => {
                              toast.info(`IDs: ${dup.ids.join(', ')}`, { description: 'Use o admin para mesclar manualmente' });
                            }}
                          >
                            <Eye className="h-3 w-3" /> Ver IDs
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {duplicates.length === 0 && (
                      <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">✅ Nenhuma duplicata encontrada</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
