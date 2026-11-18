# Auditoria de copy — Flert IA

Tarefa 7, entrada para a Tarefa 8. Toda a copy que o usuário vê (landing, SEO, auth, app, erros da API,
e-mails), checada contra `brand-voice.md` e as regras do produto. Linhas conferidas em 18/11/2026.

**Prioridade:** **Alta** = risco de alegação, jurídico ou LGPD, ou informação errada. **Média** = tom,
consistência ou clareza que afeta a confiança. **Baixa** = estilo.

**Problema:** `alegação` (promessa ou fato não verificável), `exatidão` (contradiz o código), `tom`,
`clareza`, `estilo`, `legal`.

> **Fora do escopo da Tarefa 8 (só copy):** itens marcados **[dono]** dependem de decisão ou de mudança
> de produto (Termos, 18+, reembolso, opt-in de e-mail, prompt). Para eles, o texto proposto vale depois
> da decisão.

---

## Resumo

- A **landing, o auth e o app** (voz nova, Tarefa 4) estão quase todos corretos. Os problemas são pontuais:
  gênero nos placeholders, "Seja Premium", "Resolver situação", FAQ de reembolso e do Vitalício.
- **Todos os e-mails de boas-vindas e de campanha** ainda usam a voz antiga: promessa de resultado
  ("Sua vida amorosa nunca mais será a mesma"), "IA treinada", "parecem humanas, não geradas por IA",
  urgência ("alguém mais está usando a IA pra sair na frente"), emoji e a grafia "Flert.IA".
- **Contradições com o código:** `settings/page.tsx:146` diz que só mandamos e-mails sobre a conta, mas o
  admin manda campanhas sem descadastro; `auth.ts:102` diz "Até 50 análises por dia" (o Vitalício é
  ilimitado); `admin/email/route.ts:66` fixa "a partir de R$ 29,90/mês" (o Anual sai mais barato por mês).
- **Risco jurídico:** reembolso de 12 h / 1 análise frente ao art. 49 do CDC; não há Termos nem Política
  de Privacidade.

---

## Status — Tarefa 8 (18/11/2026)

**57 Feito · 7 Pendente (dono) · 2 Não aplicado** (66 itens, contando a proposta estrutural de e-mail e as
4 linhas da seção 6). Regras automatizadas em `tests/config/content-guard.test.ts` (bloco "Tarefa 8"),
`tests/lib/prompts.test.ts` e `tests/lib/email-templates.test.ts`.

| # | Status | Observação |
|---|---|---|
| L1 | Pendente (dono) | Concordância corrigida ("O reembolso está disponível se…"); a regra 12 h / 1 análise foi mantida. Validar com advogado o art. 49 do CDC (7 dias). |
| L2 | Feito | P: "O plano Vitalício expira?" R: "Não. … enquanto o Flert IA estiver no ar." |
| L3 | Feito | Começa com "Não."; durações derivadas de `PLAN_CONFIG`. |
| L4 | Feito | 4 perguntas novas (app de namoro, plano gratuito, print, falha da IA). "Grátis" trocado por "gratuito"/"não custa nada" (brand-voice). |
| L5 | Pendente (dono) | Termos de uso e Política de privacidade não existem; links entram quando houver as páginas. |
| L6 | Feito | "…Valores em reais, sem cobrança automática." |
| L7 | Feito | "Ousada, mas feita a partir da conversa." (o prompt do tom pede "sem ser vulgar"). |
| L8 | Feito | "…edite se quiser e copie." |
| L9 | Feito | "Flert IA — Assistente de conversa com IA" (title e Open Graph). |
| L10 | Feito | Keywords trocadas pela lista proposta. |
| L11 | Não aplicado | Já estava de acordo com a voz; mantido. |
| L12 | Feito | "…em “Preferências de cookies”, no rodapé da página inicial." (o botão só existe no rodapé da landing). |
| L13 | Pendente (dono) | Vercel Analytics/Speed Insights: confirmar e citar na Política de privacidade. |
| A1 | Feito | "Crie sua conta. As análises fazem parte dos planos, que você escolhe em seguida." |
| A2 | Pendente (dono) | Aceite de termos e confirmação 18+ no cadastro. |
| A3 | Feito | Título "Que bom te ver de novo"; toast "Login feito." |
| A4 | Feito | Títulos de auth sem ponto final. |
| A5 | Feito | "E-mail" nos rótulos, toasts e mensagens de validação dos formulários. Mensagens de erro da API ("Email já cadastrado") ficaram, por serem contrato testado. |
| P1 | Feito | Texto honesto: conta + "de vez em quando, novidades do Flert IA". Opt-in e descadastro continuam **pendentes (dono/LGPD)** — ver E11. |
| P2 | Pendente (dono) | Só tom/clareza ("está disponível se você tiver feito… e pedir em até 12 horas"); mesma regra do FAQ. Constante única não criada (o texto do pricing tem negrito em JSX). CDC como em L1. |
| P3 | Feito | "…ficam num banco de dados gerenciado." (criptografia em repouso não verificável no código). |
| P4 | Feito | "Ver planos" no menu lateral e na folha Conta. |
| P5 | Feito | "Ex.: alguém que estudou comigo…" |
| P6 | Feito | "Ex.: a conversa parou há 3 dias… de um jeito leve…" |
| P7 | Feito | Botão "Gerar sugestões". |
| P8 | Feito | "Mudam o limite diário, a duração e as formas de pagamento." |
| P9 | Feito | "Conte o clima da conversa e o que você quer dizer…" |
| P10 | Feito | "Ex.: vi o story da viagem e quero comentar algo…" |
| P11 | Feito | "PNG, JPG, WEBP ou GIF até 10 MB". |
| P12 | Feito | Título do gate "As análises fazem parte dos planos". |
| P13 | Feito | "As análises fazem parte dos planos. Escolha um para começar." |
| P14 | Feito | "…descontada do seu limite porque as 3 devoluções de hoje já foram usadas." |
| P15 | Pendente (dono) | Links de suporte/reembolso continuam no Gmail web; trocar por `mailto:` é decisão do dono. |
| E-template | Feito | Template único em `src/lib/email/templates.ts` (boas-vindas, pagamento, campanhas), com preços de `formatBRL(PLAN_CONFIG…)`, benefícios de `getPlanBenefits()` e `SUPPORT_EMAIL` (`src/lib/support.ts`). |
| E1 | Feito | "Boas-vindas ao Flert IA, {nome}". |
| E2 | Feito | "Plano {label} ativo no Flert IA". |
| E3 | Feito | Mecanismo no lugar de "IA treinada… marcar o encontro". |
| E4 | Feito | Lista dos 3 planos com preço e limite vindos de `PLAN_CONFIG`. |
| E5 | Feito | Removido; autoria: "Você decide o que usar: copie, edite ou descarte." |
| E6 | Feito | "Para começar, abra “Analisar”…" (o item do menu se chama "Analisar"). |
| E7 | Feito | "A IA sugere 3 respostas: você decide qual usar e pode editar antes de mandar." |
| E8 | Feito | Sem urgência/competição. |
| E9 | Feito | "Você escolhe, edita e manda do seu jeito". |
| E10 | Feito | Assunto "Seu Flert IA está pronto, falta escolher um plano"; corpo proposto. |
| E11 | Pendente (dono) | Sem opt-in nem descadastro (LGPD). Não foi criado link de "sair da lista" porque a função não existe. |
| E12 | Feito | "Mensal R$ 29,90/mês · Anual R$ 147,00/ano · Vitalício R$ 297,00 (pagamento único)", via `formatBRL`. |
| E13 | Feito | "…renove antes do fim: os dias que restam são somados ao novo período. Não há renovação automática." |
| E14 | Feito | "Escolha seu plano para começar". |
| E15 | Feito | Vitalício: "Pagamento único, sem mensalidade" (de `getPlanBenefits`). |
| E16 | Feito | "Seu acesso é ilimitado e não tem data de expiração." |
| E17 | Feito | "Seu acesso vale até {dd/mm/aaaa}. Não há renovação automática." (data de `decideActivation`, fuso de Brasília). |
| E18 | Feito | "Quando travar na hora de responder, envie o print…" |
| E19 | Feito | "Dúvidas? Fale com a gente em {SUPPORT_EMAIL}." |
| E20 | Feito | Wordmark "Flert <span>IA</span>". |
| E21 | Feito | Emoji do cabeçalho removido. |
| E22 | Feito | "Olá, {nome}." |
| E23 | Feito | "Seu plano Flert IA vence em {n} dias". |
| E24 | Feito | Placeholder "Ex.: Novidades no Flert IA". |
| E25 | Feito | "e-mail" no reset de senha e nos rodapés. |
| D1 | Feito | "# Flert IA" (grafia confirmada pelo dono). |
| D2 | Feito | README: `SMTP_FROM="Flert IA <noreply@flertia.com.br>"` (o `.env.example` já estava certo). Confirmar o domínio de envio no SMTP. |
| D3 | Não aplicado | Doc técnica (fluxo de pagamento, UploadThing), não é copy para o usuário: fica para uma tarefa de docs. |
| 6 · persona | Feito | `prompts.ts`: coach de conversa brasileiro, para qualquer gênero e orientação. |
| 6 · "tem opções" | Feito | Removido; "com leveza e segurança, sem carência e sem pressão". |
| 6 · "soar como IA" | Feito | Trocado por naturalidade ("Alguém mandaria isso de verdade nessa conversa?"). A copy fala em autoria. |
| 6 · "invente / personagem" | Feito | Imagem difícil de ler: usa o que dá para ver e o contexto, não inventa detalhes, não finge reconhecer pessoas e não comenta a imagem. |

---

## 1. Landing e SEO

| # | Arquivo:linha | Texto atual | Problema | Proposta | Prior. |
|---|---|---|---|---|---|
| L1 | `src/content/faq.ts:20` | "O reembolso é disponível apenas para usuários que realizaram no máximo 1 análise e solicitaram dentro de 12 horas após a compra. Basta entrar em contato pelo suporte." | legal: pode conflitar com o direito de arrependimento de 7 dias (CDC art. 49). Também tem erro de concordância ("é disponível"). **[dono]** | Depois da validação jurídica, por exemplo: "Você pode pedir reembolso em até 7 dias após a compra pelo e-mail de suporte." Se a regra atual for mantida: "O reembolso está disponível se você tiver feito no máximo 1 análise e pedir em até 12 horas após a compra, pelo e-mail de suporte." | Alta |
| L2 | `src/content/faq.ts:23-24` | "O plano vitalício é mesmo para sempre?" / "Sim. É um pagamento único, sem mensalidade e sem data de expiração." | alegação: "Sim, para sempre" depende de o serviço continuar existindo | P: "O plano Vitalício expira?" R: "Não. É um pagamento único, sem mensalidade e sem data de expiração: o acesso continua enquanto o Flert IA estiver no ar." | Média |
| L3 | `src/content/faq.ts:14-15` | "Os planos renovam automaticamente?" / "O acesso vale pelo período pago (30 dias no Mensal, 1 ano no Anual). Você pode renovar…" | clareza: não responde "não" | "Não. O acesso vale pelo período pago (30 dias no Mensal, 1 ano no Anual) e não há cobrança automática. Se renovar antes do fim, o novo período é somado ao que ainda resta." | Média |
| L4 | `src/content/faq.ts:12` (lista) | — (faltam perguntas) | clareza: as objeções principais não estão no FAQ | Acrescentar: **"Tem plano grátis?"** → "Criar conta é grátis, mas as análises fazem parte dos planos. A demonstração desta página mostra exemplos sem precisar de conta." **"O que acontece com o meu print?"** → "A imagem e o texto são enviados para a OpenAI só para gerar as sugestões. A imagem não fica salva no Flert IA; o histórico guarda só as sugestões, e você pode apagá-las ou excluir a conta quando quiser." **"E se a IA falhar?"** → "O app mostra o erro e um botão para tentar de novo. Falhas de conexão com a IA nunca contam no seu limite; se a IA devolver uma resposta inválida, a tentativa é devolvida até 3 vezes por dia, e o aviso diz quando não for." **"O Flert IA é um app de namoro?"** → "Não. Não tem perfis nem matches. Você traz a conversa que já tem e recebe sugestões de resposta." | Média |
| L5 | `src/components/landing/LandingFooter.tsx:14-26` | Links: Suporte, Preferências de cookies | legal: não há Termos de Uso nem Política de Privacidade **[dono]** | Acrescentar "Termos de uso" e "Privacidade" quando as páginas existirem. | Alta |
| L6 | `src/components/landing/PlansSection.tsx:11` | "Crie sua conta e escolha o plano que faz sentido para você. Valores em reais." | clareza: falta o diferencial verdadeiro | "Crie sua conta e escolha o plano que faz sentido para você. Valores em reais, sem cobrança automática." | Média |
| L7 | `src/components/landing/demo-data.ts:17` | "Ousada, mas específica e respeitosa." (tom Cantada) | alegação: a instrução do tom pede "Ousado, memorável" (`prompts.ts:55`); "respeitosa" não é garantido pelo tom | "Ousada, mas feita a partir da conversa." | Média |
| L8 | `src/components/landing/HowItWorks.tsx:18` | "A IA sugere 3 respostas. Escolha a que combina com você e copie." | tom: falta a edição (autoria do usuário) | "A IA sugere 3 respostas. Escolha a que combina com você, edite se quiser e copie." | Baixa |
| L9 | `src/app/layout.tsx:21` e `:29` | "Flert IA — Seu Assistente de Conversas" | estilo: caixa de título; categoria vaga | "Flert IA — Assistente de conversa com IA" | Baixa |
| L10 | `src/app/layout.tsx:26` | `keywords: ["flert", "IA", "conversas", "inteligência artificial", "chat"]` | estilo/SEO: "flert" não é termo de busca; o Google ignora a meta keywords | `["assistente de conversa", "responder mensagem", "responder story", "flerte", "IA"]`, ou remover | Baixa |
| L11 | `src/app/page.tsx:14-16` | "Flert IA — 3 sugestões de resposta em 7 tons" / descrição igual ao Hero | Ok | Manter. Opcional: "Flert IA — Assistente de conversa: 3 sugestões em 7 tons" | Baixa |
| L12 | `src/components/consent/ConsentBanner.tsx:37-38` | "…Você pode mudar isso depois em Configurações." | clareza: visitante sem conta não tem Configurações; o rodapé também reabre o banner | "…Você pode mudar isso depois em "Preferências de cookies", no rodapé." | Baixa |
| L13 | `src/app/layout.tsx:70-71` | (Vercel Analytics/Speed Insights carregam sem consentimento) | legal: o banner só menciona o Pixel. Confirmar se é sem cookie e citar na Política de Privacidade **[dono]** | Na Política: "Usamos medição de audiência da Vercel, sem cookies de marketing." (só se for confirmado) | Média |
| — | `Hero.tsx:70,73`, `FinalCta.tsx:13,16`, `TonesShowcase.tsx:9-10`, `PlanCard.tsx:20-24,79`, `InteractiveDemo`/`DEMO_LABEL` (`demo-data.ts:126`), `LandingHeader.tsx` | — | Ok, de acordo com a voz | Manter. São as referências da voz. | — |

## 2. Auth

| # | Arquivo:linha | Texto atual | Problema | Proposta | Prior. |
|---|---|---|---|---|---|
| A1 | `src/app/auth/register/page.tsx:77` | "Crie sua conta para começar a usar o Flert IA." | clareza: dá a entender que dá para usar sem pagar | "Crie sua conta. As análises fazem parte dos planos, que você escolhe em seguida." | Média |
| A2 | `src/app/auth/register/page.tsx` (formulário) | — (sem aceite de termos nem confirmação de idade) | legal **[dono]** | Quando houver: "Tenho 18 anos ou mais e li os [Termos de uso] e a [Política de privacidade]." | Alta |
| A3 | `src/app/auth/login/page.tsx:87` e `:69` | "Bem-vindo de volta." | tom: só no masculino | Título: "Que bom te ver de novo"; toast: "Login feito." | Baixa |
| A4 | `register/page.tsx:76`, `login/page.tsx:87`, `forgot-password/page.tsx:42`, `reset-password/page.tsx:84` | "Criar conta." / "Recuperar senha." / "Nova senha." | estilo: o resto do app não usa ponto final em títulos | Sem ponto final. | Baixa |
| A5 | `login/page.tsx:104`, `register/page.tsx:106`, `forgot-password/page.tsx:34,55,57,67` | "Email", "Email enviado.", "Erro ao enviar email." | estilo: o app usa "e-mail" | "E-mail", "E-mail enviado", "Não foi possível enviar o e-mail. Tente novamente." | Baixa |
| — | `AuthShell.tsx:12-14`, `GoogleButton.tsx:24`, `reset-password/page.tsx:37-46,93-97` | — | Ok | Manter. `AuthShell.tsx:14` é referência da voz. | — |

## 3. App (área logada) e mensagens da API

| # | Arquivo:linha | Texto atual | Problema | Proposta | Prior. |
|---|---|---|---|---|---|
| P1 | `src/app/(dashboard)/settings/page.tsx:146-148` | "Enviamos e-mails apenas sobre a sua conta: boas-vindas, confirmação de pagamento, redefinição de senha, exclusão de conta e avisos sobre o seu plano…" | exatidão/legal: o admin manda "free_upsell" e campanhas com texto livre (`admin/email/route.ts:162-173`) sem opt-in nem descadastro **[dono]** | Se as campanhas continuarem: "Enviamos e-mails sobre a sua conta (boas-vindas, pagamento, senha, exclusão e avisos do plano) e, se você autorizar, novidades do Flert IA. Você pode sair da lista pelo link no fim de cada e-mail." Se não: manter o texto e tirar as campanhas promocionais do admin. | Alta |
| P2 | `src/app/(dashboard)/pricing/page.tsx:166` | "O reembolso é disponível exclusivamente para usuários que realizaram no máximo 1 análise… Fora dessas condições, não haverá reembolso." | legal (ver L1) **[dono]** | Mesmo texto final de L1, com a mesma regra nos dois lugares (de preferência numa constante única). | Alta |
| P3 | `src/app/(dashboard)/settings/page.tsx:32` | "Os dados trafegam por HTTPS e ficam em banco de dados com criptografia em repouso do provedor." | alegação: a criptografia em repouso depende do provedor do banco, que o código não mostra | Confirmar com o provedor. Se não der: "Os dados trafegam por HTTPS e ficam num banco de dados gerenciado." | Média |
| P4 | `src/components/app/AccountSheet.tsx:76-77`, `src/components/app/AppSidebar.tsx:78-79` | "Seja Premium" / "Compare planos e limites" | exatidão: não existe plano "Premium" (Mensal, Anual, Vitalício; `plans.ts:32-55`) | "Ver planos" / "Compare planos e limites" | Média |
| P5 | `src/app/(dashboard)/analyze/page.tsx:394` | "Ex: menina que estudou comigo, gosta de viajar e tem bom humor. Quero começar uma conversa leve..." | tom: gênero fixo; "menina" pode soar como menor de idade | "Ex.: alguém que estudou comigo, gosta de viajar e tem bom humor. Quero começar uma conversa leve…" | Média |
| P6 | `src/app/(dashboard)/analyze/page.tsx:423` | "Ex: ela parou de responder depois de 3 dias, a última mensagem foi sobre filmes. Quero retomar sem parecer desesperado..." | tom: gênero fixo; reforça ansiedade | "Ex.: a conversa parou há 3 dias e a última mensagem foi sobre filmes. Quero retomar de um jeito leve…" | Média |
| P7 | `src/app/(dashboard)/analyze/page.tsx:428` | Botão "Resolver situação" | alegação: promete resolver | "Gerar sugestões" | Média |
| P8 | `src/app/(dashboard)/pricing/page.tsx:93` | "Todos os planos incluem os mesmos recursos — muda só o limite diário de análises." | exatidão: mudam também a duração e as formas de pagamento | "Todos os planos têm os mesmos recursos. Mudam o limite diário, a duração e as formas de pagamento." | Média |
| P9 | `src/app/(dashboard)/analyze/page.tsx:356` | "Fale sobre a pessoa, o que você quer alcançar, o clima da conversa..." | tom: "alcançar" trata a conversa como meta | "Conte o clima da conversa e o que você quer dizer…" | Baixa |
| P10 | `src/app/(dashboard)/analyze/page.tsx:407` | "Ex: vi o story dela e quero comentar algo..." | tom: gênero fixo | "Ex.: vi o story da viagem e quero comentar algo…" | Baixa |
| P11 | `src/components/analyze/UploadDropzone.tsx:83` | "PNG, JPG até 10 MB" | exatidão: o servidor também aceita WEBP e GIF (`run-analysis.ts:15`) | "PNG, JPG, WEBP ou GIF até 10 MB" | Baixa |
| P12 | `src/components/analyze/AnalyzeGate.tsx:24` | "Recurso exclusivo para assinantes" | tom: "assinante" sugere cobrança recorrente, e não há renovação automática | "As análises fazem parte dos planos" | Baixa |
| P13 | `src/lib/ai/run-analysis.ts:61` | "Acesso restrito. Assine um plano para usar as análises." | tom: soa como bloqueio | "As análises fazem parte dos planos. Escolha um para começar." | Baixa |
| P14 | `src/lib/ai/run-analysis.ts:42-43` | "…Esta tentativa foi descontada do seu limite, pois o número diário de tentativas devolvidas já foi atingido." | clareza: frase longa, "pois" formal | "A IA não conseguiu gerar sugestões válidas para este conteúdo. Esta tentativa foi descontada do seu limite porque as 3 devoluções de hoje já foram usadas." | Baixa |
| P15 | `pricing/page.tsx:168`, `src/components/app/nav-items.ts:25` | Links de suporte e reembolso abrem o Gmail web | clareza: quem não usa Gmail cai num login do Google (já anotado em `docs/ux-review.md:84`) | `mailto:` com assunto. É mudança de link, não de texto: decidir na Tarefa 8. | Baixa |
| — | `run-analysis.ts:41,50,60,72`, `ResultsPanel.tsx:49,59,76`, `AnalyzeGate.tsx:23-38`, `UsageMeter.tsx`, `faisca-loader.tsx:6`, `dashboard/page.tsx:55-65,131,164,182`, `history/page.tsx:185-205,285-286`, `settings/page.tsx:36,40,44,199-217`, `(dashboard)/error.tsx`, `error.tsx`, `not-found.tsx`, `analyze/page.tsx:338-345,355,364,376,383` | — | Ok: factual, honesto, sem promessa | Manter. `run-analysis.ts:41` e `settings/page.tsx:36` são referências da voz. | — |

## 4. E-mails

Os três e-mails de boas-vindas existem em versões diferentes (Google em `auth.ts`, cadastro por e-mail
em `register/route.ts`, pagamento no webhook). **Proposta estrutural (Média):** um template só, com os
benefícios vindos de `getPlanBenefits()`, os preços de `formatBRL(PLAN_CONFIG…)` e o e-mail de suporte de
`SUPPORT_EMAIL`. Textos completos em `plano-lancamento.md` §6.

| # | Arquivo:linha | Texto atual | Problema | Proposta | Prior. |
|---|---|---|---|---|---|
| E1 | `src/app/api/auth/register/route.ts:53`, `src/lib/auth.ts:81` | Assunto: "Bem-vindo ao Flert IA, {nome}! Sua vida amorosa nunca mais será a mesma 💘" | alegação (resultado) + emoji + gênero | "Boas-vindas ao Flert IA, {nome}" | Alta |
| E2 | `src/app/api/webhooks/abacatepay/route.ts:36` | Assunto: "Bem-vindo ao Flert IA {label}! Sua vida amorosa nunca mais será a mesma 💘" | igual a E1 | "Plano {label} ativo no Flert IA" | Alta |
| E3 | `register/route.ts:76`, `auth.ts:94` | "…uma IA treinada pra te ajudar a se sair bem em qualquer conversa — do primeiro contato até marcar o encontro." | alegação: não há treino próprio (é um modelo da OpenAI com instruções, `generate.ts:23`); "marcar o encontro" é resultado | "Com um plano ativo, você envia o print ou descreve a situação, escolhe o tom e recebe 3 sugestões para copiar ou editar." | Alta |
| E4 | `src/lib/auth.ts:102` | "Até 50 análises por dia com IA avançada" | exatidão: o Vitalício é ilimitado e o Mensal tem 30; "IA avançada" é vago | Listar os planos: "Mensal: 30 análises por dia · Anual: 50 · Vitalício: ilimitadas" (de `PLAN_CONFIG`) | Alta |
| E5 | `src/lib/auth.ts:104` | "Respostas que parecem humanas, não geradas por IA" | alegação/ética: vende disfarçar a IA | "Sugestões para você editar e mandar do seu jeito" | Alta |
| E6 | `src/app/api/webhooks/abacatepay/route.ts:66` | "A partir de agora você tem tudo que precisa para transformar qualquer conversa em conexão real." | alegação (resultado) | "Para começar, abra "Analisar conversa", envie um print e escolha o tom." | Alta |
| E7 | `src/app/api/webhooks/abacatepay/route.ts:79` | "…A IA vai analisar o contexto e gerar exatamente o que você precisa dizer — com o tom certo, na hora certa." | alegação (garantia) | "A IA sugere 3 respostas no tom que você escolher. Você decide qual usar e pode editar antes de mandar." | Alta |
| E8 | `src/app/api/admin/email/route.ts:52` | "Enquanto você está sem responder, alguém mais está usando a IA pra sair na frente. Não deixa a conversa esfriar." | tom: medo, competição e pressão | "Quando bater a dúvida sobre o que responder, envie o print e veja 3 sugestões no tom que você escolher." | Alta |
| E9 | `src/app/api/admin/email/route.ts:57` | "Respostas que parecem suas, não de IA" | igual a E5 | "Você escolhe, edita e manda do seu jeito" | Alta |
| E10 | `src/app/api/admin/email/route.ts:49` e `:163` | "Não acha que está na hora de destravar suas conversas?" / assunto com 💘 | tom: "destravar", pergunta isca, emoji | Assunto: "Seu Flert IA está pronto, falta escolher um plano". Corpo: "Você criou sua conta no Flert IA, mas ainda não escolheu um plano. As análises começam assim que você escolher." | Alta |
| E11 | `src/app/api/admin/email/route.ts` (todos os templates, `baseWrapper` :17-40) | — (sem link de descadastro, sem registro de consentimento) | legal/LGPD **[dono]** | Rodapé: "Você recebe este e-mail porque aceitou receber novidades do Flert IA. [Sair da lista]". Só enviar "free_upsell" e campanhas para quem aceitou. | Alta |
| E12 | `src/app/api/admin/email/route.ts:66` | "Planos a partir de R$ 29,90/mês" | exatidão: preço fixo no código; o Anual equivale a ≈ R$ 12,25/mês, então "a partir de R$ 29,90/mês" engana | "Mensal R$ 29,90 · Anual R$ 147,00 · Vitalício R$ 297,00 (pagamento único)", vindo de `formatBRL(PLAN_CONFIG…)` | Média |
| E13 | `src/app/api/admin/email/route.ts:80` | "Renove agora e continue tendo as respostas certas na hora certa. Não deixa suas conversas voltarem pro modo tentativa e erro." | alegação + pressão | "Para continuar usando as análises, renove antes do fim: os dias que restam são somados ao novo período." | Média |
| E14 | `src/lib/auth.ts:100` | "Desbloqueie o potencial completo" | tom: jargão de venda | "Escolha seu plano para começar" (como em `register/route.ts:85`) | Média |
| E15 | `src/lib/auth.ts:105` | "Plano Vitalício — pague uma vez, use para sempre" | alegação ("para sempre") | "Plano Vitalício — pagamento único, sem mensalidade" (como em `register/route.ts:91`) | Média |
| E16 | `src/app/api/webhooks/abacatepay/route.ts:65` | "Você agora tem acesso vitalício e ilimitado — nunca mais se preocupe com limites." | alegação: ainda vale o limite de rajada (10/min, `run-analysis.ts:48`) | "Seu acesso é ilimitado e não tem data de expiração." | Média |
| E17 | `src/app/api/webhooks/abacatepay/route.ts:58-68` | — (Mensal/Anual sem data de expiração nem aviso de "sem renovação automática") | clareza | "Seu acesso vale até {dd/mm/aaaa}. Não há renovação automática." | Média |
| E18 | `register/route.ts:79`, `auth.ts:97` | "Chega de travar na hora de responder, de deixar a conversa esfriar ou de mandar mensagem e se arrepender depois." | tom: lista de dores com promessa implícita ("chega de") | "Quando travar na hora de responder, envie o print e veja 3 sugestões no tom que você escolher." | Média |
| E19 | `register/route.ts:105`, `webhooks/abacatepay/route.ts:98` | "— respondemos rápido." | alegação: não há SLA definido | "Dúvidas? Fale com a gente em {SUPPORT_EMAIL}." | Média |
| E20 | `register/route.ts:64`, `auth.ts:88`, `webhooks/abacatepay/route.ts:48`, `admin/email/route.ts:26` | Título "Flert<span>.</span>IA" | estilo/marca: grafia diferente da UI ("Flert IA", `Logo.tsx:67`) | "Flert IA" com "IA" em destaque | Média |
| E21 | `register/route.ts:62`, `auth.ts:87`, `webhooks/abacatepay/route.ts:46`, `admin/email/route.ts:24` | Emoji 💘 no cabeçalho | estilo: a política é não usar emoji em e-mail | Remover (usar o símbolo da marca, se houver imagem) | Média |
| E22 | `auth.ts:92`, `register/route.ts:73`, `admin/email/route.ts:46,100` / `webhooks/abacatepay/route.ts:59` / `admin/email/route.ts:74` | "E aí, {nome}! 👋" / "Olá, {nome}! 🎉" / "Olá, {nome}! ⚡" | estilo: emoji e mistura de registros | "Olá, {nome}." | Baixa |
| E23 | `src/app/api/admin/email/route.ts:169` | Assunto "Seu plano expira em {n} dias ⚡" | estilo: emoji | "Seu plano Flert IA vence em {n} dias" | Baixa |
| E24 | `src/app/admin/page.tsx:939` | Placeholder "Ex: Novidades no Flert IA 🚀" | estilo: incentiva emoji em assunto | "Ex.: Novidades no Flert IA" | Baixa |
| E25 | `forgot-password/route.ts:66`; rodapés `register/route.ts:108`, `webhooks/abacatepay/route.ts:101`, `auth.ts:114` | "ignore este email" / "Você recebeu este email…" | estilo: "e-mail" | "e-mail" | Baixa |
| — | `src/app/api/profile/route.ts:94-114` (exclusão de conta), `forgot-password/route.ts:59-65` | — | Ok: claro, honesto sobre o que fica com processadores | Manter. Referência para o tom de e-mail transacional. | — |

## 5. Documentação e identidade

| # | Arquivo:linha | Texto atual | Problema | Proposta | Prior. |
|---|---|---|---|---|---|
| D1 | `README.md:1` | "# Flerte IA 🔥" | marca: "Flerte" ≠ "Flert" (UI, domínio flertia.com.br) **[dono]** | "# Flert IA" (se a grafia for confirmada) | Média |
| D2 | `README.md:152` | `SMTP_FROM="Flerte IA <noreply@flerteia.com>"` | marca: se for copiado para produção, o remetente aparece como "Flerte IA", num domínio diferente **[dono]** | `SMTP_FROM="Flert IA <noreply@flertia.com.br>"`, depois de confirmar o domínio de envio | Média |
| D3 | `README.md:204, 230, 232` | Fluxo "Pagar R$29,90" → LIFETIME; UploadThing; "Engraçado/Flertando" | exatidão: documentação técnica desatualizada (o código envia base64 e não usa UploadThing; os planos estão em `plans.ts`) | Atualizar numa tarefa de docs (não é copy para o usuário) | Baixa |

## 6. Fora da copy, mas afeta o marketing (decisão do dono, não é da Tarefa 8)

| Arquivo:linha | O que é | Por que importa |
|---|---|---|
| `src/lib/ai/prompts.ts:5, 60` | Persona: "homem brasileiro, 28 anos… muito bem-sucedido com mulheres" | O público real fica restrito a homens falando com mulheres, e a copy neutra pode prometer mais do que o produto entrega. |
| `src/lib/ai/prompts.ts:28, 83` | "como alguém que tem opções e não está precisando" | É a moldura mais próxima de "pickup artist" no produto. |
| `src/lib/ai/prompts.ts:46, 90` e `:149-156` | "Nenhuma pode soar como foi escrita por IA" | Sustenta as alegações "parecem humanas" dos e-mails. A marca deve falar em autoria ("você edita"), não em disfarce. |
| `src/lib/ai/prompts.ts:47` | "Se não reconhecer, invente uma abordagem… Nunca quebre o personagem." | Quando não entende o print, a IA não avisa. Isso contrasta com a promessa de "erro honesto", que vale para falhas técnicas, não para um print mal lido. Não alegar "a IA sempre entende o seu print". |
