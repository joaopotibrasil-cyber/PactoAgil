import type { APIRoute } from 'astro';
import { createSupabaseClient } from '@/lib/supabase/astro';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { z } from 'zod';
import { ROUTES } from '@/constants/routes';

const registerSchema = z.object({
  fullName: z.string().min(3, 'Nome muito curto'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  companyName: z.string().optional(),
  cnpj: z.string().optional(),
  funcionalidade: z.string().optional(),
  existingCompanyId: z.string().optional(),
  planKey: z.string().optional(),
});

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    
    // Validação
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return new Response(JSON.stringify({ error: validation.error.issues[0]?.message ?? 'Dados inválidos' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    const { fullName, email, password, companyName, cnpj, funcionalidade, existingCompanyId, planKey } = validation.data;

    // Rate limiting
    const rateLimitResult = rateLimit(`signup:${email.toLowerCase()}`, RATE_LIMITS.signup);
    if (!rateLimitResult.success) {
      return new Response(JSON.stringify({ error: 'Muitas tentativas de registro. Tente novamente mais tarde.' }), { 
        status: 429, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    const supabaseAdmin = createAdminClient();

    // 1. Criar usuário no Auth via Admin (com auto-confirmação)
    const { data: adminUser, error: adminError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (adminError || !adminUser.user) {
      return new Response(JSON.stringify({ error: adminError?.message || 'Erro ao criar conta' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    const userId = adminUser.user.id;

    // 2. Criar ou vincular empresa
    let companyId = existingCompanyId;
    if (!companyId) {
      if (!companyName || !cnpj) {
        return new Response(JSON.stringify({ error: 'Dados de empresa incompletos' }), { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        });
      }

      const { data: newCompany, error: companyError } = await supabaseAdmin
        .from('Empresa')
        .insert({
          id: crypto.randomUUID(),
          nome: companyName,
          cnpj: cnpj,
          funcionalidade: funcionalidade ?? null,
          atualizadoEm: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (companyError || !newCompany) {
        return new Response(JSON.stringify({ error: companyError?.message || 'Erro ao criar empresa' }), { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        });
      }
      companyId = newCompany.id;
    }

    // 3. Criar perfil
    const { error: profileError } = await supabaseAdmin
      .from('Perfil')
      .insert({
        id: crypto.randomUUID(),
        userId: userId,
        email: email.toLowerCase().trim(),
        nomeCompleto: fullName,
        empresaId: companyId,
        role: 'ADMIN',
        atualizadoEm: new Date().toISOString(),
      });

    if (profileError) {
      return new Response(JSON.stringify({ error: profileError.message }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // 4. Efetuar login para o usuário (para gerar cookies de sessão no navegador)
    const supabase = createSupabaseClient(cookies);
    await supabase.auth.signInWithPassword({ email, password });

    // Determinar redirecionamento
    let redirect: string = ROUTES.PAGES.DASHBOARD.ROOT;
    if (planKey && planKey !== 'undefined') {
      redirect = `${ROUTES.API.CHECKOUT.ROOT}?planKey=${planKey}`;
    }

    return new Response(JSON.stringify({ success: true, redirect }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (error: any) {
    console.error('[AUTH_REGISTER_ERROR]', error);
    return new Response(JSON.stringify({ error: 'Internal Error' }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
};
