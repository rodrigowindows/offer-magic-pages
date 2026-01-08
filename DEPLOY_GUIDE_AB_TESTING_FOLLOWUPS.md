# 🚀 **Guia de Deploy: Testes A/B & Follow-ups Inteligentes**

## 📋 **Pré-requisitos**

Antes de fazer o deploy, certifique-se de que:

1. ✅ **Sistema base funcionando** no Lovable
2. ✅ **Todas as dependências instaladas** (React, Supabase, Shadcn/ui)
3. ✅ **Variáveis de ambiente configuradas** no Supabase
4. ✅ **Usuário autenticado** no Lovable

---

## 🗄️ **Passo 1: Executar Migração do Banco**

### **No Supabase Dashboard:**

1. **Acesse** seu projeto Supabase
2. **Vá para** "SQL Editor"
3. **Clique** em "New Query"
4. **Cole** todo o conteúdo do arquivo `database_migration_ab_testing_followups.sql`
5. **Clique** em "Run" para executar

### **Verificação:**
```sql
-- Execute estas queries para verificar:
SELECT COUNT(*) FROM ab_tests;
SELECT COUNT(*) FROM follow_up_rules;
SELECT COUNT(*) FROM follow_up_executions;
```

---

## 📁 **Passo 2: Upload dos Arquivos**

### **Arquivos a fazer upload no Lovable:**

1. **`AutomatedABTesting.tsx`** → `src/components/marketing/`
2. **`IntelligentFollowUps.tsx`** → `src/components/marketing/`
3. **`ADVANCED_FEATURES_README.md`** → `docs/` (já atualizado)

### **Como fazer upload:**

1. **Abra** o Lovable Editor
2. **Clique** em "Files" no sidebar esquerdo
3. **Clique** em "Upload Files"
4. **Selecione** os arquivos `.tsx` criados
5. **Confirme** o upload

---

## 🔧 **Passo 3: Atualizar MarketingApp.tsx**

### **Se ainda não foi atualizado:**

Adicione estas importações no topo:
```typescript
import AutomatedABTesting from './components/marketing/AutomatedABTesting';
import IntelligentFollowUps from './components/marketing/IntelligentFollowUps';
```

### **Adicione estas rotas:**
```typescript
<Route path="/marketing/ab-testing" element={<AutomatedABTesting />} />
<Route path="/marketing/follow-ups" element={<IntelligentFollowUps />} />
```

### **Adicione estes itens no menu:**
```typescript
{
  title: "A/B Testing",
  href: "/marketing/ab-testing",
  icon: TestTube2
},
{
  title: "Follow-ups",
  href: "/marketing/follow-ups",
  icon: Bot
}
```

---

## 🧪 **Passo 4: Testes Iniciais**

### **Teste A/B Testing:**
1. **Acesse** `/marketing/ab-testing`
2. **Clique** em "Create New Test"
3. **Preencha** os campos obrigatórios
4. **Salve** o teste
5. **Verifique** se aparece na lista

### **Teste Follow-ups:**
1. **Acesse** `/marketing/follow-ups`
2. **Clique** em "Create Rule"
3. **Configure** uma regra simples
4. **Ative** a regra
5. **Verifique** se aparece na lista

---

## 🔍 **Passo 5: Verificações Finais**

### **Console do navegador:**
- ✅ Sem erros de JavaScript
- ✅ Componentes renderizando corretamente
- ✅ Navegação funcionando

### **Supabase Logs:**
- ✅ Queries executando sem erros
- ✅ RLS policies funcionando
- ✅ Triggers ativados

### **Funcionalidades:**
- ✅ A/B Testing: Criar, editar, visualizar testes
- ✅ Follow-ups: Criar regras, visualizar execuções
- ✅ Menu: Novos itens aparecendo
- ✅ Rotas: Navegação funcionando

---

## 🚨 **Troubleshooting**

### **Erro: "Table doesn't exist"**
- ❌ Migração não foi executada
- ✅ Execute novamente o SQL no Supabase

### **Erro: "Component not found"**
- ❌ Arquivo não foi feito upload
- ✅ Verifique se o arquivo está na pasta correta

### **Erro: "Route not found"**
- ❌ MarketingApp.tsx não foi atualizado
- ✅ Adicione as rotas e imports

### **Erro: "Permission denied"**
- ❌ RLS policies incorretas
- ✅ Verifique as policies no Supabase

---

## 📊 **Monitoramento Pós-Deploy**

### **Métricas para acompanhar:**
- Número de testes A/B criados
- Número de regras de follow-up ativas
- Taxa de erro das execuções
- Performance das queries

### **Logs importantes:**
- Supabase function logs
- Browser console errors
- Network requests

---

## 🎯 **Próximos Passos**

Após deploy bem-sucedido:

1. **Criar primeiro teste A/B** com uma campanha real
2. **Configurar regras de follow-up** para leads existentes
3. **Monitorar performance** das automações
4. **Ajustar parâmetros** baseado nos resultados
5. **Expandir funcionalidades** conforme necessário

---

## 📞 **Suporte**

Se encontrar problemas:

1. **Verifique** os logs do Supabase
2. **Confirme** que todos os arquivos foram uploadados
3. **Teste** as funcionalidades individualmente
4. **Compartilhe** mensagens de erro específicas

**Deploy concluído com sucesso!** 🎉

---

## 📋 **Checklist Final**

- [ ] Migração do banco executada
- [ ] Arquivos uploadados no Lovable
- [ ] MarketingApp.tsx atualizado
- [ ] Testes A/B funcionando
- [ ] Follow-ups funcionando
- [ ] Navegação funcionando
- [ ] Sem erros no console
- [ ] Funcionalidades testadas

**Status: ✅ Pronto para produção!**