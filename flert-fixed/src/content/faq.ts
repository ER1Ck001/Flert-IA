// Perguntas frequentes compartilhadas entre a landing (/) e /pricing.
// Dados de plano sempre derivados de src/lib/plans.ts.
import { PLAN_CONFIG, PLANS_IN_ORDER, methodsLabel } from "@/lib/plans";

export interface FaqItem {
  q: string;
  a: string;
}

const methodsFaq = PLANS_IN_ORDER.map((p) => `${p.label}: ${methodsLabel(p.methods)}`).join(". ");

const durationText = (days: number | null) => (days === 365 ? "1 ano" : `${days} dias`);
const periodsFaq = [PLAN_CONFIG.PREMIUM, PLAN_CONFIG.ANNUAL]
  .map((p) => `${durationText(p.durationDays)} no ${p.label}`)
  .join(", ");

export const FAQ_ITEMS: readonly FaqItem[] = [
  {
    q: "O Flert IA é um app de namoro?",
    a: "Não. Não tem perfis nem matches. Você traz a conversa que já tem e recebe sugestões de resposta.",
  },
  {
    q: "Tem plano gratuito?",
    a: "Não. Criar conta não custa nada, mas as análises fazem parte dos planos. A demonstração desta página mostra exemplos sem precisar de conta.",
  },
  {
    q: "Os planos renovam automaticamente?",
    a: `Não. O acesso vale pelo período pago (${periodsFaq}) e não há cobrança automática. Se renovar antes do fim, o novo período é somado ao que ainda resta.`,
  },
  { q: "Quais formas de pagamento?", a: `${methodsFaq}.` },
  {
    q: "O que acontece com o meu print?",
    a: "A imagem e o texto são enviados para a OpenAI só para gerar as sugestões. A imagem não fica salva no Flert IA; o histórico guarda só as sugestões, e você pode apagá-las ou excluir a conta quando quiser. Como o print tem mensagens de outra pessoa, você pode cortar nome, foto e número antes de enviar.",
  },
  {
    q: "E se a IA falhar?",
    a: "O app mostra o erro e um botão para tentar de novo. Falhas de conexão com a IA nunca contam no seu limite; se a IA devolver uma resposta inválida, a tentativa é devolvida até 3 vezes por dia, e o aviso diz quando não for.",
  },
  {
    q: "Existe garantia ou reembolso?",
    a: "Sim. Você pode pedir o reembolso integral em até 7 dias após a compra, pelo e-mail de suporte. O pedido é atendido manualmente e o estorno segue o prazo do meio de pagamento.",
  },
  {
    q: "O plano Vitalício expira?",
    a: "Não. É um pagamento único, sem mensalidade e sem data de expiração: o acesso continua enquanto o Flert IA estiver no ar.",
  },
];
