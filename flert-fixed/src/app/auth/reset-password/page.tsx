"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { CircleCheck, TriangleAlert } from "lucide-react";
import { PASSWORD_RULES_HINT, resetPasswordFormSchema, resetTokenSchema } from "@/lib/validation/auth";
import { AuthFallback, AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Lê o token uma vez e o remove da URL (histórico, barra de endereço e Referer).
  const [token] = useState(() => searchParams.get("token") || "");
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("token=")) {
      window.history.replaceState(null, "", "/auth/reset-password");
    }
  }, []);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!resetTokenSchema.safeParse(token).success) {
    return (
      <AuthShell title="Link inválido ou expirado." description="Peça um novo link de recuperação para continuar.">
        <Card role="alert" className="flex flex-col gap-5 p-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-warning/15 text-warning">
            <TriangleAlert className="h-5 w-5" aria-hidden />
          </span>
          <p className="text-sm text-text-2">
            O link pode ter expirado ou já ter sido usado. Solicite um novo para redefinir sua senha.
          </p>
          <Button asChild variant="signal" size="lg" className="w-full">
            <Link href="/auth/forgot-password">Solicitar novo link</Link>
          </Button>
        </Card>
      </AuthShell>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Mesmas regras do servidor (src/lib/validation/auth.ts).
    const parsed = resetPasswordFormSchema.safeParse({ token, password, confirm });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Erro ao redefinir senha"); return; }
      setDone(true);
      setTimeout(() => router.push("/auth/login"), 2800);
    } catch {
      toast.error("Erro ao redefinir senha. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Nova senha."
      description={done ? "Senha atualizada com sucesso." : "Crie uma nova senha para sua conta."}
    >
      {done ? (
        <Card role="status" className="flex flex-col gap-5 p-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-success/15 text-success">
            <CircleCheck className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 className="font-display text-h3 text-text">Tudo certo.</h2>
            <p className="mt-1 text-sm text-text-2">Sua senha foi atualizada. Redirecionando para o login...</p>
          </div>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Field id="password" label="Nova senha" hint={PASSWORD_RULES_HINT}>
            {(control) => (
              <PasswordInput
                {...control}
                maxLength={72}
                value={password} onChange={e => setPassword(e.target.value)} required
                autoComplete="new-password"
              />
            )}
          </Field>
          <Field id="confirm" label="Confirmar senha">
            {(control) => (
              <PasswordInput
                {...control}
                placeholder="Repita a senha"
                value={confirm} onChange={e => setConfirm(e.target.value)} required
                autoComplete="new-password"
              />
            )}
          </Field>
          <Button type="submit" variant="signal" size="lg" className="w-full" loading={loading}>
            Redefinir senha
          </Button>
        </form>
      )}
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthFallback><Spinner size="lg" label="Carregando" /></AuthFallback>}>
      <ResetForm/>
    </Suspense>
  );
}
