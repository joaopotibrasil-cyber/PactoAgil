import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

/**
 * Singleton do Prisma Client com Driver Adapter (pg).
 * Esta configuração é ideal para ambientes Serverless/Edge do Next.js 15,
 * pois utiliza o engine WASM (Rust-free) e evita problemas com binários nativos.
 */

const prismaClientSingleton = () => {
  const connectionString = import.meta.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined');
  }

  // Configuração do Pool do Postgres
  // Supabase (e bancos cloud em geral) muitas vezes exige SSL. Definimos `rejectUnauthorized: false`
  // para evitar erros de certificados ausentes/desatualizados no servidor de hospedagem.
  const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
  
  const pool = new pg.Pool({ 
    connectionString,
    ssl: isLocal ? undefined : { rejectUnauthorized: false }
  });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: ['error'],
  });
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

// Persistência da instância para gerenciar hot-reload em desenvolvimento
const client = globalThis.prisma ?? prismaClientSingleton();

if (!import.meta.env.PROD) {
  globalThis.prisma = client;
}

/**
 * Proxied Prisma Client para segurança durante o build.
 */
const prisma = new Proxy(client, {
  get: (target, prop) => {
    if (prop === 'then') return undefined;
    return (client as any)[prop];
  }
});

export default prisma;