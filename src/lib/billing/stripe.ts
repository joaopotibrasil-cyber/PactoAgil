import Stripe from 'stripe';

const key = process.env.STRIPE_SECRET_KEY || '';

export const stripe = new Stripe(key, {
  apiVersion: '2025-01-27.acacia' as any, // Versao estável ou a mais recente suportada
  typescript: true,
});

if (!process.env.STRIPE_SECRET_KEY && process.env.NODE_ENV === 'production') {
  console.warn('⚠️ STRIPE_SECRET_KEY is missing in production environment');
}
