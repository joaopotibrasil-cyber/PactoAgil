import Stripe from 'stripe';
import * as fs from 'fs';
import * as path from 'path';

const stripe = new Stripe('sk_test_51THNYsKU2r3EjtChUhAh1EFF515GbRgYL0pmeOVN5ykIrjUWLfiu6ZHmdiVpIGsxZH0ZMIV5YkBakSMACPq5R4cK00vtR7MZ9C', {
  apiVersion: '2025-01-27.acacia' as any,
});

async function main() {
  const perfis = [
    { key: 'DESCOBERTA', name: 'Plano Descoberta', price: 9900 },
    { key: 'MOVIMENTO', name: 'Plano Movimento', price: 19900 },
    { key: 'DIRECAO', name: 'Plano Direção', price: 34900 },
    { key: 'LIDERANCA', name: 'Plano Liderança', price: 49900 },
  ];

  const envPath = path.join(process.cwd(), '.env');
  let envContent = fs.readFileSync(envPath, 'utf8');

  for (const plano of perfis) {
    try {
      const product = await stripe.products.create({ name: plano.name });
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: plano.price,
        currency: 'brl',
        recurring: { interval: 'month' },
      });

      const regex = new RegExp(`STRIPE_PRICE_ID_${plano.key}=.*`, 'g');
      envContent = envContent.replace(regex, `STRIPE_PRICE_ID_${plano.key}="${price.id}"`);
      
      console.log(`✅ Substituído: ${plano.name} -> ${price.id}`);
    } catch (e) {
      console.error(`Erro ao criar ${plano.name}:`, Object(e).message);
    }
  }

  // Grava de volta
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('✅ Arquivo .env atualizado com as chaves Testes de Produtos!');
}

main();
