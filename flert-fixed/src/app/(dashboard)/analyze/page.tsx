"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Sparkles, Copy, Check, Lock } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const tones = [
  { value: "flirty",  label: "Flertando", emoji: "😏" },
  { value: "funny",   label: "Engraçado", emoji: "😄" },
  { value: "casual",  label: "Casual",    emoji: "😊" },
  { value: "witty",   label: "Espirituoso", emoji: "✨" },
  { value: "serious", label: "Sério",     emoji: "🤔" },
];

const pageContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const pageItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 22 } },
};

export default function AnalyzePage() {
  const router = useRouter();
  const [loading, setLoading]         = useState(false);
  const [image, setImage]             = useState<string | null>(null);
  const [dragOver, setDragOver]       = useState(false);
  const [context, setContext]         = useState("");
  const [tone, setTone]               = useState("flirty");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isPaid, setIsPaid]           = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/payment")
      .then((r) => r.json())
      .then((d) => setIsPaid(d.status === "PREMIUM" || d.status === "LIFETIME"))
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="max-w-md mx-auto mt-16 text-center space-y-5"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 280, damping: 22 }}
          className="h-14 w-14 rounded-2xl bg-brand-500/10 flex items-center justify-center mx-auto"
        >
          <Lock className="h-6 w-6 text-brand-400" />
        </motion.div>
        <div>
          <h2 className="font-display text-xl font-bold text-foreground mb-2">
            Recurso exclusivo para assinantes
          </h2>
          <p className="text-sm text-muted-foreground">
            As análises com IA estão disponíveis apenas nos planos Premium e Vitalício.
          </p>
        </div>
        <Button
          variant="brand"
          className="w-full h-10 text-sm font-semibold"
          onClick={() => router.push("/pricing")}
        >
          Ver planos
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="max-w-4xl space-y-8"
      variants={pageContainer}
      initial="hidden"
      animate="show"
    >

      {/* ── Page header ── */}
      <motion.div variants={pageItem}>
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
          Análise com IA
        </p>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Analisar conversa
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Envie o print e a IA gera 3 sugestões personalizadas para você
        </p>
      </motion.div>

      <motion.div variants={pageItem} className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">

        {/* ── Upload area ── */}
        <div className="space-y-4">
          <motion.div
            animate={{
              borderColor: dragOver
                ? "rgba(255,45,149,0.5)"
                : image
                ? "rgba(255,255,255,0.1)"
                : "rgba(255,255,255,0.15)",
              backgroundColor: dragOver
                ? "rgba(255,45,149,0.04)"
                : "rgba(255,255,255,0.02)",
            }}
            transition={{ duration: 0.15 }}
            className="relative rounded-2xl border-2 border-dashed overflow-hidden"
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
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => { setImage(null); setSuggestions([]); }}
                  className={cn(
                    "absolute top-3 right-3 h-7 w-7 rounded-full",
                    "bg-background/80 backdrop-blur-sm border border-border",
                    "flex items-center justify-center",
                    "text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
                  )}
                >
                  <X className="h-3.5 w-3.5" />
                </motion.button>
              </div>
            ) : (
              <label className="block cursor-pointer">
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                  <motion.div
                    animate={{ scale: dragOver ? 1.12 : 1, y: dragOver ? -4 : 0 }}
                    transition={{ type: "spring", stiffness: 320, damping: 24 }}
                    className="h-11 w-11 rounded-xl bg-muted/80 flex items-center justify-center mb-4"
                  >
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  </motion.div>
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
          </motion.div>

          <motion.div whileTap={{ scale: 0.99 }}>
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
          </motion.div>
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
                <motion.button
                  key={t.value}
                  onClick={() => setTone(t.value)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  className={cn(
                    "relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
                    tone === t.value
                      ? "text-brand-300 border-brand-500/35"
                      : "bg-transparent border-border/40 text-muted-foreground hover:border-border hover:text-foreground"
                  )}
                >
                  {tone === t.value && (
                    <motion.span
                      layoutId="tone-active"
                      className="absolute inset-0 rounded-full bg-brand-500/15 border border-brand-500/35"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative text-sm leading-none">{t.emoji}</span>
                  <span className="relative">{t.label}</span>
                </motion.button>
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
      </motion.div>

      {/* ── Suggestions ── */}
      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.div
            key="suggestions"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-brand-400" />
              <p className="text-sm font-semibold text-foreground">Sugestões de resposta</p>
              <span className="text-xs text-muted-foreground">· escolha uma ou adapte</span>
            </div>

            <div className="space-y-2">
              {suggestions.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: i * 0.07,
                    type: "spring",
                    stiffness: 260,
                    damping: 22,
                  }}
                  whileHover={{ scale: 1.005 }}
                  className="group flex items-start gap-4 p-4 rounded-xl border border-border/40 bg-card/30 hover:border-brand-500/25 hover:bg-card/50 transition-colors"
                >
                  <div className="h-5 w-5 rounded-full border border-brand-500/25 bg-brand-500/10 flex items-center justify-center text-brand-400 text-[10px] font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="flex-1 text-sm leading-relaxed text-foreground/90">{s}</p>
                  <motion.button
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleCopy(s, i)}
                    className={cn(
                      "p-1.5 rounded-md transition-all flex-shrink-0 mt-0.5",
                      copiedIndex === i
                        ? "text-green-400"
                        : "text-muted-foreground/30 hover:text-muted-foreground opacity-0 group-hover:opacity-100"
                    )}
                    title="Copiar"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {copiedIndex === i ? (
                        <motion.span
                          key="check"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </motion.span>
                      ) : (
                        <motion.span key="copy" initial={{ scale: 1 }} exit={{ scale: 0 }}>
                          <Copy className="h-3.5 w-3.5" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
