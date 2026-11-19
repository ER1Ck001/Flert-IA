# Posicionamento — Flert IA

Tarefa 7. Tudo o que está em "Fatos do produto" foi conferido no código (arquivo:linha). Pesquisa de
mercado está marcada como **[pesquisa]** e não foi verificada além das fontes citadas.

---

## 1. Fatos do produto (base de toda a copy)

| Fato | Fonte |
|---|---|
| Três modos: **Sugestões de respostas** (print), **Inicie uma conversa** (texto ou foto/story), **Situação estranha** (texto). | `src/app/(dashboard)/analyze/page.tsx:341-345` |
| Sempre **3 sugestões** por análise; o usuário copia (botão por sugestão) e pode editar fora do app. | `run-analysis.ts:123`, `SuggestionCard.tsx`, `prompts.ts:42` |
| **7 tons**: Flertando, Engraçado, Casual, Afiado, Sério, Cantada, Stories ("Stories" só nos fluxos com foto). | `src/components/analyze/tones.ts:13-24` |
| Contexto opcional (print) ou obrigatório (texto), até **2.000 caracteres**. Imagem PNG/JPG/WEBP/GIF até **10 MB**, reduzida no navegador. | `run-analysis.ts:11-27`, `analyze/page.tsx:91-103` |
| **Não é app de namoro**: não há perfis públicos, match, busca de pessoas nem mensagens dentro do app. | ausência no código; `docs/redesign-faisca.md:4` |
| **Tudo pago.** Sem plano ("Sem plano"/FREE) o limite é **0 análises**; criar conta não dá análise. | `plans.ts:68, 117-120`; `AnalyzeGate.tsx:24` |
| Planos (cobrança única por período, **sem renovação automática**; renovar soma o período restante). | `plans.ts:28-63`; `faq.ts:15`; `api/payment/route.ts` (checkout avulso) |
| Limite diário reinicia à **meia-noite (horário de Brasília)**. Rajada: 10 análises/min. | `run-analysis.ts:48, 72` |
| **Falha honesta:** erro da OpenAI → tentativa sempre devolvida. Saída inválida → devolvida até **3 vezes por dia**; depois disso a mensagem diz que **foi descontada**. | `run-analysis.ts:40-43, 91-106`; `usage.ts:44` |
| **Imagem e contexto não são salvos** no Flert IA; o histórico guarda só as 3 sugestões e um título (modo, tom, data). Imagem e texto **são enviados à OpenAI** para gerar. | `run-analysis.ts:109-116`; `generate.ts:35-50`; `settings/page.tsx:36` |
| Histórico com busca e remoção; exclusão de conta pelo próprio usuário. | `history/page.tsx`; `settings/page.tsx:216-217` |
| Regras de segurança do prompt: sem assédio, ameaça, ódio, conteúdo sexual explícito, menores, nem instruções para enganar ou pressionar. | `prompts.ts:119-122` |
| Pagamento via AbacatePay; app não guarda dados de cartão. | `settings/page.tsx:39-40` |
| Reembolso: **integral em até 7 dias** após a compra, pedido por e-mail ao suporte (manual). | `pricing/page.tsx:166`; `faq.ts:20` |

### Preços (de `plans.ts`, formatados por `formatBRL`)

| Plano | Preço | Duração | Limite | Pagamento |
|---|---|---|---|---|
| Mensal | **R$ 29,90/mês** | 30 dias | 30 análises/dia | cartão de crédito |
| Anual | **R$ 147,00/ano** (≈ R$ 12,25/mês; economia de **R$ 211,80** vs. 12× Mensal) | 365 dias | 50 análises/dia | cartão de crédito |
| Vitalício | **R$ 297,00** pagamento único | sem expiração | ilimitado | PIX ou cartão |

Benefícios comuns (`plans.ts:75-83`): análise de prints de conversas e stories; ideias para começar uma
conversa; ajuda para responder situações específicas; 7 tons; 3 sugestões por análise; histórico;
suporte por e-mail.

---

## 2. Categoria

**Assistente de conversa com IA** (coach de mensagens). Não é app de namoro, não é "wingman" que
conversa por você e não é banco de cantadas. A pessoa continua no WhatsApp/Instagram/app de namoro dela;
o Flert IA entra no momento entre receber a mensagem e responder.

Frase de categoria para uso público: *"Assistente de conversa: você envia o print, escolhe o tom e recebe
3 sugestões de resposta."*

## 3. Públicos (somente 18+)

> O cadastro hoje **não pede idade nem aceite de termos** (`docs/ux-review.md:79`). Toda segmentação de
> anúncio deve ser 18+, e a confirmação de idade no cadastro é decisão do dono.

### Primário — adultos de 18 a 34 anos que conversam por texto e travam na hora de responder

- **Dores honestas:** não saber o que responder a um story; medo de soar forçado ou sem graça; conversa que
  parou e não sabe como retomar sem parecer insistente; demora tanto pensando que a conversa esfria.
- **Jobs-to-be-done:**
  - "Quando recebo uma mensagem e não sei o que dizer, quero algumas opções em tons diferentes para escolher uma e adaptar."
  - "Quando vejo um story, quero uma primeira mensagem que não seja 'que lindo'."
  - "Quando a conversa ficou estranha, quero ajuda para pensar numa resposta leve."
- **O que NÃO prometer:** que a pessoa vai responder, que vai virar encontro, que vai "dar certo".

### Secundário — quem quer variar o próprio jeito de escrever

- Pessoas que conversam bem, mas querem ver alternativas (mais engraçada, mais direta) antes de mandar.
- **Job:** "Quero comparar 3 versões no tom que escolhi e ficar com a que parece comigo."

### Fora do público

Menores de 18 (nunca); quem procura conhecer pessoas (não fazemos match); quem quer automação de
mensagens em massa ou "técnicas de manipulação".

> **Atenção (decisão do dono):** o prompt da IA está escrito na voz de *"um homem brasileiro, 28 anos…
> muito bem-sucedido com mulheres"* e fala da outra pessoa como "ela" (`prompts.ts:5, 26, 50-56, 60`),
> com instruções como *"como alguém que tem opções e não está precisando"* (`prompts.ts:28`) e *"Nunca
> quebre o personagem"* (`prompts.ts:47`). Na prática, o produto hoje é otimizado para **homens falando
> com mulheres**. Enquanto isso não mudar, a copy pode ser neutra em gênero, mas **não deve prometer** que
> o app funciona igualmente para qualquer gênero/orientação. A moldura "tem opções e não está precisando"
> é a mais próxima de "pickup artist" no produto; recomenda-se revisá-la (fora do escopo desta tarefa).

## 4. Declaração de posicionamento

> Para adultos que conversam por mensagem e às vezes travam na hora de responder, o **Flert IA** é um
> assistente de conversa que transforma um print ou uma situação descrita em **3 sugestões de resposta,
> no tom que você escolher**. Diferente de listas de cantadas prontas e de apps que respondem por você,
> no Flert IA **você continua sendo o autor**: escolhe, edita e manda do seu jeito — e, se a IA falhar,
> o app diz isso com clareza e não desconta a tentativa.

## 5. Proposta de valor

**Título:** A resposta certa, no tom certo. (já em uso — `Hero.tsx:70`)

**Subtítulo:** Envie o print ou descreva a situação. A IA sugere 3 respostas em 7 tons — você escolhe e copia.

**Três pilares (todos verificáveis):**

1. **Contexto real, não frase pronta.** A sugestão parte do seu print ou da situação que você descreveu.
2. **Você escolhe o tom.** Flertando, Engraçado, Casual, Afiado, Sério, Cantada ou Stories — sempre 3 opções diferentes.
3. **Você no controle.** Copie, edite ou descarte. A imagem não fica salva no Flert IA; o histórico guarda só as sugestões, e você apaga quando quiser.

## 6. Diferenciais verdadeiros (e como dizer)

| Diferencial | Prova no código | Como dizer | Não dizer |
|---|---|---|---|
| 3 sugestões com abordagens diferentes | `prompts.ts:45` ("As 3 devem ter abordagens completamente diferentes") | "3 opções diferentes para você escolher" | "3 respostas perfeitas" |
| 7 tons, incluindo um para stories | `tones.ts` | "7 tons, inclusive um só para responder story" | "infinitos estilos" |
| Funciona com print **ou** com descrição | `/api/analyze`, `/api/analyze/text` | "Tem print? Envie. Não tem? Conte a situação." | — |
| Erro honesto e cota devolvida | `run-analysis.ts:40-43` | "Se a IA falhar, você fica sabendo — e a tentativa não é descontada." (ressalva: até 3 devoluções por saída inválida/dia; erro de conexão com a IA é sempre devolvido) | "Nunca falha" |
| Sem mensalidade no Vitalício; Anual mais barato que 12 meses | `plans.ts:51-62`, `annualSavingsCents()` | "Anual: R$ 147,00 — R$ 211,80 a menos que 12 meses do Mensal." | "Para sempre", "preço que nunca mais volta" |
| Sem renovação automática | checkout avulso (`api/payment/route.ts:94-104`), `faq.ts:15` | "Sem cobrança automática: você paga o período e renova se quiser." | — |
| Imagem não salva no Flert IA | `run-analysis.ts:109-116` | "A imagem é usada só para gerar as sugestões e não fica salva no Flert IA." | "100% privado", "ninguém vê seu print" (a OpenAI processa) |
| Pagamento por PIX (Vitalício) | `plans.ts:59` | "Vitalício no PIX ou cartão." | "PIX em todos os planos" (Mensal e Anual são só cartão) |

## 7. Objeções e respostas honestas

**"É seguro mandar print de conversa? Tem mensagem de outra pessoa ali."**
A imagem é enviada para a OpenAI só para gerar as sugestões e não fica salva no Flert IA; o histórico
guarda apenas as 3 sugestões. Mesmo assim, o print tem mensagens de outra pessoa: recomende cortar nome,
foto e número antes de enviar. *(A política de retenção da OpenAI para a API não foi verificada aqui; não
afirmar prazos. Não existe ainda Política de Privacidade publicada — `docs/ux-review.md:79`.)*

**"Isso não fica falso/robótico?"**
As sugestões são um ponto de partida: você escolhe uma das 3, ajusta para o seu jeito e manda. O app não
envia nada por você. *(Não dizer "ninguém vai perceber que é IA".)*

**"É manipulação?"**
Não. A IA tem regras para não gerar assédio, pressão ou instruções para enganar alguém (`prompts.ts:122`).
O objetivo é ajudar você a dizer o que já quer dizer, num tom que combine com a conversa.

**"Tem versão grátis? Posso testar?"**
Não. Criar conta não custa nada, mas as análises exigem um plano. A demonstração da página inicial mostra
exemplos ilustrativos sem precisar de conta. *(Se o dono quiser oferecer teste, isso é mudança de produto.)*

**"Vale o preço?"**
Mensal R$ 29,90 (30 análises/dia); Anual R$ 147,00 (50/dia, ≈ R$ 12,25/mês); Vitalício R$ 297,00
(ilimitado, pagamento único). Mostrar a conta, não "economia imperdível".

**"Vai cobrar todo mês?"**
Não há cobrança automática. Mensal vale 30 dias e Anual 1 ano; para continuar, você renova e os dias
restantes são somados.

**"E se eu me arrepender?"**
Política atual (Tarefa 10): reembolso integral se pedido em até 7 dias após a compra, pelo e-mail de
suporte, atendido manualmente. Segue o direito de arrependimento do art. 49 do CDC (fontes abaixo). Não
prometer estorno automático nem prazo de estorno além do meio de pagamento.

**"E se a IA não entender meu print?"**
O app mostra um erro claro com "Tentar novamente". Se foi falha de conexão com a IA, a tentativa nunca é
descontada; se a IA devolveu algo inválido, a tentativa é devolvida até 3 vezes no dia, e a mensagem
avisa quando não for.

## 8. Narrativa de preço

1. Comece pelo **Mensal** como entrada ("Para começar", `PlanCard.tsx:20`): R$ 29,90, 30 dias, 30 análises/dia.
2. **Anual** como escolha racional: R$ 147,00 por 1 ano, 50 análises/dia — R$ 211,80 a menos que 12 meses do Mensal.
3. **Vitalício** como "pague uma vez": R$ 297,00, ilimitado, PIX ou cartão, sem data de expiração.
4. Sempre: "Sem cobrança automática." e "Valores em reais."
5. Nunca: "a partir de R$ 29,90/mês" (o Anual sai mais barato por mês — `admin/email/route.ts:66` está
   enganoso), "oferta por tempo limitado", contagem regressiva, preço "de/por" sem preço anterior real.

## 9. Panorama competitivo [pesquisa]

Pesquisa feita com buscas genéricas em 18/11/2026. Descrições vêm das próprias lojas/sites dos apps ou de
agregadores; **nenhuma foi testada**, preços podem estar desatualizados.

| Concorrente | O que diz fazer | Observação |
|---|---|---|
| **Rizz** (app original, EUA) | Analisa prints de conversas de outras plataformas e sugere respostas; pago. | [TechXplore](https://techxplore.com/news/2024-09-rizz-founder-dating-app-ai.pdf), [Business Insider NL](https://businessinsider.nl/i-tried-the-ai-powered-dating-app-rizz-which-costs-20-a-month-and-analyzes-your-texts-to-offer-advice/) — cita ~US$ 20/mês |
| Diversos "Rizz AI"/"W Rizz"/"RizzGPT" | Print ou mensagem colada → 2 a várias sugestões, com escolha de "vibe"/tom. | Listagens na App Store: [W Rizz](https://apps.apple.com/app/id6749450318), [RizzGPT](https://apps.apple.com/us/app/-/id6758113641), [Rizz AI](https://apps.apple.com/us/app/id6476662782). Muitos clones com nome parecido. |
| **Rizzly** | Sugestões, cantadas e versões em tons diferentes; teste de 3 dias; a partir de US$ 79,99/ano. | [itechguides](https://www.itechguides.com/products/rizzly/) (avaliação de terceiro) |
| **Plug AI** (ex-Wingman) | Prints → sugestões de mensagens; Google Play. | [aipure](https://aipure.ai/br/products/plug-ai) |
| **Wing AI** | Respondedor de conversa; US$ 0,99 a 1ª semana, depois US$ 3,99/semana. | [toolmage](https://www.toolmage.com/pt/tool/wing-ai/) |
| **Winggg** | Gera mensagens para editar/enviar; diz que +50% são usadas (dado do fabricante). | [similarlabs](https://similarlabs.com/pt/p/winggg) |
| **Hintder** | Print do perfil → 5 aberturas para Tinder/Hinge/Bumble. | [similarlabs](https://similarlabs.com/pt/p/hintder-ai-dating-wingman-openers) |

**Leitura (interpretação, não dado):** a categoria é lotada, majoritariamente em inglês, com assinatura
semanal e linguagem de "rizz"/"wingman"/"pickup lines". Espaços que o Flert IA pode ocupar com
verdade: **(1) pt-BR nativo**; **(2) preço em reais, PIX no Vitalício e sem cobrança automática**;
**(3) honestidade** — sem promessa de resultado, erro claro, imagem não salva; **(4) respeito** como
diferencial explícito num mercado de "cantadas".

Fontes jurídicas (CDC art. 49, divulgação, não texto oficial):
[Jus.com.br](https://jus.com.br/artigos/64591/o-direito-de-arrependimento-nas-compras-pela-internet),
[Projuris](https://www.projuris.com.br/blog/direito-de-arrependimento-2/),
[Meu Site Jurídico — bens digitais](https://meusitejuridico.editorajuspodivm.com.br/2026/07/21/o-direito-de-arrependimento-previsto-no-cdc-tambem-se-aplica-aos-bens-digitais/).
