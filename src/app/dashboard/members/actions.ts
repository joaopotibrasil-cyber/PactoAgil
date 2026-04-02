'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { EmailService } from '@/lib/email/EmailService';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { z } from 'zod';

const emailSchema = z.string().email().min(5).max(254);
const nameSchema = z.string().min(2).max(100).regex(/^[\p{L}\s'-]+$/u, 'Nome contém caracteres inválidos');

const PLAN_LIMITS: Record<string, number> = {
  "DESCOBERTA": 2,
  "MOVIMENTO": 3,
  "DIRECAO": 7,
  "LIDERANCA": 10,
  "GRATIS": 2,
};

export async function inviteMemberAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Não autorizado.' };

  // Rate limiting por userId
  const rateLimitResult = rateLimit(`invite:${user.id}`, RATE_LIMITS.invite);
  if (!rateLimitResult.success) {
    return { error: 'Muitos convites enviados. Tente novamente mais tarde.' };
  }

  const guestEmail = formData.get('email') as string;
  const guestName = formData.get('name') as string;

  // Validação de email
  const emailValidation = emailSchema.safeParse(guestEmail);
  if (!emailValidation.success) {
    return { error: 'E-mail inválido.' };
  }

  // Validação de nome (opcional)
  let validatedName = guestName;
  if (guestName && guestName.trim()) {
    const nameValidation = nameSchema.safeParse(guestName.trim());
    if (!nameValidation.success) {
      return { error: 'Nome inválido.' };
    }
    validatedName = nameValidation.data;
  }

  // 1. Buscar empresa e assinatura do admin que está convidando
  const adminPerfil = await prisma.perfil.findUnique({
    where: { userId: user.id },
    include: {
      empresa: {
        include: {
          assinatura: true,
          usuarios: true,
        }
      }
    }
  });

  if (!adminPerfil?.empresa) {
    return { error: 'Você não está vinculado a nenhuma empresa.' };
  }

  const empresa = adminPerfil.empresa;
  const planKey = (empresa.assinatura?.tipoPlano || 'GRATIS').toUpperCase();
  const limit = PLAN_LIMITS[planKey] || 2;
  const currentCount = empresa.usuarios.length;

  if (currentCount >= limit) {
    return { error: `Limite do plano atingido (${limit} usuários). Faça upgrade para convidar mais membros.` };
  }

  // 2. Verificar se o e-mail já é membro desta empresa
  const existing = await prisma.perfil.findUnique({ where: { email: guestEmail } });
  if (existing) {
    if (existing.empresaId === empresa.id) {
      return { error: 'Este e-mail já é membro da sua organização.' };
    }
    return { error: 'Este e-mail já está cadastrado em outra organização.' };
  }

  // 3. Gerar link de convite via Supabase Admin (para enviar e-mail manual personalizado)
  const adminSupabase = createAdminClient();
  
  const { data: inviteData, error: inviteError } = await adminSupabase.auth.admin.generateLink({
    type: 'invite',
    email: guestEmail,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?invited=true`,
      data: { full_name: guestName, empresaId: empresa.id },
    }
  });

  if (inviteError) {
    console.error('[INVITE_ERROR]', inviteError);
    return { error: inviteError.message || 'Erro ao gerar convite.' };
  }

  // 4. Disparar E-mail Personalizado via EmailService
  if (inviteData?.properties?.action_link) {
    await EmailService.sendMemberInviteEmail(
      guestEmail.toLowerCase().trim(),
      validatedName || guestEmail.split('@')[0],
      adminPerfil.nomeCompleto || 'Um administrador',
      empresa.nome,
      inviteData.properties.action_link
    );
  }

  // 5. Pré-criar Perfil vinculado à empresa (será completado no callback)
  // Nota: inviteData.user contém os dados do usuário convidado criado no Supabase Auth
  if (inviteData?.user) {
    await prisma.perfil.create({
      data: {
        userId: inviteData.user.id,
        email: guestEmail.toLowerCase().trim(),
        nomeCompleto: validatedName || guestEmail.split('@')[0],
        empresaId: empresa.id,
        role: 'MEMBER',
      }
    });
  }

  revalidatePath('/dashboard/members');
  return { success: true };
}
