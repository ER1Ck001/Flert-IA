import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, MailX, TriangleAlert } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { StatusScreen } from "@/components/ui/status-screen";
import { UNSUBSCRIBE_API_PATH, verifyUnsubscribeToken } from "@/lib/email/unsubscribe";
import { PRIVATE_ROBOTS } from "@/lib/seo";
import { SUPPORT_EMAIL } from "@/lib/support";

export const metadata: Metadata = {
  title: "Cancelar e-mails de novidades",
  robots: PRIVATE_ROBOTS,
};

// GET só mostra a confirmação (provedores de e-mail abrem links sozinhos); o descadastro
// acontece no POST do formulário (ou no one-click do List-Unsubscribe).
type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function UnsubscribePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const status = first(params.status);
  const u = first(params.u);
  const t = first(params.t);
  const valid = verifyUnsubscribeToken(u, t);

  const home = (
    <Button asChild variant="secondary" size="lg">
      <Link href="/">Ir para o site</Link>
    </Button>
  );

  let screen: React.ReactNode;
  if (status === "ok") {
    screen = (
      <StatusScreen
        icon={CheckCircle2}
        role="status"
        title="Pronto, e-mails cancelados"
        description="Você não vai mais receber novidades e ofertas do Flert IA. E-mails sobre a sua conta (pagamento, senha, exclusão) continuam chegando. Para voltar a receber, ligue a opção em Configurações."
        actions={home}
      />
    );
  } else if (status === "error") {
    screen = (
      <StatusScreen
        icon={TriangleAlert}
        tone="danger"
        role="alert"
        title="Não deu para cancelar agora"
        description={`Tente de novo em alguns minutos ou desligue a opção em Configurações. Se preferir, escreva para ${SUPPORT_EMAIL}.`}
        actions={home}
      />
    );
  } else if (!valid) {
    screen = (
      <StatusScreen
        icon={TriangleAlert}
        tone="danger"
        title="Link inválido"
        description={`Este link de cancelamento não é válido. Você pode desligar os e-mails de novidades e ofertas em Configurações ou escrever para ${SUPPORT_EMAIL}.`}
        actions={home}
      />
    );
  } else {
    const action = `${UNSUBSCRIBE_API_PATH}?u=${encodeURIComponent(u)}&t=${encodeURIComponent(t)}`;
    screen = (
      <StatusScreen
        icon={MailX}
        title="Não quer mais receber?"
        description="Confirme para parar de receber e-mails de novidades e ofertas do Flert IA. E-mails sobre a sua conta continuam chegando."
        actions={
          <form method="post" action={action} className="w-full sm:w-auto">
            <Button type="submit" variant="signal" size="lg" className="w-full">
              Não quero mais receber
            </Button>
          </form>
        }
      />
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-bg bg-aurora">
      <div className="px-4 pt-4 sm:px-6 sm:pt-6">
        <Link
          href="/"
          aria-label="Flert IA — página inicial"
          className="inline-flex min-h-11 items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          <Logo size={28} />
        </Link>
      </div>
      <main id="main" tabIndex={-1} className="flex flex-1 items-center px-4 py-10 focus:outline-none sm:px-6">
        {screen}
      </main>
    </div>
  );
}
