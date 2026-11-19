"use client";

import { Suspense, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { LogOut } from "lucide-react";
import { AuthFallback, AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { Spinner } from "@/components/ui/spinner";
import { LEGAL_PUBLISHED } from "@/content/legal/config";
import { adultConfirmationMessage, confirmAgeSchema } from "@/lib/validation/auth";
import { safeCallbackUrl } from "@/lib/safe-redirect";
import { SUPPORT_EMAIL } from "@/lib/support";

const legalLinkClass = "font-medium text-violet-400 underline underline-offset-4 hover:text-text";

function AdultLabel() {
  if (!LEGAL_PUBLISHED) return <>Tenho 18 anos ou mais</>;
  return (
    <>
      Tenho 18 anos ou mais e li e aceito os{" "}
      <Link href="/termos" target="_blank" className={legalLinkClass}>Termos de Uso</Link> e a{" "}
      <Link href="/privacidade" target="_blank" className={legalLinkClass}>Política de Privacidade</Link>
    </>
  );
}

// Contas Google e contas criadas antes da Tarefa 10 confirmam 18+ aqui (o middleware traz para cá).
function ConfirmAgeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { update } = useSession();
  const boxRef = useRef<HTMLInputElement>(null);
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = confirmAgeSchema.safeParse({ adultConfirmed: checked });
    if (!parsed.success) {
      setError(adultConfirmationMessage(LEGAL_PUBLISHED));
      boxRef.current?.focus();
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/account/confirm-age", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || "Erro ao salvar a confirmação");
      // Relê o banco no jwt callback (trigger "update") e grava o claim `adult` no cookie.
      await update();
      router.replace(safeCallbackUrl(searchParams.get("callbackUrl")));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar a confirmação");
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Confirme sua idade"
      description="O Flert IA é só para maiores de 18 anos. Confirme para continuar usando a sua conta."
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <CheckboxField
          ref={boxRef}
          id="adultConfirmed"
          label={<AdultLabel />}
          checked={checked}
          onCheckedChange={(v) => {
            setChecked(v);
            if (v) setError(undefined);
          }}
          error={error}
          required
        />
        <Button type="submit" variant="signal" size="lg" className="w-full" loading={loading}>
          Confirmar e continuar
        </Button>
      </form>

      <div className="mt-8 space-y-3 rounded-lg border border-border bg-surface p-4 text-sm text-text-2">
        <p>
          Tem menos de 18 anos? Então o Flert IA não é para você, e a conta não pode ser usada. Para excluir a sua conta e
          os seus dados, escreva para{" "}
          <a href={`mailto:${SUPPORT_EMAIL}?subject=Excluir%20minha%20conta`} className={legalLinkClass}>
            {SUPPORT_EMAIL}
          </a>{" "}
          a partir do e-mail da conta.
        </p>
        <Button
          variant="outline"
          className="w-full"
          leftIcon={<LogOut className="h-4 w-4" aria-hidden />}
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          Sair
        </Button>
      </div>
    </AuthShell>
  );
}

export default function ConfirmAgePage() {
  return (
    <Suspense fallback={<AuthFallback><Spinner size="lg" label="Carregando" /></AuthFallback>}>
      <ConfirmAgeForm />
    </Suspense>
  );
}
