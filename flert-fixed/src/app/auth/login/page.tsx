"use client";

import { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { safeCallbackUrl } from "@/lib/safe-redirect";
import { AuthDivider, AuthFallback, AuthShell, authLinkClass } from "@/components/auth/AuthShell";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Só caminhos internos (evita open redirect via ?callbackUrl=https://site-malicioso).
  const callbackUrl = safeCallbackUrl(searchParams.get("callbackUrl"));
  const { status } = useSession();
  const [loading, setLoading] = useState(false);

  // Se já estiver logado, redireciona direto para o callbackUrl
  useEffect(() => {
    if (status === "authenticated") {
      router.replace(callbackUrl);
    }
  }, [status, router, callbackUrl]);
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });
      if (result?.error) {
        toast.error(
          result.error === "RATE_LIMITED"
            ? "Muitas tentativas. Aguarde alguns minutos e tente de novo."
            : "Email ou senha inválidos"
        );
      } else {
        toast.success("Bem-vindo de volta.");
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      toast.error("Erro ao fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try { await signIn("google", { callbackUrl }); }
    catch { toast.error("Erro ao entrar com Google"); }
  };

  return (
    <AuthShell
      title="Bem-vindo de volta."
      description="Entre na sua conta para continuar."
      footer={
        <>
          Não tem conta?{" "}
          <Link href="/auth/register" className={authLinkClass}>Criar conta</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field id="email" label="Email">
          {(control) => (
            <Input
              {...control}
              type="email"
              placeholder="seu@email.com"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              required autoComplete="email"
            />
          )}
        </Field>

        <div className="flex flex-col gap-1">
          <Field id="password" label="Senha">
            {(control) => (
              <PasswordInput
                {...control}
                placeholder="••••••••"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                required autoComplete="current-password"
              />
            )}
          </Field>
          <div className="flex justify-end">
            <Link href="/auth/forgot-password" className={`${authLinkClass} text-sm`}>Esqueci a senha</Link>
          </div>
        </div>

        <Button type="submit" variant="signal" size="lg" className="w-full" loading={loading}>
          Entrar
        </Button>
      </form>

      <AuthDivider label="ou continue com" />

      <GoogleButton onClick={handleGoogle} />
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthFallback><Spinner size="lg" label="Carregando" /></AuthFallback>}>
      <LoginForm/>
    </Suspense>
  );
}
