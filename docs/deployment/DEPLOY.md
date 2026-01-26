# Guia Consolidado de Deploy

## Visão Geral

Este guia reúne todos os procedimentos, checklists e dicas para deploy do sistema, incluindo edge functions, APIs, CSV Importer, A/B Testing e integrações.

---

## Deploy via Dashboard
- Acesse o Supabase Dashboard ou Lovable Editor.
- Faça upload dos arquivos novos e substitua os modificados conforme instruções.
- Use a interface para deploy de edge functions ("Deploy" ou "Redeploy").

## Deploy via CLI
- Use Supabase CLI para login, configuração de secrets e deploy:
```bash
npx supabase login
npx supabase secrets set ATTOM_API_KEY=SEU_TOKEN --project-ref SEU_PROJECT_REF
npx supabase functions deploy fetch-comps --project-ref SEU_PROJECT_REF
```
- Para deploy de outras funções:
```bash
npx supabase functions deploy retell-webhook-handler
npx supabase functions deploy geocode
```

---

## Edge Functions

- Deploy de funções como `fetch-comps`, `retell-webhook-handler`, `geocode` pode ser feito via CLI ou Dashboard.
- Configure secrets (API Keys) antes do deploy.
- Verifique logs após deploy para garantir funcionamento correto:
```bash
npx supabase functions logs fetch-comps --tail
npx supabase functions logs geocode --tail
```

---

## Checklist de Deploy

- [ ] Todos os arquivos criados e revisados
- [ ] API Keys configuradas no Supabase
- [ ] Edge functions deployadas
- [ ] Testes executados após deploy
- [ ] Logs verificados (sem erros críticos)
- [ ] Documentação atualizada

---

## Troubleshooting

- Se dados retornam como DEMO, verifique se a API Key está configurada e a função foi redeployada.
- Use logs do Supabase para identificar problemas de execução.
- Para erros de variáveis, confira nomes e formatos esperados.

---
