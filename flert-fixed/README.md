# Flert IA

> Plataforma SaaS de IA para análise de prints de conversas e geração de sugestões de respostas inteligentes.

## Stack

- **Frontend**: Next.js 15.5 (App Router) + React 19 + TypeScript
- **Banco de dados**: PostgreSQL + Prisma ORM
- **Autenticação**: NextAuth.js (Email/Senha + Google OAuth)
- **IA**: OpenAI GPT-4o Vision
- **Upload**: UploadThing
- **Pagamentos**: Abacate Pay (PIX)
- **Estilização**: Tailwind CSS
- **Deploy**: Vercel

---

## Estrutura do projeto

```
flerte-ia/
├── prisma/
│   └── schema.prisma              # Schema completo do banco
├── src/
│   ├── app/
│   │   ├── (auth)/                # Rotas de autenticação
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── forgot-password/
│   │   ├── (dashboard)/           # Rotas protegidas
│   │   │   ├── dashboard/
│   │   │   ├── analyze/
│   │   │   ├── history/
│   │   │   ├── profile/
│   │   │   └── settings/
│   │   └── api/
│   │       ├── auth/              # NextAuth + register + forgot-password
│   │       ├── analyze/           # Análise de imagens com IA
│   │       ├── payment/           # Create + Status
│   │       ├── profile/           # Update + Change password + Delete
│   │       ├── upload/            # Upload de imagens
│   │       ├── uploadthing/       # UploadThing handler
│   │       └── webhooks/
│   │           └── abacatepay/    # Webhook de pagamento
│   ├── components/
│   │   ├── auth/                  # LoginForm, RegisterForm, ForgotPasswordForm
│   │   ├── analysis/              # AnalyzePage, HistoryPage
│   │   ├── dashboard/             # Sidebar, MobileHeader, DashboardHome, etc.
│   │   └── landing/               # Navbar, Hero, HowItWorks, Benefits, etc.
│   ├── lib/
│   │   ├── prisma.ts              # Prisma client singleton
│   │   ├── auth.ts                # NextAuth config + helpers
│   │   ├── openai.ts              # GPT-4o Vision integration
│   │   ├── abacatepay.ts          # Abacate Pay SDK
│   │   ├── uploadthing.ts         # UploadThing router
│   │   ├── email.ts               # Nodemailer (reset de senha + boas-vindas)
│   │   └── utils.ts               # Utilitários gerais
│   ├── types/
│   │   ├── index.ts               # Tipos globais + constantes
│   │   └── next-auth.d.ts         # Extensão de tipos NextAuth
│   └── middleware.ts              # Proteção de rotas
├── .env.example
├── vercel.json
└── package.json
```

---

## Configuração e setup

### 1. Clonar e instalar

```bash
git clone <repo>
cd flerte-ia
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
```

Preencha todas as variáveis no `.env.local`:

#### PostgreSQL
Crie um banco PostgreSQL (recomendado: [Neon](https://neon.tech) ou [Supabase](https://supabase.com) para produção):

```
DATABASE_URL="postgresql://user:password@host:5432/rizzai"
```

#### NextAuth
Gere um secret seguro:
```bash
openssl rand -base64 32
```
```
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<gerado acima>"
```

#### Google OAuth (opcional)
1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um projeto → APIs & Services → Credentials
3. Create OAuth 2.0 Client ID
4. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`

```
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

#### OpenAI
1. Acesse [platform.openai.com](https://platform.openai.com)
2. API Keys → Create new key

```
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4o"
```

#### Abacate Pay
1. Acesse [abacatepay.com](https://abacatepay.com)
2. Crie uma conta e obtenha a API Key
3. Configure o webhook apontando para: `https://seu-dominio.com/api/webhooks/abacatepay`

```
ABACATEPAY_API_KEY="..."
ABACATEPAY_WEBHOOK_SECRET="..."
ABACATEPAY_BASE_URL="https://api.abacatepay.com/v1"
```

#### Email (SMTP)
Para Gmail, gere uma [App Password](https://myaccount.google.com/apppasswords):

```
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="seu@gmail.com"
SMTP_PASSWORD="sua-app-password"
SMTP_FROM="Flert IA <noreply@flertia.com.br>"
```

### 3. Configurar banco de dados

```bash
# Gerar Prisma Client
npm run db:generate

# Criar tabelas
npm run db:push

# OU para produção com migrations
npm run db:migrate
```

### 4. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

---

## Deploy na Vercel

### 1. Push para GitHub
```bash
git init && git add . && git commit -m "initial commit"
git remote add origin https://github.com/seu-usuario/flerte-ia.git
git push -u origin main
```

### 2. Importar na Vercel
1. Acesse [vercel.com](https://vercel.com)
2. New Project → Import do GitHub
3. Configure as variáveis de ambiente (copie do `.env.local`)
4. Deploy!

### 3. Pós-deploy
- Atualize `NEXTAUTH_URL` para o domínio de produção
- Atualize o `NEXT_PUBLIC_APP_URL`
- Configure o webhook no painel do Abacate Pay para `https://seu-app.vercel.app/api/webhooks/abacatepay`
- Adicione o domínio de produção nas configurações do Google OAuth

---

## Fluxo de pagamento

```
Usuário clica "Pagar R$29,90"
       ↓
POST /api/payment/create
       ↓
Cria pagamento no Abacate Pay → retorna QR Code PIX
       ↓
Modal exibe QR Code
       ↓
Usuário paga pelo app bancário
       ↓
Abacate Pay envia webhook POST /api/webhooks/abacatepay
       ↓
Webhook ativa SubscriptionStatus.status = LIFETIME
       ↓
Frontend polling GET /api/payment/status detecta PAID
       ↓
Acesso liberado automaticamente ✅
```

---

## Fluxo de análise de imagem

```
Usuário faz upload da imagem (drag & drop)
       ↓
POST /api/upload → UploadThing → retorna URL pública
       ↓
Usuário escolhe estilo (Engraçado/Flertando/etc)
       ↓
POST /api/analyze com { imageUrl, style, context }
       ↓
OpenAI GPT-4o Vision analisa imagem
       ↓
Retorna 3 sugestões de resposta
       ↓
Salva no AnalysisHistory
       ↓
Exibe sugestões com botão "Copiar" ✅
```

---

## Banco de dados (Prisma Schema)

### Modelos principais:
- **User** - Conta do usuário
- **Account** - OAuth accounts (Google, etc)
- **Session** - Sessões JWT
- **VerificationToken** - Tokens de verificação
- **PasswordResetToken** - Tokens de recuperação de senha
- **SubscriptionStatus** - Plano (FREE | PREMIUM | ANNUAL | LIFETIME) e expiração
- **ProcessedPayment** - Checkouts da AbacatePay já aplicados (idempotência do webhook)
- **Conversation / Message** - Histórico de análises com as sugestões geradas
- **DailyUsage** - Cota diária de análises (fuso America/Sao_Paulo)
- **RateLimit** - Limites de tentativas (chave HMAC, sem e-mail/IP em claro)

---

## Variáveis de ambiente obrigatórias

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | URL de conexão PostgreSQL |
| `NEXTAUTH_URL` | URL base da aplicação |
| `NEXTAUTH_SECRET` | Secret do JWT (também usado no HMAC das chaves de rate limit) |
| `OPENAI_API_KEY` | Chave da API OpenAI |
| `ABACATEPAY_API_KEY` | Chave API Abacate Pay |
| `ABACATEPAY_PRODUCT_ID_MONTHLY` / `_ANNUAL` / `_LIFETIME` | IDs dos produtos — o webhook deduz o plano pelo produto pago |
| `ABACATEPAY_WEBHOOK_SECRET` | Secret do webhook (sem ele o webhook recusa tudo) |
| `ABACATEPAY_PUBLIC_KEY` | Chave pública HMAC da AbacatePay — obrigatória em produção |
| `ADMIN_EMAIL` | E-mail exato da conta admin — sem ele ninguém acessa o painel |
| `NEXT_PUBLIC_APP_URL` | URL pública (links nos e-mails e checagem de origem/CSRF) |

> Depois de atualizar o código, rode `npm run db:migrate` antes de subir a nova versão.
> Leia os comentários no topo de `prisma/migrations/20261118000000_normalize_emails/migration.sql`:
> há duas consultas para rodar antes (a migration aborta sozinha se encontrar problemas).

### Variáveis opcionais:
| Variável | Descrição |
|----------|-----------|
| `GOOGLE_CLIENT_ID` | Login com Google |
| `GOOGLE_CLIENT_SECRET` | Login com Google |
| `SMTP_*` | Para envio de emails |
| `OPENAI_MODEL` | Modelo (padrão: gpt-4o) |

---

## Termos, Privacidade e consentimentos (LGPD)

> **rascunho — revisar com advogado antes de publicar.** Os textos de `src/content/legal/termos.ts` e
> `src/content/legal/privacidade.ts` descrevem o que o código faz hoje, mas não são parecer jurídico.

- Enquanto `LEGAL_PUBLISHED = false` (`src/content/legal/config.ts`), `/termos` e `/privacidade` dão 404 em
  produção e aparecem em dev com o banner "Rascunho — não publicado"; os links do rodapé e do cadastro
  ficam escondidos e as páginas não entram no sitemap.
- Para publicar: preencher `[NOME/RAZÃO SOCIAL]`, `[CPF/CNPJ]`, `[ENDEREÇO]` e `[E-MAIL DO ENCARREGADO]`
  (constante `CONTROLLER` em `config.ts`), revisar com advogado, atualizar `LEGAL_VERSION` e `LAST_UPDATED`
  e trocar `LEGAL_PUBLISHED` para `true`. O teste `tests/config/legal-docs.test.ts` falha se algum
  placeholder `[...]` sobrar. Publicado, o cadastro passa a exigir o aceite dos Termos na mesma caixa do 18+.
- 18+: obrigatório no cadastro; contas Google e contas antigas confirmam em `/auth/confirmar-idade`
  (o middleware redireciona as páginas do app; análises e criação de pagamento respondem 403 sem a confirmação).
- E-mails promocionais (campanhas do admin): só para `User.marketingOptIn = true` (contas existentes começam
  sem), com link "Não quero mais receber" e `List-Unsubscribe` one-click (`/api/email/unsubscribe`).
  Os links são assinados com `NEXTAUTH_SECRET`: trocar o segredo invalida os links já enviados.
- Migration: `prisma/migrations/20261121000000_legal_consent` (só `ADD COLUMN IF NOT EXISTS`).
- Reembolso: integral em até 7 dias após a compra (CDC art. 49), pedido manual por e-mail ao suporte.

---

## Scripts disponíveis

```bash
npm run dev          # Inicia em desenvolvimento
npm run build        # Build de produção
npm run start        # Inicia em produção
npm run lint         # ESLint
npm run db:generate  # Gera Prisma Client
npm run db:push      # Sincroniza schema com banco
npm run db:migrate   # Executa migrations (produção)
npm run db:studio    # Abre Prisma Studio
```

---

## Licença

Proprietário. Todos os direitos reservados.
