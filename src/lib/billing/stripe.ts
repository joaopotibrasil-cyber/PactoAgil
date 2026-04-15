import Stripe from 'stripe';

const getStripeClient = () => {
  const isDev = process.env.NODE_ENV === 'development';
  const key = isDev 
    ? (process.env.STRIPE_TEST_SECRET_KEY || '') 
    : (process.env.STRIPE_SECRET_KEY || '');

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
  get: (target, prop) => {
    if (!_stripe) _stripe = getStripeClient();
    return (Object.getOwnPropertyDescriptor(_stripe, prop)?.value || (_stripe as any)[prop]);
  }
});


