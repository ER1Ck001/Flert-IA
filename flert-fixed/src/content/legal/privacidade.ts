// rascunho — revisar com advogado antes de publicar.
// Política de Privacidade do Flert IA. Cada afirmação foi conferida no código (Tarefa 10):
// - dados da conta: prisma/schema.prisma (User, Account), src/app/api/auth/register/route.ts
// - imagens e contexto não são salvos: src/lib/ai/run-analysis.ts grava só as 3 sugestões
// - IP só como HMAC no rate limit: src/lib/rate-limit.ts (rateKey)
// - exclusão em cascata: DELETE /api/profile + onDelete: Cascade no schema
// - Pixel só com consentimento: src/lib/consent.ts e src/components/consent/FacebookPixel.tsx
// Ao mudar o tratamento de dados no código, atualize este texto e LEGAL_VERSION.
import { CONTROLLER, LAST_UPDATED, type LegalDoc } from "@/content/legal/config";
import { SUPPORT_EMAIL } from "@/lib/support";

export const PRIVACIDADE: LegalDoc = {
  title: "Política de Privacidade",
  description: "Quais dados o Flert IA trata, para quê, com quem compartilha e como você exerce seus direitos (LGPD).",
  intro: [
    `Última atualização: ${LAST_UPDATED}.`,
    "Esta política explica como o Flert IA trata dados pessoais, de acordo com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018, LGPD). Ela vale para o site, a área logada e os e-mails do Flert IA.",
  ],
  sections: [
    {
      id: "controlador",
      title: "1. Quem é o controlador",
      body: [
        `O controlador dos dados é ${CONTROLLER.name}, inscrito no ${CONTROLLER.document}, com endereço em ${CONTROLLER.address}.`,
        `Encarregado pelo tratamento de dados (DPO): ${CONTROLLER.dpoEmail}. Suporte geral: ${SUPPORT_EMAIL}.`,
      ],
    },
    {
      id: "dados",
      title: "2. Quais dados tratamos",
      body: [
        "Dados que você informa ou que são gerados pelo uso:",
        {
          list: [
            "Conta: nome, e-mail e senha. A senha é guardada apenas como hash (bcrypt), nunca em texto puro.",
            "Login com Google: nome, e-mail e foto de perfil fornecidos pelo Google, além dos identificadores e tokens da conta Google que a integração de login guarda para vincular o acesso.",
            "Histórico: as 3 sugestões geradas em cada análise, com um título (tom escolhido e data). Você pode apagar análises a qualquer momento.",
            "Uso e plano: quantas análises você fez por dia (para aplicar o limite do plano), o plano contratado, datas de ativação e de expiração e o identificador do pagamento.",
            "Consentimentos: se você aceitou receber e-mails de novidades e ofertas e quando, quando confirmou ter 18 anos ou mais e, quando aplicável, a versão dos Termos aceita.",
            "Redefinição de senha: um token temporário, guardado apenas como hash e com validade limitada.",
          ],
        },
        "O que NÃO guardamos: a imagem (print) e o texto de contexto que você envia para análise não ficam salvos no Flert IA. Eles são enviados à OpenAI apenas para gerar as sugestões. Também não guardamos dados de cartão: o pagamento é feito no ambiente da AbacatePay.",
        "Endereço IP: usado apenas para limitar tentativas (proteção contra abuso, por exemplo no login e no cadastro). Ele é transformado em um hash (HMAC) antes de ser gravado, junto com um contador que expira em minutos ou horas; o IP em claro não é armazenado nessas contagens.",
        "Prints de conversa costumam ter mensagens, nomes e fotos de outras pessoas. Recomendamos cortar ou ocultar nome, foto e número antes de enviar.",
      ],
    },
    {
      id: "finalidades",
      title: "3. Para que usamos e com qual base legal",
      body: [
        {
          list: [
            "Prestar o serviço (criar a conta, gerar sugestões, guardar o histórico, aplicar limites do plano e processar pagamentos): execução de contrato (art. 7º, V, da LGPD).",
            "Segurança e prevenção de abuso (limite de tentativas, revogação de sessões): legítimo interesse (art. 7º, IX).",
            "E-mails sobre a conta (boas-vindas, confirmação de pagamento, redefinição de senha, confirmação de exclusão): execução de contrato.",
            "E-mails de novidades e ofertas: somente com o seu consentimento (art. 7º, I), que pode ser retirado a qualquer momento.",
            "Pixel da Meta (medição de anúncios): somente com o seu consentimento no aviso de cookies.",
            "Cumprir obrigações legais e regulatórias, como registros de pagamento: art. 7º, II.",
          ],
        },
      ],
    },
    {
      id: "compartilhamento",
      title: "4. Com quem compartilhamos",
      body: [
        "Usamos fornecedores (operadores) que tratam dados em nosso nome, apenas para as finalidades acima:",
        {
          list: [
            "OpenAI: recebe a imagem e/ou o texto que você envia, com o tom escolhido, para gerar as sugestões.",
            "Vercel: hospedagem do site e das APIs, registros técnicos de funcionamento, e as ferramentas Vercel Analytics e Speed Insights (métricas de uso e de desempenho das páginas).",
            "Neon: banco de dados PostgreSQL onde ficam os dados da conta e o histórico.",
            "AbacatePay: processamento dos pagamentos (cartão e PIX). Os dados de pagamento são coletados por ela; recebemos o identificador e o status da cobrança.",
            "Google: login com Google, quando você escolhe essa opção.",
            "Provedor de envio de e-mail (SMTP): entrega dos e-mails da conta e, se você aceitou, dos e-mails de novidades e ofertas.",
            "Meta (Facebook): Pixel de medição, carregado só depois do seu aceite e nunca nas páginas de login, cadastro, senha e descadastro.",
          ],
        },
        "Não vendemos dados pessoais. Podemos compartilhar dados com autoridades quando houver obrigação legal ou ordem judicial.",
      ],
    },
    {
      id: "transferencia",
      title: "5. Transferência internacional",
      body: [
        "Parte desses fornecedores (como OpenAI e Vercel) processa dados em servidores fora do Brasil, principalmente nos Estados Unidos. Essa transferência internacional é feita para executar o serviço que você contratou, nos termos do art. 33 da LGPD.",
      ],
    },
    {
      id: "cookies",
      title: "6. Cookies e armazenamento no navegador",
      body: [
        {
          list: [
            "Cookies essenciais de sessão (login): mantêm você conectado e protegem os formulários. Sem eles a área logada não funciona.",
            "Preferência de cookies: a sua escolha no aviso de cookies fica salva no localStorage do navegador.",
            "Pixel da Meta: só é carregado se você aceitar no aviso de cookies. Você pode mudar a escolha em \"Preferências de cookies\", no rodapé do site, ou em Configurações.",
          ],
        },
      ],
    },
    {
      id: "retencao",
      title: "7. Por quanto tempo guardamos e como excluir",
      body: [
        "Os dados da conta e o histórico ficam guardados enquanto a conta existir. Você pode apagar análises do histórico quando quiser.",
        "Em Configurações, \"Excluir conta\" apaga a conta e, junto com ela, o histórico de análises, o plano e os registros de pagamento, o uso diário, os tokens de redefinição de senha e o vínculo com o Google. Você recebe um e-mail confirmando a exclusão.",
        "As contagens de limite de tentativas (com o IP em hash) expiram sozinhas. Registros mantidos pelos fornecedores (por exemplo, os da AbacatePay sobre pagamentos) seguem as políticas deles e as obrigações legais aplicáveis.",
      ],
    },
    {
      id: "direitos",
      title: "8. Seus direitos (art. 18 da LGPD)",
      body: [
        "Você pode pedir, a qualquer momento:",
        {
          list: [
            "confirmação de que tratamos seus dados e acesso a eles;",
            "correção de dados incompletos, inexatos ou desatualizados;",
            "anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desacordo com a LGPD;",
            "portabilidade dos dados a outro fornecedor;",
            "eliminação dos dados tratados com base no consentimento;",
            "informação sobre com quem compartilhamos seus dados;",
            "informação sobre a possibilidade de não consentir e as consequências;",
            "revogação do consentimento.",
          ],
        },
        `Alguns direitos você exerce direto no app: editar nome e e-mail em Perfil, apagar análises no Histórico, ligar ou desligar os e-mails de novidades e ofertas em Configurações (ou pelo link "Não quero mais receber" em cada e-mail promocional), mudar a escolha de cookies e excluir a conta. Para os demais, escreva para ${CONTROLLER.dpoEmail} ou ${SUPPORT_EMAIL}. Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).`,
      ],
    },
    {
      id: "menores",
      title: "9. Menores de idade",
      body: [
        "O Flert IA é destinado apenas a pessoas com 18 anos ou mais. Pedimos essa confirmação no cadastro e antes do uso. Se soubermos que uma conta pertence a menor de 18 anos, ela será excluída.",
      ],
    },
    {
      id: "seguranca",
      title: "10. Segurança",
      body: [
        "Adotamos medidas como conexão HTTPS, senhas guardadas só como hash, limite de tentativas de login e a opção de encerrar todas as sessões em Configurações. Nenhum sistema é totalmente imune a incidentes; se ocorrer um incidente relevante, comunicaremos os titulares afetados e a ANPD conforme a lei.",
      ],
    },
    {
      id: "alteracoes",
      title: "11. Alterações desta política",
      body: [
        "Podemos atualizar esta política. A data da última atualização fica no topo da página e, em mudanças relevantes, avisaremos por e-mail ou no app.",
      ],
    },
    {
      id: "contato",
      title: "12. Contato",
      body: [`Encarregado (DPO): ${CONTROLLER.dpoEmail}. Suporte: ${SUPPORT_EMAIL}.`],
    },
  ],
};
