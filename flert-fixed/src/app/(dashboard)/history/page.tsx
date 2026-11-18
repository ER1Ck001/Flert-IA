"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AlertTriangle, History as HistoryIcon, Search, Trash2, Copy, Check, Clock, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PageHeader } from "@/components/ui/page-header";
import { TONES, getToneLabel } from "@/components/analyze/tones";
import toast from "react-hot-toast";

interface HistoryItem {
  id: string;
  title: string;
  style: string;
  date: string;
  suggestions: string[];
}

/**
 * Só apresentação: o título salvo pela API é "<modo> <tom> - <data>" (ex.: "Análise flirty - 10/11/2026").
 * Se o último termo antes do " - " for uma chave de tom conhecida, devolve o rótulo legível.
 */
function toneKeyFromTitle(title: string): string | null {
  const key = title.split(" - ")[0]?.trim().split(" ").pop();
  return key && TONES.some((t) => t.value === key) ? key : null;
}

function displayTitle(title: string): string {
  const key = toneKeyFromTitle(title);
  if (!key) return title;
  const [head, ...rest] = title.split(" - ");
  const mode = head.trim().split(" ").slice(0, -1).join(" ");
  return [mode || head, ...rest].join(" · ");
}

function SkeletonCard() {
  return (
    <Card className="space-y-4 p-4 sm:p-6">
      <div className="space-y-2">
        <Skeleton className="h-5 w-48 max-w-full" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </Card>
  );
}

export default function HistoryPage() {
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<HistoryItem | null>(null);

  const fetchHistory = useCallback(async () => {
      setLoading(true);
      setLoadError(false);
      try {
        const res = await fetch("/api/history");
        if (!res.ok) throw new Error("Falha ao buscar histórico");
        const data = await res.json();

        const mapped: HistoryItem[] = (data.conversations || []).map(
          (conv: {
            id: string;
            title: string | null;
            createdAt: string;
            messages: { role: string; content: string }[];
          }) => ({
            id: conv.id,
            title: conv.title || "Análise sem título",
            style: conv.title?.split(" - ")[0] || "Análise",
            date: conv.createdAt,
            suggestions: conv.messages
              .filter((m) => m.role === "assistant")
              .map((m) => m.content),
          })
        );

        setHistory(mapped);
      } catch {
        // Estado de erro visível na página (não confundir com "nenhuma análise").
        setLoadError(true);
      } finally {
        setLoading(false);
      }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Busca pelo título exibido, pelo rótulo do tom e pelo texto das sugestões.
  const q = search.trim().toLowerCase();
  const filteredHistory = history.filter((item) => {
    if (!q) return true;
    const key = toneKeyFromTitle(item.title);
    const haystack = [item.title, displayTitle(item.title), key ? getToneLabel(key) : "", ...item.suggestions];
    return haystack.some((t) => t.toLowerCase().includes(q));
  });

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      toast.error("Não foi possível copiar. Selecione o texto e copie manualmente.");
      return;
    }
    setCopiedId(id);
    toast.success("Copiado!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    setPendingDelete(null);
    handleDelete(id);
  };

  const handleDelete = async (id: string) => {
    const prev = history;
    setHistory(history.filter((item) => item.id !== id));

    try {
      const res = await fetch(`/api/history?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Análise removida");
    } catch {
      setHistory(prev);
      toast.error("Erro ao remover análise");
    }
  };

  return (
    <div className="mx-auto w-full max-w-app">
      <PageHeader
        eyebrow="Sua conta"
        title="Histórico"
        description="Todas as suas análises anteriores"
        actions={
          <div className="relative w-full sm:w-72">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-3"
              aria-hidden
            />
            <Input
              type="search"
              aria-label="Buscar análises"
              placeholder="Buscar análises..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11"
            />
          </div>
        }
      />

      {q && !loading && !loadError && (
        <p aria-live="polite" className="mb-4 text-sm text-text-2">
          {filteredHistory.length === 1 ? "1 análise encontrada" : `${filteredHistory.length} análises encontradas`}
        </p>
      )}

      {loading ? (
        <div className="grid gap-4" aria-busy="true" aria-label="Carregando histórico">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : loadError ? (
        <div role="alert" className="flex flex-col items-center gap-3 rounded-lg border border-danger/30 bg-danger/10 px-6 py-10 text-center">
          <AlertTriangle className="h-6 w-6 text-danger" aria-hidden />
          <p className="font-display text-h3 text-text">Não foi possível carregar o histórico</p>
          <p className="max-w-sm text-sm text-text-2">Verifique sua conexão e tente novamente. Suas análises continuam salvas.</p>
          <Button variant="secondary" leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />} onClick={fetchHistory}>
            Tentar novamente
          </Button>
        </div>
      ) : filteredHistory.length === 0 ? (
        search ? (
          <EmptyState
            icon={Search}
            title="Nenhuma análise encontrada"
            description="Tente buscar pelo tom (ex.: Engraçado) ou por uma palavra da sugestão."
          />
        ) : (
          <EmptyState
            icon={HistoryIcon}
            title="Nenhuma análise ainda"
            description="Comece analisando sua primeira conversa"
            action={
              <Button asChild variant="signal" leftIcon={<Sparkles className="h-4 w-4" aria-hidden />}>
                <Link href="/analyze">Fazer análise</Link>
              </Button>
            }
          />
        )
      ) : (
        <ul className="grid gap-4" aria-label="Análises">
          {filteredHistory.map((item) => {
            const toneKey = toneKeyFromTitle(item.title);
            return (
              <li key={item.id}>
                <Card variant="interactive" className="p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-display text-h3 text-text break-words">{displayTitle(item.title)}</h2>
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-text-2">
                        <Clock className="h-4 w-4 shrink-0" aria-hidden />
                        <time dateTime={item.date}>
                          {new Date(item.date).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </time>
                        <Badge variant="violet">{toneKey ? getToneLabel(toneKey) : item.style}</Badge>
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remover análise"
                      onClick={() => setPendingDelete(item)}
                      className="-mr-2 -mt-2 hover:bg-danger/10 hover:text-danger"
                    >
                      <Trash2 className="h-5 w-5" aria-hidden />
                    </Button>
                  </div>

                  <div className="mt-4 space-y-2">
                    {item.suggestions.length === 0 ? (
                      <p className="text-sm text-text-2">Sem sugestões salvas</p>
                    ) : (
                      item.suggestions.map((suggestion, index) => {
                        const copyKey = `${item.id}-${index}`;
                        const copied = copiedId === copyKey;
                        return (
                          <div
                            key={index}
                            className="flex items-start justify-between gap-2 rounded-md border border-border bg-surface-2 py-1 pl-3 pr-1"
                          >
                            <p className="flex-1 py-2.5 text-sm text-text break-words">{suggestion}</p>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={copied ? `Sugestão ${index + 1} copiada` : `Copiar sugestão ${index + 1}`}
                              onClick={() => handleCopy(suggestion, copyKey)}
                            >
                              {copied ? (
                                <Check className="h-4 w-4 text-success" aria-hidden />
                              ) : (
                                <Copy className="h-4 w-4" aria-hidden />
                              )}
                            </Button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => { if (!open) setPendingDelete(null); }}
        title="Remover esta análise?"
        description="A análise e as sugestões salvas serão apagadas do seu histórico. Não dá para desfazer."
        confirmLabel="Remover"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
