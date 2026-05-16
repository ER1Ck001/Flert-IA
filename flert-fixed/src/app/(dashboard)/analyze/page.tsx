"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const TONES = [
  { value: "flirty",  label: "Flertando", emoji: "😏" },
  { value: "funny",   label: "Engraçado",  emoji: "😄" },
  { value: "casual",  label: "Casual",     emoji: "😊" },
  { value: "witty",   label: "Afiado",     emoji: "✨" },
  { value: "serious", label: "Sério",      emoji: "🤔" },
  { value: "pickup",  label: "Cantada",    emoji: "🔥" },
  { value: "stories", label: "Stories",    emoji: "📱" },
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
  const [isLifetime, setIsLifetime]     = useState(false);
  const [todayCount, setTodayCount]     = useState(0);
  const [dailyLimit, setDailyLimit]     = useState(30);
  const [limitReached, setLimitReached] = useState(false);

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

  const handleAnalyze = async () => {
    if (!image) { toast.error("Envie uma imagem primeiro"); return; }
    setLoading(true);
    setSuggestions([]);
    try {
      const res  = await fetch("/api/analyze", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ imageUrl: image, style: tone, context: context.trim() || undefined }),
      });
      const data = await res.json();
      if (res.status === 429) {
        setLimitReached(true);
        setTodayCount(data.todayCount ?? dailyLimit);
        throw new Error(data.error);
      }
      if (!res.ok) throw new Error(data.error || "Erro ao analisar");
      setSuggestions(data.suggestions);
      setTodayCount(p => p + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao analisar. Tente novamente.");
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

  // ── Loading state ──
  if (isPaid === null) return (
    <div className="az-loading"><span className="az-spin az-spin--lg" /></div>
  );

  // ── Paywall / limit states ──
  if (!isPaid || (isPaid && limitReached)) return (
    <>
      <style dangerouslySetInnerHTML={{ __html: AZ_CSS }} />
      <motion.div className="az-gate"
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
        <div className="az-gate-icon">{!isPaid ? "🔒" : "⏳"}</div>
        <h2 className="az-gate-title">
          {!isPaid ? "Recurso Premium" : "Limite diário atingido"}
        </h2>
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

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: AZ_CSS }} />

      <motion.div className="az-wrap"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}>

        {/* ── Header ── */}
        <div className="az-header">
          <div>
            <p className="az-eyebrow">— análise com ia —</p>
            <h1 className="az-title">Analisar<br /><em>conversa</em></h1>
            <p className="az-sub">Envie o print e a IA gera 3 sugestões personalizadas no seu tom.</p>
          </div>
          {!isLifetime && (
            <div className={`az-counter${todayCount >= dailyLimit - 2 ? " az-counter--warn" : ""}`}>
              <span className="az-counter-n">{todayCount}</span>
              <span className="az-counter-sep">/</span>
              <span className="az-counter-total">{dailyLimit}</span>
              <span className="az-counter-label">hoje</span>
            </div>
          )}
        </div>

        {/* ── Main grid ── */}
        <div className="az-grid">

          {/* ── Upload + button ── */}
          <div className="az-left">
            <motion.div
              className={`az-drop${dragOver ? " az-drop--over" : ""}${image ? " az-drop--filled" : ""}`}
              animate={{ borderColor: dragOver ? "rgba(217,70,239,.55)" : image ? "rgba(217,70,239,.22)" : "rgba(217,70,239,.12)" }}
              transition={{ duration: 0.15 }}
              onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) loadImage(f); }}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
            >
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
                    transition={{ type: "spring", stiffness: 300, damping: 22 }}>
                    ↑
                  </motion.div>
                  <p className="az-drop-text">{dragOver ? "Solte aqui" : "Arraste o print aqui"}</p>
                  <p className="az-drop-hint">ou <span>clique para selecionar</span> · PNG, JPG até 10 MB</p>
                  <input type="file" accept="image/*"
                    onChange={e => { const f = e.target.files?.[0]; if (f) loadImage(f); }}
                    className="az-file-input" />
                </label>
              )}
            </motion.div>

            <motion.button
              className="az-btn"
              disabled={!image || loading || limitReached}
              onClick={handleAnalyze}
              whileHover={!loading && image ? { opacity: 0.88, y: -1 } : {}}
              whileTap={!loading && image ? { y: 0 } : {}}
              transition={{ duration: 0.15 }}>
              {loading
                ? <><span className="az-spin" /> Analisando...</>
                : <><span className="az-btn-star">✦</span> Gerar sugestões</>
              }
            </motion.button>
          </div>

          {/* ── Options ── */}
          <div className="az-right">

            <div className="az-section">
              <p className="az-section-label">Tom da resposta</p>
              <div className="az-tones">
                {TONES.map(t => (
                  <motion.button
                    key={t.value}
                    className={`az-tone${tone === t.value ? " az-tone--active" : ""}`}
                    onClick={() => setTone(t.value)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 28 }}>
                    {tone === t.value && (
                      <motion.span layoutId="az-tone-bg" className="az-tone-bg"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }} />
                    )}
                    <span className="az-tone-emoji">{t.emoji}</span>
                    <span className="az-tone-label">{t.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

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

        {/* ── Suggestions ── */}
        <AnimatePresence>
          {suggestions.length > 0 && (
            <motion.div className="az-sugs"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>

              <div className="az-sugs-head">
                <span className="az-sugs-star">✦</span>
                <p className="az-sugs-title">Sugestões de resposta</p>
                <span className="az-sugs-hint">— escolha uma ou adapte</span>
              </div>

              <div className="az-sugs-list">
                {suggestions.map((s, i) => (
                  <motion.div key={i} className="az-sug"
                    initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ borderColor: "rgba(217,70,239,.28)" }}>
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

      </motion.div>
    </>
  );
}

const AZ_CSS = `
/* ── LOADING ── */
.az-loading { min-height:60vh; display:flex; align-items:center; justify-content:center; }
.az-spin { width:16px; height:16px; border:1.5px solid rgba(217,70,239,.25); border-top-color:#D946EF; border-radius:50%; animation:az-rot .7s linear infinite; display:inline-block; flex-shrink:0; }
.az-spin--lg { width:28px; height:28px; }
@keyframes az-rot { to { transform:rotate(360deg); } }

/* ── GATE (paywall / limit) ── */
.az-gate { max-width:400px; margin:5rem auto; text-align:center; }
.az-gate-icon { font-size:3rem; margin-bottom:1.5rem; }
.az-gate-title { font-family:var(--font-cormorant),Georgia,serif; font-size:2rem; font-weight:600; color:var(--tx); margin-bottom:.75rem; letter-spacing:-0.02em; }
.az-gate-sub { font-size:.9rem; line-height:1.8; color:var(--tx-2); font-weight:300; margin-bottom:2rem; }
.az-gate-btn { display:inline-block; padding:.9rem 2.5rem; background:linear-gradient(135deg,#D946EF,#FF4D6D); color:#fff; font-size:10px; letter-spacing:.22em; text-transform:uppercase; font-weight:800; font-family:'Cabinet Grotesk',sans-serif; border:none; cursor:pointer; transition:opacity .2s,transform .15s; }
.az-gate-btn:hover { opacity:.88; transform:translateY(-1px); }

/* ── WRAP ── */
.az-wrap { max-width:960px; display:flex; flex-direction:column; gap:3rem; }

/* ── HEADER ── */
.az-header { display:flex; align-items:flex-start; justify-content:space-between; gap:2rem; }
.az-eyebrow { font-size:9.5px; letter-spacing:.28em; text-transform:uppercase; font-weight:700; color:rgba(217,70,239,.65); margin-bottom:.75rem; }
.az-title { font-family:var(--font-cormorant),Georgia,serif; font-size:clamp(2.2rem,4vw,3.2rem); font-weight:600; line-height:1.05; letter-spacing:-0.02em; color:var(--tx); }
.az-title em { font-style:italic; color:#D946EF; }
.az-sub { font-size:.875rem; color:var(--tx-2); font-weight:300; margin-top:.5rem; line-height:1.7; }
.az-counter { display:flex; align-items:baseline; gap:.2rem; padding:.6rem 1rem; border:1px solid rgba(217,70,239,.18); background:rgba(217,70,239,.04); flex-shrink:0; }
.az-counter--warn { border-color:rgba(255,180,50,.3); background:rgba(255,180,50,.06); }
.az-counter--warn .az-counter-n { color:#f59e0b; }
.az-counter-n { font-family:var(--font-cormorant),Georgia,serif; font-size:1.8rem; font-weight:600; color:#D946EF; line-height:1; }
.az-counter-sep { font-size:.9rem; color:var(--tx-3); margin:0 .1rem; }
.az-counter-total { font-size:.9rem; color:var(--tx-3); }
.az-counter-label { font-size:9px; letter-spacing:.2em; text-transform:uppercase; font-weight:700; color:var(--tx-3); margin-left:.5rem; }

/* ── GRID ── */
.az-grid { display:grid; grid-template-columns:1fr 320px; gap:2.5rem; align-items:start; }

/* ── DROP ZONE ── */
.az-left { display:flex; flex-direction:column; gap:1rem; }
.az-drop { position:relative; border:1px solid rgba(217,70,239,.12); background:rgba(217,70,239,.02); overflow:hidden; transition:background .2s; min-height:280px; display:flex; align-items:center; justify-content:center; }
.az-drop--over { background:rgba(217,70,239,.05); }
.az-drop-label { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:3rem 2rem; cursor:pointer; text-align:center; width:100%; }
.az-drop-icon { font-size:2rem; color:rgba(217,70,239,.5); margin-bottom:1rem; line-height:1; font-family:monospace; }
.az-drop-text { font-size:.9rem; font-weight:600; color:var(--tx); margin-bottom:.4rem; }
.az-drop-hint { font-size:.8rem; color:var(--tx-3); }
.az-drop-hint span { color:#D946EF; }
.az-file-input { position:absolute; inset:0; opacity:0; cursor:pointer; }
.az-img-wrap { position:relative; width:100%; height:280px; }
.az-img { object-fit:contain; padding:8px; }
.az-remove { position:absolute; top:.75rem; right:.75rem; width:28px; height:28px; border-radius:50%; background:rgba(0,0,0,.6); border:1px solid rgba(255,255,255,.12); color:var(--tx-2); font-size:11px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:color .2s,border-color .2s; }
.az-remove:hover { color:#FF4D6D; border-color:rgba(255,77,109,.4); }

/* ── BUTTON ── */
.az-btn { width:100%; padding:1rem; font-size:10.5px; letter-spacing:.26em; text-transform:uppercase; font-weight:800; font-family:'Cabinet Grotesk',sans-serif; background:linear-gradient(135deg,#D946EF,#FF4D6D); color:#fff; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:.6rem; min-height:52px; position:relative; overflow:hidden; transition:box-shadow .25s; }
.az-btn::after { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(255,255,255,.14) 0%,transparent 60%); }
.az-btn:disabled { opacity:.45; cursor:not-allowed; }
.az-btn:not(:disabled):hover { box-shadow:0 8px 28px rgba(217,70,239,.4); }
.az-btn-star { font-size:.9rem; opacity:.9; }

/* ── RIGHT PANEL ── */
.az-right { display:flex; flex-direction:column; gap:2rem; }
.az-section { display:flex; flex-direction:column; gap:.75rem; }
.az-section-label { font-size:9.5px; letter-spacing:.25em; text-transform:uppercase; font-weight:700; color:var(--tx-3); }
.az-optional { text-transform:none; letter-spacing:.04em; font-weight:400; color:var(--tx-3); opacity:.6; }

/* ── TONES ── */
.az-tones { display:grid; grid-template-columns:1fr 1fr; gap:.6rem; }
.az-tone { position:relative; display:flex; align-items:center; justify-content:center; gap:.5rem; padding:.65rem .75rem; border:1px solid rgba(217,70,239,.14); background:transparent; cursor:pointer; color:var(--tx-3); font-size:12.5px; font-weight:600; font-family:'Cabinet Grotesk',sans-serif; transition:color .2s,border-color .2s; }
.az-tone:hover { color:var(--tx); border-color:rgba(217,70,239,.25); }
.az-tone--active { color:#e879f9; border-color:rgba(217,70,239,.35); }
.az-tone-bg { position:absolute; inset:0; background:rgba(217,70,239,.1); pointer-events:none; }
.az-tone-emoji { font-size:.9rem; position:relative; }
.az-tone-label { position:relative; }

/* ── CONTEXT ── */
.az-context { width:100%; background:transparent; border:none; border-bottom:1px solid rgba(217,70,239,.15); padding:.75rem 0; font-size:.875rem; color:var(--tx); font-family:'Cabinet Grotesk',sans-serif; outline:none; resize:none; line-height:1.7; transition:border-color .2s; caret-color:#D946EF; }
.az-context:focus { border-bottom-color:#D946EF; }
.az-context::placeholder { color:var(--tx-3); opacity:.6; }

/* ── SUGGESTIONS ── */
.az-sugs { border-top:1px solid rgba(217,70,239,.12); padding-top:2.5rem; }
.az-sugs-head { display:flex; align-items:center; gap:.75rem; margin-bottom:1.5rem; }
.az-sugs-star { color:#D946EF; font-size:.9rem; }
.az-sugs-title { font-size:.9rem; font-weight:700; color:var(--tx); }
.az-sugs-hint { font-size:.8rem; color:var(--tx-3); font-weight:300; }
.az-sugs-list { display:flex; flex-direction:column; gap:.75rem; }
.az-sug { display:flex; align-items:flex-start; gap:1rem; padding:1.25rem 1.5rem; border:1px solid rgba(217,70,239,.12); background:rgba(217,70,239,.025); transition:border-color .2s,background .2s; }
.az-sug:hover { background:rgba(217,70,239,.04); }
.az-sug-num { width:22px; height:22px; border:1px solid rgba(217,70,239,.3); background:rgba(217,70,239,.1); display:flex; align-items:center; justify-content:center; font-size:9.5px; font-weight:800; color:#D946EF; flex-shrink:0; margin-top:2px; }
.az-sug-text { flex:1; font-size:.875rem; line-height:1.75; color:var(--tx); }
.az-sug-copy { background:none; border:none; cursor:pointer; font-size:.95rem; color:var(--tx-3); padding:4px; transition:color .2s; opacity:.4; flex-shrink:0; margin-top:1px; }
.az-sug:hover .az-sug-copy { opacity:1; }
.az-sug-copy:hover { color:#D946EF; }
.az-sug-copy--done { color:#22c55e !important; opacity:1 !important; }

/* ── RESPONSIVE ── */
@media (max-width:768px) {
  .az-grid { grid-template-columns:1fr; }
  .az-right { gap:1.75rem; }
  .az-header { flex-direction:column; gap:1rem; }
  .az-counter { align-self:flex-start; }
}
@media (max-width:480px) {
  .az-tones { grid-template-columns:1fr 1fr; }
}
`;
