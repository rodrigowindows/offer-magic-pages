# 📋 Guia de Templates de Mapeamento

## ✅ O que foi implementado

Criei um sistema completo de **Templates de Mapeamento** que permite:

### Funcionalidades Principais

1. **💾 Salvar Templates**
   - Salvar mapeamentos atuais com nome e descrição
   - Armazena no localStorage do navegador
   - Mostra quantas colunas estão mapeadas

2. **📂 Carregar Templates**
   - Lista todos os templates salvos
   - Mostra informações: nome, descrição, número de colunas, usos, data
   - Aplica o template selecionado aos mapeamentos atuais

3. **📥 Importar/Exportar**
   - Exportar template como arquivo JSON
   - Importar template de arquivo JSON
   - Compartilhar templates entre computadores/usuários

4. **🗑️ Gerenciar Templates**
   - Excluir templates não usados
   - Contador de uso automático
   - Atualização da data de último uso

## 🔧 Como Integrar no ColumnMappingDialog

### Passo 1: Adicionar Import
No arquivo `src/components/ColumnMappingDialog.tsx`, adicione:

```tsx
// No topo do arquivo, após os outros imports:
import MappingTemplates from "./MappingTemplates";
```

### Passo 2: Adicionar Função de Load Template
No componente `ColumnMappingDialog`, adicione esta função:

```tsx
// Dentro do componente, após as outras funções
const handleLoadTemplate = (templateMappings: ColumnMapping[]) => {
  setMappings(templateMappings);
  onMappingChange(templateMappings);

  toast({
    title: "Template aplicado!",
    description: `${templateMappings.length} mapeamentos carregados`,
  });
};
```

### Passo 3: Adicionar o Componente na Interface
Encontre a seção de "Actions" (por volta da linha 420) e adicione o componente:

```tsx
{/* Actions */}
<div className="flex items-center justify-between flex-wrap gap-2">
  <div className="flex items-center gap-2">
    {/* ADICIONAR AQUI - Templates */}
    <MappingTemplates
      currentMappings={mappings}
      onLoadTemplate={handleLoadTemplate}
    />

    {/* Botões existentes */}
    <Button
      variant="default"
      size="sm"
      onClick={handleAIMapping}
      disabled={isAILoading}
      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
    >
      {isAILoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          {aiStatus || 'Processando...'}
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4 mr-2" />
          Mapear com IA
        </>
      )}
    </Button>
    <Button variant="outline" size="sm" onClick={autoDetectAll}>
      <Wand2 className="h-4 w-4 mr-2" />
      Auto-Detectar
    </Button>
    <Button variant="ghost" size="sm" onClick={clearAll}>
      <X className="h-4 w-4 mr-2" />
      Limpar Tudo
    </Button>
  </div>
  {/* ... resto do código ... */}
</div>
```

## 🎯 Como Usar (Para o Usuário Final)

### Salvar um Template

1. **Configure os mapeamentos** normalmente (usando IA, Auto-Detectar, ou manual)
2. Clique em **"Salvar Template"**
3. Digite um **nome** (ex: "PropStream Orlando")
4. Opcionalmente, adicione uma **descrição** (ex: "Mapeamento padrão para dados do PropStream")
5. Clique em **"Salvar Template"**

### Carregar um Template

1. Clique em **"Carregar Template (X)"** - o número mostra quantos templates você tem
2. Veja a lista de templates salvos
3. **Selecione um template** no dropdown ou clique diretamente no card
4. Clique em **"Aplicar Template"**
5. Os mapeamentos serão aplicados automaticamente!

### Exportar um Template

1. Clique em **"Carregar Template"**
2. Encontre o template que deseja exportar
3. Clique no ícone de **Download** (⬇️)
4. Um arquivo JSON será baixado
5. Você pode compartilhar este arquivo com outros usuários

### Importar um Template

1. Clique em **"Carregar Template"**
2. Clique em **"Importar JSON"** (no rodapé do diálogo)
3. Selecione o arquivo JSON do template
4. O template será adicionado à sua lista

### Excluir um Template

1. Clique em **"Carregar Template"**
2. Encontre o template que deseja excluir
3. Clique no ícone de **Lixeira** (🗑️)
4. O template será removido

## 📊 Informações Exibidas

Cada template mostra:

- **Nome** do template
- **Descrição** (se fornecida)
- **Número de colunas** mapeadas
- **Contador de uso** - quantas vezes foi usado
- **Data de atualização** - última vez que foi usado ou modificado

## 💾 Armazenamento

Os templates são salvos no **localStorage** do navegador com a chave:
```
column_mapping_templates
```

**Nota:** Se limpar os dados do navegador, os templates serão perdidos. Use a função de exportar para fazer backup!

## 🎨 Interface

### Botão "Salvar Template"
- Desabilitado se não houver mapeamentos
- Abre diálogo com campos de nome e descrição
- Mostra quantas colunas serão salvas

### Botão "Carregar Template"
- Mostra o número de templates disponíveis
- Desabilitado se não houver templates salvos
- Abre diálogo com lista completa de templates

### Diálogo de Carregar
- Lista scrollável de templates
- Cards clicáveis
- Highlight no template selecionado
- Botões de ação (exportar, excluir) para cada template

## 🔄 Fluxo de Trabalho Recomendado

### Para Primeira Importação de uma Fonte:
1. Carregue o CSV
2. Use "Mapear com IA" ou "Auto-Detectar"
3. Ajuste manualmente conforme necessário
4. **Salve como template** com nome da fonte (ex: "Tax Roll Orlando")

### Para Importações Subsequentes da Mesma Fonte:
1. Carregue o CSV
2. Clique em "Carregar Template"
3. Selecione o template salvo
4. Pronto! Mapeamentos aplicados instantaneamente

### Para Compartilhar com Equipe:
1. Exporte o template como JSON
2. Compartilhe o arquivo via email/drive
3. Membros da equipe importam o JSON
4. Todos usam os mesmos mapeamentos padronizados

## 🚀 Benefícios

✅ **Economia de Tempo**: Não precisa mapear novamente para a mesma fonte
✅ **Consistência**: Todos usam os mesmos mapeamentos
✅ **Compartilhamento**: Templates podem ser exportados e compartilhados
✅ **Organização**: Mantenha templates para diferentes fontes de dados
✅ **Rastreamento**: Veja quais templates são mais usados
✅ **Backup**: Exporte templates importantes

## 📝 Exemplos de Templates Úteis

- **"PropStream Florida"** - Para dados do PropStream de FL
- **"Tax Roll Orlando"** - Para lista de impostos de Orlando
- **"Zillow Export"** - Para exportações do Zillow
- **"County Records"** - Para registros do condado
- **"MLS Data"** - Para dados de MLS

## 🐛 Tratamento de Erros

O sistema trata:
- ✅ Nome vazio ao salvar
- ✅ Nenhum mapeamento ao salvar
- ✅ Arquivo JSON inválido ao importar
- ✅ Template não encontrado ao carregar
- ✅ Erro ao acessar localStorage

## 🔮 Futuras Melhorias Possíveis

1. **Sync com banco de dados** - Em vez de localStorage
2. **Templates compartilhados** - Repository de templates da empresa
3. **Versionamento** - Histórico de mudanças em templates
4. **Auto-sugestão** - Sugerir template baseado em headers do CSV
5. **Tags** - Categorizar templates por tags
6. **Favoritos** - Marcar templates mais usados

---

## ✅ Checklist de Integração

- [ ] Adicionar import do MappingTemplates
- [ ] Adicionar função handleLoadTemplate
- [ ] Adicionar componente na seção Actions
- [ ] Testar salvamento de template
- [ ] Testar carregamento de template
- [ ] Testar exportação de template
- [ ] Testar importação de template
- [ ] Testar exclusão de template
- [ ] Verificar persistência após refresh da página
