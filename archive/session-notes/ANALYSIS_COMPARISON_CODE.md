# Comparação de Análises - Feature Completa

## 1. Adicionar Estados (no topo do componente, perto de linha 327)

```tsx
const [compareMode, setCompareMode] = useState(false);
const [selectedAnalysesForCompare, setSelectedAnalysesForCompare] = useState<string[]>([]);
```

## 2. Função de Comparação (adicionar perto de linha 415)

```tsx
const compareAnalyses = () => {
  if (selectedAnalysesForCompare.length !== 2) {
    toast({
      title: '⚠️ Selecione 2 Análises',
      description: 'Você precisa selecionar exatamente 2 análises para comparar',
      variant: 'destructive',
    });
    return;
  }

  const [analysis1Id, analysis2Id] = selectedAnalysesForCompare;
  const analysis1 = analysisHistory.find(a => a.id === analysis1Id);
  const analysis2 = analysisHistory.find(a => a.id === analysis2Id);

  if (!analysis1 || !analysis2) return;

  // Abrir dialog de comparação
  setShowComparisonDialog(true);
};

const [showComparisonDialog, setShowComparisonDialog] = useState(false);
```

## 3. Dialog de Comparação (adicionar antes do fechamento do component)

```tsx
      {/* Analysis Comparison Dialog */}
      <Dialog open={showComparisonDialog} onOpenChange={setShowComparisonDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Comparação de Análises</DialogTitle>
            <DialogDescription>
              Compare duas análises lado a lado para ver mudanças ao longo do tempo
            </DialogDescription>
          </DialogHeader>

          {selectedAnalysesForCompare.length === 2 && (() => {
            const analysis1 = analysisHistory.find(a => a.id === selectedAnalysesForCompare[0]);
            const analysis2 = analysisHistory.find(a => a.id === selectedAnalysesForCompare[1]);

            if (!analysis1 || !analysis2) return null;

            const data1 = typeof analysis1.analysis_data === 'string'
              ? JSON.parse(analysis1.analysis_data)
              : analysis1.analysis_data;
            const data2 = typeof analysis2.analysis_data === 'string'
              ? JSON.parse(analysis2.analysis_data)
              : analysis2.analysis_data;

            const comps1 = data1?.comps || [];
            const comps2 = data2?.comps || [];

            return (
              <div className="space-y-6">
                {/* Header Comparison */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Analysis 1 */}
                  <Card>
                    <CardHeader className="bg-blue-50">
                      <CardTitle className="text-lg">
                        Análise 1
                      </CardTitle>
                      <CardDescription>
                        {format(new Date(analysis1.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Valor Sugerido</p>
                          <p className="text-2xl font-bold text-blue-600">
                            ${analysis1.suggested_value_min?.toLocaleString()} - ${analysis1.suggested_value_max?.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Preço Médio</p>
                          <p className="text-lg font-semibold">
                            ${data1.avgSalePrice?.toLocaleString() || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Comparáveis</p>
                          <p className="text-lg font-semibold">{comps1.length}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Fonte de Dados</p>
                          <Badge>{analysis1.data_source}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Analysis 2 */}
                  <Card>
                    <CardHeader className="bg-green-50">
                      <CardTitle className="text-lg">
                        Análise 2
                      </CardTitle>
                      <CardDescription>
                        {format(new Date(analysis2.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Valor Sugerido</p>
                          <p className="text-2xl font-bold text-green-600">
                            ${analysis2.suggested_value_min?.toLocaleString()} - ${analysis2.suggested_value_max?.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Preço Médio</p>
                          <p className="text-lg font-semibold">
                            ${data2.avgSalePrice?.toLocaleString() || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Comparáveis</p>
                          <p className="text-lg font-semibold">{comps2.length}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Fonte de Dados</p>
                          <Badge>{analysis2.data_source}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Differences Summary */}
                <Card className="bg-yellow-50 border-yellow-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Mudanças Detectadas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Mudança no Valor Médio</p>
                        <p className={`text-xl font-bold ${
                          (data2.avgSalePrice || 0) > (data1.avgSalePrice || 0)
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                          {((data2.avgSalePrice || 0) > (data1.avgSalePrice || 0) ? '+' : '')}
                          ${Math.abs((data2.avgSalePrice || 0) - (data1.avgSalePrice || 0)).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(((data2.avgSalePrice || 0) - (data1.avgSalePrice || 0)) / (data1.avgSalePrice || 1) * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Diferença em Comps</p>
                        <p className={`text-xl font-bold ${
                          comps2.length > comps1.length ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {comps2.length > comps1.length ? '+' : ''}{comps2.length - comps1.length}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Tempo Decorrido</p>
                        <p className="text-xl font-bold text-blue-600">
                          {Math.abs(Math.floor((new Date(analysis2.created_at).getTime() - new Date(analysis1.created_at).getTime()) / (1000 * 60 * 60 * 24)))} dias
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Notes Comparison */}
                {(analysis1.notes || analysis2.notes) && (
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2">Notas da Análise 1</h4>
                      <p className="text-sm text-muted-foreground p-3 bg-gray-50 rounded">
                        {analysis1.notes || 'Sem notas'}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Notas da Análise 2</h4>
                      <p className="text-sm text-muted-foreground p-3 bg-gray-50 rounded">
                        {analysis2.notes || 'Sem notas'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
```

## 4. Modificar o Card de Histórico de Análises

No card de histórico (perto de linha 1456), adicionar botões de seleção e comparação:

```tsx
{/* No cabeçalho do card de histórico */}
<div className="flex items-center gap-2">
  {analysisHistory.length >= 2 && (
    <Button
      size="sm"
      variant={compareMode ? "default" : "outline"}
      onClick={() => {
        setCompareMode(!compareMode);
        setSelectedAnalysesForCompare([]);
      }}
    >
      {compareMode ? 'Cancelar' : 'Comparar'}
    </Button>
  )}
  {compareMode && selectedAnalysesForCompare.length === 2 && (
    <Button
      size="sm"
      className="bg-green-600 hover:bg-green-700"
      onClick={compareAnalyses}
    >
      <ArrowUpDown className="w-4 h-4 mr-2" />
      Ver Comparação
    </Button>
  )}
</div>

{/* Em cada item da lista de histórico, adicionar checkbox */}
{compareMode && (
  <input
    type="checkbox"
    checked={selectedAnalysesForCompare.includes(item.id)}
    onChange={(e) => {
      if (e.target.checked) {
        if (selectedAnalysesForCompare.length < 2) {
          setSelectedAnalysesForCompare([...selectedAnalysesForCompare, item.id]);
        }
      } else {
        setSelectedAnalysesForCompare(selectedAnalysesForCompare.filter(id => id !== item.id));
      }
    }}
    className="w-4 h-4"
  />
)}
```

## Pronto!
Agora você terá um botão "Comparar" no histórico, que permite selecionar 2 análises e ver uma comparação detalhada lado a lado.
