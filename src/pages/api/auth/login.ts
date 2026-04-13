import type { APIRoute } from 'astro';
import { createSupabaseClient } from '@/lib/supabase/astro';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
});

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    
    // Validação
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return new Response(JSON.stringify({ error: validation.error.issues[0]?.message ?? 'Dados inválidos' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    const { email, password } = validation.data;

    // Rate limiting
    const rateLimitResult = rateLimit(`login:${email.toLowerCase()}`, RATE_LIMITS.login);
    if (!rateLimitResult.success) {
      return new Response(JSON.stringify({ error: 'Muitas tentativas de login. Tente novamente em alguns minutos.' }), { 
        status: 429, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    const supabase = createSupabaseClient(cookies);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 401, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    if (!data.session) {
      return new Response(JSON.stringify({ error: 'Erro ao criar sessão.' }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    return new Response(JSON.stringify({ success: true, user: data.user }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (error: any) {
    console.error('[AUTH_LOGIN_ERROR]', error);
    return new Response(JSON.stringify({ error: 'Internal Error' }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
};
