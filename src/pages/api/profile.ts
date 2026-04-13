import type { APIRoute } from 'astro';
import { requireAuth } from '@/lib/astro-auth-helpers';
import { getDashboardProfileJson } from '@/lib/dashboard-profile';

export const prerender = false;

export const GET: APIRoute = async ({ request, cookies }) => {
  const authResult = await requireAuth(request, cookies);

  if (authResult instanceof Response) {
    return authResult;
  }

  const userId = authResult;

  try {
    const body = await getDashboardProfileJson(userId, request.headers.get('x-user-email'));

    return new Response(JSON.stringify(body), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (err) {
    console.error('[PROFILE_ERROR]', err);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
