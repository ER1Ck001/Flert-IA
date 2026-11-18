# Revisão de UX — Tarefa 5

Escopo: todos os fluxos do app, auditados pela leitura do código após o redesign "Faísca"
(`docs/redesign-faisca.md`). Os números de linha (`arquivo:linha`) se referem ao código **antes** das
correções desta tarefa.

**Totais:** 6 Alta · 13 Média · 15 Baixa (34 achados).
Corrigidos: todas as Alta e Média e 9 das Baixa. As demais estão marcadas como **proposta**.
Itens que pedem funcionalidade nova ou decisão do dono ficam na seção final, fora da contagem.

Regra das correções: só UX, markup, copy, a11y e layout. Chamadas de API, corpos de requisição,
schemas zod, auth, pagamento, cota e redirecionamentos continuam iguais (veja "Revisão do diff").

---

## Alta

| # | Onde | Problema | Correção |
|---|------|----------|----------|
| A1 | `src/app/` (não existe `not-found.tsx` nem `error.tsx`) | Uma URL inválida ou um erro de renderização cai no 404/erro padrão do Next: em inglês, sem marca e sem caminho de volta. Na área logada, o erro derruba a navegação. | **Corrigido.** `src/app/not-found.tsx` (pt-BR, h1, "Voltar ao início" e "Ir para a minha conta", noindex), `src/app/error.tsx` (role=alert, "Tentar novamente" → `reset()`, nunca mostra a mensagem técnica) e `src/app/(dashboard)/error.tsx` (dentro da casca, então sidebar e nav inferior continuam). Componente comum: `src/components/ui/status-screen.tsx`. |
| A2 | `analyze/page.tsx:135-137, 158-160`; `ResultsPanel.tsx` | Quando a IA falha (502), o erro aparece só num toast de 4 s. É justamente a mensagem do servidor que diz se a tentativa foi descontada do limite, e ela some. Não há botão para tentar de novo. | **Corrigido.** O erro fica no painel de resultado (`role="alert"`) com o texto do servidor e "Tentar novamente", que repete o mesmo handler com os mesmos dados (o teste confere que o corpo é idêntico). O limite diário (429) continua no toast + gate, como antes. |
| A3 | `api/payment/route.ts:94-95` → `dashboard/page.tsx` | O checkout volta para `/dashboard?payment=success`, mas o dashboard ignora o parâmetro: quem acabou de pagar não recebe nenhum retorno. | **Corrigido.** Aviso `role="status"` baseado no `isPaid` que o `/api/stats` (já chamado) devolve: "Seu plano está ativo." ou "Ainda não recebemos a confirmação do pagamento…", que explica a espera e aponta para Planos. É honesto: a mesma URL é usada como `returnUrl` e como `completionUrl`. |
| A4 | `admin/page.tsx` | (a) As ações da linha (enviar e-mail, excluir, copiar e-mail) ficam `opacity-0 group-hover:opacity-100` (`:517, :629`): invisíveis no toque e para quem navega por teclado. (b) O modal de e-mail (`:930-1017`) é uma `div`: sem `role=dialog`, sem prender o foco, sem Esc. (c) A tabela de 8 colunas não tem layout mobile (`:429-685`). (d) Os cabeçalhos ordenáveis usam `onClick` em `<th>` (`:444`) e "expandir" usa `<td onClick>` (`:497`): nada disso funciona pelo teclado. (e) Botões de ícone com ~26 px (`:330-340`), textos de 9,5–11 px e cores `/40` com contraste baixo. (f) Abas sem semântica. | **Corrigido.** Header com Logo, botões de 44×44 com `aria-label` e "Exportar CSV" (rótulo só no sr abaixo de `sm`). Abaixo de `md`, lista de cartões (`<ul aria-label="Usuários">`) com todos os dados, ações sempre visíveis e "Mais detalhes" (`<details>`). Em `md+`, tabela num contêiner `overflow-x-auto` (`min-w-[900px]`) com `<caption>`, `aria-sort` e botões de ordenação, e expandir como botão com `aria-expanded`. Abas com `role=tab/tabpanel`, filtros com `aria-pressed`, busca `type=search` com rótulo, labels ligados (`htmlFor`) no formulário de campanha, modal via Radix `Dialog`. Rótulos com nome: "Excluir usuário Ana", "Confirmar exclusão de Ana". Os handlers (`load`, `deleteUser`, `changePlan`, `sendToUser`, `sendCampaign`, `exportCSV`…) ficaram idênticos. Só o "clicar fora" do seletor de plano passou de `ref` para `closest("[data-plan-menu]")`, porque o controle existe no cartão e na tabela, e ganhou Esc. |
| A5 | `AppSidebar.tsx:79`, `AccountSheet.tsx:77` | "Seja Premium — **Recursos ilimitados**" é falso: todos os planos têm os mesmos recursos e só o Vitalício tem análises ilimitadas (a própria /pricing diz isso). | **Corrigido:** "Compare planos e limites". |
| A6 | `history/page.tsx:384-392, 293-305` | "Remover análise" apaga no primeiro toque, sem confirmação, e não dá para desfazer. O ícone fica no canto do cartão, fácil de tocar sem querer no celular. | **Corrigido.** `ConfirmDialog` novo (`src/components/ui/confirm-dialog.tsx`, Radix AlertDialog, que já era dependência): `role=alertdialog`, prende o foco, Esc cancela e o foco volta ao botão (ou ao `#main` se o item saiu da página). A chamada `DELETE /api/history?id=…` não mudou. |

## Média

| # | Onde | Problema | Correção |
|---|------|----------|----------|
| M1 | `layout.tsx:19` + todas as páginas (client) | Todas as rotas têm o mesmo `<title>`. Na aba e no histórico do navegador não dá para diferenciar Entrar, Histórico, Planos etc. Área logada e auth são indexáveis. | **Corrigido.** `title.template: "%s · Flert IA"` e um `layout.tsx` server só com `metadata` por rota (auth ×4, dashboard, analyze, history, pricing, profile, settings; admin no layout existente), com `robots: PRIVATE_ROBOTS` (`src/lib/seo.ts`). A description raiz perdeu a promessa "conexões reais". |
| M2 | `register/page.tsx:155`, `reset-password/page.tsx:401`, `profile/page.tsx:73-78` | A validação zod do cliente só aparece num toast: o campo não fica marcado e o foco não vai até ele. | **Corrigido.** Mesmo schema; o erro aparece no próprio `Field` (`role=alert`, `aria-invalid`, `aria-describedby`), o primeiro campo inválido recebe foco e o erro some ao editar. `noValidate` nesses formulários para o balão nativo não esconder a mensagem (o schema cobre as mesmas regras). Helper: `src/lib/field-errors.ts`. Erros do servidor continuam em toast. |
| M3 | `auth.ts:63-65` (`pages.error = /auth/login`) → `login/page.tsx` | O NextAuth devolve `?error=OAuthAccountNotLinked`/`AccessDenied`/… para o login, mas a página ignora: uma falha no Google volta ao login sem explicação. | **Corrigido.** Alerta acima do formulário com a mensagem de cada código (genérica para os desconhecidos). O fluxo de login não mudou. |
| M4 | `forgot-password:288`, `reset-password:411`, `analyze/page.tsx` (troca de view), `UploadDropzone` (remover), `settings` (cancelar exclusão) | Depois de ações assíncronas ou de trocar de tela, o elemento focado some e o foco cai no `<body>`. Quem usa leitor de tela ou teclado se perde. | **Corrigido.** Foco no título de confirmação ("Email enviado.", "Tudo certo."); no h1 da nova view do /analyze (`PageHeader autoFocusTitle`, exceto onde o textarea já tem autoFocus); no seletor de arquivo depois de "Remover imagem"; no campo "Digite EXCLUIR" ao abrir a exclusão e de volta no botão ao cancelar. |
| M5 | `analyze/page.tsx:166`, `history/page.tsx:287` | `navigator.clipboard.writeText` sem `await`: mostra "Copiado!" mesmo quando o navegador bloqueia a cópia. | **Corrigido.** `await` + `catch` → toast "Não foi possível copiar. Selecione o texto e copie manualmente." e o check verde não aparece. |
| M6 | `textarea.tsx` (contador) | O contador `n/2000` é `aria-live`: o leitor de tela anuncia cada tecla. | **Corrigido.** O contador visível continua (via `aria-describedby`). Uma região `polite` separada só fala perto do limite ("Restam N caracteres"). |
| M7 | `dashboard/page.tsx:58-62` | Os números mostram 0 enquanto carregam, e o erro (`.catch(() => {})`) também vira 0: dados falsos. | **Corrigido.** "—" com texto sr "carregando"/"indisponível", `aria-busy`, e o erro diz "Não foi possível carregar seus números agora." |
| M8 | `history/page.tsx:272-274` | Uma falha ao carregar mostra "Nenhuma análise ainda", que é falso e assusta. | **Corrigido.** Estado de erro `role=alert` ("Suas análises continuam salvas") com "Tentar novamente". |
| M9 | `pricing/page.tsx:501-507` | Depois de "Redirecionando...", o `finally` reabilita o botão enquanto o navegador ainda sai da página: um segundo clique cria outro checkout. | **Corrigido.** O botão fica "Redirecionando..." (busy) e os outros planos ficam desativados. Voltar pelo bfcache (`pageshow.persisted`) libera tudo. O POST não mudou. |
| M10 | `settings/page.tsx:453-461` | "Sair de tudo" encerra todas as sessões num toque, sem confirmação. | **Corrigido.** `ConfirmDialog` "Sair de todos os dispositivos?" → mesma chamada `POST /api/account/sessions/revoke`. |
| M11 | `analyze/page.tsx:302-303, 323, 335, 377`; `dashboard/page.tsx:88` | Copy com promessa de resultado: "abertura perfeita", "respostas certeiras", "Pronto para conquistar mais conversas hoje?". Além disso, o título "Situação difícil" não bate com o cartão "Situação estranha". | **Corrigido.** "Primeira mensagem", "receba 3 sugestões de resposta", "O que você quer responder hoje?", título "Situação estranha". |
| M12 | `LandingHeader.tsx:38-43, 27-31`, `LandingFooter.tsx:18`, `CookiePrefsButton.tsx` | Alvos de toque abaixo de 44 px: "Entrar"/"Criar conta" do header com `size=sm` (36 px), links do rodapé e "Preferências de cookies" só com altura de texto, links de seção com `py-2`. | **Corrigido.** `h-11`/`min-h-11` mantendo o visual compacto. O mesmo vale para os links Suporte/Premium da sidebar. |
| M13 | `AuthShell.tsx:52, 106` | `text-text-3` em `text-caption` (12 px), contra a regra do spec (text-3 só a partir de 14 px). | **Corrigido.** `text-text-2`. |

## Baixa

| # | Onde | Problema | Status |
|---|------|----------|--------|
| B1 | `AuthShell.tsx:77` | `<main id="main">` sem `tabIndex=-1`: o skip link rola a página, mas não leva o foco (no Safari). | Corrigido. |
| B2 | `history/page.tsx:411` | Vários botões "Copiar sugestão" com nomes iguais. | Corrigido: "Copiar sugestão 1/2/3". |
| B3 | `history/page.tsx:353` | O CTA do estado vazio usa `window.location.href` (recarrega o app inteiro). | Corrigido: `Button asChild` + `Link`. |
| B4 | `history/page.tsx:282-284` | A busca só olha o título, que tem a chave em inglês ("flirty"). Buscar "Flertando" não acha nada, e o total não é anunciado. | Corrigido: busca no rótulo do tom e nas sugestões; "N análises encontradas" em `aria-live`. |
| B5 | `dashboard/page.tsx:38` | Anglicismo "Upload do print" e "3 opções prontas". | Corrigido. |
| B6 | `admin/page.tsx:488` | `<>` sem `key` dentro do `map`. | Corrigido (`Fragment key`). |
| B7 | `reset-password/page.tsx:432` | O sucesso redireciona em 2,8 s sem link manual. | Corrigido: "Ir para o login agora". |
| B8 | `layout.tsx:20` | A meta description promete "conexões reais". | Corrigido (ver M1). |
| B9 | `admin/page.tsx` | Spinners com `animate-spin`/`animate-pulse` sem `motion-reduce`. | Corrigido no admin (`motion-reduce:animate-none`). |
| B10 | `StickyActionBar.tsx` | O botão "Gerar" fica desativado sem dizer por quê ("envie um print" / "escreva o contexto"). | **Proposta:** dica curta ligada por `aria-describedby` quando `disabled`. |
| B11 | `GoogleButton.tsx` | Sem estado de carregamento: dá para clicar duas vezes antes do redirecionamento. | **Proposta:** `loading` local após o clique. |
| B12 | `pricing/page.tsx:475-483` | Mostra os 3 planos e depois esconde os inferiores quando chega o status (salto de layout). | **Proposta:** skeleton até o `GET /api/payment` responder. |
| B13 | `settings/page.tsx:484-489` | O painel de exclusão anima `height` com spring; o `MotionConfig reducedMotion="user"` só desliga transform. | **Proposta:** `useReducedMotion` → `duration: 0`. |
| B14 | `admin/page.tsx` | `aria-controls` aponta para a linha de detalhes, que só existe quando expandida. | **Proposta:** renderizar a linha com `hidden`. |
| B15 | `AccountSheet.tsx:37`, `AppSidebar.tsx:93` | O fallback "Usuário" aparece por um instante enquanto a sessão carrega. | **Proposta:** Skeleton no lugar do nome. |

---

## Verificações por tema (resumo)

- **Estados vazio/carregando/erro/sucesso:** analyze (Spinner → gates → loader + skeleton → resultado/erro), histórico (skeleton/vazio/sem resultado/erro), dashboard (carregando/erro/aviso de pagamento) e auth (sucesso com foco). Ok depois das correções.
- **Formulários:** `autoComplete` certo em todos (email, current-password, new-password, name). `type=email`/`search`. `inputMode` não é necessário: não há campos numéricos. Erros inline com `aria-invalid`/`aria-describedby`.
- **aria-live:** resultado do analyze (`polite` + `alert` no erro), contagem da busca, contador do textarea perto do limite, avisos de pagamento (`status`). Os toasts (react-hot-toast) já são `role=status`.
- **Teclado:** chips de tom com roving tabindex (já testados), Sheet/Dialog/AlertDialog com foco preso e Esc, admin sem handlers só de mouse.
- **360 px:** a revisão do código não encontrou larguras fixas que estourem (admin: tabela só em `md+`, dentro de `overflow-x-auto`; filtros do admin com rolagem horizontal própria). O conteúdo do app usa `pb-safe`, e o `StickyActionBar` fica acima da nav (`bottom: var(--bottom-ui)`) com `pb-24` reservado nas views. O admin não tem nav inferior. **Precisa de conferência visual.**
- **prefers-reduced-motion:** a regra global do CSS e o `MotionConfig reducedMotion="user"` já cobriam quase tudo; o restante está em B9 e B13.
- **Consistência:** confirmações destrutivas agora usam um só componente (`ConfirmDialog`); 404/erros usam `StatusScreen`; o admin usa `Button`, `Logo`, `Dialog` e os tokens do app.

## Fora do escopo / decisão do dono

1. **Páginas legais.** Não existem Termos de Uso nem Política de Privacidade, o cadastro não pede aceite e o rodapé não tem esses links. O texto jurídico precisa vir do dono (LGPD); não foi inventado.
2. **Plano escolhido na landing.** `/auth/register?plan=…` só mostra um selo; depois do cadastro o usuário vai para `/dashboard`, não para o checkout daquele plano. Mudar isso é mudar o fluxo.
3. **Medidor de uso depois de uma tentativa descontada.** Quando a IA devolve saída inválida e a devolução diária já se esgotou (mensagem "CHARGED" em `run-analysis.ts`), o `UsageMeter` não soma 1. Exigiria recarregar `/api/stats` depois do erro (lógica de estado). Proposta: chamar o `loadStatus` sem voltar ao Spinner.
4. **Retorno do checkout.** `returnUrl` e `completionUrl` são iguais (`payment/route.ts:94-95`), então o app não sabe se a pessoa pagou ou desistiu. Separar exigiria mudar a rota de pagamento. Uma página de confirmação com polling do status também seria funcionalidade nova.
5. **Admin: métricas.** `PLAN_PRICES` está fixo em `admin/page.tsx:49`, e o "MRR estimado" pode divergir de `plans.ts`. Proposta: derivar de `PLAN_CONFIG`.
6. **Copy dos e-mails de campanha** ("destravar suas conversas 💘") é gerada no servidor e não foi mexida.
7. **Suporte e reembolso** usam o Gmail web (`mail.google.com/…`) em vez de `mailto:`. Mantido (é a URL atual); vale decidir se fica.
8. **Preferências de notificação, colar print da área de transferência e PWA** já estavam listados como "Para depois" no spec.

## Revisão do diff (lógica preservada)

- Os corpos de `/api/analyze`, `/api/analyze/text`, `/api/payment`, `/api/history` (DELETE), `/api/profile` (PUT/DELETE), `/api/account/sessions/revoke`, `/api/auth/*` e das rotas admin não mudaram (os testes conferem o corpo exato).
- Schemas zod, `safeCallbackUrl`, `signIn`/`signOut`, os redirecionamentos e o middleware não mudaram.
- Mudanças de comportamento que o usuário vê: confirmação antes de remover análise e de "Sair de tudo"; erro de geração inline em vez de toast; `noValidate` em cadastro/redefinir/perfil (mesmas regras via zod); busca do histórico mais ampla; o dashboard agora considera `res.ok`.
- Um teste existente foi ajustado: o content-guard "auth usa AuthShell" passou a valer para `page.tsx`, porque os `layout.tsx` novos só exportam metadata.

## Para conferir no navegador

- Admin em 360/390/768/1024 px: cartões, rolagem horizontal da tabela e seletor de plano (flutuante nos cartões; na tabela abre dentro da célula para não ser cortado pelo `overflow-x-auto`).
- Foco visível no h1 do /analyze depois de trocar de view (`focus:outline-none` no título).
- Aviso de pagamento no dashboard com `?payment=success` (os 2 estados).
- `ConfirmDialog` em 360 px (`inset-x-4`) e com teclado virtual aberto.
- Tela 404 e `error.tsx` (forçar um erro), contraste e Lighthouse a11y.
