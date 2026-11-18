# Redesign "Faísca" — especificação aprovada (Tarefa 4)

Stack: Next 14.2 App Router, React 18, Tailwind 3.4, framer-motion 11, lucide, Radix.
Produto: SaaS pago de 3 sugestões de resposta em 7 tons (NÃO é app de namoro).
**Regra:** NÃO mudar lógica de negócio, chamadas de API, `src/lib/validation`, `src/lib/plans.ts`
nem fluxos de sessão. Só apresentação/UX.

## Problemas atuais a corrigir
- Contraste: branco sobre #8B5CF6 = 4.2:1 (reprova AA). Preenchimento de botão = #7C3AED (5.7:1);
  gradiente CTA #7C3AED→#DB2777. Coral #FF7A59 só decorativo.
- Fontes: Cabinet carregada 2x (`<link>` + `@import` inválido em globals.css após `@tailwind`) — bloqueia
  render. Inter via next/font não usada. Cormorant ligada a `font-display`.
- Tema claro quebrado (ThemeProvider `attribute=class`, tokens em `[data-theme=light]`) → só dark.
- CSS global: `*{transition…}`; `.rounded-*{… !important}`; grain `body::before` z 9998 — remover.
- /analyze: spinner `az-loading` sem CSS no estado inicial; selo "MAIS USADO" sem dado; tons com emoji.
- Auth: botão olho `tabIndex=-1` sem aria-label; "burst" de emojis ❤️.
- Landing: "MELHOR ESCOLHA", vídeo "Resultado real. Sem edição.", "Ela respondeu…", "Ela mandou 3 áudios".
- ConsentBanner fixo `bottom-3` z 9999 cobrirá a nav inferior.

## Tema: só dark
`<html className="dark" style={{colorScheme:"dark"}}>`, ThemeProvider `forcedTheme="dark"` (ou remover após
grep `useTheme`/`dark:`). Apagar `[data-theme="light"]`.

## Tokens (`src/app/globals.css`, canais RGB para `<alpha-value>`)
```css
:root{
 --bg:11 8 20; --surface:21 16 36; --surface-2:29 22 49; --surface-3:38 29 63;
 --text:244 241 250; --text-2:163 157 184; --text-3:138 132 163; /* text-3 só ≥14px, nunca sobre surface-3 */
 --violet-400:167 139 250; --violet-500:139 92 246; --violet-600:124 58 237;
 --pink-400:255 95 160; --pink-500:255 61 139; --pink-600:225 29 116; --coral-500:255 122 89;
 --success:52 211 153; --warning:251 191 36; --danger:248 113 113;
 --grad-signal:linear-gradient(120deg,#8B5CF6 0%,#FF3D8B 55%,#FF7A59 100%);
 --grad-cta:linear-gradient(120deg,#7C3AED,#DB2777);
 --grad-aurora:radial-gradient(60% 50% at 20% 0%,rgb(139 92 246/.22),transparent 70%),radial-gradient(50% 40% at 85% 10%,rgb(255 61 139/.16),transparent 70%);
 --glass-bg:rgb(21 16 36/.72); --glass-blur:16px;
 --radius-sm:10px; --radius-md:16px; --radius-lg:20px; --radius-xl:24px;
 --shadow-1:inset 0 1px 0 rgb(255 255 255/.04),0 8px 24px -12px rgb(0 0 0/.6);
 --shadow-2:0 24px 48px -24px rgb(0 0 0/.75);
 --glow-violet:0 0 0 1px rgb(139 92 246/.35),0 8px 32px -8px rgb(139 92 246/.45);
 --glow-pink:0 0 0 1px rgb(255 61 139/.35),0 8px 32px -8px rgb(255 61 139/.4);
 --dur-1:120ms; --dur-2:200ms; --dur-3:320ms; --dur-4:560ms;
 --ease-out:cubic-bezier(.16,1,.3,1); --ease-in-out:cubic-bezier(.65,0,.35,1);
 --topbar-h:56px; --nav-h:64px; --bottom-ui:0px;
}
html:has([data-bottom-nav]){ --bottom-ui:calc(var(--nav-h) + env(safe-area-inset-bottom)); }
@media (min-width:1024px){ html:has([data-bottom-nav]){ --bottom-ui:0px } }
@media (prefers-reduced-motion:reduce){ *,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important} }
```
- Manter vars shadcn (`--background`, `--primary`, `--card`, `--border`, `--ring`, `--muted`, `--destructive`…)
  apontando para a paleta nova (componentes antigos não quebram).
- Remover: `@import`, transition global, overrides `.rounded-*`, grain, `.font-display` Cormorant, `.label-caps`.
- Manter `input,select,textarea{font-size:16px}` em `@layer base` sem `!important` (evita zoom no iOS).
- Foco: `:focus-visible{outline:2px solid rgb(var(--violet-400));outline-offset:2px}`.
- `@layer components`: `.glass` (com `@supports not (backdrop-filter…)` → `rgb(var(--surface)/.96)`),
  `.border-signal` (padding-box surface + border-box grad-signal, borda 1px transparente), `.text-signal`
  (background-clip:text), `.bg-aurora`, `.pb-safe` (`padding-bottom: calc(var(--bottom-ui) + 16px)`).
- Classes `chat-*` (landing antiga) ficam num bloco "LEGACY" até a 4.2.

## tailwind.config.ts
- colors: `bg`, `surface{DEFAULT,2,3}`, `text{DEFAULT,2,3}`, `violet`/`pink{400,500,600}`, `coral`, `success`,
  `warning`, `danger` → `rgb(var(--x)/<alpha-value>)`. Nomes shadcn mantidos. Alias `brand` → escala violeta
  do Tailwind (50 #F5F3FF … 500 #8B5CF6, 600 #7C3AED … 950 #2E1065) — permanente (admin usa `brand-*`).
  `gold` → alias de pink (remover na 4.5).
- fontFamily: `sans ['var(--font-inter)', …]`; `display ["'Cabinet Grotesk'", …]`; `cabinet` = display;
  `cormorant` = alias de display até 4.5.
- fontSize: display `clamp(2.5rem,5vw+1rem,4.5rem)`/1.02/800/-0.03em; h1 `clamp(1.75rem,2.5vw+1rem,2.5rem)`/1.1/700/-0.02em;
  h2 `clamp(1.375rem,1.5vw+1rem,2rem)`/1.15/700; h3 1.125rem/1.3/700; body 1rem/1.6; small .875rem/1.5; caption .75rem/1.4/500/0.02em.
- borderRadius sm/md/lg/xl/2xl → vars; boxShadow 1, 2, glow-violet, glow-pink; backgroundImage signal, cta,
  aurora; transitionTimingFunction out, in-out; maxWidth app 960px, site 1120px; spacing nav `var(--nav-h)`.
- keyframes: spark (1.4s), shimmer, signal-sweep. Remover marquee, rotate360, bob.

## src/lib/motion.ts
`DUR {fast:.12, base:.2, slow:.32, reveal:.56}`; `EASE {out:[.16,1,.3,1], inOut:[.65,0,.35,1]}`;
`SPRING {type:"spring",stiffness:380,damping:30}`. Variants: fadeIn, fadeUp (y 12→0), scaleIn (.96→1),
stagger(step=.06), sheetUp (y 100%→0), sparkPulse, suggestionIn. `reduced(v)` → só opacidade;
`useMotionSafe(v)` via `useReducedMotion()`. `<MotionConfig reducedMotion="user">` em `src/app/providers.tsx`.

## Componentes (`src/components/ui`)
- **button.tsx** (cva): primary (bg-violet-600, texto branco), signal (bg-cta shadow-glow-pink — só CTA
  principal por tela), secondary (surface-2 + borda), outline, ghost, danger, link. Aliases até 4.5:
  default→primary, brand→signal, destructive→danger. Tamanhos sm h-9, md h-11, lg h-12, icon 44×44.
  Props `loading` (Spinner, aria-busy, disabled), `leftIcon`, `rightIcon`, `asChild`. rounded-md; active:scale-[.98].
- **card.tsx**: `Card variant solid|outline|interactive` (hover borda forte + glow-violet); manter subcomponentes.
- **glass-card.tsx**: só camadas flutuantes.
- **input.tsx / textarea.tsx**: h-12, bg-surface-2, rounded-md, borda, ring violet-400; invalid → aria-invalid +
  borda danger; Textarea `showCount` + `maxLength` com contador `aria-live="polite"`.
- **field.tsx** (label/hint/error, aria-describedby); **password-input.tsx** (toggle focável, aria-label
  "Mostrar senha"/"Ocultar senha", aria-pressed).
- **badge.tsx** neutral|violet|pink|success|warning|signal.
- **tone-chip.tsx**: `ToneChipGroup({value,onChange,options,label})` role=radiogroup, roving tabindex com setas,
  indicador `layoutId` único via `useId()`; mobile rolagem horizontal snap-x `-mx-4 px-4` com fade nas bordas;
  selecionado `.border-signal`.
- **skeleton.tsx** (shimmer; estático com reduced motion); **spinner.tsx** (SVG sm|md|lg).
- **faisca-loader.tsx**: 2 mini-bolhas + estrela com spark; role=status + "A IA está pensando…"; etapas
  rotativas "Lendo a conversa" → "Ajustando o tom" → "Escrevendo 3 opções".
- **empty-state.tsx** {icon,title,description,action}; **sheet.tsx** (Radix Dialog; mobile bottom sheet com
  sheetUp, rounded-t-xl, handle; md+ centralizado); reestilizar dialog.tsx.
- **toaster.tsx** (client; top-center; surface-2, border-strong, rounded-md, Inter 14px; ícones success/danger)
  substitui o Toaster inline do layout.
- **page-header.tsx** {eyebrow?, title, description?, actions?}.

## Logo "Faísca" (`src/components/brand/Logo.tsx`)
`LogoMark({size=28})`, `Logo({variant:"full"|"mark"})`; wordmark "Flert IA" Cabinet 800 com "IA" em
`.text-signal`. SVG `viewBox="0 0 32 32"`: bolha esquerda contorno #A78BFA (rect 4,6 13×11 rx5 + rabicho
inferior esquerdo); bolha direita contorno #FF5FA0 em 15,15 13×11 + rabicho inferior direito; estrela de
4 pontas no vão (centro 16,16, r 4.5) com linearGradient signal (id via `useId()`). Cópia estática em `src/app/icon.svg`.

## Fases

### 4.1 Fundação + casca do app
- globals.css, tailwind.config.ts.
- layout.tsx: remover Cormorant; Inter variável; fontshare só no `<link>` com `cabinet-grotesk@500,700,800`;
  body `font-sans bg-bg text-text`; `<Toaster/>` novo; skip link "Pular para o conteúdo" → `#main`;
  `viewport = {width:"device-width", initialScale:1, viewportFit:"cover", themeColor:"#0B0814"}` sem
  maximumScale/userScalable; tirar "dating" de keywords.
- providers.tsx (forcedTheme + MotionConfig); motion.ts; componentes ui; Logo + icon.svg.
- (dashboard)/layout.tsx compondo `src/components/app/`: `nav-items.ts`; `AppSidebar.tsx` (lg+, w-64,
  bg-surface/60 sem blur, ativo por `pathname.startsWith`); `TopBar.tsx` (mobile, .glass, sticky);
  `BottomNav.tsx` (<lg, fixo, .glass, `data-bottom-nav`, padding safe-area; 5 alvos 44px: Início, Histórico,
  **Analisar** (central, círculo bg-cta), Planos, Conta; `aria-current="page"`); `AccountSheet.tsx` (Perfil,
  Configurações, link de suporte = URL atual, Seja Premium, Sair = `signOut({callbackUrl:"/"})`).
  `<main id="main" className="pb-safe lg:pb-8 px-4 sm:px-6 lg:px-8 max-w-app mx-auto">`. Remover drawer mobile antigo.
- ConsentBanner: só estilo (.glass, Button secondary com peso igual, `bottom: calc(12px + var(--bottom-ui))`).
- **Pronto:** build/test ok; grep vazio p/ Cormorant, maximumScale, userScalable; nav ok em 360px; banner não
  cobre a nav; admin renderiza com a paleta nova; páginas antigas (az-/au-) continuam funcionando.

### 4.2 Landing
`src/app/page.tsx` server component compondo `src/components/landing/`: LandingHeader; Hero (mock SVG/CSS com
selo "Ilustração"); HowItWorks (3 passos: enviar print/descrever → escolher o tom → copiar uma das 3);
InteractiveDemo (client; `demo-data.ts` estático: cenário Conversa 6 tons e Story 7 tons, 3 sugestões por
tom; troca cenário/ToneChipGroup → FaiscaLoader ~900ms (0 com reduced motion) → 3 SuggestionCard com copiar;
**sem API**; rótulo "Exemplo ilustrativo — no app, as sugestões são geradas a partir da sua conversa.");
TonesShowcase; PlansSection (`src/components/plans/PlanCard.tsx` reutilizável; PLANS_IN_ORDER, formatBRL,
getPlanBenefits, annualSavingsCents, methodsLabel; selo só do `badge` do PLAN_CONFIG; CTA `/auth/register`);
Faq (`<details>`; conteúdo em `src/content/faq.ts` compartilhado com /pricing); FinalCta; LandingFooter
(CookiePrefsButton client dispara `OPEN_CONSENT_EVENT`; e-mail de suporte; ©; sem links inventados).
Hero: "A resposta certa, no tom certo." / "Envie o print ou descreva a situação. A IA sugere 3 respostas em 7
tons — você escolhe e copia." Remover ConversationalLanding.tsx, uso de /couple/video.mp4 e scene-*.jpg,
classes chat-*. **Pronto:** grep vazio "Resultado real", "Ela respondeu", "Ela mandou", "MELHOR ESCOLHA";
preços = plans.ts; footer reabre o banner; Lighthouse mobile LCP<2.5s e a11y≥95; nenhum CDN novo.

### 4.3 Auth
`src/components/auth/AuthShell.tsx` (mobile coluna + bg-aurora; lg split com painel de marca; copy neutra) e
`GoogleButton.tsx`; reescrever JSX de login/register/forgot-password/reset-password com Field/Input/
PasswordInput/Button loading. **Preservar:** handlers, `signIn("credentials"|"google")`, safeCallbackUrl,
parses zod, toasts, Suspense do useSearchParams, autoComplete, leitura/remoção do token no reset. Remover
AUTH_CSS e burst. **Pronto:** grep vazio AUTH_CSS/dangerouslySetInnerHTML em /auth; fluxo por teclado;
erro de credencial, RATE_LIMITED, Google e reset funcionando.

### 4.4 Analyze + dashboard
`src/components/analyze/`: tones.ts (`{value,label,icon}`; values **imutáveis** flirty, funny, casual, witty,
serious, pickup, stories; lucide Heart, Laugh, Coffee, Zap, MessageSquareText, Flame, Camera); ModeCard.tsx (hub
3 cartões ImageUp/MessageCirclePlus/LifeBuoy, sem "MAIS USADO"); UploadDropzone.tsx (`<label>` + input file
sr-only, anel focus-within, preview next/image, remover com aria-label; onFile = loadImage); UsageMeter.tsx
(role=progressbar; aviso `todayCount >= dailyLimit-2`; oculto no Vitalício); SuggestionCard.tsx (número, texto,
botão "Copiar sugestão N" → Check "Copiado"; stagger 60ms; .border-signal 600ms uma vez); ResultsPanel.tsx
(loading FaiscaLoader + 3 Skeleton; aria-live polite; scrollIntoView smooth/auto); AnalyzeGate.tsx (mesmos
textos/condições); StickyActionBar.tsx (<lg .glass acima da nav, `bottom: var(--bottom-ui)`; **único** botão
Gerar chamando o handler existente). analyze/page.tsx: manter TODA a lógica — só JSX; apagar AZ_CSS;
`isPaid===null` → Spinner. dashboard/page.tsx: PageHeader com saudação; CTA "Analisar conversa" em Card
.border-signal; stats grid-cols-3; links rápidos Button secondary; "Como funciona" 1 col mobile/3 sm+;
fetch/redirect intactos; remover MagicCard e apagar magic-card.tsx. **Pronto:** todas as views em 360px;
gates (sem plano/expirado/limite); body do request idêntico; chips por teclado; grep vazio "az-".

### 4.5 History, pricing, profile, settings, admin
history (PageHeader, busca, Skeleton, EmptyState, aria-label nos ícones, label do tom via tones.ts); pricing
(PlanCard + Faq compartilhados; manter RANK/visiblePlans/isBlocked/handleSubscribe; Button loading); profile
(Field/Input/PasswordInput/Avatar; mesmo zod e reautenticação); settings (só estilo); admin (só tokens).
Limpeza: remover aliases gold/cormorant e variantes legadas do Button (manter brand). **Pronto:** grep vazio
#8B0A2A, #C9A84C, gold-; sem overflow em 360px.

## Verificação visual
Rotas: /, /auth/*, /dashboard, /analyze (todas as views + 3 gates), /history, /pricing, /profile, /settings,
/admin. Larguras 360/390/768/1024/1280. Checklist: `scrollWidth <= innerWidth`; nada cobre a nav; zoom 200%;
teclado (skip link, foco visível, Sheet prende foco + Esc); contraste (axe/Lighthouse); reduced motion;
performance (CPU 4x, Fast 3G, LCP<2.5s).

## Testes
Dev deps: jsdom, @testing-library/react, @testing-library/user-event, @testing-library/jest-dom.
`environmentMatchGlobs: [["tests/ui/**","jsdom"]]` em vitest.config.ts; `tests/ui/setup.ts` importa jest-dom.
Testar: ToneChipGroup (radiogroup, aria-checked, setas, onChange com as chaves da API); Button loading
(disabled + aria-busy); Textarea showCount; FaiscaLoader role=status + texto; SuggestionCard onCopy +
"Copiado"; CookiePrefsButton dispara OPEN_CONSENT_EVENT; PlanCard preços = formatBRL(PLAN_CONFIG.*.priceCents);
BottomNav aria-current (mock usePathname). Node: `tests/config/content-guard.test.ts` (landing sem frases
fictícias; layout sem userScalable/maximumScale; values de tones.ts = lista fixa).

## Riscos
- CSP: Inter via next/font ('self'); Cabinet via fontshare já liberado; sem CDN novo; não mudar
  tests/config/security-headers.test.ts.
- Performance: backdrop-filter só em topbar/nav/sheet/barra fixa (máx. 2 simultâneos), blur ≤16px; glows com
  radial-gradient (não filter blur grande); animar só transform/opacity; content-visibility:auto abaixo da dobra.
- Fluxos: um único botão Gerar; useId para layoutId; manter signOut e suporte; grep `dark:` antes de forçar tema.

## Para depois
Modo claro; CSP com nonce; self-host da Cabinet (verificar licença); colar print da área de transferência;
PWA + opengraph-image; Playwright com screenshots; haptics no copiar; excluir public/couple/* quando nada usar.
