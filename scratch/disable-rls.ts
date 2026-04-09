import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const tables = [
    'Empresa',
    'Perfil',
    'Assinatura',
    'Negociacao',
    'HistoricoPagamento',
    'SistemaToken'
  ]

  console.log('Iniciando desativação de RLS...')

  for (const table of tables) {
    try {
      console.log(`- Desativando RLS na tabela ${table}...`)
      await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY;`)
      await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "Public lookup" ON "${table}";`)
      await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "Authenticated users only" ON "${table}";`)
      console.log(`  Sucesso.`)
    } catch (err) {
      console.error(`  Erro ao processar tabela ${table}:`, err)
    }
  }

  console.log('Finalizado.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
