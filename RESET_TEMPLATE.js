/**
 * SCRIPT PARA RESETAR O TEMPLATE "Professional Cash Offer"
 *
 * INSTRUÇÕES:
 * 1. Abra o site: https://offer.mylocalinvest.com/marketing/templates
 * 2. Abra o DevTools (F12)
 * 3. Vá na aba Console
 * 4. Cole este código completo e pressione Enter
 * 5. Recarregue a página (F5)
 */

// Pegar o estado atual do localStorage
const storageKey = 'marketing-storage';
const storage = localStorage.getItem(storageKey);

if (!storage) {
  console.error('❌ Não encontrou marketing-storage no localStorage');
} else {
  const data = JSON.parse(storage);
  console.log('📦 Estado atual:', data);

  // Encontrar o template "Professional Cash Offer"
  const templates = data.state?.templates || [];
  const templateIndex = templates.findIndex(t => t.id === 'email-cash-offer-default');

  if (templateIndex === -1) {
    console.error('❌ Template "email-cash-offer-default" não encontrado');
  } else {
    console.log('✅ Template encontrado:', templates[templateIndex]);
    console.log('📌 Versão atual:', templates[templateIndex].version || 1);
    console.log('📝 Editado manualmente:', templates[templateIndex].edited_manually);

    // OPÇÃO 1: Resetar edited_manually para false e version para 1
    // Isso vai forçar o código a atualizar o template na próxima vez
    templates[templateIndex].edited_manually = false;
    templates[templateIndex].version = 1; // Vai forçar update porque código tem version 3

    // Salvar de volta
    data.state.templates = templates;
    localStorage.setItem(storageKey, JSON.stringify(data));

    console.log('✅ Template resetado com sucesso!');
    console.log('🔄 Recarregue a página (F5) para aplicar as mudanças');
  }
}
