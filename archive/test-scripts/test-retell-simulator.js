/**
 * SIMULADOR RETELL AI - Testa webhook como se fosse o Retell AI
 *
 * Como usar:
 * node test-retell-simulator.js
 * node test-retell-simulator.js +14075551234
 */

const WEBHOOK_URL = 'https://atwdkhlyrffbaugkaker.supabase.co/functions/v1/retell-webhook-handler';

// Simulação: Chamada recebida (inbound call)
async function simulateRetellWebhook(fromNumber) {
  console.log('\n========================================');
  console.log('📞 SIMULANDO RETELL AI WEBHOOK');
  console.log('========================================\n');

  const payload = {
    event: 'call_ended',
    call: {
      call_id: `retell_${Date.now()}`,
      call_type: 'phone_call',
      from_number: fromNumber,
      to_number: '+14075559999',
      direction: 'inbound',
      call_status: 'ended',
      start_timestamp: Date.now() - 120000,
      end_timestamp: Date.now(),
      disconnection_reason: 'user_hangup',
      transcript: `Hello, I'm calling about selling my property. My number is ${fromNumber}.`,
      transcript_object: [
        { role: 'agent', content: 'Hello! Thank you for calling. How can I help you today?' },
        { role: 'user', content: 'Hi, I want to sell my house and get a cash offer.' },
        { role: 'agent', content: 'Great! I can help you with that. Can you tell me the address?' },
        { role: 'user', content: 'It\'s on Main Street in Orlando.' }
      ],
      metadata: {
        campaign: 'Orlando Properties',
        source: 'inbound_call',
        test_mode: true
      },
      retell_llm_dynamic_variables: {
        customer_name: 'Property Owner'
      }
    }
  };

  console.log('📤 Enviando para:', WEBHOOK_URL);
  console.log('📞 Número do caller:', fromNumber);
  console.log('\n📦 Payload (como Retell AI envia):\n');
  console.log(JSON.stringify(payload, null, 2));
  console.log('\n⏳ Aguardando resposta...\n');

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Retell-Webhook/1.0'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    console.log('========================================');
    console.log('✅ RESPOSTA DO SEU WEBHOOK');
    console.log('========================================\n');

    console.log('HTTP Status:', response.status, response.statusText);
    console.log('\n📦 JSON Resposta:\n');
    console.log(JSON.stringify(data, null, 2));

    // Análise da resposta
    console.log('\n========================================');
    console.log('📊 ANÁLISE');
    console.log('========================================\n');

    if (data.success) {
      console.log('✅ Webhook processado com SUCESSO!\n');

      if (data.result.property_found) {
        console.log('🎉 PROPRIEDADE ENCONTRADA!\n');
        console.log('📍 Endereço:', data.result.property_info.address);
        console.log('🏙️  Cidade:', `${data.result.property_info.city}, ${data.result.property_info.state} ${data.result.property_info.zip_code}`);
        console.log('👤 Owner:', data.result.property_info.owner_name || 'N/A');
        console.log('💰 Valor Estimado:', data.result.property_info.estimated_value ? `$${data.result.property_info.estimated_value.toLocaleString()}` : 'N/A');
        console.log('💵 Cash Offer:', data.result.property_info.cash_offer_amount ? `$${data.result.property_info.cash_offer_amount.toLocaleString()}` : 'N/A');
        console.log('🔍 Matched by:', data.result.matched_by);

        if (data.result.skip_trace_data) {
          console.log('\n📞 SKIP TRACE DATA:');
          console.log('   📱 Total Phones:', data.result.skip_trace_data.total_phones);
          console.log('   📧 Total Emails:', data.result.skip_trace_data.total_emails);
          console.log('   🚫 DNC Status:', data.result.skip_trace_data.dnc_status);
          console.log('   ⚰️  Deceased:', data.result.skip_trace_data.deceased_status);

          if (data.result.skip_trace_data.preferred_phones?.length > 0) {
            console.log('   ⭐ Preferred Phones:', data.result.skip_trace_data.preferred_phones.join(', '));
          }
          if (data.result.skip_trace_data.preferred_emails?.length > 0) {
            console.log('   ⭐ Preferred Emails:', data.result.skip_trace_data.preferred_emails.join(', '));
          }
        }
      } else {
        console.log('❌ Propriedade NÃO ENCONTRADA\n');
        console.log('📞 Número buscado:', fromNumber);
        console.log('\n💡 Sugestões:');
        console.log('   - Verifique se o número existe no banco de dados');
        console.log('   - Tente formatos: +14075551234, 14075551234, 4075551234');
        console.log('   - Verifique campos: phone1, phone2, owner_phone');
      }
    } else {
      console.log('❌ WEBHOOK FALHOU!\n');
      console.log('Erro:', data.error);
    }

    console.log('\n========================================\n');

    return data;
  } catch (error) {
    console.log('========================================');
    console.log('❌ ERRO AO CHAMAR WEBHOOK');
    console.log('========================================\n');
    console.error('Mensagem:', error.message);
    console.log('\n⚠️  Possíveis causas:');
    console.log('   1. Função não deployada no Supabase');
    console.log('   2. Problema de rede/firewall');
    console.log('   3. URL incorreta');
    console.log('\n💡 Solução:');
    console.log('   Deploy: supabase functions deploy retell-webhook-handler');
    console.log('\n========================================\n');
    return { success: false, error: error.message };
  }
}

// Testar múltiplos números
async function testMultipleNumbers() {
  const testNumbers = [
    { phone: '+14075551234', desc: 'Formato completo com +1' },
    { phone: '4075551234', desc: 'Apenas 10 dígitos' },
    { phone: '+14075555678', desc: 'Outro número teste' },
    { phone: '+19999999999', desc: 'Número desconhecido (deve falhar)' }
  ];

  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   SIMULADOR RETELL AI - MULTI TEST   ║');
  console.log('╚════════════════════════════════════════╝\n');

  for (let i = 0; i < testNumbers.length; i++) {
    const { phone, desc } = testNumbers[i];
    console.log(`\n📋 Teste ${i + 1}/${testNumbers.length}: ${desc}`);

    try {
      await simulateRetellWebhook(phone);
    } catch (error) {
      console.log(`⚠️  Teste ${i + 1} teve erro. Continuando...\n`);
    }

    if (i < testNumbers.length - 1) {
      console.log('⏸️  Aguardando 2 segundos antes do próximo teste...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('\n✅ TODOS OS TESTES CONCLUÍDOS!\n');
}

// Executar
const args = process.argv.slice(2);

if (args[0] === '--all' || args[0] === '-a') {
  console.log('🎯 Modo: Testar múltiplos números\n');
  testMultipleNumbers();
} else if (args[0]) {
  console.log(`🎯 Modo: Testar número específico\n`);
  simulateRetellWebhook(args[0]);
} else {
  console.log('🎯 Modo: Teste padrão com +14075551234\n');
  simulateRetellWebhook('+14075551234');
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { simulateRetellWebhook, testMultipleNumbers };
}
