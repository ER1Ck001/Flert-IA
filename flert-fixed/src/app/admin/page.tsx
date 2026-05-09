"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Search, Trash2, Crown, Zap, Star, Heart,
  Copy, Check, RefreshCw, Shield, Activity, BarChart3,
  ChevronDown, ChevronUp, LogOut, Mail, Download,
  TrendingUp, UserPlus, DollarSign, X, ChevronRight,
  Calendar, Clock, Sparkles, Send, AlertCircle,
} from "lucide-react";
import { signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

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
  FREE:     { label: "Grátis",    color: "text-muted-foreground", bg: "bg-muted/40",        border: "border-border/40",        icon: Shield },
  PREMIUM:  { label: "Mensal",    color: "text-brand-400",        bg: "bg-brand-500/12",    border: "border-brand-500/30",     icon: Zap    },
  ANNUAL:   { label: "Anual",     color: "text-violet-400",       bg: "bg-violet-500/12",   border: "border-violet-500/30",    icon: Star   },
  LIFETIME: { label: "Vitalício", color: "text-amber-400",        bg: "bg-amber-500/12",    border: "border-amber-500/30",     icon: Crown  },
};

const PLAN_PRICES = { FREE: 0, PREMIUM: 29.9, ANNUAL: 147 / 12, LIFETIME: 0 };

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function daysUntil(dateStr: string | null) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function UserAvatar({ user }: { user: AdminUser }) {
  const letter = (user.name ?? user.email ?? "?")[0].toUpperCase();
  if (user.image) {
    return <Image src={user.image} alt="" width={32} height={32} className="rounded-full object-cover flex-shrink-0" />;
  }
  return (
    <div className="h-8 w-8 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 text-xs font-bold flex-shrink-0">
      {letter}
    </div>
  );
}

function SortIcon({ field, current, asc }: { field: string; current: string; asc: boolean }) {
  if (field !== current) return <ChevronDown className="h-3 w-3 opacity-20" />;
  return asc ? <ChevronUp className="h-3 w-3 text-brand-400" /> : <ChevronDown className="h-3 w-3 text-brand-400" />;
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
  const menuRef = useRef<HTMLDivElement>(null);

  // Email campaigns state
  const [activeTab, setActiveTab]             = useState<"users" | "email">("users");
  const [confirmTemplate, setConfirmTemplate] = useState<string | null>(null);
  const [sendingTemplate, setSendingTemplate] = useState<string | null>(null);
  const [customTarget, setCustomTarget]       = useState<string>("FREE");
  const [customSubject, setCustomSubject]     = useState<string>("");
  const [customBody, setCustomBody]           = useState<string>("");

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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setPlanMenuId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Derived stats
  const weekAgo     = Date.now() - 7 * 86400000;
  const newThisWeek = users.filter(u => new Date(u.createdAt).getTime() >= weekAgo).length;
  const paidUsers   = users.filter(u => u.subscription !== "FREE").length;
  const mrr         = users.reduce((acc, u) => acc + (PLAN_PRICES[u.subscription] ?? 0), 0);

  // Email campaign counts
  const freeCount     = users.filter(u => u.subscription === "FREE").length;
  const expiringCount = users.filter(u => {
    if (!u.expiresAt || u.subscription === "FREE" || u.subscription === "LIFETIME") return false;
    const d = daysUntil(u.expiresAt);
    return d !== null && d >= 0 && d <= 7;
  }).length;
  const customCount = customTarget === "ALL"
    ? users.length
    : users.filter(u => u.subscription === customTarget).length;

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

  const sendCampaign = async (templateId: string) => {
    setSendingTemplate(templateId);
    try {
      const payload: Record<string, string> = { template: templateId };
      if (templateId === "custom") {
        if (!customSubject.trim() || !customBody.trim()) {
          toast.error("Preencha assunto e mensagem");
          return;
        }
        payload.customSubject = customSubject;
        payload.customBody    = customBody;
        payload.targetPlan    = customTarget;
      }
      const res  = await fetch("/api/admin/email", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const msg = data.failed > 0
        ? `${data.sent} enviados, ${data.failed} falharam (de ${data.total})`
        : `${data.sent} email${data.sent !== 1 ? "s" : ""} enviados!`;
      data.failed > 0 ? toast.error(msg) : toast.success(msg);
      setConfirmTemplate(null);
      if (templateId === "custom") { setCustomSubject(""); setCustomBody(""); }
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
    { label: "Total de usuários",  value: stats?.total ?? 0,      icon: Users,       color: "text-foreground",         sub: `${paidUsers} pagantes` },
    { label: "Novos esta semana",  value: newThisWeek,            icon: UserPlus,    color: "text-green-400",           sub: "últimos 7 dias" },
    { label: "Grátis",             value: stats?.free ?? 0,       icon: Shield,      color: "text-muted-foreground",    sub: `${stats ? Math.round((stats.free / (stats.total || 1)) * 100) : 0}% do total` },
    { label: "Mensal",             value: stats?.premium ?? 0,    icon: Zap,         color: "text-brand-400",           sub: "R$29,90/mês" },
    { label: "Anual",              value: stats?.annual ?? 0,     icon: Star,        color: "text-violet-400",          sub: "R$147,00/ano" },
    { label: "Vitalício",          value: stats?.lifetime ?? 0,   icon: Crown,       color: "text-amber-400",           sub: "pagamento único" },
    { label: "MRR estimado",       value: `R$${mrr.toFixed(2).replace(".", ",")}`, icon: DollarSign, color: "text-green-400", sub: "receita mensal recorrente", raw: true },
    { label: "Total de análises",  value: stats?.totalAnalyses ?? 0, icon: Activity, color: "text-brand-400",          sub: "desde o início" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Header ── */}
      <header className="h-14 border-b border-border/40 bg-background/98 backdrop-blur-xl sticky top-0 z-40 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-brand-500 fill-brand-500" />
            <span className="font-display text-base font-bold tracking-tight">
              Flert<span className="text-brand-500">.</span>IA
            </span>
          </Link>
          <span className="text-border/60">·</span>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-brand-500/10 border border-brand-500/20">
            <Shield className="h-3 w-3 text-brand-400" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-brand-400">Admin</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} disabled={loading || filtered.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/40 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-border transition-colors disabled:opacity-30">
            <Download className="h-3 w-3" /> Exportar CSV
          </button>
          <button onClick={load} disabled={loading}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground" title="Recarregar">
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </button>
          <Link href="/dashboard" className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground" title="Dashboard">
            <Sparkles className="h-3.5 w-3.5" />
          </Link>
          <button onClick={() => signOut({ callbackUrl: "/" })}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-destructive" title="Sair">
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-8">

        {/* ── Title ── */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Painel Administrativo</p>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Controle Total</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie usuários, planos e monitore o crescimento do Flert IA</p>
        </div>

        {/* ── Stats grid ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
          {statCards.map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-xl border border-border/40 bg-card/20 px-4 py-4 hover:border-border/70 transition-colors group">
              <s.icon className={cn("h-3.5 w-3.5 mb-2 transition-transform group-hover:scale-110", s.color)} />
              <div className={cn("font-display text-xl font-bold tracking-tight leading-none", s.color)}>
                {(s as { raw?: boolean }).raw ? s.value : Number(s.value).toLocaleString("pt-BR")}
              </div>
              <div className="text-[10px] font-semibold text-muted-foreground mt-1 leading-tight">{s.label}</div>
              <div className="text-[10px] text-muted-foreground/50 mt-0.5 leading-tight">{s.sub}</div>
            </motion.div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-border/40 -mb-4">
          {([
            { id: "users", label: "Usuários",           icon: Users },
            { id: "email", label: "Campanhas de Email", icon: Mail  },
          ] as const).map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-all",
                activeTab === tab.id
                  ? "border-brand-500 text-brand-400"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}>
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ══════════════════ USERS TAB ══════════════════ */}
        {activeTab === "users" && (
          <>
            {/* ── Filters ── */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-52">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input type="text" placeholder="Buscar por nome ou email..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full h-9 pl-9 pr-8 rounded-lg border border-border/40 bg-card/30 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-brand-500/40 transition-colors" />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              <div className="flex gap-1.5 flex-wrap">
                {(["ALL", "FREE", "PREMIUM", "ANNUAL", "LIFETIME"] as const).map(p => {
                  const cfg = p !== "ALL" ? planConfig[p as Plan] : null;
                  return (
                    <button key={p} onClick={() => setFilterPlan(p)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                        filterPlan === p
                          ? cn("border-brand-500/35 bg-brand-500/15 text-brand-300")
                          : "border-border/40 text-muted-foreground hover:border-border hover:text-foreground"
                      )}>
                      {p === "ALL" ? `Todos (${users.length})` : `${cfg!.label} (${stats ? (p === "FREE" ? stats.free : p === "PREMIUM" ? stats.premium : p === "ANNUAL" ? stats.annual : stats.lifetime) : 0})`}
                    </button>
                  );
                })}
              </div>

              <span className="text-xs text-muted-foreground/60 ml-auto whitespace-nowrap">
                {filtered.length} de {users.length} usuário{users.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* ── Table ── */}
            <div className="rounded-2xl border border-border/40 bg-card/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/40 bg-card/40">
                      {[
                        { key: "name",     label: "Usuário"  },
                        { key: "email",    label: "Email"    },
                        { key: "plan",     label: "Plano"    },
                        { key: null,       label: "Login"    },
                        { key: "analyses", label: "Análises" },
                        { key: "joined",   label: "Cadastro" },
                        { key: null,       label: "Expira"   },
                        { key: null,       label: "Ações"    },
                      ].map((col, i) => (
                        <th key={i}
                          onClick={() => col.key && toggleSort(col.key)}
                          className={cn(
                            "text-left px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground select-none",
                            col.key && "cursor-pointer hover:text-foreground transition-colors"
                          )}>
                          <span className="flex items-center gap-1">
                            {col.label}
                            {col.key && <SortIcon field={col.key} current={sortBy} asc={sortAsc} />}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="border-b border-border/20">
                          {Array.from({ length: 8 }).map((_, j) => (
                            <td key={j} className="px-4 py-3.5">
                              <div className="h-3.5 rounded bg-muted/30 animate-pulse" style={{ width: `${50 + Math.random() * 40}%` }} />
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-16 text-center text-muted-foreground text-sm">
                          Nenhum usuário encontrado
                        </td>
                      </tr>
                    ) : (
                      <AnimatePresence initial={false}>
                        {filtered.map(user => {
                          const plan       = planConfig[user.subscription];
                          const PlanIcon   = plan.icon;
                          const isExpanded = expandedId === user.id;
                          const isConfirm  = confirmDeleteId === user.id;
                          const isDeleting = deletingId === user.id;
                          const isUpdating = updatingId === user.id;
                          const isPlanMenu = planMenuId === user.id;
                          const days       = daysUntil(user.expiresAt);

                          return (
                            <>
                              <motion.tr key={user.id}
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className={cn(
                                  "border-b border-border/20 transition-colors group",
                                  isExpanded ? "bg-card/40" : "hover:bg-card/25",
                                  isConfirm && "bg-destructive/5"
                                )}>

                                <td className="px-4 py-3 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : user.id)}>
                                  <div className="flex items-center gap-2.5">
                                    <UserAvatar user={user} />
                                    <div className="min-w-0">
                                      <p className="font-medium text-foreground truncate max-w-[110px] text-sm leading-tight">
                                        {user.name ?? "—"}
                                      </p>
                                      {user.analysisCount > 0 && (
                                        <p className="text-[10px] text-muted-foreground/50 leading-tight">{user.analysisCount} análises</p>
                                      )}
                                    </div>
                                    <ChevronRight className={cn("h-3 w-3 text-muted-foreground/30 transition-transform ml-1 flex-shrink-0", isExpanded && "rotate-90")} />
                                  </div>
                                </td>

                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-muted-foreground truncate max-w-[160px] text-xs">{user.email ?? "—"}</span>
                                    {user.email && (
                                      <button onClick={() => copyEmail(user.email!, user.id)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/40 hover:text-brand-400 flex-shrink-0">
                                        {copiedId === user.id ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                                      </button>
                                    )}
                                  </div>
                                </td>

                                <td className="px-4 py-3">
                                  <div className="relative" ref={isPlanMenu ? menuRef : undefined}>
                                    <button
                                      disabled={isUpdating}
                                      onClick={() => setPlanMenuId(isPlanMenu ? null : user.id)}
                                      className={cn(
                                        "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all",
                                        plan.bg, plan.border, plan.color,
                                        isUpdating && "opacity-50 cursor-wait",
                                        "hover:opacity-80"
                                      )}>
                                      <PlanIcon className="h-3 w-3" />
                                      {plan.label}
                                      <ChevronDown className="h-2.5 w-2.5 opacity-60" />
                                    </button>

                                    <AnimatePresence>
                                      {isPlanMenu && (
                                        <motion.div
                                          initial={{ opacity: 0, y: -6, scale: 0.96 }}
                                          animate={{ opacity: 1, y: 0,  scale: 1    }}
                                          exit={{  opacity: 0, y: -6, scale: 0.96 }}
                                          transition={{ type: "spring", stiffness: 400, damping: 28 }}
                                          className="absolute top-full mt-1.5 left-0 z-50 w-40 rounded-xl border border-border/50 bg-background/98 backdrop-blur-xl shadow-xl overflow-hidden">
                                          {(["FREE", "PREMIUM", "ANNUAL", "LIFETIME"] as Plan[]).map(p => {
                                            const pc = planConfig[p];
                                            const PI = pc.icon;
                                            return (
                                              <button key={p}
                                                onClick={() => changePlan(user.id, p)}
                                                className={cn(
                                                  "w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold transition-colors text-left",
                                                  user.subscription === p
                                                    ? cn(pc.bg, pc.color)
                                                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                                )}>
                                                <PI className={cn("h-3.5 w-3.5 flex-shrink-0", user.subscription === p ? pc.color : "")} />
                                                <span>{pc.label}</span>
                                                {user.subscription === p && <Check className="h-3 w-3 ml-auto" />}
                                              </button>
                                            );
                                          })}
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                </td>

                                <td className="px-4 py-3">
                                  <span className={cn(
                                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border",
                                    user.loginMethod === "google"
                                      ? "bg-blue-500/8 border-blue-500/20 text-blue-400"
                                      : "bg-muted/40 border-border/30 text-muted-foreground"
                                  )}>
                                    {user.loginMethod === "google" ? "Google" : "Email"}
                                  </span>
                                </td>

                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-1.5">
                                    <div className={cn(
                                      "h-1.5 w-1.5 rounded-full flex-shrink-0",
                                      user.analysisCount > 10 ? "bg-green-400" : user.analysisCount > 0 ? "bg-amber-400" : "bg-muted-foreground/30"
                                    )} />
                                    <span className="text-foreground/80 text-sm">{user.analysisCount}</span>
                                  </div>
                                </td>

                                <td className="px-4 py-3 text-muted-foreground text-xs">{fmt(user.createdAt)}</td>

                                <td className="px-4 py-3">
                                  {user.subscription === "FREE" ? (
                                    <span className="text-muted-foreground/40 text-xs">—</span>
                                  ) : user.subscription === "LIFETIME" ? (
                                    <span className="text-amber-400/70 text-xs font-medium">Eterno</span>
                                  ) : days === null ? (
                                    <span className="text-muted-foreground/40 text-xs">—</span>
                                  ) : days < 0 ? (
                                    <span className="text-destructive text-xs font-semibold">Expirado</span>
                                  ) : days <= 7 ? (
                                    <span className="text-amber-400 text-xs font-semibold">{days}d</span>
                                  ) : (
                                    <span className="text-muted-foreground text-xs">{fmt(user.expiresAt!)}</span>
                                  )}
                                </td>

                                <td className="px-4 py-3">
                                  <AnimatePresence mode="wait" initial={false}>
                                    {isConfirm ? (
                                      <motion.div key="confirm"
                                        initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                                        className="flex items-center gap-1">
                                        <button onClick={() => setConfirmDeleteId(null)} disabled={isDeleting}
                                          className="px-2 py-1 rounded-lg text-xs border border-border/40 text-muted-foreground hover:text-foreground transition-colors">
                                          Cancelar
                                        </button>
                                        <button onClick={() => deleteUser(user.id)} disabled={isDeleting}
                                          className="px-2 py-1 rounded-lg text-xs bg-destructive/10 border border-destructive/30 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50">
                                          {isDeleting ? "..." : "Excluir"}
                                        </button>
                                      </motion.div>
                                    ) : (
                                      <motion.div key="actions"
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {user.email && (
                                          <button onClick={() => openEmailModal(user)}
                                            className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-brand-400 hover:bg-brand-500/10 transition-colors"
                                            title="Enviar email">
                                            <Mail className="h-3.5 w-3.5" />
                                          </button>
                                        )}
                                        <button onClick={() => setConfirmDeleteId(user.id)}
                                          className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
                                          title="Excluir usuário">
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </td>
                              </motion.tr>

                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.tr key={`${user.id}-expanded`}
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    <td colSpan={8} className="px-6 pb-4 pt-0 bg-card/30 border-b border-border/20">
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3">
                                        <div className="p-3 rounded-xl bg-background/50 border border-border/30">
                                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">ID da conta</p>
                                          <p className="text-xs font-mono text-foreground/60 break-all">{user.id}</p>
                                        </div>
                                        <div className="p-3 rounded-xl bg-background/50 border border-border/30">
                                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Email completo</p>
                                          <p className="text-xs text-foreground break-all">{user.email ?? "—"}</p>
                                        </div>
                                        <div className="p-3 rounded-xl bg-background/50 border border-border/30">
                                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Plano ativado em</p>
                                          <p className="text-xs text-foreground">{user.activatedAt ? fmt(user.activatedAt) : "—"}</p>
                                        </div>
                                        <div className="p-3 rounded-xl bg-background/50 border border-border/30">
                                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Expira em</p>
                                          <p className="text-xs text-foreground">
                                            {user.subscription === "LIFETIME" ? "Nunca (vitalício)" : user.expiresAt ? fmt(user.expiresAt) : "—"}
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                  </motion.tr>
                                )}
                              </AnimatePresence>
                            </>
                          );
                        })}
                      </AnimatePresence>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ══════════════════ EMAIL TAB ══════════════════ */}
        {activeTab === "email" && (
          <div className="space-y-6 pt-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Campanhas</p>
              <h2 className="font-display text-lg font-bold tracking-tight text-foreground">Envio de Emails</h2>
              <p className="text-muted-foreground text-sm mt-1">Envie emails em massa para segmentos específicos de usuários.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">

              {/* ── Template: Free Upsell ── */}
              <div className="rounded-2xl border border-border/40 bg-card/20 p-6 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                      <Zap className="h-5 w-5 text-brand-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">Ainda não escolheu um plano?</h3>
                      <p className="text-xs text-muted-foreground">Usuários grátis</p>
                    </div>
                  </div>
                  <span className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-bold border flex-shrink-0",
                    freeCount === 0
                      ? "bg-muted/30 border-border/30 text-muted-foreground/50"
                      : "bg-brand-500/10 border-brand-500/20 text-brand-400"
                  )}>
                    {freeCount} usuário{freeCount !== 1 ? "s" : ""}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground mb-3 leading-relaxed flex-1">
                  Envia um email para todos os usuários no plano grátis lembrando de escolher um plano e destravar o acesso completo.
                </p>

                <p className="text-[11px] text-muted-foreground/50 font-mono mb-4 p-2.5 rounded-lg bg-muted/20 border border-border/20 leading-relaxed">
                  Assunto: "Não acha que está na hora de destravar suas conversas? 💘"
                </p>

                <AnimatePresence mode="wait" initial={false}>
                  {confirmTemplate === "free_upsell" ? (
                    <motion.div key="confirm"
                      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                      className="flex gap-2">
                      <button onClick={() => setConfirmTemplate(null)}
                        className="flex-1 py-2 rounded-xl text-xs border border-border/40 text-muted-foreground hover:text-foreground transition-colors">
                        Cancelar
                      </button>
                      <button onClick={() => sendCampaign("free_upsell")}
                        disabled={sendingTemplate === "free_upsell" || freeCount === 0}
                        className="flex-1 py-2 rounded-xl text-xs bg-brand-500 hover:bg-brand-600 text-white font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
                        {sendingTemplate === "free_upsell" ? (
                          <><span className="h-3 w-3 rounded-full border-[1.5px] border-white border-t-transparent animate-spin" /> Enviando...</>
                        ) : (
                          <><Check className="h-3 w-3" /> Confirmar envio</>
                        )}
                      </button>
                    </motion.div>
                  ) : (
                    <motion.button key="send"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      onClick={() => setConfirmTemplate("free_upsell")}
                      disabled={freeCount === 0}
                      className="w-full py-2.5 rounded-xl text-xs border border-brand-500/30 text-brand-400 hover:bg-brand-500/10 font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1.5">
                      <Send className="h-3.5 w-3.5" />
                      Enviar para {freeCount} usuário{freeCount !== 1 ? "s" : ""}
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              {/* ── Template: Expiring Soon ── */}
              <div className="rounded-2xl border border-border/40 bg-card/20 p-6 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <Clock className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">Plano expirando em breve</h3>
                      <p className="text-xs text-muted-foreground">Planos expirando em até 7 dias</p>
                    </div>
                  </div>
                  <span className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-bold border flex-shrink-0",
                    expiringCount === 0
                      ? "bg-muted/30 border-border/30 text-muted-foreground/50"
                      : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                  )}>
                    {expiringCount} usuário{expiringCount !== 1 ? "s" : ""}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground mb-3 leading-relaxed flex-1">
                  Avisa quem tem plano Mensal ou Anual expirando nos próximos 7 dias para renovar antes de perder o acesso.
                </p>

                <p className="text-[11px] text-muted-foreground/50 font-mono mb-4 p-2.5 rounded-lg bg-muted/20 border border-border/20 leading-relaxed">
                  Assunto: "Seu plano expira em X dia(s) ⚡"
                </p>

                <AnimatePresence mode="wait" initial={false}>
                  {confirmTemplate === "expiring" ? (
                    <motion.div key="confirm"
                      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                      className="flex gap-2">
                      <button onClick={() => setConfirmTemplate(null)}
                        className="flex-1 py-2 rounded-xl text-xs border border-border/40 text-muted-foreground hover:text-foreground transition-colors">
                        Cancelar
                      </button>
                      <button onClick={() => sendCampaign("expiring")}
                        disabled={sendingTemplate === "expiring" || expiringCount === 0}
                        className="flex-1 py-2 rounded-xl text-xs bg-amber-500 hover:bg-amber-600 text-white font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
                        {sendingTemplate === "expiring" ? (
                          <><span className="h-3 w-3 rounded-full border-[1.5px] border-white border-t-transparent animate-spin" /> Enviando...</>
                        ) : (
                          <><Check className="h-3 w-3" /> Confirmar envio</>
                        )}
                      </button>
                    </motion.div>
                  ) : (
                    <motion.button key="send"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      onClick={() => setConfirmTemplate("expiring")}
                      disabled={expiringCount === 0}
                      className="w-full py-2.5 rounded-xl text-xs border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1.5">
                      <Send className="h-3.5 w-3.5" />
                      {expiringCount === 0 ? "Nenhum plano expirando" : `Enviar para ${expiringCount} usuário${expiringCount !== 1 ? "s" : ""}`}
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* ── Template: Custom ── */}
            <div className="rounded-2xl border border-border/40 bg-card/20 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">Email personalizado</h3>
                  <p className="text-xs text-muted-foreground">Escreva sua própria mensagem para o público que escolher</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">
                    Destinatários
                  </label>
                  <select
                    value={customTarget}
                    onChange={e => setCustomTarget(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-border/40 bg-card/30 text-sm text-foreground focus:outline-none focus:border-brand-500/40 transition-colors">
                    <option value="FREE">Grátis ({stats?.free ?? 0})</option>
                    <option value="ALL">Todos os usuários ({users.length})</option>
                    <option value="PREMIUM">Mensal ({stats?.premium ?? 0})</option>
                    <option value="ANNUAL">Anual ({stats?.annual ?? 0})</option>
                    <option value="LIFETIME">Vitalício ({stats?.lifetime ?? 0})</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">
                    Assunto
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Novidades no Flert IA 🚀"
                    value={customSubject}
                    onChange={e => setCustomSubject(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-border/40 bg-card/30 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-brand-500/40 transition-colors" />
                </div>
              </div>

              <div className="mb-5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">
                  Mensagem <span className="normal-case tracking-normal font-normal opacity-50">(texto simples, uma linha por parágrafo)</span>
                </label>
                <textarea
                  rows={5}
                  placeholder={"Olá! Passando para avisar sobre..."}
                  value={customBody}
                  onChange={e => setCustomBody(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-border/40 bg-card/30 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-brand-500/40 transition-colors resize-none leading-relaxed" />
                <p className="text-[11px] text-muted-foreground/40 mt-1.5">
                  O email incluirá automaticamente a saudação com o nome do usuário e um botão "Acessar Flert IA".
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border/30">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {(!customSubject.trim() || !customBody.trim()) && (
                    <><AlertCircle className="h-3.5 w-3.5 text-amber-400/70" /> Preencha assunto e mensagem</>
                  )}
                </div>

                <AnimatePresence mode="wait" initial={false}>
                  {confirmTemplate === "custom" ? (
                    <motion.div key="confirm"
                      initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                      className="flex gap-2">
                      <button onClick={() => setConfirmTemplate(null)}
                        className="px-4 py-2 rounded-xl text-xs border border-border/40 text-muted-foreground hover:text-foreground transition-colors">
                        Cancelar
                      </button>
                      <button onClick={() => sendCampaign("custom")}
                        disabled={sendingTemplate === "custom"}
                        className="px-4 py-2 rounded-xl text-xs bg-violet-500 hover:bg-violet-600 text-white font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5">
                        {sendingTemplate === "custom" ? (
                          <><span className="h-3 w-3 rounded-full border-[1.5px] border-white border-t-transparent animate-spin" /> Enviando...</>
                        ) : (
                          <><Check className="h-3 w-3" /> Confirmar — {customCount} usuário{customCount !== 1 ? "s" : ""}</>
                        )}
                      </button>
                    </motion.div>
                  ) : (
                    <motion.button key="send"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      onClick={() => setConfirmTemplate("custom")}
                      disabled={!customSubject.trim() || !customBody.trim() || customCount === 0}
                      className="px-4 py-2 rounded-xl text-xs border border-violet-500/30 text-violet-400 hover:bg-violet-500/10 font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5">
                      <Send className="h-3.5 w-3.5" />
                      Enviar para {customCount} usuário{customCount !== 1 ? "s" : ""}
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground/30 text-center pb-4">
          Flert IA · Painel Restrito · {new Date().getFullYear()}
        </p>
      </div>

      {/* ── Single-user email modal ── */}
      <AnimatePresence>
        {emailModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setEmailModal(null); }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1,    y: 0  }}
              exit={{    opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="w-full max-w-md rounded-2xl border border-border/50 bg-background shadow-2xl overflow-hidden">

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
                <div className="flex items-center gap-3">
                  <UserAvatar user={emailModal} />
                  <div>
                    <p className="font-semibold text-foreground text-sm leading-tight">{emailModal.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground leading-tight">{emailModal.email}</p>
                  </div>
                </div>
                <button onClick={() => setEmailModal(null)}
                  className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Template selector */}
              <div className="px-5 py-4 space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Escolha o email</p>

                {([
                  { id: "free_upsell", label: "Convide para escolher um plano", desc: "\"Não acha que está na hora de destravar suas conversas?\"", icon: Zap,   color: "text-brand-400"  },
                  { id: "expiring",    label: "Plano expirando em breve",        desc: "Lembra de renovar antes de perder o acesso",                icon: Clock, color: "text-amber-400"  },
                  { id: "custom",      label: "Mensagem personalizada",           desc: "Escreva sua própria mensagem",                               icon: Mail,  color: "text-violet-400" },
                ] as const).map(t => (
                  <button key={t.id} onClick={() => setModalTemplate(t.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                      modalTemplate === t.id
                        ? "border-brand-500/40 bg-brand-500/8"
                        : "border-border/30 hover:border-border/60 hover:bg-accent/30"
                    )}>
                    <t.icon className={cn("h-4 w-4 flex-shrink-0", t.color)} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground leading-tight">{t.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{t.desc}</p>
                    </div>
                    {modalTemplate === t.id && <Check className="h-3.5 w-3.5 text-brand-400 flex-shrink-0" />}
                  </button>
                ))}

                <AnimatePresence>
                  {modalTemplate === "custom" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }} className="space-y-2 overflow-hidden pt-1">
                      <input type="text" placeholder="Assunto do email"
                        value={modalSubject} onChange={e => setModalSubject(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-border/40 bg-card/30 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-brand-500/40 transition-colors" />
                      <textarea rows={4} placeholder="Mensagem..."
                        value={modalBody} onChange={e => setModalBody(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg border border-border/40 bg-card/30 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-brand-500/40 transition-colors resize-none leading-relaxed" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="flex items-center gap-2 px-5 py-4 border-t border-border/40 bg-card/20">
                <a href={`https://mail.google.com/mail/?view=cm&to=${emailModal.email}`}
                  target="_blank" rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl text-xs border border-border/40 text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">
                  Abrir Gmail
                </a>
                <button onClick={sendToUser} disabled={sendingModal}
                  className="flex-1 py-2 rounded-xl text-xs bg-brand-500 hover:bg-brand-600 text-white font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
                  {sendingModal
                    ? <><span className="h-3 w-3 rounded-full border-[1.5px] border-white border-t-transparent animate-spin" /> Enviando...</>
                    : <><Send className="h-3.5 w-3.5" /> Enviar email</>
                  }
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
