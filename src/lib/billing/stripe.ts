import Stripe from 'stripe';

const getStripeClient = () => {
  const isDev = import.meta.env.DEV;
  const key = isDev 
    ? (import.meta.env.STRIPE_TEST_SECRET_KEY || '') 
    : (import.meta.env.STRIPE_SECRET_KEY || '');

  if (!key) {
    console.warn('⚠️ STRIPE SECRET KEY não encontrada no ambiente.');
  }

  return new Stripe(key, {
    apiVersion: '2025-01-27.acacia' as any,
    typescript: true,
  });
};

let _stripe: Stripe | null = null;

export const stripe = new Proxy({} as Stripe, {
  get: (_target, prop) => {
    if (!_stripe) _stripe = getStripeClient();
    return (Object.getOwnPropertyDescriptor(_stripe, prop)?.value || (_stripe as any)[prop]);
  }
});


