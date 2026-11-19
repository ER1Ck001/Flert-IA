# Plano de lançamento — Flert IA

Tarefa 7. Usa a voz de `brand-voice.md` e os fatos de `posicionamento.md`. **Pré-requisitos antes de
investir em mídia** estão na seção 0 — sem eles, anúncio pago aumenta risco jurídico e não dá para medir.

Todos os exemplos de conversa abaixo são **fictícios** e devem aparecer com o selo
"Exemplo ilustrativo". Nada de "olha o que ela respondeu", prints reais de terceiros ou resultado.

---

## 0. Pré-requisitos (bloqueiam o lançamento pago)

| # | Item | Por quê | Dono |
|---|---|---|---|
| P1 | Publicar **Termos de Uso** e **Política de Privacidade** e linkar no rodapé e no cadastro | Não existem (`docs/ux-review.md:79`); o print tem dados de terceiros e é processado pela OpenAI | Dono + jurídico |
| P2 | Confirmação de **18+** no cadastro | Produto de flerte; anúncios serão 18+; hoje não há verificação | Dono (mudança de produto) |
| P3 | **Feito (Tarefa 10):** política de reembolso agora é integral em até 7 dias (art. 49 do CDC), pedido manual por e-mail | Risco de reclamação/Procon ao escalar vendas | Jurídico |
| P4 | Opt-in de e-mail de marketing + link de descadastro | `admin/email/route.ts` envia "free_upsell" e campanhas livres sem descadastro, e `settings/page.tsx:146` diz "Enviamos e-mails apenas sobre a sua conta" | Dono + dev |
| P5 | Reescrever os e-mails atuais (auditoria) | Promessas de resultado em todo e-mail de boas-vindas | Tarefa 8 |
| P6 | Instrumentar conversões (seção 8) | Hoje o Pixel só envia `PageView` | Dev |
| P7 | Decidir sobre o prompt "homem… bem-sucedido com mulheres" | Define o público real e o risco de moldura "pickup" | Dono |

## 1. Objetivo e mensagem

- **Objetivo (4 semanas):** gerar cadastros e primeiras compras com custo conhecido, e aprender qual
  modo/tom os pagantes mais usam. Não há meta numérica: não existe linha de base. Defina-a no fim da semana 1.
- **Mensagem única:** *A resposta certa, no tom certo. Envie o print ou descreva a situação: a IA sugere 3
  respostas em 7 tons — você escolhe, edita e manda.*
- **CTA único:** "Criar conta" → landing `/` (a landing já explica preço; o cadastro leva ao `/dashboard`,
  não ao checkout do plano clicado — `docs/ux-review.md:80`).

## 2. Canais

| Canal | Encaixe | Uso |
|---|---|---|
| **Instagram Reels + Stories** | Alto: o produto nasce de prints de story/DM | Demonstração de tela, carrossel "mesma mensagem, 7 tons". Perfil da marca: **handle a definir pelo dono**. |
| **TikTok** | Alto: formato "me ajuda a responder" | Mesmos roteiros, legenda nativa. Conferir regras do TikTok para anúncios de relacionamento antes de pagar mídia (não verificado). |
| **YouTube Shorts** | Médio | Reaproveitar os vídeos. |
| **Meta Ads (Instagram/Facebook)** | Médio, com cuidado | Só após P1–P6. Ver seção 7. |
| **E-mail** | Alto para ativação | Sequência da seção 6 (transacional + opt-in). |
| **Busca orgânica (SEO)** | Baixo no curto prazo | Só a landing é indexável (`src/app/sitemap.ts`). Ajustar título/descrição (auditoria). |
| Fora | Grupos/fóruns com spam, influenciadores "de sedução", compra de seguidores | Contra a voz e as regras. |

Parcerias com criadores: só com roteiro aprovado, exemplo fictício rotulado, `#publi` e sem promessa
de resultado.

## 3. Calendário de 4 semanas

Cadência: 4 Reels/TikToks + 3 posts/carrosséis + stories diários por semana. Seg = vídeo, Ter = carrossel,
Qua = vídeo, Qui = post, Sex = vídeo, Sáb = carrossel, Dom = vídeo leve/bastidores.

| Semana | Tema | Peças-chave | Métrica da semana |
|---|---|---|---|
| **1 — O que é** | "Assistente de conversa, não app de namoro" | Vídeo 1 (fluxo do print), Post 1, Post 2, Post 3; bio e destaque "Como funciona", "Planos", "Privacidade" | Alcance, visitas à landing, cadastros (linha de base) |
| **2 — Os 7 tons** | Mesma mensagem, tons diferentes | Vídeo 2 (story → Stories/Casual/Engraçado), Posts 4, 5, 6; enquete nos stories "qual tom você usaria?" | Salvamentos, cliques no link, cadastros |
| **3 — Situações** | Conversa parou, primeira mensagem, story | Vídeo 3 (situação descrita em texto), Posts 7, 8; início dos anúncios de teste (se P1–P6 ok) | Cadastro → compra, custo por compra |
| **4 — Confiança e preço** | Privacidade, erro honesto, planos | Posts 9, 10; FAQ em stories; repost dos melhores vídeos | Compra por plano, ativação (1ª análise em 24 h) |

## 4. Dez posts (rascunhos)

Legenda curta, 1 CTA, no máximo 1 emoji. Imagem = tela real do app com exemplo fictício.

1. **"Assistente de conversa. Não é app de namoro."** — Aqui você não encontra perfis nem matches. Você traz a conversa que já tem, escolhe o tom e recebe 3 sugestões de resposta. Link na bio.
2. **Carrossel "Como funciona em 3 passos"** — 1) Envie o print ou descreva a situação. 2) Escolha um dos 7 tons. 3) Copie uma das 3 sugestões, edite se quiser e mande. Você continua sendo quem escreve.
3. **"Você decide o que usar."** — Copie, edite ou descarte. O Flert IA não manda nada por você.
4. **Carrossel "Uma mensagem, 7 tons"** — (exemplo ilustrativo) "Passei o fim de semana tentando fazer pão em casa." → uma sugestão por tom, usando `demo-data.ts`. Última tela: "Qual é a sua cara?"
5. **"Stories tem tom próprio."** — Para responder a um story, use o tom Stories: uma frase curta, sem "que lindo". Disponível ao enviar uma foto.
6. **"Cantada, mas específica."** — O tom Cantada usa algo da própria conversa, não frase de internet. Exemplo ilustrativo no carrossel. E se não for o momento, tem Sério e Casual.
7. **"A conversa parou. E agora?"** — Descreva a situação com suas palavras no modo "Situação estranha" e receba 3 sugestões para retomar de um jeito leve. Sem print, sem pressão.
8. **"Primeira mensagem sem 'oi, tudo bem?'"** — No modo "Inicie uma conversa", conte um pouco do contexto ou envie a foto do story e receba 3 aberturas.
9. **"O que acontece com o seu print"** — A imagem é enviada para a IA só para gerar as sugestões e não fica salva no Flert IA. O histórico guarda apenas as sugestões, e você apaga quando quiser. Dica: corte nome e foto da outra pessoa antes de enviar.
10. **"Planos, sem letra miúda"** — Mensal R$ 29,90 (30 análises/dia). Anual R$ 147,00 (50/dia). Vitalício R$ 297,00, pagamento único, ilimitado. Sem cobrança automática. Não há plano grátis: as análises exigem um plano.

## 5. Três roteiros de vídeo curto (20–35 s, gravação de tela)

Todos com selo fixo no canto: **"Exemplo ilustrativo"**. Mostrar o app real; dados de exemplo
inventados, sem rosto/nome/número de terceiros.

### Vídeo 1 — "Do print à resposta" (modo Sugestões de respostas)
- 0–3 s — Texto na tela: "Travou na resposta?" (sem perguntar estado civil). Tela do app: hub "Analisar conversa".
- 3–10 s — Toca em "Sugestões de respostas", envia um print **fictício** (mensagens: "Saiu meio torto, mas comestível").
- 10–15 s — Escolhe o tom "Engraçado". Toca "Gerar sugestões". Loader: "Lendo a conversa → Ajustando o tom → Escrevendo 3 opções".
- 15–25 s — Aparecem 3 sugestões. Toca "Copiar sugestão 2". Narração: "Você escolhe uma, ajusta do seu jeito e manda."
- 25–30 s — Cartela: "Flert IA — 3 sugestões em 7 tons. Planos a partir de R$ 29,90 por 30 dias." CTA: "Link na bio".

### Vídeo 2 — "Um story, três tons"
- 0–3 s — Texto: "Mesma foto. Três jeitos de responder."
- 3–8 s — Modo "Inicie uma conversa" → "Enviar foto"; imagem fictícia de pôr do sol com legenda "fim de tarde merecido".
- 8–24 s — Corta entre os tons Stories, Casual e Afiado, mostrando 1 sugestão de cada (de `demo-data.ts`).
- 24–30 s — Narração: "Você escolhe o tom. As 3 sugestões seguem ele." Cartela + CTA.

### Vídeo 3 — "Sem print? Conta a situação"
- 0–3 s — Texto: "A conversa parou há 3 dias."
- 3–12 s — Modo "Situação estranha"; digita: "A conversa parou há 3 dias, a última mensagem foi sobre filmes. Quero retomar de um jeito leve."
- 12–15 s — Escolhe "Casual" → gerar.
- 15–27 s — 3 sugestões; edita uma antes de copiar (mostra a edição: autoria do usuário).
- 27–32 s — Texto: "Se a IA falhar, o app avisa — e a tentativa não é descontada." *(fato com ressalva; na legenda: "falhas de conexão com a IA nunca são descontadas")*. CTA.

## 6. Sequência de e-mails de onboarding/ativação (3 e-mails)

Coerente com os gatilhos que existem: cadastro (`register/route.ts`, `auth.ts` para Google) e
pagamento confirmado (`webhooks/abacatepay/route.ts`). O e-mail 3 **não tem gatilho hoje** (precisa de
agendamento e opt-in). Sem emoji no assunto; marca "Flert IA"; benefícios de `getPlanBenefits()`;
preços de `formatBRL`.

### E-mail 1 — Cadastro (substitui o atual "Sua vida amorosa nunca mais será a mesma")
- **Assunto:** Boas-vindas ao Flert IA, {nome}
- **Pré-header:** Sua conta foi criada. Falta escolher um plano para começar.
- **Corpo:**
  Olá, {nome}.
  Sua conta no Flert IA foi criada. Funciona assim: você envia o print da conversa ou descreve a situação,
  escolhe um dos 7 tons e recebe 3 sugestões de resposta para copiar, editar ou descartar.
  As análises fazem parte dos planos:
  - Mensal — R$ 29,90, 30 dias, 30 análises por dia
  - Anual — R$ 147,00, 1 ano, 50 análises por dia
  - Vitalício — R$ 297,00, pagamento único, análises ilimitadas
  Sem cobrança automática.
- **CTA:** Ver planos → `/auth/login?callbackUrl=/pricing`
- **Rodapé:** Dúvidas? Fale com a gente em {SUPPORT_EMAIL}. Você recebeu este e-mail porque uma conta foi criada com este endereço.

### E-mail 2 — Pagamento confirmado (substitui o atual do webhook)
- **Assunto:** Plano {Mensal|Anual|Vitalício} ativo no Flert IA
- **Corpo:**
  Olá, {nome}. Sua compra foi confirmada e o plano {label} já está ativo.
  O que está incluso: {getPlanBenefits(plan)}.
  {Mensal/Anual: "Seu acesso vale até {data de expiração}. Não há renovação automática."}
  {Vitalício: "Pagamento único, sem data de expiração."}
  Para começar: abra "Analisar conversa", envie um print e escolha o tom.
- **CTA:** Fazer minha primeira análise → `/analyze`

### E-mail 3 — Ativação, 48 h após a compra sem nenhuma análise (requer gatilho novo)
- **Assunto:** 3 jeitos de usar o Flert IA hoje
- **Corpo:**
  1. **Recebeu uma mensagem e travou?** Envie o print em "Sugestões de respostas".
  2. **Viu um story e quer comentar?** Em "Inicie uma conversa", envie a foto e use o tom Stories.
  3. **A conversa ficou estranha?** Em "Situação estranha", conte com suas palavras.
  Dica: o contexto opcional ("o clima da conversa", "o que você quer dizer") deixa as sugestões mais próximas do que você quer.
- **CTA:** Abrir o Flert IA → `/analyze`
- **Rodapé:** link de descadastro (P4).

Os e-mails "free_upsell" e "expiring" do admin devem seguir o mesmo padrão (ver auditoria).

## 7. Anúncios (Meta)

**Política [pesquisa, verificar antes de subir]:**
- Meta exige **permissão prévia por escrito** para anúncios de *serviços de namoro* e público **18+**
  ([Meta — Dating Ads](https://transparency.meta.com/policies/ad-standards/restricted-goods-services/dating-ads/)).
  O Flert IA não é serviço de namoro, mas a revisão pode classificá-lo assim pelo tema; ter Termos/Privacidade
  publicados e criativos que mostrem claramente "assistente de conversa" reduz o risco. Segmentar 18+ sempre.
- **Atributos pessoais:** o anúncio não pode afirmar ou sugerir características de quem vê (estado civil,
  orientação, etc.) ([Meta — Personal attributes](https://transparency.meta.com/policies/ad-standards/objectionable-content/personal-attributes)).
  Proibido: "Solteiro?", "Cansado de ficar sozinho?", "Você leva vácuo?", "Homens que…".
- O criativo e a landing devem representar o produto com precisão (mesma fonte, via guia de terceiros).

**Variações (texto principal / título / descrição):**

| # | Texto principal | Título | Descrição |
|---|---|---|---|
| A1 | Envie o print da conversa, escolha o tom e receba 3 sugestões de resposta. Você edita e manda do seu jeito. | A resposta certa, no tom certo | Assistente de conversa com IA |
| A2 | Uma mensagem, 7 tons: Flertando, Engraçado, Casual, Afiado, Sério, Cantada e Stories. Escolha e veja 3 sugestões. | 7 tons, 3 sugestões | Exemplo ilustrativo no vídeo |
| A3 | Sem print? Descreva a situação com suas palavras e receba 3 ideias de resposta. | Conte a situação, receba 3 ideias | Planos a partir de R$ 29,90 por 30 dias |
| A4 | Viu um story e não sabe o que comentar? Envie a foto e use o tom Stories. | Para responder stories | Você escolhe, edita e copia |
| A5 | Planos em reais e sem cobrança automática. Vitalício por R$ 297,00 no PIX ou cartão. | Pague uma vez, sem mensalidade | Análises ilimitadas no Vitalício |

A4 usa pergunta sobre uma **situação**, não sobre a pessoa — revisar com a política antes de subir.
Criativos: vídeos 1–3; sem rostos de casal, sem beijo, sem corpo, sem "antes/depois".

## 8. Métricas

### O que dá para medir hoje

| Métrica | Fonte | Observação |
|---|---|---|
| Visitas por página (com consentimento) | Pixel da Meta: só `PageView`, só após aceite, nunca em `/auth/*` (`FacebookPixel.tsx:38`, `consent.ts:64`) | Sem consentimento, a Meta não vê nada — o número será parcial. |
| Visitas e desempenho | Vercel Analytics + Speed Insights (`layout.tsx:70-71`) | Carregam sem depender do banner; confirmar com a documentação da Vercel se é sem cookie (não verificado). |
| Cadastros por dia | `User.createdAt` (banco) | Sem origem/UTM. |
| Compras por plano | `ProcessedPayment` (`plan`, `createdAt`) | Apagar a conta apaga os registros (cascade) — exportar antes para série histórica. |
| Usuários com plano ativo | `SubscriptionStatus` (+ `getEffectivePlan`) | O "MRR estimado" do admin usa preços fixos (`admin/page.tsx:49`) e pode divergir de `plans.ts`. |
| Análises por dia e devoluções | `DailyUsage.count`, `refunds` | Proxy de uso e de falhas da IA. |
| Análises totais/semana por usuário | `/api/stats` (`total`, `thisWeek`, `today`) | Por usuário logado; não é painel agregado. Admin mostra contagem por usuário. |
| Modo e tom mais usados | `Conversation.title` ("Análise flirty - data", "Abertura…", "Situação…") | Dá para agregar por SQL; o título é texto, não campo estruturado. |

### O que precisa de instrumentação

1. **Eventos do Pixel** com consentimento: `CompleteRegistration` (após cadastro), `InitiateCheckout` (clique em assinar), `Purchase` (no retorno, com valor de `PLAN_CONFIG`). Hoje não existem, então não há otimização de campanha por conversão.
2. **Conversions API (servidor)** no webhook de pagamento — o retorno do checkout não diferencia pagou/desistiu (`docs/ux-review.md:82`).
3. **UTM/origem** guardada no cadastro (campo novo), para atribuir canal.
4. **Ativação:** "1ª análise até 24 h após a compra" — dá para calcular cruzando `ProcessedPayment` e `Conversation`, mas convém uma consulta pronta.
5. **Cópia de sugestão** (qual das 3 e qual tom) — sinal de qualidade; hoje não é registrado. Registrar sem o texto da sugestão.
6. **Opt-in/descadastro de e-mail** e taxa de abertura (depende do provedor SMTP).

### Painel semanal sugerido

Visitas → cadastros → compras (por plano) → ativação (1ª análise) → análises/dia por pagante →
taxa de devolução (`refunds`/`count`) → pedidos de reembolso (manual, via suporte).
