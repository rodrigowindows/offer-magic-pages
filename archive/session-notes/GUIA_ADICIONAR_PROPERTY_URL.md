# 🔗 Guia: Como Adicionar {property_url} nos Templates

## 📋 Variável para Usar

Use a variável `{property_url}` em qualquer template. Ela será substituída automaticamente por:

```
https://offer.mylocalinvest.com/property/25217-mathew-st-unincorporated-32709?src=sms
```

O parâmetro `?src=` muda automaticamente baseado no canal:
- SMS: `?src=sms`
- Email: `?src=email`
- Call: `?src=call`

---

## 📱 **SMS Templates**

### Formato Recomendado:
```
Hi {name}! {cash_offer} cash for {address} {city} {zip_code}.
No repairs, close in 7 days. Reply YES → {property_url}
```

### Exemplo Real:
```
Hi BURROWS! $70,000 cash for 25217 MATHEW ST UNINCORPORATED 32709.
No repairs, close in 7 days. Reply YES → https://offer.mylocalinvest.com/property/25217-mathew-st-unincorporated-32709?src=sms
```

### Variações:

**Follow-up SMS:**
```
Hi {name}, our {cash_offer} offer for {address} is still available!
No fees, fast close. View offer: {property_url} Call: {phone}
```

**Urgent SMS:**
```
🚨 LAST CHANCE: {cash_offer} cash offer expires soon!
View now: {property_url} Reply YES or call: {phone}
```

---

## 📧 **Email Templates**

### Onde Adicionar no HTML:

#### 1. **Call-to-Action Button** (Recomendado)
```html
<div style="text-align: center; margin: 30px 0;">
  <a href="{property_url}"
     style="background-color: #667eea;
            color: #ffffff;
            padding: 15px 40px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            display: inline-block;">
    View Your Cash Offer
  </a>
</div>
```

#### 2. **Link de Texto**
```html
<p style="text-align: center;">
  <a href="{property_url}"
     style="color: #667eea;
            text-decoration: none;
            font-weight: bold;">
    Click here to view your personalized offer page
  </a>
</p>
```

#### 3. **QR Code Section** (Melhor Opção)
```html
<div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
  <p style="font-size: 14px; color: #666; margin: 0 0 15px 0;">
    Scan to view your personalized offer page:
  </p>
  <img src="{qr_code_url}"
       alt="QR Code"
       style="width: 200px;
              height: 200px;
              margin: 0 auto;
              display: block;
              border: 4px solid #ffffff;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
  <p style="font-size: 12px; color: #999; margin: 15px 0 0 0;">
    Or click here:
    <a href="{property_url}"
       style="color: #667eea;
              text-decoration: none;
              font-weight: bold;">
      View Full Offer Details
    </a>
  </p>
</div>
```

---

## 📞 **Voicemail/Call Templates**

### Formato Recomendado:
```
Hi {name}, this is {seller_name} from {company_name}.

We have a cash offer of {cash_offer} for your property at {address}.
We can close in as little as 7 days with no repairs needed.

View your complete offer details at {property_url}
or call us back at {phone}.

Thank you!
```

---

## 🎨 **Template Completo de Email (Exemplo)**

### Para Copiar e Usar no Editor:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cash Offer</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="padding: 40px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Cash Offer for Your Property</h1>
      </td>
    </tr>

    <!-- Content -->
    <tr>
      <td style="padding: 40px 30px;">
        <p style="font-size: 16px; color: #333; line-height: 1.6;">Dear {name},</p>
        <p style="font-size: 16px; color: #333; line-height: 1.6;">
          We are pleased to present you with a cash offer for your property at:
        </p>

        <!-- Property Address -->
        <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; font-size: 18px; color: #333; font-weight: bold;">{address}</p>
          <p style="margin: 5px 0 0; color: #666;">{city}, {state} {zip_code}</p>
        </div>

        <!-- Cash Offer -->
        <div style="text-align: center; margin: 30px 0;">
          <p style="font-size: 14px; color: #666; margin: 0;">Our Cash Offer</p>
          <p style="font-size: 36px; color: #28a745; font-weight: bold; margin: 10px 0;">{cash_offer}</p>
        </div>

        <p style="font-size: 16px; color: #333; line-height: 1.6;">
          This offer is valid for 7 days. Contact us to discuss!
        </p>

        <!-- Call Button -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="tel:{phone}"
             style="background-color: #667eea;
                    color: #ffffff;
                    padding: 15px 40px;
                    text-decoration: none;
                    border-radius: 5px;
                    font-weight: bold;
                    display: inline-block;">
            Call Us: {phone}
          </a>
        </div>

        <!-- QR Code Section - IMPORTANTE -->
        <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
          <p style="font-size: 14px; color: #666; margin: 0 0 15px 0;">
            Scan to view your personalized offer page:
          </p>
          <img src="{qr_code_url}"
               alt="QR Code"
               style="width: 200px;
                      height: 200px;
                      margin: 0 auto;
                      display: block;
                      border: 4px solid #ffffff;
                      box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
          <p style="font-size: 12px; color: #999; margin: 15px 0 0 0;">
            Or click here:
            <a href="{property_url}"
               style="color: #667eea;
                      text-decoration: none;
                      font-weight: bold;">
              View Full Offer Details
            </a>
          </p>
        </div>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 20px 30px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #eee;">
        <p style="margin: 0; color: #666; font-size: 14px; font-weight: bold;">{company_name}</p>
        <p style="margin: 5px 0; color: #999; font-size: 12px;">Trusted Miami Investors Since 2015</p>
        <p style="margin: 10px 0 5px; color: #999; font-size: 11px;">
          <a href="{unsubscribe_url}" style="color: #999; text-decoration: underline;">Unsubscribe</a> |
          <a href="mailto:info@mylocalinvest.com" style="color: #999; text-decoration: underline;">Contact Us</a>
        </p>
        <p style="margin: 5px 0 0; color: #ccc; font-size: 10px;">
          Zero commissions • Zero closing costs • 100% confidential
        </p>
      </td>
    </tr>
  </table>
  {tracking_pixel}
</body>
</html>
```

---

## 🔑 **Todas as Variáveis Disponíveis:**

```
{name}               → Nome do proprietário
{address}            → Endereço da propriedade
{city}               → Cidade
{state}              → Estado
{zip_code}           → CEP
{cash_offer}         → Valor da oferta em dinheiro
{company_name}       → Nome da empresa
{phone}              → Telefone de contato
{seller_name}        → Nome do vendedor/agente
{estimated_value}    → Valor estimado da propriedade
{offer_percentage}   → Porcentagem da oferta vs valor estimado
{property_url}       → ⭐ URL da página de oferta com tracking
{qr_code_url}        → ⭐ URL do QR code gerado
{unsubscribe_url}    → Link para cancelar inscrição
{tracking_pixel}     → Pixel de tracking (apenas emails)
{source_channel}     → Canal de origem (SMS/EMAIL/CALL)
```

---

## ✅ **Checklist ao Criar/Editar Templates:**

### Para SMS:
- [ ] Incluir `{property_url}` no final da mensagem
- [ ] Manter mensagem curta (< 160 caracteres se possível)
- [ ] Incluir call-to-action clara ("Reply YES", "View offer", etc.)

### Para Email:
- [ ] Incluir botão com link `{property_url}`
- [ ] Incluir QR code com `{qr_code_url}`
- [ ] Incluir link de texto também (fallback)
- [ ] Incluir `{unsubscribe_url}` no rodapé
- [ ] Incluir `{tracking_pixel}` antes do `</body>`

### Para Call/Voicemail:
- [ ] Mencionar verbalmente a URL `{property_url}`
- [ ] Falar devagar e claramente
- [ ] Oferecer alternativa (ligar de volta)

---

## 🎯 **Como Testar:**

1. Edite o template no Template Manager
2. Adicione `{property_url}` onde desejar
3. Clique em "Preview"
4. Verifique se a URL aparece corretamente:
   - `https://offer.mylocalinvest.com/property/...?src=sms` (ou email/call)

---

## 💡 **Dicas:**

1. **Sempre use `{property_url}`** ao invés de URL fixa
2. **QR codes são essenciais** para emails (alta conversão mobile)
3. **Mantenha SMS curtos** mas sempre com link
4. **Use tracking** - o `?src=` permite medir qual canal converte melhor
5. **Teste no mobile** - maioria das pessoas abre no celular
