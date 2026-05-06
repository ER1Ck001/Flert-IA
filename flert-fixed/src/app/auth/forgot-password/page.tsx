"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const burst = (e: React.MouseEvent<HTMLButtonElement>) => {
    const emos = ["❤️","💕","✨","💘","🥰","💖"];
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    for (let i = 0; i < 7; i++) {
      const el = document.createElement("span");
      el.textContent = emos[Math.floor(Math.random() * emos.length)];
      const angle = (i / 7) * Math.PI * 2;
      const dist = 50 + Math.random() * 50;
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist - 20;
      el.style.cssText = `position:fixed;pointer-events:none;z-index:9999;font-size:${16+Math.random()*8}px;left:${cx}px;top:${cy}px;--tx:${tx}px;--ty:${ty}px;animation:emoji-fly .9s ease-out forwards;`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 950);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Erro ao enviar email"); return; }
      setSent(true);
    } catch {
      toast.error("Erro ao enviar email. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: AUTH_CSS }} />
      <div className="au">

        {/* ── LEFT PANEL ── */}
        <div className="au-left">
          <div className="au-left-orb au-left-orb--1" aria-hidden/>
          <div className="au-left-orb au-left-orb--2" aria-hidden/>
          <div className="au-left-wm" aria-hidden>F</div>
          <Link href="/" className="au-back"><span className="au-back-line"/>voltar ao site</Link>
          <div className="au-left-body">
            <p className="au-left-label">— Flert IA —</p>
            <h2 className="au-left-title">
              Acontece<br/>com todos.<br/><em>Sem problema.</em>
            </h2>
            <p className="au-left-sub">Recupere sua senha em menos de um minuto.</p>
          </div>
          <p className="au-left-copy">© 2026 Flert IA</p>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="au-right">
          <div className="au-right-orb au-right-orb--1" aria-hidden/>
          <div className="au-right-orb au-right-orb--2" aria-hidden/>

          <div className="au-form-wrap">
            <div className="au-form-head">
              <Link href="/" className="au-logo">
                <span className="au-heart">♥</span>Flert<em>.</em>IA
              </Link>
              <h1 className="au-title">Recuperar<br/>senha.</h1>
              <p className="au-sub">
                {sent
                  ? "Verifique seu email."
                  : "Informe seu email e enviaremos um link para criar uma nova senha."}
              </p>
            </div>

            {sent ? (
              <div className="au-success">
                <div className="au-success-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <div>
                  <h3>Email enviado.</h3>
                  <p>
                    Se esse email estiver cadastrado, você receberá as instruções em breve.
                    Verifique também a pasta de spam.
                  </p>
                </div>
                <Link href="/auth/login" className="au-btn au-btn--ghost" style={{ textDecoration: "none", textAlign: "center" }}>
                  ← Voltar para o login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="au-form">
                <div className="au-field">
                  <label htmlFor="email" className="au-label">Email</label>
                  <input
                    id="email" type="email" className="au-input"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required autoComplete="email"
                  />
                </div>
                <button type="submit" className="au-btn" disabled={loading} onClick={!loading ? burst : undefined}>
                  {loading ? <span className="au-spin"/> : "Enviar link de recuperação"}
                </button>
                <div style={{ textAlign: "center" }}>
                  <Link href="/auth/login" className="au-link-sm">← Voltar para o login</Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

const AUTH_CSS = `
@keyframes emoji-fly {
  0%   { opacity:1; transform:translate(-50%,-50%) scale(0); }
  60%  { opacity:1; }
  100% { opacity:0; transform:translate(calc(-50% + var(--tx)),calc(-50% + var(--ty))) scale(1) rotate(20deg); }
}
@keyframes au-rot  { to { transform:rotate(360deg); } }
@keyframes au-orb  { 0%,100% { transform:translate(0,0) scale(1); } 33% { transform:translate(30px,-20px) scale(1.08); } 66% { transform:translate(-20px,15px) scale(0.95); } }
@keyframes au-orb2 { 0%,100% { transform:translate(0,0) scale(1); } 33% { transform:translate(-25px,20px) scale(0.92); } 66% { transform:translate(20px,-15px) scale(1.06); } }
@keyframes hb { 0%,100%{transform:scale(1)}14%{transform:scale(1.3)}28%{transform:scale(1)}42%{transform:scale(1.15)}70%{transform:scale(1)} }

.au { display:grid; grid-template-columns:1fr 1fr; min-height:100vh; background:var(--bg); }

.au-left {
  position:relative; overflow:hidden;
  background:var(--wine);
  display:flex; flex-direction:column; justify-content:space-between;
  padding:2.5rem clamp(2rem,5vw,4rem); min-height:100vh;
}
.au-left-orb { position:absolute; border-radius:50%; pointer-events:none; filter:blur(80px); }
.au-left-orb--1 { width:300px; height:300px; background:rgba(201,168,76,0.15); top:-80px; right:-60px; animation:au-orb 8s ease-in-out infinite; }
.au-left-orb--2 { width:200px; height:200px; background:rgba(201,168,76,0.08); bottom:10%; left:-40px; animation:au-orb2 10s ease-in-out infinite; }
.au-left-wm {
  position:absolute; bottom:-0.1em; right:-0.05em;
  font-family:var(--font-cormorant),Georgia,serif;
  font-size:clamp(200px,30vw,360px); font-weight:700; font-style:italic;
  color:transparent; -webkit-text-stroke:1px rgba(201,168,76,0.1);
  line-height:1; pointer-events:none; user-select:none; letter-spacing:-0.05em;
}
.au-back {
  display:inline-flex; align-items:center; gap:.75rem;
  font-size:9.5px; letter-spacing:.24em; text-transform:uppercase; font-weight:700;
  color:rgba(242,237,232,0.4); transition:color .2s; position:relative; z-index:1;
}
.au-back:hover { color:rgba(242,237,232,0.75); }
.au-back-line { width:28px; height:1px; background:currentColor; display:block; transition:width .3s; flex-shrink:0; }
.au-back:hover .au-back-line { width:44px; }
.au-left-body { position:relative; z-index:1; }
.au-left-label { font-size:9.5px; letter-spacing:.3em; text-transform:uppercase; font-weight:600; color:rgba(201,168,76,0.65); margin-bottom:1.5rem; }
.au-left-title {
  font-family:var(--font-cormorant),Georgia,serif;
  font-size:clamp(3rem,5vw,5.5rem); font-weight:600;
  line-height:1.05; letter-spacing:-0.02em; color:#F2EDE8; margin-bottom:1.5rem;
}
.au-left-title em { font-style:italic; color:var(--gold); }
.au-left-sub { font-size:.875rem; line-height:1.8; color:rgba(242,237,232,0.45); font-weight:300; max-width:280px; }
.au-left-copy { font-size:9px; letter-spacing:.14em; text-transform:uppercase; color:rgba(242,237,232,0.2); position:relative; z-index:1; }

.au-right {
  position:relative; overflow:hidden;
  display:flex; align-items:center; justify-content:center;
  padding:3rem clamp(2rem,6vw,5rem);
  border-left:1px solid var(--bd);
}
.au-right-orb { position:absolute; border-radius:50%; pointer-events:none; filter:blur(100px); }
.au-right-orb--1 { width:400px; height:400px; background:radial-gradient(circle, rgba(139,10,42,0.08) 0%, transparent 70%); top:-100px; right:-100px; animation:au-orb 12s ease-in-out infinite; }
.au-right-orb--2 { width:280px; height:280px; background:radial-gradient(circle, rgba(201,168,76,0.05) 0%, transparent 70%); bottom:-60px; left:-60px; animation:au-orb2 9s ease-in-out infinite; }

.au-form-wrap { width:100%; max-width:400px; position:relative; z-index:1; }
.au-form-head { margin-bottom:2.5rem; }
.au-logo {
  font-family:var(--font-cormorant),Georgia,serif;
  font-size:1.4rem; font-weight:600; font-style:italic;
  display:inline-flex; align-items:center; gap:.35rem;
  margin-bottom:2rem; color:var(--tx);
}
.au-logo em { color:var(--gold); font-style:normal; }
.au-heart {
  color:var(--wine); font-style:normal;
  animation:hb 1.8s ease-in-out infinite; display:inline-block; transform-origin:center;
  font-size:1rem;
}
[data-theme="light"] .au-heart { color:var(--wine); }

.au-title {
  font-family:var(--font-cormorant),Georgia,serif;
  font-size:clamp(2.2rem,4vw,3.2rem); font-weight:600;
  line-height:1.05; letter-spacing:-0.02em; color:var(--tx); margin-bottom:.75rem;
}
.au-sub { font-size:.875rem; color:var(--tx-2); font-weight:300; line-height:1.7; }

.au-form { display:flex; flex-direction:column; gap:1.5rem; }
.au-field { display:flex; flex-direction:column; gap:.5rem; }
.au-label { font-size:10px; letter-spacing:.2em; text-transform:uppercase; font-weight:700; color:var(--tx-3); }
.au-input {
  width:100%; background:transparent !important;
  border:none; border-bottom:1px solid var(--bd);
  padding:.75rem 0; font-size:16px; color:var(--tx);
  font-family:'Cabinet Grotesk',sans-serif; outline:none;
  transition:border-color .3s;
  -webkit-box-shadow:0 0 0 100px var(--bg) inset !important;
  -webkit-text-fill-color:var(--tx) !important;
  caret-color:var(--gold);
}
.au-input:focus { border-bottom-color:var(--gold); }
.au-input::placeholder { color:var(--tx-3); opacity:.6; }

.au-btn {
  width:100%; padding:1rem; margin-top:.5rem;
  font-size:10.5px; letter-spacing:.26em; text-transform:uppercase; font-weight:800;
  font-family:'Cabinet Grotesk',sans-serif;
  background:var(--wine); color:#F2EDE8; border:none; cursor:pointer;
  transition:background .25s, transform .15s, box-shadow .25s;
  min-height:52px; display:flex; align-items:center; justify-content:center;
  position:relative; overflow:hidden;
}
.au-btn::after { content:''; position:absolute; inset:0; background:linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 60%); }
.au-btn:hover:not(:disabled) { background:var(--wine-2); transform:translateY(-1px); box-shadow:0 8px 24px rgba(139,10,42,0.35); }
.au-btn:active:not(:disabled) { transform:translateY(0); }
.au-btn:disabled { opacity:.6; cursor:not-allowed; }
.au-btn--ghost { background:transparent; color:var(--tx-2); border:1px solid var(--bd); text-decoration:none; }
.au-btn--ghost:hover:not(:disabled) { background:transparent; border-color:var(--bd-2); color:var(--tx); transform:none; box-shadow:none; }
.au-btn--ghost::after { display:none; }

.au-link-sm {
  font-size:9.5px; letter-spacing:.18em; text-transform:uppercase; font-weight:700;
  color:var(--tx-3); transition:color .2s;
}
.au-link-sm:hover { color:var(--gold); }
.au-link { color:var(--gold); font-weight:700; transition:opacity .2s; }
.au-link:hover { opacity:.75; }

.au-spin { width:16px; height:16px; border:1.5px solid rgba(242,237,232,0.3); border-top-color:#F2EDE8; border-radius:50%; animation:au-rot .7s linear infinite; display:inline-block; flex-shrink:0; }

.au-success { display:flex; flex-direction:column; gap:1.5rem; }
.au-success-icon { width:52px; height:52px; border:1px solid rgba(201,168,76,0.3); display:flex; align-items:center; justify-content:center; }
.au-success-icon svg { color:var(--gold); }
.au-success h3 { font-family:var(--font-cormorant),Georgia,serif; font-size:1.6rem; font-weight:600; color:var(--tx); }
.au-success p { font-size:.875rem; color:var(--tx-2); font-weight:300; line-height:1.75; margin-top:.5rem; }

[data-theme="light"] .au-input {
  -webkit-box-shadow:0 0 0 100px var(--bg) inset !important;
  -webkit-text-fill-color:var(--tx) !important;
}
[data-theme="light"] .au-right-orb--1 { background:radial-gradient(circle, rgba(139,10,42,0.1) 0%, transparent 70%); }
[data-theme="light"] .au-right-orb--2 { background:radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%); }
[data-theme="light"] .au-label { color:var(--tx-2); }
[data-theme="light"] .au-sub { color:var(--tx-2); }
[data-theme="light"] .au-input::placeholder { color:var(--tx-3); }
[data-theme="light"] .au-input { border-bottom-color:rgba(139,10,42,0.2); }
[data-theme="light"] .au-input:focus { border-bottom-color:var(--wine); }

@media (max-width:768px) {
  .au { grid-template-columns:1fr; }
  .au-left { display:none; }
  .au-right { border-left:none; padding:2.5rem 1.5rem; min-height:100vh; align-items:flex-start; padding-top:4rem; }
}
`;
