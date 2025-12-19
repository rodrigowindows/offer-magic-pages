# 🎯 Sistema de Aprovação e Rastreamento de Usuário

## 📋 O que foi criado

### 1. **Rastreamento de Usuário**
- Registra quem criou cada propriedade
- Registra quem fez a última atualização
- Salva nome do usuário (não apenas ID)
- Atualização automática de timestamp

### 2. **Sistema de Aprovação/Rejeição**
- Status: Pendente, Aprovado, Rejeitado
- 12 razões predefinidas para rejeição
- Campo para notas adicionais
- Registra quem aprovou/rejeitou e quando

### 3. **Componentes React**
- `PropertyApprovalDialog` - Dialog completo de aprovação/rejeição
- `PropertyApprovalFilter` - Filtro por status de aprovação
- `useCurrentUser` - Hook para pegar usuário logado

---

## 🗄️ Migration SQL

**Arquivo:** `supabase/migrations/20251216000001_add_approval_and_user_tracking.sql`

**Colunas adicionadas:**

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `created_by` | uuid | ID do usuário que criou |
| `created_by_name` | text | Nome do usuário que criou |
| `updated_by` | uuid | ID do usuário que atualizou |
| `updated_by_name` | text | Nome do usuário que atualizou |
| `updated_at` | timestamp | Data/hora da última atualização |
| `approval_status` | text | pending/approved/rejected |
| `approved_by` | uuid | ID de quem aprovou/rejeitou |
| `approved_by_name` | text | Nome de quem aprovou/rejeitou |
| `approved_at` | timestamp | Quando foi aprovado/rejeitado |
| `rejection_reason` | text | Razão da rejeição |
| `rejection_notes` | text | Notas adicionais |

**Executar no Supabase Dashboard:**
1. Vá em SQL Editor
2. Cole o conteúdo do arquivo
3. Execute

---

## 🏷️ Razões de Rejeição Predefinidas

```typescript
const REJECTION_REASONS = [
  "too-good-condition"    → Casa muito boa - não está distressed
  "llc-owned"             → Propriedade de LLC
  "commercial"            → Propriedade comercial
  "duplicate"             → Duplicado
  "wrong-location"        → Localização errada
  "no-equity"             → Sem equity suficiente
  "already-contacted"     → Já foi contatado anteriormente
  "occupied-rented"       → Ocupado/Alugado - não distressed
  "recent-sale"           → Venda recente
  "hoa-restrictions"      → Restrições de HOA
  "title-issues"          → Problemas no título
  "other"                 → Outro motivo
];
```

---

## 💻 Como Usar no Admin

### 1. Importar Componentes

```tsx
import { PropertyApprovalDialog } from "@/components/PropertyApprovalDialog";
import { PropertyApprovalFilter } from "@/components/PropertyApprovalFilter";
import { useCurrentUser } from "@/hooks/useCurrentUser";
```

### 2. Pegar Usuário Atual

```tsx
const { userId, userName, userEmail } = useCurrentUser();

// userId: ID do Supabase Auth
// userName: Nome extraído do email ou metadata
// userEmail: Email do usuário
```

### 3. Dialog de Aprovação (para cada propriedade)

```tsx
<PropertyApprovalDialog
  propertyId={property.id}
  propertyAddress={property.address}
  currentStatus={property.approval_status}
  rejectionReason={property.rejection_reason}
  rejectionNotes={property.rejection_notes}
  onStatusChange={() => {
    // Recarregar lista após aprovação/rejeição
    fetchProperties();
  }}
/>
```

**Visual:**
- Badge mostra status atual (Pendente/Aprovado/Rejeitado)
- Clique abre dialog
- Botões: "Aprovar" ou "Rejeitar"
- Se rejeitar: dropdown com 12 razões + campo de notas

### 4. Filtro por Status (topo da lista)

```tsx
const [approvalStatus, setApprovalStatus] = useState("all");
const [statusCounts, setStatusCounts] = useState({
  pending: 0,
  approved: 0,
  rejected: 0,
});

<PropertyApprovalFilter
  selectedStatus={approvalStatus}
  onStatusChange={setApprovalStatus}
  counts={statusCounts}
/>
```

**Visual:**
- 4 botões: Todos, Pendentes, Aprovados, Rejeitados
- Badges com contagem em cada botão
- Cores diferentes (amarelo/verde/vermelho)

### 5. Filtrar Query do Supabase

```tsx
useEffect(() => {
  fetchProperties();
}, [approvalStatus]);

const fetchProperties = async () => {
  let query = supabase.from("properties").select("*");

  // Aplicar filtro de aprovação
  if (approvalStatus !== "all") {
    query = query.eq("approval_status", approvalStatus);
  }

  const { data, error } = await query;

  if (data) {
    setProperties(data);

    // Calcular contagens
    const counts = {
      pending: data.filter(p => p.approval_status === "pending").length,
      approved: data.filter(p => p.approval_status === "approved").length,
      rejected: data.filter(p => p.approval_status === "rejected").length,
    };
    setStatusCounts(counts);
  }
};
```

---

## 🎨 Exemplo Completo - Admin.tsx

```tsx
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { PropertyApprovalDialog } from "@/components/PropertyApprovalDialog";
import { PropertyApprovalFilter } from "@/components/PropertyApprovalFilter";
import { Badge } from "@/components/ui/badge";

const Admin = () => {
  const [properties, setProperties] = useState([]);
  const [approvalStatus, setApprovalStatus] = useState("all");
  const [statusCounts, setStatusCounts] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const { userId, userName } = useCurrentUser();

  useEffect(() => {
    fetchProperties();
  }, [approvalStatus]);

  const fetchProperties = async () => {
    let query = supabase.from("properties").select("*");

    if (approvalStatus !== "all") {
      query = query.eq("approval_status", approvalStatus);
    }

    const { data, error } = await query;

    if (data) {
      setProperties(data);

      const counts = {
        pending: data.filter(p => p.approval_status === "pending").length,
        approved: data.filter(p => p.approval_status === "approved").length,
        rejected: data.filter(p => p.approval_status === "rejected").length,
      };
      setStatusCounts(counts);
    }
  };

  // Função para salvar nova propriedade com rastreamento
  const createProperty = async (propertyData) => {
    const { error } = await supabase.from("properties").insert({
      ...propertyData,
      created_by: userId,
      created_by_name: userName,
      updated_by: userId,
      updated_by_name: userName,
      approval_status: "pending", // Sempre começa pendente
    });

    if (!error) {
      fetchProperties();
    }
  };

  // Função para atualizar propriedade com rastreamento
  const updateProperty = async (propertyId, updates) => {
    const { error } = await supabase
      .from("properties")
      .update({
        ...updates,
        updated_by: userId,
        updated_by_name: userName,
      })
      .eq("id", propertyId);

    if (!error) {
      fetchProperties();
    }
  };

  return (
    <div>
      <h1>Admin - Propriedades</h1>

      {/* Filtro de Aprovação */}
      <div className="mb-6">
        <PropertyApprovalFilter
          selectedStatus={approvalStatus}
          onStatusChange={setApprovalStatus}
          counts={statusCounts}
        />
      </div>

      {/* Lista de Propriedades */}
      <div className="space-y-4">
        {properties.map((property) => (
          <div key={property.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold">{property.address}</h3>
                <p className="text-sm text-muted-foreground">
                  {property.city}, {property.state}
                </p>

                {/* Mostrar quem criou/atualizou */}
                <div className="mt-2 text-xs text-muted-foreground">
                  Criado por: {property.created_by_name || "N/A"}
                  {property.updated_by_name && (
                    <> | Atualizado por: {property.updated_by_name}</>
                  )}
                </div>

                {/* Mostrar razão de rejeição se rejeitado */}
                {property.approval_status === "rejected" && property.rejection_reason && (
                  <div className="mt-2">
                    <Badge variant="destructive">
                      Rejeitado: {property.rejection_reason}
                    </Badge>
                    {property.rejection_notes && (
                      <p className="text-xs text-red-600 mt-1">
                        {property.rejection_notes}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Dialog de Aprovação */}
              <PropertyApprovalDialog
                propertyId={property.id}
                propertyAddress={property.address}
                currentStatus={property.approval_status}
                rejectionReason={property.rejection_reason}
                rejectionNotes={property.rejection_notes}
                onStatusChange={fetchProperties}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Admin;
```

---

## 📊 Queries Úteis

### Ver todas pendentes de aprovação

```tsx
const { data } = await supabase
  .from("properties")
  .select("*")
  .eq("approval_status", "pending")
  .order("created_at", { ascending: false });
```

### Ver todas aprovadas por um usuário específico

```tsx
const { data } = await supabase
  .from("properties")
  .select("*")
  .eq("approved_by_name", "João Silva")
  .eq("approval_status", "approved");
```

### Ver todas rejeitadas por razão específica

```tsx
const { data } = await supabase
  .from("properties")
  .select("*")
  .eq("approval_status", "rejected")
  .eq("rejection_reason", "llc-owned");
```

### Estatísticas de aprovação

```tsx
const { data } = await supabase
  .from("properties")
  .select("approval_status");

const stats = {
  total: data.length,
  pending: data.filter(p => p.approval_status === "pending").length,
  approved: data.filter(p => p.approval_status === "approved").length,
  rejected: data.filter(p => p.approval_status === "rejected").length,
};
```

---

## ✅ Checklist de Implementação

- [ ] Executar migration SQL no Supabase
- [ ] Importar `useCurrentUser` hook
- [ ] Adicionar `PropertyApprovalDialog` em cada propriedade
- [ ] Adicionar `PropertyApprovalFilter` no topo da lista
- [ ] Atualizar função de criar propriedade para incluir `created_by`
- [ ] Atualizar função de editar propriedade para incluir `updated_by`
- [ ] Testar aprovação de propriedade
- [ ] Testar rejeição com diferentes razões
- [ ] Testar filtros por status

---

## 🎯 Workflow de Aprovação

```
1. Propriedade importada do Step 4
   ↓
   approval_status = "pending"
   created_by = ID do usuário
   created_by_name = Nome do usuário

2. Usuário revisa propriedade no Admin
   ↓
   Clica no badge de status
   ↓
   Abre PropertyApprovalDialog

3a. APROVAR:
   ↓
   approval_status = "approved"
   approved_by = ID do usuário
   approved_by_name = Nome do usuário
   approved_at = Agora
   ↓
   Propriedade vai para próxima etapa

3b. REJEITAR:
   ↓
   Seleciona razão (ex: "llc-owned")
   Adiciona notas opcionais
   ↓
   approval_status = "rejected"
   approved_by = ID do usuário
   rejection_reason = "llc-owned"
   rejection_notes = "LLC com 5 propriedades"
   ↓
   Propriedade não vai para próxima etapa
```

---

## 🚀 Pronto para Usar!

Todos os componentes estão criados e prontos para integrar no Admin.tsx.

**Lembre-se:**
1. Executar migration primeiro
2. Testar com um usuário autenticado
3. Verificar que Supabase Auth está configurado

**Dúvidas?** Veja o código em:
- `src/hooks/useCurrentUser.ts`
- `src/components/PropertyApprovalDialog.tsx`
- `src/components/PropertyApprovalFilter.tsx`
