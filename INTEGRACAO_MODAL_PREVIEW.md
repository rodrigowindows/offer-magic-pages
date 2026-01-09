# 🎯 Guia de Integração - Modal de Preview de URL e QR Code

## ✅ O que foi implementado

Criado o componente `PropertyUrlPreviewModal.tsx` com:
- ✅ Preview da URL personalizada
- ✅ QR Code visual de 400x400px
- ✅ Botão para copiar URL
- ✅ Botão para abrir URL em nova aba
- ✅ Botão para baixar QR Code como PNG
- ✅ Informações da propriedade
- ✅ Badge do canal (SMS/Email/Call)
- ✅ Valor da oferta

---

## 📝 Como Integrar no CampaignManager.tsx

### Passo 1: Adicionar Import

No topo do arquivo `CampaignManager.tsx`, adicione:

```typescript
import { PropertyUrlPreviewModal } from './PropertyUrlPreviewModal';
```

### Passo 2: Já temos os estados necessários

Você já adicionou:
```typescript
const [previewProperty, setPreviewProperty] = useState<CampaignProperty | null>(null);
const [showUrlPreview, setShowUrlPreview] = useState(false);
```

### Passo 3: Adicionar Botão de Preview

Encontre onde você renderiza cada propriedade na lista (provavelmente dentro de um `.map()`) e adicione um botão:

```typescript
<Button
  size="sm"
  variant="outline"
  onClick={() => {
    setPreviewProperty(property);
    setShowUrlPreview(true);
  }}
  className="gap-1"
>
  <QrCode className="h-4 w-4" />
  Preview URL
</Button>
```

### Passo 4: Adicionar o Modal no Final do JSX

No final do `return` do CampaignManager, antes do último `</div>`, adicione:

```typescript
{/* URL Preview Modal */}
<PropertyUrlPreviewModal
  property={previewProperty}
  channel={selectedChannel}
  isOpen={showUrlPreview}
  onClose={() => {
    setShowUrlPreview(false);
    setPreviewProperty(null);
  }}
/>
```

---

## 🎨 Exemplo de Uso na Interface

Quando implementado, o fluxo será:

1. **Usuário seleciona propriedades** para campanha
2. **Clica em "Preview URL"** ao lado de uma propriedade
3. **Modal abre** mostrando:
   - URL completa: `https://offer.mylocalinvest.com/property/25217-mathew-st-unincorporated-32709?src=sms`
   - QR Code visual
   - Botões de ação (Copy, Open, Download)
4. **Usuário pode**:
   - Copiar o link
   - Abrir para testar
   - Baixar o QR code

---

## 🔍 Onde Adicionar o Botão de Preview

Procure por código similar a este no CampaignManager:

```typescript
{getFilteredProperties().map((property) => (
  <div key={property.id} className="...">
    {/* Informações da propriedade */}
    <div className="flex items-center gap-2">
      {/* Checkbox de seleção */}
      <Checkbox ... />

      {/* ADICIONAR AQUI O BOTÃO DE PREVIEW */}
      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          setPreviewProperty(property);
          setShowUrlPreview(true);
        }}
        className="gap-1"
      >
        <QrCode className="h-3 w-3" />
        URL
      </Button>

      {/* Outros botões existentes */}
    </div>
  </div>
))}
```

---

## 📱 Preview do Modal

```
┌─────────────────────────────────────────────────┐
│ 🔲 Property Link & QR Code Preview        [X]  │
├─────────────────────────────────────────────────┤
│                                                 │
│ ┌─────────────────────────────────────────┐   │
│ │ 25217 MATHEW ST                   [SMS] │   │
│ │ UNINCORPORATED, FL 32709                │   │
│ └─────────────────────────────────────────┘   │
│                                                 │
│ Property URL:          [Copy] [Open]           │
│ ┌─────────────────────────────────────────┐   │
│ │ https://offer.mylocalinvest.com/...    │   │
│ └─────────────────────────────────────────┘   │
│                                                 │
│ QR Code:                    [Download PNG]     │
│ ┌─────────────────────────────────────────┐   │
│ │                                         │   │
│ │         [QR CODE IMAGE]                 │   │
│ │                                         │   │
│ └─────────────────────────────────────────┘   │
│                                                 │
│ Channel: SMS          Cash Offer: $70,000      │
│                                                 │
│                                    [Close]      │
└─────────────────────────────────────────────────┘
```

---

## ✅ Benefícios

1. **Preview antes de enviar** - Ver exatamente qual URL será enviada
2. **Download QR Code** - Para usar em materiais impressos
3. **Teste rápido** - Abrir link diretamente para conferir
4. **Copy paste** - Copiar URL para usar em outros lugares
5. **Tracking visual** - Ver claramente o parâmetro `?src=sms`

---

## 🚀 Próximos Passos

Depois de integrar:

1. [ ] Testar com diferentes propriedades
2. [ ] Testar com diferentes canais (SMS, Email, Call)
3. [ ] Verificar download do QR code
4. [ ] Adicionar preview em lote (todas as propriedades selecionadas)
5. [ ] Adicionar export CSV de todas as URLs
