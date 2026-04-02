'use server';

import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';
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
  const supabase = await createClient();
  
  const rawData = Object.fromEntries(formData.entries());
  const validated = registerSchema.safeParse(rawData);

  if (!validated.success) {
    return { error: 'Dados inválidos. Verifique os campos.' };
  }

  const { fullName, email, password, companyName, cnpj, funcionalidade, existingCompanyId, planKey } = validated.data;

  // 1. Criar usuário no Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      }
    }
  });

  if (authError || !authData.user) {
    return { error: authError?.message || 'Erro ao criar conta' };
  }

  try {
    // 2. Criar ou Vincular Empresa e Perfil no Prisma (Transação)
    await prisma.$transaction(async (tx) => {
      let companyId = existingCompanyId;

      if (!companyId) {
        // Criar nova empresa se não selecionada
        if (!companyName || !cnpj) {
          throw new Error('Empresa e CNPJ são obrigatórios para novos registros');
        }
        
        const empresa = await tx.empresa.create({
          data: {
            nome: companyName,
            cnpj: cnpj,
            funcionalidade: funcionalidade,
          }
        });
        companyId = empresa.id;
      }

      await tx.perfil.create({
        data: {
          userId: authData.user!.id,
          email: email,
          nomeCompleto: fullName,
          empresaId: companyId,
          role: 'ADMIN',
        }
      });
    });

    // Redirecionar para o checkout se houver um plano selecionado
    if (planKey && planKey !== 'undefined') {
      redirect(`/api/checkout?planKey=${planKey}`);
    }

    redirect('/dashboard');

  } catch (dbError: any) {
    console.error('[REGISTER_DB_ERROR]', dbError);
    return { error: dbError.message || 'Erro ao salvar dados da empresa.' };
  }
}
