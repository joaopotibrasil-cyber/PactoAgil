import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const emails = ['contato@cursoecertificado.com.br', 'renato@starwars1.com.br'];
  const profiles = await prisma.perfil.findMany({
    where: { email: { in: emails } }
  });
  console.log('Profiles found:', JSON.stringify(profiles, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
