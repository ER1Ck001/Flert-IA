"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

const AUTH_CSS = `
.au { display: grid; grid-template-columns: 1fr 1fr; min-height: 100vh; background: var(--bg); }
.au-left { position: relative; overflow: hidden; background: var(--wine); display: flex; flex-direction: column; justify-content: space-between; padding: 2.5rem clamp(2rem, 5vw, 4rem); min-height: 100vh; }
.au-left-wm { position: absolute; bottom: -0.2em; right: -0.05em; font-family: var(--font-cormorant), Georgia, serif; font-size: clamp(200px, 30vw, 380px); font-weight: 700; font-style: italic; color: transparent; -webkit-text-stroke: 1px rgba(201,168,76,0.12); line-height: 1; pointer-events: none; user-select: none; letter-spacing: -0.05em; }
.au-back { display: inline-flex; align-items: center; gap: 0.75rem; font-size: 9.5px; letter-spacing: 0.24em; text-transform: uppercase; font-weight: 700; color: rgba(242,237,232,0.4); transition: color 0.2s; position: relative; z-index: 1; }
.au-back:hover { color: rgba(242,237,232,0.7); }
.au-back-line { width: 28px; height: 1px; background: currentColor; display: block; transition: width 0.3s; }
.au-back:hover .au-back-line { width: 40px; }
.au-left-body { position: relative; z-index: 1; }
.au-left-label { font-size: 9.5px; letter-spacing: 0.3em; text-transform: uppercase; font-weight: 600; color: rgba(201,168,76,0.6); margin-bottom: 1.5rem; }
.au-left-title { font-family: var(--font-cormorant), Georgia, serif; font-size: clamp(3rem, 5vw, 5.5rem); font-weight: 600; line-height: 1.05; letter-spacing: -0.02em; color: #F2EDE8; margin-bottom: 1.5rem; }
.au-left-title em { font-style: italic; color: var(--gold); }
.au-left-sub { font-size: 0.875rem; line-height: 1.8; color: rgba(242,237,232,0.45); font-weight: 300; max-width: 280px; }
.au-left-copy { font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(242,237,232,0.2); position: relative; z-index: 1; }
.au-right { display: flex; align-items: center; justify-content: center; padding: 3rem clamp(2rem, 6vw, 5rem); border-left: 1px solid var(--bd); }
.au-form-wrap { width: 100%; max-width: 400px; }
.au-form-head { margin-bottom: 2.5rem; }
.au-logo { font-family: var(--font-cormorant), Georgia, serif; font-size: 1.35rem; font-weight: 600; font-style: italic; display: block; margin-bottom: 2rem; color: var(--tx); }
.au-logo em { color: var(--gold); font-style: normal; }
.au-title { font-family: var(--font-cormorant), Georgia, serif; font-size: clamp(2.2rem, 4vw, 3.2rem); font-weight: 600; line-height: 1.05; letter-spacing: -0.02em; color: var(--tx); margin-bottom: 0.75rem; }
.au-sub { font-size: 0.875rem; color: var(--tx-2); font-weight: 300; }
.au-form { display: flex; flex-direction: column; gap: 1.75rem; }
.au-field { position: relative; }
.au-field input { width: 100%; background: transparent; border: none; border-bottom: 1px solid var(--bd); padding: 1.1rem 2.2rem 0.5rem 0; font-size: 16px; color: var(--tx); font-family: 'Cabinet Grotesk', sans-serif; outline: none; transition: border-color 0.3s; }
.au-field input:focus { border-bottom-color: var(--gold); }
.au-field input:focus + label, .au-field input:not(:placeholder-shown) + label { transform: translateY(-1.4rem) scale(0.78); color: var(--gold); letter-spacing: 0.18em; }
.au-field label { position: absolute; left: 0; top: 1rem; font-size: 0.875rem; color: var(--tx-3); pointer-events: none; transition: transform 0.25s cubic-bezier(0.16,1,0.3,1), color 0.25s, letter-spacing 0.25s; transform-origin: left top; font-weight: 500; }
.au-eye { position: absolute; right: 0; top: 50%; transform: translateY(-30%); background: none; border: none; color: var(--tx-3); cursor: pointer; padding: 6px; transition: color 0.2s; display: flex; align-items: center; }
.au-eye:hover { color: var(--tx-2); }
.au-btn { width: 100%; padding: 1rem; font-size: 10px; letter-spacing: 0.24em; text-transform: uppercase; font-weight: 700; font-family: 'Cabinet Grotesk', sans-serif; background: var(--wine); color: #F2EDE8; border: none; cursor: pointer; transition: background 0.25s; min-height: 52px; display: flex; align-items: center; justify-content: center; }
.au-btn:hover:not(:disabled) { background: var(--wine-2); }
.au-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.au-spin { width: 16px; height: 16px; border: 1.5px solid rgba(242,237,232,0.3); border-top-color: #F2EDE8; border-radius: 50%; animation: au-rot 0.7s linear infinite; display: inline-block; }
.au-spin--lg { width: 28px; height: 28px; border-color: rgba(139,10,42,0.2); border-top-color: var(--wine); }
@keyframes au-rot { to { transform: rotate(360deg); } }
.au-loading { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg); }
.au-success { display: flex; flex-direction: column; gap: 1.5rem; }
.au-success-icon { width: 52px; height: 52px; border: 1px solid rgba(201,168,76,0.3); display: flex; align-items: center; justify-content: center; }
.au-success-icon svg { color: var(--gold); }
.au-success h3 { font-family: var(--font-cormorant), Georgia, serif; font-size: 1.6rem; font-weight: 600; color: var(--tx); }
.au-success p { font-size: 0.875rem; color: var(--tx-2); font-weight: 300; line-height: 1.75; margin-top: 0.5rem; }
.au-err { padding: 1rem; border: 1px solid rgba(139,10,42,0.3); background: rgba(139,10,42,0.05); font-size: 0.875rem; color: var(--tx-2); line-height: 1.7; display: flex; flex-direction: column; gap: 1rem; }
.au-link { color: var(--gold); font-weight: 600; transition: opacity 0.2s; }
.au-link:hover { opacity: 0.7; }
@media (max-width: 768px) {
  .au { grid-template-columns: 1fr; }
  .au-left { display: none; }
  .au-right { border-left: none; padding: 2.5rem 1.5rem; min-height: 100vh; align-items: flex-start; padding-top: 4rem; }
}
`;

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const EyeIcon = ({ off }: { off?: boolean }) => off ? (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  );

  if (!token) {
    return (
      <div className="au-err">
        <p>Link inválido ou expirado.</p>
        <Link href="/auth/forgot-password" className="au-link">Solicitar novo link →</Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast.error("As senhas não coincidem"); return; }
    if (password.length < 6) { toast.error("A senha deve ter pelo menos 6 caracteres"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Erro ao redefinir senha"); return; }
      setDone(true);
      setTimeout(() => router.push("/auth/login"), 2800);
    } catch {
      toast.error("Erro ao redefinir senha. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: AUTH_CSS }} />
      <div className="au">
        <div className="au-left">
          <div className="au-left-wm" aria-hidden>F</div>
          <Link href="/" className="au-back"><span className="au-back-line" />voltar ao site</Link>
          <div className="au-left-body">
            <p className="au-left-label">— Flert IA —</p>
            <h2 className="au-left-title">Nova senha,<br />novo<br /><em>começo.</em></h2>
            <p className="au-left-sub">Crie uma senha forte e volte a conquistar.</p>
          </div>
          <p className="au-left-copy">© 2026 Flert IA</p>
        </div>

        <div className="au-right">
          <div className="au-form-wrap">
            <div className="au-form-head">
              <Link href="/" className="au-logo">Flert<em>.</em>IA</Link>
              <h1 className="au-title">Nova senha.</h1>
              <p className="au-sub">
                {done ? "Senha atualizada com sucesso." : "Crie uma nova senha para sua conta."}
              </p>
            </div>

            {done ? (
              <div className="au-success">
                <div className="au-success-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <div>
                  <h3>Tudo certo.</h3>
                  <p>Sua senha foi atualizada. Redirecionando para o login...</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="au-form">
                <div className="au-field">
                  <input id="password" type={showPass ? "text" : "password"} placeholder=" "
                    value={password} onChange={e => setPassword(e.target.value)} required />
                  <label htmlFor="password">Nova senha</label>
                  <button type="button" className="au-eye" onClick={() => setShowPass(v => !v)} tabIndex={-1}>
                    <EyeIcon off={showPass} />
                  </button>
                </div>
                <div className="au-field">
                  <input id="confirm" type={showPass ? "text" : "password"} placeholder=" "
                    value={confirm} onChange={e => setConfirm(e.target.value)} required />
                  <label htmlFor="confirm">Confirmar senha</label>
                </div>
                <button type="submit" className="au-btn" disabled={loading}>
                  {loading ? <span className="au-spin" /> : "Redefinir senha"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="au-loading"><span className="au-spin au-spin--lg" /></div>}>
      <ResetForm />
    </Suspense>
  );
}
