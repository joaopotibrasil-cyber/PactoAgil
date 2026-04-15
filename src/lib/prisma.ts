import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const prismaClientSingleton = () => {
  const connectionString = import.meta.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('[Prisma] DATABASE_URL não encontrada no ambiente.');
  }

  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({ 
    adapter,
    log: ['error', 'warn'] 
  });
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const client = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = client;
}

const prisma = new Proxy(client, {
  get(target, prop) {
    if (prop === 'then') return undefined;
    
    const value = target[prop as keyof typeof target];
    
    if (typeof value === 'function') {
      return async (...args: any[]) => {
        try {
          return await (value as Function).apply(target, args);
        } catch (error: any) {
          console.error('[Prisma Error]', error.message);
          throw error;
        }
      };
    }
    
    return value;
  }
});

export default prisma;
