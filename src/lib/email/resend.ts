import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is missing');
}

export const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Utilitários para gerenciamento de domínios (conforme solicitado pelo usuário)
 */
export const domainManager = {
  create: async (name: string) => {
    return await resend.domains.create({ name });
  },
  get: async (id: string) => {
    return await resend.domains.get(id);
  },
  verify: async (id: string) => {
    return await resend.domains.verify(id);
  },
  update: async (id: string, options: { openTracking?: boolean; clickTracking?: boolean }) => {
    return await resend.domains.update({ id, ...options });
  },
  list: async () => {
    return await resend.domains.list();
  },
  remove: async (id: string) => {
    return await resend.domains.remove(id);
  }
};
