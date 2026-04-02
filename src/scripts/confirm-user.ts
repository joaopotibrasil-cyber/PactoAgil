import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function confirmUser(email: string) {
  console.log(`🔍 Procurando usuário: ${email}...`);
  
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('❌ Erro ao listar usuários:', listError.message);
    process.exit(1);
  }

  const user = users.find(u => u.email === email);

  if (!user) {
    console.error('❌ Usuário não encontrado.');
    process.exit(1);
  }

  console.log(`✅ Usuário encontrado ID: ${user.id}. Confirmando...`);

  const { error: updateError } = await supabase.auth.admin.updateUserById(
    user.id,
    { email_confirm: true }
  );

  if (updateError) {
    console.error('❌ Erro ao confirmar usuário:', updateError.message);
    process.exit(1);
  }

  console.log('⭐ USUÁRIO CONFIRMADO COM SUCESSO! ⭐');
}

const targetEmail = process.argv[2] || 'cfpopilynx@gmail.com';
confirmUser(targetEmail);
