'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseAdmin, SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { ROUTES } from '@/constants/routes';

const REQUIRED_ENV_VARS = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] as const;

function validateEnv(): void {
  const missingVars = REQUIRED_ENV_VARS.filter((envVar) => !process.env[envVar]);
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

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

type SupabaseAdminClient = SupabaseClient;

export type RegisterResult =
  | { success: true; redirect: string; error?: never }
  | { success?: never; error: string; redirect?: never };

interface CreateCompanyInput {
  companyName: string;
  cnpj: string;
  funcionalidade?: string;
}

interface CreateProfileInput {
  userId: string;
  email: string;
  fullName: string;
  companyId: string;
}

async function createCompany(
  supabaseAdmin: SupabaseAdminClient,
  input: CreateCompanyInput
): Promise<string> {
  const newCompanyId = crypto.randomUUID();

  const { data: newCompany, error: companyError } = await supabaseAdmin
    .from('Empresa')
    .insert({
      id: newCompanyId,
      nome: input.companyName,
      cnpj: input.cnpj,
      funcionalidade: input.funcionalidade ?? null,
      atualizadoEm: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (companyError || !newCompany) {
    console.error('[registerAction] Erro ao inserir Empresa:', companyError);
    throw new Error(companyError?.message ?? 'Erro ao criar empresa');
  }

  return newCompany.id;
}

async function createProfile(
  supabaseAdmin: SupabaseAdminClient,
  input: CreateProfileInput
): Promise<void> {
  const { error: profileError } = await supabaseAdmin
    .from('Perfil')
    .insert({
      id: crypto.randomUUID(),
      userId: input.userId,
      email: input.email,
      nomeCompleto: input.fullName,
      empresaId: input.companyId,
      role: 'ADMIN',
      atualizadoEm: new Date().toISOString(),
    });

  if (profileError) {
    console.error('[registerAction] Erro ao inserir Perfil:', profileError);
    throw new Error(profileError.message);
  }
}

function getRedirectUrl(planKey: string | undefined): string {
  if (planKey && planKey !== 'undefined') {
    return `${ROUTES.API.CHECKOUT.ROOT}?planKey=${planKey}`;
  }
  return ROUTES.PAGES.DASHBOARD.ROOT;
}

export async function registerAction(formData: FormData): Promise<RegisterResult> {
  console.log('[registerAction] Iniciando server action.');

  try {
    validateEnv();

    const supabase = await createClient();
    const supabaseAdmin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.SUPABASE_SERVICE_ROLE_KEY as string
    );

    const rawData = Object.fromEntries(formData.entries());
    console.log('[registerAction] rawData:', { ...rawData, password: '[REDACTED]' });

    const validated = registerSchema.safeParse(rawData);
    if (!validated.success) {
      console.warn('[registerAction] Validação falhou:', validated.error.format());
      return { error: 'Dados inválidos. Verifique os campos.' };
    }

    const { fullName, email, password, companyName, cnpj, funcionalidade, existingCompanyId, planKey } = validated.data;

    // Criar usuário no Supabase Auth
    console.log('[registerAction] Criando usuário:', email);
    const { data: adminUser, error: adminError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (adminError || !adminUser.user) {
      console.error('[registerAction] Erro no Admin Auth:', adminError);
      return { error: adminError?.message || 'Erro ao criar conta' };
    }

    const userId = adminUser.user.id;
    console.log('[registerAction] Usuário criado:', userId);

    // Login automático para criar cookies de sessão
    console.log('[registerAction] Efetuando signIn automático...');
    await supabase.auth.signInWithPassword({ email, password });

    // Criar ou vincular empresa
    let companyId = existingCompanyId;
    if (!companyId) {
      if (!companyName || !cnpj) {
        console.error('[registerAction] Dados de empresa incompletos');
        return { error: 'Empresa e CNPJ são obrigatórios para novos registros' };
      }
      companyId = await createCompany(supabaseAdmin, { companyName, cnpj, funcionalidade });
      console.log('[registerAction] Empresa criada:', companyId);
    } else {
      console.log('[registerAction] Vinculando à empresa existente:', companyId);
    }

    // Criar perfil
    await createProfile(supabaseAdmin, { userId, email, fullName, companyId });
    console.log('[registerAction] Perfil criado com sucesso!');

    const redirect = getRedirectUrl(planKey);
    console.log('[registerAction] Redirecionando para:', redirect);
    return { success: true, redirect };

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[registerAction] Erro crítico:', error);
    return { error: message || 'Erro ao processar registro.' };
  }
}


