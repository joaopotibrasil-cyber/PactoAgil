/**
 * Rate Limiting simples em memória para Next.js
 * Nota: Em produção com múltiplas instâncias, use Redis
 */

type RateLimitEntry = {
  count: number;
  resetTime: number;
};

const store = new Map<string, RateLimitEntry>();

interface RateLimitOptions {
  interval: number; // em milissegundos
  maxRequests: number;
}

const DEFAULT_OPTIONS: RateLimitOptions = {
  interval: 60 * 1000, // 1 minuto
  maxRequests: 10,
};

export function rateLimit(
  identifier: string,
  options: Partial<RateLimitOptions> = {}
): { success: boolean; limit: number; remaining: number; reset: Date } {
  const { interval, maxRequests } = { ...DEFAULT_OPTIONS, ...options };
  const now = Date.now();

  const entry = store.get(identifier);

  // Se não existe ou já expirou, cria novo entry
  if (!entry || now > entry.resetTime) {
    store.set(identifier, {
      count: 1,
      resetTime: now + interval,
    });

    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      reset: new Date(now + interval),
    };
  }

  // Se atingiu o limite
  if (entry.count >= maxRequests) {
    return {
      success: false,
      limit: maxRequests,
      remaining: 0,
      reset: new Date(entry.resetTime),
    };
  }

  // Incrementa contador
  entry.count++;
  store.set(identifier, entry);

  return {
    success: true,
    limit: maxRequests,
    remaining: maxRequests - entry.count,
    reset: new Date(entry.resetTime),
  };
}

// Limpar entradas antigas periodicamente (a cada 5 minutos)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetTime) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

// Rate limits específicos por endpoint
export const RATE_LIMITS = {
  login: { interval: 15 * 60 * 1000, maxRequests: 5 }, // 5 tentativas por 15 min
  signup: { interval: 60 * 60 * 1000, maxRequests: 3 }, // 3 registros por hora
  invite: { interval: 60 * 60 * 1000, maxRequests: 10 }, // 10 convites por hora
  checkout: { interval: 5 * 60 * 1000, maxRequests: 3 }, // 3 checkouts por 5 min
  api: { interval: 60 * 1000, maxRequests: 30 }, // 30 requests por min
  webhook: { interval: 60 * 1000, maxRequests: 100 }, // webhooks são mais permissivos
} as const;
