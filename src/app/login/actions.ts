'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { z } from 'zod'
import { ROUTES } from '@/constants/routes'

// Schemas de validação
const emailSchema = z.string().email('E-mail inválido').min(5).max(254)
const passwordSchema = z.string().min(8, 'Senha deve ter no mínimo 8 caracteres').max(128)

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Validação de entrada
  const emailValidation = emailSchema.safeParse(email)
  if (!emailValidation.success) {
    return { error: 'E-mail inválido' }
  }

  const passwordValidation = passwordSchema.safeParse(password)
  if (!passwordValidation.success) {
    return { error: 'Senha inválida' }
  }

  // Rate limiting por email
  const rateLimitResult = rateLimit(`login:${email.toLowerCase()}`, RATE_LIMITS.login)
  if (!rateLimitResult.success) {
    return { error: 'Muitas tentativas de login. Tente novamente em alguns minutos.' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Login error:', error.message)
    return { error: error.message }
  }

  if (!data.session) {
    console.error('Login error: No session returned')
    return { error: 'Erro ao criar sessão. Tente novamente.' }
  }

  console.log('[login] Sessão criada com sucesso para:', data.user?.id)
  console.log('[login] Access token definido:', !!data.session.access_token)

  return { success: true, user: data.user }
}

// Schema para plano válido
const planSchema = z.enum(['', 'DESCOBERTA', 'MOVIMENTO', 'DIRECAO', 'LIDERANCA']).optional()

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const plan = formData.get('plan') as string

  // Validação de entrada
  const emailValidation = emailSchema.safeParse(email)
  if (!emailValidation.success) {
    return { error: 'E-mail inválido' }
  }

  const passwordValidation = passwordSchema.safeParse(password)
  if (!passwordValidation.success) {
    return { error: 'Senha deve ter no mínimo 8 caracteres' }
  }

  const planValidation = planSchema.safeParse(plan)
  if (!planValidation.success) {
    return { error: 'Plano inválido' }
  }

  // Rate limiting por IP/email
  const rateLimitResult = rateLimit(`signup:${email.toLowerCase()}`, RATE_LIMITS.signup)
  if (!rateLimitResult.success) {
    return { error: 'Muitas tentativas de registro. Tente novamente mais tarde.' }
  }

  const supabase = await createClient()

  // 1. Criar usuário no Supabase Auth (TEMPORARY BYPASS)
  const adminSupabase = createAdminClient();
  const { data, error } = await adminSupabase.auth.admin.createUser({
    email: email.toLowerCase().trim(),
    password,
    email_confirm: true,
    user_metadata: {
      full_name: email.split('@')[0],
    }
  });

  if (error || !data.user) {
    console.error('Signup error:', error?.message);
    return { error: error?.message || 'Erro ao criar conta' };
  }

  // Efetuando signIn automático para gerar os cookies
  await supabase.auth.signInWithPassword({ email, password });


  if (data.user) {
    const nomeExibicao = email.split('@')[0];

    try {
      // 2. Criar Perfil inicial (Multi-tenant)
      await adminSupabase
        .from("Perfil")
        .insert({
          userId: data.user.id,
          email: email.toLowerCase().trim(),
          nomeCompleto: nomeExibicao,
          role: 'ADMIN',
          criadoEm: new Date(),
          atualizadoEm: new Date(),
        });

      // Se houver plano, redireciona direto para o checkout (com bypass de login manual)
      if (plan && plan !== "") {
        // Redireciona para o checkout passando o plano via GET
        return redirect(`${ROUTES.API.CHECKOUT.ROOT}?planKey=${plan}`);
      }

    } catch (dbError) {
      console.error('Critical Signup Data Error:', dbError);
    }
  }

  // Comportamento padrão sem plano: Aviso de e-mail (Legacy)
  redirect(`${ROUTES.PAGES.AUTH.LOGIN}?message=Sucesso! Verifique seu e-mail para ativar sua conta.`)
}
