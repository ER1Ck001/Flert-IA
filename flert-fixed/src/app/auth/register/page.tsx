"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";
import { Sparkles } from "lucide-react";
import { PASSWORD_RULES_HINT, registerSchema } from "@/lib/validation/auth";
import { focusFirstError, toFieldErrors, type FieldErrors } from "@/lib/field-errors";
import { AuthDivider, AuthFallback, AuthShell, authLinkClass } from "@/components/auth/AuthShell";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const setField = (key: keyof typeof formData, value: string) => {
    setFormData((d) => ({ ...d, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Mesmas regras do servidor (src/lib/validation/auth.ts).
    const parsed = registerSchema.safeParse(formData);
    if (!parsed.success) {
      // Erro no próprio campo (role=alert + aria-invalid) e foco nele.
      const fieldErrors = toFieldErrors(parsed.error.issues);
      setErrors(fieldErrors);
      focusFirstError(fieldErrors, ["name", "email", "password"]);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Erro ao criar conta"); return; }
      toast.success("Conta criada!");
      await signIn("credentials", { email: parsed.data.email, password: parsed.data.password, redirect: false });
      router.push("/dashboard");
    } catch {
      toast.error("Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try { await signIn("google", { callbackUrl: "/dashboard" }); }
    catch { toast.error("Erro ao entrar com Google"); }
  };

  const planLabels: Record<string, string> = {
    monthly: "Plano Mensal selecionado",
    annual: "Plano Anual selecionado",
    lifetime: "Plano Vitalício selecionado",
  };

  return (
    <AuthShell
      title="Criar conta"
      description="Crie sua conta. As análises fazem parte dos planos, que você escolhe em seguida."
      eyebrow={
        plan && planLabels[plan] ? (
          <Badge variant="violet">
            <Sparkles className="mr-1 h-3.5 w-3.5" aria-hidden />
            {planLabels[plan]}
          </Badge>
        ) : undefined
      }
      footer={
        <>
          Já tem conta?{" "}
          <Link href="/auth/login" className={authLinkClass}>Fazer login</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <Field id="name" label="Nome completo" error={errors.name}>
          {(control) => (
            <Input
              {...control}
              type="text"
              placeholder="Seu nome"
              value={formData.name}
              onChange={e => setField("name", e.target.value)}
              required maxLength={60} autoComplete="name"
            />
          )}
        </Field>
        <Field id="email" label="E-mail" error={errors.email}>
          {(control) => (
            <Input
              {...control}
              type="email"
              placeholder="seu@email.com"
              value={formData.email}
              onChange={e => setField("email", e.target.value)}
              required maxLength={254} autoComplete="email"
            />
          )}
        </Field>
        <Field id="password" label="Senha" hint={PASSWORD_RULES_HINT} error={errors.password}>
          {(control) => (
            <PasswordInput
              {...control}
              value={formData.password}
              onChange={e => setField("password", e.target.value)}
              required minLength={8} maxLength={72} autoComplete="new-password"
            />
          )}
        </Field>

        <Button type="submit" variant="signal" size="lg" className="w-full" loading={loading}>
          Criar conta
        </Button>
      </form>

      <AuthDivider label="ou continue com" />

      <GoogleButton onClick={handleGoogle} />
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<AuthFallback><Spinner size="lg" label="Carregando" /></AuthFallback>}>
      <RegisterForm/>
    </Suspense>
  );
}
