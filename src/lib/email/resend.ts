import { Resend } from 'resend';

let _resend: InstanceType<typeof Resend> | null = null;

export const getResendClient = () => {
  if (!_resend) {
    const apiKey = process.env.RESEND_API_KEY || '';
    if (!apiKey) {
      console.warn('⚠️ RESEND_API_KEY não encontrada no ambiente.');
    }
    _resend = new Resend(apiKey);
  }
  return _resend;
};

/**
 * Cliente Resend protegido por Proxy (Lazy initialization).
 * Evita o erro de API Key ausente durante o build do Next.js.
 */
export const resend = new Proxy({} as InstanceType<typeof Resend>, {
  get: (target, prop) => {
    const client = getResendClient();
    return (Object.getOwnPropertyDescriptor(client, prop)?.value || (client as any)[prop]);
  }
});

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
