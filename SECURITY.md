# 🔒 Guia de Segurança - Pacto Ágil

## ⚠️ URGENTE: Credenciais Expostas

O arquivo `.env` anterior continha **credenciais reais de produção** e foi removido. **Você DEVE** rotacionar todas as chaves imediatamente:

### Chaves que precisam ser revogadas/rotacionadas:

1. **Stripe** (mais crítico!)
   - Acesse: https://dashboard.stripe.com/apikeys
   - Revogue: `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`
   - Revogue: `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`
   - Gere novas chaves e configure como variáveis de ambiente na Vercel

2. **Supabase**
   - Acesse: https://app.supabase.io/project/_/settings/api
   - Gere nova `SERVICE_ROLE_KEY` (não revogue ANON_KEY)

3. **Groq**
   - Acesse: https://console.groq.com/keys
   - Revogue e gere nova API key

4. **Resend**
   - Acesse: https://resend.com/api-keys
   - Revogue e gere nova API key

## Configuração do Ambiente

1. Copie `.env.example` para `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Preencha todas as variáveis com valores reais

3. **NUNCA** commite o arquivo `.env.local`

4. Configure as variáveis no painel da Vercel:
   - Project Settings > Environment Variables

## Melhorias de Segurança Implementadas

✅ Middleware de autenticação reativado
✅ Rate limiting em rotas sensíveis (login, signup, checkout, invite)
✅ Validação de entradas com Zod
✅ Headers de segurança (CSP, HSTS, X-Frame-Options, etc.)
✅ Sanitização de queries de busca
✅ Proteção contra brute force em autenticação

## Próximos Passos Recomendados

1. [ ] Remover credenciais do histórico do Git (BFG Repo-Cleaner)
2. [ ] Ativar 2FA nas contas Stripe, Supabase, etc.
3. [ ] Configurar alertas de segurança no Stripe
4. [ ] Habilitar RLS (Row Level Security) no Supabase
5. [ ] Configurar CORS restrito no Supabase
6. [ ] Implementar logging de auditoria
7. [ ] Configurar monitoramento de erros (Sentry)

## Comando para Limpar Histórico do Git

```bash
# Instalar BFG Repo-Cleaner
brew install bfg

# Ou baixar de: https://rtyley.github.io/bfg-repo-cleaner/

# Criar arquivo com padrões sensíveis
echo ".env" > passwords.txt
echo "sk_live_" >> passwords.txt
echo "gsk_" >> passwords.txt

# Rodar BFG
bfg --replace-text passwords.txt .git

# Limpar e forçar push
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Forçar push (CUIDADO!)
git push --force
```

## Contato de Emergência

Se suspeitar de uso indevito das credenciais:
1. Revogue imediatamente todas as chaves
2. Verifique logs de acesso no Stripe Dashboard
3. Verifique transações suspeitas
4. Notifique a equipe
