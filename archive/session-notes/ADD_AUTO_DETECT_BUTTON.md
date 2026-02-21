# Adicionar Botão de Auto-Detecção - Instruções

## 1. Adicionar estados faltantes (Linha 101-108)

Substituir:
```typescript
export const FieldCombiner = ({ availableColumns, sampleData, onFieldsChange }: FieldCombinerProps) => {
  const [combinedFields, setCombinedFields] = useState<CombinedField[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // New field state
  const [newFieldName, setNewFieldName] = useState('');
```

Por:
```typescript
export const FieldCombiner = ({ availableColumns, sampleData, onFieldsChange }: FieldCombinerProps) => {
  const { toast } = useToast();
  const [combinedFields, setCombinedFields] = useState<CombinedField[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionResults, setDetectionResults] = useState<DetectionResult[]>([]);

  // New field state
  const [newFieldName, setNewFieldName] = useState('');
```

## 2. Adicionar botão de Auto-Detecção (Após linha 286 - dentro do CardHeader)

Adicionar ANTES do `<Dialog>`:
```typescript
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAutoDetect}
              disabled={isDetecting || !sampleData}
            >
              {isDetecting ? (
                <>
                  <Wand2 className="h-4 w-4 mr-2 animate-spin" />
                  Detectando...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Auto-Detectar Combinações
                </>
              )}
            </Button>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
```

## 3. Adicionar seção de resultados (Após linha 447 - dentro do CardContent, ANTES do combinedFields.length === 0)

Adicionar logo após `<CardContent>`:
```typescript
      <CardContent>
        {/* Auto-Detection Results */}
        {detectionResults.length > 0 && (
          <div className="mb-6 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Combinações Detectadas ({detectionResults.length})</h4>
              <Button variant="ghost" size="sm" onClick={() => setDetectionResults([])}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {detectionResults.map((result, idx) => (
                <div
                  key={idx}
                  className="border rounded-lg p-3 bg-green-50 dark:bg-green-950"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-sm">{result.field.name}</span>
                        <Badge variant="outline" className="text-xs">
                          → {result.dbField}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {result.matchCount} matches encontrados ({result.matchPercentage.toFixed(1)}%)
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleApplyDetectedField(result)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-2">
                    {result.field.sourceColumns.map((col) => (
                      <Badge key={col} variant="secondary" className="text-xs font-mono">
                        {col}
                      </Badge>
                    ))}
                  </div>

                  {result.field.preview && (
                    <div className="bg-background rounded p-2 text-xs font-mono mt-2">
                      Preview: {result.field.preview}
                    </div>
                  )}

                  {result.sampleMatches.length > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Exemplos do banco: {result.sampleMatches.slice(0, 2).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {combinedFields.length === 0 ? (
```

## Resultado Final

Após aplicar essas mudanças, você terá:

1. ✅ Botão "Auto-Detectar Combinações" no header
2. ✅ Loading state com spinner enquanto detecta
3. ✅ Resultados mostrados em cards verdes com:
   - Nome da combinação
   - Campo do banco de dados para mapear
   - Quantidade de matches e porcentagem
   - Preview do valor combinado
   - Exemplos encontrados no banco
   - Botão para adicionar cada combinação
4. ✅ Indicação visual de sucesso (verde) para combinações que deram match

## Como funciona:

1. Usuário clica em "Auto-Detectar Combinações"
2. Sistema testa várias combinações de campos contra o banco de dados
3. Mostra quais combinações encontraram matches
4. Usuário pode adicionar as que fazem sentido com um clique
