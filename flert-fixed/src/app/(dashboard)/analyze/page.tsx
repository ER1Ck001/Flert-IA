"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Upload, X, Sparkles, Copy, Check, Lock } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const tones = [
  { value: "flirty",  label: "Flertando",  emoji: "😏" },
  { value: "funny",   label: "Engraçado",  emoji: "😄" },
  { value: "casual",  label: "Casual",     emoji: "😊" },
  { value: "witty",   label: "Engenioso",  emoji: "✨" },
  { value: "serious", label: "Sério",      emoji: "🤔" },
];

export default function AnalyzePage() {
  const router = useRouter();
  const [loading, setLoading]           = useState(false);
  const [image, setImage]               = useState<string | null>(null);
  const [dragOver, setDragOver]         = useState(false);
  const [context, setContext]           = useState("");
  const [tone, setTone]                 = useState("flirty");
  const [suggestions, setSuggestions]   = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex]   = useState<number | null>(null);
  const [isPaid, setIsPaid]             = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/payment")
      .then((r) => r.json())
      .then((d) => {
        setIsPaid(d.status === "PREMIUM" || d.status === "LIFETIME");
      })
      .catch(() => setIsPaid(false));
  }, []);

  const loadImage = (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Envie uma imagem válida"); return; }
    if (file.size > 10 * 1024 * 1024)   { toast.error("Máximo 10 MB");            return; }
    const reader = new FileReader();
    reader.onloadend = () => { setImage(reader.result as string); setSuggestions([]); };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!image) { toast.error("Envie uma imagem primeiro"); return; }
    setLoading(true);
    setSuggestions([]);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: image, style: tone, context: context.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao analisar");
      setSuggestions(data.suggestions);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao analisar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Copiado!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (isPaid === null) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="h-5 w-5 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isPaid) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center space-y-5">
        <div className="h-14 w-14 rounded-2xl bg-brand-500/10 flex items-center justify-center mx-auto">
          <Lock className="h-6 w-6 text-brand-400" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold text-foreground mb-2">
            Recurso exclusivo para assinantes
          </h2>
          <p className="text-sm text-muted-foreground">
            As análises com IA estão disponíveis apenas nos planos Premium e Vitalício.
          </p>
        </div>
        <Button variant="brand" className="w-full h-10 text-sm font-semibold" onClick={() => router.push("/pricing")}>
          Ver planos
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8">

      {/* ── Page header ── */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
          Análise com IA
        </p>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Analisar conversa
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Envie o print e a IA gera 3 sugestões personalizadas para você
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">

        {/* ── Upload area ── */}
        <div className="space-y-4">
          <div
            className={cn(
              "relative rounded-2xl border-2 border-dashed overflow-hidden transition-all duration-200",
              dragOver
                ? "border-brand-500/50 bg-brand-500/5"
                : image
                ? "border-border/30 bg-card/20"
                : "border-border/40 bg-card/10 hover:border-border/60 hover:bg-card/20"
            )}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) loadImage(f);
            }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
          >
            {image ? (
              <div className="relative">
                <div className="relative h-72 w-full">
                  <Image
                    src={image}
                    alt="Print da conversa"
                    fill
                    className="object-contain bg-background/30"
                  />
                </div>
                <button
                  onClick={() => { setImage(null); setSuggestions([]); }}
                  className={cn(
                    "absolute top-3 right-3 h-7 w-7 rounded-full",
                    "bg-background/80 backdrop-blur-sm border border-border",
                    "flex items-center justify-center",
                    "text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
                  )}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <label className="block cursor-pointer">
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                  <div className="h-11 w-11 rounded-xl bg-muted/80 flex items-center justify-center mb-4">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    {dragOver ? "Solte aqui" : "Arraste o print aqui"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ou{" "}
                    <span className="text-brand-400 hover:text-brand-300 transition-colors">
                      clique para selecionar
                    </span>
                    {" "}· PNG, JPG até 10 MB
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) loadImage(f); }}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </label>
            )}
          </div>

          <Button
            onClick={handleAnalyze}
            disabled={!image || loading}
            className="w-full h-10 text-sm font-semibold"
            variant="brand"
          >
            {loading ? (
              <>
                <span className="mr-2 h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Gerar sugestões
              </>
            )}
          </Button>
        </div>

        {/* ── Options panel ── */}
        <div className="space-y-6">

          {/* Tone pills */}
          <div>
            <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3 block">
              Tom da resposta
            </Label>
            <div className="flex flex-wrap gap-2">
              {tones.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTone(t.value)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-150",
                    tone === t.value
                      ? "bg-brand-500/15 border-brand-500/35 text-brand-300"
                      : "bg-transparent border-border/40 text-muted-foreground hover:border-border hover:text-foreground"
                  )}
                >
                  <span className="text-sm leading-none">{t.emoji}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Context */}
          <div>
            <Label
              htmlFor="context"
              className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3 block"
            >
              Contexto{" "}
              <span className="normal-case tracking-normal font-normal text-muted-foreground/50">
                (opcional)
              </span>
            </Label>
            <Textarea
              id="context"
              placeholder="Fale sobre a pessoa, o que você quer alcançar, o clima da conversa..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={5}
              className="resize-none text-sm bg-card/30 border-border/40 focus:border-brand-500/40 placeholder:text-muted-foreground/40 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* ── Suggestions ── */}
      {suggestions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-brand-400" />
            <p className="text-sm font-semibold text-foreground">Sugestões de resposta</p>
            <span className="text-xs text-muted-foreground">· escolha uma ou adapte</span>
          </div>

          <div className="space-y-2">
            {suggestions.map((s, i) => (
              <div
                key={i}
                className={cn(
                  "group flex items-start gap-4 p-4 rounded-xl",
                  "border border-border/40 bg-card/30",
                  "hover:border-brand-500/25 hover:bg-card/50",
                  "transition-all duration-200 animate-fade-in"
                )}
                style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
              >
                <div className="h-5 w-5 rounded-full border border-brand-500/25 bg-brand-500/10 flex items-center justify-center text-brand-400 text-[10px] font-bold flex-shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <p className="flex-1 text-sm leading-relaxed text-foreground/90">{s}</p>
                <button
                  onClick={() => handleCopy(s, i)}
                  className={cn(
                    "p-1.5 rounded-md transition-all flex-shrink-0 mt-0.5",
                    copiedIndex === i
                      ? "text-green-400"
                      : "text-muted-foreground/30 hover:text-muted-foreground opacity-0 group-hover:opacity-100"
                  )}
                  title="Copiar"
                >
                  {copiedIndex === i
                    ? <Check className="h-3.5 w-3.5" />
                    : <Copy className="h-3.5 w-3.5" />
                  }
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
