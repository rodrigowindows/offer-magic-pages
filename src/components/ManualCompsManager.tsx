/**
 * Manual Comps Manager - Opção Simples
 * Permite salvar links do Trulia, Zillow, Redfin, etc.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Link,
  Plus,
  Trash2,
  ExternalLink,
  Copy,
  CheckCircle2
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface SavedCompsLink {
  id: string;
  property_address: string;
  url: string;
  source: 'trulia' | 'zillow' | 'redfin' | 'realtor' | 'other';
  notes?: string | null;
  created_at: string;
  user_id?: string;
}

export const ManualCompsManager = () => {
  const { toast } = useToast();
  const [propertyAddress, setPropertyAddress] = useState('');
  const [compsUrl, setCompsUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [savedLinks, setSavedLinks] = useState<SavedCompsLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Detectar fonte do link
  const detectSource = (url: string): SavedCompsLink['source'] => {
    if (url.includes('trulia.com')) return 'trulia';
    if (url.includes('zillow.com')) return 'zillow';
    if (url.includes('redfin.com')) return 'redfin';
    if (url.includes('realtor.com')) return 'realtor';
    return 'other';
  };

  // Salvar link
  const handleSaveLink = () => {
    if (!propertyAddress.trim()) {
      toast({
        title: '⚠️ Endereço necessário',
        description: 'Digite o endereço da propriedade',
        variant: 'destructive'
      });
      return;
    }

    if (!compsUrl.trim()) {
      toast({
        title: '⚠️ URL necessário',
        description: 'Cole o link da página de comps',
        variant: 'destructive'
      });
      return;
    }

    // Validar URL
    try {
      new URL(compsUrl);
    } catch {
      toast({
        title: '⚠️ URL inválido',
        description: 'Cole um link válido (exemplo: https://www.trulia.com/...)',
        variant: 'destructive'
      });
      return;
    }

    const newLink: SavedCompsLink = {
      id: crypto.randomUUID(),
      property_address: propertyAddress.trim(),
      url: compsUrl.trim(),
      source: detectSource(compsUrl),
      notes: notes.trim() || undefined,
      created_at: new Date()
    };

    setSavedLinks([newLink, ...savedLinks]);

    // Salvar no localStorage
    const existing = JSON.parse(localStorage.getItem('manual_comps_links') || '[]');
    localStorage.setItem('manual_comps_links', JSON.stringify([newLink, ...existing]));

    toast({
      title: '✅ Link salvo!',
      description: `Link de comps salvo para ${propertyAddress}`,
    });

    // Limpar formulário
    setPropertyAddress('');
    setCompsUrl('');
    setNotes('');
  };

  // Carregar links salvos do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('manual_comps_links');
    if (saved) {
      try {
        setSavedLinks(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading saved links:', e);
      }
    }
  }, []);

  // Deletar link
  const handleDelete = (id: string) => {
    const updated = savedLinks.filter(link => link.id !== id);
    setSavedLinks(updated);
    localStorage.setItem('manual_comps_links', JSON.stringify(updated));

    toast({
      title: '🗑️ Link removido',
      description: 'Link de comps removido',
    });
  };

  // Copiar link
  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: '📋 Copiado!',
      description: 'Link copiado para área de transferência',
    });
  };

  // Ícone da fonte
  const getSourceIcon = (source: SavedCompsLink['source']) => {
    const icons = {
      trulia: '🏡',
      zillow: '🏠',
      redfin: '🔴',
      realtor: '🏘️',
      other: '🔗'
    };
    return icons[source];
  };

  const getSourceLabel = (source: SavedCompsLink['source']) => {
    const labels = {
      trulia: 'Trulia',
      zillow: 'Zillow',
      redfin: 'Redfin',
      realtor: 'Realtor.com',
      other: 'Outro'
    };
    return labels[source];
  };

  return (
    <div className="space-y-6">
      {/* Informação */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Link className="w-5 h-5" />
            Opção Manual - Simples e Rápido
          </CardTitle>
          <CardDescription>
            Salve links de páginas de comparáveis do Trulia, Zillow, Redfin, etc.
            Sem necessidade de API keys ou configurações complexas.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Formulário para adicionar link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Adicionar Link de Comps
          </CardTitle>
          <CardDescription>
            Cole o link da página de comps do Trulia, Zillow ou outro site
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Endereço da propriedade */}
          <div className="space-y-2">
            <Label htmlFor="property-address">Endereço da Propriedade</Label>
            <Input
              id="property-address"
              placeholder="Ex: 1025 S Washington Ave, Orlando, FL"
              value={propertyAddress}
              onChange={(e) => setPropertyAddress(e.target.value)}
            />
          </div>

          {/* URL do site de comps */}
          <div className="space-y-2">
            <Label htmlFor="comps-url">Link da Página de Comps</Label>
            <Input
              id="comps-url"
              type="url"
              placeholder="Ex: https://www.trulia.com/sold/Orlando,FL/..."
              value={compsUrl}
              onChange={(e) => setCompsUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              💡 Dica: Abra Trulia/Zillow, busque vendas recentes próximas, copie a URL
            </p>
          </div>

          {/* Notas (opcional) */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas (Opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Ex: Comps do mesmo condomínio, preços de 2024..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <Button onClick={handleSaveLink} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Salvar Link
          </Button>
        </CardContent>
      </Card>

      {/* Lista de links salvos */}
      {savedLinks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Links Salvos ({savedLinks.length})
            </CardTitle>
            <CardDescription>
              Seus links de comps salvos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Propriedade</TableHead>
                  <TableHead>Fonte</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {savedLinks.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell className="font-medium">
                      {link.property_address}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{getSourceIcon(link.source)}</span>
                        <span className="text-sm">{getSourceLabel(link.source)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                      {link.notes || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(link.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(link.url, '_blank')}
                          title="Abrir link"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyLink(link.url)}
                          title="Copiar link"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(link.id)}
                          title="Remover"
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Exemplos de como usar */}
      <Card className="border-gray-200 bg-gray-50">
        <CardHeader>
          <CardTitle className="text-lg">💡 Como Usar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <strong>1. Trulia:</strong> Vá para{' '}
            <a
              href="https://www.trulia.com/sold/Orlando,FL/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              Trulia Sold Homes
            </a>
          </div>
          <div>
            <strong>2. Zillow:</strong> Vá para{' '}
            <a
              href="https://www.zillow.com/orlando-fl/sold/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              Zillow Sold
            </a>
          </div>
          <div>
            <strong>3. Redfin:</strong> Vá para{' '}
            <a
              href="https://www.redfin.com/city/13654/FL/Orlando/filter/include=sold-3mo"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              Redfin Sold
            </a>
          </div>
          <div className="pt-2 border-t">
            <strong>📍 Busque por área:</strong> Digite o endereço, filtre por vendas recentes,
            copie a URL da página e salve aqui!
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
