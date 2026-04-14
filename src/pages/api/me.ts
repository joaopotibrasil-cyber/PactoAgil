import type { APIRoute } from 'astro';
import prisma from '@/lib/prisma';
import { createSupabaseClient } from '@/lib/supabase/astro';

export const prerender = false;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
} as const;

interface UserProfile {
  name: string | null;
  role: string | null;
  company: string | null;
  plan: string;
  access_token: string | null;
}

/**
 * Extrai e valida o token Bearer do header de autorização.
 */
function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

/**
 * Obtém o ID do usuário via token Bearer.
 */
async function getUserIdFromToken(token: string): Promise<string | null> {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey || !token) return null;

  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': anonKey
      }
    });

    if (res.ok) {
      const user = await res.json();
      return user.id;
    }
    return null;
  } catch (err) {
    console.error('[getUserIdFromToken] Erro na validação direta:', err);
    return null;
  }
}

/**
 * Busca o perfil do usuário no banco de dados.
 */
async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const perfil = await prisma.perfil.findUnique({
    where: { userId },
    include: {
      empresa: {
        select: {
          nome: true,
          assinatura: {
            select: { tipoPlano: true }
          }
        }
      }
    }
  });

  if (!perfil) return null;

  return {
    name: perfil.nomeCompleto,
    role: perfil.role,
    company: perfil.empresa?.nome ?? null,
    plan: perfil.empresa?.assinatura?.tipoPlano ?? 'FREE',
    access_token: null
  };
}

export const GET: APIRoute = async (context) => {
  const { request, cookies } = context;
  try {
    const authHeader = request.headers.get('authorization');
    const token = extractBearerToken(authHeader);
    let userId: string | null = null;
    let finalToken: string | null = token;

    if (token) {
      userId = await getUserIdFromToken(token);
    }

    if (!userId) {
      // Fallback para sessão via cookies
      const supabase = createSupabaseClient(cookies);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        userId = user.id;
        const { data: sessionData } = await supabase.auth.getSession();
        finalToken = sessionData?.session?.access_token ?? null;
      }
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado. Token inválido ou sessão inexistente.' }),
        { status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const profile = await fetchUserProfile(userId);

    if (!profile) {
      return new Response(
        JSON.stringify({ error: 'Perfil não encontrado na base de dados.' }),
        { status: 404, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ ...profile, access_token: finalToken }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API /api/me] Erro durante processamento:', message);
    
    // Se o erro for relacionado à autenticação ou token, retornamos 401 de forma limpa
    if (message.includes('auth') || message.includes('token') || message.includes('session')) {
      return new Response(
        JSON.stringify({ error: 'Sessão inválida ou expirada. Por favor, faça reset via /reset.' }),
        { status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Erro ao validar perfil. Tente limpar o cache.' }),
      { status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
};
