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

### A1. Next 14.2.35 com CVEs críticas sem patch na linha 14 — [proposto: upgrade] + [corrigido: mitigação]
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

### M1. framer-motion completo em todas as rotas (35,5 kB gzip) — [proposto]
- **Local:** 13 arquivos importam `motion`, entre eles `src/app/providers.tsx:5` (MotionConfig)
  e `src/components/landing/InteractiveDemo.tsx:4`. A landing carrega o chunk inteiro por causa da demo.
- **Evidência:** o chunk `3258-*.js` (35,5 kB gzip) está no JS de `/`, `/analyze`, `/dashboard`,
  `/settings`, `/auth/*` e `/admin`.
- **Proposta:** `LazyMotion` + componentes `m`. `layoutId` em `src/components/ui/tone-chip.tsx:118`
  exige `domMax`. Com features carregadas de forma assíncrona, o chunk inicial cai para ~5 kB.
  **Não implementado:** sem as features carregadas, `AnimatePresence` não conclui animações de saída
  (sheet, dialog, gates). Isso muda comportamento e quebraria testes de UI que renderizam fora do
  `Providers`. Precisa de uma tarefa própria, com QA visual.

### M2. Cabinet Grotesk via stylesheet externo bloqueante — [proposto]
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

### M6. Pior caso da OpenAI passa do `maxDuration` — [proposto]
- **Local:** `src/lib/ai/generate.ts:18` (`timeout: 30_000, maxRetries: 1`) e `:55` (`MAX_ATTEMPTS = 2`);
  `src/app/api/analyze/route.ts:8` (`maxDuration = 60`).
- **Evidência:** timeout + retry = até 60 s numa tentativa. Se a OpenAI travar, a função morre em
  60 s **antes** do `release()` da cota (`run-analysis.ts:81`). O usuário perde 1 análise da cota e
  recebe 504 (agora com mensagem padrão, M5).
- **Proposta:** prazo total (ex.: `AbortSignal.timeout(50_000)` compartilhado entre as tentativas),
  ou `timeout: 25_000`. Muda a política de retry, por isso fica com o dono.

### M7. `/api/history` sem paginação — [proposto]
- **Local:** `src/app/api/history/route.ts:16`. Devolve **todas** as conversas com todas as mensagens.
- **Evidência:** cresce de forma linear: 50 análises/dia no plano pago ≈ 1.500 conversas e 4.500
  mensagens por mês numa resposta só.
- **Proposta:** `take` + cursor (`?cursor=`) e carregar mais no front. Muda o contrato da API.

### M8. Envio de e-mail em massa sequencial no admin — [proposto]
- **Local:** `src/app/api/admin/email/route.ts:163` (loop `await sendMail`), `maxDuration = 60`.
- **Evidência:** a ~1–2 s por envio, listas acima de ~30–60 usuários estouram 60 s no meio do
  loop. A resposta se perde e parte dos e-mails já foi enviada.
- **Proposta:** fila (Vercel Queues/cron), lotes paralelos limitados, ou um provedor com envio em lote.

### M9. Neon: sem `directUrl` para migrations — [proposto]
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
| B4 | Logs com `error.message` cru (erro do Prisma inclui a invocação com valores) | `api/history`, `api/stats`, `api/analyze*`, `api/webhooks/abacatepay` (catch), `lib/rate-limit.ts:46`, `lib/ai/run-analysis.ts:36,100,119` | [proposto] trocar por `errorMessage()` |
| B5 | `findUserByEmail` faz `ILIKE` (varredura em `User`) a cada e-mail não encontrado | `src/lib/users.ts:13` | [proposto] remover o fallback depois de aplicar `normalize_emails` (o próprio comentário prevê isso) |
| B6 | `/api/admin/users` carrega todos os usuários e conta planos em memória | `src/app/api/admin/users/route.ts:17-34` | [proposto] `groupBy` por status + paginação |
| B7 | Páginas logadas são shells estáticos com fetch no cliente (HTML → JS → `/api/stats`) | build: `○ /dashboard`, `○ /analyze` | [proposto] prefetch no servidor numa tarefa de arquitetura |
| B8 | Sem `global-error.tsx` (erro no layout raiz cai na página padrão do Next) | `src/app/` | [proposto] |
| B9 | `package.json` sem `engines` (Node local 24.15; Vercel usa o que estiver no painel) | `package.json` | [proposto] `"engines": { "node": "20.x \|\| 22.x" }`, alinhado ao painel (mudar isso troca o Node da Vercel, por isso não foi aplicado) |
| B10 | `legacy-peer-deps=true` esconde conflito de peer: `next-auth@4.24.15` pede `nodemailer ^7.0.7`, instalado **10.x** | `.npmrc`, `netlify.toml` | [proposto] revisar no upgrade. `netlify.toml` está obsoleto (o deploy é na Vercel) |
| B11 | `fix.sql` na raiz com um ID de usuário real e `UPDATE` para LIFETIME (repositório público) | `fix.sql` | [proposto] apagar |
| B12 | 5,5 MB de assets não referenciados (`video.mp4` 3,4 MB, `scene-4.jpg` 1,7 MB…) | `public/couple/` (`grep couple src` = 0) | [proposto] apagar |
| B13 | `.env.example` lista variáveis que o código não lê | `UPLOADTHING_SECRET`, `UPLOADTHING_APP_ID`, `UPLOADTHING_TOKEN`, `PRODUCT_PRICE_CENTS`, `NEXT_PUBLIC_APP_NAME` (grep `process.env` = 0) | [proposto] remover. Todas as variáveis lidas pelo código estão no exemplo |

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

---

## O que o dono precisa fazer

1. **Migration nova:** `prisma/migrations/20261120000000_perf_indexes` → rodar
   `npx prisma migrate deploy` contra produção, com a URL direta do Neon, em horário de pouco uso.
2. **Variáveis de ambiente:** nenhuma variável nova é obrigatória. Conferir se as 2 críticas
   (`DATABASE_URL`, `NEXTAUTH_SECRET`) e as recomendadas listadas em M10 estão no painel da Vercel.
   Se adotar M9: criar `DIRECT_URL`.
3. Monitor de uptime opcional apontando para `GET /api/health`.
