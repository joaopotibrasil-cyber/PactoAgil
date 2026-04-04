import { PrismaClient as PrismaClientEdge } from '@prisma/client';

// Contorno DEFINITIVO para o bug do Turbopack no Next.js (forçando o Edge runtime):
// Ao invés de usar o '@prisma/client' que o Next.js intercepta,
// buscamos diretamente no pacote oculto .prisma gerado pelo CLI.
let PrismaClient: typeof PrismaClientEdge;
if (typeof window === 'undefined') {
  PrismaClient = require('.prisma/client').PrismaClient;
} else {
  PrismaClient = PrismaClientEdge; // fallback no edge/browser (apesar de sabermos que falha, mas evita crashes sintáticos)
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

/**
 * Proxied Prisma Client
 * This prevents the PrismaClient from initializing during the 'next build' process
 * where DATABASE_URL might be missing or the environment is not ready for a connection.
 * It only initializes globalThis.prisma on the first actual property access.
 */
const prisma = new Proxy({} as ReturnType<typeof prismaClientSingleton>, {
  get: (target, prop) => {
    if (prop === 'then') return undefined; // Avoid issues with async resolution if proxy is awaited
    
    if (!globalThis.prisma) {
      globalThis.prisma = prismaClientSingleton()
    }
    return (globalThis.prisma as any)[prop]
  }
})

export default prisma