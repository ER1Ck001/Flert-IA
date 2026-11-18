// Perguntas frequentes compartilhadas entre a landing (/) e /pricing.
// Dados de plano sempre derivados de src/lib/plans.ts.
import { PLANS_IN_ORDER, methodsLabel } from "@/lib/plans";

export interface FaqItem {
  q: string;
  a: string;
}

const methodsFaq = PLANS_IN_ORDER.map((p) => `${p.label}: ${methodsLabel(p.methods)}`).join(". ");

export const FAQ_ITEMS: readonly FaqItem[] = [
  {
    q: "Os planos renovam automaticamente?",
    a: "O acesso vale pelo período pago (30 dias no Mensal, 1 ano no Anual). Você pode renovar antes do fim — o novo período é somado ao que ainda resta, sem perder dias.",
  },
  { q: "Quais formas de pagamento?", a: `${methodsFaq}.` },
  {
    q: "Existe garantia ou reembolso?",
    a: "O reembolso é disponível apenas para usuários que realizaram no máximo 1 análise e solicitaram dentro de 12 horas após a compra. Basta entrar em contato pelo suporte.",
  },
  {
    q: "O plano vitalício é mesmo para sempre?",
    a: "Sim. É um pagamento único, sem mensalidade e sem data de expiração.",
  },
];
