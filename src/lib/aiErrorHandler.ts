/**
 * Shared error handler for AI edge function responses.
 * Centralizes rate-limit, credit exhaustion, and generic error handling.
 */
export interface AIErrorHandlerOptions {
  toast: (opts: { title: string; description: string; variant?: 'destructive' | 'default' }) => void;
  context: string; // e.g. 'AI Score', 'AI Valuation'
}

/**
 * Handles data.error from AI edge functions.
 * Returns true if an error was handled (caller should return null).
 */
export const handleAIResponseError = (
  dataError: string | undefined,
  { toast, context }: AIErrorHandlerOptions
): boolean => {
  if (!dataError) return false;

  if (dataError.includes('Rate limit') || dataError.includes('rate limit')) {
    toast({ title: '⏳ Rate limit', description: 'Aguarde um momento e tente novamente.', variant: 'destructive' });
    return true;
  }

  if (dataError.includes('credits') || dataError.includes('Credits')) {
    toast({ title: '💳 Créditos', description: 'Créditos de IA esgotados.', variant: 'destructive' });
    return true;
  }

  toast({ title: `Erro ${context}`, description: dataError, variant: 'destructive' });
  return true;
};

/**
 * Wraps an async AI function call with loading state and error handling.
 */
export const withAILoading = async <T>(
  setLoading: (v: boolean) => void,
  context: string,
  toast: AIErrorHandlerOptions['toast'],
  fn: () => Promise<T>
): Promise<T | null> => {
  setLoading(true);
  try {
    return await fn();
  } catch (err: any) {
    toast({ title: `Erro ${context}`, description: err.message, variant: 'destructive' });
    return null;
  } finally {
    setLoading(false);
  }
};
