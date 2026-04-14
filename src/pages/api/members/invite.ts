import type { APIRoute } from 'astro';
import { createSupabaseClient } from '@/lib/supabase/astro';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/astro-auth-helpers';
import { EmailService } from '@/lib/email/EmailService';
import { ROUTES } from '@/constants/routes';
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

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const authResult = await requireAuth(request, cookies);
    if (authResult instanceof Response) return authResult;
    const userId = authResult;

    const body = await request.json();
    const guestEmail = body.email as string;
    const guestName = body.name as string;

    // Validação de email
    const emailValidation = emailSchema.safeParse(guestEmail);
    if (!emailValidation.success) {
      return new Response(JSON.stringify({ error: 'E-mail inválido.' }), { status: 400 });
    }

    // Validação de nome
    let validatedName = guestName;
    if (guestName && guestName.trim()) {
      const nameValidation = nameSchema.safeParse(guestName.trim());
      if (!nameValidation.success) {
        return new Response(JSON.stringify({ error: 'Nome inválido.' }), { status: 400 });
      }
      validatedName = nameValidation.data;
    }

    const supabase = createSupabaseClient(cookies);

    // 1. Buscar perfil do admin
    const { data: adminPerfil } = await supabase
      .from("Perfil")
      .select("nomeCompleto, empresaId")
      .eq("userId", userId)
      .single();

    if (!adminPerfil?.empresaId) {
      return new Response(JSON.stringify({ error: 'Você não está vinculado a nenhuma empresa.' }), { status: 400 });
    }

    // 2. Buscar empresa
    const { data: empresa } = await supabase
      .from("Empresa")
      .select("id, nome")
      .eq("id", adminPerfil.empresaId)
      .single();

    if (!empresa) {
      return new Response(JSON.stringify({ error: 'Empresa não encontrada.' }), { status: 400 });
    }

    // 3. Buscar assinatura
    const { data: assinatura } = await supabase
      .from("Assinatura")
      .select("tipoPlano")
      .eq("empresaId", empresa.id)
      .single();

    const planKey = (assinatura?.tipoPlano || 'GRATIS').toUpperCase();
    const limit = PLAN_LIMITS[planKey] || 2;

    // 4. Contar membros atuais
    const { count } = await supabase
      .from("Perfil")
      .select("id", { count: "exact", head: true })
      .eq("empresaId", empresa.id);

    if ((count || 0) >= limit) {
      return new Response(JSON.stringify({ error: `Limite do plano atingido (${limit} usuários). Faça upgrade para convidar mais membros.` }), { status: 403 });
    }

    // 5. Verificar se já é membro
    const { data: existing } = await supabase
      .from("Perfil")
      .select("id, empresaId")
      .eq("email", guestEmail)
      .single();

    if (existing) {
      if (existing.empresaId === empresa.id) {
        return new Response(JSON.stringify({ error: 'Este e-mail já é membro da sua organização.' }), { status: 409 });
      }
      return new Response(JSON.stringify({ error: 'Este e-mail já está cadastrado em outra organização.' }), { status: 409 });
    }

    // 6. Gerar link de convite via Supabase Admin
    const adminSupabase = createAdminClient();
    const appUrl = import.meta.env.PUBLIC_APP_URL || 'http://localhost:4321';

    const { data: inviteData, error: inviteError } = await adminSupabase.auth.admin.generateLink({
      type: 'invite',
      email: guestEmail,
      options: {
        redirectTo: `${appUrl}${ROUTES.PAGES.AUTH.CALLBACK}?invited=true`,
        data: { full_name: guestName, empresaId: empresa.id },
      }
    });

    if (inviteError) {
      console.error('[INVITE_ERROR]', inviteError);
      return new Response(JSON.stringify({ error: inviteError.message || 'Erro ao gerar convite.' }), { status: 500 });
    }

    // 7. Disparar e-mail personalizado
    if (inviteData?.properties?.action_link) {
      await EmailService.sendMemberInviteEmail(
        guestEmail.toLowerCase().trim(),
        validatedName || (guestEmail.split('@')[0] ?? guestEmail),
        adminPerfil.nomeCompleto || 'Um administrador',
        empresa.nome,
        inviteData.properties.action_link
      );
    }

    // 8. Pré-criar Perfil vinculado à empresa
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

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[INVITE_MEMBER_ERROR]', error);
    return new Response(JSON.stringify({ error: 'Erro interno: ' + (error.message || 'Desconhecido') }), { status: 500 });
  }
}
