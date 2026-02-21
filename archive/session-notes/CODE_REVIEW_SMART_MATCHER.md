# 🔍 Code Review: Smart Field Matcher

## ✅ Pontos Positivos

### 1. **Algoritmo de Similaridade (Levenshtein)**
```typescript
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1.0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
```
✅ **CORRETO**: Normaliza strings (lowercase + trim) antes de comparar
✅ **CORRETO**: Match exato retorna 1.0 (100%)
✅ **CORRETO**: Substring match retorna 0.8 (80%) - bom para "ORLANDO" vs "ORLANDO FL"

### 2. **Geração Inteligente de Combinações**
```typescript
const firstNameCols = columns.filter(c =>
  c.toLowerCase().includes('first') && c.toLowerCase().includes('name')
);
```
✅ **CORRETO**: Detecta automaticamente colunas de nome baseado em palavras-chave
✅ **CORRETO**: Gera combinações First + Last automaticamente
✅ **CORRETO**: Gera combinações Address + City + State + Zip

### 3. **Busca no Banco de Dados**
```typescript
const { data: dbRows, error } = await supabase
  .from('properties')
  .select(dbField)
  .limit(100);
```
✅ **CORRETO**: Usa limite de 100 registros para não sobrecarregar
✅ **CORRETO**: Filtra valores nulos com `.filter(Boolean)`

### 4. **Cálculo de Match**
```typescript
for (let i = 0; i < Math.min(csvValues.length, 10); i++) {
  const csvVal = csvValues[i];

  for (const dbVal of dbValues) {
    const similarity = calculateSimilarity(csvVal, dbVal);
    if (similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestMatch = { csvValue: csvVal, dbValue: dbVal, similarity, field: dbField };
    }
  }
}
```
✅ **CORRETO**: Testa até 10 valores do CSV (amostra razoável)
✅ **CORRETO**: Compara com todos os valores do banco
✅ **CORRETO**: Mantém apenas o melhor match para cada valor CSV

## ⚠️ Possíveis Melhorias

### 1. **Performance - Nested Loops**
```typescript
// ATUAL: O(n * m) - pode ser lento
for (let i = 0; i < Math.min(csvValues.length, 10); i++) {
  for (const dbVal of dbValues) {
    const similarity = calculateSimilarity(csvVal, dbVal);
  }
}
```
**Problema**: Com 10 valores CSV e 100 do banco = 1000 comparações
**Solução Proposta**:
```typescript
// Adicionar cache de similaridade
const similarityCache = new Map<string, number>();
const cacheKey = `${csvVal}|${dbVal}`;
if (!similarityCache.has(cacheKey)) {
  similarityCache.set(cacheKey, calculateSimilarity(csvVal, dbVal));
}
```

### 2. **Threshold de Similaridade**
```typescript
if (bestMatch && bestMatch.similarity > 0.5) {
  matches.push(bestMatch);
}
```
**Questão**: 0.5 (50%) pode ser muito baixo para endereços
**Exemplo**:
- CSV: "5528 LONG LAKE DR ORLANDO"
- DB: "123 MAIN ST MIAMI"
- Pode dar 50% de match mesmo sendo endereços diferentes

**Sugestão**:
```typescript
const MIN_SIMILARITY = {
  address: 0.7,      // Endereços precisam 70%+
  owner_name: 0.6,   // Nomes precisam 60%+
  city: 0.8,         // Cidades precisam 80%+
  default: 0.5
};

const threshold = MIN_SIMILARITY[dbField] || MIN_SIMILARITY.default;
if (bestMatch && bestMatch.similarity > threshold) {
  matches.push(bestMatch);
}
```

### 3. **Geração de Combinações - Explosão Combinatória**
```typescript
addressCols.forEach((addr, i) => {
  cityCols.forEach((city, j) => {
    stateCols.forEach((state, k) => {
      zipCols.forEach((zip, l) => {
        // Se houver 2 address, 2 city, 2 state, 2 zip = 2^4 = 16 combinações!
```
**Problema**: Se o CSV tiver muitas variações (Input vs Owner Fix), pode gerar MUITAS combinações
**Exemplo Real do Usuário**:
- Input Property Address
- Owner Fix - Mailing Address
- 2 address × 2 city × 2 state × 2 zip = 16 combinações só de endereço!

**Sugestão**: Limitar ou priorizar:
```typescript
// Limitar a 20 combinações no máximo
return combinations.slice(0, 20);

// OU priorizar por keywords
const priorities = ['property', 'owner fix', 'input', 'mailing'];
combinations.sort((a, b) => {
  const aPriority = priorities.findIndex(p =>
    a.sourceColumns.some(c => c.toLowerCase().includes(p))
  );
  const bPriority = priorities.findIndex(p =>
    b.sourceColumns.some(c => c.toLowerCase().includes(p))
  );
  return aPriority - bPriority;
});
```

### 4. **AI Ranking - Error Handling**
```typescript
const apiKey = localStorage.getItem('gemini_api_key');
if (!apiKey) {
  console.warn('Gemini API key not found, using simple ranking');
  return matches;
}
```
✅ **BOM**: Tem fallback se não houver API key
⚠️ **ATENÇÃO**: Precisa tratar caso a API retorne erro ou JSON inválido

**Melhoria**:
```typescript
try {
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const jsonMatch = text.match(/\[[\d.,\s]+\]/);

  if (jsonMatch) {
    const scores = JSON.parse(jsonMatch[0]);

    // ADICIONAR VALIDAÇÃO
    if (!Array.isArray(scores) || scores.length !== matches.length) {
      console.warn('AI returned invalid scores, using original');
      return matches;
    }

    // Validar que scores são números entre 0 e 1
    if (scores.some(s => typeof s !== 'number' || s < 0 || s > 1)) {
      console.warn('AI returned invalid similarity values');
      return matches;
    }
```

### 5. **CSV Data Size**
```typescript
export async function testAllCombinations(
  csvData: Record<string, string>[],  // <-- Pode ser MUITO grande!
```
**Problema**: Se o CSV tiver 10,000 linhas, vai passar tudo
**Solução**:
```typescript
// Usar apenas amostra
const sampleSize = Math.min(csvData.length, 50);
const sample = csvData.slice(0, sampleSize);
```

## 🎯 Recomendações Finais

### Alta Prioridade:
1. ✅ **Adicionar thresholds diferentes por tipo de campo**
2. ✅ **Limitar número de combinações geradas** (máx 20-30)
3. ✅ **Usar apenas amostra do CSV** (50 linhas no máx)

### Média Prioridade:
4. ⚠️ **Melhorar validação do retorno da AI**
5. ⚠️ **Adicionar cache de similaridade para performance**

### Baixa Prioridade:
6. 💡 **Adicionar mais heurísticas** (ex: detectar phone numbers, emails)
7. 💡 **Permitir usuário customizar thresholds** na UI

## 📊 Estimativa de Performance

### Cenário Real (CSV do usuário):
- **CSV**: 273 colunas
- **Linhas**: ~1000
- **Campos DB para testar**: 3 (owner_name, owner_address, address)

### Cálculos:
1. **Combinações geradas**: ~20-30 (nomes + endereços)
2. **Testes totais**: 30 combinações × 3 campos = 90 testes
3. **Comparações por teste**: 10 valores CSV × 100 valores DB = 1000
4. **Total de comparações**: 90,000 comparações

### Tempo estimado:
- Levenshtein é rápido: ~0.001ms por comparação
- 90,000 × 0.001ms = **90ms** (muito rápido!)
- Com queries ao banco: ~2-3 segundos total ✅

### Com AI:
- 90 testes + AI ranking = **+5-10 segundos**
- Total: **~15 segundos** ✅ Aceitável

## ✅ Conclusão

**O código está BEM ESTRUTURADO e FUNCIONAL!**

Principais pontos:
- ✅ Lógica de matching está correta
- ✅ Usa boas práticas (normalização, fallbacks)
- ⚠️ Precisa de thresholds ajustados
- ⚠️ Pode gerar muitas combinações (fácil de limitar)
- ⚠️ Validação da AI pode ser melhorada

**Recomendação**: Aplicar as melhorias de Alta Prioridade antes do deploy.
