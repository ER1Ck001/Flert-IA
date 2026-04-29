# Flerte IA 🔥

> Plataforma SaaS de IA para análise de prints de conversas e geração de sugestões de respostas inteligentes.

## Stack

- **Frontend**: Next.js 14+ (App Router) + TypeScript
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

#### UploadThing
1. Acesse [uploadthing.com](https://uploadthing.com)
2. Crie uma app → copie as credenciais

```
UPLOADTHING_SECRET="sk_live_..."
UPLOADTHING_APP_ID="..."
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
SMTP_FROM="Flerte IA <noreply@flerteia.com>"
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
- **Payment** - Registro de pagamentos Abacate Pay
- **SubscriptionStatus** - Status do acesso (FREE | LIFETIME)
- **AnalysisHistory** - Histórico de análises com sugestões

---

## Variáveis de ambiente obrigatórias

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | URL de conexão PostgreSQL |
| `NEXTAUTH_URL` | URL base da aplicação |
| `NEXTAUTH_SECRET` | Secret para JWT |
| `OPENAI_API_KEY` | Chave da API OpenAI |
| `UPLOADTHING_SECRET` | Secret UploadThing |
| `UPLOADTHING_APP_ID` | App ID UploadThing |
| `ABACATEPAY_API_KEY` | Chave API Abacate Pay |
| `ABACATEPAY_WEBHOOK_SECRET` | Secret para verificar webhooks |
| `NEXT_PUBLIC_APP_URL` | URL pública da aplicação |

### Variáveis opcionais:
| Variável | Descrição |
|----------|-----------|
| `GOOGLE_CLIENT_ID` | Login com Google |
| `GOOGLE_CLIENT_SECRET` | Login com Google |
| `SMTP_*` | Para envio de emails |
| `OPENAI_MODEL` | Modelo (padrão: gpt-4o) |

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
