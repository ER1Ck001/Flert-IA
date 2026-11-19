"use client";

import { Fragment, useState, useEffect, useMemo, useCallback } from "react";
import { m } from "framer-motion";
import {
  Users, Search, Trash2, Crown, Zap, Star,
  Copy, Check, RefreshCw, Shield, Activity,
  ChevronDown, ChevronUp, LogOut, Mail, Download,
  UserPlus, DollarSign, X, ChevronRight,
  Clock, LayoutDashboard, Send, AlertCircle,
} from "lucide-react";
import { signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { FREE_UPSELL_SUBJECT } from "@/lib/email/templates";
import { PLAN_CONFIG, formatBRL } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

type Plan = "FREE" | "PREMIUM" | "ANNUAL" | "LIFETIME";

type AdminUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  createdAt: string;
  loginMethod: "email" | "google";
  subscription: Plan;
  activatedAt: string | null;
  expiresAt: string | null;
  analysisCount: number;
  /** Aceitou e-mails promocionais (só esses recebem campanhas). */
  marketingOptIn: boolean;
};

/** Resultado acumulado de um envio em massa feito em várias chamadas (ver /api/admin/email). */
type CampaignProgress = {
  template: string;
  /** Payload da 1ª chamada (sem cursor), repetido nas continuações. */
  payload: Record<string, string>;
  sent: number;
  failed: number;
  total: number;
  remaining: number;
  nextCursor: string | null;
};

type Stats = {
  total: number;
  free: number;
  premium: number;
  annual: number;
  lifetime: number;
  totalAnalyses: number;
};

const planConfig: Record<Plan, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  FREE:     { label: "Grátis",    color: "text-text-2",     bg: "bg-surface-2",      border: "border-border",         icon: Shield },
  PREMIUM:  { label: "Mensal",    color: "text-brand-400",  bg: "bg-brand-500/15",   border: "border-brand-500/30",   icon: Zap    },
  ANNUAL:   { label: "Anual",     color: "text-violet-400", bg: "bg-violet-500/15",  border: "border-violet-500/30",  icon: Star   },
  LIFETIME: { label: "Vitalício", color: "text-warning",    bg: "bg-warning/15",     border: "border-warning/30",     icon: Crown  },
};

// Receita mensal estimada por usuário (Vitalício é pagamento único: fora do MRR).
const PLAN_PRICES = { FREE: 0, PREMIUM: PLAN_CONFIG.PREMIUM.priceCents / 100, ANNUAL: PLAN_CONFIG.ANNUAL.priceCents / 100 / 12, LIFETIME: 0 };

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function daysUntil(dateStr: string | null) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

/** Nome para rótulos acessíveis ("Excluir usuário Ana"). */
function who(user: AdminUser) {
  return user.name ?? user.email ?? "sem nome";
}

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-bg";
const fieldClass =
  "w-full rounded-md border border-border bg-surface-2 px-3 text-base text-text placeholder:text-text-3 transition-colors " +
  "focus-visible:outline-none focus-visible:border-violet-400 focus-visible:ring-2 focus-visible:ring-violet-400/40";
const labelClass = "mb-2 block text-sm font-medium text-text";
const iconBtn =
  "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-text-2 transition-colors hover:bg-surface-2 hover:text-text " +
  focusRing;

function UserAvatar({ user }: { user: AdminUser }) {
  const letter = (user.name ?? user.email ?? "?")[0].toUpperCase();
  if (user.image) {
    return <Image src={user.image} alt="" width={32} height={32} className="rounded-full object-cover flex-shrink-0" />;
  }
  return (
    <div aria-hidden className="h-8 w-8 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 text-xs font-bold flex-shrink-0">
      {letter}
    </div>
  );
}

function SortIcon({ field, current, asc }: { field: string; current: string; asc: boolean }) {
  if (field !== current) return <ChevronDown className="h-3.5 w-3.5 opacity-30" aria-hidden />;
  return asc ? <ChevronUp className="h-3.5 w-3.5 text-brand-400" aria-hidden /> : <ChevronDown className="h-3.5 w-3.5 text-brand-400" aria-hidden />;
}

export default function AdminPage() {
  const [users, setUsers]           = useState<AdminUser[]>([]);
  const [stats, setStats]           = useState<Stats | null>(null);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [filterPlan, setFilterPlan] = useState<Plan | "ALL">("ALL");
  const [sortBy, setSortBy]         = useState<string>("joined");
  const [sortAsc, setSortAsc]       = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [planMenuId, setPlanMenuId] = useState<string | null>(null);
  const [copiedId, setCopiedId]     = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Email campaigns state
  const [activeTab, setActiveTab]             = useState<"users" | "email">("users");
  const [confirmTemplate, setConfirmTemplate] = useState<string | null>(null);
  const [sendingTemplate, setSendingTemplate] = useState<string | null>(null);
  const [customTarget, setCustomTarget]       = useState<string>("FREE");
  const [customSubject, setCustomSubject]     = useState<string>("");
  const [customBody, setCustomBody]           = useState<string>("");
  // Envio em massa em lotes: a API para antes do limite de tempo e devolve o que falta + cursor.
  const [campaignProgress, setCampaignProgress] = useState<CampaignProgress | null>(null);

  // Single-user email modal
  const [emailModal, setEmailModal]       = useState<AdminUser | null>(null);
  const [modalTemplate, setModalTemplate] = useState<"free_upsell" | "expiring" | "custom">("free_upsell");
  const [modalSubject, setModalSubject]   = useState("");
  const [modalBody, setModalBody]         = useState("");
  const [sendingModal, setSendingModal]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/admin/users");
      const data = await res.json();
      setUsers(data.users ?? []);
      setStats(data.stats ?? null);
    } catch { toast.error("Erro ao carregar dados"); }
    finally   { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Fecha o seletor de plano ao clicar fora dele ou com Esc. Usa data-plan-menu (o controle
  // existe tanto no cartão mobile quanto na tabela md+, então um único ref não serve).
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as Element | null)?.closest?.("[data-plan-menu]")) {
        setPlanMenuId(null);
      }
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setPlanMenuId(null); };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // Derived stats
  const weekAgo     = Date.now() - 7 * 86400000;
  const newThisWeek = users.filter(u => new Date(u.createdAt).getTime() >= weekAgo).length;
  const paidUsers   = users.filter(u => u.subscription !== "FREE").length;
  const mrr         = users.reduce((acc, u) => acc + (PLAN_PRICES[u.subscription] ?? 0), 0);

  // Email campaign counts — promocionais só para quem deu opt-in (o servidor aplica o mesmo filtro);
  // o aviso de plano vencendo é transacional e conta todos com plano vencendo.
  const optedIn       = users.filter(u => u.marketingOptIn);
  const freeCount     = optedIn.filter(u => u.subscription === "FREE").length;
  const expiringCount = users.filter(u => {
    if (!u.expiresAt || u.subscription === "FREE" || u.subscription === "LIFETIME") return false;
    const d = daysUntil(u.expiresAt);
    return d !== null && d >= 0 && d <= 7;
  }).length;
  const customCount = customTarget === "ALL"
    ? optedIn.length
    : optedIn.filter(u => u.subscription === customTarget).length;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users
      .filter(u => {
        const matchSearch = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
        const matchPlan   = filterPlan === "ALL" || u.subscription === filterPlan;
        return matchSearch && matchPlan;
      })
      .sort((a, b) => {
        const dir = sortAsc ? 1 : -1;
        switch (sortBy) {
          case "name":     return dir * (a.name ?? "").localeCompare(b.name ?? "");
          case "email":    return dir * (a.email ?? "").localeCompare(b.email ?? "");
          case "plan":     return dir * a.subscription.localeCompare(b.subscription);
          case "analyses": return dir * (a.analysisCount - b.analysisCount);
          case "joined":   return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          default:         return 0;
        }
      });
  }, [users, search, filterPlan, sortBy, sortAsc]);

  const toggleSort = (field: string) => {
    if (sortBy === field) setSortAsc(p => !p);
    else { setSortBy(field); setSortAsc(true); }
  };

  const copyEmail = (email: string, id: string) => {
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    toast.success("Email copiado!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deleteUser = async (id: string) => {
    setDeletingId(id);
    try {
      const res  = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers(prev => prev.filter(u => u.id !== id));
      if (stats) setStats({ ...stats, total: stats.total - 1 });
      toast.success("Usuário excluído");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
    finally { setDeletingId(null); setConfirmDeleteId(null); }
  };

  const changePlan = async (id: string, plan: Plan) => {
    setUpdatingId(id);
    setPlanMenuId(null);
    try {
      const res  = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, subscription: plan } : u));
      toast.success(`Plano alterado para ${planConfig[plan].label}!`);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
    finally { setUpdatingId(null); }
  };

  const openEmailModal = (user: AdminUser) => {
    setEmailModal(user);
    setModalTemplate("free_upsell");
    setModalSubject("");
    setModalBody("");
  };

  const sendToUser = async () => {
    if (!emailModal) return;
    if (modalTemplate === "custom" && (!modalSubject.trim() || !modalBody.trim())) {
      toast.error("Preencha assunto e mensagem");
      return;
    }
    setSendingModal(true);
    try {
      const payload: Record<string, string> = { template: modalTemplate, userId: emailModal.id };
      if (modalTemplate === "custom") {
        payload.customSubject = modalSubject;
        payload.customBody    = modalBody;
      }
      const res  = await fetch("/api/admin/email", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      data.failed > 0 ? toast.error("Falha ao enviar") : toast.success("Email enviado!");
      setEmailModal(null);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro ao enviar"); }
    finally { setSendingModal(false); }
  };

  const sendCampaign = async (templateId: string, resume?: CampaignProgress) => {
    setSendingTemplate(templateId);
    try {
      // Continuação: reaproveita exatamente o payload da 1ª chamada, só com o cursor.
      const payload: Record<string, string> = resume ? { ...resume.payload } : { template: templateId };
      if (!resume && templateId === "custom") {
        if (!customSubject.trim() || !customBody.trim()) {
          toast.error("Preencha assunto e mensagem");
          return;
        }
        payload.customSubject = customSubject;
        payload.customBody    = customBody;
        payload.targetPlan    = customTarget;
      }
      const basePayload = { ...payload };
      if (resume?.nextCursor) payload.cursor = resume.nextCursor;
      const res  = await fetch("/api/admin/email", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const sent      = (resume?.sent ?? 0) + (Number(data.sent) || 0);
      const failed    = (resume?.failed ?? 0) + (Number(data.failed) || 0);
      const remaining = Number(data.remaining) || 0;
      const nextCursor = remaining > 0 && typeof data.nextCursor === "string" ? data.nextCursor : null;
      setCampaignProgress({ template: templateId, payload: basePayload, sent, failed, total: Number(data.total) || 0, remaining, nextCursor });
      if (nextCursor) {
        toast.success(`${sent} enviados até agora. Faltam ${remaining}: clique em “Continuar envio”.`);
      } else {
        const msg = failed > 0
          ? `${sent} enviados, ${failed} falharam (de ${data.total})`
          : `${sent} email${sent !== 1 ? "s" : ""} enviados!`;
        failed > 0 ? toast.error(msg) : toast.success(msg);
        if (templateId === "custom") { setCustomSubject(""); setCustomBody(""); }
      }
      setConfirmTemplate(null);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro ao enviar"); }
    finally { setSendingTemplate(null); }
  };

  const exportCSV = () => {
    const headers = ["Nome", "Email", "Plano", "Login", "Análises", "Cadastro", "Expira em"];
    const rows    = filtered.map(u => [
      u.name ?? "",
      u.email ?? "",
      planConfig[u.subscription].label,
      u.loginMethod === "google" ? "Google" : "Email",
      u.analysisCount,
      fmt(u.createdAt),
      u.expiresAt ? fmt(u.expiresAt) : "Sem expiração",
    ]);
    const csv  = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `flertia-users-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado!");
  };

  const statCards = [
    { label: "Total de usuários",  value: stats?.total ?? 0,      icon: Users,       color: "text-text",         sub: `${paidUsers} pagantes` },
    { label: "Novos esta semana",  value: newThisWeek,            icon: UserPlus,    color: "text-success",           sub: "últimos 7 dias" },
    { label: "Grátis",             value: stats?.free ?? 0,       icon: Shield,      color: "text-text-2",    sub: `${stats ? Math.round((stats.free / (stats.total || 1)) * 100) : 0}% do total` },
    { label: "Mensal",             value: stats?.premium ?? 0,    icon: Zap,         color: "text-brand-400",           sub: `${formatBRL(PLAN_CONFIG.PREMIUM.priceCents)}${PLAN_CONFIG.PREMIUM.periodLabel}` },
    { label: "Anual",              value: stats?.annual ?? 0,     icon: Star,        color: "text-violet-400",          sub: `${formatBRL(PLAN_CONFIG.ANNUAL.priceCents)}${PLAN_CONFIG.ANNUAL.periodLabel}` },
    { label: "Vitalício",          value: stats?.lifetime ?? 0,   icon: Crown,       color: "text-warning",           sub: "pagamento único" },
    { label: "MRR estimado",       value: `R$${mrr.toFixed(2).replace(".", ",")}`, icon: DollarSign, color: "text-success", sub: "receita mensal recorrente", raw: true },
    { label: "Total de análises",  value: stats?.totalAnalyses ?? 0, icon: Activity, color: "text-brand-400",          sub: "desde o início" },
  ];

  const visibleCount = filtered.length;
  const planCount = (p: Plan) =>
    stats ? (p === "FREE" ? stats.free : p === "PREMIUM" ? stats.premium : p === "ANNUAL" ? stats.annual : stats.lifetime) : 0;

  // ── Peças compartilhadas entre a tabela (md+) e os cartões (mobile) ──

  // inline=true na tabela: o seletor abre no fluxo (um menu absoluto seria cortado pelo overflow-x-auto).
  const renderPlanControl = (user: AdminUser, inline = false) => {
    const plan = planConfig[user.subscription];
    const PlanIcon = plan.icon;
    const isUpdating = updatingId === user.id;
    const isPlanMenu = planMenuId === user.id;
    return (
      <div className="relative" data-plan-menu>
        <button
          type="button"
          disabled={isUpdating}
          aria-expanded={isPlanMenu}
          aria-label={`Plano de ${who(user)}: ${plan.label}. Alterar plano`}
          onClick={() => setPlanMenuId(isPlanMenu ? null : user.id)}
          className={cn(
            "inline-flex min-h-11 items-center gap-1.5 rounded-md border px-3 text-sm font-semibold transition-opacity hover:opacity-80",
            plan.bg, plan.border, plan.color, focusRing,
            isUpdating && "cursor-wait opacity-50"
          )}
        >
          <PlanIcon className="h-3.5 w-3.5" aria-hidden />
          {plan.label}
          <ChevronDown className="h-3.5 w-3.5 opacity-60" aria-hidden />
        </button>

        {isPlanMenu && (
          <div
            role="group"
            aria-label={`Escolher plano de ${who(user)}`}
            className={cn(
              "mt-1.5 w-44 overflow-hidden rounded-md border border-border-strong bg-surface-2 shadow-2",
              !inline && "absolute left-0 top-full z-50"
            )}
          >
            {(["FREE", "PREMIUM", "ANNUAL", "LIFETIME"] as Plan[]).map(p => {
              const pc = planConfig[p];
              const PI = pc.icon;
              const current = user.subscription === p;
              return (
                <button
                  key={p}
                  type="button"
                  aria-pressed={current}
                  onClick={() => changePlan(user.id, p)}
                  className={cn(
                    "flex min-h-11 w-full items-center gap-2.5 px-3 text-left text-sm font-semibold transition-colors",
                    "focus-visible:outline-none focus-visible:bg-surface-3",
                    current ? cn(pc.bg, pc.color) : "text-text-2 hover:bg-surface-3 hover:text-text"
                  )}
                >
                  <PI className={cn("h-4 w-4 flex-shrink-0", current ? pc.color : "")} aria-hidden />
                  <span>{pc.label}</span>
                  {current && <Check className="ml-auto h-4 w-4" aria-hidden />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderExpiry = (user: AdminUser) => {
    const days = daysUntil(user.expiresAt);
    if (user.subscription === "FREE") return <span className="text-sm text-text-2">—</span>;
    if (user.subscription === "LIFETIME") return <span className="text-sm font-medium text-warning">Sem expiração</span>;
    if (days === null) return <span className="text-sm text-text-2">—</span>;
    if (days < 0) return <span className="text-sm font-semibold text-danger">Expirado</span>;
    if (days <= 7) return <span className="text-sm font-semibold text-warning">em {days} dia{days !== 1 ? "s" : ""}</span>;
    return <span className="text-sm text-text-2">{fmt(user.expiresAt!)}</span>;
  };

  const renderActions = (user: AdminUser) => {
    const isConfirm  = confirmDeleteId === user.id;
    const isDeleting = deletingId === user.id;
    if (isConfirm) {
      return (
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" className="h-11" onClick={() => setConfirmDeleteId(null)} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            size="sm"
            className="h-11"
            loading={isDeleting}
            aria-label={`Confirmar exclusão de ${who(user)}`}
            onClick={() => deleteUser(user.id)}
          >
            Excluir
          </Button>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1">
        {user.email && (
          <button
            type="button"
            onClick={() => openEmailModal(user)}
            className={cn(iconBtn, "hover:bg-brand-500/10 hover:text-brand-400")}
            title="Enviar email"
            aria-label={`Enviar email para ${who(user)}`}
          >
            <Mail className="h-4 w-4" aria-hidden />
          </button>
        )}
        <button
          type="button"
          onClick={() => setConfirmDeleteId(user.id)}
          className={cn(iconBtn, "hover:bg-danger/10 hover:text-danger")}
          title="Excluir usuário"
          aria-label={`Excluir usuário ${who(user)}`}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      </div>
    );
  };

  const renderCopyEmail = (user: AdminUser) =>
    user.email ? (
      <button
        type="button"
        onClick={() => copyEmail(user.email!, user.id)}
        aria-label={copiedId === user.id ? `Email de ${who(user)} copiado` : `Copiar email de ${who(user)}`}
        className={cn(iconBtn, "hover:text-brand-400")}
      >
        {copiedId === user.id ? <Check className="h-4 w-4 text-success" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
      </button>
    ) : null;

  const detailItems = (user: AdminUser) => [
    { label: "ID da conta", value: <span className="font-mono">{user.id}</span> },
    { label: "Email completo", value: user.email ?? "—" },
    { label: "Plano ativado em", value: user.activatedAt ? fmt(user.activatedAt) : "—" },
    { label: "Expira em", value: user.subscription === "LIFETIME" ? "Nunca (vitalício)" : user.expiresAt ? fmt(user.expiresAt) : "—" },
  ];

  const COLUMNS = [
    { key: "name",     label: "Usuário"  },
    { key: "email",    label: "Email"    },
    { key: "plan",     label: "Plano"    },
    { key: null,       label: "Login"    },
    { key: "analyses", label: "Análises" },
    { key: "joined",   label: "Cadastro" },
    { key: null,       label: "Expira"   },
    { key: null,       label: "Ações"    },
  ] as const;

  const ariaSort = (key: string | null): "ascending" | "descending" | "none" | undefined => {
    if (!key) return undefined;
    if (sortBy !== key) return "none";
    return sortAsc ? "ascending" : "descending";
  };

  return (
    <div className="min-h-screen bg-bg text-text">

      {/* ── Header ── */}
      <header className="glass sticky top-0 z-40 border-b border-border pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-topbar max-w-[1400px] items-center justify-between gap-2 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/" aria-label="Flert IA — página inicial" className={cn("inline-flex min-h-11 items-center rounded-md", focusRing)}>
              <Logo size={26} />
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-brand-500/25 bg-brand-500/10 px-2 py-1 text-caption font-semibold uppercase text-brand-400">
              <Shield className="h-3.5 w-3.5" aria-hidden />
              Admin
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="secondary"
              size="sm"
              className="h-11 px-3"
              onClick={exportCSV}
              disabled={loading || filtered.length === 0}
              leftIcon={<Download className="h-4 w-4" aria-hidden />}
            >
              <span className="sr-only sm:not-sr-only">Exportar CSV</span>
            </Button>
            <button type="button" onClick={load} disabled={loading} className={cn(iconBtn, "disabled:opacity-50")} title="Recarregar" aria-label="Recarregar">
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin motion-reduce:animate-none")} aria-hidden />
            </button>
            <Link href="/dashboard" className={iconBtn} title="Ir para o painel" aria-label="Ir para o painel">
              <LayoutDashboard className="h-4 w-4" aria-hidden />
            </Link>
            <button type="button" onClick={() => signOut({ callbackUrl: "/" })} className={cn(iconBtn, "hover:text-danger")} title="Sair" aria-label="Sair">
              <LogOut className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="mx-auto max-w-[1400px] space-y-8 px-4 py-6 focus:outline-none sm:px-6 sm:py-8">

        {/* ── Title ── */}
        <div>
          <p className="mb-1 text-caption uppercase text-violet-400">Painel administrativo</p>
          <h1 className="font-display text-h1 text-text">Usuários e campanhas</h1>
          <p className="mt-2 text-sm text-text-2">Gerencie usuários, planos e envios de email do Flert IA.</p>
        </div>

        {/* ── Stats grid ── */}
        <ul aria-label="Resumo" aria-busy={loading || undefined} className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
          {statCards.map((s, i) => (
            <m.li key={s.label}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="min-w-0 rounded-lg border border-border bg-surface px-4 py-4">
              <s.icon className={cn("mb-2.5 h-4 w-4", s.color)} aria-hidden />
              <div className={cn("font-display text-xl font-bold leading-none tracking-tight", s.color)}>
                {(s as { raw?: boolean }).raw ? s.value : Number(s.value).toLocaleString("pt-BR")}
              </div>
              <div className="mt-1.5 text-caption font-semibold uppercase leading-tight text-text-2">{s.label}</div>
              <div className="mt-0.5 text-caption leading-tight text-text-2">{s.sub}</div>
            </m.li>
          ))}
        </ul>

        {/* ── Tabs ── */}
        <div role="tablist" aria-label="Seções do painel" className="-mb-4 flex overflow-x-auto border-b border-border">
          {([
            { id: "users", label: "Usuários",           icon: Users },
            { id: "email", label: "Campanhas de email", icon: Mail  },
          ] as const).map(tab => (
            <button key={tab.id} type="button" role="tab" id={`admin-tab-${tab.id}`}
              aria-selected={activeTab === tab.id}
              aria-controls={`admin-panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "-mb-px flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-4 text-sm font-semibold transition-colors",
                focusRing,
                activeTab === tab.id
                  ? "border-brand-500 text-brand-400"
                  : "border-transparent text-text-2 hover:text-text"
              )}>
              <tab.icon className="h-4 w-4" aria-hidden />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ══════════════════ USERS TAB ══════════════════ */}
        {activeTab === "users" && (
          <section role="tabpanel" id="admin-panel-users" aria-labelledby="admin-tab-users" className="space-y-4 pt-4">
            {/* ── Filters ── */}
            <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
              <div className="relative min-w-0 flex-1 lg:min-w-[16rem]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-2" aria-hidden />
                <input type="search" placeholder="Buscar por nome ou email..."
                  aria-label="Buscar usuários por nome ou email"
                  value={search} onChange={e => setSearch(e.target.value)}
                  className={cn(fieldClass, "h-11 pl-9 pr-12")} />
                {search && (
                  <button type="button" onClick={() => setSearch("")} aria-label="Limpar busca"
                    className={cn(iconBtn, "absolute right-0 top-1/2 -translate-y-1/2")}>
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                )}
              </div>

              <div role="group" aria-label="Filtrar por plano" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0 lg:pb-0">
                {(["ALL", "FREE", "PREMIUM", "ANNUAL", "LIFETIME"] as const).map(p => (
                  <button key={p} type="button" onClick={() => setFilterPlan(p)}
                    aria-pressed={filterPlan === p}
                    className={cn(
                      "min-h-11 shrink-0 rounded-md border px-3 text-sm font-semibold transition-colors",
                      focusRing,
                      filterPlan === p
                        ? "border-brand-500/35 bg-brand-500/15 text-brand-300"
                        : "border-border text-text-2 hover:border-border-strong hover:text-text"
                    )}>
                    {p === "ALL" ? `Todos (${users.length})` : `${planConfig[p].label} (${planCount(p)})`}
                  </button>
                ))}
              </div>

              <p aria-live="polite" className="text-sm text-text-2 lg:ml-auto lg:whitespace-nowrap">
                {visibleCount} de {users.length} usuário{users.length !== 1 ? "s" : ""}
              </p>
            </div>

            {/* ── Mobile: cartões empilhados ── */}
            <div className="md:hidden">
              {loading ? (
                <div aria-hidden className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-40 animate-pulse rounded-lg border border-border bg-surface motion-reduce:animate-none" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-text-2">Nenhum usuário encontrado</p>
              ) : (
                <ul aria-label="Usuários" className="space-y-3">
                  {filtered.map(user => (
                    <li key={user.id}
                      className={cn("rounded-lg border bg-surface p-4", confirmDeleteId === user.id ? "border-danger/40" : "border-border")}>
                      <div className="flex items-start gap-3">
                        <UserAvatar user={user} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-text">{user.name ?? "—"}</p>
                          <p className="break-all text-sm text-text-2">{user.email ?? "—"}</p>
                        </div>
                        {renderCopyEmail(user)}
                      </div>

                      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                        <div><dt className="text-caption text-text-2">Login</dt><dd className="text-text">{user.loginMethod === "google" ? "Google" : "Email"}</dd></div>
                        <div><dt className="text-caption text-text-2">Análises</dt><dd className="text-text tabular-nums">{user.analysisCount}</dd></div>
                        <div><dt className="text-caption text-text-2">Cadastro</dt><dd className="text-text">{fmt(user.createdAt)}</dd></div>
                        <div><dt className="text-caption text-text-2">Expira</dt><dd>{renderExpiry(user)}</dd></div>
                      </dl>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                        {renderPlanControl(user)}
                        {renderActions(user)}
                      </div>

                      <details className="group mt-2">
                        <summary className={cn("flex min-h-11 cursor-pointer list-none items-center gap-1.5 rounded-md text-sm font-medium text-text-2 hover:text-text [&::-webkit-details-marker]:hidden", focusRing)}>
                          <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90 motion-reduce:transition-none" aria-hidden />
                          Mais detalhes
                        </summary>
                        <dl className="space-y-2 pb-1 text-sm">
                          {detailItems(user).map(d => (
                            <div key={d.label}><dt className="text-caption text-text-2">{d.label}</dt><dd className="break-all text-text">{d.value}</dd></div>
                          ))}
                        </dl>
                      </details>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* ── md+: tabela com rolagem horizontal ── */}
            <div className="hidden overflow-hidden rounded-lg border border-border bg-surface md:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm">
                  <caption className="sr-only">Usuários cadastrados</caption>
                  <thead>
                    <tr className="border-b border-border bg-surface-2">
                      {COLUMNS.map((col) => (
                        <th key={col.label} scope="col" aria-sort={ariaSort(col.key)}
                          className="px-4 py-2 text-left text-caption font-semibold uppercase text-text-2">
                          {col.key ? (
                            <button type="button" onClick={() => toggleSort(col.key)}
                              className={cn("-mx-2 inline-flex min-h-11 items-center gap-1 rounded-md px-2 uppercase hover:text-text", focusRing)}>
                              {col.label}
                              <SortIcon field={col.key} current={sortBy} asc={sortAsc} />
                            </button>
                          ) : (
                            col.label
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="border-b border-border/60">
                          {Array.from({ length: 8 }).map((_, j) => (
                            <td key={j} className="px-4 py-3.5">
                              <div className="h-3.5 w-3/4 rounded bg-surface-2 animate-pulse motion-reduce:animate-none" />
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-16 text-center text-sm text-text-2">
                          Nenhum usuário encontrado
                        </td>
                      </tr>
                    ) : (
                      filtered.map(user => {
                        const isExpanded = expandedId === user.id;
                        const isConfirm  = confirmDeleteId === user.id;
                        return (
                          <Fragment key={user.id}>
                            <tr className={cn(
                                "border-b border-border/60 transition-colors",
                                isExpanded ? "bg-surface-2" : "hover:bg-surface-2/60",
                                isConfirm && "bg-danger/5"
                              )}>
                              <td className="px-4 py-2">
                                <button type="button"
                                  aria-expanded={isExpanded}
                                  aria-controls={`admin-details-${user.id}`}
                                  aria-label={`Detalhes de ${who(user)}`}
                                  onClick={() => setExpandedId(isExpanded ? null : user.id)}
                                  className={cn("-mx-2 flex min-h-11 items-center gap-2.5 rounded-md px-2 text-left", focusRing)}>
                                  <UserAvatar user={user} />
                                  <span className="min-w-0">
                                    <span className="block max-w-[140px] truncate text-sm font-medium leading-tight text-text">{user.name ?? "—"}</span>
                                    {user.analysisCount > 0 && (
                                      <span className="block text-caption leading-tight text-text-2">{user.analysisCount} análises</span>
                                    )}
                                  </span>
                                  <ChevronRight className={cn("ml-1 h-4 w-4 flex-shrink-0 text-text-2 transition-transform motion-reduce:transition-none", isExpanded && "rotate-90")} aria-hidden />
                                </button>
                              </td>

                              <td className="px-4 py-2">
                                <div className="flex items-center gap-1">
                                  <span className="max-w-[180px] truncate text-sm text-text-2">{user.email ?? "—"}</span>
                                  {renderCopyEmail(user)}
                                </div>
                              </td>

                              <td className="px-4 py-2 align-top">{renderPlanControl(user, true)}</td>

                              <td className="px-4 py-2">
                                <span className={cn(
                                  "inline-flex items-center rounded-md border px-2 py-0.5 text-caption font-semibold",
                                  user.loginMethod === "google"
                                    ? "border-violet-500/20 bg-violet-500/10 text-violet-400"
                                    : "border-border bg-surface-2 text-text-2"
                                )}>
                                  {user.loginMethod === "google" ? "Google" : "Email"}
                                </span>
                              </td>

                              <td className="px-4 py-2 tabular-nums text-text">{user.analysisCount}</td>

                              <td className="px-4 py-2 text-sm text-text-2">{fmt(user.createdAt)}</td>

                              <td className="px-4 py-2">{renderExpiry(user)}</td>

                              <td className="px-4 py-2">{renderActions(user)}</td>
                            </tr>

                            {isExpanded && (
                              <tr id={`admin-details-${user.id}`}>
                                <td colSpan={8} className="border-b border-border/60 bg-surface-2 px-6 pb-4 pt-0">
                                  <dl className="grid grid-cols-2 gap-3 pt-3 lg:grid-cols-4">
                                    {detailItems(user).map(d => (
                                      <div key={d.label} className="rounded-md border border-border bg-surface p-3">
                                        <dt className="mb-1 text-caption font-semibold uppercase text-text-2">{d.label}</dt>
                                        <dd className="break-all text-sm text-text">{d.value}</dd>
                                      </div>
                                    ))}
                                  </dl>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* ══════════════════ EMAIL TAB ══════════════════ */}
        {activeTab === "email" && (
          <section role="tabpanel" id="admin-panel-email" aria-labelledby="admin-tab-email" className="space-y-6 pt-4">
            <div>
              <h2 className="font-display text-h3 text-text">Envio de emails</h2>
              <p className="mt-1 text-sm text-text-2">Envie emails em massa para segmentos específicos de usuários.</p>
              <p className="mt-1 text-sm text-text-2">
                Campanhas promocionais só vão para quem aceitou e-mails de novidades e ofertas ({optedIn.length} de {users.length}),
                sempre com o link &ldquo;Não quero mais receber&rdquo;. O aviso de plano vencendo é transacional e vai para todos com plano vencendo.
              </p>
            </div>

            {campaignProgress && (
              <div role="status" aria-label="Progresso do envio"
                className="flex flex-col gap-3 rounded-lg border border-border bg-surface-2 p-4 text-sm text-text sm:flex-row sm:items-center sm:justify-between">
                <p>
                  {campaignProgress.nextCursor
                    ? `${campaignProgress.sent} enviados · ${campaignProgress.failed} falharam · ${campaignProgress.remaining} restantes (de ${campaignProgress.total})`
                    : `Envio concluído: ${campaignProgress.sent} enviados · ${campaignProgress.failed} falharam (de ${campaignProgress.total})`}
                </p>
                {campaignProgress.nextCursor && (
                  <Button onClick={() => sendCampaign(campaignProgress.template, campaignProgress)}
                    loading={sendingTemplate === campaignProgress.template}
                    leftIcon={<Send className="h-4 w-4" aria-hidden />}>
                    {sendingTemplate === campaignProgress.template
                      ? "Enviando..."
                      : `Continuar envio (${campaignProgress.remaining} restantes)`}
                  </Button>
                )}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">

              {/* ── Template: Free Upsell ── */}
              <div className="flex flex-col rounded-lg border border-border bg-surface p-4 sm:p-6">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-brand-500/10">
                      <Zap className="h-5 w-5 text-brand-400" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-text">Ainda não escolheu um plano?</h3>
                      <p className="text-sm text-text-2">Usuários grátis</p>
                    </div>
                  </div>
                  <span className={cn(
                    "flex-shrink-0 rounded-md border px-2.5 py-1 text-caption font-bold",
                    freeCount === 0 ? "border-border bg-surface-2 text-text-2" : "border-brand-500/20 bg-brand-500/10 text-brand-400"
                  )}>
                    {freeCount} usuário{freeCount !== 1 ? "s" : ""}
                  </span>
                </div>

                <p className="mb-3 flex-1 text-sm leading-relaxed text-text-2">
                  Envia um e-mail para todos os usuários sem plano lembrando que as análises começam quando escolherem um plano.
                </p>

                <p className="mb-4 rounded-md border border-border bg-surface-2 p-2.5 font-mono text-caption leading-relaxed text-text-2">
                  Assunto: &ldquo;{FREE_UPSELL_SUBJECT}&rdquo;
                </p>

                {confirmTemplate === "free_upsell" ? (
                  <div className="flex gap-2">
                    <Button variant="secondary" className="flex-1" onClick={() => setConfirmTemplate(null)}>
                      Cancelar
                    </Button>
                    <Button className="flex-1" onClick={() => sendCampaign("free_upsell")}
                      loading={sendingTemplate === "free_upsell"}
                      disabled={freeCount === 0}
                      leftIcon={<Check className="h-4 w-4" aria-hidden />}>
                      {sendingTemplate === "free_upsell" ? "Enviando..." : "Confirmar envio"}
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" className="w-full" onClick={() => setConfirmTemplate("free_upsell")}
                    disabled={freeCount === 0}
                    leftIcon={<Send className="h-4 w-4" aria-hidden />}>
                    Enviar para {freeCount} usuário{freeCount !== 1 ? "s" : ""}
                  </Button>
                )}
              </div>

              {/* ── Template: Expiring Soon ── */}
              <div className="flex flex-col rounded-lg border border-border bg-surface p-4 sm:p-6">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-warning/10">
                      <Clock className="h-5 w-5 text-warning" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-text">Plano expirando em breve</h3>
                      <p className="text-sm text-text-2">Planos expirando em até 7 dias · aviso transacional</p>
                    </div>
                  </div>
                  <span className={cn(
                    "flex-shrink-0 rounded-md border px-2.5 py-1 text-caption font-bold",
                    expiringCount === 0 ? "border-border bg-surface-2 text-text-2" : "border-warning/20 bg-warning/10 text-warning"
                  )}>
                    {expiringCount} usuário{expiringCount !== 1 ? "s" : ""}
                  </span>
                </div>

                <p className="mb-3 flex-1 text-sm leading-relaxed text-text-2">
                  Avisa quem tem plano Mensal ou Anual expirando nos próximos 7 dias para renovar antes de perder o acesso.
                </p>

                <p className="mb-4 rounded-md border border-border bg-surface-2 p-2.5 font-mono text-caption leading-relaxed text-text-2">
                  Assunto: &ldquo;Seu plano Flert IA vence em X dia(s)&rdquo;
                </p>

                {confirmTemplate === "expiring" ? (
                  <div className="flex gap-2">
                    <Button variant="secondary" className="flex-1" onClick={() => setConfirmTemplate(null)}>
                      Cancelar
                    </Button>
                    <Button className="flex-1" onClick={() => sendCampaign("expiring")}
                      loading={sendingTemplate === "expiring"}
                      disabled={expiringCount === 0}
                      leftIcon={<Check className="h-4 w-4" aria-hidden />}>
                      {sendingTemplate === "expiring" ? "Enviando..." : "Confirmar envio"}
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" className="w-full" onClick={() => setConfirmTemplate("expiring")}
                    disabled={expiringCount === 0}
                    leftIcon={<Send className="h-4 w-4" aria-hidden />}>
                    {expiringCount === 0 ? "Nenhum plano expirando" : `Enviar para ${expiringCount} usuário${expiringCount !== 1 ? "s" : ""}`}
                  </Button>
                )}
              </div>
            </div>

            {/* ── Template: Custom ── */}
            <div className="rounded-lg border border-border bg-surface p-4 sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-violet-500/10">
                  <Mail className="h-5 w-5 text-violet-400" aria-hidden />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-text">Email personalizado</h3>
                  <p className="text-sm text-text-2">Escreva sua própria mensagem para o público que escolher</p>
                </div>
              </div>

              <div className="mb-4 grid gap-4 md:grid-cols-3">
                <div>
                  <label htmlFor="custom-target" className={labelClass}>Destinatários</label>
                  <select
                    id="custom-target"
                    value={customTarget}
                    onChange={e => setCustomTarget(e.target.value)}
                    className={cn(fieldClass, "h-11")}>
                    <option value="FREE">Grátis ({stats?.free ?? 0})</option>
                    <option value="ALL">Todos os usuários ({users.length})</option>
                    <option value="PREMIUM">Mensal ({stats?.premium ?? 0})</option>
                    <option value="ANNUAL">Anual ({stats?.annual ?? 0})</option>
                    <option value="LIFETIME">Vitalício ({stats?.lifetime ?? 0})</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="custom-subject" className={labelClass}>Assunto</label>
                  <input
                    id="custom-subject"
                    type="text"
                    placeholder="Ex.: Novidades no Flert IA"
                    value={customSubject}
                    onChange={e => setCustomSubject(e.target.value)}
                    className={cn(fieldClass, "h-11")} />
                </div>
              </div>

              <div className="mb-5">
                <label htmlFor="custom-body" className={labelClass}>
                  Mensagem <span className="font-normal text-text-2">(texto simples, uma linha por parágrafo)</span>
                </label>
                <textarea
                  id="custom-body"
                  rows={5}
                  aria-describedby="custom-body-hint"
                  placeholder={"Olá! Passando para avisar sobre..."}
                  value={customBody}
                  onChange={e => setCustomBody(e.target.value)}
                  className={cn(fieldClass, "resize-y py-2.5 leading-relaxed")} />
                <p id="custom-body-hint" className="mt-1.5 text-sm text-text-2">
                  O email incluirá automaticamente a saudação com o nome do usuário e um botão &ldquo;Acessar Flert IA&rdquo;.
                </p>
              </div>

              <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-center gap-2 text-sm text-text-2">
                  {(!customSubject.trim() || !customBody.trim()) && (
                    <><AlertCircle className="h-4 w-4 text-warning" aria-hidden /> Preencha assunto e mensagem</>
                  )}
                </p>

                {confirmTemplate === "custom" ? (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button variant="secondary" onClick={() => setConfirmTemplate(null)}>
                      Cancelar
                    </Button>
                    <Button onClick={() => sendCampaign("custom")}
                      loading={sendingTemplate === "custom"}
                      leftIcon={<Check className="h-4 w-4" aria-hidden />}>
                      {sendingTemplate === "custom" ? "Enviando..." : `Confirmar — ${customCount} usuário${customCount !== 1 ? "s" : ""}`}
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" onClick={() => setConfirmTemplate("custom")}
                    disabled={!customSubject.trim() || !customBody.trim() || customCount === 0}
                    leftIcon={<Send className="h-4 w-4" aria-hidden />}>
                    Enviar para {customCount} usuário{customCount !== 1 ? "s" : ""}
                  </Button>
                )}
              </div>
            </div>
          </section>
        )}

        <p className="pb-4 text-center text-caption text-text-2">
          Flert IA · Painel restrito · {new Date().getFullYear()}
        </p>
      </main>

      {/* ── Single-user email modal (Radix Dialog: role=dialog, prende o foco, Esc fecha) ── */}
      <Dialog open={emailModal !== null} onOpenChange={(open) => { if (!open) setEmailModal(null); }}>
        {emailModal && (
          <DialogContent className="gap-0 overflow-hidden p-0">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border px-5 py-4 pr-14">
              <UserAvatar user={emailModal} />
              <div className="min-w-0">
                <DialogTitle className="truncate text-sm font-semibold leading-tight">
                  Enviar email para {emailModal.name ?? "—"}
                </DialogTitle>
                <DialogDescription className="break-all text-sm leading-tight">{emailModal.email}</DialogDescription>
              </div>
            </div>

            {/* Template selector */}
            <div className="max-h-[60dvh] space-y-2 overflow-y-auto px-5 py-4">
              {!emailModal.marketingOptIn && modalTemplate !== "expiring" && (
                <p role="note" className="mb-3 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-text">
                  Este usuário não aceitou receber e-mails promocionais: o envio será recusado.
                  O aviso de plano expirando (transacional) pode ser enviado.
                </p>
              )}
              <p className="mb-3 text-caption font-semibold uppercase text-text-2" id="modal-template-label">Escolha o email</p>

              <div role="group" aria-labelledby="modal-template-label" className="space-y-2">
                {([
                  { id: "free_upsell", label: "Convide para escolher um plano", desc: `"${FREE_UPSELL_SUBJECT}"`, icon: Zap,   color: "text-brand-400"  },
                  { id: "expiring",    label: "Plano expirando em breve",        desc: "Avisa que o plano vence em breve",                icon: Clock, color: "text-warning"  },
                  { id: "custom",      label: "Mensagem personalizada",           desc: "Escreva sua própria mensagem",                               icon: Mail,  color: "text-violet-400" },
                ] as const).map(t => (
                  <button key={t.id} type="button" onClick={() => setModalTemplate(t.id)}
                    aria-pressed={modalTemplate === t.id}
                    className={cn(
                      "flex min-h-11 w-full items-center gap-3 rounded-md border p-3 text-left transition-colors",
                      focusRing,
                      modalTemplate === t.id
                        ? "border-brand-500/40 bg-brand-500/10"
                        : "border-border hover:border-border-strong hover:bg-surface-2"
                    )}>
                    <t.icon className={cn("h-4 w-4 flex-shrink-0", t.color)} aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium leading-tight text-text">{t.label}</span>
                      <span className="mt-0.5 block text-sm leading-snug text-text-2">{t.desc}</span>
                    </span>
                    {modalTemplate === t.id && <Check className="h-4 w-4 flex-shrink-0 text-brand-400" aria-hidden />}
                  </button>
                ))}
              </div>

              {modalTemplate === "custom" && (
                <div className="space-y-2 pt-1">
                  <input type="text" placeholder="Assunto do email" aria-label="Assunto do email"
                    value={modalSubject} onChange={e => setModalSubject(e.target.value)}
                    className={cn(fieldClass, "h-11")} />
                  <textarea rows={4} placeholder="Mensagem..." aria-label="Mensagem do email"
                    value={modalBody} onChange={e => setModalBody(e.target.value)}
                    className={cn(fieldClass, "resize-y py-2.5 leading-relaxed")} />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex flex-col-reverse gap-2 border-t border-border bg-surface-2 px-5 py-4 sm:flex-row sm:items-center">
              <Button asChild variant="secondary">
                <a href={`https://mail.google.com/mail/?view=cm&to=${emailModal.email}`} target="_blank" rel="noopener noreferrer">
                  Abrir Gmail<span className="sr-only"> (abre em nova aba)</span>
                </a>
              </Button>
              <Button className="sm:flex-1" onClick={sendToUser} loading={sendingModal}
                leftIcon={<Send className="h-4 w-4" aria-hidden />}>
                {sendingModal ? "Enviando..." : "Enviar email"}
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
