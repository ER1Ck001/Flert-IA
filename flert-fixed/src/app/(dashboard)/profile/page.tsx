"use client";

import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { User, Mail, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import toast from "react-hot-toast";
import { PLAN_LABELS } from "@/lib/plans";
import { PASSWORD_RULES_HINT, normalizeEmail, profileUpdateSchema } from "@/lib/validation/auth";

function getInitials(name: string | null | undefined) {
  if (!name) return "U";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [subscriptionStatus, setSubscriptionStatus] = useState("FREE");
  const [isExpired, setIsExpired] = useState(false);
  const [hasPassword, setHasPassword] = useState(true);
  const [savedEmail, setSavedEmail] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) return;
        const data = await res.json();
        setFormData({
          name: data.user.name || "",
          email: data.user.email || "",
        });
        setSubscriptionStatus(data.user.subscriptionStatus || "FREE");
        setIsExpired(Boolean(data.user.isExpired));
        setHasPassword(data.user.hasPassword !== false);
        setSavedEmail(data.user.email || "");
      } catch {
        // silently fail — session data is still usable
      }
    };

    if (session?.user) {
      setFormData({
        name: session.user.name || "",
        email: session.user.email || "",
      });
      // Base para detectar troca de e-mail mesmo se o GET /api/profile falhar.
      setSavedEmail((prev) => prev || session.user?.email || "");
      loadProfile();
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mesmas regras do servidor (src/lib/validation/auth.ts).
    const parsed = profileUpdateSchema.safeParse({ ...formData, ...passwordData });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    const emailChanged = parsed.data.email !== normalizeEmail(savedEmail);
    if (emailChanged && !parsed.data.currentPassword) {
      toast.error("Informe a senha atual para alterar o e-mail.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao atualizar perfil");
      }

      // Trocar senha ou e-mail encerra todas as sessões (inclusive esta): volta ao login.
      if (emailChanged || parsed.data.newPassword) {
        toast.success("Dados de acesso alterados. Entre novamente.");
        await signOut({ callbackUrl: "/auth/login" });
        return;
      }
      setSavedEmail(data.user.email || parsed.data.email);
      await update();
      toast.success("Perfil atualizado com sucesso!");
      setPasswordData({ currentPassword: "", newPassword: "" });
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar perfil");
    } finally {
      setLoading(false);
    }
  };

  const planLabel: Record<string, string> = PLAN_LABELS;

  const planVariant: Record<string, BadgeProps["variant"]> = {
    FREE: "neutral",
    PREMIUM: "violet",
    ANNUAL: "violet",
    LIFETIME: "pink",
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <PageHeader eyebrow="Sua conta" title="Perfil" description="Gerencie suas informações pessoais" className="mb-2" />

      <Card>
        <CardHeader className="items-center p-4 text-center sm:p-6">
          <Avatar className="mb-3 h-24 w-24 ring-2 ring-violet-500/40 ring-offset-2 ring-offset-surface">
            <AvatarImage src={session?.user?.image || undefined} alt="" />
            <AvatarFallback className="bg-signal font-display text-2xl font-bold text-white">
              {getInitials(session?.user?.name)}
            </AvatarFallback>
          </Avatar>
          <CardTitle>Informações pessoais</CardTitle>
          <CardDescription>Atualize seus dados de perfil</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Field label="Nome" id="name">
              {(control) => (
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-3" aria-hidden />
                  <Input
                    {...control}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pl-11"
                    autoComplete="name"
                    required
                    minLength={2}
                  />
                </div>
              )}
            </Field>

            <Field
              label="E-mail"
              id="email"
              hint={
                hasPassword
                  ? "Para trocar o e-mail, informe também a senha atual abaixo."
                  : "Contas criadas com Google não podem alterar o e-mail."
              }
            >
              {(control) => (
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-3" aria-hidden />
                  <Input
                    {...control}
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-11"
                    autoComplete="email"
                    required
                    maxLength={254}
                    disabled={!hasPassword}
                  />
                </div>
              )}
            </Field>

            {hasPassword && (
              <div role="group" aria-labelledby="password-group-title" className="space-y-4 border-t border-border pt-5">
                <p id="password-group-title" className="text-sm font-medium text-text-2">
                  Senha atual (obrigatória para trocar e-mail ou senha)
                </p>
                <Field label="Senha atual" id="currentPassword">
                  {(control) => (
                    <PasswordInput
                      {...control}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      autoComplete="current-password"
                      placeholder="••••••••"
                    />
                  )}
                </Field>
                <Field label="Nova senha" id="newPassword" hint={PASSWORD_RULES_HINT}>
                  {(control) => (
                    <PasswordInput
                      {...control}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      autoComplete="new-password"
                      minLength={8}
                      maxLength={72}
                    />
                  )}
                </Field>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              variant="signal"
              loading={loading}
              leftIcon={<Save className="h-4 w-4" aria-hidden />}
            >
              {loading ? "Salvando..." : "Salvar alterações"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle>Conta</CardTitle>
          <CardDescription>Informações da sua conta</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <dl className="divide-y divide-border">
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="min-w-0">
                <span className="block font-medium text-text">Plano atual</span>
                <span className="block text-sm text-text-2">Sua assinatura atual</span>
              </dt>
              <dd>
                <Badge
                  variant={isExpired ? "warning" : planVariant[subscriptionStatus] || planVariant.FREE}
                  className="text-sm"
                >
                  {isExpired ? "Expirado" : planLabel[subscriptionStatus] || PLAN_LABELS.FREE}
                </Badge>
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="min-w-0">
                <span className="block font-medium text-text">Tipo de conta</span>
                <span className="block text-sm text-text-2">Método de autenticação</span>
              </dt>
              <dd className="text-sm text-text-2">{hasPassword ? "E-mail e senha" : "Google"}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="shrink-0">
                <span className="block font-medium text-text">E-mail</span>
                <span className="block text-sm text-text-2">Conta cadastrada</span>
              </dt>
              <dd className="min-w-0 truncate text-sm text-text-2">{session?.user?.email}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
