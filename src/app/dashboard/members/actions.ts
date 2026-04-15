'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { EmailService } from '@/lib/email/EmailService';
import { ROUTES } from '@/constants/routes';
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

  // Validação de nome
  let validatedName = guestName;
  if (guestName && guestName.trim()) {
    const nameValidation = nameSchema.safeParse(guestName.trim());
    if (!nameValidation.success) {
      return { error: 'Nome inválido.' };
    }
    validatedName = nameValidation.data;
  }

  // 1. Buscar perfil do admin que está convidando
  const adminSupabaseRead = await createClient();
  const { data: adminPerfil } = await adminSupabaseRead
    .from("Perfil")
    .select("nomeCompleto, empresaId")
    .eq("userId", user.id)
    .single();

  if (!adminPerfil?.empresaId) {
    return { error: 'Você não está vinculado a nenhuma empresa.' };
  }

  // 2. Buscar empresa
  const { data: empresa } = await adminSupabaseRead
    .from("Empresa")
    .select("id, nome")
    .eq("id", adminPerfil.empresaId)
    .single();

  if (!empresa) {
    return { error: 'Empresa não encontrada.' };
  }

  // 3. Buscar assinatura
  const { data: assinatura } = await adminSupabaseRead
    .from("Assinatura")
    .select("tipoPlano")
    .eq("empresaId", empresa.id)
    .single();

  const planKey = (assinatura?.tipoPlano || 'GRATIS').toUpperCase();
  const limit = PLAN_LIMITS[planKey] || 2;

  // 4. Contar membros atuais
  const { count } = await adminSupabaseRead
    .from("Perfil")
    .select("id", { count: "exact", head: true })
    .eq("empresaId", empresa.id);

  const currentCount = count || 0;

  if (currentCount >= limit) {
    return { error: `Limite do plano atingido (${limit} usuários). Faça upgrade para convidar mais membros.` };
  }

  // 5. Verificar se o e-mail já é membro
  const { data: existing } = await adminSupabaseRead
    .from("Perfil")
    .select("id, empresaId")
    .eq("email", guestEmail)
    .single();

  if (existing) {
    if (existing.empresaId === empresa.id) {
      return { error: 'Este e-mail já é membro da sua organização.' };
    }
    return { error: 'Este e-mail já está cadastrado em outra organização.' };
  }

  // 6. Gerar link de convite via Supabase Admin
  const adminSupabase = createAdminClient();
  
  const { data: inviteData, error: inviteError } = await adminSupabase.auth.admin.generateLink({
    type: 'invite',
    email: guestEmail,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}${ROUTES.PAGES.AUTH.CALLBACK}?invited=true`,
      data: { full_name: guestName, empresaId: empresa.id },
    }
  });

  if (inviteError) {
    console.error('[INVITE_ERROR]', inviteError);
    return { error: inviteError.message || 'Erro ao gerar convite.' };
  }

  // 7. Disparar E-mail Personalizado via EmailService
  if (inviteData?.properties?.action_link) {
    await EmailService.sendMemberInviteEmail(
      guestEmail.toLowerCase().trim(),
      validatedName || guestEmail.split('@')[0],
      adminPerfil.nomeCompleto || 'Um administrador',
      empresa.nome,
      inviteData.properties.action_link
    );
  }

  // 8. Pré-criar Perfil vinculado à empresa via Supabase Admin
  if (inviteData?.user) {
    const { error: createError } = await adminSupabase
      .from("Perfil")
      .insert({
        userId: inviteData.user.id,
        email: guestEmail.toLowerCase().trim(),
        nomeCompleto: validatedName || guestEmail.split('@')[0],
        empresaId: empresa.id,
        role: 'MEMBER',
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      });

    if (createError) {
      console.error('[INVITE_PROFILE_CREATE_ERROR]', createError);
    }
  }

  revalidatePath(ROUTES.PAGES.DASHBOARD.MEMBERS);
  return { success: true };
}
