"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, MailCheck } from "lucide-react";
import { AuthShell, authLinkClass } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  // O formulário some ao enviar: o foco vai para a confirmação (senão cai no <body>).
  const sentHeadingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (sent) sentHeadingRef.current?.focus(); }, [sent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Erro ao enviar email"); return; }
      setSent(true);
    } catch {
      toast.error("Erro ao enviar email. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Recuperar senha."
      description={
        sent
          ? "Verifique seu email."
          : "Informe seu email e enviaremos um link para criar uma nova senha."
      }
    >
      {sent ? (
        <Card role="status" className="flex flex-col gap-5 p-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-success/15 text-success">
            <MailCheck className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 ref={sentHeadingRef} tabIndex={-1} className="font-display text-h3 text-text focus:outline-none">Email enviado.</h2>
            <p className="mt-1 text-sm text-text-2">
              Se esse email estiver cadastrado, você receberá as instruções em breve.
              Verifique também a pasta de spam.
            </p>
          </div>
          <Button asChild variant="secondary" size="lg" className="w-full" leftIcon={<ArrowLeft className="h-4 w-4" aria-hidden />}>
            <Link href="/auth/login">Voltar para o login</Link>
          </Button>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Field id="email" label="Email">
            {(control) => (
              <Input
                {...control}
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required autoComplete="email"
              />
            )}
          </Field>
          <Button type="submit" variant="signal" size="lg" className="w-full" loading={loading}>
            Enviar link de recuperação
          </Button>
          <div className="text-center">
            <Link href="/auth/login" className={`${authLinkClass} gap-1.5 text-sm`}>
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Voltar para o login
            </Link>
          </div>
        </form>
      )}
    </AuthShell>
  );
}
