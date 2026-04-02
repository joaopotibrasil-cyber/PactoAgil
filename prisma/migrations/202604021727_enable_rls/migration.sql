-- 1. Habilitar RLS em todas as tabelas
ALTER TABLE "Empresa" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Perfil" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Assinatura" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Negociacao" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "HistoricoPagamento" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SistemaToken" ENABLE ROW LEVEL SECURITY;

-- 2. Política para Perfil (Usuário vê a si mesmo ou membros da sua empresa)
CREATE POLICY "Usuários veem seus próprios perfis" 
ON "Perfil" FOR ALL 
USING (auth.uid()::text = "userId");

-- 3. Política para Empresa (Usuário vê apenas a empresa vinculada ao seu perfil)
CREATE POLICY "Usuários veem sua empresa vinculada" 
ON "Empresa" FOR ALL 
USING (
  id IN (
    SELECT "empresaId" FROM "Perfil" WHERE "userId" = auth.uid()::text
  )
);

-- 4. Política para Assinatura (Filtro por empresaId)
CREATE POLICY "Acesso à assinatura via empresa" 
ON "Assinatura" FOR ALL 
USING (
  "empresaId" IN (
    SELECT "empresaId" FROM "Perfil" WHERE "userId" = auth.uid()::text
  )
);

-- 5. Política para Negociação (Isolamento de negociações por empresa)
CREATE POLICY "Acesso às negociações da empresa" 
ON "Negociacao" FOR ALL 
USING (
  "empresaId" IN (
    SELECT "empresaId" FROM "Perfil" WHERE "userId" = auth.uid()::text
  )
);

-- 6. Política para Histórico de Pagamento
CREATE POLICY "Acesso ao histórico de pagamentos da empresa" 
ON "HistoricoPagamento" FOR ALL 
USING (
  "empresaId" IN (
    SELECT "empresaId" FROM "Perfil" WHERE "userId" = auth.uid()::text
  )
);

-- 7. Política para SistemaToken
CREATE POLICY "Acesso aos tokens da empresa" 
ON "SistemaToken" FOR ALL 
USING (
  "empresaId" IN (
    SELECT "empresaId" FROM "Perfil" WHERE "userId" = auth.uid()::text
  )
);
