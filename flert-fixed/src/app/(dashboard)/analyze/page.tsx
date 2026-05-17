"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const TONES_ALL = [
  { value: "flirty",  label: "Flertando", emoji: "😏" },
  { value: "funny",   label: "Engraçado",  emoji: "😄" },
  { value: "casual",  label: "Casual",     emoji: "😊" },
  { value: "witty",   label: "Afiado",     emoji: "✨" },
  { value: "serious", label: "Sério",      emoji: "🤔" },
  { value: "pickup",  label: "Cantada",    emoji: "🔥" },
  { value: "stories", label: "Stories",    emoji: "📱" },
];
const TONES_NO_STORIES = TONES_ALL.filter(t => t.value !== "stories");

type View = "hub" | "analyze" | "start" | "situation";
type StartStep = "choose" | "text" | "photo";

export default function AnalyzePage() {
  const router = useRouter();

  // ── Navigation
  const [view, setView]           = useState<View>("hub");
  const [startStep, setStartStep] = useState<StartStep>("choose");

  // ── Subscription / gate
  const [isPaid, setIsPaid]           = useState<boolean | null>(null);
  const [isLifetime, setIsLifetime]   = useState(false);
  const [todayCount, setTodayCount]   = useState(0);
  const [dailyLimit, setDailyLimit]   = useState(30);
  const [limitReached, setLimitReached] = useState(false);

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

  useEffect(() => {
    fetch("/api/payment")
      .then(r => r.json())
      .then(d => {
        setIsPaid(d.status === "PREMIUM" || d.status === "ANNUAL" || d.status === "LIFETIME");
        setIsLifetime(d.status === "LIFETIME");
      })
      .catch(() => setIsPaid(false));

    fetch("/api/stats")
      .then(r => r.json())
      .then(d => {
        const limit = d.dailyLimit ?? 30;
        setTodayCount(d.today ?? 0);
        setDailyLimit(limit);
        if (!d.isLifetime && (d.today ?? 0) >= limit) setLimitReached(true);
      })
      .catch(() => {});
  }, []);

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
  };

  const goTo = (v: View) => {
    resetForm();
    setView(v);
    if (v === "start") setStartStep("choose");
  };

  const goBack = () => {
    if (view === "start" && startStep !== "choose") {
      resetForm();
      setStartStep("choose");
    } else {
      resetForm();
      setView("hub");
    }
  };

  const handleAnalyzeWithImage = async () => {
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
      if (res.status === 429) { setLimitReached(true); setTodayCount(data.todayCount ?? dailyLimit); throw new Error(data.error); }
      if (!res.ok) throw new Error(data.error || "Erro ao analisar");
      setSuggestions(data.suggestions);
      setTodayCount(p => p + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao analisar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeWithText = async (mode: "start" | "situation") => {
    if (!context.trim()) { toast.error("Escreva o contexto primeiro"); return; }
    setLoading(true);
    setSuggestions([]);
    try {
      const res = await fetch("/api/analyze/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: context.trim(), style: tone, mode }),
      });
      const data = await res.json();
      if (res.status === 429) { setLimitReached(true); setTodayCount(data.todayCount ?? dailyLimit); throw new Error(data.error); }
      if (!res.ok) throw new Error(data.error || "Erro ao gerar");
      setSuggestions(data.suggestions);
      setTodayCount(p => p + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao gerar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text.replace(/^[\d.\-*•]\s*/, "").trim());
    setCopiedIndex(index);
    toast.success("Copiado!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // ── Loading state
  if (isPaid === null) return (
    <div className="az-loading"><span className="az-spin az-spin--lg" /></div>
  );

  // ── Paywall / limit gate
  if (!isPaid || (isPaid && limitReached)) return (
    <>
      <style dangerouslySetInnerHTML={{ __html: AZ_CSS }} />
      <motion.div className="az-gate"
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
        <div className="az-gate-icon">{!isPaid ? "🔒" : "⏳"}</div>
        <h2 className="az-gate-title">{!isPaid ? "Recurso Premium" : "Limite diário atingido"}</h2>
        <p className="az-gate-sub">
          {!isPaid
            ? "As análises com IA estão disponíveis apenas nos planos Premium e Vitalício."
            : `Você já fez ${dailyLimit} análises hoje. O limite reinicia à meia-noite. Quer ilimitado? Faça upgrade para o plano Vitalício.`
          }
        </p>
        <button className="az-gate-btn" onClick={() => router.push("/pricing")}>
          {!isPaid ? "Ver planos" : "Ver plano Vitalício"}
        </button>
      </motion.div>
    </>
  );

  // ── Render helpers (functions, not components — safe to define here)
  const toneKey = `${view}-${startStep}`;

  const renderTones = (showStories = false) => {
    const list = showStories ? TONES_ALL : TONES_NO_STORIES;
    return (
      <div className="az-section">
        <p className="az-section-label">Tom</p>
        <div className="az-tones">
          {list.map(t => (
            <motion.button
              key={t.value}
              className={`az-tone${tone === t.value ? " az-tone--active" : ""}`}
              onClick={() => setTone(t.value)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}>
              {tone === t.value && (
                <motion.span layoutId={`az-tone-bg-${toneKey}`} className="az-tone-bg"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }} />
              )}
              <span className="az-tone-emoji">{t.emoji}</span>
              <span className="az-tone-label">{t.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    );
  };

  const renderSuggestions = () => (
    <AnimatePresence>
      {suggestions.length > 0 && (
        <motion.div className="az-sugs"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
          <div className="az-sugs-head">
            <span className="az-sugs-star">✦</span>
            <p className="az-sugs-title">Sugestões</p>
            <span className="az-sugs-hint">— escolha uma ou adapte</span>
          </div>
          <div className="az-sugs-list">
            {suggestions.map((s, i) => (
              <motion.div key={i} className="az-sug"
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
                <div className="az-sug-num">{i + 1}</div>
                <p className="az-sug-text">{s}</p>
                <motion.button
                  className={`az-sug-copy${copiedIndex === i ? " az-sug-copy--done" : ""}`}
                  onClick={() => handleCopy(s, i)}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  title="Copiar">
                  {copiedIndex === i ? "✓" : "⧉"}
                </motion.button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const renderUploader = () => (
    <motion.div
      className={`az-drop${dragOver ? " az-drop--over" : ""}${image ? " az-drop--filled" : ""}`}
      animate={{ borderColor: dragOver ? "rgba(139,10,42,.55)" : image ? "rgba(139,10,42,.22)" : "rgba(139,10,42,.12)" }}
      transition={{ duration: 0.15 }}
      onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) loadImage(f); }}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}>
      {image ? (
        <>
          <div className="az-img-wrap">
            <Image src={image} alt="Print" fill className="az-img" />
          </div>
          <button className="az-remove" onClick={() => { setImage(null); setSuggestions([]); }} title="Remover">✕</button>
        </>
      ) : (
        <label className="az-drop-label">
          <motion.div className="az-drop-icon"
            animate={{ y: dragOver ? -6 : 0, scale: dragOver ? 1.12 : 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}>↑</motion.div>
          <p className="az-drop-text">{dragOver ? "Solte aqui" : "Arraste o print aqui"}</p>
          <p className="az-drop-hint">ou <span>clique para selecionar</span> · PNG, JPG até 10 MB</p>
          <input type="file" accept="image/*"
            onChange={e => { const f = e.target.files?.[0]; if (f) loadImage(f); }}
            className="az-file-input" />
        </label>
      )}
    </motion.div>
  );

  const renderBtn = (label: string, disabled: boolean, onClick: () => void) => (
    <motion.button
      className="az-btn"
      disabled={disabled || loading || limitReached}
      onClick={onClick}
      whileHover={!loading && !disabled ? { opacity: 0.88, y: -1 } : {}}
      whileTap={!loading && !disabled ? { y: 0 } : {}}
      transition={{ duration: 0.15 }}>
      {loading
        ? <><span className="az-spin" /> Gerando...</>
        : <><span className="az-btn-star">✦</span> {label}</>
      }
    </motion.button>
  );

  const renderCounter = () => !isLifetime ? (
    <div className={`az-counter${todayCount >= dailyLimit - 2 ? " az-counter--warn" : ""}`}>
      <span className="az-counter-n">{todayCount}</span>
      <span className="az-counter-sep">/</span>
      <span className="az-counter-total">{dailyLimit}</span>
      <span className="az-counter-label">hoje</span>
    </div>
  ) : null;

  // ── Shared motion config
  const slideIn  = { initial: { opacity: 0, x: 24 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -12 } };
  const transition = { duration: 0.4, ease: [0.16, 1, 0.3, 1] as number[] };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: AZ_CSS }} />

      <AnimatePresence mode="wait">

        {/* ══ HUB ══ */}
        {view === "hub" && (
          <motion.div key="hub" className="az-wrap"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4 }}>

            <div className="az-header">
              <div>
                <p className="az-eyebrow">— análise com ia —</p>
                <h1 className="az-title">Analisar<br /><em>conversa</em></h1>
                <p className="az-sub">Escolha como quer usar a IA hoje.</p>
              </div>
              {renderCounter()}
            </div>

            <div className="az-hub-grid">
              {([
                { id: "analyze" as View,   icon: "📸", title: "Sugestões de respostas", desc: "Envie um print e receba 3 respostas no seu tom.", tag: "MAIS USADO" },
                { id: "start"   as View,   icon: "💬", title: "Inicie uma conversa",    desc: "Crie a abertura perfeita com texto ou uma foto.", tag: null },
                { id: "situation" as View, icon: "⚡", title: "Situação estranha",       desc: "Descreva o que está acontecendo e receba respostas certeiras.", tag: null },
              ] as const).map((card, idx) => (
                <motion.button
                  key={card.id}
                  className="az-card"
                  onClick={() => goTo(card.id)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}>
                  {card.tag && <div className="az-card-tag">{card.tag}</div>}
                  <div className="az-card-icon">{card.icon}</div>
                  <p className="az-card-title">{card.title}</p>
                  <p className="az-card-desc">{card.desc}</p>
                  <div className="az-card-arrow">→</div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ══ CARD 1: Sugestões de respostas (image → suggestions) ══ */}
        {view === "analyze" && (
          <motion.div key="analyze" className="az-wrap" {...slideIn} transition={transition}>
            <div className="az-header">
              <div>
                <button className="az-back" onClick={goBack}>← Voltar</button>
                <p className="az-eyebrow">— sugestões de respostas —</p>
                <h1 className="az-title">Analisar<br /><em>print</em></h1>
                <p className="az-sub">Envie o print e a IA gera 3 respostas no seu tom.</p>
              </div>
              {renderCounter()}
            </div>

            <div className="az-grid">
              <div className="az-left">
                {renderUploader()}
                {renderBtn("Gerar sugestões", !image, handleAnalyzeWithImage)}
              </div>
              <div className="az-right">
                {renderTones()}
                <div className="az-section">
                  <p className="az-section-label">Contexto <span className="az-optional">(opcional)</span></p>
                  <textarea
                    className="az-context"
                    placeholder="Fale sobre a pessoa, o que você quer alcançar, o clima da conversa..."
                    value={context}
                    onChange={e => setContext(e.target.value)}
                    rows={5}
                  />
                </div>
              </div>
            </div>

            {renderSuggestions()}
          </motion.div>
        )}

        {/* ══ CARD 2: Inicie uma conversa ══ */}
        {view === "start" && (
          <motion.div key="start" className="az-wrap" {...slideIn} transition={transition}>
            <div className="az-header">
              <div>
                <button className="az-back" onClick={goBack}>← Voltar</button>
                <p className="az-eyebrow">— inicie uma conversa —</p>
                <h1 className="az-title">Abertura<br /><em>perfeita</em></h1>
                <p className="az-sub">Crie a primeira mensagem certeira.</p>
              </div>
              {renderCounter()}
            </div>

            <AnimatePresence mode="wait">

              {/* Choose sub-option */}
              {startStep === "choose" && (
                <motion.div key="choose" className="az-start-choose"
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.32 }}>
                  <p className="az-start-choose-label">Como quer criar a mensagem?</p>
                  <div className="az-start-opts">
                    <motion.button className="az-start-opt"
                      onClick={() => { resetForm(); setStartStep("text"); }}
                      whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}>
                      <span className="az-start-opt-icon">✍️</span>
                      <p className="az-start-opt-title">Gerar mensagem</p>
                      <p className="az-start-opt-desc">Escreva um contexto e a IA cria a abertura perfeita.</p>
                    </motion.button>
                    <motion.button className="az-start-opt"
                      onClick={() => { resetForm(); setStartStep("photo"); }}
                      whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}>
                      <span className="az-start-opt-icon">📸</span>
                      <p className="az-start-opt-title">Enviar foto</p>
                      <p className="az-start-opt-desc">Envie um story ou foto e responda na hora.</p>
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Sub-option: Gerar mensagem (text) */}
              {startStep === "text" && (
                <motion.div key="start-text" className="az-situation-wrap"
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.32 }}>
                  <div className="az-section">
                    <p className="az-section-label">Sobre quem você quer falar?</p>
                    <textarea
                      className="az-context az-context--big"
                      placeholder="Ex: menina que estudou comigo, gosta de viajar e tem bom humor. Quero começar uma conversa leve..."
                      value={context}
                      onChange={e => setContext(e.target.value)}
                      rows={6}
                      autoFocus
                    />
                  </div>
                  {renderTones()}
                  {renderBtn("Gerar abertura", !context.trim(), () => handleAnalyzeWithText("start"))}
                  {renderSuggestions()}
                </motion.div>
              )}

              {/* Sub-option: Enviar foto (stories tone included) */}
              {startStep === "photo" && (
                <motion.div key="start-photo"
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.32 }}>
                  <div className="az-grid">
                    <div className="az-left">
                      {renderUploader()}
                      {renderBtn("Gerar resposta", !image, handleAnalyzeWithImage)}
                    </div>
                    <div className="az-right">
                      {renderTones(true)}
                      <div className="az-section">
                        <p className="az-section-label">Contexto <span className="az-optional">(opcional)</span></p>
                        <textarea
                          className="az-context"
                          placeholder="Ex: vi o story dela e quero comentar algo..."
                          value={context}
                          onChange={e => setContext(e.target.value)}
                          rows={4}
                        />
                      </div>
                    </div>
                  </div>
                  {renderSuggestions()}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ══ CARD 3: Situação estranha ══ */}
        {view === "situation" && (
          <motion.div key="situation" className="az-wrap" {...slideIn} transition={transition}>
            <div className="az-header">
              <div>
                <button className="az-back" onClick={goBack}>← Voltar</button>
                <p className="az-eyebrow">— situação estranha —</p>
                <h1 className="az-title">Situação<br /><em>difícil</em></h1>
                <p className="az-sub">Descreva o que está acontecendo e receba 3 respostas certeiras.</p>
              </div>
              {renderCounter()}
            </div>

            <div className="az-situation-wrap">
              <div className="az-section">
                <p className="az-section-label">O que está acontecendo?</p>
                <textarea
                  className="az-context az-context--big"
                  placeholder="Ex: ela parou de responder depois de 3 dias, a última mensagem foi sobre filmes. Quero retomar sem parecer desesperado..."
                  value={context}
                  onChange={e => setContext(e.target.value)}
                  rows={7}
                  autoFocus
                />
              </div>
              {renderTones()}
              {renderBtn("Resolver situação", !context.trim(), () => handleAnalyzeWithText("situation"))}
              {renderSuggestions()}
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </>
  );
}

const AZ_CSS = `
/* ── LOADING ── */
.az-loading { min-height:60vh; display:flex; align-items:center; justify-content:center; }
.az-spin { width:16px; height:16px; border:1.5px solid rgba(139,10,42,.25); border-top-color:#8B0A2A; border-radius:50%; animation:az-rot .7s linear infinite; display:inline-block; flex-shrink:0; }
.az-spin--lg { width:28px; height:28px; }
@keyframes az-rot { to { transform:rotate(360deg); } }

/* ── GATE ── */
.az-gate { max-width:400px; margin:5rem auto; text-align:center; }
.az-gate-icon { font-size:3rem; margin-bottom:1.5rem; }
.az-gate-title { font-family:var(--font-cormorant),Georgia,serif; font-size:2rem; font-weight:600; color:var(--tx); margin-bottom:.75rem; letter-spacing:-0.02em; }
.az-gate-sub { font-size:.9rem; line-height:1.8; color:var(--tx-2); font-weight:300; margin-bottom:2rem; }
.az-gate-btn { display:inline-block; padding:.9rem 2.5rem; background:linear-gradient(135deg,#8B0A2A,#B01234); color:#F2EDE8; font-size:10px; letter-spacing:.22em; text-transform:uppercase; font-weight:800; font-family:'Cabinet Grotesk',sans-serif; border:none; cursor:pointer; transition:opacity .2s,transform .15s; }
.az-gate-btn:hover { opacity:.88; transform:translateY(-1px); }

/* ── WRAP ── */
.az-wrap { max-width:960px; display:flex; flex-direction:column; gap:3rem; }

/* ── HEADER ── */
.az-header { display:flex; align-items:flex-start; justify-content:space-between; gap:2rem; }
.az-eyebrow { font-size:9.5px; letter-spacing:.28em; text-transform:uppercase; font-weight:700; color:rgba(201,168,76,.75); margin-bottom:.75rem; }
.az-title { font-family:var(--font-cormorant),Georgia,serif; font-size:clamp(2.2rem,4vw,3.2rem); font-weight:600; line-height:1.05; letter-spacing:-0.02em; color:var(--tx); }
.az-title em { font-style:italic; color:#8B0A2A; }
.az-sub { font-size:.875rem; color:var(--tx-2); font-weight:300; margin-top:.5rem; line-height:1.7; }

/* ── BACK BUTTON ── */
.az-back { font-size:10px; letter-spacing:.2em; text-transform:uppercase; font-weight:700; color:var(--tx-3); background:none; border:none; cursor:pointer; padding:0; margin-bottom:1rem; display:flex; align-items:center; gap:.4rem; transition:color .2s; }
.az-back:hover { color:var(--tx-2); }

/* ── COUNTER ── */
.az-counter { display:flex; align-items:baseline; gap:.2rem; padding:.6rem 1rem; border:1px solid rgba(139,10,42,.18); background:rgba(139,10,42,.04); flex-shrink:0; }
.az-counter--warn { border-color:rgba(255,180,50,.3); background:rgba(255,180,50,.06); }
.az-counter--warn .az-counter-n { color:#f59e0b; }
.az-counter-n { font-family:var(--font-cormorant),Georgia,serif; font-size:1.8rem; font-weight:600; color:#8B0A2A; line-height:1; }
.az-counter-sep { font-size:.9rem; color:var(--tx-3); margin:0 .1rem; }
.az-counter-total { font-size:.9rem; color:var(--tx-3); }
.az-counter-label { font-size:9px; letter-spacing:.2em; text-transform:uppercase; font-weight:700; color:var(--tx-3); margin-left:.5rem; }

/* ── HUB GRID ── */
.az-hub-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; }
.az-card { position:relative; display:flex; flex-direction:column; align-items:flex-start; gap:.65rem; padding:1.75rem 1.5rem; border:1px solid rgba(139,10,42,.15); background:rgba(22,14,17,.5); text-align:left; cursor:pointer; transition:border-color .25s,background .25s; width:100%; }
.az-card:hover { background:rgba(22,14,17,.85); border-color:rgba(139,10,42,.32); }
.az-card-tag { font-size:8.5px; letter-spacing:.22em; text-transform:uppercase; font-weight:800; color:#C9A84C; border:1px solid rgba(201,168,76,.3); padding:.2rem .55rem; }
.az-card-icon { font-size:1.75rem; line-height:1; margin-top:.25rem; }
.az-card-title { font-size:.925rem; font-weight:700; color:var(--tx); line-height:1.25; }
.az-card-desc { font-size:.78rem; color:var(--tx-2); line-height:1.65; font-weight:300; flex:1; }
.az-card-arrow { font-size:.8rem; color:rgba(139,10,42,.4); transition:color .25s,transform .25s; }
.az-card:hover .az-card-arrow { color:#8B0A2A; transform:translateX(5px); }

/* ── MAIN GRID ── */
.az-grid { display:grid; grid-template-columns:1fr 320px; gap:2.5rem; align-items:start; }

/* ── DROP ZONE ── */
.az-left { display:flex; flex-direction:column; gap:1rem; }
.az-drop { position:relative; border:1px solid rgba(139,10,42,.12); background:rgba(139,10,42,.02); overflow:hidden; transition:background .2s; min-height:280px; display:flex; align-items:center; justify-content:center; }
.az-drop--over { background:rgba(139,10,42,.05); }
.az-drop-label { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:3rem 2rem; cursor:pointer; text-align:center; width:100%; }
.az-drop-icon { font-size:2rem; color:rgba(139,10,42,.45); margin-bottom:1rem; line-height:1; font-family:monospace; }
.az-drop-text { font-size:.9rem; font-weight:600; color:var(--tx); margin-bottom:.4rem; }
.az-drop-hint { font-size:.8rem; color:var(--tx-3); }
.az-drop-hint span { color:#8B0A2A; }
.az-file-input { position:absolute; inset:0; opacity:0; cursor:pointer; }
.az-img-wrap { position:relative; width:100%; height:280px; }
.az-img { object-fit:contain; padding:8px; }
.az-remove { position:absolute; top:.75rem; right:.75rem; width:28px; height:28px; border-radius:50%; background:rgba(0,0,0,.6); border:1px solid rgba(255,255,255,.12); color:var(--tx-2); font-size:11px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:color .2s,border-color .2s; }
.az-remove:hover { color:#FF4D6D; border-color:rgba(255,77,109,.4); }

/* ── ACTION BUTTON ── */
.az-btn { width:100%; padding:1rem; font-size:10.5px; letter-spacing:.26em; text-transform:uppercase; font-weight:800; font-family:'Cabinet Grotesk',sans-serif; background:linear-gradient(135deg,#8B0A2A,#B01234); color:#F2EDE8; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:.6rem; min-height:52px; position:relative; overflow:hidden; transition:box-shadow .25s; }
.az-btn::after { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(255,255,255,.1) 0%,transparent 60%); pointer-events:none; }
.az-btn:disabled { opacity:.45; cursor:not-allowed; }
.az-btn:not(:disabled):hover { box-shadow:0 8px 28px rgba(139,10,42,.5); }
.az-btn-star { font-size:.9rem; opacity:.9; position:relative; }

/* ── RIGHT PANEL ── */
.az-right { display:flex; flex-direction:column; gap:2rem; }
.az-section { display:flex; flex-direction:column; gap:.75rem; }
.az-section-label { font-size:9.5px; letter-spacing:.25em; text-transform:uppercase; font-weight:700; color:var(--tx-3); }
.az-optional { text-transform:none; letter-spacing:.04em; font-weight:400; color:var(--tx-3); opacity:.6; }

/* ── TONES ── */
.az-tones { display:grid; grid-template-columns:1fr 1fr; gap:.6rem; }
.az-tone { position:relative; display:flex; align-items:center; justify-content:center; gap:.5rem; padding:.65rem .75rem; border:1px solid rgba(139,10,42,.14); background:transparent; cursor:pointer; color:var(--tx-3); font-size:12.5px; font-weight:600; font-family:'Cabinet Grotesk',sans-serif; transition:color .2s,border-color .2s; }
.az-tone:hover { color:var(--tx); border-color:rgba(139,10,42,.28); }
.az-tone--active { color:#C9A84C; border-color:rgba(139,10,42,.4); }
.az-tone-bg { position:absolute; inset:0; background:rgba(139,10,42,.1); pointer-events:none; }
.az-tone-emoji { font-size:.9rem; position:relative; }
.az-tone-label { position:relative; }

/* ── CONTEXT TEXTAREA ── */
.az-context { width:100%; background:transparent; border:none; border-bottom:1px solid rgba(139,10,42,.15); padding:.75rem 0; font-size:.875rem; color:var(--tx); font-family:'Cabinet Grotesk',sans-serif; outline:none; resize:none; line-height:1.7; transition:border-color .2s; caret-color:#8B0A2A; }
.az-context:focus { border-bottom-color:#8B0A2A; }
.az-context::placeholder { color:var(--tx-3); opacity:.6; }
.az-context--big { border:1px solid rgba(139,10,42,.15); border-bottom:1px solid rgba(139,10,42,.15); padding:.875rem 1rem; resize:vertical; min-height:120px; }
.az-context--big:focus { border-color:rgba(139,10,42,.38); }

/* ── SUGGESTIONS ── */
.az-sugs { border-top:1px solid rgba(139,10,42,.12); padding-top:2.5rem; }
.az-sugs-head { display:flex; align-items:center; gap:.75rem; margin-bottom:1.5rem; }
.az-sugs-star { color:#C9A84C; font-size:.9rem; }
.az-sugs-title { font-size:.9rem; font-weight:700; color:var(--tx); }
.az-sugs-hint { font-size:.8rem; color:var(--tx-3); font-weight:300; }
.az-sugs-list { display:flex; flex-direction:column; gap:.75rem; }
.az-sug { display:flex; align-items:flex-start; gap:1rem; padding:1.25rem 1.5rem; border:1px solid rgba(139,10,42,.12); background:rgba(139,10,42,.025); transition:border-color .2s,background .2s; }
.az-sug:hover { background:rgba(139,10,42,.05); border-color:rgba(139,10,42,.25); }
.az-sug-num { width:22px; height:22px; border:1px solid rgba(139,10,42,.3); background:rgba(139,10,42,.1); display:flex; align-items:center; justify-content:center; font-size:9.5px; font-weight:800; color:#8B0A2A; flex-shrink:0; margin-top:2px; }
.az-sug-text { flex:1; font-size:.875rem; line-height:1.75; color:var(--tx); }
.az-sug-copy { background:none; border:none; cursor:pointer; font-size:.95rem; color:var(--tx-3); padding:4px; transition:color .2s; opacity:.4; flex-shrink:0; margin-top:1px; }
.az-sug:hover .az-sug-copy { opacity:1; }
.az-sug-copy:hover { color:#8B0A2A; }
.az-sug-copy--done { color:#22c55e !important; opacity:1 !important; }

/* ── START CHOOSE ── */
.az-start-choose { display:flex; flex-direction:column; gap:1.5rem; }
.az-start-choose-label { font-size:.875rem; color:var(--tx-2); font-weight:300; }
.az-start-opts { display:grid; grid-template-columns:1fr 1fr; gap:1rem; max-width:540px; }
.az-start-opt { display:flex; flex-direction:column; align-items:flex-start; gap:.6rem; padding:1.5rem; border:1px solid rgba(139,10,42,.15); background:rgba(22,14,17,.5); text-align:left; cursor:pointer; transition:border-color .2s,background .2s; width:100%; }
.az-start-opt:hover { background:rgba(22,14,17,.85); border-color:rgba(139,10,42,.35); }
.az-start-opt-icon { font-size:1.6rem; }
.az-start-opt-title { font-size:.9rem; font-weight:700; color:var(--tx); }
.az-start-opt-desc { font-size:.78rem; color:var(--tx-2); line-height:1.65; font-weight:300; }

/* ── SITUATION WRAP ── */
.az-situation-wrap { display:flex; flex-direction:column; gap:2rem; max-width:640px; }

/* ── RESPONSIVE ── */
@media (max-width:768px) {
  .az-hub-grid { grid-template-columns:1fr; gap:.75rem; }
  .az-grid { grid-template-columns:1fr; }
  .az-right { gap:1.75rem; }
  .az-header { flex-direction:column; gap:1rem; }
  .az-counter { align-self:flex-start; }
  .az-start-opts { grid-template-columns:1fr; max-width:100%; }
  .az-situation-wrap { max-width:100%; }
}
@media (max-width:480px) {
  .az-tones { grid-template-columns:1fr 1fr; }
}
`;
