export const ROUTES = {
  PAGES: {
    HOME: '/',
    PRICING: '/#pricing',
    AUTH: {
      LOGIN: '/login',
      REGISTER: '/register',
      FORGOT_PASSWORD: '/login/esqueci-senha',
      SIGNOUT: '/auth/signout',
      CALLBACK: '/auth/callback',
    },
    DASHBOARD: {
      ROOT: '/dashboard',
      CONFIG: '/dashboard/configuracoes',
      GENERATOR: '/dashboard/gerador',
      NEGOTIATIONS: '/dashboard/negociacoes',
      MEMBERS: '/dashboard/members',
    },
    CHECKOUT: {
      SUCCESS: '/checkout/success',
    },
  },
  API: {
    AUTH: {
      TOKEN: '/api/auth/token',
    },
    COMPANIES: {
      SEARCH: '/api/companies/search',
    },
    AI: {
      ANALYZE: '/api/ai/analyze',
      GENERATE: '/api/ai/generate',
    },
    CHECKOUT: {
      ROOT: '/api/checkout',
      VERIFY: '/api/checkout/verify',
    },
    NEGOTIATIONS: '/api/negotiations',
    PORTAL: '/api/portal',
    PROFILE: {
      ROOT: '/api/profile',
      UPDATE: '/api/profile/update',
    },
    WEBHOOK: '/api/webhook',
  }
} as const;
