## Objetivo

Reorganizar a seção de contato da página pública de oferta seguindo o mockup, com hierarquia de CTAs orientados a intenção do lead, mantendo WhatsApp/SMS/Email pessoais como canais secundários.

## Contatos a usar

- **WhatsApp pessoal**: `+1 240 581 4595`
- **SMS pessoal**: `+1 240 581 4595`
- **Email pessoal**: `rodrigowindows@gmail.com`
- **Call Us / fallback**: `(786) 882-8251` (mantém o existente)

## Nova hierarquia de CTAs (substitui a lista atual)

```text
[ 🟢 Increase My Offer ]        ← primário (verde, destaque)
[ 🔵 Schedule a Call ]          ← secundário (azul)
[ 📍 Schedule a Visit to Improve the Price ]
[ 💬 WhatsApp ]   [ 📱 SMS ]   ← lado a lado
[ ✉️ Email ]      [ 📞 Call Us ]
[ ⬇ Download PDF ]              ← terciário discreto
```

## Mudanças no código

### 1. Novo componente `src/components/offer/OfferActionsHub.tsx`
Substitui o bloco vertical de canais em `CashOfferSectionB` (ou onde está hoje a lista WhatsApp/SMS/Email/Schedule/Call). Renderiza os botões na hierarquia acima.

### 2. Novo modal `src/components/offer/IncreaseOfferModal.tsx`
- Campos: `desired_amount` (USD, validação Zod > current offer), `reason` (textarea), `name`, `phone` (10 dígitos), `email`.
- Submit → insere em `lead_activities` (ou nova coluna `counter_offer_amount` em `properties` via Edge Function `capture-lead`) e cria `notifications` (`event_type: 'counter_offer'`).
- Toast de confirmação: "We received your counter-offer. We'll respond within 24h."

### 3. Novo modal `src/components/offer/ScheduleVisitModal.tsx`
- Reusa Calendly URL de `contact_settings.calendly_url` se existir; senão mostra formulário simples (nome, telefone, 3 horários preferidos) que grava em `follow_up_reminders` com `reminder_type: 'visit'`.

### 4. Links diretos (sem modal)
- **WhatsApp**: `https://wa.me/12405814595?text=Hi! I'm interested in the offer for {address}`
- **SMS**: `sms:+12405814595?body=Hi! Re: offer for {address}`
- **Email**: `mailto:rodrigowindows@gmail.com?subject=Re: Cash offer for {address}`
- **Call Us**: `tel:+17868828251`
- **Download PDF**: chama o gerador existente (`src/utils/pdf/exportSingleCMA.ts` ou `cash-offer-letter`).

Todos com encoding seguro (`encodeURIComponent`) no endereço da propriedade.

### 5. Atualizar `contact_settings` (defaults no código, não DB)
Os números pessoais ficam hardcoded como fallback no novo componente, mas continuam lendo `contact_settings` do banco se preenchido — assim você pode trocar depois pelo admin sem mexer no código.

### 6. Tracking
Cada CTA dispara `trackEvent` (já existe `track-button-click` Edge Function) com `action`: `increase_offer | schedule_call | schedule_visit | whatsapp | sms | email | call | download_pdf`.

### 7. Acessibilidade
- `data-action` em todos os botões (padrão do projeto)
- DialogTitle obrigatório nos modais (Radix)
- Validação Zod nos formulários

## Fora do escopo (fica para depois)
- Integração WhatsApp via Twilio (por enquanto só link `wa.me`)
- Notificação push/email pra você quando alguém clica (já fica registrado em `notifications` e dá pra ver no admin)

Confirma que pode seguir? Se quiser, ajusto o texto dos botões ou a ordem antes de implementar.