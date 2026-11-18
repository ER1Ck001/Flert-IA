"use client";

import { useState, useEffect } from "react";
import { History as HistoryIcon, Search, Trash2, Copy, Check, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
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

  useEffect(() => {
    const fetchHistory = async () => {
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
        toast.error("Erro ao carregar histórico");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const filteredHistory = history.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copiado!");
    setTimeout(() => setCopiedId(null), 2000);
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

      {loading ? (
        <div className="grid gap-4" aria-busy="true" aria-label="Carregando histórico">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filteredHistory.length === 0 ? (
        search ? (
          <EmptyState
            icon={Search}
            title="Nenhuma análise encontrada"
            description="Tente buscar com outros termos"
          />
        ) : (
          <EmptyState
            icon={HistoryIcon}
            title="Nenhuma análise ainda"
            description="Comece analisando sua primeira conversa"
            action={
              <Button
                variant="signal"
                leftIcon={<Sparkles className="h-4 w-4" aria-hidden />}
                onClick={() => (window.location.href = "/analyze")}
              >
                Fazer análise
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
                      onClick={() => handleDelete(item.id)}
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
                              aria-label={copied ? "Sugestão copiada" : "Copiar sugestão"}
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
    </div>
  );
}
