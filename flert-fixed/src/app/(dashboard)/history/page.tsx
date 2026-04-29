"use client";

import { useState, useEffect } from "react";
import { History as HistoryIcon, Search, Trash2, Copy, Check, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

interface HistoryItem {
  id: string;
  title: string;
  style: string;
  date: string;
  suggestions: string[];
}

function SkeletonCard() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="h-5 w-48 bg-muted animate-pulse rounded" />
        <div className="h-4 w-32 bg-muted animate-pulse rounded mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </CardContent>
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
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Histórico</h1>
          <p className="text-muted-foreground mt-1">Todas as suas análises anteriores</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar análises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filteredHistory.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="py-16 text-center">
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              {search ? (
                <Search className="h-8 w-8 text-muted-foreground" />
              ) : (
                <HistoryIcon className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {search ? "Nenhuma análise encontrada" : "Nenhuma análise ainda"}
            </h3>
            <p className="text-muted-foreground text-sm">
              {search
                ? "Tente buscar com outros termos"
                : "Comece analisando sua primeira conversa"}
            </p>
            {!search && (
              <Button variant="brand" className="mt-4" onClick={() => (window.location.href = "/analyze")}>
                <Sparkles className="mr-2 h-4 w-4" />
                Fazer análise
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredHistory.map((item) => (
            <Card key={item.id} className="border-border/50 hover:border-brand-500/20 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{item.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Clock className="h-3 w-3" />
                      {new Date(item.date).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      <span className="mx-1">•</span>
                      <span className="text-brand-500">{item.style}</span>
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                    className="hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {item.suggestions.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">Sem sugestões salvas</p>
                  ) : (
                    item.suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="p-3 rounded-lg bg-muted/50 flex items-start justify-between gap-2 hover:bg-muted/80 transition-colors"
                      >
                        <p className="text-sm flex-1">{suggestion}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(suggestion, `${item.id}-${index}`)}
                          className="flex-shrink-0"
                        >
                          {copiedId === `${item.id}-${index}` ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
