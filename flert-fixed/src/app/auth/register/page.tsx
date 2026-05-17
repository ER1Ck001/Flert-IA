"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });

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
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Erro ao criar conta"); return; }
      toast.success("Conta criada!");
      await signIn("credentials", { email: formData.email, password: formData.password, redirect: false });
      router.push("/dashboard");
    } catch {
      toast.error("Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try { await signIn("google", { callbackUrl: "/dashboard" }); }
    catch { toast.error("Erro ao entrar com Google"); }
  };

  const planLabels: Record<string, string> = {
    monthly: "Plano Mensal selecionado",
    annual: "Plano Anual selecionado",
    lifetime: "Plano Vitalício selecionado",
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
              Comece a<br/>flertear com<br/><em>inteligência.</em>
            </h2>
            <p className="au-left-sub">Crie sua conta e transforme suas conversas com o poder da IA.</p>
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
              <h1 className="au-title">Criar conta.</h1>
              <p className="au-sub">Comece a transformar suas conversas.</p>
              {plan && planLabels[plan] && (
                <span className="au-plan-badge">✦ {planLabels[plan]}</span>
              )}
            </div>

            <form onSubmit={handleSubmit} className="au-form">
              <div className="au-field">
                <label htmlFor="name" className="au-label">Nome completo</label>
                <input
                  id="name" type="text" className="au-input"
                  placeholder="Seu nome"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required autoComplete="name"
                />
              </div>
              <div className="au-field">
                <label htmlFor="email" className="au-label">Email</label>
                <input
                  id="email" type="email" className="au-input"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  required autoComplete="email"
                />
              </div>
              <div className="au-field">
                <label htmlFor="password" className="au-label">Senha</label>
                <input
                  id="password" type="password" className="au-input"
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  required minLength={6} autoComplete="new-password"
                />
              </div>

              <button type="submit" className="au-btn" disabled={loading} onClick={!loading ? burst : undefined}>
                {loading ? <span className="au-spin"/> : "Criar conta"}
              </button>
            </form>

            <div className="au-divider"><span>ou continue com</span></div>

            <button className="au-google" onClick={handleGoogle}>
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuar com Google
            </button>

            <p className="au-foot">
              Já tem conta?{" "}
              <Link href="/auth/login" className="au-link">Fazer login</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="au-loading"><span className="au-spin au-spin--lg"/></div>}>
      <RegisterForm/>
    </Suspense>
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
  background:#08060A;
  display:flex; flex-direction:column; justify-content:space-between;
  padding:2.5rem clamp(2rem,5vw,4rem); min-height:100vh;
}
.au-left::before {
  content:''; position:absolute; inset:0; pointer-events:none;
  background:
    radial-gradient(ellipse 80% 60% at 80% 15%, rgba(139,10,42,0.14) 0%, transparent 60%),
    radial-gradient(ellipse 60% 50% at 15% 85%, rgba(109,8,32,0.11) 0%, transparent 60%),
    radial-gradient(ellipse 40% 40% at 50% 50%, rgba(176,18,52,0.04) 0%, transparent 70%);
}
.au-left-orb { position:absolute; border-radius:50%; pointer-events:none; filter:blur(80px); }
.au-left-orb--1 { width:320px; height:320px; background:rgba(139,10,42,0.18); top:-90px; right:-70px; animation:au-orb 8s ease-in-out infinite; }
.au-left-orb--2 { width:220px; height:220px; background:rgba(109,8,32,0.13); bottom:8%; left:-50px; animation:au-orb2 10s ease-in-out infinite; }
.au-left-wm {
  position:absolute; bottom:-0.1em; right:-0.05em;
  font-family:var(--font-cormorant),Georgia,serif;
  font-size:clamp(200px,30vw,360px); font-weight:700; font-style:italic;
  color:transparent; -webkit-text-stroke:1px rgba(139,10,42,0.07);
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
.au-left-label { font-size:9.5px; letter-spacing:.3em; text-transform:uppercase; font-weight:600; color:rgba(201,168,76,0.75); margin-bottom:1.5rem; }
.au-left-title {
  font-family:var(--font-cormorant),Georgia,serif;
  font-size:clamp(3rem,5vw,5.5rem); font-weight:600;
  line-height:1.05; letter-spacing:-0.02em; color:#F2EDE8; margin-bottom:1.5rem;
}
.au-left-title em { font-style:italic; color:#8B0A2A; }
.au-left-sub { font-size:.875rem; line-height:1.8; color:rgba(242,237,232,0.42); font-weight:300; max-width:280px; }
.au-left-copy { font-size:9px; letter-spacing:.14em; text-transform:uppercase; color:rgba(242,237,232,0.18); position:relative; z-index:1; }

.au-right {
  position:relative; overflow:hidden;
  display:flex; align-items:center; justify-content:center;
  padding:3rem clamp(2rem,6vw,5rem);
  border-left:1px solid var(--bd);
}
.au-right-orb { position:absolute; border-radius:50%; pointer-events:none; filter:blur(100px); }
.au-right-orb--1 { width:420px; height:420px; background:radial-gradient(circle, rgba(139,10,42,0.07) 0%, transparent 70%); top:-110px; right:-110px; animation:au-orb 12s ease-in-out infinite; }
.au-right-orb--2 { width:300px; height:300px; background:radial-gradient(circle, rgba(109,8,32,0.05) 0%, transparent 70%); bottom:-70px; left:-70px; animation:au-orb2 9s ease-in-out infinite; }

.au-form-wrap { width:100%; max-width:400px; position:relative; z-index:1; }
.au-form-head { margin-bottom:2.5rem; }
.au-logo {
  font-family:var(--font-cormorant),Georgia,serif;
  font-size:1.4rem; font-weight:600; font-style:italic;
  display:inline-flex; align-items:center; gap:.35rem;
  margin-bottom:2rem; color:var(--tx);
}
.au-logo em { color:#8B0A2A; font-style:normal; }
.au-heart {
  color:#8B0A2A; font-style:normal;
  animation:hb 1.8s ease-in-out infinite; display:inline-block; transform-origin:center;
  font-size:1rem;
}

.au-title {
  font-family:var(--font-cormorant),Georgia,serif;
  font-size:clamp(2.2rem,4vw,3.2rem); font-weight:600;
  line-height:1.05; letter-spacing:-0.02em; color:var(--tx); margin-bottom:.75rem;
}
.au-sub { font-size:.875rem; color:var(--tx-2); font-weight:300; }

.au-form { display:flex; flex-direction:column; gap:1.5rem; }
.au-field { display:flex; flex-direction:column; gap:.5rem; }
.au-label-row { display:flex; align-items:center; justify-content:space-between; }
.au-label { font-size:10px; letter-spacing:.2em; text-transform:uppercase; font-weight:700; color:var(--tx-3); }
.au-input {
  width:100%; background:transparent !important;
  border:none; border-bottom:1px solid var(--bd);
  padding:.75rem 0; font-size:16px; color:var(--tx);
  font-family:'Cabinet Grotesk',sans-serif; outline:none;
  transition:border-color .3s;
  -webkit-box-shadow:0 0 0 100px var(--bg) inset !important;
  -webkit-text-fill-color:var(--tx) !important;
  caret-color:#8B0A2A;
}
.au-input:focus { border-bottom-color:#8B0A2A; }
.au-input::placeholder { color:var(--tx-3); opacity:.6; }

.au-btn {
  width:100%; padding:1rem; margin-top:.5rem;
  font-size:10.5px; letter-spacing:.26em; text-transform:uppercase; font-weight:800;
  font-family:'Cabinet Grotesk',sans-serif;
  background:linear-gradient(135deg, #8B0A2A 0%, #B01234 100%);
  color:#fff; border:none; cursor:pointer;
  transition:opacity .25s, transform .15s, box-shadow .25s;
  min-height:52px; display:flex; align-items:center; justify-content:center;
  position:relative; overflow:hidden;
}
.au-btn::after { content:''; position:absolute; inset:0; background:linear-gradient(135deg, rgba(255,255,255,0.14) 0%, transparent 60%); }
.au-btn:hover:not(:disabled) { opacity:.88; transform:translateY(-1px); box-shadow:0 8px 28px rgba(139,10,42,0.45); }
.au-btn:active:not(:disabled) { transform:translateY(0); }
.au-btn:disabled { opacity:.5; cursor:not-allowed; }

.au-divider { display:flex; align-items:center; gap:1rem; margin:1.5rem 0; }
.au-divider::before, .au-divider::after { content:''; flex:1; height:1px; background:var(--bd); }
.au-divider span { font-size:9.5px; letter-spacing:.18em; text-transform:uppercase; color:var(--tx-3); font-weight:600; white-space:nowrap; }

.au-google {
  width:100%; padding:.85rem 1rem; border:1px solid var(--bd);
  background:transparent; color:var(--tx-2);
  font-size:10px; letter-spacing:.18em; text-transform:uppercase; font-weight:700;
  font-family:'Cabinet Grotesk',sans-serif; cursor:pointer;
  transition:border-color .2s, color .2s, background .2s;
  display:flex; align-items:center; justify-content:center; gap:.75rem; min-height:48px;
}
.au-google:hover { border-color:rgba(139,10,42,0.4); color:var(--tx); background:rgba(139,10,42,0.04); }

.au-foot { text-align:center; font-size:.875rem; color:var(--tx-2); margin-top:1.5rem; font-weight:300; }
.au-link { color:#8B0A2A; font-weight:700; transition:opacity .2s; }
.au-link:hover { opacity:.75; }

.au-spin { width:16px; height:16px; border:1.5px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; animation:au-rot .7s linear infinite; display:inline-block; flex-shrink:0; }
.au-spin--lg { width:28px; height:28px; border-color:rgba(139,10,42,.2); border-top-color:#8B0A2A; }
.au-loading { min-height:100vh; display:flex; align-items:center; justify-content:center; background:var(--bg); }

.au-plan-badge {
  display:inline-flex; align-items:center; gap:.5rem; margin-top:1rem;
  padding:.4rem 1rem; border:1px solid rgba(139,10,42,0.3);
  font-size:9.5px; letter-spacing:.16em; text-transform:uppercase; font-weight:700; color:#8B0A2A;
}

[data-theme="light"] .au-input {
  -webkit-box-shadow:0 0 0 100px var(--bg) inset !important;
  -webkit-text-fill-color:var(--tx) !important;
}
[data-theme="light"] .au-right-orb--1 { background:radial-gradient(circle, rgba(139,10,42,0.08) 0%, transparent 70%); }
[data-theme="light"] .au-right-orb--2 { background:radial-gradient(circle, rgba(109,8,32,0.06) 0%, transparent 70%); }
[data-theme="light"] .au-label { color:var(--tx-2); }
[data-theme="light"] .au-sub { color:var(--tx-2); }
[data-theme="light"] .au-input::placeholder { color:var(--tx-3); }
[data-theme="light"] .au-input { border-bottom-color:rgba(139,10,42,0.2); }
[data-theme="light"] .au-input:focus { border-bottom-color:#8B0A2A; }
[data-theme="light"] .au-divider::before, [data-theme="light"] .au-divider::after { background:rgba(139,10,42,0.12); }
[data-theme="light"] .au-google { border-color:rgba(139,10,42,0.2); }
[data-theme="light"] .au-google:hover { border-color:rgba(139,10,42,0.4); background:rgba(139,10,42,0.03); }

@media (max-width:768px) {
  .au { grid-template-columns:1fr; }
  .au-left { display:none; }
  .au-right { border-left:none; padding:2.5rem 1.5rem; min-height:100vh; align-items:flex-start; padding-top:4rem; }
}
`;
