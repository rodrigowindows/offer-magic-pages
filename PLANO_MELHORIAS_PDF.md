# 📋 Plano de Melhorias - PDF Consolidado CMA

## 🔍 Problemas Identificados no PDF Gerado

### 1. **Endereço Duplicado/Inconsistente**
**Problema:** 
- Endereço: `25217 MATHEW ST UNINCORPORATED 32709`
- Cidade/Estado: `Orlando, FL 25217` ❌
- **Causa:** O campo `address` já contém informações que deveriam estar separadas, e o `zip_code` está sendo confundido com parte do endereço

**Exemplos encontrados:**
- `25217 MATHEW ST UNINCORPORATED 32709` → `Orlando, FL 25217` (deveria ser `Orlando, FL 32709`)
- `5528 LONG LAKE DR ORLANDO` → `Orlando, FL 32801` ✅ (correto)
- `144 WASHINGTON AVE EATONVILLE` → `Orlando, FL 32801` (cidade pode estar errada)

### 2. **Formato de Endereço Inconsistente**
**Problemas:**
- Alguns endereços contêm "UNINCORPORATED" no meio
- Alguns endereços contêm o ZIP code no final
- Alguns endereços contêm o nome da cidade no final
- Falta padronização na formatação

### 3. **Propriedades Sem Comparables**
**Problema:** 
- Propriedade 7 (`3100 FLOWERTREE RD BELLE ISLE`) aparece cortada
- Indica que o tratamento de erro pode não estar funcionando perfeitamente

### 4. **Informações de Localização**
**Problema:**
- Cidade pode estar incorreta (ex: `EATONVILLE` no endereço mas `Orlando` na cidade)
- ZIP code pode estar sendo extraído incorretamente do endereço

---

## 🔧 Correções Propostas

### 1. **Normalização de Endereços**

#### Função de Limpeza de Endereço
```typescript
function normalizeAddress(address: string): {
  street: string;
  city?: string;
  zipCode?: string;
} {
  // Remove palavras comuns que não fazem parte do endereço
  let cleaned = address
    .replace(/\bUNINCORPORATED\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Extrai ZIP code se presente (5 dígitos no final)
  const zipMatch = cleaned.match(/\b(\d{5})\b\s*$/);
  const zipCode = zipMatch ? zipMatch[1] : undefined;
  if (zipCode) {
    cleaned = cleaned.replace(/\b\d{5}\b\s*$/, '').trim();
  }
  
  // Extrai cidade se presente (palavras maiúsculas no final antes do ZIP)
  // Esta é uma heurística - pode precisar de ajuste
  
  return {
    street: cleaned,
    zipCode,
  };
}
```

#### Uso no PDF Export
```typescript
// Antes:
doc.text(property.address, 25, currentY + 8);
doc.text(`${property.city}, ${property.state} ${property.zip_code}`, 25, currentY + 15);

// Depois:
const normalized = normalizeAddress(property.address);
const displayAddress = normalized.street;
const zipCode = normalized.zipCode || property.zip_code;
const city = property.city || 'Orlando';

doc.text(displayAddress, 25, currentY + 8);
doc.text(`${city}, ${property.state} ${zipCode}`, 25, currentY + 15);
```

---

### 2. **Validação e Correção de Dados**

#### Função de Validação
```typescript
function validatePropertyData(property: PropertyData): PropertyData {
  const normalized = normalizeAddress(property.address);
  
  // Se ZIP code foi extraído do endereço, use-o
  if (normalized.zipCode && !property.zip_code) {
    property.zip_code = normalized.zipCode;
  }
  
  // Limpa o endereço
  property.address = normalized.street;
  
  // Valida cidade (remove se estiver no endereço)
  if (property.city && property.address.toUpperCase().includes(property.city.toUpperCase())) {
    // Cidade já está no endereço, pode remover ou manter dependendo do caso
  }
  
  return property;
}
```

---

### 3. **Melhor Tratamento de Propriedades Sem Comparables**

#### Melhorar Mensagem no PDF
```typescript
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Mensagem mais informativa
  doc.setFillColor(254, 242, 242);
  doc.rect(20, currentY, 170, 50, 'F');
  
  doc.setFontSize(11);
  doc.setTextColor(220, 38, 38);
  doc.text('⚠ Unable to Load Comparables', 25, currentY + 12);
  
  doc.setFontSize(9);
  doc.setTextColor(127, 29, 29);
  doc.text(`Address: ${property.address}`, 25, currentY + 22);
  doc.text('No comparable properties found for this address.', 25, currentY + 30);
  doc.text('This may indicate:', 25, currentY + 38);
  doc.setFontSize(8);
  doc.text('• Address not found in property database', 30, currentY + 45);
  doc.text('• No recent sales in the specified radius', 30, currentY + 52);
  
  currentY += 58;
}
```

---

### 4. **Formatação Consistente de Endereços**

#### Padronização
```typescript
function formatAddressForDisplay(address: string): string {
  // Remove palavras desnecessárias
  let formatted = address
    .replace(/\bUNINCORPORATED\b/gi, '')
    .replace(/\bINCORPORATED\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Capitaliza corretamente
  formatted = formatted
    .split(' ')
    .map(word => {
      // Mantém abreviações em maiúsculas
      if (['ST', 'AVE', 'RD', 'DR', 'LN', 'CT', 'BLVD', 'WAY'].includes(word.toUpperCase())) {
        return word.toUpperCase();
      }
      // Capitaliza primeira letra
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
  
  return formatted;
}
```

---

## 📝 Implementação Detalhada

### Arquivo: `src/utils/pdfExport.ts`

#### 1. Adicionar Funções de Normalização

```typescript
/**
 * Normaliza endereço removendo informações duplicadas
 */
function normalizeAddress(address: string): {
  street: string;
  zipCode?: string;
  city?: string;
} {
  if (!address) return { street: '' };
  
  let cleaned = address.trim();
  
  // Remove palavras comuns que não fazem parte do endereço
  cleaned = cleaned
    .replace(/\bUNINCORPORATED\b/gi, '')
    .replace(/\bINCORPORATED\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Extrai ZIP code (5 dígitos no final)
  const zipMatch = cleaned.match(/\b(\d{5})\b\s*$/);
  const zipCode = zipMatch ? zipMatch[1] : undefined;
  if (zipCode) {
    cleaned = cleaned.replace(/\b\d{5}\b\s*$/, '').trim();
  }
  
  return {
    street: cleaned,
    zipCode,
  };
}

/**
 * Formata endereço para exibição consistente
 */
function formatAddressForDisplay(address: string): string {
  if (!address) return '';
  
  const streetAbbreviations = ['ST', 'AVE', 'RD', 'DR', 'LN', 'CT', 'BLVD', 'WAY', 'CIR', 'PL'];
  
  return address
    .split(' ')
    .map(word => {
      const upperWord = word.toUpperCase();
      if (streetAbbreviations.includes(upperWord)) {
        return upperWord;
      }
      // Direções
      if (['N', 'S', 'E', 'W', 'NE', 'NW', 'SE', 'SW'].includes(upperWord)) {
        return upperWord;
      }
      // Capitaliza primeira letra
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Valida e corrige dados da propriedade
 */
function validatePropertyData(property: PropertyData): PropertyData {
  const normalized = normalizeAddress(property.address);
  
  return {
    ...property,
    address: formatAddressForDisplay(normalized.street),
    zip_code: normalized.zipCode || property.zip_code || '',
    city: property.city || 'Orlando',
  };
}
```

#### 2. Atualizar Função de Exportação Consolidada

```typescript
// No início do loop de propriedades:
for (let i = 0; i < properties.length; i++) {
  const property = validatePropertyData(properties[i]);
  
  // ... resto do código ...
  
  // Atualizar exibição do endereço:
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.setFont(undefined, 'bold');
  
  // Quebra endereço longo em múltiplas linhas se necessário
  const addressLines = doc.splitTextToSize(property.address, 120);
  addressLines.forEach((line: string, idx: number) => {
    doc.text(line, 25, currentY + 8 + (idx * 6));
  });
  
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`${property.city}, ${property.state} ${property.zip_code}`, 25, currentY + 15 + (addressLines.length - 1) * 6);
  
  // Ajustar currentY baseado no número de linhas
  currentY += (addressLines.length - 1) * 6;
}
```

---

## 🧪 Testes Necessários

### 1. **Teste de Normalização de Endereços**
- [ ] `25217 MATHEW ST UNINCORPORATED 32709` → `25217 Mathew St` + `Orlando, FL 32709`
- [ ] `5528 LONG LAKE DR ORLANDO` → `5528 Long Lake Dr` + `Orlando, FL 32801`
- [ ] `144 WASHINGTON AVE EATONVILLE` → `144 Washington Ave` + `Eatonville, FL [zip]`

### 2. **Teste de Propriedades Sem Comparables**
- [ ] Verificar que mensagem aparece corretamente no PDF
- [ ] Verificar que exportação continua
- [ ] Verificar que não há erros no console

### 3. **Teste de Formatação**
- [ ] Endereços longos quebram corretamente
- [ ] Abreviações mantidas em maiúsculas
- [ ] Capitalização consistente

---

## 📊 Prioridades

### 🔴 Alta Prioridade
1. **Normalização de endereços** - Corrige duplicação de informações
2. **Validação de ZIP code** - Garante que ZIP code correto seja usado

### 🟡 Média Prioridade
3. **Formatação consistente** - Melhora apresentação visual
4. **Tratamento de erros melhorado** - Melhor UX para propriedades sem comparables

### 🟢 Baixa Prioridade
5. **Quebra de linha automática** - Para endereços muito longos
6. **Detecção automática de cidade** - Se não estiver no campo city

---

## ✅ Checklist de Implementação

- [ ] Criar funções de normalização (`normalizeAddress`, `formatAddressForDisplay`, `validatePropertyData`)
- [ ] Atualizar `exportConsolidatedCompsPDF` para usar normalização
- [ ] Adicionar quebra de linha para endereços longos
- [ ] Melhorar mensagem de erro para propriedades sem comparables
- [ ] Testar com diferentes formatos de endereço
- [ ] Validar que ZIP codes estão corretos
- [ ] Verificar que cidades estão corretas
- [ ] Documentar mudanças

---

## 📅 Estimativa

- **Desenvolvimento:** 2-3 horas
- **Testes:** 1 hora
- **Total:** 3-4 horas

---

**Status:** 📋 Planejado
**Data:** 2026-01-26
