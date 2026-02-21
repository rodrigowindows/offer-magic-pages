# API de Skip Trace Data - Guia Completo

## Visão Geral

A API de Skip Trace Data permite acessar todos os dados de skip tracing das propriedades armazenadas no sistema. Esta API retorna informações completas sobre telefones, emails e dados de contato encontrados durante o processo de skip tracing.

## Funcionalidades

- ✅ **Acesso completo** a todas as colunas das propriedades
- ✅ **Dados de skip trace** consolidados e formatados
- ✅ **Busca avançada** por endereço, cidade, proprietário ou CEP
- ✅ **Paginação** para grandes volumes de dados
- ✅ **Filtros inteligentes** para propriedades com dados de contato
- ✅ **Formatação automática** de telefones e validação de emails
- ✅ **Parsing automático** de dados JSON armazenados
- ✅ **Resumos estatísticos** dos dados encontrados

## Arquivos Criados

### 1. API Backend (`supabase/functions/get-skip-trace-data/`)
- `index.ts` - Função principal da API
- `README.md` - Documentação detalhada da API

### 2. Frontend Integration
- `src/hooks/useSkipTraceData.ts` - Hook React para consumir a API
- `src/components/SkipTraceDataViewer.tsx` - Componente UI para visualizar dados
- `test-skip-trace-api.js` - Script de teste para a API

### 3. Interface Admin
- Nova aba "Skip Trace" adicionada na página Admin
- Integração completa com o sistema existente

## Como Usar

### 1. Deploy da Função

```bash
# No diretório do projeto Supabase
supabase functions deploy get-skip-trace-data
```

### 2. Usar no Frontend

```tsx
import { useSkipTraceData } from '@/hooks/useSkipTraceData';

function MyComponent() {
  const { data, loading, error } = useSkipTraceData({
    hasSkipTraceData: true,
    limit: 20,
    autoLoad: true
  });

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <div>
      {data.map(property => (
        <div key={property.id}>
          <h3>{property.address}</h3>
          <p>Telefones: {property.skip_trace_summary.total_phones}</p>
          <p>Emails: {property.skip_trace_summary.total_emails}</p>
        </div>
      ))}
    </div>
  );
}
```

### 3. Chamada Direta da API

```javascript
const response = await fetch('/functions/v1/get-skip-trace-data?hasSkipTraceData=true&limit=10', {
  headers: {
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
```

### 4. Testar a API

```bash
# Executar script de teste
node test-skip-trace-api.js
```

## Estrutura da Resposta

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "address": "123 Main St",
      "city": "Orlando",
      "state": "FL",
      "zip_code": "32801",
      "owner_name": "John Doe",
      "skip_trace_summary": {
        "total_phones": 3,
        "total_emails": 2,
        "has_owner_info": true,
        "phones": [
          {
            "number": "4075551234",
            "type": "Mobile",
            "formatted": "(407) 555-1234"
          }
        ],
        "emails": [
          {
            "email": "john@example.com",
            "type": "Owner"
          }
        ],
        "preferred_phones": ["4075551234"],
        "preferred_emails": ["john@example.com"],
        "dnc_status": "Clear",
        "deceased_status": "Active"
      }
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 150,
    "has_more": true
  },
  "summary": {
    "total_properties": 150,
    "properties_with_phones": 120,
    "properties_with_emails": 95,
    "properties_with_owner_info": 110
  }
}
```

## Campos Incluídos

### Dados da Propriedade
Todos os campos da tabela `properties`, incluindo:
- Informações básicas (address, city, state, zip_code)
- Dados do proprietário (owner_name, owner_phone, owner_email)
- Telefones de skip trace (phone1-phone5)
- Emails de skip trace (email1-email5)
- Contatos preferidos (preferred_phones, preferred_emails)
- Status (dnc_litigator, owner_deceased)
- E todos os outros campos

### Resumo de Skip Trace
- **total_phones**: Contagem de telefones encontrados
- **total_emails**: Contagem de emails encontrados
- **phones**: Array com telefones formatados
- **emails**: Array com emails validados
- **preferred_phones/preferred_emails**: Contatos marcados como preferidos
- **dnc_status**: Status DNC ("DNC" ou "Clear")
- **deceased_status**: Status de falecimento

## Segurança

- ✅ Autenticação obrigatória via Supabase
- ✅ Verificação JWT desabilitada (verify_jwt = false)
- ✅ CORS habilitado para todas as origens
- ✅ Rate limiting através do Supabase

## Limitações

- Máximo de 50 propriedades por requisição
- Dados retornados apenas para propriedades aprovadas
- Requer conexão com Supabase para autenticação

## Próximos Passos

1. **Deploy**: Execute `supabase functions deploy get-skip-trace-data`
2. **Teste**: Use o script `test-skip-trace-api.js` para validar
3. **Interface**: Acesse a aba "Skip Trace" na página Admin
4. **Integração**: Use o hook `useSkipTraceData` em seus componentes

## Suporte

Para dúvidas ou problemas:
1. Verifique os logs do Supabase Functions
2. Use o script de teste para diagnóstico
3. Consulte a documentação completa em `supabase/functions/get-skip-trace-data/README.md`