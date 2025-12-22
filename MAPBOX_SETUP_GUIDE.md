# 🗺️ Configuração do Mapa Interativo com Mapbox

## ✅ Novo Mapa Interativo Criado!

Foi criado um **mapa interativo real** usando Mapbox que mostra cada propriedade no seu endereço exato com marcadores clicáveis.

---

## 🚀 Como Configurar

### Passo 1: Obter Token do Mapbox (GRÁTIS)

1. **Criar Conta Gratuita**
   - Acesse: https://account.mapbox.com/auth/signup/
   - Crie uma conta (é grátis!)
   - O plano gratuito inclui:
     - ✅ 50,000 visualizações de mapa/mês
     - ✅ 100,000 geocodificações/mês
     - ✅ Suficiente para uso normal

2. **Obter Access Token**
   - Após login, vá para: https://account.mapbox.com/
   - Na seção "Access tokens", copie o **Default public token**
   - Ou crie um novo token clicando em "Create a token"

3. **Configurar Token no Projeto**

   **Opção A: Arquivo .env (Recomendado)**
   ```bash
   # Crie ou edite o arquivo .env na raiz do projeto
   VITE_MAPBOX_TOKEN=seu_token_aqui
   ```

   **Opção B: Diretamente no Código**
   ```typescript
   // Edite: src/components/InteractivePropertyMap.tsx
   // Linha 9: Substitua pela sua chave
   const MAPBOX_TOKEN = 'pk.eyJ1IjoiY2xhdWRlIiwiYSI6ImNsZXhhbXBsZSJ9.example';
   ```

### Passo 2: Reiniciar o Servidor

```bash
# Parar o servidor (Ctrl+C)
# Reiniciar
npm run dev
```

---

## 🎯 Como Usar o Novo Mapa

### Acessar o Mapa:
1. Vá para `/admin`
2. Tab "Properties"
3. Clique na tab **"Map"**
4. O mapa carregará automaticamente!

### Funcionalidades:

#### 1. **Marcadores Individuais**
- Cada propriedade aparece como um **círculo colorido** no mapa
- **Verde** = Aprovada
- **Amarelo** = Pendente
- **Vermelho** = Rejeitada

#### 2. **Click em Marcador**
- Abre um **popup** com:
  - Endereço completo
  - Valor estimado
  - Oferta em dinheiro
  - Status de aprovação
  - Botão "Ver Detalhes"

#### 3. **Ver Detalhes**
- Click no botão "Ver Detalhes" no popup
- Abre o dialog de edição da propriedade
- Mesma funcionalidade que clicar na tabela

#### 4. **Navegação do Mapa**
- **Zoom**: Scroll do mouse ou botões +/-
- **Pan**: Arrastar o mapa
- **Fullscreen**: Botão no canto superior direito
- **Minha Localização**: Botão com ícone de navegação

#### 5. **Geocodificação Automática**
- O mapa geocodifica automaticamente cada endereço
- Mostra progresso durante o carregamento
- Fallback para cidade se endereço não encontrado

---

## 🎨 Visual do Novo Mapa

```
┌───────────────────────────────────────────────────────┐
│ 🗺️ Mapa Interativo de Propriedades    [📍] [⛶]      │
├───────────────────────────────────────────────────────┤
│                                                       │
│   [Mapa Real do Mapbox - Streets View]              │
│                                                       │
│      📍 ← Marcador clicável                          │
│         (click para ver popup)                        │
│                                                       │
│   Popup ao clicar:                                   │
│   ┌─────────────────────────┐                        │
│   │ 123 Main St             │                        │
│   │ Orlando, FL 32801       │                        │
│   ├─────────────────────────┤                        │
│   │ Estimado: $250,000      │                        │
│   │ Oferta: $200,000        │                        │
│   ├─────────────────────────┤                        │
│   │ [approved]              │                        │
│   │ [Ver Detalhes]          │                        │
│   └─────────────────────────┘                        │
│                                                       │
│   Controles:                                         │
│   - Zoom (+/-)                                       │
│   - Navegação (setas)                                │
│   - Fullscreen                                       │
│                                                       │
├───────────────────────────────────────────────────────┤
│ Legend:                                               │
│ ● Verde: Aprovado  ● Amarelo: Pendente  ● Vermelho: Rejeitado │
└───────────────────────────────────────────────────────┘
```

---

## 🆚 Diferenças: Mapa Antigo vs Novo

### Mapa Antigo (PropertyMapView)
❌ Clusters grandes não clicáveis individualmente
❌ Visualização simplificada (não é mapa real)
❌ Sem endereços exatos
❌ Apenas agrupamento por cidade

### Mapa Novo (InteractivePropertyMap)
✅ Mapa real do Mapbox (Streets, Satélite, etc.)
✅ Cada propriedade no endereço exato
✅ Marcadores individuais clicáveis
✅ Popup com informações detalhadas
✅ Navegação completa (zoom, pan, fullscreen)
✅ Geocodificação automática de endereços
✅ Botão "Minha Localização"
✅ Cores por status de aprovação

---

## 🔧 Recursos Técnicos

### Geocodificação
- Usa **Mapbox Geocoding API**
- Tenta endereço completo primeiro
- Fallback para cidade + estado se necessário
- Adiciona offset aleatório pequeno para evitar sobreposição

### Performance
- Geocodifica endereços em lote
- Mostra progresso durante carregamento
- Cache de marcadores
- Otimizado para centenas de propriedades

### Interatividade
- Popups HTML customizados
- Marcadores com hover effect
- Click handler global para abrir detalhes
- Navegação suave (flyTo animations)

---

## 📊 Limites do Plano Gratuito

### Mapbox Free Tier:
- **50,000 visualizações** de mapa/mês
- **100,000 geocodificações**/mês
- **Sem cartão de crédito** necessário
- **Sempre gratuito** para uso básico

### O Que Isso Significa:
- Se você tem **100 propriedades**:
  - Geocodificação: 100 chamadas (uma vez)
  - Cada usuário que abre o mapa: 1 visualização
  - **Pode ter ~500 usuários/mês** visualizando

### Se Precisar de Mais:
- Planos pagos começam em $5/mês
- Incluem 200,000 visualizações

---

## 🎨 Customizações Disponíveis

### Estilo do Mapa
```typescript
// No código, linha ~74, você pode mudar:
style: "mapbox://styles/mapbox/streets-v12"

// Opções:
"mapbox://styles/mapbox/streets-v12"     // Ruas (padrão)
"mapbox://styles/mapbox/satellite-v9"     // Satélite
"mapbox://styles/mapbox/light-v11"        // Claro
"mapbox://styles/mapbox/dark-v11"         // Escuro
"mapbox://styles/mapbox/outdoors-v12"     // Outdoor
```

### Centro Inicial
```typescript
// Linha ~76, mudar coordenadas:
center: [-81.3792, 28.5383], // Orlando, FL
zoom: 11,

// Para outra cidade:
center: [-80.1918, 25.7617], // Miami
zoom: 10,
```

### Cor dos Marcadores
```typescript
// Linha ~139-143, customizar cores:
const markerColor =
  property.approval_status === "approved"
    ? "#10b981"  // Verde - pode mudar para qualquer cor hex
    : "#f59e0b"; // Amarelo
```

---

## 🐛 Troubleshooting

### Problema: Mapa não aparece (tela cinza)

**Solução:**
1. Verifique se o token está configurado
2. Abra Console (F12) e veja se há erros
3. Verifique se o token é válido (copie novamente)
4. Reinicie o servidor (`npm run dev`)

### Problema: "Invalid access token"

**Solução:**
1. Token está incorreto ou expirado
2. Crie um novo token em https://account.mapbox.com/
3. Atualize no `.env` ou no código
4. Reinicie o servidor

### Problema: Marcadores não aparecem

**Solução:**
1. Verifique se há propriedades cadastradas
2. Veja o console - pode estar geocodificando
3. Aguarde o carregamento completo
4. Verifique se os endereços são válidos

### Problema: Geocodificação lenta

**Solução:**
1. Normal para muitas propriedades (100+)
2. O progresso é mostrado na tela
3. Uma vez geocodificado, fica em cache
4. Considere pré-geocodificar se muitas propriedades

### Problema: Popup não abre ao clicar

**Solução:**
1. Verifique se o popup foi criado (console)
2. Tente zoom mais próximo
3. Clique diretamente no centro do marcador

---

## 🎯 Próximos Passos

### Melhorias Futuras Opcionais:

1. **Clustering Dinâmico**
   - Agrupar marcadores próximos em clusters
   - Útil para 1000+ propriedades

2. **Filtros no Mapa**
   - Filtrar marcadores por status
   - Mostrar/ocultar por tipo

3. **Heatmap**
   - Mapa de calor de valores
   - Densidade de propriedades

4. **Rotas**
   - Calcular rota entre propriedades
   - Otimizar visitas

5. **Desenhar Áreas**
   - Selecionar propriedades por área desenhada
   - Busca por polígono

6. **Export**
   - Exportar mapa como imagem
   - PDF com mapa e propriedades

---

## 📝 Código Criado

### Novo Componente:
**`src/components/InteractivePropertyMap.tsx`**
- 350+ linhas
- Mapa completo com Mapbox
- Geocodificação automática
- Marcadores interativos
- Popups customizados

### Arquivo Modificado:
**`src/pages/Admin.tsx`**
- Import do InteractivePropertyMap
- Substituído PropertyMapView
- Mantém mesma interface

---

## ✅ Checklist de Configuração

- [ ] Criar conta Mapbox (grátis)
- [ ] Obter access token
- [ ] Adicionar token ao `.env` ou código
- [ ] Reiniciar servidor (`npm run dev`)
- [ ] Acessar `/admin` → Properties → Map
- [ ] Verificar se mapa carrega
- [ ] Testar click em marcadores
- [ ] Testar popup e "Ver Detalhes"
- [ ] Testar navegação (zoom, pan)
- [ ] Testar fullscreen

---

## 🎉 Resultado Final

Agora você tem um **mapa interativo profissional** que:
- ✅ Mostra cada propriedade no endereço exato
- ✅ Marcadores clicáveis com informações
- ✅ Navegação completa do mapa
- ✅ Geocodificação automática
- ✅ Cores por status
- ✅ Popups informativos
- ✅ Integração total com Admin

---

## 🔗 Links Úteis

- **Mapbox Signup**: https://account.mapbox.com/auth/signup/
- **Mapbox Docs**: https://docs.mapbox.com/mapbox-gl-js/
- **Geocoding API**: https://docs.mapbox.com/api/search/geocoding/
- **Exemplos**: https://docs.mapbox.com/mapbox-gl-js/example/

---

**Criado em**: Dezembro 21, 2025
**Arquivo**: `src/components/InteractivePropertyMap.tsx`
**Status**: ✅ Pronto para usar (configure o token primeiro!)

**Aproveite seu novo mapa interativo! 🗺️✨**
