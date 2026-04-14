import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { createSupabaseClient } from '../lib/supabase/astro';
import { ROUTES } from '../constants/routes';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
});

export const login = defineAction({
  accept: 'form',
  input: loginSchema,
  handler: async (input, { cookies }) => {
    console.log('[Action: Login] Iniciando processamento...');

    const supabase = createSupabaseClient(cookies);
    const { email, password } = input;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[Action: Login] Erro no Supabase:', error.message);
        return { success: false, error: error.message };
      }

      if (!data.session) {
        return { success: false, error: 'Falha ao criar sessão. Tente novamente.' };
      }

      console.log('[Action: Login] Sucesso para:', data.user?.id);
      
      return { 
        success: true, 
        user: data.user,
        redirect: ROUTES.PAGES.DASHBOARD.ROOT 
      };

    } catch (error: any) {
      console.error('[Action: Login] Erro inesperado:', error);
      return { success: false, error: error.message || 'Ocorreu um erro inesperado.' };
    }
  }
});
