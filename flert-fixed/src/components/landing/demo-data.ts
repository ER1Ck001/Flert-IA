// Dados ESTÁTICOS e ilustrativos da demonstração da landing. Nada aqui vem da IA nem de usuários reais.
import { TONES, type Tone, type ToneValue } from "@/components/analyze/tones";

/** Values imutáveis — são as chaves de tom aceitas pela API (fonte: analyze/tones.ts). */
export type DemoToneValue = ToneValue;

export interface DemoTone extends Tone {
  description: string;
}

const TONE_DESCRIPTIONS: Record<ToneValue, string> = {
  flirty: "Leve, com interesse claro e sem pressão.",
  funny: "Humor a partir do que foi dito.",
  casual: "Natural, como uma mensagem qualquer do dia.",
  witty: "Uma virada inteligente e inesperada.",
  serious: "Direto, maduro e honesto.",
  pickup: "Ousada, mas feita a partir da conversa.",
  stories: "Uma frase curta para responder a um story.",
};

export const DEMO_TONES: readonly DemoTone[] = TONES.map((t) => ({ ...t, description: TONE_DESCRIPTIONS[t.value] }));

export type DemoScenarioId = "conversa" | "story";

export interface DemoMessage {
  from: "them" | "me";
  text: string;
}

export interface DemoScenario {
  id: DemoScenarioId;
  label: string;
  /** Descrição curta do contexto exibido no mock. */
  context: string;
  messages: readonly DemoMessage[];
  suggestions: Partial<Record<DemoToneValue, readonly [string, string, string]>>;
}

export const DEMO_SCENARIOS: readonly DemoScenario[] = [
  {
    id: "conversa",
    label: "Conversa",
    context: "Print de uma conversa",
    messages: [
      { from: "them", text: "Passei o fim de semana tentando aprender a fazer pão em casa" },
      { from: "them", text: "Saiu meio torto, mas comestível" },
    ],
    suggestions: {
      flirty: [
        "Pão torto feito com dedicação conta como receita de família. Quando sai a próxima fornada?",
        "Agora fiquei com vontade de provar. Prometo uma avaliação justa e gentil.",
        "Gostei de saber que você se aventura na cozinha. Qual vai ser o próximo desafio?",
      ],
      funny: [
        "Comestível já é nível MasterChef pra mim. Meu último pão virou peso de porta.",
        "Pão torto é só pão com personalidade.",
        "Se precisar de alguém pra provar, meu currículo é impecável: como de tudo.",
      ],
      casual: [
        "Que legal! Foi receita da internet ou de alguém da família?",
        "Primeira tentativa sempre sai assim. Vai tentar de novo?",
        "Adoro pão caseiro. Qual tipo você fez?",
      ],
      witty: [
        "Torto, mas comestível: o slogan perfeito pra qualquer primeira tentativa.",
        "O pão tá na fase rebelde. Na segunda fornada ele aprende a se comportar.",
        "Pelo menos você já domina a parte mais difícil: tirar do forno inteiro.",
      ],
      serious: [
        "Achei muito legal você se dedicar a aprender algo novo. O que te fez querer começar?",
        "Admiro quem tenta mesmo sabendo que pode não sair perfeito. Como foi o processo?",
        "Curti saber disso. Gosto de conversar com quem tem curiosidade por coisas novas.",
      ],
      pickup: [
        "Se o pão saiu torto, a culpa é do forno. Quem fez claramente tem talento.",
        "Sinceridade: me interessei mais por quem fez o pão do que pelo pão.",
        "Dizem que pão caseiro aquece o coração. Pelo visto já está funcionando por aqui.",
      ],
    },
  },
  {
    id: "story",
    label: "Story",
    context: "Story: pôr do sol na praia · legenda “fim de tarde merecido”",
    messages: [{ from: "them", text: "fim de tarde merecido" }],
    suggestions: {
      flirty: [
        "Pôr do sol bonito assim pede companhia. Da próxima vez me chama?",
        "Merecido mesmo. E qual vai ser a recompensa de amanhã?",
        "Bom gosto pra lugares. Fiquei com curiosidade sobre os seus outros favoritos.",
      ],
      funny: [
        "Enquanto isso, eu aqui vendo o pôr do sol pelo papel de parede do celular.",
        "Essa foto deveria vir com aviso: causa inveja imediata.",
        "O sol caprichou porque sabia que ia aparecer no seu story.",
      ],
      casual: [
        "Que vista! Onde é?",
        "Fim de tarde perfeito. Foi bom o dia?",
        "Que lugar bonito, já entrou na minha lista.",
      ],
      witty: [
        "Merecido é pouco. Isso aí é prêmio de produtividade.",
        "O céu fez a parte dele, e a foto fez o resto.",
        "Legenda modesta pra uma vista dessas.",
      ],
      serious: [
        "Que bom ver você tirando um tempo pra descansar. Como foi a semana?",
        "Lugar lindo. Você costuma ir lá pra desacelerar?",
        "Esses momentos fazem diferença. Fico feliz que você teve um.",
      ],
      pickup: [
        "O pôr do sol tá lindo, mas confesso que reparei mesmo no bom gosto de quem postou.",
        "Fim de tarde merecido. Que tal um café merecido na semana que vem?",
        "Esse céu me deu a coragem que faltava pra puxar assunto com você.",
      ],
      stories: [
        "Essa vista merecia trilha sonora. Qual música combina?",
        "Quero o endereço desse fim de tarde.",
        "Melhor story do dia, fácil.",
      ],
    },
  },
];

export const DEMO_LABEL = "Exemplo ilustrativo — no app, as sugestões são geradas a partir da sua conversa.";

/** Tempo do loader da demo (ms). Com prefers-reduced-motion é 0. */
export const DEMO_LOADING_MS = 900;
