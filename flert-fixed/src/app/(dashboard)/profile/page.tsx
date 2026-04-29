"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { User, Mail, Camera, Save, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import toast from "react-hot-toast";

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
      } catch {
        // silently fail — session data is still usable
      }
    };

    if (session?.user) {
      setFormData({
        name: session.user.name || "",
        email: session.user.email || "",
      });
      loadProfile();
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: Record<string, string> = {
        name: formData.name,
        email: formData.email,
      };

      if (passwordData.newPassword && passwordData.currentPassword) {
        payload.currentPassword = passwordData.currentPassword;
        payload.newPassword = passwordData.newPassword;
      }

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao atualizar perfil");
      }

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

  const planLabel: Record<string, string> = {
    FREE: "Grátis",
    PREMIUM: "Premium",
    LIFETIME: "Vitalício",
  };

  const planColor: Record<string, string> = {
    FREE: "bg-muted text-muted-foreground",
    PREMIUM: "bg-brand-500/10 text-brand-500",
    LIFETIME: "bg-yellow-500/10 text-yellow-500",
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Perfil</h1>
        <p className="text-muted-foreground mt-1">Gerencie suas informações pessoais</p>
      </div>

      <Card className="border-border/50">
        <CardHeader className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-4">
            <Avatar className="w-24 h-24">
              <AvatarImage src={session?.user?.image || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-brand-500 to-purple-500 text-white text-2xl font-semibold">
                {getInitials(session?.user?.name)}
              </AvatarFallback>
            </Avatar>
            <button className="absolute bottom-0 right-0 p-2 rounded-full bg-brand-500 text-white hover:bg-brand-600 transition-colors shadow-lg">
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <CardTitle>Informações Pessoais</CardTitle>
          <CardDescription>Atualize seus dados de perfil</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="pl-10"
                  required
                  minLength={2}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="border-t border-border/50 pt-4 space-y-4">
              <p className="text-sm font-medium text-muted-foreground">
                Alterar senha (opcional)
              </p>
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Senha atual</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="pl-10"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="pl-10"
                    placeholder="••••••••"
                    minLength={6}
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" variant="brand" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Conta</CardTitle>
          <CardDescription>Informações da sua conta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-border/50">
            <div>
              <p className="font-medium">Plano atual</p>
              <p className="text-sm text-muted-foreground">Sua assinatura atual</p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${planColor[subscriptionStatus] || planColor.FREE}`}
            >
              {planLabel[subscriptionStatus] || "Grátis"}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-border/50">
            <div>
              <p className="font-medium">Tipo de conta</p>
              <p className="text-sm text-muted-foreground">Método de autenticação</p>
            </div>
            <span className="text-sm text-muted-foreground">
              {session?.user?.image?.includes("googleusercontent") ? "Google" : "Email"}
            </span>
          </div>
          <div className="flex justify-between items-center py-3">
            <div>
              <p className="font-medium">Email</p>
              <p className="text-sm text-muted-foreground">Conta cadastrada</p>
            </div>
            <span className="text-sm text-muted-foreground truncate max-w-[200px]">
              {session?.user?.email}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
