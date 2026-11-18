# Voz da marca — Flert IA

Tarefa 7. Perfil de voz derivado da copy que já existe no repositório (landing, app, FAQ, e-mails) e
das regras do produto em `src/lib/plans.ts` e `src/lib/ai/`. Nada aqui é inventado: quando um fato
não está no código, o texto diz "não verificado".

Fontes usadas (as mais fortes primeiro): `src/components/landing/**`, `src/components/auth/AuthShell.tsx`,
`src/content/faq.ts`, `src/app/(dashboard)/**`, `src/lib/ai/run-analysis.ts` (mensagens de erro),
`src/app/(dashboard)/settings/page.tsx` (textos de privacidade), os e-mails em `src/lib/auth.ts`,
`src/app/api/auth/register/route.ts`, `src/app/api/webhooks/abacatepay/route.ts`,
`src/app/api/admin/email/route.ts`, `src/app/api/profile/route.ts` e `docs/redesign-faisca.md`.

O repositório tem **duas vozes**:

- **Voz nova (Faísca, Tarefa 4):** landing, auth, app. Factual, curta, mostra o mecanismo ("3 respostas em
  7 tons — você escolhe e copia"). Esta é a voz da marca.
- **Voz antiga (e-mails):** promessa de resultado, urgência, emoji ("Sua vida amorosa nunca mais será a
  mesma 💘"). Ela contradiz a voz nova e as regras do produto. A auditoria (`auditoria-copy.md`) lista
  cada trecho para reescrever.

---

## VOICE PROFILE

```
marca: Flert IA (grafia na UI e no logo; README usa "Flerte IA" — decisão do dono)
idioma: pt-BR, você, informal sem gíria forçada
categoria: assistente de conversa com IA (NÃO é app de namoro)
promessa central: "A resposta certa, no tom certo." + mecanismo: print ou situação → tom → 3 sugestões → você escolhe, edita e copia
ritmo: frases curtas (6–16 palavras), uma ideia por frase; listas de 3
compressão: alta; mecanismo e números do produto (3 sugestões, 7 tons, limites diários, preços) no lugar de adjetivos
afirmações: só o que o código faz; nunca resultado (match, encontro, resposta da outra pessoa)
números: algarismos para quantidades do produto ("3 sugestões", "7 tons", "30 análises por dia"); preços "R$ 29,90"
perguntas: raras; só como título de seção ou FAQ; nunca isca ("Cansado de ficar no vácuo?")
parênteses: só para precisar ("(opcional)", "(horário de Brasília)")
emoji: zero em landing, app, erros e assuntos de e-mail; ver política abaixo
nunca faz: promessa de resultado, depoimento, contagem de usuários, nota, "%", urgência falsa, culpa, comparação com "os outros", tratar a outra pessoa como alvo
```

---

## 1. Personalidade

| Traço | É | Não é |
|---|---|---|
| **Direto** | Diz o que o produto faz em uma frase: "Envie o print ou descreva a situação. A IA sugere 3 respostas em 7 tons — você escolhe e copia." (`Hero.tsx:73`) | Rodeio, "revolucionário", "potencial completo", "IA avançada". |
| **Do seu lado, sem julgar** | Fala com quem travou numa conversa como um amigo que ajuda a pensar: "Você decide o que usar: copie, edite ou descarte." (`AuthShell.tsx:14`) | Coach de sedução, "alfa", "sair na frente dos outros", "nunca mais fique sem resposta". |
| **Honesto** | Diz o limite e o erro com a mesma clareza da venda: "esta tentativa não foi descontada do seu limite" (`run-analysis.ts:41`); "As imagens não ficam salvas no Flert IA" (`settings/page.tsx:36`). | Garantia, "ninguém vai perceber que é IA", "vida amorosa nunca mais será a mesma". |
| **Leve** | Bom humor nos exemplos ("Pão torto é só pão com personalidade." `demo-data.ts:56`). | Piada sobre a outra pessoa, ironia com o usuário, emoji como pontuação. |
| **Respeitoso** | A outra pessoa é alguém com quem se conversa; o usuário é o autor da mensagem. | "Conquistar", "pegar", "destravar", "fazer ela...", pressão, insistência. |

## 2. Tom por contexto

| Contexto | Tom | Exemplo de referência (real) | Regra |
|---|---|---|---|
| **Landing** | Factual, confiante, curto. Mostra o fluxo e o preço. | "Três passos, sem complicação" (`HowItWorks.tsx:24`) | Todo benefício precisa de um fato no código. Exemplos sempre com selo "Ilustração"/"Exemplo ilustrativo". |
| **Microcopy do app** | Instrução em 1 linha, verbo no imperativo. | "Envie o print e a IA gera 3 respostas no seu tom." (`analyze/page.tsx:355`) | Rótulo de botão = ação concreta ("Gerar sugestões", "Copiar sugestão 1"). Nada de "Resolver". |
| **Erros** | Calmo, diz o que houve, o que fazer e se o limite foi afetado. | "A IA não conseguiu gerar sugestões agora. Tente novamente — esta tentativa não foi descontada do seu limite." (`run-analysis.ts:41`) | Nunca culpar o usuário; nunca esconder cobrança de cota; sempre oferecer o próximo passo. |
| **E-mail transacional** | Claro, cordial, sem venda forçada. | E-mail de exclusão de conta (`api/profile/route.ts:100-114`): diz o que foi apagado e o que fica com processadores. | Assunto sem emoji e sem promessa. Um CTA. Benefícios vindos de `getPlanBenefits()`. |
| **E-mail de ativação/campanha** | Útil: ensina um uso real do app. | (Não existe ainda na voz nova — ver `plano-lancamento.md`) | Só para quem consentiu (ver auditoria: hoje não há opt-in nem descadastro). |
| **Social** | Mais solto, didático, mostra a tela. | Cenários da demo (`demo-data.ts`) | Exemplos fictícios rotulados; nunca "olha o que ela respondeu". |
| **Suporte** | Pessoal, objetivo, com prazo apenas se for cumprido. | "Se o problema continuar, fale com o suporte." (`(dashboard)/error.tsx:25`) | Não prometer "respondemos rápido" sem SLA definido. |

## 3. Vocabulário

### Preferir

- **conversa, mensagem, resposta, sugestão, tom, print, story, situação**
- **"3 sugestões"**, **"7 tons"**, **"você escolhe, edita e copia"**
- **"ponto de partida"**, **"do seu jeito"**, **"no seu tom"**
- **"análise"** (unidade do limite diário), **"limite diário"**, **"reinicia à meia-noite (horário de Brasília)"**
- **"pagamento único"** (Vitalício), **"acesso por 30 dias / 1 ano"** (Mensal / Anual)
- **"a outra pessoa"**, **"quem você quer responder"** (neutro em gênero)
- Nomes dos tons exatamente como em `tones.ts`: Flertando, Engraçado, Casual, Afiado, Sério, Cantada, Stories.

### Evitar / banido

| Banido | Por quê | Use |
|---|---|---|
| "vida amorosa nunca mais será a mesma", "transformar qualquer conversa em conexão real", "marcar o encontro" | Promessa de resultado | "3 sugestões para a sua próxima conversa" |
| "conquistar", "pegar", "destravar suas conversas", "sair na frente", "alfa", "jogo", "técnica infalível" | Moldura de "pickup artist", competição, pressão | "responder no tom certo" |
| "IA treinada", "IA avançada", "nossa IA exclusiva" | Não verificado: o app usa um modelo da OpenAI (`gpt-4o` por padrão, `generate.ts:23`) com instruções; não há treino próprio | "A IA sugere…" |
| "parecem humanas, não geradas por IA", "ninguém vai perceber", "respostas que parecem suas" | Incentiva enganar a outra pessoa; não é verificável | "Você edita e manda do seu jeito." |
| "exatamente o que você precisa dizer", "respostas certeiras", "a resposta perfeita" | Garantia de acerto | "3 opções para você escolher" |
| "grátis", "teste grátis", "comece de graça" | Não existe: sem plano = 0 análises (`plans.ts:118-119`) | "Criar conta" + "escolha um plano" |
| "mais popular", "melhor escolha", "mais usado", "X mil usuários", notas, "%" | Sem dado (já barrado em `tests/config/content-guard.test.ts`) | Selo factual: "Pagamento único" (`plans.ts:61`) |
| "para sempre" (Vitalício) | Depende da continuidade do serviço | "pagamento único, sem mensalidade e sem data de expiração" |
| "respondemos rápido" | SLA não definido | "Fale com a gente em [e-mail de suporte]" |
| "Premium" como nome de plano | Os planos são Mensal, Anual e Vitalício (`plans.ts:32-55`); PREMIUM é só o ID interno | "Ver planos" |
| "ela", "menina", "mulheres" como padrão | Exclui parte do público; ver decisão sobre o prompt | "a pessoa", "quem você quer responder" |
| "Solteiro?", "Cansado de levar vácuo?" | Política de anúncios da Meta sobre atributos pessoais (ver `plano-lancamento.md`) | "Travou na resposta? Envie o print." |

## 4. Regras de estilo

- **Tratamento:** sempre "você". Nada de "tu", "mano", "parça". "Pra" só em social e em exemplos de mensagem; na UI e nos e-mails, "para".
- **Gênero:** neutro sempre que possível ("Que bom te ver de novo" em vez de "Bem-vindo de volta"; "Boas-vindas ao Flert IA").
- **Marca:** "Flert IA" — F e I-A maiúsculos, com espaço, sem ponto ("Flert.IA" nos e-mails está errado). O wordmark destaca "IA" (`Logo.tsx:67`).
- **Capitalização:** frase normal em títulos e botões ("Criar conta", "Escolha seu plano"). Caixa alta só no estilo visual de *eyebrow* (CSS `uppercase`), nunca digitada.
- **Pontuação em títulos:** a UI de auth usa ponto final ("Criar conta."); o resto do app não. Decisão: **sem ponto final em títulos**, para consistência (registrado na auditoria, prioridade baixa).
- **Travessão:** "—" com espaços para explicar ("3 respostas em 7 tons — você escolhe e copia"). Máximo um por frase.
- **Números:** algarismos para quantidades do produto (3, 7, 30, 50, 10 MB, 7 dias). Por extenso só em início de frase ou expressões ("Três passos").
- **Preços:** sempre com `formatBRL()`: "R$ 29,90", "R$ 147,00", "R$ 297,00" (espaço depois de "R$", vírgula decimal, ponto de milhar). Nunca escrever preço à mão em template; puxar de `PLAN_CONFIG`. Período: "R$ 29,90/mês", "R$ 147,00/ano", "R$ 297,00 · pagamento único".
- **"E-mail"** com hífen (o app usa assim; auth e e-mails às vezes escrevem "Email" — padronizar).
- **Horário:** "meia-noite (horário de Brasília)".
- **Emojis:**
  - Landing, app, erros, assuntos de e-mail: **nenhum** (a Tarefa 4 removeu os emojis dos tons e o "burst" do auth).
  - Corpo de e-mail: no máximo 0; ícones visuais vêm do layout, não de emoji.
  - Social: até 1 por post, nunca 💘/🔥 como promessa; nunca no lugar de palavra.
  - Sugestões da IA: regra do prompt — só se a conversa já tiver muito emoji (`prompts.ts:44`). Não é voz da marca.
  - O README usa 🔥 no título; é doc técnico, mas decidir junto com a grafia do nome.

## 5. Faça / não faça (reescritas a partir da copy real)

| Arquivo:linha | Atual | Proposta | Motivo |
|---|---|---|---|
| `src/app/api/auth/register/route.ts:53` (também `src/lib/auth.ts:81`) | "Bem-vindo ao Flert IA, {nome}! Sua vida amorosa nunca mais será a mesma 💘" | "Boas-vindas ao Flert IA, {nome}" | Promessa de resultado + emoji no assunto. |
| `src/app/api/auth/register/route.ts:76` | "…uma IA treinada pra te ajudar a se sair bem em qualquer conversa — do primeiro contato até marcar o encontro." | "Sua conta foi criada. Com um plano ativo, você envia o print ou descreve a situação, escolhe o tom e recebe 3 sugestões para copiar ou editar." | "IA treinada" não verificado; "marcar o encontro" é resultado. |
| `src/app/api/webhooks/abacatepay/route.ts:79` | "A IA vai analisar o contexto e gerar exatamente o que você precisa dizer — com o tom certo, na hora certa." | "Envie um print ou descreva a situação: a IA sugere 3 respostas no tom que você escolher. Você decide qual usar e pode editar antes de mandar." | "Exatamente o que precisa dizer" é garantia. |
| `src/app/api/admin/email/route.ts:52` | "Enquanto você está sem responder, alguém mais está usando a IA pra sair na frente. Não deixa a conversa esfriar." | "Quando bater a dúvida sobre o que responder, é só enviar o print: você recebe 3 sugestões em segundos e escolhe a que tem a ver com você." | Urgência por medo/competição. "Em segundos" só se medido; senão, cortar. |
| `src/app/api/admin/email/route.ts:57` | "Respostas que parecem suas, não de IA" | "Sugestões para você editar e mandar do seu jeito" | Moldura de disfarce. |
| `src/content/faq.ts:24` | "Sim. É um pagamento único, sem mensalidade e sem data de expiração." | "É um pagamento único, sem mensalidade e sem data de expiração: o acesso não vence enquanto o Flert IA estiver no ar." | "Sim, para sempre" é mais do que a empresa pode garantir. |
| `src/app/(dashboard)/analyze/page.tsx:423` | "Ex: ela parou de responder depois de 3 dias… Quero retomar sem parecer desesperado..." | "Ex.: a conversa parou há 3 dias, a última mensagem foi sobre filmes. Quero retomar de um jeito leve." | Gênero fixo; "desesperado" reforça ansiedade. |
| `src/components/landing/Hero.tsx:73` | "Envie o print ou descreva a situação. A IA sugere 3 respostas em 7 tons — você escolhe e copia." | **Manter.** É o padrão da voz. | Mecanismo + controle do usuário. |
| `src/components/auth/AuthShell.tsx:14` | "Você decide o que usar: copie, edite ou descarte." | **Manter** e reutilizar em e-mails e social. | Autoria do usuário. |

## 6. Checklist para qualquer copy nova

Responda "sim" a todas antes de publicar:

1. **Fato:** cada afirmação sobre o produto existe no código hoje (fluxo, número, preço, limite)? Preço e limite vêm de `plans.ts`?
2. **Sem resultado:** não promete match, encontro, resposta da outra pessoa, relacionamento nem "taxa de sucesso"?
3. **Sem prova inventada:** nenhum depoimento, contagem de usuários, nota, %, logo de imprensa, "mais popular"?
4. **Grátis:** não sugere uso gratuito? (Sem plano = 0 análises.)
5. **Autoria:** deixa claro que o usuário escolhe/edita/envia? Não vende "disfarçar que é IA"?
6. **Respeito:** a outra pessoa não é alvo, prêmio ou obstáculo? Sem pressão, insistência, culpa, "pickup"?
7. **Público:** fala com adultos (18+), não usa linguagem/estética infantil ou escolar, não assume gênero?
8. **Privacidade:** se fala de print, diz só o verificado (imagem enviada à OpenAI para gerar, não salva no Flert IA; histórico guarda só sugestões)? Lembra que o print tem mensagens de outra pessoa?
9. **Exemplos:** todo exemplo de conversa é fictício e rotulado ("Exemplo ilustrativo")?
10. **Forma:** "você", "Flert IA", "R$ 29,90", "e-mail", sem emoji (exceto social, máx. 1), um CTA por peça?
11. **Anúncio:** não pergunta nem sugere estado civil, orientação, aparência ou solidão de quem lê?
12. **Erro/limite:** se fala de falha, diz se a tentativa foi ou não descontada?
