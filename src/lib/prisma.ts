import { PrismaClient } from '@prisma/client'

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