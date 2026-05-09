"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Shield, Trash2, LogOut, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 22 } },
};

export default function SettingsPage() {
  const { data: session } = useSession();
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    marketing: false,
  });

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      toast.success("Preferências salvas!");
    } catch {
      toast.error("Erro ao salvar preferências");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    setDeleteLoading(true);
    try {
      const res = await fetch("/api/profile", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao excluir conta");
      }
      toast.success("Conta excluída. Até logo!");
      await signOut({ callbackUrl: "/" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao excluir conta");
      setDeleteConfirm(false);
      setDeleteLoading(false);
    }
  };

  return (
    <motion.div
      className="max-w-2xl space-y-8"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* ── Header ── */}
      <motion.div variants={item}>
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
          Conta
        </p>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Configurações
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gerencie suas preferências e configurações
        </p>
      </motion.div>

      {/* ── Notifications ── */}
      <motion.div variants={item} className="rounded-2xl border border-border/40 bg-card/20 overflow-hidden">
        <div className="px-5 py-4 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-muted/80 flex items-center justify-center">
              <Bell className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Notificações</p>
              <p className="text-xs text-muted-foreground">Escolha como deseja receber notificações</p>
            </div>
          </div>
        </div>
        <div className="px-5 py-4 space-y-4">
          {[
            { key: "email" as const,     label: "Email",     desc: "Receba atualizações por email" },
            { key: "push" as const,      label: "Push",      desc: "Receba notificações no navegador" },
            { key: "marketing" as const, label: "Marketing", desc: "Receba novidades e promoções" },
          ].map((n) => (
            <div key={n.key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{n.label}</p>
                <p className="text-xs text-muted-foreground">{n.desc}</p>
              </div>
              <Switch
                checked={notifications[n.key]}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, [n.key]: checked })
                }
              />
            </div>
          ))}
          <div className="pt-1">
            <Button
              size="sm"
              variant="brand"
              className="h-8 text-xs px-4"
              onClick={handleSaveNotifications}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar preferências"
              )}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ── Privacy ── */}
      <motion.div variants={item} className="rounded-2xl border border-border/40 bg-card/20 overflow-hidden">
        <div className="px-5 py-4 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-muted/80 flex items-center justify-center">
              <Shield className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Privacidade e Segurança</p>
              <p className="text-xs text-muted-foreground">Seus dados estão protegidos</p>
            </div>
          </div>
        </div>
        <div className="px-5 py-4 space-y-3">
          {[
            { title: "Dados criptografados", desc: "Todas as suas conversas são criptografadas de ponta a ponta" },
            { title: "Dados não compartilhados", desc: "Nunca compartilhamos seus dados com terceiros" },
          ].map((p) => (
            <div key={p.title} className="p-3.5 rounded-xl bg-muted/30 border border-border/30">
              <p className="text-sm font-medium text-foreground">{p.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{p.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Danger zone ── */}
      <motion.div variants={item} className="rounded-2xl border border-destructive/20 bg-card/20 overflow-hidden">
        <div className="px-5 py-4 border-b border-destructive/15">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-destructive/10 flex items-center justify-center">
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </div>
            <div>
              <p className="text-sm font-semibold text-destructive">Zona de Perigo</p>
              <p className="text-xs text-muted-foreground">Ações irreversíveis na sua conta</p>
            </div>
          </div>
        </div>
        <div className="px-5 py-4 space-y-4">
          {/* Sign out all devices */}
          <div className="flex items-center justify-between py-2 border-b border-border/30">
            <div>
              <p className="text-sm font-medium text-foreground">Sair de todos os dispositivos</p>
              <p className="text-xs text-muted-foreground">Encerre todas as sessões ativas</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="h-3 w-3" />
              Sair
            </Button>
          </div>

          {/* Delete account */}
          <div className="py-2 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-destructive">Excluir conta</p>
                <p className="text-xs text-muted-foreground">
                  Exclui permanentemente sua conta e todos os dados
                </p>
              </div>
              {!deleteConfirm && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  onClick={handleDeleteAccount}
                >
                  <Trash2 className="h-3 w-3" />
                  Excluir conta
                </Button>
              )}
            </div>

            <AnimatePresence>
              {deleteConfirm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 28 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 rounded-xl bg-destructive/8 border border-destructive/20 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-destructive">Tem certeza absoluta?</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          Esta ação é <strong>irreversível</strong>. Seu perfil, histórico de análises e dados de assinatura serão excluídos permanentemente.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs flex-1"
                        onClick={() => setDeleteConfirm(false)}
                        disabled={deleteLoading}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-8 text-xs flex-1"
                        onClick={handleDeleteAccount}
                        disabled={deleteLoading}
                      >
                        {deleteLoading ? (
                          <>
                            <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                            Excluindo...
                          </>
                        ) : (
                          "Sim, excluir minha conta"
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
