"use client";

import { useState, useCallback, useRef } from 'react';

type AsyncState<T> =
  | { status: 'idle'; data: null; error: null }
  | { status: 'loading'; data: null; error: null }
  | { status: 'success'; data: T; error: null }
  | { status: 'error'; data: null; error: Error };

interface UseAsyncStateOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook para gerenciamento de estado assíncrono simplificado
 * Substitui múltiplos estados de loading/error/data por um único estado tipado
 *
 * @example
 * const { state, execute, reset } = useAsyncState(fetchUserData);
 *
 * // No JSX
 * {state.status === 'loading' && <Spinner />}
 * {state.status === 'error' && <Error message={state.error.message} />}
 * {state.status === 'success' && <User data={state.data} />}
 */
export function useAsyncState<T, Args extends any[] = []>(
  asyncFunction: (...args: Args) => Promise<T>,
  options: UseAsyncStateOptions<T> = {}
) {
  const [state, setState] = useState<AsyncState<T>>({
    status: 'idle',
    data: null,
    error: null,
  });

  const isMounted = useRef(true);
  const asyncFunctionRef = useRef(asyncFunction);

  // Atualiza a ref quando a função muda
  asyncFunctionRef.current = asyncFunction;

  const execute = useCallback(async (...args: Args) => {
    setState({ status: 'loading', data: null, error: null });

    try {
      const data = await asyncFunctionRef.current(...args);

      if (isMounted.current) {
        setState({ status: 'success', data, error: null });
        options.onSuccess?.(data);
      }
      return data;
    } catch (error) {
      if (isMounted.current) {
        const err = error instanceof Error ? error : new Error(String(error));
        setState({ status: 'error', data: null, error: err });
        options.onError?.(err);
      }
      throw error;
    }
  }, [options]);

  const reset = useCallback(() => {
    setState({ status: 'idle', data: null, error: null });
  }, []);

  return {
    state,
    execute,
    reset,
    isIdle: state.status === 'idle',
    isLoading: state.status === 'loading',
    isSuccess: state.status === 'success',
    isError: state.status === 'error',
    data: state.data,
    error: state.error,
  };
}

/**
 * Hook para gerenciar múltiplas operações async simultâneas
 * Útil para formulários com múltiplos estados (isSaving, isGenerating, etc.)
 */
export function useAsyncStates<T extends Record<string, (...args: any[]) => Promise<any>>>(
  operations: T
) {
  const [states, setStates] = useState<
    { [K in keyof T]: AsyncState<any> }
  >(() => 
    Object.keys(operations).reduce((acc, key) => ({
      ...acc,
      [key]: { status: 'idle' as const, data: null, error: null },
    }), {} as any)
  );

  const execute = useCallback(
    async <K extends keyof T>(key: K, ...args: Parameters<T[K]>) => {
      setStates((prev) => ({
        ...prev,
        [key]: { status: 'loading' as const, data: null, error: null },
      }));

      try {
        const data = await operations[key](...args);
        setStates((prev) => ({
          ...prev,
          [key]: { status: 'success' as const, data, error: null },
        }));
        return data;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setStates((prev) => ({
          ...prev,
          [key]: { status: 'error' as const, data: null, error: err },
        }));
        throw err;
      }
    },
    [operations]
  );

  const isAnyLoading = useCallback(
    (...keys: (keyof T)[]) => {
      if (keys.length === 0) {
        return Object.values(states).some((s) => s.status === 'loading');
      }
      return keys.some((key) => states[key]?.status === 'loading');
    },
    [states]
  );

  const getError = useCallback(
    (key: keyof T) => states[key]?.error,
    [states]
  );

  return {
    states,
    execute,
    isLoading: isAnyLoading,
    getError,
  };
}
