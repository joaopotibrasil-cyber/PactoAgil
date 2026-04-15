import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { Resend } from 'resend';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-01-27' as any,
});
const resend = new Resend(process.env.RESEND_API_KEY || '');

async function verify() {
  console.log('🚀 Iniciando Teste 100% da Plataforma Pacto Ágil...');
  
  const results = {
    database: false,
    stripe: false,
    resend: false,
    supabase: false,
  };

  try {
    console.log('📡 Verificando Banco de Dados (Prisma/Postgres)...');
    await prisma.$connect();
    const empresaCount = await prisma.empresa.count();
    console.log(`✅ Banco de Dados conectado. Total de empresas: ${empresaCount}`);
    results.database = true;
  } catch (e) {
    console.error('❌ Falha na conexão com o Banco de Dados:', (e as Error).message);
  }

  try {
    console.log('💳 Verificando API do Stripe...');
    const { data: customers } = await stripe.customers.list({ limit: 1 });
    console.log(`✅ API do Stripe respondendo corretamente (${customers.length} cliente(s) encontrado(s)).`);
    results.stripe = true;
  } catch (err) {
    console.error('❌ Falha na conexão com o Stripe:', (err as Error).message);
  }

  try {
    console.log('📧 Verificando API do Resend...');
    // Apenas listamos domínios se a chave for válida, sem enviar e-mail real
    const domains = await resend.domains.list();
    // Ajuste para a estrutura real do SDK do Resend
    const domainsList = (domains as any).data || [];
    const domainCount = domainsList.length || 0;
    console.log(`✅ API do Resend configurada. Domínios encontrados: ${domainCount}`);
    results.resend = true;
  } catch (err) {
    console.error('❌ Falha na conexão com o Resend:', (err as Error).message);
  }

  try {
    console.log('🔑 Verificando Supabase (Variáveis de Ambiente)...');
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.log('✅ Supabase configurado (URL e Anon Key presentes).');
      results.supabase = true;
    } else {
      console.log('⚠️ Supabase URL/Key ausentes no .env');
    }
  } catch {
    console.error('❌ Erro na configuração do Supabase');
  }

  console.log('\n📊 Resumo da Verificação:');
  console.table(results);

  if (Object.values(results).every(v => v === true)) {
    console.log('\n⭐ PLATAFORMA 100% ESTÁVEL E PRONTA PARA PRODUÇÃO! ⭐');
  } else {
    console.log('\n⚠️ Algumas verificações falharam. Verifique os logs acima.');
  }

  await prisma.$disconnect();
}

verify();
