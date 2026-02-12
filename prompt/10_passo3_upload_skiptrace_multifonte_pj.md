PROMPT 10 - PASSO 3: UPLOAD RETORNO SKIP TRACE + MULTIFONTE + PJ/SOCIOS

Pre-condicao
Prompt 09 concluido.

Objetivo
Permitir upload dos retornos de fornecedores na mesma tela, suportando:
- multiplas fontes por proprietario
- dono pessoa juridica (empresa)
- socios/oficiais da empresa

Arquivos base
- src/components/SkipTracingImporter.tsx
- src/components/SkipTraceDataViewer.tsx
- src/pages/SkipTrace.tsx
- src/pages/SkipTracePage.tsx

Diretriz de modelagem
- Nao depender apenas de owner_phone/email e person2/person3 fixos.
- Criar estrutura normalizada para contatos e origem da informacao (source/vendor/date).

Entregaveis
- migracao/modelo (se necessario)
- importer atualizado
- visualizacao consolidada de contatos
- docs/process5/10-upload-skiptrace-multifonte.md

Validacao
- npm run type-check
- teste com 2 arquivos de fornecedores para mesma propriedade
