import { memo, useMemo } from 'react';
import type { ComponentType } from 'react';

/**
 * Utilitários de performance para React/Next.js
 */

// ===================== MEMOIZATION =====================

/**
 * Cria um componente memoizado com comparação customizada
 * Útil para componentes que recebem objetos complexos
 *
 * @example
 * const MemoizedList = memoWithDeepCompare(ListComponent);
 */
export function memoWithDeepCompare<T extends ComponentType<any>>(
  Component: T
): T {
  return memo(Component, (prevProps, nextProps) => {
    return JSON.stringify(prevProps) === JSON.stringify(nextProps);
  }) as unknown as T;
}

/**
 * Hook para memoizar funções de filtro/mapeamento em listas grandes
 *
 * @example
 * const filteredItems = useFilteredList(items, filters, (item) => {
 *   return item.category === filters.category && item.status === filters.status;
 * });
 */
export function useFilteredList<T>(
  items: T[],
  deps: any[],
  filterFn: (item: T) => boolean
): T[] {
  return useMemo(() => items.filter(filterFn), [items, ...deps]);
}

// ===================== CODE SPLITTING =====================

/**
 * Helper para dynamic imports com loading state
 * Útil para carregar bibliotecas pesadas sob demanda
 *
 * @example
 * const mammoth = await dynamicImport('mammoth');
 */
export async function dynamicImport<T>(moduleName: string): Promise<T> {
  const module = await import(moduleName);
  return module.default || module;
}

/**
 * Preload de componentes pesados para navegação rápida
 *
 * @example
 * preloadComponent(() => import('@/components/HeavyChart'));
 */
export function preloadComponent(
  importFn: () => Promise<any>
): void {
  if (typeof window !== 'undefined') {
    // @ts-ignore
    const requestIdleCallback =
      window.requestIdleCallback || ((cb) => setTimeout(cb, 1));
    requestIdleCallback(() => {
      importFn();
    });
  }
}

// ===================== DEBOUNCE/THROTTLE =====================

/**
 * Throttle simples para funções
 * Útil para scroll handlers e resize
 *
 * @example
 * const throttledHandler = throttle((e) => {
 *   console.log('scroll', e.scrollY);
 * }, 100);
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Debounce simples para funções
 *
 * @example
 * const debouncedSearch = debounce((query) => {
 *   searchAPI(query);
 * }, 300);
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
}

// ===================== PERFORMANCE MONITORING =====================

/**
 * Mede o tempo de execução de uma função
 * Útil para debugging de performance
 *
 * @example
 * const result = measurePerformance('heavyOperation', () => {
 *   return heavyCalculation();
 * });
 */
export function measurePerformance<T>(
  name: string,
  fn: () => T,
  threshold: number = 16 // 16ms = 1 frame
): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  const duration = end - start;

  if (duration > threshold) {
    console.warn(`[Performance] ${name} took ${duration.toFixed(2)}ms`);
  }

  return result;
}

/**
 * Hook para medir renders desnecessários
 * @example
 * useWhyDidYouUpdate('MyComponent', props);
 */
export function useWhyDidYouUpdate(
  componentName: string,
  props: Record<string, any>
): void {
  const prevProps = React.useRef<Record<string, any>>({});

  React.useEffect(() => {
    if (prevProps.current) {
      const allKeys = Object.keys({ ...prevProps.current, ...props });
      const changesObj: Record<string, { from: any; to: any }> = {};
      allKeys.forEach((key) => {
        if (prevProps.current[key] !== props[key]) {
          changesObj[key] = {
            from: prevProps.current[key],
            to: props[key],
          };
        }
      });

      if (Object.keys(changesObj).length) {
        console.log('[why-did-you-update]', componentName, changesObj);
      }
    }

    prevProps.current = props;
  });
}

// Import React para o hook acima
import React from 'react';

// ===================== CACHING =====================

/**
 * Cache simples em memória para resultados de funções
 *
 * @example
 * const getCachedData = memoize((id) => fetchData(id));
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return function (this: any, ...args: Parameters<T>): ReturnType<T> {
    const key = keyGenerator
      ? keyGenerator(...args)
      : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  } as T;
}

/**
 * Limpa cache antigo periodicamente
 */
export function createExpiringCache<T>(
  durationMs: number = 5 * 60 * 1000 // 5 minutos
) {
  const cache = new Map<
    string,
    { value: T; timestamp: number }
  >();

  return {
    get(key: string): T | undefined {
      const entry = cache.get(key);
      if (!entry) return undefined;

      const now = Date.now();
      if (now - entry.timestamp > durationMs) {
        cache.delete(key);
        return undefined;
      }

      return entry.value;
    },

    set(key: string, value: T): void {
      cache.set(key, { value, timestamp: Date.now() });
    },

    clear(): void {
      cache.clear();
    },

    size(): number {
      return cache.size;
    },
  };
}
