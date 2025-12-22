/**
 * Rate Limiter para prevenir spam de requisições
 * Uso: rateLimiter.canMakeRequest('action_name', maxRequests, windowMs)
 */

class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  /**
   * Verifica se pode fazer uma requisição baseado em rate limit
   * @param key Identificador único da ação
   * @param maxRequests Número máximo de requisições permitidas
   * @param windowMs Janela de tempo em milissegundos
   * @returns true se pode fazer requisição, false se está limitado
   */
  canMakeRequest(key: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];

    // Remove timestamps fora da janela de tempo
    const validTimestamps = timestamps.filter(t => now - t < windowMs);

    if (validTimestamps.length >= maxRequests) {
      return false;
    }

    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);
    return true;
  }

  /**
   * Retorna quanto tempo falta para poder fazer nova requisição
   * @param key Identificador único da ação
   * @param windowMs Janela de tempo em milissegundos
   * @returns Tempo restante em milissegundos
   */
  getRemainingTime(key: string, windowMs: number = 60000): number {
    const timestamps = this.requests.get(key) || [];
    if (timestamps.length === 0) return 0;

    const oldest = timestamps[0];
    const remaining = windowMs - (Date.now() - oldest);
    return Math.max(0, remaining);
  }

  /**
   * Limpa histórico de uma chave específica
   */
  reset(key: string): void {
    this.requests.delete(key);
  }

  /**
   * Limpa todo o histórico
   */
  resetAll(): void {
    this.requests.clear();
  }

  /**
   * Retorna quantas requisições já foram feitas na janela atual
   */
  getRequestCount(key: string, windowMs: number = 60000): number {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    return timestamps.filter(t => now - t < windowMs).length;
  }
}

export const rateLimiter = new RateLimiter();

export default rateLimiter;
