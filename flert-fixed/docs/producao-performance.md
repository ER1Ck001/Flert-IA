# Tarefa 6 — Produção e performance

Auditoria baseada em medição (build de produção, `npm audit`, `npm view`, grep no código e um
`next start` local de fumaça). Cada achado tem severidade, local, evidência e correção proposta.
Status: **[corrigido]** nesta tarefa, **[proposto]** fica para o dono decidir.

Ambiente medido: Next 14.2.35, React 18.3.1, Node local v24.15.0, build com
`$env:OPENAI_API_KEY=$null; npx next build`.

## Resumo

| Severidade | Achados | Corrigidos | Propostos |
|---|---|---|---|
| Alta | 4 | 3 (A1 só a mitigação; o upgrade fica na avaliação) | 1 |
| Média | 10 | 4 | 6 |
| Baixa | 13 | 3 | 10 |
| **Total** | **27** | **10** | **17** |

Principais números:

- JS real por rota (gzip, união layout raiz + layout do grupo + página): `/` **170,8 kB**,
  `/analyze` **202,4 kB**, `/settings` **205,1 kB**; framer-motion responde por **35,5 kB** em todas.
- `npm audit`: 36 vulnerabilidades (3 críticas, 26 altas, 7 moderadas); **só 3 em produção**
  (`next` crítica, `zod` e `postcss` altas). O `next` não tem correção na linha 14.
- Uploads de print aceitos até 10 MB no front (≈14 M caracteres em base64), mas a Vercel
  recusa corpos acima de **4,5 MB** com 413 antes da rota — prints de ~3,3 MB+ falhavam.
- 5 chaves estrangeiras consultadas sem índice (`Conversation.userId`, `Message.conversationId`,
  `Account.userId`, `Session.userId`, `PasswordResetToken.userId`).

## Bundle: antes × depois

`First Load JS` reportado pelo `next build` (o número do Next não soma o layout do grupo):

| Rota | Antes | Depois |
|---|---|---|
| `/` | 149 kB | 149 kB |
| `/analyze` | 157 kB (página 14,9 kB) | 157 kB (página 15,3 kB, +0,4 kB do redutor de imagem) |
| `/dashboard` | 156 kB | 156 kB |
| `/settings` | 181 kB | 181 kB |
| `/admin` | 184 kB | 184 kB |
| `/auth/register` | 177 kB | 177 kB |
| `/auth/login` | 162 kB | 162 kB |
| `/history` | 129 kB | 129 kB |
| `/pricing` | 124 kB | 124 kB |
| Compartilhado | 87,3 kB | 87,3 kB |
| Middleware | 50,5 kB | 50,7 kB |
| Novas rotas | — | `/robots.txt`, `/sitemap.xml`, `/api/health` (0 B de JS) |

As correções desta tarefa são de confiabilidade e servidor; o bundle não mudou de forma
relevante. A redução real de JS (LazyMotion, ver M1) muda o comportamento das animações e ficou
como proposta.

JS real por rota (script sobre `.next/app-build-manifest.json`, gzip):

| Rota | JS total | Chunk com framer-motion + lucide |
|---|---|---|
| `/` | 170,8 kB | 35,5 kB |
| `/auth/login` | 168,5 kB | 35,5 kB |
| `/dashboard` | 188,6 kB | 35,5 kB |
| `/admin` | 190,1 kB | 35,5 kB |
| `/analyze` | 202,4 kB | 35,5 kB |
| `/settings` | 205,1 kB | 35,5 kB |

CSS: um arquivo, 51,6 kB (11,2 kB gzip). Fonte Inter via `next/font` (só o subset latin,
48 kB, recebe preload).

---

## Alta

### A1. Next 14.2.35 com CVEs críticas sem patch na linha 14 — [corrigido: upgrade para 15.5.29 na Tarefa 6b] + mitigação mantida
- **Local:** `package.json:39` (`"next": "^14.2.35"`), `next.config.js` (`images`).
- **Evidência:** `npm audit --omit=dev` → `next` **crítica** (direta). 25 avisos de `>=13 <15.5.x`,
  entre eles RCE no Image Optimization API com SVG/AVIF (GHSA-2464-fhr4-w9xw, ≤15.5.27;
  GHSA-2xp9-vwfh-vxw4), DoS em Server Components (GHSA-q4gf-8mx6-v5v3, GHSA-8h8q-6873-q5fj) e
  SSRF/cache poisoning. `npm view next@14 version` → **14.2.35** já é a última da linha 14:
  não há correção possível sem trocar de major.
- **Mitigação aplicada:** `images.unoptimized: true`. Desliga o `/_next/image` (a superfície
  das CVEs de RCE/DoS do otimizador). Quem usava: só os avatares do `/admin`
  (`src/app/admin/page.tsx:13`); o preview do print já era `data:` (sem otimização). Os avatares
  passam a vir direto do Google/GitHub/Cloudinary, já liberados no `img-src` da CSP. O app não usa
  Server Actions (`"use server"`: 0), rewrites, WebSocket nem hospedagem Windows, o que reduz a
  exposição às demais.
- **Correção definitiva:** upgrade (ver "Avaliação de upgrade do Next").

### A2. Upload de print maior que o limite de corpo da Vercel — [corrigido]
- **Local:** `src/app/(dashboard)/analyze/page.tsx:92` (aceita até 10 MB),
  `src/lib/ai/run-analysis.ts:13` (`MAX_IMAGE_DATA_URL_CHARS = 14_000_000`).
- **Evidência:** funções da Vercel recusam corpos > **4,5 MB** com `413 FUNCTION_PAYLOAD_TOO_LARGE`
  antes de rodar a rota. Um arquivo de 10 MB vira ≈13,3 M caracteres em base64, então qualquer print
  acima de ~3,3 MB falhava. A resposta 413 não é JSON: o `res.json()` do front lançava
  `SyntaxError` e o usuário via "Unexpected token…" (ver M5).
- **Correção:** `src/lib/image-compress.ts`. Prints com data URL > 3,4 M caracteres são
  redimensionados no navegador para no máximo 2048 px (a OpenAI reduz para esse tamanho de
  qualquer forma) e re-codificados em JPEG (qualidade 0,85 → 0,45) até caberem. Prints pequenos
  seguem intactos, e qualquer falha devolve o original. Limites e validação do servidor não mudaram.
  Testes: `tests/lib/image-compress.test.ts`, `tests/ui/image-compress.test.ts`.

### A3. FKs consultadas sem índice (varredura completa) — [corrigido]
- **Local:** `prisma/schema.prisma` (models `Conversation`, `Message`, `Account`, `Session`,
  `PasswordResetToken`). O Postgres não cria índice para FK sozinho. Os índices existentes (nas
  migrations) são só os `@unique`, `processed_payments.userId` e `rate_limits.resetAt`.
- **Consultas afetadas:**
  - `src/app/api/history/route.ts:16`: `conversation.findMany({ where: { userId }, orderBy: createdAt desc, include messages orderBy createdAt })`.
  - `src/app/api/stats/route.ts:24-25`: dois `count` por `userId` (+ `createdAt >= semana`). Roda em todo carregamento de `/dashboard` e `/analyze`.
  - `src/app/api/admin/users/route.ts:20`: `_count.conversations` por usuário.
  - `src/app/api/auth/forgot-password/route.ts:46,54`: `passwordResetToken` por `userId`.
  - Exclusão de conta (`ON DELETE CASCADE` em Account/Session/Conversation/Message/PasswordResetToken) e o adapter do NextAuth.
- **Correção:** nova migration `prisma/migrations/20261120000000_perf_indexes/migration.sql`,
  só aditiva (`CREATE INDEX IF NOT EXISTS`) e com `@@index` correspondente no schema
  (`prisma validate` ok). **O dono precisa aplicar:** `npx prisma migrate deploy`, com a URL
  **direta** (não pooled) do Neon. As tabelas são pequenas e o `CREATE INDEX` é rápido; ele
  bloqueia escrita nessas tabelas durante a criação. Prefira um horário de pouco uso.
  Teste: `tests/config/production-config.test.ts`.

### A4. `npm audit` de produção: zod e postcss — [proposto]
- **Evidência:** `zod` alta (GHSA-mrhx-c7xc-m3w5, `<4.6.6`, correção só no major 4), `postcss` alta
  (transitiva do `next`, só no build). Dev: 33 (vitest/vite/tinypool crítica, eslint, tailwind 3).
- **Risco real:** zod: os schemas do app validam objetos pequenos e as rotas limitam o tamanho
  dos campos. O aviso é sobre coleções enormes. postcss roda só no build, com CSS próprio.
- **Proposta:** zod 4 junto com o upgrade do Next (o `openai@4` declara peer `zod ^3.23.8`, então
  precisa do `openai` compatível); vitest 3/4 numa tarefa de tooling. **Nunca `npm audit fix`**
  (ele subiria majors).

## Média

### M1. framer-motion completo em todas as rotas (35,5 kB gzip) — [proposto] → **Feito (Tarefa 9)**
- **Local:** 13 arquivos importam `motion`, entre eles `src/app/providers.tsx:5` (MotionConfig)
  e `src/components/landing/InteractiveDemo.tsx:4`. A landing carrega o chunk inteiro por causa da demo.
- **Evidência:** o chunk `3258-*.js` (35,5 kB gzip) está no JS de `/`, `/analyze`, `/dashboard`,
  `/settings`, `/auth/*` e `/admin`.
- **Proposta:** `LazyMotion` + componentes `m`. `layoutId` em `src/components/ui/tone-chip.tsx:118`
  exige `domMax`. Com features carregadas de forma assíncrona, o chunk inicial cai para ~5 kB.
  **Não implementado:** sem as features carregadas, `AnimatePresence` não conclui animações de saída
  (sheet, dialog, gates). Isso muda comportamento e quebraria testes de UI que renderizam fora do
  `Providers`. Precisa de uma tarefa própria, com QA visual.

### M2. Cabinet Grotesk via stylesheet externo bloqueante — [proposto] → **Pendente (Tarefa 9: licença)**
- **Local:** `src/app/layout.tsx:52-56` (`<link rel="stylesheet" href="https://api.fontshare.com/v2/css?...">`).
- **Evidência:** o CSS de um terceiro bloqueia o render: DNS + TLS de `api.fontshare.com` e depois o
  CSS. Os WOFF2 vêm de `cdn.fontshare.com` e não passam pelo `next/font` (sem preload, sem fallback
  ajustado, então pode haver CLS no título).
- **Proposta:** self-host com `next/font/local` (baixar os WOFF2 500/700/800 da Fontshare; a licença
  ITF Free Font License permite). Depois, remover `fontshare` da CSP (`style-src`/`font-src`).
  Não feito aqui porque exige adicionar arquivos de fonte de fora (sem dependência npm, mas com
  checagem de licença pelo dono).

### M3. SMTP sem timeout dentro de funções serverless — [corrigido]
- **Local:** 6 transportes idênticos criados em `src/lib/auth.ts`, `api/admin/email`,
  `api/auth/forgot-password`, `api/auth/register`, `api/profile` e `api/webhooks/abacatepay`.
- **Evidência:** padrões do nodemailer: `connectionTimeout` 120 s, `greetingTimeout` 30 s,
  `socketTimeout` 600 s, todos acima do `maxDuration` (≤ 60 s). Um SMTP lento segurava a requisição
  até a plataforma matar a função (no webhook: 504 para a AbacatePay, com e-mail perdido).
- **Correção:** `src/lib/email/transport.ts` (`createMailTransport()`), mesmas opções de antes
  (conferidas no build anterior) + timeouts de 10 s, 10 s e 20 s. Teste: `tests/lib/email-transport.test.ts`.

### M4. Chamada ao gateway de pagamento sem timeout; webhook sem `maxDuration` — [corrigido]
- **Local:** `src/app/api/payment/route.ts:102` (`fetch` para a AbacatePay),
  `src/app/api/webhooks/abacatepay/route.ts` (transação + e-mail).
- **Correção:** `AbortSignal.timeout(15_000)` no `fetch`. O timeout cai no `catch` já existente e
  responde `500 "Erro ao criar pagamento"`, mesmo contrato. Também `maxDuration` explícito: 30 s no pagamento e 60 s no webhook (o pior caso do SMTP é ~40 s, e 60 s é o mesmo valor já usado em `/api/analyze`).
  Testes: `tests/api/payment.test.ts` (+2).

### M5. Front quebra com resposta não-JSON (413/504 da plataforma) — [corrigido]
- **Local:** `src/app/(dashboard)/analyze/page.tsx` (os dois `await res.json()`).
- **Evidência:** 413 (A2) ou 504 (timeout da função) vêm em texto/HTML. O `SyntaxError` virava a
  mensagem exibida ao usuário.
- **Correção:** `res.json().catch(() => ({}))`, que cai na mensagem padrão ("Erro ao analisar/gerar.
  Tente novamente."). Teste: `tests/ui/analyze-page.test.tsx` (+1).

### M6. Pior caso da OpenAI passa do `maxDuration` — [proposto] → **Feito (Tarefa 9)**
- **Local:** `src/lib/ai/generate.ts:18` (`timeout: 30_000, maxRetries: 1`) e `:55` (`MAX_ATTEMPTS = 2`);
  `src/app/api/analyze/route.ts:8` (`maxDuration = 60`).
- **Evidência:** timeout + retry = até 60 s numa tentativa. Se a OpenAI travar, a função morre em
  60 s **antes** do `release()` da cota (`run-analysis.ts:81`). O usuário perde 1 análise da cota e
  recebe 504 (agora com mensagem padrão, M5).
- **Proposta:** prazo total (ex.: `AbortSignal.timeout(50_000)` compartilhado entre as tentativas),
  ou `timeout: 25_000`. Muda a política de retry, por isso fica com o dono.

### M7. `/api/history` sem paginação — [proposto] → **Feito (Tarefa 9)**
- **Local:** `src/app/api/history/route.ts:16`. Devolve **todas** as conversas com todas as mensagens.
- **Evidência:** cresce de forma linear: 50 análises/dia no plano pago ≈ 1.500 conversas e 4.500
  mensagens por mês numa resposta só.
- **Proposta:** `take` + cursor (`?cursor=`) e carregar mais no front. Muda o contrato da API.

### M8. Envio de e-mail em massa sequencial no admin — [proposto] → **Feito (Tarefa 9)**
- **Local:** `src/app/api/admin/email/route.ts:163` (loop `await sendMail`), `maxDuration = 60`.
- **Evidência:** a ~1–2 s por envio, listas acima de ~30–60 usuários estouram 60 s no meio do
  loop. A resposta se perde e parte dos e-mails já foi enviada.
- **Proposta:** fila (Vercel Queues/cron), lotes paralelos limitados, ou um provedor com envio em lote.

### M9. Neon: sem `directUrl` para migrations — [proposto] → **Documentado (Tarefa 9)**; schema sem mudança
- **Local:** `prisma/schema.prisma:8-11` (só `url = env("DATABASE_URL")`).
- **Evidência:** daqui não dá para saber se `DATABASE_URL` é a URL pooled (`-pooler`). Os
  `.env` não foram lidos. Com pooled (PgBouncer em modo transaction), `migrate deploy` não deve
  rodar por ela.
- **Proposta:** runtime com URL pooled (`...-pooler...?sslmode=require&pgbouncer=true&connect_timeout=15`)
  e `directUrl = env("DIRECT_URL")` (URL direta) só para migrations. Exige criar a variável `DIRECT_URL`,
  por isso não foi aplicado. Conferir também se o banco está em `aws-sa-east-1`, perto de `gru1`
  (`vercel.json`).

### M10. Validação de ambiente na subida — [corrigido]
- **Antes:** nenhuma. Falta de variável só aparecia na rota afetada, em geral como 500 genérico.
- **Correção:** `src/lib/env.ts` + `src/instrumentation.ts` (`experimental.instrumentationHook: true`).
  - **Críticas** (falha na subida, mensagem só com nomes): `DATABASE_URL` (precisa ser
    `postgres(ql)://`), `NEXTAUTH_SECRET`.
  - **Recomendadas** (aviso com nomes, sem derrubar): `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`,
    `OPENAI_API_KEY`, `ABACATEPAY_API_KEY`, `ABACATEPAY_BASE_URL`, `ABACATEPAY_WEBHOOK_SECRET`,
    `ABACATEPAY_PRODUCT_ID_MONTHLY|ANNUAL|LIFETIME`, `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`,
    `SMTP_FROM`, `ADMIN_EMAIL`. Também avisa quando `NEXTAUTH_SECRET` tem < 32 caracteres e
    quando as URLs são inválidas.
  - **Decisão de design:** a validação roda **na subida do servidor** (`register()` do instrumentation,
    só no runtime Node) e **nunca no `next build`**. O `register()` não roda no build, e há ainda a
    guarda `NEXT_PHASE === "phase-production-build"`. Assim o CI e o build sem segredos continuam
    passando. Só as 2 críticas derrubam o app: sem elas ele já não funcionava (o `rateKey` lança sem
    `NEXTAUTH_SECRET` em produção, e o Prisma não conecta sem `DATABASE_URL`).
  - **Verificado** com `next start` local: sem as críticas, o servidor loga
    `[env] Variáveis de ambiente obrigatórias ausentes ou inválidas: DATABASE_URL, NEXTAUTH_SECRET…`
    e responde 500. Com valores fictícios, `/api/health` responde 200 e o log lista só os nomes das
    recomendadas ausentes.
  - Testes: `tests/lib/env.test.ts`.

## Baixa

| # | Achado | Local / evidência | Status |
|---|---|---|---|
| B1 | Sem `robots.txt`/`sitemap.xml` | não existiam | **[corrigido]** `src/app/robots.ts` (bloqueia `/api/`, `/admin`, área logada, `/auth/`) e `src/app/sitemap.ts` (só `/`). URL canônica em `SITE_URL` (`src/lib/seo.ts`), também usada no `metadataBase` |
| B2 | Sem health check | — | **[corrigido]** `GET /api/health` → `{"status":"ok"}`, `no-store`, sem banco, versão ou env. Teste `tests/api/health.test.ts` |
| B3 | Log do objeto de erro inteiro | `src/app/api/payment/route.ts` GET (`console.error(..., error)`) | **[corrigido]** `errorMessage(error)`: erros do Prisma viram só `Nome:código` |
| B4 | Logs com `error.message` cru (erro do Prisma inclui a invocação com valores) | `api/history`, `api/stats`, `api/analyze*`, `api/webhooks/abacatepay` (catch), `lib/rate-limit.ts:46`, `lib/ai/run-analysis.ts:36,100,119` | **Feito (Tarefa 9)**: todos os logs do servidor usam `errorMessage()`; guarda em `tests/config/safe-logs.test.ts` |
| B5 | `findUserByEmail` faz `ILIKE` (varredura em `User`) a cada e-mail não encontrado | `src/lib/users.ts:13` | [proposto] remover o fallback depois de aplicar `normalize_emails` (o próprio comentário prevê isso) |
| B6 | `/api/admin/users` carrega todos os usuários e conta planos em memória | `src/app/api/admin/users/route.ts:17-34` | [proposto] `groupBy` por status + paginação |
| B7 | Páginas logadas são shells estáticos com fetch no cliente (HTML → JS → `/api/stats`) | build: `○ /dashboard`, `○ /analyze` | [proposto] prefetch no servidor numa tarefa de arquitetura |
| B8 | Sem `global-error.tsx` (erro no layout raiz cai na página padrão do Next) | `src/app/` | [proposto] |
| B9 | `package.json` sem `engines` (Node local 24.15; Vercel usa o que estiver no painel) | `package.json` | [proposto] `"engines": { "node": "20.x \|\| 22.x" }`, alinhado ao painel (mudar isso troca o Node da Vercel, por isso não foi aplicado) → **Feito (Tarefa 9)**: `"engines": { "node": ">=20" }` |
| B10 | `legacy-peer-deps=true` esconde conflito de peer: `next-auth@4.24.15` pede `nodemailer ^7.0.7`, instalado **10.x** | `.npmrc`, `netlify.toml` | [proposto] revisar no upgrade. `netlify.toml` está obsoleto (o deploy é na Vercel) |
| B11 | `fix.sql` na raiz com um ID de usuário real e `UPDATE` para LIFETIME (repositório público) | `fix.sql` | [proposto] apagar |
| B12 | 5,5 MB de assets não referenciados (`video.mp4` 3,4 MB, `scene-4.jpg` 1,7 MB…) | `public/couple/` (`grep couple src` = 0) | **Feito (Tarefa 9)**: apagado (grep em src, public, docs, tests, next.config, CSS: só o content-guard, que proíbe o uso) |
| B13 | `.env.example` lista variáveis que o código não lê | `UPLOADTHING_SECRET`, `UPLOADTHING_APP_ID`, `UPLOADTHING_TOKEN`, `PRODUCT_PRICE_CENTS`, `NEXT_PUBLIC_APP_NAME` (grep `process.env` = 0) | **Feito (Tarefa 9)**: removidas (e a seção UploadThing do README). `DIRECT_URL` documentado como opcional, comentado |

### Conferido e sem problema
- **Headers de segurança/CSP** intactos (`tests/config/security-headers.test.ts`; resposta de
  `/robots.txt` no `next start` com `Content-Security-Policy`).
- **Middleware:** 50,7 kB, `matcher` restrito às páginas logadas, `/auth` e `/admin`. Não roda na
  landing, nas APIs nem nos estáticos.
- **Prisma:** singleton em `globalThis` fora de produção. Log só de `error` em produção.
  `@prisma/client` em `serverComponentsExternalPackages`.
- **Rotas:** todas as APIs são `ƒ` (dinâmicas). `/api/analyze*` e `/api/admin/email` já tinham
  `maxDuration = 60`. Nenhuma rota em Edge. Nenhum `fetch` em GET com cache.
- **Scripts:** `build` = `prisma generate && next build`, `postinstall` = `prisma generate`,
  `db:migrate` = `prisma migrate deploy` (manual, nunca automático no build). Atenção:
  `db:push` existe e **não deve** ser usado contra produção.
- **next/image:** só 2 usos (preview `data:` e avatares do admin), `remotePatterns` restritos a
  3 hosts. Não há imagem no LCP da landing (a hero é texto).
- **Fonte Inter:** `next/font/google`, `display: swap`, preload só do subset latin.
- **Consentimento:** Pixel da Meta continua condicionado ao consentimento.

---

## Avaliação de upgrade do Next

**Situação:** `npm view next version` → **16.4.6** (latest). Dist-tags: `next-14` = **14.2.35**
(a instalada, fim da linha), `backport` = **15.5.29**. A linha 14 não recebe as correções das CVEs
de A1 (faixas `<15.5.10` … `<=15.5.27`). **15.5.29 está fora de todas as faixas do audit.**

### Impacto no código (contagens por grep)

| Mudança do Next 15 | Ocorrências aqui | Esforço |
|---|---|---|
| `cookies()`/`headers()` assíncronos (`next/headers`) | **0** | — |
| `params` assíncrono em route handlers/páginas | **1 arquivo**, 2 handlers: `src/app/api/admin/users/[id]/route.ts:11,16,43` (`{ params }: { params: { id } }` → `Promise<{ id }>` + `await`), mais os testes que o chamam | baixo |
| `searchParams` como prop de página | **0** (as 4 páginas usam o hook `useSearchParams`, que não muda) | — |
| `getServerSession` (next-auth v4 lê cookies/headers internamente) | 12 arquivos | sem mudança de código; validar em staging |
| `fetch`/GET handlers sem cache por padrão | 1 `fetch` (POST ao gateway); todas as APIs já são dinâmicas | — |
| Server Actions | 0 | — |
| `next.config.js` | `experimental.serverComponentsExternalPackages` → `serverExternalPackages`; `experimental.instrumentationHook` deixa de ser necessário (instrumentation é estável no 15) | baixo |
| `eslint-config-next` | 14 → 15 (no **16**, `next lint` foi removido: migrar para ESLint CLI) | baixo/médio |

### Compatibilidade de dependências (`peerDependencies`)

| Pacote (instalado) | Peer declarado | React 19 / Next 15+ |
|---|---|---|
| `next-auth` 4.24.15 | `next ^12.2.5 \|\| ^13 \|\| ^14 \|\| ^15 \|\| ^16`, `react ^17.0.2 \|\| ^18 \|\| ^19`, `nodemailer ^7.0.7` | OK (o conflito com o nodemailer 10 já existe hoje) |
| `@next-auth/prisma-adapter` 1.0.7 | `next-auth ^4` | OK |
| `framer-motion` 11.18.2 | `react ^18.0.0 \|\| ^19.0.0` | OK |
| `@radix-ui/*` (dialog 1.1.15, select 2.2.6, tooltip 1.2.8…) | `react ^16.8 … \|\| ^19.0` | OK |
| `react-hot-toast` 2.6.0 | `react >=16` | OK |
| `lucide-react` 0.414.0 | `react … \|\| ^19.0.0` | OK |
| `@vercel/analytics` 2.0.1 / `speed-insights` 2.0.0 | `next >= 13`, `react ^18 \|\| ^19` | OK |
| **`next-themes` 0.3.0** | `react ^16.8 \|\| ^17 \|\| ^18` | **Bloqueia React 19**: subir para 0.4.6 (peer inclui ^19) |
| `@types/react` 18 | — | subir para 19 junto |
| `openai` 4.104.0 | `zod ^3.23.8` | OK com React 19. Prende o zod em 3 (A4) |

### Recomendação

1. **Agora, numa tarefa própria: Next 15.5.x (≥ 15.5.29) + React 19.** Fecha as CVEs críticas de
   produção. Passos: `next@15.5.x`, `react`/`react-dom@19`, `@types/react*@19`,
   `eslint-config-next@15`, `next-themes@0.4.6`; ajustar `params` em 1 rota e nos testes; renomear
   as chaves do `next.config.js`; reativar o Image Optimizer só se fizer falta (A1).
   **Esforço:** ~1 dia com testes e QA. **Risco: médio**: sessão/JWT do next-auth v4, hidratação
   com React 19, CSP com `'unsafe-inline'` (scripts inline do Next 15) e animações do framer-motion
   precisam de teste manual em staging (login senha/Google, pagamento sandbox, webhook, análise).
2. **Depois:** Next 16 (Node ≥ 20.9, Turbopack por padrão, `middleware` → `proxy`, sem `next lint`,
   e no 16 o acesso síncrono a `params`/`cookies` deixa de existir). Avaliar junto a troca do
   next-auth v4 pelo Auth.js v5.
3. **Até o upgrade:** a mitigação de A1 (`images.unoptimized`) fica ativa. Ela não cobre as CVEs de
   DoS em Server Components.

### Upgrade feito (Tarefa 6b): Next 15.5.29 + React 19

**Versões** (`npm view next dist-tags` → `backport` = 15.5.29, última da linha 15.5):

| Pacote | Antes | Depois |
|---|---|---|
| `next` | 14.2.35 | **15.5.29** |
| `react` / `react-dom` | 18.3.1 | **19.2.9** (última 19.2; o peer do Next 15.5.29 é `^18.2.0 \|\| ^19.0.0`) |
| `@types/react` | 18.3.28 | **19.2.18** |
| `@types/react-dom` | 18.3.7 | **19.2.3** |
| `eslint-config-next` | 14.2.35 | **15.5.29** |
| `next-themes` | 0.3.0 | **0.4.6** (peer inclui `^19`) |
| `@testing-library/react` | 16.0.1 | **16.3.3** (a 16.0.1 só aceitava React 18; segue pinada exata) |

Os demais pacotes (`next-auth`, adapter, `framer-motion`, `@radix-ui/*`, `react-hot-toast`,
`lucide-react`, `@vercel/analytics`, `@vercel/speed-insights`) já aceitavam React 19 e não mudaram.
O `.npmrc` do projeto tem `legacy-peer-deps=true` (B10); nenhum `--force`/`--legacy-peer-deps` extra
foi passado. `npm ls` mostra um único conflito de peer, o que já existia: `next-auth` pede
`nodemailer ^7.0.7` e o instalado é 10.x.

**Código:**
- `src/app/api/admin/users/[id]/route.ts`: `params` passa a ser `Promise<{ id }>` e é lido com
  `await` no mesmo ponto de antes (depois da checagem de origem e de admin). Comportamento igual.
  Testes em `tests/api/admin-routes.test.ts` passam `params: Promise.resolve({ id })`.
- `next.config.js`: `experimental.serverComponentsExternalPackages` → `serverExternalPackages`;
  `experimental.instrumentationHook` removido (instrumentation é estável no 15; o `[env]` do
  `src/instrumentation.ts` aparece no `next start`). CSP e headers sem mudança.
- `tests/config/production-config.test.ts`: o teste da flag passou a exigir a ausência dela e a
  presença de `src/instrumentation.ts`; novo teste para `serverExternalPackages`.
- Conferido sem mudança: 0 `cookies()`/`headers()`, 0 `searchParams` como prop, 0 Server Actions,
  0 `useRef()` sem argumento, 0 uso do namespace global `JSX`. Os `forwardRef` seguem funcionando.
  Cache de GET no 15 (sem cache por padrão): todas as APIs já eram `ƒ` e o único `fetch` é um POST.

**Image Optimizer:** continua desligado (`images.unoptimized: true`). A 15.5.29 já tem o patch, mas
só os avatares do `/admin` usavam o otimizador. Religar só traria mais superfície de ataque e custo
de otimização na Vercel. Se um dia fizer falta, basta remover a chave.

**Checagens:** `npx vitest run` 611/611 (54 arquivos) · `npx tsc --noEmit` ok · `npm run lint` ok
(o `next lint` avisa que sai no Next 16) · `next build` ok, todas as APIs `ƒ`.
**Smoke (`next start`, env fictício):** `/` 200, `/auth/login` 200, `/api/health` 200 `{"status":"ok"}`,
`/robots.txt` 200, `/sitemap.xml` 200, URL inexistente 404, `/dashboard` 307 (middleware),
`/api/stats` 401. CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy (`no-referrer` em
`/auth/reset-password`), Permissions-Policy e COOP presentes; sem `X-Powered-By`.

**`npm audit`:**

| | Antes | Depois |
|---|---|---|
| `--omit=dev` | 3 (1 crítica `next`, 2 altas `postcss`/`zod`) | 3 (0 crítica; `next` moderada **só** pelo `postcss@8.4.31` que ele embute para o build, `postcss` alta, `zod` alta) |
| total | 36 (3 críticas, 26 altas, 7 moderadas) | 36 (2 críticas `vitest`/`tinypool` de dev, 25 altas, 9 moderadas) |

Nenhum aviso direto do `next` sobra. O `fixAvailable` do audit aponta para o Next 16 (major).
`npm audit fix` não foi rodado.

**QA manual numa Preview da Vercel antes de promover:** login com senha e com Google (cookie/JWT do
next-auth v4 no Next 15), logout e revogar sessões; pagamento sandbox da AbacatePay + webhook;
análise de print e de texto (cota); `/admin` (listar, mudar plano, excluir usuário: é a rota com
`params` assíncrono); tema claro/escuro (next-themes 0.4.6) sem flash; animações (framer-motion com
React 19); console sem violação de CSP nem erro de hidratação.

---

## Tarefa 9 — melhorias de performance

Ambiente: Next 15.5.29, React 19.2, framer-motion 11.18.2, Node local v24.15.0,
`$env:OPENAI_API_KEY=$null; npx next build`. Nenhuma dependência nova.

| Proposta | Status | Resumo |
|---|---|---|
| M1 LazyMotion | **Feito** | `m` + `LazyMotion` (`domAnimation` síncrono, `strict`); `domMax` só no tone-chip, sob demanda |
| M2 Cabinet Grotesk self-host | **Pendente** | licença permite self-host, mas proíbe pôr os arquivos em repositório público (ver abaixo) |
| M6 Prazo total da OpenAI | **Feito** | 45 s para todas as tentativas e retries; estouro = `openai_error` → cota liberada |
| M7 Paginação do histórico | **Feito** | cursor + `limit` (padrão 20, máx. 50), compatível com o cliente antigo; "Carregar mais" |
| M8 E-mail em massa | **Feito** | 5 envios em paralelo, corte de 30 s, prazo de 45 s; devolve `remaining` + `nextCursor` |
| M9 `DIRECT_URL` | **Documentado** | só comentado no `.env.example`; `schema.prisma` sem mudança |
| B4 logs com `error.message` | **Feito** | 13 logs do servidor → `errorMessage()` |
| B9 `engines` | **Feito** | `"node": ">=20"` |
| B12 `public/couple/` | **Feito** | 5,5 MB apagados |
| B13 `.env.example` | **Feito** | 5 variáveis não lidas removidas |

### Bundle: antes × depois (M1)

`First Load JS` do `next build`:

| Rota | Antes | Depois | Diferença |
|---|---|---|---|
| `/` | 159 kB | **131 kB** | −28 kB |
| `/analyze` | 173 kB | **145 kB** | −28 kB |
| `/dashboard` | 165 kB | **137 kB** | −28 kB |
| `/history` | 139 kB | 139 kB | 0 (página +1,2 kB do "Carregar mais") |
| `/pricing` | 134 kB | 134 kB | 0 |
| `/settings` | 195 kB | 167 kB | −28 kB |
| `/admin` | 194 kB | 167 kB | −27 kB (página +0,3 kB do progresso do envio) |
| `/auth/login` | 172 kB | 144 kB | −28 kB |
| `/auth/register` | 186 kB | 158 kB | −28 kB |
| Compartilhado | 103 kB | 103 kB | — |

JS real por rota (script sobre `.next/app-build-manifest.json`: união de layout raiz + layout do
grupo + página, gzip). Mesmo método antes e depois:

| Rota | Antes | Depois |
|---|---|---|
| `/` | 178,7 kB | 170,6 kB |
| `/analyze` | 210,5 kB | 202,9 kB |
| `/dashboard` | 196,6 kB | 187,7 kB |
| `/history` | 198,3 kB | 191,3 kB |
| `/pricing` | 195,8 kB | 188,6 kB |
| `/settings` | 213,0 kB | 205,0 kB |

O chunk do framer-motion no carregamento inicial caiu de 35,5 kB para ~20 kB gzip, mais ~5 kB de
definições de features. As features de layout (`domMax`) ficam num chunk assíncrono que só o
tone-chip pede. No smoke, ele carregou na landing depois da hidratação, e o indicador do tom ficou
com o `transform` controlado pelo framer.

**Como ficou:**
- `src/components/motion/MotionProvider.tsx`: `<MotionConfig reducedMotion="user">` (igual a antes)
  + `<LazyMotion features={domAnimation} strict>`. `domAnimation` cobre animate, variants,
  exit/`AnimatePresence` e hover/tap/focus, ou seja, tudo o que o app usa fora do `layoutId`.
  `strict` faz um `motion.*` perdido lançar erro em dev e nos testes.
- `src/components/ui/tone-chip.tsx`: o único `layoutId` do app. Fica num `<LazyMotion>` próprio
  que carrega `domMax` via `import("@/components/motion/dom-max")`. Até o chunk chegar (uma única
  vez), o indicador aparece sem animar a troca. Ninguém usa drag nem `layout`.
- 11 componentes trocaram `motion.*` por `m.*`. Variants, transições, `useReducedMotion`,
  `useMotionSafe` e `reduced()` não mudaram.
- Testes: `tests/config/lazy-motion.test.ts` (nenhum `motion` importado, `domMax` só dinâmico) e
  `tests/ui/motion-provider.test.tsx` (`m` renderiza, `motion` lança em strict, a saída do
  `AnimatePresence` conclui).
- Fora do `Providers` (testes de UI isolados), os componentes `m` renderizam sem animar e o
  `AnimatePresence` desmonta na hora. Todos os testes de UI existentes passaram sem mudança.

### M2: licença da Cabinet Grotesk (não baixada)

Fonte: **ITF Free Font License (FFL), "Version 2.0 - 17 Aug 2026"**, publicada em
https://www.fontshare.com/licenses/itf-ffl. A página é uma SPA: o texto foi lido do bundle
`https://www.fontshare.com/js/main.1b75f4dc.js`, chave `itf_ffl`. Trechos:

- **01 Grant of License:** "You may self-host the Font Software on your own servers or
  infrastructure for use on your own websites and applications, including through standard webfont
  technologies such as CSS @font-face. Self-hosting by end users is permitted and recommended…"
- **02 Limitations of Usage:** "The Font Software may not … be distributed … or otherwise made
  available to any other person or entity … This includes distributing the Font Software through
  another font website, font library, marketplace, **repository**, download service … or by …
  **publicly accessible servers**…". Também proíbe "subsetting, format conversion".
- **08 Termination:** em caso de "unauthorized … redistribution", o licenciador pode encerrar a
  licença na hora.

**Conclusão:** servir os WOFF2 do próprio site é permitido. O deploy da Vercel, porém, sai do
repositório Git, e **o repositório do projeto é público**. Commitar os arquivos (`src/fonts/` ou
`public/fonts/`) deixaria a fonte disponível para download num repositório público, que a seção
02 proíbe expressamente. Por isso não baixei nada, e o `<link>` da Fontshare e a CSP seguem como
estavam. Daqui também não foi possível acessar `api.fontshare.com` nem `cdn.fontshare.com`
(timeout). No smoke local, a navegação ficou presa ~10 s nesse CSS bloqueante, o que reforça o
ganho de M2.

**Opções para o dono:**
1. Tornar o repositório privado. Aí: baixar o kit oficial (WOFF2 500/700/800, sem converter nem
   subsetar), `next/font/local` com `display: "swap"` e `variable: "--font-cabinet"`, trocar
   `'Cabinet Grotesk'` por `var(--font-cabinet)` no `displayStack` do `tailwind.config.ts`, remover os 3
   `<link>` do `layout.tsx` e tirar `https://api.fontshare.com`/`https://cdn.fontshare.com` de
   `style-src`/`font-src` (e ajustar `tests/config/security-headers.test.ts`).
2. Manter o repositório público e trocar a fonte de display por uma OFL (ex.: via `next/font/google`),
   que pode ser redistribuída. É decisão de marca.
3. Manter como está (o `display=swap` já evita texto invisível; o custo é o CSS bloqueante de terceiro).

### M6: prazo total da OpenAI

- `src/lib/ai/generate.ts`: `OPENAI_REQUEST_TIMEOUT_MS = 30_000` e `OPENAI_MAX_RETRIES = 1` (os mesmos
  valores de antes), mais o novo `OPENAI_DEADLINE_MS = 45_000`, que vale para as 2 tentativas de
  saída inválida e para os retries do SDK somados. Cada chamada recebe um `AbortSignal` compartilhado
  e `timeout = min(30 s, tempo restante)`. Uma corrida com o prazo garante o retorno mesmo se o
  cliente ignorar o signal. Sem sobra de tempo, a 2ª tentativa não é feita (`invalid_output`, como
  antes).
- Estourar o prazo é `openai_error`. O `run-analysis.ts` não mudou: esse caminho já chamava
  `releaseDailyUsage` (libera a reserva sem gastar uma das 3 devoluções diárias) e responde 502 com
  "esta tentativa não foi descontada". Nenhuma regra nova de devolução.
- Orçamento: `maxDuration = 60` em `/api/analyze` e `/api/analyze/text`, 45 s de IA e ~15 s para
  sessão, rate limit, plano, reserva e gravação.
- Testes: `tests/lib/generate-deadline.test.ts` (fake timers: OpenAI travada com e sem respeitar o
  signal, prazo somado entre tentativas, sem timer pendente) e `tests/api/analyze-deadline.test.ts`
  (rota real + generate real, SDK travado: 502 honesto, `releaseDailyUsage` chamado, sem `refund`,
  nada gravado).

### M7: paginação do histórico

- `GET /api/history?limit=<1..50>&cursor=<id>`. Ordem `createdAt desc, id desc` (usa o índice
  `Conversation(userId, createdAt)`), `take = limit + 1` para saber se há próxima página e
  `cursor` + `skip: 1`. Resposta: `{ conversations, nextCursor }`. Validação com zod em
  `src/lib/validation/history.ts`: `limit` só aceita dígitos, e `cursor` usa o `idSchema`. Fora
  disso, 400 sem tocar no banco. O filtro continua sendo o `userId` da sessão.
- **Compatível:** sem `limit` e sem `cursor`, a consulta e a lista completa são as de antes (mais
  `nextCursor: null`). Isso cobre o JS antigo em cache durante o rollout. Proposta para depois:
  aplicar o limite padrão também nesse caso. `DELETE` não mudou.
- `/history`: pede `?limit=20`. Quando há `nextCursor`, mostra o botão **"Carregar mais"**
  (`loading` do `Button` com `aria-busy`, desabilitado e "Carregando…"), acrescenta sem duplicar e
  mostra toast se falhar. Durante uma busca com páginas por carregar, avisa: "A busca considera só
  as análises já carregadas. Use “Carregar mais” para incluir as anteriores."
- Testes: `tests/api/history.test.ts` (16) e `tests/ui/history-page.test.tsx` (+4). O mock da 1ª
  página no teste de UI passou de `/api/history` para `/api/history?limit=20`, porque é a nova URL
  pedida pelo cliente.

### M8: e-mail em massa do admin

- `src/app/api/admin/email/route.ts` + `src/lib/email/bulk.ts`: envios em lotes de
  `EMAIL_CONCURRENCY = 5`. Não começa um lote novo depois de `EMAIL_START_CUTOFF_MS = 30 s`, e os
  envios em andamento têm prazo de `EMAIL_SEND_DEADLINE_MS = 45 s`. Um envio que passa do prazo conta
  como falha e **não** é reenviado na próxima chamada, porque pode ter sido entregue.
- Resposta: `{ sent, failed, total, processed, remaining, nextCursor }` (os 3 primeiros campos não
  mudaram). Para continuar, o admin chama de novo com `cursor = nextCursor`. A ordem é estável por
  id do usuário, então nada se repete.
- Seleção de destinatários idêntica: mesmos `where`, só com `id` acrescentado no `select` para
  ordenar. Checagens de origem (CSRF) e de admin continuam antes de tudo. E-mail nulo continua
  pulado sem contar como falha. O envio para um usuário só não mudou.
- `/admin`: painel `role="status"` "Progresso do envio" com "X enviados · Y falharam · Z restantes
  (de N)" e o botão **"Continuar envio (Z restantes)"**, que repete o mesmo payload com o cursor.
  Ao terminar: "Envio concluído: …". Os campos do e-mail personalizado só são limpos no fim.
- Ritmo esperado: a ~1–2 s por e-mail, ~75–150 envios por chamada.
- Testes: `tests/api/admin-email-batch.test.ts` (9) e `tests/ui/admin-page.test.tsx` (+2).

### Itens pequenos

- **B4:** 13 logs em `api/admin/users`, `api/analyze`, `api/analyze/text`, `api/payment`, `api/stats`,
  `api/webhooks/abacatepay` (2), `lib/ai/generate`, `lib/ai/run-analysis` (3), `lib/auth` e
  `lib/rate-limit` passaram para `errorMessage()`. Guarda: `tests/config/safe-logs.test.ts`. Os
  `toast.error(e.message)` do cliente mostram mensagens da própria API e ficaram como estavam.
- **B9:** `"engines": { "node": ">=20" }`. O `next build` local roda em Node 24.15. O `netlify.toml`
  (obsoleto) usa 20. **Na Vercel, `engines` tem prioridade sobre o painel**, e `>=20` faz ela usar a
  maior versão suportada (hoje 24.x), com um aviso no log de build. Conferir na Preview.
- **B12:** `public/couple/` apagado (6 arquivos, 5,5 MB). O grep em `src`, `public`, `docs`,
  `tests`, `next.config.js`, `tailwind.config.ts` e CSS só encontrou o `content-guard` (que proíbe o
  uso) e menções em docs.
- **B13:** `UPLOADTHING_SECRET/APP_ID/TOKEN`, `PRODUCT_PRICE_CENTS` e `NEXT_PUBLIC_APP_NAME` saíram
  do `.env.example` (0 ocorrências no código) e a seção UploadThing saiu do README. `DIRECT_URL`
  entrou só como comentário opcional (`DATABASE_URL=<direta> npx prisma migrate deploy`), e
  `schema.prisma` ficou sem `directUrl`.
- `fix.sql`: não tocado.

### Checagens

`npx vitest run` **763/763** (63 arquivos; antes 709) · `npx tsc --noEmit` ok · `npm run lint` ok ·
`next build` ok.

**Smoke** (`next start -p 3461`, env fictício só no processo): `/` 200 com CSP presente,
`/api/health` 200, `/api/history?limit=20` sem sessão 401, `/dashboard` 307. A Inter vem da mesma
origem (`/_next/static/media/*.woff2`). A Cabinet Grotesk **ainda** vem de `api.fontshare.com` (M2
pendente). Console: sem violação de CSP nem erro do framer. Só aparecem o timeout da Fontshare e os
404 de `/_vercel/*` (normais fora da Vercel).

**QA numa Preview da Vercel:** animações de todas as telas (sheet, dialogs, gates, troca de passos
do `/analyze`, stagger do dashboard/settings, cards de sugestão) com e sem prefers-reduced-motion;
indicador do tom deslizando na landing e no `/analyze` (a 1ª troca pode não animar enquanto o chunk
carrega); "Carregar mais" no `/history` com mais de 20 análises; envio em massa com lista real
(conferir "Continuar envio"); versão do Node no log de build (B9); análise com a OpenAI lenta
(502 honesto e cota intacta).

## O que o dono precisa fazer

1. **Migration nova:** `prisma/migrations/20261120000000_perf_indexes` → rodar
   `npx prisma migrate deploy` contra produção, com a URL direta do Neon, em horário de pouco uso.
2. **Variáveis de ambiente:** nenhuma variável nova é obrigatória. Conferir se as 2 críticas
   (`DATABASE_URL`, `NEXTAUTH_SECRET`) e as recomendadas listadas em M10 estão no painel da Vercel.
   Se adotar M9: criar `DIRECT_URL`.
3. Monitor de uptime opcional apontando para `GET /api/health`.

## M2 resolvido: fonte de display trocada (Tarefa 9b)

- **Decisão do dono:** trocar por fonte de licença aberta (o repositório continua público).
- **Fonte:** Bricolage Grotesque, SIL Open Font License 1.1 (`src/fonts/bricolage/OFL.txt`), pesos 500/700/800, subset latin, arquivos tirados do pacote npm `@fontsource/bricolage-grotesque@5.3.0` (sem adicionar dependência).
- **Carregamento:** `next/font/local` em `src/app/layout.tsx` com `display: "swap"` e `--font-display`; `tailwind.config.ts` usa `var(--font-display)` no `displayStack`. Sem rede no build.
- **CSP:** `style-src 'self' 'unsafe-inline'` e `font-src 'self' data:` (Fontshare removida). Guardado por `tests/config/display-font.test.ts`.
- **Smoke:** HTML sem referência à Fontshare; fontes servidas de `/_next/static/media/`; `h1` renderiza com a fonte nova, sem overflow a 1280px.
- **Observação:** a Inter continua via `next/font/google` (baixada no build pela Vercel). Se o build ficar sem acesso ao Google Fonts, dá para aplicar o mesmo procedimento (`@fontsource/inter`, OFL).
