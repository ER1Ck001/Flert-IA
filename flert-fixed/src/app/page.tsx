"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const features = [
  { n: "I",   title: "Respostas Inteligentes",  desc: "Nossa IA entende contexto, tom e intenção para gerar respostas que soam completamente naturais." },
  { n: "II",  title: "Velocidade Real",          desc: "Sugestões em menos de 3 segundos. Nunca mais perca o ritmo de uma conversa." },
  { n: "III", title: "Flertes Personalizados",   desc: "Adaptado ao seu estilo, à pessoa e ao momento. Nunca genérico, sempre autêntico." },
  { n: "IV",  title: "Privacidade Total",         desc: "Suas conversas são processadas e descartadas imediatamente. Nada fica armazenado." },
  { n: "V",   title: "Multi-Plataforma",          desc: "Tinder, Bumble, Hinge, Instagram, WhatsApp. Qualquer screenshot funciona." },
  { n: "VI",  title: "Aprendizado Contínuo",      desc: "A IA evolui com o seu uso e fica cada vez mais alinhada ao seu jeito único." },
];

const steps = [
  { title: "Faça Upload",    desc: "Envie um print da conversa que você quer responder. Qualquer app funciona." },
  { title: "Escolha o Tom",  desc: "Flertando, engraçado, sério ou casual. Você define o clima da resposta." },
  { title: "Use a Sugestão", desc: "3 opções geradas pela IA. Copie, adapte ou envie direto. É isso." },
];

const testimonials = [
  { text: "O Flert IA mudou completamente minhas conversas no Tinder. Consegui matches incríveis que nunca teriam acontecido.", author: "Pedro H.",  role: "Usuário Premium" },
  { text: "As respostas são tão naturais que ninguém acredita que é IA. Parece que eu mesmo escrevi, mas melhor.",             author: "Lucas M.",  role: "Usuário Vitalício" },
  { text: "Melhor investimento que fiz esse ano. O plano vitalício se pagou em menos de uma semana de uso.",                   author: "Rafael S.", role: "Usuário Premium" },
];

const faqs = [
  { q: "Funciona com qualquer plataforma de mensagens?",  a: "Sim. Tinder, Bumble, Hinge, Instagram, WhatsApp, Telegram — se você consegue tirar um print, a IA consegue analisar." },
  { q: "Minhas conversas ficam salvas em algum lugar?",   a: "Não. As imagens são processadas em tempo real e descartadas imediatamente. Sua privacidade é inegociável para nós." },
  { q: "As respostas soam naturais?",                     a: "Absolutamente. A IA foi treinada com conversas reais e entende gírias, contexto e nuances." },
  { q: "Posso cancelar o plano quando quiser?",           a: "Sim, sem burocracia. O Premium pode ser cancelado a qualquer momento. O Vitalício é pagamento único." },
  { q: "Qual a diferença entre Premium e Vitalício?",     a: "Premium é assinatura mensal. Vitalício é pagamento único que garante acesso eterno, incluindo todas as atualizações futuras." },
];

const platforms = ["Tinder", "Bumble", "Hinge", "Instagram", "WhatsApp", "Telegram"];
const marqueeText = "FLERT IA · RESPOSTAS INTELIGENTES · CONEXÕES REAIS · IA DE ÚLTIMA GERAÇÃO · FLERTAR COM INTELIGÊNCIA · SUAS CONVERSAS REDEFINIDAS · ";

export default function HomePage() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("flert-theme");
    const preferred = saved || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    setTheme(preferred as "dark" | "light");
    document.documentElement.setAttribute("data-theme", preferred);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("flert-theme", next);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });

    /* scroll reveal */
    const ro = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          const el = e.target as HTMLElement;
          el.style.transitionDelay = el.dataset.d ?? "0ms";
          el.classList.add("fl-visible");
          ro.unobserve(el);
        }
      }),
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".fl-reveal").forEach((el) => ro.observe(el));

    /* counters */
    const co = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target as HTMLElement;
        const target = +(el.dataset.n!);
        const suf = el.dataset.s ?? "";
        const t0 = performance.now(), dur = 1600;
        const run = (now: number) => {
          const ease = 1 - Math.pow(1 - Math.min((now - t0) / dur, 1), 3);
          el.textContent = Math.round(ease * target) + suf;
          if (ease < 1) requestAnimationFrame(run);
        };
        requestAnimationFrame(run);
        co.unobserve(el);
      }),
      { threshold: 0.5 }
    );
    document.querySelectorAll("[data-n]").forEach((el) => co.observe(el));

    return () => { window.removeEventListener("scroll", onScroll); ro.disconnect(); co.disconnect(); };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="pg">

        {/* ── NAVBAR ── */}
        <nav className={`pg-nav${scrolled ? " pg-nav--on" : ""}`}>
          <div className="pg-nw">
            <Link href="/" className="pg-logo">
              Flert<em>.</em>IA
            </Link>
            <div className="pg-nl">
              <a href="#features">Funcionalidades</a>
              <a href="#como-funciona">Como Funciona</a>
              <a href="#precos">Preços</a>
              <a href="#faq">FAQ</a>
            </div>
            <div className="pg-nc">
              <button className="pg-theme-btn" onClick={toggleTheme} aria-label="Alternar tema">
                {theme === "dark" ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                )}
              </button>
              <Link href="/auth/login" className="pg-ghost">Entrar</Link>
              <Link href="/auth/register" className="pg-cta">Começar</Link>
            </div>
          </div>
        </nav>

        <main>
          {/* ── HERO ── */}
          <section className="pg-hero">
            <div className="pg-wm" aria-hidden>F</div>

            {/* Decorative lines */}
            <div className="pg-dline pg-dline--1" aria-hidden />
            <div className="pg-dline pg-dline--2" aria-hidden />

            {/* Rotating badge */}
            <div className="pg-badge-rot" aria-hidden>
              <svg viewBox="0 0 120 120" className="pg-badge-svg">
                <path id="circlePath" d="M 60,60 m -44,0 a 44,44 0 1,1 88,0 a 44,44 0 1,1 -88,0" fill="none"/>
                <text fontSize="9.5" letterSpacing="4" fill="currentColor" fontFamily="'Cabinet Grotesk'" fontWeight="600">
                  <textPath href="#circlePath">FLERT IA · INTELIGÊNCIA ARTIFICIAL · </textPath>
                </text>
              </svg>
            </div>

            <div className="pg-w pg-hero-body">
              <p className="pg-lbl hero-lbl">— Inteligência Artificial para Conversas —</p>

              <h1 className="pg-h1 hero-h1">
                A forma mais<br />
                <em>inteligente</em><br />
                de se conectar.
              </h1>

              <p className="pg-sub hero-sub">
                O Flert IA analisa suas conversas e gera respostas que soam
                como você — mas na melhor versão de você.
              </p>

              <div className="pg-hcta hero-cta">
                <Link href="/auth/register" className="pg-cta pg-cta--lg">Começar agora</Link>
                <a href="#como-funciona" className="pg-ghost-link">
                  <span className="gl-line" />
                  Ver como funciona
                </a>
              </div>

              <div className="pg-stats hero-stats">
                {[
                  { n: 10, s: "K+", l: "Usuários ativos" },
                  { n: 1,  s: "M+", l: "Mensagens geradas" },
                  { n: 95, s: "%",  l: "Taxa de sucesso" },
                ].map((st, i) => (
                  <div key={i} className="pg-stat">
                    <span className="pg-sn" data-n={st.n} data-s={st.s}>0</span>
                    <span className="pg-sl">{st.l}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pg-scroll-ind" aria-hidden>
              <span className="si-line" />
              <span className="si-txt">scroll</span>
            </div>
          </section>

          {/* ── MARQUEE ── */}
          <div className="pg-mq">
            <div className="pg-mt">
              <span>{marqueeText}</span>
              <span aria-hidden>{marqueeText}</span>
            </div>
          </div>

          {/* ── PLATFORMS ── */}
          <div className="pg-plats fl-reveal">
            <span className="pg-plats-lbl">Funciona com</span>
            <div className="pg-plat-list">
              {platforms.map((p, i) => <span key={i}>{p}</span>)}
            </div>
          </div>

          {/* ── FEATURES ── */}
          <section id="features" className="pg-sec">
            <div className="pg-w">
              <div className="pg-sh fl-reveal">
                <p className="pg-lbl">— Funcionalidades —</p>
                <h2>Por que escolher<br /><em>o Flert IA?</em></h2>
              </div>
              <div className="pg-flist">
                {features.map((f, i) => (
                  <div key={i} className="pg-frow fl-reveal" data-d={`${i * 55}ms`}>
                    <span className="pg-fnum">{f.n}</span>
                    <h3 className="pg-ftit">{f.title}</h3>
                    <p className="pg-fdesc">{f.desc}</p>
                    <span className="pg-farr">↗</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── PULL QUOTE ── */}
          <section className="pg-pull">
            <div className="pg-w">
              <blockquote className="pg-bq fl-reveal">
                <span className="bq-q">&ldquo;</span>
                <p>A IA que sabe<br /><em>o que você quer dizer.</em></p>
              </blockquote>
            </div>
          </section>

          {/* ── HOW IT WORKS ── */}
          <section id="como-funciona" className="pg-sec">
            <div className="pg-w">
              <div className="pg-hw">
                <div className="pg-hw-left">
                  <p className="pg-lbl fl-reveal">— Como Funciona —</p>
                  <h2 className="pg-ht fl-reveal" data-d="70ms">
                    Três<br />passos<br /><em>simples.</em>
                  </h2>
                  <p className="pg-hw-sub fl-reveal" data-d="140ms">
                    Do upload ao resultado<br />em menos de 3 segundos.
                  </p>
                </div>
                <div className="pg-step-list">
                  {steps.map((s, i) => (
                    <div key={i} className="pg-step fl-reveal" data-d={`${i * 90}ms`}>
                      <span className="pg-stepn">0{i + 1}</span>
                      <div>
                        <h3 className="pg-stept">{s.title}</h3>
                        <p className="pg-stepd">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── PRICING ── */}
          <section id="precos" className="pg-sec">
            <div className="pg-w">
              <div className="pg-sh fl-reveal">
                <p className="pg-lbl">— Planos —</p>
                <h2>Preços <em>simples</em><br />e transparentes.</h2>
              </div>
              <div className="pg-pg fl-reveal" data-d="80ms">
                <div className="pg-pc">
                  <p className="pg-pname">Mensal</p>
                  <div className="pg-pamt">R$ 29,90</div>
                  <p className="pg-pper">por mês</p>
                  <p className="pg-pdesc">Para começar</p>
                  <ul className="pg-pf">
                    {["Análises ilimitadas","Respostas avançadas com IA","Análise de perfil","Suporte prioritário","Uploads ilimitados"].map(f => <li key={f}>{f}</li>)}
                  </ul>
                  <Link href="/auth/register?plan=monthly" className="pg-pbtn">Assinar Mensal</Link>
                </div>
                <div className="pg-pc pg-pc--f">
                  <span className="pg-badge">Mais Popular</span>
                  <p className="pg-pname">Anual</p>
                  <div className="pg-pamt">R$ 147</div>
                  <p className="pg-pper">por ano</p>
                  <p className="pg-pdesc">Economia de R$ 211/ano</p>
                  <ul className="pg-pf">
                    {["Tudo do plano Mensal","2 meses grátis","Análise de perfil completa","Alertas de padrões","Suporte prioritário"].map(f => <li key={f}>{f}</li>)}
                  </ul>
                  <Link href="/auth/register?plan=annual" className="pg-pbtn pg-pbtn--p">Assinar Anual</Link>
                </div>
                <div className="pg-pc">
                  <p className="pg-pname">Vitalício</p>
                  <div className="pg-pamt">R$ 297</div>
                  <p className="pg-pper">pagamento único</p>
                  <p className="pg-pdesc">Acesso para sempre</p>
                  <ul className="pg-pf">
                    {["Tudo do plano Anual","Acesso vitalício","Updates futuros inclusos","Suporte VIP","Acesso antecipado a novidades"].map(f => <li key={f}>{f}</li>)}
                  </ul>
                  <Link href="/auth/register?plan=lifetime" className="pg-pbtn">Comprar Vitalício</Link>
                </div>
              </div>
            </div>
          </section>

          {/* ── TESTIMONIALS ── */}
          <section className="pg-sec">
            <div className="pg-w">
              <div className="pg-sh fl-reveal">
                <p className="pg-lbl">— Depoimentos —</p>
                <h2>O que nossos<br /><em>usuários</em> dizem.</h2>
              </div>
              <div className="pg-tg">
                {testimonials.map((t, i) => (
                  <div key={i} className="pg-tm fl-reveal" data-d={`${i * 80}ms`}>
                    <div className="pg-tqmark">&ldquo;</div>
                    <p className="pg-ttxt">{t.text}</p>
                    <div className="pg-tauth">
                      <span className="pg-ta">{t.author}</span>
                      <span className="pg-tr">{t.role}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── FAQ ── */}
          <section id="faq" className="pg-sec">
            <div className="pg-w">
              <div className="pg-ql">
                <div>
                  <p className="pg-lbl fl-reveal">— FAQ —</p>
                  <h2 className="fl-reveal" data-d="60ms">Perguntas<br /><em>frequentes.</em></h2>
                </div>
                <div>
                  {faqs.map((faq, i) => (
                    <div key={i} className={`pg-qi fl-reveal${openFaq === i ? " pg-qo" : ""}`} data-d={`${i * 55}ms`}>
                      <button className="pg-qt" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                        <span className="pg-qq">{faq.q}</span>
                        <span className="pg-qi-icon">{openFaq === i ? "−" : "+"}</span>
                      </button>
                      <div className="pg-qc" style={{ maxHeight: openFaq === i ? "300px" : "0" }}>
                        <p className="pg-qans">{faq.a}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── CTA ── */}
          <section className="pg-ctasec">
            <div className="pg-w">
              <p className="pg-lbl fl-reveal">— Pronto para começar? —</p>
              <h2 className="fl-reveal" data-d="80ms">
                Transforme suas<br /><em>conversas agora.</em>
              </h2>
              <div className="fl-reveal" data-d="180ms">
                <Link href="/auth/register" className="pg-cta pg-cta--lg" style={{ marginTop: "2.5rem", display: "inline-block" }}>
                  Criar conta gratuita
                </Link>
              </div>
            </div>
          </section>
        </main>

        {/* ── FOOTER ── */}
        <footer className="pg-ft">
          <div className="pg-w">
            <div className="pg-fi">
              <Link href="/" className="pg-flogo">Flert<em>.</em>IA</Link>
              <p className="pg-fcopy">© 2026 Flert IA. Todos os direitos reservados.</p>
              <div className="pg-flinks">
                <a href="#">Termos</a>
                <a href="#">Privacidade</a>
                <a href="#">Contato</a>
              </div>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}

const CSS = `
.pg *, .pg *::before, .pg *::after { box-sizing: border-box; }
.pg { background: var(--bg); color: var(--tx); min-height: 100vh; overflow-x: hidden; font-family: 'Cabinet Grotesk', sans-serif; }
.pg a { color: inherit; text-decoration: none; }

/* container */
.pg-w { max-width: 1320px; margin: 0 auto; padding: 0 clamp(1.5rem, 5vw, 5rem); }

/* ── NAVBAR ── */
.pg-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 200;
  padding: 0 clamp(1.5rem, 5vw, 5rem);
  transition: background 0.35s, border-color 0.35s;
  border-bottom: 1px solid transparent;
}
.pg-nav--on {
  background: rgba(8,6,10,0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom-color: var(--bd);
}
[data-theme="light"] .pg-nav--on { background: rgba(245,240,232,0.92); }

.pg-nw { max-width: 1320px; margin: 0 auto; height: 72px; display: flex; align-items: center; justify-content: space-between; }

.pg-logo {
  font-family: var(--font-cormorant), Georgia, serif;
  font-size: 1.5rem; font-weight: 600; font-style: italic;
  letter-spacing: -0.02em; color: var(--tx);
}
.pg-logo em { color: var(--gold); font-style: normal; }

.pg-nl { display: flex; gap: 2.5rem; }
.pg-nl a {
  font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; font-weight: 600;
  color: var(--tx-2); transition: color 0.2s; position: relative;
}
.pg-nl a::after {
  content: ''; position: absolute; bottom: -4px; left: 0; right: 0; height: 1px;
  background: var(--gold); transform: scaleX(0); transform-origin: left;
  transition: transform 0.3s cubic-bezier(0.16,1,0.3,1);
}
.pg-nl a:hover { color: var(--tx); }
.pg-nl a:hover::after { transform: scaleX(1); }

.pg-nc { display: flex; align-items: center; gap: 1rem; }

.pg-theme-btn {
  width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
  border: 1px solid var(--bd); background: transparent; color: var(--tx-2);
  cursor: pointer; transition: color 0.2s, border-color 0.2s;
}
.pg-theme-btn:hover { color: var(--gold); border-color: var(--bd-2); }

.pg-ghost {
  font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; font-weight: 600;
  color: var(--tx-2); padding: 0.5rem 0.75rem; transition: color 0.2s;
  min-height: 44px; display: flex; align-items: center;
}
.pg-ghost:hover { color: var(--tx); }

.pg-cta {
  font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; font-weight: 700;
  color: var(--tx); border: 1px solid var(--bd-2); padding: 0.65rem 1.5rem;
  transition: background 0.25s, color 0.25s, border-color 0.25s;
  min-height: 44px; display: inline-flex; align-items: center; justify-content: center;
}
.pg-cta:hover { background: var(--wine); border-color: var(--wine); color: #fff; }
.pg-cta--lg { padding: 0.9rem 2.4rem; font-size: 11px; }

/* ── HERO ── */
.pg-hero {
  min-height: 100vh; display: flex; flex-direction: column; justify-content: center;
  padding: 140px 0 100px; position: relative; overflow: hidden;
}

/* Watermark letter */
.pg-wm {
  position: absolute; top: 50%; left: -0.1em; transform: translateY(-52%);
  font-family: var(--font-cormorant), Georgia, serif;
  font-size: clamp(200px, 36vw, 520px); font-weight: 700; font-style: italic;
  color: transparent; -webkit-text-stroke: 1px rgba(201,168,76,0.06);
  line-height: 1; pointer-events: none; user-select: none; z-index: 0;
  letter-spacing: -0.05em;
}

/* Decorative diagonal lines */
.pg-dline {
  position: absolute; width: 1px; pointer-events: none; z-index: 0;
  animation: line-grow 1.2s cubic-bezier(0.16,1,0.3,1) 0.8s both;
  transform-origin: top;
}
.pg-dline--1 {
  height: 240px; top: 15%; right: 22%;
  background: linear-gradient(to bottom, transparent, var(--wine), transparent);
  transform: rotate(18deg);
}
.pg-dline--2 {
  height: 160px; top: 30%; right: 15%;
  background: linear-gradient(to bottom, transparent, var(--gold), transparent);
  transform: rotate(-12deg);
}

/* Rotating badge */
.pg-badge-rot {
  position: absolute; top: 14%; right: 8%; width: 120px; height: 120px;
  animation: spin-slow 18s linear infinite;
  color: var(--tx-2); z-index: 1; pointer-events: none;
}
.pg-badge-svg { width: 100%; height: 100%; }

@keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes line-grow { from { transform: scaleY(0) rotate(var(--r,0deg)); opacity:0; } to { opacity:1; } }

.pg-hero-body { position: relative; z-index: 1; }

.pg-lbl {
  font-size: 9.5px; letter-spacing: 0.32em; text-transform: uppercase; font-weight: 600;
  color: var(--tx-3); margin-bottom: 2rem;
  display: flex; align-items: center; gap: 1rem;
}
.pg-lbl::before, .pg-lbl::after {
  content: ''; height: 1px; background: var(--bd-2); flex-shrink: 0;
}
.pg-lbl::before { width: 24px; }
.pg-lbl::after  { width: 24px; }

.pg-h1 {
  font-family: var(--font-cormorant), Georgia, serif;
  font-size: clamp(58px, 8.5vw, 118px); font-weight: 600;
  line-height: 0.96; letter-spacing: -0.025em;
  margin-bottom: 2.5rem; max-width: 880px; color: var(--tx);
}
.pg-h1 em { font-style: italic; color: var(--wine); }

.pg-sub {
  font-size: 0.95rem; line-height: 1.78; font-weight: 300;
  color: var(--tx-2); max-width: 380px; margin-bottom: 2.5rem;
}

.pg-hcta { display: flex; align-items: center; gap: 2.5rem; flex-wrap: wrap; margin-bottom: 5rem; }
.pg-ghost-link {
  font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; font-weight: 600;
  color: var(--tx-3); display: flex; align-items: center; gap: 1rem; transition: color 0.25s;
  min-height: 44px;
}
.pg-ghost-link:hover { color: var(--tx-2); }
.gl-line { width: 40px; height: 1px; background: currentColor; transition: width 0.3s; flex-shrink: 0; }
.pg-ghost-link:hover .gl-line { width: 60px; }

.pg-stats {
  display: grid; grid-template-columns: repeat(3, 1fr);
  border-top: 1px solid var(--bd); border-left: 1px solid var(--bd);
}
.pg-stat {
  padding: 2rem 2rem; border-right: 1px solid var(--bd); border-bottom: 1px solid var(--bd);
}
.pg-sn {
  display: block;
  font-family: var(--font-cormorant), Georgia, serif;
  font-size: clamp(2rem, 3.5vw, 3.8rem); font-weight: 600; color: var(--tx); line-height: 1;
  margin-bottom: 0.4rem;
}
.pg-sl { font-size: 9px; letter-spacing: 0.26em; text-transform: uppercase; color: var(--tx-3); font-weight: 600; }

/* Scroll indicator */
.pg-scroll-ind {
  position: absolute; bottom: 2.5rem; left: clamp(1.5rem, 5vw, 5rem);
  display: flex; flex-direction: column; align-items: flex-start; gap: 0.6rem;
  animation: bob 2.5s ease-in-out infinite;
}
@keyframes bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(9px); } }
.si-line { display: block; width: 1px; height: 56px; background: linear-gradient(to bottom, var(--wine), transparent); }
.si-txt { font-size: 9px; letter-spacing: 0.28em; text-transform: uppercase; font-weight: 600; color: var(--tx-3); writing-mode: vertical-lr; }

/* ── MARQUEE ── */
.pg-mq {
  overflow: hidden; border-top: 1px solid var(--bd); border-bottom: 1px solid var(--bd);
  padding: 14px 0;
}
.pg-mt {
  display: flex; white-space: nowrap;
  animation: marquee-scroll 32s linear infinite; width: max-content;
}
.pg-mt span { font-size: 10px; letter-spacing: 0.3em; font-weight: 600; color: var(--wine); opacity: 0.55; }
@keyframes marquee-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }

/* ── PLATFORMS ── */
.pg-plats {
  display: flex; align-items: center; gap: 2rem; flex-wrap: wrap;
  border-bottom: 1px solid var(--bd); max-width: 1320px; margin: 0 auto;
  padding: 2rem clamp(1.5rem, 5vw, 5rem);
}
.pg-plats-lbl { font-size: 9px; letter-spacing: 0.26em; text-transform: uppercase; font-weight: 600; color: var(--tx-3); flex-shrink: 0; }
.pg-plat-list { display: flex; align-items: center; gap: 2rem; flex-wrap: wrap; }
.pg-plat-list span { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; font-weight: 600; color: var(--tx-3); transition: color 0.2s; }
.pg-plat-list span:hover { color: var(--tx); }

/* ── SECTIONS ── */
.pg-sec { padding: 130px 0; border-top: 1px solid var(--bd); }
.pg-sh { margin-bottom: 4.5rem; }
.pg-sh h2, .pg-ht, .pg-ql h2, .pg-ctasec h2 {
  font-family: var(--font-cormorant), Georgia, serif;
  font-size: clamp(2.4rem, 4.5vw, 5rem); font-weight: 600;
  line-height: 1.06; letter-spacing: -0.02em; color: var(--tx);
}
.pg-sh h2 em, .pg-ht em, .pg-ctasec h2 em, .pg-ql h2 em { font-style: italic; color: var(--wine); }

/* ── FEATURES ── */
.pg-flist { display: flex; flex-direction: column; }
.pg-frow {
  display: grid; grid-template-columns: 3.5rem 1fr 2fr 2rem;
  align-items: center; gap: 2.5rem; padding: 1.8rem 0;
  border-top: 1px solid var(--bd); transition: background 0.2s;
  cursor: default;
}
.pg-frow:last-child { border-bottom: 1px solid var(--bd); }
.pg-frow:hover { background: rgba(139,10,42,0.03); }
.pg-frow:hover .pg-fnum { color: rgba(139,10,42,0.5); }
.pg-frow:hover .pg-farr { opacity: 1; transform: translate(3px,-3px); }
.pg-fnum { font-family: var(--font-cormorant), Georgia, serif; font-style: italic; font-size: 1rem; color: var(--bd-2); transition: color 0.25s; }
.pg-ftit { font-size: 0.95rem; font-weight: 600; color: var(--tx); letter-spacing: -0.01em; }
.pg-fdesc { font-size: 0.85rem; line-height: 1.68; color: var(--tx-2); font-weight: 300; }
.pg-farr { font-size: 1rem; color: var(--gold); opacity: 0; transition: opacity 0.25s, transform 0.25s; justify-self: end; }

/* ── PULL QUOTE ── */
.pg-pull { padding: 100px 0; border-top: 1px solid var(--bd); overflow: hidden; }
.pg-bq { position: relative; max-width: 960px; margin: 0 auto; text-align: center; }
.bq-q { font-family: var(--font-cormorant), Georgia, serif; font-size: clamp(5rem, 14vw, 16rem); color: rgba(139,10,42,0.06); line-height: 0.5; display: block; }
.pg-bq p { font-family: var(--font-cormorant), Georgia, serif; font-size: clamp(2.2rem, 5vw, 6rem); font-weight: 500; line-height: 1.1; letter-spacing: -0.02em; color: var(--tx); }
.pg-bq p em { font-style: italic; color: var(--wine); }

/* ── HOW IT WORKS ── */
.pg-hw { display: grid; grid-template-columns: 1fr 1.4fr; gap: 8rem; align-items: start; }
.pg-hw-left { position: sticky; top: 9rem; }
.pg-ht { margin-top: 0.6rem; }
.pg-hw-sub { font-size: 0.875rem; line-height: 1.75; color: var(--tx-2); font-weight: 300; margin-top: 1.5rem; max-width: 280px; }
.pg-step-list { display: flex; flex-direction: column; }
.pg-step { display: grid; grid-template-columns: 4.5rem 1fr; gap: 1.5rem; padding: 2.2rem 0; border-top: 1px solid var(--bd); transition: background 0.2s; cursor: default; }
.pg-step:last-child { border-bottom: 1px solid var(--bd); }
.pg-step:hover { background: rgba(139,10,42,0.025); }
.pg-stepn { font-family: var(--font-cormorant), Georgia, serif; font-style: italic; font-size: 3rem; font-weight: 600; color: rgba(201,168,76,0.18); line-height: 1; transition: color 0.25s; }
.pg-step:hover .pg-stepn { color: rgba(201,168,76,0.4); }
.pg-stept { font-size: 1rem; font-weight: 600; color: var(--tx); margin-bottom: 0.4rem; }
.pg-stepd { font-size: 0.85rem; line-height: 1.68; color: var(--tx-2); font-weight: 300; }

/* ── PRICING ── */
.pg-pg { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1px; background: var(--bd); border: 1px solid var(--bd); }
.pg-pc { padding: 3.5rem; background: var(--bg); position: relative; transition: background 0.25s; }
.pg-pc:hover { background: rgba(201,168,76,0.03); }
.pg-pc--f { background: rgba(139,10,42,0.04); }
.pg-pc--f:hover { background: rgba(139,10,42,0.07); }
.pg-badge {
  position: absolute; top: -1px; left: 3.5rem;
  font-size: 8px; letter-spacing: 0.3em; text-transform: uppercase; font-weight: 700;
  color: var(--gold); border: 1px solid var(--bd-2); border-top: none;
  padding: 4px 14px; background: rgba(201,168,76,0.08);
}
.pg-pname { font-size: 9px; letter-spacing: 0.32em; text-transform: uppercase; font-weight: 600; color: var(--tx-3); margin-bottom: 1.5rem; }
.pg-pamt { font-family: var(--font-cormorant), Georgia, serif; font-size: clamp(2.2rem, 3.5vw, 3.5rem); font-weight: 600; color: var(--tx); line-height: 1; margin-bottom: 0.4rem; }
.pg-pper { font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--tx-3); margin-bottom: 0.6rem; }
.pg-pdesc { font-size: 0.83rem; color: var(--tx-2); margin-bottom: 2rem; font-weight: 300; }
.pg-pf { list-style: none; margin-bottom: 2.5rem; }
.pg-pf li { display: flex; align-items: center; gap: 1rem; padding: 0.75rem 0; border-top: 1px solid var(--bd); font-size: 0.85rem; color: var(--tx-2); font-weight: 300; }
.pg-pf li::before { content: ''; width: 18px; height: 1px; background: var(--bd-2); flex-shrink: 0; }
.pg-pbtn {
  display: block; width: 100%; padding: 1rem; font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase; font-weight: 700;
  text-align: center; border: 1px solid var(--bd); color: var(--tx-2); background: transparent;
  transition: all 0.25s; min-height: 44px;
}
.pg-pbtn:hover { background: rgba(255,255,255,0.04); color: var(--tx); border-color: var(--bd-2); }
.pg-pbtn--p { border-color: rgba(139,10,42,0.5); color: var(--wine); }
.pg-pbtn--p:hover { background: var(--wine); color: #fff; border-color: var(--wine); }

/* ── TESTIMONIALS ── */
.pg-tg { display: grid; grid-template-columns: repeat(3,1fr); border: 1px solid var(--bd); }
.pg-tm { padding: 3rem 2.5rem; border-right: 1px solid var(--bd); transition: background 0.2s; }
.pg-tm:last-child { border-right: none; }
.pg-tm:hover { background: rgba(139,10,42,0.025); }
.pg-tqmark { font-family: var(--font-cormorant), Georgia, serif; font-size: 5rem; color: rgba(139,10,42,0.12); line-height: 0.5; margin-bottom: 1.5rem; }
.pg-ttxt { font-size: 0.9rem; line-height: 1.8; color: var(--tx-2); margin-bottom: 2rem; font-weight: 300; font-style: italic; }
.pg-tauth { display: flex; flex-direction: column; gap: 0.3rem; }
.pg-ta { font-size: 9.5px; letter-spacing: 0.2em; text-transform: uppercase; font-weight: 700; color: var(--tx); }
.pg-tr { font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--tx-3); }

/* ── FAQ ── */
.pg-ql { display: grid; grid-template-columns: 1fr 1.6fr; gap: 8rem; align-items: start; }
.pg-qi { border-top: 1px solid var(--bd); }
.pg-qi:last-child { border-bottom: 1px solid var(--bd); }
.pg-qt {
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
  padding: 1.6rem 0; background: none; border: none; color: var(--tx);
  text-align: left; width: 100%; cursor: pointer; transition: color 0.2s;
  min-height: 44px;
}
.pg-qt:hover { color: var(--tx-2); }
.pg-qq { font-size: 0.9rem; font-weight: 500; letter-spacing: -0.01em; text-align: left; }
.pg-qi-icon {
  width: 28px; height: 28px; border: 1px solid var(--bd); display: flex; align-items: center;
  justify-content: center; font-size: 1.1rem; color: var(--tx-3); flex-shrink: 0;
  transition: all 0.3s; font-weight: 300; line-height: 1;
}
.pg-qo .pg-qi-icon { background: rgba(139,10,42,0.1); border-color: rgba(139,10,42,0.3); color: var(--wine); }
.pg-qc { overflow: hidden; transition: max-height 0.45s cubic-bezier(0.16,1,0.3,1); }
.pg-qans { font-size: 0.875rem; line-height: 1.78; color: var(--tx-2); font-weight: 300; padding-bottom: 1.6rem; max-width: 640px; }

/* ── CTA SECTION ── */
.pg-ctasec { padding: 130px 0; border-top: 1px solid var(--bd); position: relative; overflow: hidden; }
.pg-ctasec::before {
  content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
  width: 900px; height: 450px;
  background: radial-gradient(ellipse, rgba(139,10,42,0.07) 0%, transparent 65%);
  pointer-events: none;
}
.pg-ctasec h2 { font-size: clamp(3rem, 7vw, 9rem); max-width: 1100px; margin-top: 1rem; }

/* ── FOOTER ── */
.pg-ft { border-top: 1px solid var(--bd); padding: 3rem 0; }
.pg-fi { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1.5rem; }
.pg-flogo { font-family: var(--font-cormorant), Georgia, serif; font-size: 1.3rem; font-weight: 600; font-style: italic; }
.pg-flogo em { color: var(--gold); font-style: normal; }
.pg-fcopy { font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--tx-3); }
.pg-flinks { display: flex; gap: 2rem; }
.pg-flinks a { font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--tx-3); transition: color 0.2s; }
.pg-flinks a:hover { color: var(--tx-2); }

/* ── HERO ENTRANCE ── */
@keyframes hero-up { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }
.hero-lbl   { animation: hero-up 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s  both; }
.hero-h1    { animation: hero-up 0.9s cubic-bezier(0.16,1,0.3,1) 0.22s both; }
.hero-sub   { animation: hero-up 0.7s cubic-bezier(0.16,1,0.3,1) 0.38s both; }
.hero-cta   { animation: hero-up 0.7s cubic-bezier(0.16,1,0.3,1) 0.52s both; }
.hero-stats { animation: hero-up 0.7s cubic-bezier(0.16,1,0.3,1) 0.66s both; }

/* ── MOBILE ── */
@media (max-width: 1024px) {
  .pg-hw { grid-template-columns: 1fr; gap: 4rem; }
  .pg-hw-left { position: static; }
  .pg-ql { grid-template-columns: 1fr; gap: 3rem; }
}
@media (max-width: 860px) {
  .pg-nl { display: none; }
  .pg-badge-rot { display: none; }
  .pg-dline { display: none; }
  .pg-frow { grid-template-columns: 2.5rem 1fr; grid-template-rows: auto auto; }
  .pg-fdesc { grid-column: 2; }
  .pg-farr { display: none; }
  .pg-pg { grid-template-columns: 1fr; max-width: 440px; }
  .pg-tg { grid-template-columns: 1fr; }
  .pg-tm { border-right: none; border-bottom: 1px solid var(--bd); }
  .pg-stats { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 600px) {
  .pg-stats { grid-template-columns: 1fr; }
  .pg-nc .pg-ghost { display: none; }
  .pg-scroll-ind { display: none; }
  .pg-plats { flex-direction: column; align-items: flex-start; }
  .pg-hero { padding: 120px 0 80px; }
  .pg-wm { font-size: 52vw; }
}
`;
