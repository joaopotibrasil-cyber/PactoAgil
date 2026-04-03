# 🚀 Pacto Ágil - SaaS de Negociações Coletivas

O **Pacto Ágil** é uma plataforma SaaS (Software as a Service) de alta performance projetada para revolucionar a gestão de negociações coletivas (ACT e CCT). Combinando o sistema de design **Midnight Luxe** com inteligência artificial de ponta, o sistema oferece transparência, agilidade e inteligência estratégica para departamentos jurídicos e RHs.

---

## ✨ Design System: Midnight Luxe
A estética do Pacto Ágil foi construída sobre os pilares da sofisticação e clareza visual:
- **Cores Principais:** Midnight Navy (#020C1E) e Cyan Vibrante (#00F2FF).
- **Tipografia:** Moderna e legível (Geist/Inter).
- **UI/UX:** Componentes de alta fidelidade com micro-animações, foco em tabelas de dados densas e dashboards intuitivos.

---

## 🛠️ Stack Tecnológica

- **Frontend:** [Next.js](https://nextjs.org/) (App Router, Server Components).
- **Backend:** [Node.js](https://nodejs.org/) & Next.js API Routes.
- **Banco de Dados:** [PostgreSQL](https://www.postgresql.org/) (via [Supabase](https://supabase.com/)).
- **ORM:** [Prisma](https://www.prisma.io/).
- **Autenticação:** [Supabase Auth](https://supabase.com/auth).
- **Pagamentos:** [Stripe](https://stripe.com/) (Checkout, Assinaturas e Webhooks).
- **E-mails Transacionais:** [Resend](https://resend.com/) com templates premium em React.
- **Inteligência Artificial:** [Groq AI](https://groq.com/) (Integração com Llama 3 para análise de cláusulas).

---

## 🏗️ Funcionalidades Principais

1.  **Onboarding B2B Completo:** Fluxo fluido de registro de empresa, checkout de planos e ativação instantânea.
2.  **Gestão de Membros:** Sistema de convites personalizados por e-mail com controle de limites por plano.
3.  **Planos de Assinatura:**
    - **Descoberta:** Essencial para pequenas operações.
    - **Movimento:** Gestão ativa de negociações.
    - **Direção:** Estratégico com insights avançados.
    - **Liderança:** Full-access para grandes corporações.
4.  **Segurança de Dados:** Protocolos rigorosos de RLS (Row Level Security) e isolamento multi-tenant via Prisma.
5.  **Dashboard Estratégico:** Visão consolidada de todas as negociações em curso.

---

## 🚀 Como Iniciar

### Pré-requisitos
- Node.js (v18+)
- Conta no Supabase (Banco de Dados e Auth)
- Conta no Stripe (Pagamentos)
- API Key do Resend e Groq

### Instalação

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/Popilynx/PactoAgil.git
    cd PactoAgil/app
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure as variáveis de ambiente:**
    Crie um arquivo `.env` na raiz da pasta `app` com as seguintes chaves (veja o `.env.example` para referência):
    ```env
    DATABASE_URL=
    NEXT_PUBLIC_SUPABASE_URL=
    NEXT_PUBLIC_SUPABASE_ANON_KEY=
    SUPABASE_SERVICE_ROLE_KEY=
    STRIPE_SECRET_KEY=
    RESEND_API_KEY=
    GROQ_API_KEY=
    ```

4.  **Prepare o Banco de Dados:**
    ```bash
    npx prisma generate
    npx prisma db push
    ```

5.  **Inicie o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```

---

## 📦 Scripts Disponíveis

- `npm run dev`: Inicia o ambiente de desenvolvimento.
- `npm run build`: Prepara a aplicação para produção (inclui geração do Prisma Client).
- `npm run start`: Inicia o servidor de produção.
- `npm run lint`: Verifica a qualidade do código com ESLint.

---

## 📄 Licença
Propriedade privada de **Popilynx / Pacto Ágil**. Todos os direitos reservados.

---
*Desenvolvido com ⚡ e precisão estratégica para o futuro das relações de trabalho.*
