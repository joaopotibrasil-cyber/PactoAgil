import { useCallback, useRef } from 'react';

/**
 * Hook que obtém o access_token válido da sessão atual.
 * 
 * Estratégia: chama /api/auth/token (server-side) que lê os cookies HTTP-only
 * e retorna o JWT. Isso contorna o problema de getSession() retornar null
 * no cliente quando os cookies são HTTP-only (configuração padrão do @supabase/ssr).
 * 
 * O token é cacheado por 55 minutos (tokens Supabase expiram em 60min).
 */
export function useAuthToken() {
  const tokenRef = useRef<{ value: string; expiresAt: number } | null>(null);

  const getToken = useCallback(async (): Promise<string | null> => {
    const now = Date.now();

    // Retorna o token cacheado se ainda for válido
    if (tokenRef.current && tokenRef.current.expiresAt > now) {
      return tokenRef.current.value;
    }

    try {
      const res = await fetch('/api/auth/token', {
        credentials: 'include', // garante que os cookies são enviados
      });

      if (!res.ok) {
        console.warn('[useAuthToken] Falha ao obter token:', res.status);
        return null;
      }

      const data = await res.json();
      const token = data.access_token as string;

      if (!token) return null;

      // Cache por 55 minutos
      tokenRef.current = {
        value: token,
        expiresAt: now + 55 * 60 * 1000,
      };

      return token;
    } catch (err) {
      console.error('[useAuthToken] Erro:', err);
      return null;
    }
  }, []);

  /**
   * Retorna os headers de autenticação prontos para uso em fetch()
   */
  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const token = await getToken();
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }, [getToken]);

  return { getToken, getAuthHeaders };
}
