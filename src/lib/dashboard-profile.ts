import prisma from '@/lib/prisma';

/** Select mínimo para /api/profile e SSR do dashboard (evita include pesado). */
const dashboardProfileSelect = {
  nomeCompleto: true,
  email: true,
  role: true,
  avatarUrl: true,
  empresa: {
    select: {
      id: true,
      nome: true,
      cnpj: true,
      funcionalidade: true,
      logoUrl: true,
      corPrimaria: true,
      assinatura: {
        select: {
          tipoPlano: true,
          status: true,
          fimPeriodoAtual: true,
        },
      },
      usuarios: {
        select: {
          id: true,
          nomeCompleto: true,
          email: true,
          role: true,
          avatarUrl: true,
        },
      },
    },
  },
} as const;

export type DashboardProfileJson = {
  perfil: {
    nomeCompleto: string | null;
    email: string;
    role: string;
    avatarUrl: string | null;
  };
  empresa: {
    id: string;
    nome: string;
    cnpj: string | null;
    funcionalidade: string | null;
    logoUrl: string | null;
    corPrimaria: string | null;
  } | null;
  assinatura: {
    tipoPlano: string;
    status: string;
    fimPeriodoAtual: string | null;
  } | null;
  membros: Array<{
    id: string;
    nomeCompleto: string | null;
    email: string;
    role: string;
    avatarUrl: string | null;
  }>;
  nomeCompleto: string;
  email: string;
  role: string;
  empresaNome: string;
  plano: string;
  logoUrl: string | null;
  corPrimaria: string | null;
};

function serializeAssinatura(
  row: { tipoPlano: string; status: string; fimPeriodoAtual: Date | null } | null | undefined
): DashboardProfileJson['assinatura'] {
  if (!row) return null;
  return {
    tipoPlano: row.tipoPlano,
    status: row.status,
    fimPeriodoAtual: row.fimPeriodoAtual ? row.fimPeriodoAtual.toISOString() : null,
  };
}

/**
 * Corpo JSON do GET /api/profile — uma única query Prisma compartilhada com o layout Astro.
 */
export async function getDashboardProfileJson(
  userId: string,
  fallbackEmail: string | null
): Promise<DashboardProfileJson> {
  const perfil = await prisma.perfil.findUnique({
    where: { userId },
    select: dashboardProfileSelect,
  });

  if (!perfil) {
    return {
      perfil: {
        nomeCompleto: 'Usuário',
        email: fallbackEmail || '',
        role: 'USER',
        avatarUrl: null,
      },
      empresa: null,
      assinatura: null,
      membros: [],
      nomeCompleto: 'Usuário',
      email: fallbackEmail || '',
      role: 'USER',
      empresaNome: 'Sem empresa',
      plano: 'SEM PLANO',
      logoUrl: null,
      corPrimaria: null,
    };
  }

  const empresaData = perfil.empresa
    ? {
        id: perfil.empresa.id,
        nome: perfil.empresa.nome,
        cnpj: perfil.empresa.cnpj,
        funcionalidade: perfil.empresa.funcionalidade,
        logoUrl: perfil.empresa.logoUrl,
        corPrimaria: perfil.empresa.corPrimaria,
      }
    : null;

  const assinaturaData = serializeAssinatura(perfil.empresa?.assinatura);
  const membrosData = perfil.empresa?.usuarios ?? [];

  return {
    perfil: {
      nomeCompleto: perfil.nomeCompleto,
      email: perfil.email,
      role: perfil.role,
      avatarUrl: perfil.avatarUrl,
    },
    empresa: empresaData,
    assinatura: assinaturaData,
    membros: membrosData,
    nomeCompleto: perfil.nomeCompleto || 'Usuário',
    email: perfil.email || fallbackEmail || '',
    role: perfil.role || 'USER',
    empresaNome: empresaData?.nome || 'Sem empresa',
    plano: assinaturaData?.tipoPlano || 'SEM PLANO',
    logoUrl: empresaData?.logoUrl ?? null,
    corPrimaria: empresaData?.corPrimaria ?? null,
  };
}

/** Props mínimas para o shell (tema + usuário) vindas do SSR. */
export function shellProfileFromJson(json: DashboardProfileJson) {
  return {
    nomeCompleto: json.nomeCompleto,
    email: json.email,
    role: json.role,
    empresaNome: json.empresaNome,
    plano: json.plano,
    logoUrl: json.logoUrl || undefined,
    corPrimaria: json.corPrimaria || undefined,
  };
}
