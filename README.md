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

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router, Server Components).
- **Estilização:** [Tailwind CSS 4](https://tailwindcss.com/).
- **Banco de Dados:** [PostgreSQL](https://www.postgresql.org/) (via [Supabase](https://supabase.com/)).
- **ORM:** [Prisma 7](https://www.prisma.io/).
- **Autenticação:** [Supabase Auth](https://supabase.com/auth) (via `@supabase/ssr`).
- **Pagamentos:** [Stripe](https://stripe.com/) (Checkout e Billing Portal).
- **IA:** [Groq AI](https://groq.com/) & [Google Generative AI](https://ai.google.dev/).

---

## 🏗️ Funcionalidades Principais

1.  **Onboarding B2B:** Registro de empresa e checkout integrado.
2.  **Gestão de Membros:** Controle de acesso e convites para diretores/gestores.
3.  **Análise de Cláusulas:** Inteligência artificial para agilizar ACTs e CCTs.
4.  **Dashboard Midnight Luxe:** Interface premium com foco em produtividade.

---

## 🚀 Como Iniciar

### Pré-requisitos
- Node.js (**v20.19.0+**)
- NPM (**v10+**)
- Supabase, Stripe, Resend e Groq API Keys.

### Instalação

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/joaopotibrasil-cyber/PactoAgil.git
    cd PactoAgil
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure as variáveis de ambiente:**
    Crie um arquivo `.env` na raiz com as chaves necessárias (DATABASE_URL, SUPABASE, STRIPE, etc).

4.  **Prepare o Banco de Dados:**
    ```bash
    npx prisma generate
    ```

5.  **Inicie o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```

---

## 📦 Scripts e Deploy (Hostinger)

A aplicação está otimizada para rodar em ambientes Node.js como o da **Hostinger**:

- `npm run build`: Gera o build otimizado do Next.js e o cliente Prisma.
- `npm run start`: Inicia o servidor Next.js em produção.
- **Node Version**: Certifique-se de configurar o Node.js v20.19 ou superior no painel da Hostinger para garantir compatibilidade.

---

## 📄 Licença
Propriedade privada de **Pacto Ágil**. Todos os direitos reservados.

---
*Desenvolvido com ⚡ e precisão estratégica para o futuro das relações de trabalho.*
