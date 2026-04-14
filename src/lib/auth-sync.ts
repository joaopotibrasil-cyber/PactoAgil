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

let syncPromise: Promise<UserState | null> | null = null;
let lastSyncTime = 0;
let lastSyncResult: UserState | null = null;

/**
 * Busca os dados do usuário atual e os persiste no LocalStorage (deduplicado).
 * Previne race conditions e requisições duplicadas.
 */
export async function syncUserSession(force = false): Promise<UserState | null> {
  const now = Date.now();

  // Retorna resultado em cache se válido (5 segundos)
  if (!force && lastSyncResult && (now - lastSyncTime < 5000)) {
    console.log('[auth-sync] Usando cache do sincronizador (< 5s).');
    return lastSyncResult;
  }

  // Evita race condition - retorna promise pendente se existir
  if (!force && syncPromise) {
    console.log('[auth-sync] Reutilizando requisição pendente.');
    return syncPromise;
  }

  syncPromise = (async () => {
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
      credentials: 'include',
      headers,
    });

    if (!response.ok) {
      console.warn('[auth-sync] Falha ao sincronizar sessão:', response.status);
      return null;
    }

    const data: UserState = await response.json();

    // Persistência no LocalStorage (Mescla com dados existentes para não perder o token)
    const existingDataRaw = localStorage.getItem(AUTH_KEYS.USER_DATA);
    const existingData = existingDataRaw ? JSON.parse(existingDataRaw) : {};
    const mergedData = { ...existingData, ...data };

    localStorage.setItem(AUTH_KEYS.USER_DATA, JSON.stringify(mergedData));

    if (data.access_token) {
      localStorage.setItem(AUTH_KEYS.ACCESS_TOKEN, data.access_token);
      console.log('[auth-sync] Access token persistido com sucesso.');
    } else if (existingData.access_token && !mergedData.access_token) {
      // Garante que o token continue no objeto de dados se já existia
      mergedData.access_token = existingData.access_token;
      localStorage.setItem(AUTH_KEYS.USER_DATA, JSON.stringify(mergedData));
    }

    console.log('[auth-sync] Dados do usuário sincronizados.');
    return data;
  })().then(result => {
    if (result) {
      lastSyncResult = result;
      lastSyncTime = Date.now();
    }
    syncPromise = null;
    return result;
  }).catch(err => {
    console.error('[auth-sync] Erro crítico na sincronização:', err);
    syncPromise = null;
    return null;
  });

  lastSyncTime = now;
  return syncPromise;
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
