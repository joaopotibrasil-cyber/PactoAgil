'use client';

import { useState, useEffect, useCallback } from 'react';
import { AUTH_KEYS, syncUserSession } from '@/lib/auth-sync';
import type { UserState } from '@/lib/auth-sync';

/**
 * Hook para acessar o estado do usuário e realizar sincronização.
 * Recupera os dados do LocalStorage e fornece método para atualizar.
 */
export function useUser() {
  const [user, setUser] = useState<UserState | null>(null);
  const [loading, setLoading] = useState(true);

  // Função para carregar dados do storage
  const loadFromStorage = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const stored = localStorage.getItem(AUTH_KEYS.USER_DATA);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      } catch (e) {
        console.error('[useUser] Erro ao carregar dados do storage:', e);
      }
    }
  }, []);

  // Função para forçar atualização via API
  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await syncUserSession(true);
    if (data) {
      setUser(data);
    }
    setLoading(false);
    return data;
  }, []);

  useEffect(() => {
    loadFromStorage();
    
    // Tenta sincronizar uma vez na montagem se estiver logado
    const checkSession = async () => {
      // Pequeno delay para garantir que cookies estejam prontos se vindo de redirect
      const data = await syncUserSession();
      if (data) {
        setUser(data);
      }
      setLoading(false);
    };

    checkSession();
  }, [loadFromStorage]);

  return {
    user,
    loading,
    refresh,
    isAuthenticated: !!user && !!user.access_token,
    accessToken: user?.access_token || null
  };
}