import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { createSupabaseClient } from '../lib/supabase/astro';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { ROUTES } from '../constants/routes';

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

export const register = defineAction({
  accept: 'form',
  input: registerSchema,
  handler: async (input, { cookies }) => {
    console.log('[Action: Register] Iniciando processamento...');

    const supabase = createSupabaseClient(cookies);
    const supabaseAdmin = createSupabaseAdmin(
      import.meta.env.PUBLIC_SUPABASE_URL!,
      import.meta.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { fullName, email, password, companyName, cnpj, funcionalidade, existingCompanyId, planKey } = input;

    try {
      // 1. Criar usuário no Supabase Auth (Admin)
      const { data: adminUser, error: adminError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });

      if (adminError || !adminUser.user) {
        throw new Error(adminError?.message || 'Erro ao criar conta no Auth');
      }

      const userId = adminUser.user.id;

      // 2. Login automático para criar cookies de sessão no Astro
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) console.error('[Action: Register] Erro no auto-login:', loginError);

      // 3. Criar ou vincular empresa
      let companyId = existingCompanyId;
      if (!companyId) {
        if (!companyName || !cnpj) {
          throw new Error('Dados de empresa incompletos para novo registro');
        }

        const newCompanyId = crypto.randomUUID();
        const { data: newCompany, error: companyError } = await supabaseAdmin
          .from('Empresa')
          .insert({
            id: newCompanyId,
            nome: companyName,
            cnpj: cnpj,
            funcionalidade: funcionalidade ?? null,
            atualizadoEm: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (companyError || !newCompany) {
          throw new Error(companyError?.message || 'Erro ao criar empresa no banco');
        }
        companyId = newCompany.id;
      }

      // 4. Criar perfil
      const { error: profileError } = await supabaseAdmin
        .from('Perfil')
        .insert({
          id: crypto.randomUUID(),
          userId,
          email,
          nomeCompleto: fullName,
          empresaId: companyId,
          role: 'ADMIN',
          atualizadoEm: new Date().toISOString(),
        });

      if (profileError) {
        throw new Error(profileError.message || 'Erro ao criar perfil no banco');
      }

      const redirect = planKey && planKey !== 'undefined' 
        ? `${ROUTES.API.CHECKOUT.ROOT}?planKey=${planKey}`
        : ROUTES.PAGES.DASHBOARD.ROOT;

      return { success: true, redirect };

    } catch (error: any) {
      console.error('[Action: Register] Erro:', error);
      return { success: false, error: error.message };
    }
  }
});
