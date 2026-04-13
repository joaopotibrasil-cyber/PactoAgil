import { useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AUTH_KEYS } from '@/lib/auth-sync';

/**
 * Hook que obtém o access_token válido da sessão atual diretamente do 
 * Supabase Browser Client ou fallbacks para LocalStorage.
 */
export function useAuthToken() {
  const tokenRef = useRef<{ value: string; expiresAt: number } | null>(null);
  const supabase = createClient();

  const getToken = useCallback(async (): Promise<string | null> => {
    const now = Date.now();

    // 1. Retorna o token em cache se ainda houver 1 minuto de margem validade
    if (tokenRef.current && tokenRef.current.expiresAt > (now + 60000)) {
      return tokenRef.current.value;
    }

    try {
      // 2. Tentar obter via Supabase SDK (ideal: gerencia refresh)
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (!error && session?.access_token) {
        if (import.meta.env.DEV) {
          console.log('[useAuthToken] Token obtido via Supabase SDK.', { preview: session.access_token.substring(0, 10) + '...' });
        }
        tokenRef.current = {
          value: session.access_token,
          expiresAt: session.expires_at ? session.expires_at * 1000 : now + 3600 * 1000,
        };
        return session.access_token;
      }

      if (error) {
        console.warn('[useAuthToken] Erro no SDK ao obter sessão:', error.message);
      }

      // 3. Fallback: LocalStorage (persiste mesmo se o SDK perder o estado)
      const storedToken = localStorage.getItem(AUTH_KEYS.ACCESS_TOKEN);
      if (storedToken && storedToken !== 'null' && storedToken !== 'undefined') {
        if (import.meta.env.DEV) {
          console.log('[useAuthToken] Fallback: Token recuperado do LocalStorage.', { preview: storedToken.substring(0, 10) + '...' });
        }
        tokenRef.current = {
          value: storedToken,
          expiresAt: now + 30 * 60 * 1000,
        };
        return storedToken;
      }

      if (import.meta.env.DEV) {
        console.warn('[useAuthToken] Nenhum token encontrado em nenhuma camada.');
      }
      return null;
    } catch (err) {
      console.error('[useAuthToken] Erro inesperado capturando token:', err);
      return null;
    }
  }, [supabase]);

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
