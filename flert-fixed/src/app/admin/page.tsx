"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Search, Trash2, Crown, Zap, Star, Heart,
  Copy, Check, RefreshCw, Shield, Activity, BarChart3,
  UserPlus, ChevronDown, X, LogOut, Mail,
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

const planConfig: Record<Plan, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  FREE:     { label: "Grátis",   color: "text-muted-foreground", bg: "bg-muted/50 border-border/40",        icon: Users  },
  PREMIUM:  { label: "Mensal",   color: "text-brand-400",        bg: "bg-brand-500/10 border-brand-500/25", icon: Zap    },
  ANNUAL:   { label: "Anual",    color: "text-brand-400",        bg: "bg-brand-500/10 border-brand-500/25", icon: Star   },
  LIFETIME: { label: "Vitalício",color: "text-amber-400",        bg: "bg-amber-500/10 border-amber-500/25", icon: Crown  },
};

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function Avatar({ user }: { user: AdminUser }) {
  const letter = (user.name ?? user.email ?? "?")[0].toUpperCase();
  if (user.image) {
    return <Image src={user.image} alt="" width={32} height={32} className="rounded-full object-cover" />;
  }
  return (
    <div className="h-8 w-8 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 text-xs font-bold flex-shrink-0">
      {letter}
    </div>
  );
}

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState<Plan | "ALL">("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      setUsers(data.users ?? []);
      setStats(data.stats ?? null);
    } catch {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(u => {
      const matchSearch = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
      const matchPlan = filterPlan === "ALL" || u.subscription === filterPlan;
      return matchSearch && matchPlan;
    });
  }, [users, search, filterPlan]);

  const copyEmail = (email: string, id: string) => {
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    toast.success("Email copiado!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deleteUser = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers(prev => prev.filter(u => u.id !== id));
      setStats(prev => prev ? { ...prev, total: prev.total - 1 } : prev);
      toast.success("Usuário excluído");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao excluir");
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const changePlan = async (id: string, plan: Plan) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, subscription: plan } : u));
      toast.success("Plano atualizado!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao atualizar");
    } finally {
      setUpdatingId(null);
    }
  };

  const statCards = stats ? [
    { label: "Usuários",    value: stats.total,         icon: Users,    color: "text-foreground" },
    { label: "Grátis",      value: stats.free,          icon: Shield,   color: "text-muted-foreground" },
    { label: "Mensal",      value: stats.premium,       icon: Zap,      color: "text-brand-400" },
    { label: "Anual",       value: stats.annual,        icon: Star,     color: "text-brand-400" },
    { label: "Vitalício",   value: stats.lifetime,      icon: Crown,    color: "text-amber-400" },
    { label: "Análises",    value: stats.totalAnalyses, icon: Activity, color: "text-green-400" },
  ] : [];

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Header ── */}
      <header className="h-14 border-b border-border/40 bg-background/98 backdrop-blur-xl sticky top-0 z-30 px-6 flex items-center justify-between">
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
          <button
            onClick={load}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            title="Recarregar"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-destructive"
            title="Sair"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* ── Title ── */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Painel</p>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Controle de Usuários
          </h1>
        </div>

        {/* ── Stats ── */}
        {loading ? (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl border border-border/30 bg-card/20 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {statCards.map((s) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border/40 bg-card/20 px-4 py-4 hover:border-border/70 transition-colors"
              >
                <s.icon className={cn("h-3.5 w-3.5 mb-2", s.color)} />
                <div className={cn("font-display text-2xl font-bold tracking-tight", s.color)}>
                  {s.value.toLocaleString("pt-BR")}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{s.label}</div>
              </motion.div>
            ))}
          </div>
        )}

        {/* ── Filters ── */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-border/40 bg-card/30 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-brand-500/40 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="flex gap-1.5 flex-wrap">
            {(["ALL", "FREE", "PREMIUM", "ANNUAL", "LIFETIME"] as const).map(p => (
              <button
                key={p}
                onClick={() => setFilterPlan(p)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors",
                  filterPlan === p
                    ? "bg-brand-500/15 border-brand-500/35 text-brand-300"
                    : "border-border/40 text-muted-foreground hover:border-border hover:text-foreground"
                )}
              >
                {p === "ALL" ? "Todos" : planConfig[p as Plan].label}
                {p !== "ALL" && stats && (
                  <span className="ml-1 opacity-60">
                    ({p === "FREE" ? stats.free : p === "PREMIUM" ? stats.premium : p === "ANNUAL" ? stats.annual : stats.lifetime})
                  </span>
                )}
              </button>
            ))}
          </div>

          <span className="text-xs text-muted-foreground ml-auto">
            {filtered.length} usuário{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* ── Table ── */}
        <div className="rounded-2xl border border-border/40 bg-card/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 bg-card/30">
                  <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Usuário</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Email</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Plano</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Login</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Análises</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Cadastro</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/20">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 rounded bg-muted/40 animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground text-sm">
                      Nenhum usuário encontrado
                    </td>
                  </tr>
                ) : (
                  <AnimatePresence initial={false}>
                    {filtered.map((user) => {
                      const plan = planConfig[user.subscription];
                      const PlanIcon = plan.icon;
                      const isConfirming = confirmDeleteId === user.id;
                      const isDeleting = deletingId === user.id;
                      const isUpdating = updatingId === user.id;

                      return (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, height: 0 }}
                          className={cn(
                            "border-b border-border/20 hover:bg-card/30 transition-colors group",
                            isConfirming && "bg-destructive/5"
                          )}
                        >
                          {/* User */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <Avatar user={user} />
                              <span className="font-medium text-foreground truncate max-w-[120px]">
                                {user.name ?? "—"}
                              </span>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <span className="text-muted-foreground truncate max-w-[180px]">
                                {user.email ?? "—"}
                              </span>
                              {user.email && (
                                <button
                                  onClick={() => copyEmail(user.email!, user.id)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/40 hover:text-muted-foreground"
                                >
                                  {copiedId === user.id
                                    ? <Check className="h-3 w-3 text-green-400" />
                                    : <Copy className="h-3 w-3" />
                                  }
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Plan */}
                          <td className="px-4 py-3">
                            <div className="relative inline-block">
                              <select
                                value={user.subscription}
                                disabled={isUpdating}
                                onChange={e => changePlan(user.id, e.target.value as Plan)}
                                className={cn(
                                  "appearance-none pl-2 pr-6 py-1 rounded-lg border text-xs font-semibold cursor-pointer transition-colors",
                                  "bg-transparent focus:outline-none",
                                  plan.bg, plan.color,
                                  isUpdating && "opacity-50"
                                )}
                              >
                                <option value="FREE">Grátis</option>
                                <option value="PREMIUM">Mensal</option>
                                <option value="ANNUAL">Anual</option>
                                <option value="LIFETIME">Vitalício</option>
                              </select>
                              <ChevronDown className={cn("absolute right-1.5 top-1/2 -translate-y-1/2 h-2.5 w-2.5 pointer-events-none", plan.color)} />
                            </div>
                          </td>

                          {/* Login method */}
                          <td className="px-4 py-3">
                            <span className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border",
                              user.loginMethod === "google"
                                ? "bg-blue-500/8 border-blue-500/20 text-blue-400"
                                : "bg-muted/50 border-border/30 text-muted-foreground"
                            )}>
                              {user.loginMethod === "google" ? (
                                <>
                                  <span className="text-[10px]">G</span> Google
                                </>
                              ) : (
                                <>
                                  <Mail className="h-2.5 w-2.5" /> Email
                                </>
                              )}
                            </span>
                          </td>

                          {/* Analysis count */}
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-1.5 text-foreground/80">
                              <BarChart3 className="h-3 w-3 text-muted-foreground/50" />
                              {user.analysisCount}
                            </span>
                          </td>

                          {/* Joined */}
                          <td className="px-4 py-3 text-muted-foreground text-xs">
                            {fmt(user.createdAt)}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3">
                            <AnimatePresence mode="wait" initial={false}>
                              {isConfirming ? (
                                <motion.div
                                  key="confirm"
                                  initial={{ opacity: 0, x: 8 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: -8 }}
                                  className="flex items-center gap-1.5"
                                >
                                  <button
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="px-2 py-1 rounded-lg text-xs border border-border/40 text-muted-foreground hover:text-foreground transition-colors"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    onClick={() => deleteUser(user.id)}
                                    disabled={isDeleting}
                                    className="px-2 py-1 rounded-lg text-xs bg-destructive/10 border border-destructive/30 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50"
                                  >
                                    {isDeleting ? "..." : "Confirmar"}
                                  </button>
                                </motion.div>
                              ) : (
                                <motion.button
                                  key="delete"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  onClick={() => setConfirmDeleteId(user.id)}
                                  className="p-1.5 rounded-lg text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                                  title="Excluir usuário"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </motion.button>
                              )}
                            </AnimatePresence>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Footer note ── */}
        <p className="text-xs text-muted-foreground/40 text-center pb-4">
          Painel restrito · Flert IA Admin · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
