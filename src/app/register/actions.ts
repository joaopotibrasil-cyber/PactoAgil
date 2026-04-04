'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { z } from 'zod';

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

export async function registerAction(formData: FormData) {
  console.log('[registerAction] Iniciando server action. Dados brutos recebidos.');
  
  const supabase = await createClient();
  const supabaseAdmin = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const rawData = Object.fromEntries(formData.entries());
  console.log('[registerAction] rawData:', { ...rawData, password: '[REDACTED]' });

  const validated = registerSchema.safeParse(rawData);

  if (!validated.success) {
    console.warn('[registerAction] Validação falhou:', validated.error.format());
    return { error: 'Dados inválidos. Verifique os campos.' };
  }

  const { fullName, email, password, companyName, cnpj, funcionalidade, existingCompanyId, planKey } = validated.data;

  // 1. Criar usuário no Supabase Auth
  console.log('[registerAction] Tentando criar usuário no Auth:', email);
  let authData: any = {};
  let authError: any = null;

  if (process.env.NODE_ENV === 'development') {
    console.log('[registerAction] Ambiente local detectado. Usando Admin Auth para evitar envio de email.');
    const { data: adminUser, error: adminError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirma automaticamente para permitir login
      user_metadata: {
        full_name: fullName,
      }
    });

    if (adminError) {
      authError = adminError;
    } else {
      authData = { user: adminUser.user };
      // Importante: No Dev, nós forçamos o login para estabelecer a sessão do usuário
      console.log('[registerAction] Efetuando signIn automático para gerar os cookies...');
      await supabase.auth.signInWithPassword({ email, password });
    }
  } else {
    // Em produção, usa o signUp nativo que respeita a configuração de Confirmação de E-mail do Supabase
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });
    authData = signUpData;
    authError = signUpError;
  }

  if (authError || !authData.user) {
    console.error('[registerAction] Erro no Auth:', authError);
    return { error: authError?.message || 'Erro ao criar conta' };
  }

  const userId = authData.user.id;
  console.log('[registerAction] Usuário criado com sucesso no Auth:', userId);

  try {
    let companyId = existingCompanyId;

    if (!companyId) {
      if (!companyName || !cnpj) {
        console.error('[registerAction] Faltando companyName ou cnpj para nova empresa');
        throw new Error('Empresa e CNPJ são obrigatórios para novos registros');
      }
      
      const newCompanyId = crypto.randomUUID();
      console.log('[registerAction] Inserindo nova Empresa:', { id: newCompanyId, companyName, cnpj });
      const { data: newCompany, error: companyError } = await supabaseAdmin
        .from('Empresa')
        .insert({
          id: newCompanyId,
          nome: companyName,
          cnpj: cnpj,
          funcionalidade: funcionalidade || null,
          atualizadoEm: new Date().toISOString(),
        })
        .select('id')
        .single();
        
      if (companyError) {
        console.error('[registerAction] Erro ao inserir Empresa:', companyError);
        throw companyError;
      }
      companyId = newCompany.id;
      console.log('[registerAction] Empresa criada:', companyId);
    } else {
      console.log('[registerAction] Vinculando à empresa existente:', companyId);
    }

    console.log('[registerAction] Inserindo Perfil associado à Empresa');
    const { error: profileError } = await supabaseAdmin
      .from('Perfil')
      .insert({
        id: crypto.randomUUID(),
        userId: userId,
        email: email,
        nomeCompleto: fullName,
        empresaId: companyId,
        role: 'ADMIN',
        atualizadoEm: new Date().toISOString(),
      });
      
    if (profileError) {
      console.error('[registerAction] Erro ao inserir Perfil:', profileError);
      throw profileError;
    }
    
    console.log('[registerAction] Perfil inserido com sucesso!');

  } catch (dbError: any) {
    console.error('[REGISTER_DB_ERROR]', dbError);
    return { error: dbError.message || 'Erro ao salvar dados da empresa.' };
  }

  if (planKey && planKey !== 'undefined') {
    console.log('[registerAction] Redirecionando para checkout:', planKey);
    redirect(`/api/checkout?planKey=${planKey}`);
  }

  console.log('[registerAction] Redirecionando para dashboard normal.');
  redirect('/dashboard');
}


