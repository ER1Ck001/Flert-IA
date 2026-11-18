"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, Camera, ImageUp, LifeBuoy, MessageCirclePlus, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { ToneChipGroup } from "@/components/ui/tone-chip";
import { AnalyzeGate } from "@/components/analyze/AnalyzeGate";
import { ModeCard } from "@/components/analyze/ModeCard";
import { ResultsPanel } from "@/components/analyze/ResultsPanel";
import { StickyActionBar } from "@/components/analyze/StickyActionBar";
import { UploadDropzone } from "@/components/analyze/UploadDropzone";
import { UsageMeter } from "@/components/analyze/UsageMeter";
import { TONES as TONES_ALL, TONES_NO_STORIES } from "@/components/analyze/tones";
import { DUR, EASE } from "@/lib/motion";

const MAX_CONTEXT_CHARS = 2000; // mesmo limite validado no servidor

type View = "hub" | "analyze" | "start" | "situation";
type StartStep = "choose" | "text" | "photo";

export default function AnalyzePage() {
  const router = useRouter();

  // ── Navigation
  const [view, setView]           = useState<View>("hub");
  const [startStep, setStartStep] = useState<StartStep>("choose");

  // ── Subscription / gate
  const [isPaid, setIsPaid]           = useState<boolean | null>(null);
  const [isExpired, setIsExpired]     = useState(false);
  const [isLifetime, setIsLifetime]   = useState(false);
  const [todayCount, setTodayCount]   = useState(0);
  const [dailyLimit, setDailyLimit]   = useState<number | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [loadError, setLoadError]     = useState(false);

  // ── Image upload
  const [image, setImage]     = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // ── Form
  const [context, setContext] = useState("");
  const [tone, setTone]       = useState("flirty");

  // ── Results
  const [loading, setLoading]         = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  // Erro da última geração: fica visível no painel de resultado (o toast some em 4s).
  const [genError, setGenError]       = useState<string | null>(null);
  // Troca de tela sem trocar de rota: após a 1ª navegação, o título da nova tela recebe o foco.
  const navigated = useRef(false);
  const limitReachedRef = useRef(false);

  const loadStatus = () => {
    setLoadError(false);
    setIsPaid(null);
    // Fonte única do status: plano efetivo (já considera expiração), limite e uso de hoje.
    fetch("/api/stats")
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => {
        const today: number = d.today ?? 0;
        const limit: number | null = d.dailyLimit ?? null;
        setIsPaid(Boolean(d.isPaid));
        setIsExpired(Boolean(d.isExpired));
        setIsLifetime(Boolean(d.isLifetime));
        setTodayCount(today);
        setDailyLimit(limit);
        if (d.isPaid && limit !== null && today >= limit) setLimitReached(true);
      })
      .catch(() => setLoadError(true));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadStatus(); }, []);

  // Plano venceu/foi revogado durante a sessão → mostra a tela de renovação.
  const handleForbidden = (data: { expired?: boolean }) => {
    setIsPaid(false);
    setIsExpired(Boolean(data.expired));
  };

  const loadImage = (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Envie uma imagem válida"); return; }
    if (file.size > 10 * 1024 * 1024)   { toast.error("Máximo 10 MB");            return; }
    const reader = new FileReader();
    reader.onloadend = () => { setImage(reader.result as string); setSuggestions([]); };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setImage(null);
    setContext("");
    setTone("flirty");
    setSuggestions([]);
    setLoading(false);
    setCopiedIndex(null);
    setDragOver(false);
    setGenError(null);
  };

  const goTo = (v: View) => {
    navigated.current = true;
    resetForm();
    setView(v);
    if (v === "start") setStartStep("choose");
  };

  const goBack = () => {
    navigated.current = true;
    if (view === "start" && startStep !== "choose") {
      resetForm();
      setStartStep("choose");
    } else {
      resetForm();
      setView("hub");
    }
  };

  // Limite diário: o gate substitui a tela, então o aviso vai por toast (como antes).
  // Demais erros (inclusive falha da IA): mensagem do servidor fica no painel de resultado.
  const showGenError = (err: unknown, fallback: string) => {
    const message = err instanceof Error && err.message ? err.message : fallback;
    if (limitReachedRef.current) { toast.error(message); return; }
    setGenError(message);
  };

  const handleAnalyzeWithImage = async () => {
    if (!image) { toast.error("Envie uma imagem primeiro"); return; }
    setLoading(true);
    setSuggestions([]);
    setGenError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: image, style: tone, context: context.trim() || undefined }),
      });
      const data = await res.json();
      if (res.status === 403) { handleForbidden(data); return; }
      if (res.status === 429 && data.limitReached) { limitReachedRef.current = true; setLimitReached(true); setTodayCount(data.todayCount ?? dailyLimit ?? 0); throw new Error(data.error); }
      if (!res.ok) throw new Error(data.error || "Erro ao analisar");
      setSuggestions(data.suggestions);
      setTodayCount(p => p + 1);
    } catch (err) {
      showGenError(err, "Erro ao analisar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeWithText = async (mode: "start" | "situation") => {
    if (!context.trim()) { toast.error("Escreva o contexto primeiro"); return; }
    setLoading(true);
    setSuggestions([]);
    setGenError(null);
    try {
      const res = await fetch("/api/analyze/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: context.trim(), style: tone, mode }),
      });
      const data = await res.json();
      if (res.status === 403) { handleForbidden(data); return; }
      if (res.status === 429 && data.limitReached) { limitReachedRef.current = true; setLimitReached(true); setTodayCount(data.todayCount ?? dailyLimit ?? 0); throw new Error(data.error); }
      if (!res.ok) throw new Error(data.error || "Erro ao gerar");
      setSuggestions(data.suggestions);
      setTodayCount(p => p + 1);
    } catch (err) {
      showGenError(err, "Erro ao gerar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text.replace(/^[\d.\-*•]\s*/, "").trim());
    } catch {
      toast.error("Não foi possível copiar. Selecione o texto e copie manualmente.");
      return;
    }
    setCopiedIndex(index);
    toast.success("Copiado!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // ── Erro ao carregar o plano (não confundir com "sem plano")
  if (loadError) return <AnalyzeGate kind="error" onAction={loadStatus} />;

  // ── Loading state
  if (isPaid === null) return (
    <div role="status" className="flex min-h-[60vh] items-center justify-center text-violet-400">
      <Spinner size="lg" />
      <span className="sr-only">Carregando seu plano…</span>
    </div>
  );

  // ── Paywall / limit gate
  if (!isPaid || (isPaid && limitReached)) return (
    <AnalyzeGate
      kind={!isPaid ? (isExpired ? "expired" : "no-plan") : "limit"}
      dailyLimit={dailyLimit}
      onAction={() => router.push("/pricing")}
    />
  );

  // ── Render helpers (functions, not components — safe to define here)
  // focusTitle=false nas telas cujo textarea já recebe o foco (autoFocus).
  const renderHeader = (eyebrow: string, title: ReactNode, description: string, withBack = true, focusTitle = true, key?: string) => (
    <div key={key}>
      {withBack && (
        <Button
          variant="ghost"
          size="md"
          className="-ml-3 mb-2"
          leftIcon={<ArrowLeft className="h-4 w-4" aria-hidden />}
          onClick={goBack}
        >
          Voltar
        </Button>
      )}
      <PageHeader
        className="mb-0"
        eyebrow={eyebrow}
        title={title}
        description={description}
        autoFocusTitle={navigated.current && focusTitle}
        actions={<UsageMeter todayCount={todayCount} dailyLimit={dailyLimit} isLifetime={isLifetime} />}
      />
    </div>
  );

  const renderTones = (showStories = false) => {
    const list = showStories ? TONES_ALL : TONES_NO_STORIES;
    return (
      <div className="min-w-0 space-y-2">
        <p className="text-sm font-medium text-text" aria-hidden>Tom</p>
        <ToneChipGroup label="Tom da resposta" options={list} value={tone} onChange={setTone} />
      </div>
    );
  };

  const renderContext = (label: ReactNode, placeholder: string, rows: number, autoFocus = false) => (
    <Field label={label}>
      {(control) => (
        <Textarea
          {...control}
          placeholder={placeholder}
          value={context}
          maxLength={MAX_CONTEXT_CHARS}
          onChange={e => setContext(e.target.value)}
          rows={rows}
          showCount
          className="resize-y"
          autoFocus={autoFocus}
        />
      )}
    </Field>
  );

  const optionalContext = <>Contexto <span className="font-normal text-text-2">(opcional)</span></>;

  const renderSuggestions = (onRetry: () => void) => (
    <ResultsPanel
      loading={loading}
      suggestions={suggestions}
      copiedIndex={copiedIndex}
      onCopy={handleCopy}
      error={genError}
      onRetry={onRetry}
    />
  );

  const renderUploader = () => (
    <UploadDropzone
      image={image}
      dragOver={dragOver}
      onDragOverChange={setDragOver}
      onFile={loadImage}
      onRemove={() => { setImage(null); setSuggestions([]); }}
    />
  );

  // Único botão "Gerar" da view (fixo acima da nav no mobile; no fluxo em lg+).
  const renderBtn = (label: string, disabled: boolean, onClick: () => void) => (
    <StickyActionBar
      label={label}
      disabled={disabled || loading || limitReached}
      loading={loading}
      onClick={onClick}
    />
  );

  // ── Shared motion config
  const slideIn  = { initial: { opacity: 0, x: 24 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -12 } };
  const fadeStep = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 } };
  const transition = { duration: DUR.slow, ease: EASE.out };

  // Layout de envio de imagem: upload + botão | tom + contexto.
  const renderImageGrid = (showStories: boolean, contextPlaceholder: string, contextRows: number, btnLabel: string) => (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-8">
      <div className="min-w-0 space-y-4">
        {renderUploader()}
        {renderBtn(btnLabel, !image, handleAnalyzeWithImage)}
      </div>
      <div className="min-w-0 space-y-6">
        {renderTones(showStories)}
        {renderContext(optionalContext, contextPlaceholder, contextRows)}
      </div>
    </div>
  );

  return (
    <AnimatePresence mode="wait">

      {/* ══ HUB ══ */}
      {view === "hub" && (
        <motion.div key="hub" className="space-y-6"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: DUR.base }}>
          {renderHeader("Análise com IA", <>Analisar <span className="text-signal">conversa</span></>, "Escolha como quer usar a IA hoje.", false)}

          <div className="grid gap-3 md:grid-cols-3 md:gap-4">
            {([
              { id: "analyze" as View,   icon: ImageUp,           title: "Sugestões de respostas", desc: "Envie um print e receba 3 respostas no seu tom." },
              { id: "start"   as View,   icon: MessageCirclePlus, title: "Inicie uma conversa",    desc: "Receba ideias de primeira mensagem a partir de um texto ou de uma foto." },
              { id: "situation" as View, icon: LifeBuoy,          title: "Situação estranha",      desc: "Descreva o que está acontecendo e receba 3 sugestões de resposta." },
            ] as const).map(card => (
              <ModeCard key={card.id} icon={card.icon} title={card.title} description={card.desc} onClick={() => goTo(card.id)} />
            ))}
          </div>
        </motion.div>
      )}

      {/* ══ CARD 1: Sugestões de respostas (image → suggestions) ══ */}
      {view === "analyze" && (
        <motion.div key="analyze" className="space-y-6 pb-24 lg:pb-0" {...slideIn} transition={transition}>
          {renderHeader("Sugestões de respostas", <>Analisar <span className="text-signal">print</span></>, "Envie o print e a IA gera 3 respostas no seu tom.")}
          {renderImageGrid(false, "Fale sobre a pessoa, o que você quer alcançar, o clima da conversa...", 5, "Gerar sugestões")}
          {renderSuggestions(handleAnalyzeWithImage)}
        </motion.div>
      )}

      {/* ══ CARD 2: Inicie uma conversa ══ */}
      {view === "start" && (
        <motion.div key="start" className="space-y-6" {...slideIn} transition={transition}>
          {renderHeader("Inicie uma conversa", <>Primeira <span className="text-signal">mensagem</span></>, "A IA sugere 3 formas de começar a conversa.", true, startStep !== "text", startStep)}

          <AnimatePresence mode="wait">

            {/* Choose sub-option */}
            {startStep === "choose" && (
              <motion.div key="choose" className="space-y-4" {...fadeStep} transition={transition}>
                <p className="text-body text-text-2">Como quer criar a mensagem?</p>
                <div className="grid max-w-2xl gap-3 sm:grid-cols-2 sm:gap-4">
                  <ModeCard
                    icon={PenLine}
                    title="Gerar mensagem"
                    description="Escreva um contexto e a IA sugere 3 aberturas."
                    onClick={() => { resetForm(); setStartStep("text"); }}
                  />
                  <ModeCard
                    icon={Camera}
                    title="Enviar foto"
                    description="Envie um story ou foto e responda na hora."
                    onClick={() => { resetForm(); setStartStep("photo"); }}
                  />
                </div>
              </motion.div>
            )}

            {/* Sub-option: Gerar mensagem (text) */}
            {startStep === "text" && (
              <motion.div key="start-text" className="max-w-2xl space-y-6 pb-24 lg:pb-0" {...fadeStep} transition={transition}>
                {renderContext(
                  "Sobre quem você quer falar?",
                  "Ex: menina que estudou comigo, gosta de viajar e tem bom humor. Quero começar uma conversa leve...",
                  6,
                  true,
                )}
                {renderTones()}
                {renderBtn("Gerar abertura", !context.trim(), () => handleAnalyzeWithText("start"))}
                {renderSuggestions(() => handleAnalyzeWithText("start"))}
              </motion.div>
            )}

            {/* Sub-option: Enviar foto (stories tone included) */}
            {startStep === "photo" && (
              <motion.div key="start-photo" className="space-y-6 pb-24 lg:pb-0" {...fadeStep} transition={transition}>
                {renderImageGrid(true, "Ex: vi o story dela e quero comentar algo...", 4, "Gerar resposta")}
                {renderSuggestions(handleAnalyzeWithImage)}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ══ CARD 3: Situação estranha ══ */}
      {view === "situation" && (
        <motion.div key="situation" className="space-y-6 pb-24 lg:pb-0" {...slideIn} transition={transition}>
          {renderHeader("Situação estranha", <>Situação <span className="text-signal">estranha</span></>, "Descreva o que está acontecendo e receba 3 sugestões de resposta.", true, false)}

          <div className="max-w-2xl space-y-6">
            {renderContext(
              "O que está acontecendo?",
              "Ex: ela parou de responder depois de 3 dias, a última mensagem foi sobre filmes. Quero retomar sem parecer desesperado...",
              7,
              true,
            )}
            {renderTones()}
            {renderBtn("Resolver situação", !context.trim(), () => handleAnalyzeWithText("situation"))}
            {renderSuggestions(() => handleAnalyzeWithText("situation"))}
          </div>
        </motion.div>
      )}

    </AnimatePresence>
  );
}
