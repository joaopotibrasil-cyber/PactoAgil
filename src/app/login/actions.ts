'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { z } from 'zod'

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

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Login error:', error.message)
    // Em uma aplicação real, retornaríamos o erro para a UI
    return { error: error.message }
  }

  redirect('/dashboard')
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

  // 1. Criar usuário no Supabase
  const { data, error } = await supabase.auth.signUp({
    email: email.toLowerCase().trim(),
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    }
  })

  if (error) {
    console.error('Signup error:', error.message)
    return { error: error.message }
  }

  if (data.user) {
    const nomeExibicao = email.split('@')[0];

    try {
      // 2. Criar Perfil inicial (Multi-tenant)
      await prisma.perfil.create({
        data: {
          userId: data.user.id,
          email: email,
          nomeCompleto: nomeExibicao,
          role: 'ADMIN'
        }
      });

      // Se houver plano, redireciona direto para o checkout (com bypass de login manual)
      if (plan && plan !== "") {
        // Redireciona para o checkout passando o plano via GET
        return redirect(`/api/checkout?planKey=${plan}`);
      }

    } catch (dbError) {
      console.error('Critical Signup Data Error:', dbError);
    }
  }

  // Comportamento padrão sem plano: Aviso de e-mail (Legacy)
  redirect('/login?message=Sucesso! Verifique seu e-mail para ativar sua conta.')
}
