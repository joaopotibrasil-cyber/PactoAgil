import Stripe from 'stripe';

const isDev = process.env.NODE_ENV === 'development';
const key = isDev 
  ? (process.env.STRIPE_TEST_SECRET_KEY || '') 
  : (process.env.STRIPE_SECRET_KEY || '');

export const stripe = new Stripe(key, {
  apiVersion: '2025-01-27.acacia' as any, // Versao estável ou a mais recente suportada
  typescript: true,
});

if (!key) {
  console.warn('⚠️ STRIPE SECRET KEY is missing in the current environment');
}
