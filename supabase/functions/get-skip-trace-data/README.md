# Get Skip Trace Data API

Esta API retorna dados de skip tracing das propriedades, incluindo todos os telefones, emails e informações de contato encontradas.

## Endpoint

```
GET /functions/v1/get-skip-trace-data
```

## Parâmetros de Query

| Parâmetro | Tipo | Descrição | Padrão |
|-----------|------|-----------|--------|
| `propertyId` | string | ID específico da propriedade | null (retorna todas) |
| `limit` | number | Número máximo de propriedades a retornar | 50 |
| `offset` | number | Offset para paginação | 0 |
| `hasSkipTraceData` | boolean | Filtrar apenas propriedades com dados de skip trace | false |
| `search` | string | Buscar por endereço, cidade, nome do proprietário ou CEP | null |

## Exemplo de Uso

### Buscar todas as propriedades com dados de skip trace
```bash
curl -X GET "https://your-project.supabase.co/functions/v1/get-skip-trace-data?hasSkipTraceData=true&limit=10" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Buscar uma propriedade específica
```bash
curl -X GET "https://your-project.supabase.co/functions/v1/get-skip-trace-data?propertyId=123e4567-e89b-12d3-a456-426614174000" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Buscar com paginação e filtro de texto
```bash
curl -X GET "https://your-project.supabase.co/functions/v1/get-skip-trace-data?search=Orlando&limit=20&offset=0" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## Resposta

### Estrutura da Resposta

```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "address": "string",
      "city": "string",
      "state": "string",
      "zip_code": "string",
      "owner_name": "string",
      // ... todas as outras colunas da propriedade
      "skip_trace_summary": {
        "total_phones": 3,
        "total_emails": 2,
        "total_manual_phones": 1,
        "total_manual_emails": 1,
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
            "email": "owner@example.com",
            "type": "Owner"
          }
        ],
        "preferred_phones": ["(407) 555-1234"],
        "preferred_emails": ["owner@example.com"],
        "manual_phones": ["(407) 555-9999"],
        "manual_emails": ["manual@example.com"],
        "all_available_phones": ["(407) 555-1234", "(407) 555-9999"],
        "all_available_emails": ["owner@example.com", "manual@example.com"],
        "dnc_status": "Clear",
        "deceased_status": "Active"
      }
    }
  ],
  "pagination": {
    "limit": 50,
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
Todos os campos da tabela `properties` são retornados, incluindo:
- Informações básicas (address, city, state, zip_code)
- Dados do proprietário (owner_name, owner_phone, owner_email)
- Telefones de skip trace (phone1-phone5 com tipos)
- Emails de skip trace (email1-email5)
- Contatos preferidos (preferred_phones, preferred_emails)
- Status (dnc_litigator, owner_deceased)
- E todos os outros campos da tabela

### Resumo de Skip Trace
Adicionalmente, é incluído um objeto `skip_trace_summary` com:
- **total_phones**: Contagem total de telefones do skip trace
- **total_emails**: Contagem total de emails do skip trace
- **total_manual_phones**: Contagem de telefones adicionados manualmente
- **total_manual_emails**: Contagem de emails adicionados manualmente
- **has_owner_info**: Se há informações do proprietário
- **phones**: Array com todos os telefones do skip trace formatados
- **emails**: Array com todos os emails do skip trace validados
- **preferred_phones**: Telefones do skip trace marcados como preferidos
- **preferred_emails**: Emails do skip trace marcados como preferidos
- **manual_phones**: Telefones adicionados manualmente pelo usuário
- **manual_emails**: Emails adicionados manualmente pelo usuário
- **all_available_phones**: Todos os telefones disponíveis (preferidos + manuais)
- **all_available_emails**: Todos os emails disponíveis (preferidos + manuais)
- **dnc_status**: Status DNC ("DNC" ou "Clear")
- **deceased_status**: Status de falecimento ("Deceased" ou "Active")

## Tratamento de Dados

### Formatação de Telefones
- Telefones de 10 dígitos: `(XXX) XXX-XXXX`
- Telefones de 11 dígitos com código 1: `+1 (XXX) XXX-XXXX`
- Outros formatos mantidos como estão

### Validação de Emails
- Emails são validados com regex básico
- Apenas emails válidos são incluídos

### Parsing de JSON
- Campos `preferred_phones` e `preferred_emails` podem estar armazenados como strings JSON
- A API automaticamente faz o parse para arrays quando necessário

## Autenticação

A API requer autenticação via header `Authorization` com uma chave válida do Supabase.

## Limites

- Máximo de 50 propriedades por requisição (configurable via parâmetro `limit`)
- Use paginação para grandes volumes de dados

## Tratamento de Erros

### Respostas de Erro
```json
{
  "error": "Failed to fetch properties",
  "details": "Detailed error message"
}
```

### Códigos de Status
- `200`: Sucesso
- `500`: Erro interno do servidor
- CORS headers incluídos para todas as respostas