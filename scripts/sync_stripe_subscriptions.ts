/**
 * Script para sincronizar manualmente as assinaturas do Stripe com o banco de dados.
 * Usa a API do Stripe para listar assinaturas ativas e grava na tabela Assinatura.
 * 
 * Uso: npx tsx scripts/sync_stripe_subscriptions.ts
 */
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripeKey = 'sk_test_51THNYsKU2r3EjtChUhAh1EFF515GbRgYL0pmeOVN5ykIrjUWLfiu6ZHmdiVpIGsxZH0ZMIV5YkBakSMACPq5R4cK00vtR7MZ9C';

const stripe = new Stripe(stripeKey, { apiVersion: '2025-01-27.acacia' as any });

const supabase = createClient(
  'https://wtochswaejdsycmyyekx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0b2Noc3dhZWpkc3ljbXl5ZWt4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTEzNDI0NCwiZXhwIjoyMDkwNzEwMjQ0fQ.KPV6JOr5BuU2Azjb8H1DRBtYbKItvc2fJXf8oOsXEDk'
);

const testPriceMap: Record<string, string> = {
  'price_1TIGFUKU2r3EjtChs6RNLjj0': 'DESCOBERTA',
  'price_1TIGFVKU2r3EjtChn8dyLnU3': 'MOVIMENTO',
  'price_1TIGFVKU2r3EjtChq7AXlIeX': 'DIRECAO',
  'price_1TIGFWKU2r3EjtChFcLwacfT': 'LIDERANCA',
};

async function main() {
  console.log('🔍 Buscando assinaturas ativas no Stripe (modo teste)...\n');

  const subscriptions = await stripe.subscriptions.list({
    status: 'active',
    expand: ['data.customer'],
    limit: 100,
  });

  console.log(`Encontradas: ${subscriptions.data.length} assinatura(s)\n`);

  for (const sub of subscriptions.data) {
    const customer = sub.customer as Stripe.Customer;
    const priceId = sub.items.data[0]?.price.id;
    const tipoPlano = (priceId ? testPriceMap[priceId] : undefined) || 'DESCOBERTA';
    const email = customer.email;
    const userId = sub.metadata?.userId;

    console.log(`--- Assinatura: ${sub.id}`);
    console.log(`    Cliente: ${customer.name} (${email})`);
    console.log(`    Plano: ${tipoPlano} (${priceId})`);
    console.log(`    UserId (metadata): ${userId || 'NÃO DEFINIDO'}`);

    // Buscar perfil pelo email OU userId
    let perfil: any = null;

    if (userId) {
      const { data } = await supabase
        .from('Perfil')
        .select('*')
        .eq('userId', userId)
        .single();
      perfil = data;
    }

    if (!perfil && email) {
      const { data } = await supabase
        .from('Perfil')
        .select('*')
        .eq('email', email)
        .single();
      perfil = data;
    }

    if (!perfil) {
      console.log(`    ⚠️  Perfil não encontrado para ${email}. Pulando.\n`);
      continue;
    }

    console.log(`    Perfil encontrado: ${perfil.nomeCompleto} (${perfil.id})`);

    let empresaId = perfil.empresaId;

    if (!empresaId) {
      console.log(`    ⚠️  Perfil sem empresa. Pulando.\n`);
      continue;
    }

    // Verificar se já existe uma assinatura
    const { data: assExistente } = await supabase
      .from('Assinatura')
      .select('id')
      .eq('empresaId', empresaId)
      .single();

    const dados = {
      stripeCustomerId: customer.id,
      stripeSubscriptionId: sub.id,
      tipoPlano,
      status: sub.status,
      fimPeriodoAtual: new Date((((sub as any).current_period_end || 0) * 1000)),
      atualizadoEm: new Date(),
    };

    if (assExistente) {
      const { error } = await supabase
        .from('Assinatura')
        .update(dados)
        .eq('id', assExistente.id);
      
      if (error) {
        console.log(`    ❌ Erro ao atualizar: ${error.message}\n`);
      } else {
        console.log(`    ✅ Assinatura ATUALIZADA no banco!\n`);
      }
    } else {
      const { error } = await supabase
        .from('Assinatura')
        .insert({
          id: crypto.randomUUID(),
          empresaId,
          ...dados,
        });

      if (error) {
        console.log(`    ❌ Erro ao inserir: ${error.message}\n`);
      } else {
        console.log(`    ✅ Assinatura CRIADA no banco!\n`);
      }
    }
  }

  console.log('🏁 Sincronização concluída!');
}

main().catch(console.error);
