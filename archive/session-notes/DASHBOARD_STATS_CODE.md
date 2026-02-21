# Dashboard Stats - Código para Adicionar

Adicionar este código em **CompsAnalysis.tsx** após o breadcrumb (linha ~1205):

```tsx
      {/* Dashboard Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {properties.filter(p => p.analysis_status === 'complete').length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Análises Completas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-600">
                {properties.filter(p => p.analysis_status === 'partial').length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Análises Parciais</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-600">
                {properties.filter(p => p.analysis_status === 'pending').length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Pendentes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {properties.filter(p => p.cash_offer_amount > 0).length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Com Oferta</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                ${(properties.filter(p => p.cash_offer_amount > 0).reduce((sum, p) => sum + p.cash_offer_amount, 0) / 1000000).toFixed(1)}M
              </div>
              <div className="text-xs text-muted-foreground mt-1">Total em Ofertas</div>
            </div>
          </div>
        </CardContent>
      </Card>
```

## Localização Exata:
Inserir **DEPOIS** do breadcrumb e **ANTES** de `{/* Simplified Header */}`
