// rascunho — revisar com advogado antes de publicar.
// Termos de Uso do Flert IA. Regras de plano conferidas em src/lib/plans.ts (durações, sem
// renovação automática) e no webhook de pagamento; reembolso conforme decisão do dono (7 dias).
import { CONTROLLER, LAST_UPDATED, type LegalDoc } from "@/content/legal/config";
import { PLAN_CONFIG } from "@/lib/plans";
import { SUPPORT_EMAIL } from "@/lib/support";

const monthly = PLAN_CONFIG.PREMIUM;
const annual = PLAN_CONFIG.ANNUAL;
const lifetime = PLAN_CONFIG.LIFETIME;

export const TERMOS: LegalDoc = {
  title: "Termos de Uso",
  description: "Regras de uso do Flert IA: conta, planos, pagamento, reembolso, uso aceitável e limites da IA.",
  intro: [
    `Última atualização: ${LAST_UPDATED}.`,
    `Estes Termos regulam o uso do Flert IA, oferecido por ${CONTROLLER.name}, ${CONTROLLER.document}, com endereço em ${CONTROLLER.address}. Ao criar uma conta ou usar o serviço, você concorda com estes Termos e com a Política de Privacidade.`,
  ],
  sections: [
    {
      id: "servico",
      title: "1. O que é o Flert IA",
      body: [
        "O Flert IA é um assistente de conversa: você envia o print de uma conversa ou descreve uma situação, escolhe um tom e recebe 3 sugestões de resposta geradas por inteligência artificial (OpenAI). Não é um app de namoro: não há perfis, matches nem contato com outras pessoas pela plataforma.",
      ],
    },
    {
      id: "idade",
      title: "2. Quem pode usar",
      body: [
        "O serviço é exclusivo para pessoas com 18 anos ou mais. Ao criar a conta, você confirma ter 18 anos ou mais. Contas de menores serão excluídas.",
      ],
    },
    {
      id: "conta",
      title: "3. Sua conta",
      body: [
        "Você é responsável pelos dados informados, pela guarda da sua senha e pelo uso feito com a sua conta. Em Configurações você pode encerrar todas as sessões abertas e excluir a conta a qualquer momento.",
      ],
    },
    {
      id: "planos",
      title: "4. Planos e pagamento",
      body: [
        "Criar a conta não tem custo, mas as análises fazem parte dos planos pagos. Preços, limites diários e formas de pagamento estão na página de planos no momento da compra.",
        {
          list: [
            `${monthly.label}: acesso por ${monthly.durationDays} dias.`,
            `${annual.label}: acesso por ${annual.durationDays} dias.`,
            `${lifetime.label}: pagamento único, sem data de expiração, enquanto o Flert IA estiver em operação.`,
          ],
        },
        "Não há renovação automática nem cobrança recorrente: ao fim do período o acesso às análises termina, e você só paga de novo se quiser. Se renovar antes do fim, o novo período é somado ao que resta.",
        "Os pagamentos são processados pela AbacatePay. O Flert IA não armazena dados de cartão.",
      ],
    },
    {
      id: "reembolso",
      title: "5. Arrependimento e reembolso",
      body: [
        `Você pode pedir o reembolso integral em até 7 dias após a compra (art. 49 do Código de Defesa do Consumidor), escrevendo para ${SUPPORT_EMAIL} com o e-mail da conta. O pedido é tratado manualmente pelo suporte; o estorno é feito pelo mesmo meio de pagamento e segue o prazo da AbacatePay e do emissor do cartão. Com o reembolso, o plano é cancelado.`,
      ],
    },
    {
      id: "uso-aceitavel",
      title: "6. Uso aceitável",
      body: [
        "Você é o autor das mensagens que decide enviar a outras pessoas e responde por elas. As sugestões são só um ponto de partida: revise, edite ou descarte.",
        "Não é permitido usar o Flert IA para:",
        {
          list: [
            "assédio, ameaças, chantagem, perseguição ou qualquer forma de intimidação;",
            "insistir em contato com quem já disse não ou pediu para parar;",
            "conteúdo sexual envolvendo menores, discurso de ódio ou discriminação;",
            "enganar, aplicar golpes ou se passar por outra pessoa;",
            "enviar conteúdo que você não tem direito de compartilhar ou que exponha terceiros sem necessidade;",
            "tentar burlar limites, atacar ou sobrecarregar o serviço.",
          ],
        },
        "Respeite as pessoas com quem conversa. Recomendamos ocultar nome, foto e número de terceiros antes de enviar um print. Podemos suspender ou excluir contas que violem estas regras.",
      ],
    },
    {
      id: "ia",
      title: "7. Limites da inteligência artificial",
      body: [
        "As sugestões são geradas automaticamente pela OpenAI e podem conter erros, interpretações equivocadas da conversa ou textos inadequados para o seu contexto. Não garantimos nenhum resultado em conversas, encontros ou relacionamentos. Se a IA falhar, o app mostra o erro; as regras de devolução da tentativa no limite diário estão na página de planos.",
      ],
    },
    {
      id: "disponibilidade",
      title: "8. Disponibilidade e mudanças no serviço",
      body: [
        "Trabalhamos para manter o serviço disponível, mas podem ocorrer interrupções, manutenções ou falhas de fornecedores. Podemos alterar funcionalidades, avisando com antecedência quando a mudança afetar o que você contratou.",
      ],
    },
    {
      id: "responsabilidade",
      title: "9. Responsabilidade",
      body: [
        "O Flert IA responde nos termos do Código de Defesa do Consumidor. Não respondemos pelo conteúdo que você escolhe enviar a terceiros nem pelas reações de outras pessoas a ele.",
      ],
    },
    {
      id: "alteracoes",
      title: "10. Alterações destes Termos",
      body: [
        "Podemos atualizar estes Termos. A data e a versão ficam no topo da página e, em mudanças relevantes, avisaremos por e-mail ou no app; quando necessário, pediremos um novo aceite.",
      ],
    },
    {
      id: "lei",
      title: "11. Lei aplicável e contato",
      body: [
        `Estes Termos seguem a lei brasileira. Fica eleito o foro do domicílio do consumidor. Dúvidas: ${SUPPORT_EMAIL}.`,
      ],
    },
  ],
};
