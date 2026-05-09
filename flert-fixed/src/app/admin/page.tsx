"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Search, Trash2, Crown, Zap, Star, Heart,
  Copy, Check, RefreshCw, Shield, Activity, BarChart3,
  ChevronDown, ChevronUp, LogOut, Mail, Download,
  TrendingUp, UserPlus, DollarSign, X, ChevronRight,
  Calendar, Clock, Sparkles, Eye, EyeOff,
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
  const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  return days;
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
  const weekAgo    = Date.now() - 7 * 86400000;
  const newThisWeek = users.filter(u => new Date(u.createdAt).getTime() >= weekAgo).length;
  const paidUsers   = users.filter(u => u.subscription !== "FREE").length;
  const mrr         = users.reduce((acc, u) => acc + (PLAN_PRICES[u.subscription] ?? 0), 0);

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

                            {/* Usuário */}
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

                            {/* Email */}
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

                            {/* Plano */}
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

                            {/* Login */}
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

                            {/* Análises */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <div className={cn(
                                  "h-1.5 w-1.5 rounded-full flex-shrink-0",
                                  user.analysisCount > 10 ? "bg-green-400" : user.analysisCount > 0 ? "bg-amber-400" : "bg-muted-foreground/30"
                                )} />
                                <span className="text-foreground/80 text-sm">{user.analysisCount}</span>
                              </div>
                            </td>

                            {/* Cadastro */}
                            <td className="px-4 py-3 text-muted-foreground text-xs">{fmt(user.createdAt)}</td>

                            {/* Expira */}
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

                            {/* Ações */}
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
                                      <a href={`https://mail.google.com/mail/?view=cm&to=${user.email}`}
                                        target="_blank" rel="noopener noreferrer"
                                        className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                                        title="Enviar email">
                                        <Mail className="h-3.5 w-3.5" />
                                      </a>
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

                          {/* Expanded row */}
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

        <p className="text-xs text-muted-foreground/30 text-center pb-4">
          Flert IA · Painel Restrito · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
