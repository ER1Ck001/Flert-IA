"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Shield, Trash2, LogOut, Loader2, AlertTriangle, Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";
import { OPEN_CONSENT_EVENT } from "@/components/consent/ConsentBanner";
import { DELETE_CONFIRMATION } from "@/lib/validation/auth";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 22 } },
};

// Textos verdadeiros sobre o tratamento de dados (antes: "criptografia de ponta a ponta" e
// "nunca compartilhamos com terceiros", o que não era verdade).
const PRIVACY_FACTS = [
  {
    title: "Conexão protegida",
    desc: "Os dados trafegam por HTTPS e ficam em banco de dados com criptografia em repouso do provedor.",
  },
  {
    title: "Processamento por IA",
    desc: "O texto e as imagens que você envia são processados pela OpenAI para gerar as sugestões. As imagens não ficam salvas no Flert IA; o histórico guarda só as sugestões geradas.",
  },
  {
    title: "Pagamentos",
    desc: "Processados pela AbacatePay. Não armazenamos dados de cartão.",
  },
  {
    title: "Você no controle",
    desc: "Você pode apagar análises do histórico ou excluir a conta a qualquer momento.",
  },
];

export default function SettingsPage() {
  // null = ainda carregando (não bloquear contas Google nem pedir senha à toa).
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setHasPassword(d ? d.user?.hasPassword !== false : true))
      .catch(() => setHasPassword(true));
  }, []);

  const handleRevokeAll = async () => {
    setRevoking(true);
    try {
      const res = await fetch("/api/account/sessions/revoke", { method: "POST" });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || "Erro ao encerrar as sessões");
      toast.success("Sessões encerradas em todos os dispositivos.");
      await signOut({ callbackUrl: "/auth/login" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao encerrar as sessões");
      setRevoking(false);
    }
  };

  const canDelete =
    hasPassword !== null && confirmText === DELETE_CONFIRMATION && (!hasPassword || password.length > 0);

  const handleDeleteAccount = async () => {
    if (!canDelete) return;
    setDeleteLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: confirmText, ...(hasPassword ? { password } : {}) }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || "Erro ao excluir conta");
      toast.success("Conta excluída. Até logo!");
      await signOut({ callbackUrl: "/" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao excluir conta");
      setDeleteLoading(false);
    }
  };

  const closeDelete = () => {
    setDeleteOpen(false);
    setConfirmText("");
    setPassword("");
  };

  return (
    <motion.div className="max-w-2xl space-y-8" variants={container} initial="hidden" animate="show">
      {/* ── Header ── */}
      <motion.div variants={item}>
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Conta</p>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Configurações</h1>
        <p className="text-muted-foreground text-sm mt-1">Privacidade, sessões e dados da sua conta</p>
      </motion.div>

      {/* ── Notificações (honesto: ainda não há preferências configuráveis) ── */}
      <motion.div variants={item} className="rounded-2xl border border-border/40 bg-card/20 overflow-hidden">
        <div className="px-5 py-4 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-muted/80 flex items-center justify-center">
              <Bell className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Notificações</p>
              <p className="text-xs text-muted-foreground">O que enviamos para você hoje</p>
            </div>
          </div>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Enviamos e-mails apenas sobre a sua conta: boas-vindas, confirmação de pagamento, redefinição de senha,
            exclusão de conta e avisos sobre o seu plano. Preferências de notificação personalizáveis ainda não estão
            disponíveis.
          </p>
        </div>
      </motion.div>

      {/* ── Privacidade ── */}
      <motion.div variants={item} className="rounded-2xl border border-border/40 bg-card/20 overflow-hidden">
        <div className="px-5 py-4 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-muted/80 flex items-center justify-center">
              <Shield className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Privacidade e Segurança</p>
              <p className="text-xs text-muted-foreground">Como seus dados são tratados</p>
            </div>
          </div>
        </div>
        <div className="px-5 py-4 space-y-3">
          {PRIVACY_FACTS.map((p) => (
            <div key={p.title} className="p-3.5 rounded-xl bg-muted/30 border border-border/30">
              <p className="text-sm font-medium text-foreground">{p.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{p.desc}</p>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))}
          >
            <Cookie className="h-3 w-3" />
            Gerenciar cookies
          </Button>
        </div>
      </motion.div>

      {/* ── Zona de perigo ── */}
      <motion.div variants={item} className="rounded-2xl border border-destructive/20 bg-card/20 overflow-hidden">
        <div className="px-5 py-4 border-b border-destructive/15">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-destructive/10 flex items-center justify-center">
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </div>
            <div>
              <p className="text-sm font-semibold text-destructive">Zona de Perigo</p>
              <p className="text-xs text-muted-foreground">Ações que afetam sua conta</p>
            </div>
          </div>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div className="flex items-center justify-between gap-4 py-2 border-b border-border/30">
            <div>
              <p className="text-sm font-medium text-foreground">Sair de todos os dispositivos</p>
              <p className="text-xs text-muted-foreground">Encerra todas as sessões abertas, inclusive esta</p>
            </div>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 shrink-0" onClick={handleRevokeAll} disabled={revoking}>
              {revoking ? <Loader2 className="h-3 w-3 animate-spin" /> : <LogOut className="h-3 w-3" />}
              Sair de tudo
            </Button>
          </div>

          <div className="py-2 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-destructive">Excluir conta</p>
                <p className="text-xs text-muted-foreground">Exclui permanentemente sua conta e o histórico de análises</p>
              </div>
              {!deleteOpen && (
                <Button variant="destructive" size="sm" className="h-8 text-xs gap-1.5 shrink-0" onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="h-3 w-3" />
                  Excluir conta
                </Button>
              )}
            </div>

            <AnimatePresence>
              {deleteOpen && (
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
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Esta ação é <strong>irreversível</strong>. Seu perfil, histórico de análises e dados de assinatura
                        serão excluídos. Um plano ativo não é reembolsado automaticamente.
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="confirm-delete" className="text-xs">
                        Digite <strong>{DELETE_CONFIRMATION}</strong> para confirmar
                      </Label>
                      <Input
                        id="confirm-delete"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        autoComplete="off"
                        className="h-9"
                      />
                    </div>
                    {hasPassword && (
                      <div className="space-y-1.5">
                        <Label htmlFor="delete-password" className="text-xs">Sua senha</Label>
                        <Input
                          id="delete-password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          autoComplete="current-password"
                          className="h-9"
                        />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="h-8 text-xs flex-1" onClick={closeDelete} disabled={deleteLoading}>
                        Cancelar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-8 text-xs flex-1"
                        onClick={handleDeleteAccount}
                        disabled={deleteLoading || !canDelete}
                      >
                        {deleteLoading ? (
                          <>
                            <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                            Excluindo...
                          </>
                        ) : (
                          "Excluir minha conta"
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
