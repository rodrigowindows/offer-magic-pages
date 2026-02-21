import { useState, useCallback } from 'react';

interface AsyncOperationState {
  loading: boolean;
  error: string | null;
}

/**
 * Hook for managing async operations with loading/error states.
 * Replaces the common pattern of useState(false) + try/catch/finally.
 *
 * Usage:
 *   const { loading, error, execute } = useAsyncOperation();
 *   const data = await execute(() => supabase.from('table').select('*'));
 */
export function useAsyncOperation() {
  const [state, setState] = useState<AsyncOperationState>({
    loading: false,
    error: null,
  });

  const execute = useCallback(async <T>(fn: () => Promise<T>): Promise<T | undefined> => {
    setState({ loading: true, error: null });
    try {
      const result = await fn();
      setState({ loading: false, error: null });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setState({ loading: false, error: message });
      return undefined;
    }
  }, []);

  return { loading: state.loading, error: state.error, execute };
}
