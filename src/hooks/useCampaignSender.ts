/**
 * Hook for campaign sending logic, validation, simulation, and health checks.
 * Extracted from CampaignManager for modularity.
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useMarketingStore } from '@/store/marketingStore';
import { sendSMS, sendEmail, initiateCall, checkHealth } from '@/services/marketingService';
import { supabase } from '@/integrations/supabase/client';
import { getAllEmails, type CampaignProperty } from '@/hooks/useCampaignContacts';
import type { Channel } from '@/types/marketing.types';
import type { CampaignTemplate, SimulationResult, SystemHealthStatus, CampaignValidationIssue, ContactValidationStats } from '@/types/campaign.types';

export interface ProgressStats {
  completed: number;
  total: number;
  success: number;
  fail: number;
  successCount: number;
  failCount: number;
  estimatedTimeRemaining: string;
}

const INITIAL_PROGRESS: ProgressStats = {
  completed: 0, total: 0, success: 0, fail: 0,
  successCount: 0, failCount: 0, estimatedTimeRemaining: '0s',
};

interface UseCampaignSenderOptions {
  selectedChannel: Channel;
  selectedTemplate: CampaignTemplate | undefined;
  smsDelay: number;
  getAllPhones: (prop: CampaignProperty) => string[];
  generateTemplateContent: (template: { body: string; subject?: string }, prop: CampaignProperty, trackingId?: string) => { content: string; subject: string };
}

export const useCampaignSender = ({
  selectedChannel,
  selectedTemplate,
  smsDelay,
  getAllPhones,
  generateTemplateContent,
}: UseCampaignSenderOptions) => {
  const { toast } = useToast();
  const settings = useMarketingStore((state) => state.settings);
  const [sending, setSending] = useState(false);
  const [progressStats, setProgressStats] = useState<ProgressStats>(INITIAL_PROGRESS);

  const updateProgress = useCallback((completed: number, total: number, success: number, fail: number) => {
    const remaining = total - completed;
    const baseTime = 0.5;
    const delaySeconds = selectedChannel === 'sms' ? smsDelay / 1000 : 0;
    const avgTime = baseTime + delaySeconds;
    const estimatedSeconds = Math.round(remaining * avgTime);
    const estimatedTimeRemaining = estimatedSeconds > 60
      ? `${Math.round(estimatedSeconds / 60)}m`
      : `${estimatedSeconds}s`;
    setProgressStats({ completed, total, success, fail, successCount: success, failCount: fail, estimatedTimeRemaining });
  }, [selectedChannel, smsDelay]);

  const processPropertySend = useCallback(async (prop: CampaignProperty, globalIndex: number) => {
    try {
      const fullAddress = `${prop.address}, ${prop.city}, ${prop.state} ${prop.zip_code}`;
      const allPhones = getAllPhones(prop);
      const allEmails = getAllEmails(prop);
      let sent = false;
      let messagesSent = 0;
      let lastError: unknown = null;
      const trackingId = crypto.randomUUID();

      if (selectedChannel === 'sms') {
        if (allPhones.length === 0) return { success: false, property: prop, error: 'No phone available', messagesSent: 0 };
        const { content } = generateTemplateContent(selectedTemplate!, prop, trackingId);
        for (let i = 0; i < allPhones.length; i++) {
          if (i > 0 && smsDelay > 0) await new Promise(r => setTimeout(r, smsDelay));
          try {
            await sendSMS({ phone_number: allPhones[i], body: content });
            await supabase.from('campaign_logs').insert({
              tracking_id: trackingId, campaign_type: 'manual', channel: 'sms', status: 'sent',
              html_content: content, property_id: prop.id, recipient_phone: allPhones[i],
              recipient_name: prop.owner_name || 'Owner', property_address: fullAddress,
              sent_at: new Date().toISOString(),
              metadata: { template_id: selectedTemplate!.id, template_name: selectedTemplate!.name, contact_index: i, total_contacts: allPhones.length, batch_index: globalIndex, sms_delay_ms: smsDelay },
            });
            messagesSent++;
            sent = true;
          } catch (error) { lastError = error; }
        }
      } else if (selectedChannel === 'email') {
        if (allEmails.length === 0) return { success: false, property: prop, error: 'No email available', messagesSent: 0 };
        const { content, subject } = generateTemplateContent(selectedTemplate!, prop, trackingId);
        for (const email of allEmails) {
          try {
            await sendEmail({ receiver_email: email, subject, message_body: content });
            await supabase.from('campaign_logs').insert({
              tracking_id: trackingId, campaign_type: 'manual', channel: 'email', status: 'sent',
              html_content: content, property_id: prop.id, recipient_email: email,
              recipient_name: prop.owner_name || 'Owner', property_address: fullAddress,
              sent_at: new Date().toISOString(),
              metadata: { template_id: selectedTemplate!.id, template_name: selectedTemplate!.name, contact_index: allEmails.indexOf(email), total_contacts: allEmails.length, subject, batch_index: globalIndex },
            });
            messagesSent++;
            sent = true;
          } catch (error) { lastError = error; }
        }
      } else if (selectedChannel === 'call') {
        if (allPhones.length === 0) return { success: false, property: prop, error: 'No phone available', messagesSent: 0 };
        const { content } = generateTemplateContent(selectedTemplate!, prop, trackingId);
        for (const phone of allPhones) {
          try {
            await initiateCall({
              name: prop.owner_name || 'Owner', address: fullAddress,
              from_number: settings.company.contact_phone, to_number: phone,
              voicemail_drop: content, seller_name: settings.company.company_name,
            });
            await supabase.from('campaign_logs').insert({
              tracking_id: trackingId, campaign_type: 'manual', channel: 'call', status: 'sent',
              html_content: content, property_id: prop.id, recipient_phone: phone,
              recipient_name: prop.owner_name || 'Owner', property_address: fullAddress,
              sent_at: new Date().toISOString(),
              metadata: { template_id: selectedTemplate!.id, template_name: selectedTemplate!.name, contact_index: allPhones.indexOf(phone), total_contacts: allPhones.length, batch_index: globalIndex },
            });
            messagesSent++;
            sent = true;
          } catch (error) { lastError = error; }
        }
      }
      return { success: sent, property: prop, error: sent ? null : lastError, messagesSent };
    } catch (error) {
      return { success: false, property: prop, error, messagesSent: 0 };
    }
  }, [selectedChannel, selectedTemplate, smsDelay, getAllPhones, generateTemplateContent, settings.company]);

  const performSystemHealthCheck = useCallback(async (): Promise<SystemHealthStatus> => {
    const result: SystemHealthStatus = { api: false, database: false, services: [], warnings: [] };
    try { await checkHealth(); result.api = true; result.services.push('API de comunicação'); } catch { result.warnings.push('API de comunicação indisponível'); }
    try {
      const { error } = await supabase.from('campaign_logs').select('count').limit(1);
      if (!error) { result.database = true; result.services.push('Banco de dados'); }
    } catch { result.warnings.push('Erro de conexão com banco de dados'); }
    return result;
  }, []);

  const validateContactsForChannel = useCallback((properties: CampaignProperty[], channel: Channel): { errors: CampaignValidationIssue[]; warnings: CampaignValidationIssue[]; stats: ContactValidationStats } => {
    const errors: CampaignValidationIssue[] = [];
    const warnings: CampaignValidationIssue[] = [];
    let totalContacts = 0, propertiesWithContacts = 0, propertiesWithoutContacts = 0;

    properties.forEach(prop => {
      const phones = getAllPhones(prop);
      const emails = getAllEmails(prop);
      if (channel === 'sms' || channel === 'call') {
        if (phones.length === 0) propertiesWithoutContacts++;
        else { propertiesWithContacts++; totalContacts += phones.length; }
      } else if (channel === 'email') {
        if (emails.length === 0) propertiesWithoutContacts++;
        else { propertiesWithContacts++; totalContacts += emails.length; }
      }
    });

    if (propertiesWithContacts === 0 && propertiesWithoutContacts > 0) {
      errors.push({ type: 'error', message: `Nenhuma propriedade tem ${channel === 'email' ? 'email' : 'telefone'} válido` });
    } else if (propertiesWithoutContacts > 0) {
      warnings.push({ type: 'warning', message: `${propertiesWithoutContacts} propriedades serão puladas automaticamente por não terem ${channel === 'email' ? 'email' : 'telefone'} válido` });
    }
    if (propertiesWithContacts > 0 && totalContacts > propertiesWithContacts * 2) {
      warnings.push({ type: 'warning', message: `Algumas propriedades têm múltiplos contatos (${totalContacts} total). O sistema tentará todos sequencialmente.` });
    }
    return { errors, warnings, stats: { totalContacts, propertiesWithContacts, propertiesWithoutContacts } };
  }, [getAllPhones]);

  const validateTemplateContent = useCallback((template: CampaignTemplate | undefined, channel: Channel): CampaignValidationIssue[] => {
    const issues: CampaignValidationIssue[] = [];
    if (!template) return issues;
    const body = template.body || '';
    ['name', 'address'].forEach(v => {
      if (!body.includes(`{${v}}`)) issues.push({ type: 'warning', message: `Template não contém variável obrigatória: {${v}}` });
    });
    if (channel === 'sms' && body.length > 160) {
      issues.push({ type: 'warning', message: `SMS muito longo (${body.length} chars). Pode ser dividido em múltiplas mensagens.` });
    }
    return issues;
  }, []);

  const validateCampaignReadiness = useCallback((selectedProps: CampaignProperty[]): CampaignValidationIssue[] => {
    const issues: CampaignValidationIssue[] = [];
    if (selectedProps.length === 0) issues.push({ type: 'error', message: 'Nenhuma propriedade selecionada' });
    if (!selectedTemplate) issues.push({ type: 'error', message: 'Nenhum template selecionado' });
    const cv = validateContactsForChannel(selectedProps, selectedChannel);
    issues.push(...cv.errors, ...cv.warnings);
    if (selectedProps.length > 50) issues.push({ type: 'warning', message: `${selectedProps.length} propriedades selecionadas. Considere dividir em campanhas menores.` });
    issues.push(...validateTemplateContent(selectedTemplate, selectedChannel));
    return issues;
  }, [selectedTemplate, selectedChannel, validateContactsForChannel, validateTemplateContent]);

  const simulateCampaignSend = useCallback((selectedProps: CampaignProperty[]): SimulationResult => {
    const sim: SimulationResult = { total: selectedProps.length, wouldSend: 0, wouldFail: 0, contactBreakdown: [], estimatedCost: 0, estimatedTime: 0 };
    selectedProps.forEach(prop => {
      const phones = getAllPhones(prop);
      const emails = getAllEmails(prop);
      if (selectedChannel === 'sms' && phones.length > 0) { sim.wouldSend++; sim.contactBreakdown.push({ property: prop.address, contacts: phones, channel: 'SMS' }); sim.estimatedCost += phones.length * 0.05; }
      else if (selectedChannel === 'email' && emails.length > 0) { sim.wouldSend++; sim.contactBreakdown.push({ property: prop.address, contacts: emails, channel: 'Email' }); }
      else if (selectedChannel === 'call' && phones.length > 0) { sim.wouldSend++; sim.contactBreakdown.push({ property: prop.address, contacts: phones, channel: 'Call' }); sim.estimatedCost += phones.length * 0.10; }
      else sim.wouldFail++;
    });
    sim.estimatedTime = Math.ceil(selectedProps.length / 5);
    return sim;
  }, [selectedChannel, getAllPhones]);

  const executeCampaignSend = useCallback(async (selectedProps: CampaignProperty[], onComplete: () => void) => {
    // Filter to only properties with valid contacts for the channel
    const validProps = selectedProps.filter(prop => {
      if (selectedChannel === 'email') return getAllEmails(prop).length > 0;
      return getAllPhones(prop).length > 0;
    });
    const skippedCount = selectedProps.length - validProps.length;

    if (validProps.length === 0) {
      toast({ title: 'Nenhum contato válido', description: `Nenhuma propriedade tem ${selectedChannel === 'email' ? 'email' : 'telefone'} disponível.`, variant: 'destructive' });
      return;
    }

    if (skippedCount > 0) {
      toast({ title: `⏭️ ${skippedCount} propriedades puladas`, description: `Sem ${selectedChannel === 'email' ? 'email' : 'telefone'} válido. Enviando para ${validProps.length} propriedades.` });
    }

    setSending(true);
    let successCount = 0, failCount = 0, totalMessagesSent = 0, completedCount = 0;
    const batchSize = 5;
    updateProgress(0, validProps.length, 0, 0);

    // SMS/Call: send sequentially with user-configured delay to avoid rate limits
    // Email: send in parallel batches for speed
    if (selectedChannel === 'sms' || selectedChannel === 'call') {
      for (let i = 0; i < validProps.length; i++) {
        if (i > 0 && smsDelay > 0) {
          console.log(`[Campaign] Aguardando delay de ${smsDelay}ms antes do próximo envio...`);
          await new Promise(r => setTimeout(r, smsDelay));
        }
        const result = await processPropertySend(validProps[i], i);
        completedCount++;
        if (result.success) { successCount++; totalMessagesSent += result.messagesSent || 1; }
        else { failCount++; }
        updateProgress(completedCount, validProps.length, successCount, failCount);
      }
    } else {
      for (let batchStart = 0; batchStart < validProps.length; batchStart += batchSize) {
        const batch = validProps.slice(batchStart, Math.min(batchStart + batchSize, validProps.length));
        const results = await Promise.allSettled(batch.map((prop, i) => processPropertySend(prop, batchStart + i)));
        results.forEach((result) => {
          completedCount++;
          if (result.status === 'fulfilled' && result.value.success) { successCount++; totalMessagesSent += result.value.messagesSent || 1; }
          else { failCount++; }
          updateProgress(completedCount, validProps.length, successCount, failCount);
        });
        if (batchStart + batchSize < validProps.length) await new Promise(r => setTimeout(r, 500));
      }
    }

    setSending(false);
    const totalSent = successCount + failCount;
    const successRate = totalSent > 0 ? Math.round((successCount / totalSent) * 100) : 0;
    const title = successRate === 100 ? '🏆 Campanha Perfeita!' : successRate >= 80 ? '✅ Campanha Concluída!' : '📊 Campanha Concluída';
    const skippedMsg = skippedCount > 0 ? ` (${skippedCount} puladas sem contato)` : '';
    toast({ title, description: `${totalMessagesSent} mensagens enviadas para ${successCount} propriedades${failCount > 0 ? `, ${failCount} falharam` : ''}${skippedMsg}. Taxa: ${successRate}%` });
    if (failCount > 0) setTimeout(() => toast({ title: '💡 Dica', description: `${failCount} envios falharam. Selecione novamente para tentar.` }), 2000);
    setProgressStats(INITIAL_PROGRESS);
    onComplete();
  }, [selectedChannel, getAllPhones, processPropertySend, updateProgress, toast]);

  return {
    sending, progressStats,
    performSystemHealthCheck,
    validateCampaignReadiness,
    simulateCampaignSend,
    executeCampaignSend,
  };
};
