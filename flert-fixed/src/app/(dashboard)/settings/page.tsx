"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { m, AnimatePresence } from "framer-motion";
import { Bell, Shield, Trash2, LogOut, AlertTriangle, Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { PageHeader } from "@/components/ui/page-header";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
    desc: "Os dados trafegam por HTTPS e ficam num banco de dados gerenciado.",
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
  const [revokeOpen, setRevokeOpen] = useState(false);
  const deleteTriggerRef = useRef<HTMLButtonElement>(null);
  const confirmInputRef = useRef<HTMLInputElement>(null);
  const returnFocusToTrigger = useRef(false);
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
    returnFocusToTrigger.current = true;
  };

  // Foco: abrir o painel leva à confirmação; cancelar devolve ao botão "Excluir conta".
  useEffect(() => {
    if (deleteOpen) {
      confirmInputRef.current?.focus();
    } else if (returnFocusToTrigger.current) {
      returnFocusToTrigger.current = false;
      deleteTriggerRef.current?.focus();
    }
  }, [deleteOpen]);

  return (
    <m.div className="mx-auto w-full max-w-2xl space-y-6" variants={container} initial="hidden" animate="show">
      {/* ── Header ── */}
      <m.div variants={item}>
        <PageHeader
          eyebrow="Conta"
          title="Configurações"
          description="Privacidade, sessões e dados da sua conta"
          className="mb-0"
        />
      </m.div>

      {/* ── Notificações (honesto: ainda não há preferências configuráveis) ── */}
      <m.section variants={item} aria-labelledby="settings-notifications" className="overflow-hidden rounded-lg border border-border bg-surface shadow-1">
        <div className="border-b border-border px-4 py-4 sm:px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-violet-500/15">
              <Bell className="h-4 w-4 text-violet-400" aria-hidden />
            </div>
            <div className="min-w-0">
              <h2 id="settings-notifications" className="font-display text-h3 text-text">Notificações</h2>
              <p className="text-sm text-text-2">O que enviamos para você hoje</p>
            </div>
          </div>
        </div>
        <div className="px-4 py-4 sm:px-5">
          <p className="text-sm leading-relaxed text-text-2">
            Enviamos e-mails sobre a sua conta (boas-vindas, confirmação de pagamento, redefinição de senha, exclusão
            de conta e avisos sobre o seu plano) e, de vez em quando, novidades do Flert IA. Preferências de notificação
            personalizáveis ainda não estão disponíveis.
          </p>
        </div>
      </m.section>

      {/* ── Privacidade ── */}
      <m.section variants={item} aria-labelledby="settings-privacy" className="overflow-hidden rounded-lg border border-border bg-surface shadow-1">
        <div className="border-b border-border px-4 py-4 sm:px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-violet-500/15">
              <Shield className="h-4 w-4 text-violet-400" aria-hidden />
            </div>
            <div className="min-w-0">
              <h2 id="settings-privacy" className="font-display text-h3 text-text">Privacidade e Segurança</h2>
              <p className="text-sm text-text-2">Como seus dados são tratados</p>
            </div>
          </div>
        </div>
        <div className="space-y-3 px-4 py-4 sm:px-5">
          {PRIVACY_FACTS.map((p) => (
            <div key={p.title} className="rounded-md border border-border bg-surface-2 p-3.5">
              <p className="text-sm font-medium text-text">{p.title}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-text-2">{p.desc}</p>
            </div>
          ))}
          <Button
            variant="outline"
            leftIcon={<Cookie className="h-4 w-4" aria-hidden />}
            onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))}
          >
            Gerenciar cookies
          </Button>
        </div>
      </m.section>

      {/* ── Zona de perigo ── */}
      <m.section variants={item} aria-labelledby="settings-danger" className="overflow-hidden rounded-lg border border-danger/30 bg-surface shadow-1">
        <div className="border-b border-danger/20 px-4 py-4 sm:px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-danger/15">
              <Trash2 className="h-4 w-4 text-danger" aria-hidden />
            </div>
            <div className="min-w-0">
              <h2 id="settings-danger" className="font-display text-h3 text-danger">Zona de Perigo</h2>
              <p className="text-sm text-text-2">Ações que afetam sua conta</p>
            </div>
          </div>
        </div>
        <div className="space-y-4 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-text">Sair de todos os dispositivos</p>
              <p className="text-sm text-text-2">Encerra todas as sessões abertas, inclusive esta</p>
            </div>
            <Button
              variant="outline"
              className="shrink-0"
              onClick={() => setRevokeOpen(true)}
              loading={revoking}
              leftIcon={<LogOut className="h-4 w-4" aria-hidden />}
            >
              Sair de tudo
            </Button>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-danger">Excluir conta</p>
                <p className="text-sm text-text-2">Exclui permanentemente sua conta e o histórico de análises</p>
              </div>
              {!deleteOpen && (
                <Button
                  ref={deleteTriggerRef}
                  variant="danger"
                  className="shrink-0"
                  onClick={() => setDeleteOpen(true)}
                  leftIcon={<Trash2 className="h-4 w-4" aria-hidden />}
                >
                  Excluir conta
                </Button>
              )}
            </div>

            <AnimatePresence>
              {deleteOpen && (
                <m.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 28 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-4 rounded-md border border-danger/30 bg-danger/10 p-4">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-danger" aria-hidden />
                      <p className="text-sm leading-relaxed text-text-2">
                        Esta ação é <strong className="text-text">irreversível</strong>. Seu perfil, histórico de análises e dados de assinatura
                        serão excluídos. Um plano ativo não é reembolsado automaticamente.
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="confirm-delete" className="text-sm text-text">
                        Digite <strong>{DELETE_CONFIRMATION}</strong> para confirmar
                      </Label>
                      <Input
                        ref={confirmInputRef}
                        id="confirm-delete"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        autoComplete="off"
                      />
                    </div>
                    {hasPassword && (
                      <div className="space-y-1.5">
                        <Label htmlFor="delete-password" className="text-sm text-text">Sua senha</Label>
                        <PasswordInput
                          id="delete-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          autoComplete="current-password"
                        />
                      </div>
                    )}
                    <div className="flex flex-col-reverse gap-2 sm:flex-row">
                      <Button variant="outline" className="flex-1" onClick={closeDelete} disabled={deleteLoading}>
                        Cancelar
                      </Button>
                      <Button
                        variant="danger"
                        className="flex-1"
                        onClick={handleDeleteAccount}
                        loading={deleteLoading}
                        disabled={!canDelete}
                      >
                        {deleteLoading ? "Excluindo..." : "Excluir minha conta"}
                      </Button>
                    </div>
                  </div>
                </m.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </m.section>

      <ConfirmDialog
        open={revokeOpen}
        onOpenChange={(open) => { if (!revoking) setRevokeOpen(open); }}
        title="Sair de todos os dispositivos?"
        description="Todas as sessões abertas serão encerradas, inclusive esta. Você precisará entrar de novo."
        confirmLabel="Sair de todos os dispositivos"
        tone="primary"
        loading={revoking}
        onConfirm={handleRevokeAll}
      />
    </m.div>
  );
}
