/**
 * Utilitário para sincronizar a sessão do usuário com o LocalStorage.
 * Isso garante que dados como nome, empresa, plano e o access_token 
 * estejam disponíveis para componentes cliente e chamadas externas.
 */

export interface UserState {
  name: string | null;
  role: string | null;
  company: string | null;
  plan: string | null;
  access_token: string | null;
}

export const AUTH_KEYS = {
  USER_DATA: 'pacto_user_data',
  ACCESS_TOKEN: 'pacto_access_token',
};

/**
 * Busca os dados do usuário atual e os persiste no LocalStorage.
 */
export async function syncUserSession(): Promise<UserState | null> {
  try {
    console.log('[auth-sync] Iniciando sincronização via /api/me...');
    const token = localStorage.getItem(AUTH_KEYS.ACCESS_TOKEN);
    const headers: Record<string, string> = {
      'Cache-Control': 'no-cache',
    };

    if (token && token !== 'null' && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('/api/me', {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      console.warn('[auth-sync] Falha ao sincronizar sessão:', response.status);
      return null;
    }

    const data: UserState = await response.json();

    // Persistência no LocalStorage
    localStorage.setItem(AUTH_KEYS.USER_DATA, JSON.stringify(data));
    
    if (data.access_token) {
      localStorage.setItem(AUTH_KEYS.ACCESS_TOKEN, data.access_token);
      console.log('[auth-sync] Access token persistido com sucesso.');
    }

    console.log('[auth-sync] Dados do usuário sincronizados.');
    return data;
  } catch (err) {
    console.error('[auth-sync] Erro crítico na sincronização:', err);
    return null;
  }
}

/**
 * Recupera o token de acesso salvo localmente.
 */
export function getStoredAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_KEYS.ACCESS_TOKEN);
}

/**
 * Limpa os dados de autenticação do navegador.
 */
export function clearAuthData() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_KEYS.USER_DATA);
  localStorage.removeItem(AUTH_KEYS.ACCESS_TOKEN);
}
