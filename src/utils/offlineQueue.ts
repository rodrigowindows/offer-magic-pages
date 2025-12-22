/**
 * Offline Queue Manager
 * Enfileira requisições quando offline e processa quando voltar online
 */

import { toast } from 'sonner';
import { sendCommunication } from '@/services/marketingService';
import type { CommunicationPayload } from '@/types/marketing.types';

interface QueuedRequest {
  id: string;
  payload: Partial<CommunicationPayload>;
  timestamp: Date;
  retries: number;
}

class OfflineQueue {
  private queue: QueuedRequest[] = [];
  private isOnline: boolean = navigator.onLine;
  private maxRetries = 3;
  private isProcessing = false;
  private readonly STORAGE_KEY = 'offline_queue';

  constructor() {
    this.loadQueue();
    this.setupListeners();
  }

  private setupListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      if (this.queue.length > 0) {
        toast.success(`Connection restored. Processing ${this.queue.length} queued requests...`);
        this.processQueue();
      }
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      toast.warning('You are offline. Requests will be queued.');
    });
  }

  private loadQueue() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.queue = parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      this.queue = [];
    }
  }

  private saveQueue() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  /**
   * Adiciona uma requisição à fila
   */
  add(payload: Partial<CommunicationPayload>): string {
    const request: QueuedRequest = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      payload,
      timestamp: new Date(),
      retries: 0,
    };

    this.queue.push(request);
    this.saveQueue();

    toast.info(`Request queued. ${this.queue.length} in queue.`);

    // Se estiver online, tentar processar imediatamente
    if (this.isOnline && !this.isProcessing) {
      setTimeout(() => this.processQueue(), 100);
    }

    return request.id;
  }

  /**
   * Processa a fila de requisições
   */
  async processQueue(): Promise<void> {
    if (!this.isOnline || this.queue.length === 0 || this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0 && this.isOnline) {
      const request = this.queue[0];

      try {
        // Tentar enviar
        await sendCommunication(request.payload);

        // Sucesso: remover da fila
        this.queue.shift();
        this.saveQueue();

        toast.success(`Queued request sent! ${this.queue.length} remaining.`);

        // Aguardar um pouco antes do próximo
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error: any) {
        console.error('Failed to send queued request:', error);

        request.retries++;

        if (request.retries >= this.maxRetries) {
          // Remover após max retries
          this.queue.shift();
          toast.error(`Failed to send request after ${this.maxRetries} attempts.`);
        } else {
          toast.warning(`Retry ${request.retries}/${this.maxRetries} for queued request...`);
          // Mover para o final da fila para tentar outros primeiro
          this.queue.push(this.queue.shift()!);
        }

        this.saveQueue();

        // Aguardar mais tempo em caso de erro
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    this.isProcessing = false;

    if (this.queue.length === 0) {
      toast.success('All queued requests processed!');
    }
  }

  /**
   * Retorna o tamanho atual da fila
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Retorna todos os itens da fila
   */
  getQueue(): QueuedRequest[] {
    return [...this.queue];
  }

  /**
   * Limpa toda a fila
   */
  clearQueue(): void {
    this.queue = [];
    this.saveQueue();
    toast.info('Queue cleared');
  }

  /**
   * Remove um item específico da fila
   */
  removeItem(id: string): boolean {
    const initialLength = this.queue.length;
    this.queue = this.queue.filter(item => item.id !== id);
    this.saveQueue();
    return this.queue.length < initialLength;
  }

  /**
   * Verifica se está online
   */
  isConnectionOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Verifica se está processando
   */
  isCurrentlyProcessing(): boolean {
    return this.isProcessing;
  }
}

export const offlineQueue = new OfflineQueue();

export default offlineQueue;
