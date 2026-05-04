"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

/* ── data ─────────────────────────────────── */
const features = [
  { n: "I",   title: "Respostas Inteligentes",  desc: "Nossa IA entende contexto, tom e intenção para gerar respostas que soam completamente naturais." },
  { n: "II",  title: "Velocidade Real",          desc: "Sugestões em menos de 3 segundos. Nunca mais perca o ritmo de uma conversa." },
  { n: "III", title: "Flertes Personalizados",   desc: "Adaptado ao seu estilo, à pessoa e ao momento. Nunca genérico, sempre autêntico." },
  { n: "IV",  title: "Privacidade Total",         desc: "Suas conversas são processadas e descartadas imediatamente. Nada fica armazenado." },
  { n: "V",   title: "Multi-Plataforma",          desc: "Tinder, Bumble, Hinge, Instagram, WhatsApp. Qualquer screenshot funciona." },
  { n: "VI",  title: "Aprendizado Contínuo",      desc: "A IA evolui com o seu uso e fica cada vez mais alinhada ao seu jeito único." },
];

const steps = [
  { title: "Faça Upload",      desc: "Envie um print da conversa que você quer responder. Qualquer app funciona." },
  { title: "Escolha o Tom",    desc: "Flertando, engraçado, sério ou casual. Você define o clima da resposta." },
  { title: "Use a Sugestão",   desc: "3 opções geradas pela IA. Copie, adapte ou envie direto. É isso." },
];

const testimonials = [
  { text: "O Flert IA mudou completamente minhas conversas no Tinder. Consegui matches incríveis que nunca teriam acontecido.",  author: "Pedro H.",  role: "Usuário Premium" },
  { text: "As respostas são tão naturais que ninguém acredita que é IA. Parece que eu mesmo escrevi, mas melhor.",               author: "Lucas M.",  role: "Usuário Vitalício" },
  { text: "Melhor investimento que fiz esse ano. O plano vitalício se pagou em menos de uma semana de uso.",                     author: "Rafael S.", role: "Usuário Premium" },
];

const faqs = [
  { q: "Funciona com qualquer plataforma de mensagens?",  a: "Sim. Tinder, Bumble, Hinge, Instagram, WhatsApp, Telegram — se você consegue tirar um print, a IA consegue analisar e gerar sugestões." },
  { q: "Minhas conversas ficam salvas em algum lugar?",   a: "Não. As imagens são processadas em tempo real e descartadas imediatamente. Sua privacidade é inegociável para nós." },
  { q: "As respostas soam naturais?",                     a: "Absolutamente. A IA foi treinada com conversas reais e entende gírias, contexto e nuances. Ninguém vai perceber que é IA." },
  { q: "Posso cancelar o plano quando quiser?",           a: "Sim, sem burocracia. O Premium pode ser cancelado a qualquer momento. O Vitalício é pagamento único — sem mensalidades para sempre." },
  { q: "Qual a diferença entre Premium e Vitalício?",     a: "Premium é assinatura mensal. Vitalício é pagamento único que garante acesso eterno, incluindo todas as atualizações futuras." },
];

const platforms = ["Tinder", "Bumble", "Hinge", "Instagram", "WhatsApp", "Telegram"];

/* ── component ────────────────────────────── */
export default function HomePage() {
  useEffect(() => {
    /* progress + navbar */
    const bar = document.getElementById("fl-prog");
    const nav = document.getElementById("fl-nav");
    const onScroll = () => {
      const pct = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      if (bar) bar.style.width = pct + "%";
      nav?.classList.toggle("nav-on", window.scrollY > 60);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    /* emoji burst on CTA buttons */
    const emos = ["❤️","😍","💕","💖","🥰","💘","😘","✨"];
    const burst = (e: MouseEvent) => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      for (let i = 0; i < 8; i++) {
        const el = document.createElement("span");
        el.textContent = emos[Math.floor(Math.random() * emos.length)];
        const angle = (i / 8) * Math.PI * 2;
        const dist = 55 + Math.random() * 55;
        const tx = Math.cos(angle) * dist;
        const ty = Math.sin(angle) * dist - 20;
        el.style.cssText = `
          position:fixed;pointer-events:none;z-index:9999;
          font-size:${16 + Math.random() * 10}px;
          left:${cx}px;top:${cy}px;
          --tx:${tx}px;--ty:${ty}px;
          animation:emoji-fly .85s ease-out forwards;
        `;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 900);
      }
    };
    document.querySelectorAll<HTMLElement>(".emoji-btn").forEach(btn => {
      btn.addEventListener("mouseenter", burst as EventListener);
      btn.addEventListener("click", burst as EventListener);
    });

    /* scroll reveal */
    const ro = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          const el = e.target as HTMLElement;
          el.style.transitionDelay = el.dataset.d ?? "0ms";
          el.classList.add("fl-in");
          ro.unobserve(el);
        }
      }),
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".fl-r").forEach(el => ro.observe(el));

    /* counters */
    const co = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target as HTMLElement;
        const target = +el.dataset.n!;
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
    document.querySelectorAll("[data-n]").forEach(el => co.observe(el));

    /* faq */
    document.querySelectorAll(".fl-qi").forEach(item => {
      item.querySelector(".fl-qt")?.addEventListener("click", () => {
        const open = item.classList.contains("fl-qo");
        document.querySelectorAll(".fl-qi").forEach(i => {
          i.classList.remove("fl-qo");
          (i.querySelector(".fl-qc") as HTMLElement).style.maxHeight = "0";
        });
        if (!open) {
          item.classList.add("fl-qo");
          const c = item.querySelector(".fl-qc") as HTMLElement;
          c.style.maxHeight = c.scrollHeight + "px";
        }
      });
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
      ro.disconnect();
      co.disconnect();
    };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className={`fl ${playfair.variable}`}>

        {/* Grain */}
        <div id="fl-grain" className="fl-grain" />

        {/* Progress */}
        <div id="fl-prog" className="fl-prog" />

        {/* ── NAVBAR ── */}
        <nav id="fl-nav" className="fl-nav">
          <div className="fl-nw">
            <Link href="/" className="fl-logo">
              <span className="fl-heart">❤</span>Flert<span className="fl-dot-logo">.</span>IA
            </Link>
            <div className="fl-nl">
              <a href="#features">Funcionalidades</a>
              <a href="#como-funciona">Como Funciona</a>
              <a href="#precos">Preços</a>
              <a href="#faq">FAQ</a>
            </div>
            <div className="fl-nc">
              <Link href="/auth/login" className="fl-ghost">Entrar</Link>
              <Link href="/auth/register" className="fl-cta">Começar</Link>
            </div>
          </div>
        </nav>

        <main>
          {/* ── HERO ── */}
          <section className="fl-hero">
            {/* watermark */}
            <div className="fl-wm" aria-hidden>FLERT IA</div>

            <div className="fl-w fl-hero-body">
              <p className="fl-lbl hero-lbl">— Inteligência Artificial para Conversas —</p>

              <h1 className="fl-h1 hero-h1">
                A forma mais<br />
                <em>inteligente</em><br />
                de se conectar.
              </h1>

              <p className="fl-sub hero-sub">
                O Flert IA analisa suas conversas e gera respostas que soam
                como você — mas na melhor versão de você.
              </p>

              <div className="fl-hcta hero-cta">
                <Link href="/auth/register" className="fl-cta fl-cta--lg emoji-btn">Começar agora</Link>
                <a href="#como-funciona" className="fl-ghost-link">
                  <span className="gl-line" />
                  Ver como funciona
                </a>
              </div>

              {/* Stats */}
              <div className="fl-stats hero-stats">
                {[
                  { n: 10, s: "K+", l: "Usuários ativos" },
                  { n: 1,  s: "M+", l: "Mensagens geradas" },
                  { n: 95, s: "%",  l: "Taxa de sucesso" },
                ].map((st, i) => (
                  <div key={i} className="fl-stat">
                    <span className="fl-sn" data-n={st.n} data-s={st.s}>0</span>
                    <span className="fl-sl">{st.l}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Scroll indicator */}
            <div className="fl-scroll-ind" aria-hidden>
              <span className="si-line" />
              <span className="si-txt">scroll</span>
            </div>
          </section>

          {/* ── MARQUEE ── */}
          <div className="fl-mq">
            <div className="fl-mt">
              {[0, 1].map(i => (
                <span key={i} aria-hidden={i > 0}>
                  FLERT IA &nbsp;·&nbsp; RESPOSTAS INTELIGENTES &nbsp;·&nbsp; CONEXÕES REAIS &nbsp;·&nbsp; IA DE ÚLTIMA GERAÇÃO &nbsp;·&nbsp; FLERTAR COM INTELIGÊNCIA &nbsp;·&nbsp; SUAS CONVERSAS REDEFINIDAS &nbsp;·&nbsp;
                </span>
              ))}
            </div>
          </div>

          {/* ── PLATFORMS ── */}
          <div className="fl-plats fl-r">
            <span className="fl-plats-lbl">Funciona com</span>
            <div className="fl-plat-list">
              {platforms.map((p, i) => (
                <span key={i}>{p}</span>
              ))}
            </div>
          </div>

          {/* ── FEATURES ── */}
          <section id="features" className="fl-sec">
            <div className="fl-w">
              <div className="fl-sh fl-r">
                <p className="fl-lbl">— Funcionalidades —</p>
                <h2>Por que escolher<br /><em>o Flert IA?</em></h2>
              </div>

              <div className="fl-flist">
                {features.map((f, i) => (
                  <div key={i} className="fl-frow fl-r" data-d={`${i * 50}ms`}>
                    <span className="fl-fnum">{f.n}</span>
                    <h3 className="fl-ftit">{f.title}</h3>
                    <p className="fl-fdesc">{f.desc}</p>
                    <span className="fl-farr">↗</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── PULL QUOTE ── */}
          <section className="fl-pull fl-r">
            <div className="fl-w">
              <blockquote className="fl-bq fl-r">
                <span className="bq-q">&ldquo;</span>
                <p>A IA que sabe<br /><em>o que você quer dizer.</em></p>
              </blockquote>
            </div>
          </section>

          {/* ── HOW IT WORKS ── */}
          <section id="como-funciona" className="fl-sec">
            <div className="fl-w">
              <div className="fl-hw">
                <div className="fl-hw-left">
                  <p className="fl-lbl fl-r">— Como Funciona —</p>
                  <h2 className="fl-ht fl-r" data-d="70ms">
                    Três<br />passos<br /><em>simples.</em>
                  </h2>
                  <p className="fl-hw-sub fl-r" data-d="140ms">
                    Do upload ao resultado<br />em menos de 3 segundos.
                  </p>
                </div>
                <div className="fl-step-list">
                  {steps.map((s, i) => (
                    <div key={i} className="fl-step fl-r" data-d={`${i * 90}ms`}>
                      <span className="fl-stepn">0{i + 1}</span>
                      <div>
                        <h3 className="fl-stept">{s.title}</h3>
                        <p className="fl-stepd">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── PRICING ── */}
          <section id="precos" className="fl-sec">
            <div className="fl-w">
              <div className="fl-sh fl-r">
                <p className="fl-lbl">— Planos —</p>
                <h2>Preços <em>simples</em><br />e transparentes.</h2>
              </div>
              <div className="fl-pg fl-r" data-d="80ms">
                <div className="fl-pc">
                  <p className="fl-pname">Mensal</p>
                  <div className="fl-pamt">R$ 29,90</div>
                  <p className="fl-pper">por mês</p>
                  <p className="fl-pdesc">Para começar</p>
                  <ul className="fl-pf">
                    {["Análises ilimitadas","Respostas avançadas com IA","Análise de perfil","Suporte prioritário","Uploads ilimitados"].map(f => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                  <Link href="/auth/register?plan=monthly" className="fl-pbtn emoji-btn">Assinar Mensal</Link>
                </div>
                <div className="fl-pc fl-pc--f">
                  <span className="fl-badge">Mais Popular</span>
                  <p className="fl-pname">Anual</p>
                  <div className="fl-pamt">R$ 147</div>
                  <p className="fl-pper">por ano</p>
                  <p className="fl-pdesc">Economia de R$ 211/ano</p>
                  <ul className="fl-pf">
                    {["Tudo do plano Mensal","2 meses grátis","Análise de perfil completa","Alertas de padrões","Suporte prioritário"].map(f => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                  <Link href="/auth/register?plan=annual" className="fl-pbtn fl-pbtn--p emoji-btn">Assinar Anual</Link>
                </div>
                <div className="fl-pc">
                  <p className="fl-pname">Vitalício</p>
                  <div className="fl-pamt">R$ 297</div>
                  <p className="fl-pper">pagamento único</p>
                  <p className="fl-pdesc">Acesso para sempre</p>
                  <ul className="fl-pf">
                    {["Tudo do plano Anual","Acesso vitalício","Updates futuros inclusos","Suporte VIP","Acesso antecipado a novidades"].map(f => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                  <Link href="/auth/register?plan=lifetime" className="fl-pbtn emoji-btn">Comprar Vitalício</Link>
                </div>
              </div>
            </div>
          </section>

          {/* ── TESTIMONIALS ── */}
          <section className="fl-sec">
            <div className="fl-w">
              <div className="fl-sh fl-r">
                <p className="fl-lbl">— Depoimentos —</p>
                <h2>O que nossos<br /><em>usuários</em> dizem.</h2>
              </div>
              <div className="fl-tg">
                {testimonials.map((t, i) => (
                  <div key={i} className="fl-tm fl-r" data-d={`${i * 80}ms`}>
                    <div className="fl-tqmark">&ldquo;</div>
                    <p className="fl-txt">{t.text}</p>
                    <div className="fl-tauth">
                      <span className="fl-ta">{t.author}</span>
                      <span className="fl-tr">{t.role}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── FAQ ── */}
          <section id="faq" className="fl-sec">
            <div className="fl-w">
              <div className="fl-ql">
                <div>
                  <p className="fl-lbl fl-r">— FAQ —</p>
                  <h2 className="fl-r" data-d="60ms">Perguntas<br /><em>frequentes.</em></h2>
                </div>
                <div>
                  {faqs.map((faq, i) => (
                    <div key={i} className="fl-qi fl-r" data-d={`${i * 55}ms`}>
                      <button className="fl-qt">
                        <span className="fl-qq">{faq.q}</span>
                        <span className="fl-qi-icon">+</span>
                      </button>
                      <div className="fl-qc">
                        <p className="fl-qans">{faq.a}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── CTA ── */}
          <section className="fl-ctasec">
            <div className="fl-w">
              <p className="fl-lbl fl-r">— Pronto para começar? —</p>
              <h2 className="fl-r" data-d="80ms">
                Transforme suas<br /><em>conversas agora.</em>
              </h2>
              <div className="fl-r" data-d="180ms">
                <Link href="/auth/register" className="fl-cta fl-cta--lg" style={{ marginTop: "2.5rem", display: "inline-block" }}>
                  Criar conta gratuita
                </Link>
              </div>
            </div>
          </section>
        </main>

        {/* ── FOOTER ── */}
        <footer className="fl-ft">
          <div className="fl-w">
            <div className="fl-fi">
              <Link href="/" className="fl-flogo">Flert<span>.</span>IA</Link>
              <p className="fl-fcopy">© 2026 Flert IA. Todos os direitos reservados.</p>
              <div className="fl-flinks">
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

/* ── CSS ──────────────────────────────────── */
const CSS = `
.fl *, .fl *::before, .fl *::after { box-sizing: border-box; margin: 0; padding: 0; }
.fl { background: #080808; color: #f0ece4; min-height: 100vh; overflow-x: hidden; font-family: 'DM Sans', -apple-system, sans-serif; -webkit-font-smoothing: antialiased; }
.fl a { color: inherit; text-decoration: none; }

/* grain */
.fl-grain {
  position: fixed; inset: 0; z-index: 9997; pointer-events: none;
  opacity: .025; background-size: 256px 256px; background-repeat: repeat;
}

/* progress bar */
.fl-prog {
  position: fixed; top: 0; left: 0; height: 2px; width: 0; z-index: 9999;
  background: #FF2D78; pointer-events: none;
  transition: width .05s linear;
  box-shadow: 0 0 12px rgba(255,45,120,.6);
}

/* container */
.fl-w { max-width: 1320px; margin: 0 auto; padding: 0 clamp(1.5rem, 5vw, 5rem); }

/* navbar */
.fl-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 200;
  padding: 0 clamp(1.5rem, 5vw, 5rem);
  transition: background .35s, box-shadow .35s;
}
.nav-on { background: rgba(8,8,8,.92); backdrop-filter: blur(10px); box-shadow: 0 1px 0 rgba(255,255,255,.05); }
.fl-nw { max-width: 1320px; margin: 0 auto; height: 72px; display: flex; align-items: center; justify-content: space-between; }
.fl-logo { font-family: var(--font-playfair), serif; font-size: 1.55rem; font-weight: 700; letter-spacing: -.025em; display: flex; align-items: center; }
.fl-nl { display: flex; gap: 2.5rem; }
.fl-nl a {
  font-size: .72rem; letter-spacing: .14em; text-transform: uppercase; font-weight: 500;
  color: rgba(240,236,228,.38); transition: color .2s; position: relative;
}
.fl-nl a::after {
  content: ''; position: absolute; bottom: -3px; left: 0; right: 0; height: 1px;
  background: #FF2D78; transform: scaleX(0); transform-origin: left; transition: transform .3s cubic-bezier(.16,1,.3,1);
}
.fl-nl a:hover { color: #f0ece4; }
.fl-nl a:hover::after { transform: scaleX(1); }
.fl-nc { display: flex; align-items: center; gap: 1rem; }
.fl-ghost { font-size: .72rem; letter-spacing: .14em; text-transform: uppercase; font-weight: 500; color: rgba(240,236,228,.38); padding: .5rem .9rem; transition: color .2s; }
.fl-ghost:hover { color: #f0ece4; }
.fl-cta {
  font-size: .72rem; letter-spacing: .16em; text-transform: uppercase; font-weight: 700;
  color: #fff; background: #FF2D78; padding: .7rem 1.7rem;
  transition: background .2s, transform .2s, box-shadow .2s;
}
.fl-cta:hover { background: #e01f66; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(255,45,120,.3); }
.fl-cta--lg { padding: .85rem 2.2rem; font-size: .78rem; }

/* hero */
.fl-hero { min-height: 100vh; display: flex; flex-direction: column; justify-content: center; padding: 140px 0 100px; position: relative; overflow: hidden; }
.fl-wm {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -54%);
  font-family: var(--font-playfair), serif;
  font-size: clamp(120px, 22vw, 340px); font-weight: 700; font-style: italic;
  color: rgba(255,255,255,.018); letter-spacing: -.04em; white-space: nowrap;
  pointer-events: none; user-select: none; z-index: 0;
}
.fl-hero::before {
  content: ''; position: absolute; top: -200px; right: -300px;
  width: 900px; height: 900px; border-radius: 50%;
  background: radial-gradient(circle, rgba(255,45,120,.055) 0%, transparent 65%);
  pointer-events: none;
}
.fl-hero-body { position: relative; z-index: 1; }

/* hero text */
.fl-lbl {
  font-size: 9.5px; letter-spacing: .38em; text-transform: uppercase; font-weight: 700;
  color: rgba(255,45,120,.0); margin-bottom: 2rem;
  display: flex; align-items: center; gap: .8rem;
  transition: color .6s .4s, gap .6s .4s;
}
.fl-lbl::before, .fl-lbl::after {
  content: ''; height: 1px; background: rgba(255,45,120,.4); width: 0;
  transition: width .8s cubic-bezier(.16,1,.3,1) .3s;
  flex-shrink: 0;
}
.fl-lbl::before { width: 0; }
.fl-lbl::after  { width: 0; }
.lbl-on { color: rgba(255,45,120,.65); }
.lbl-on::before, .lbl-on::after { width: 24px; }

.fl-h1 {
  font-family: var(--font-playfair), serif;
  font-size: clamp(60px, 8.8vw, 122px); font-weight: 700;
  line-height: .98; letter-spacing: -.03em;
  margin-bottom: 2rem; max-width: 860px;
}
.fl-h1 em { font-style: italic; color: #FF2D78; }
.ww { display: inline-block; overflow: hidden; vertical-align: bottom; }
.wi { display: inline-block; transform: translateY(108%); transition: transform .85s cubic-bezier(.16,1,.3,1); }
.wi.wv { transform: translateY(0); }

.fl-sub { font-size: 1rem; line-height: 1.75; font-weight: 300; color: rgba(240,236,228,.42); max-width: 420px; margin-bottom: 2.5rem; }

.fl-hcta { display: flex; align-items: center; gap: 2.5rem; flex-wrap: wrap; margin-bottom: 5rem; }
.fl-ghost-link {
  font-size: .75rem; letter-spacing: .16em; text-transform: uppercase; font-weight: 500;
  color: rgba(240,236,228,.32); display: flex; align-items: center; gap: .9rem; transition: color .25s;
}
.fl-ghost-link:hover { color: rgba(240,236,228,.7); }
.gl-line { width: 36px; height: 1px; background: currentColor; transition: width .3s; }
.fl-ghost-link:hover .gl-line { width: 56px; }

/* stats */
.fl-stats { display: grid; grid-template-columns: repeat(3,1fr); border-top: 1px solid rgba(255,255,255,.07); border-left: 1px solid rgba(255,255,255,.07); }
.fl-stat { padding: 2.5rem 2rem; border-right: 1px solid rgba(255,255,255,.07); border-bottom: 1px solid rgba(255,255,255,.07); }
.fl-sn { display: block; font-family: var(--font-playfair), serif; font-size: clamp(2rem,3.5vw,4rem); font-weight: 700; color: #f0ece4; line-height: 1; margin-bottom: .5rem; }
.fl-sl { font-size: .65rem; letter-spacing: .22em; text-transform: uppercase; color: rgba(240,236,228,.28); font-weight: 500; }

/* scroll indicator */
.fl-scroll-ind {
  position: absolute; bottom: 2.5rem; left: clamp(1.5rem, 5vw, 5rem);
  display: flex; flex-direction: column; align-items: flex-start; gap: .6rem;
  animation: bob 2.5s ease-in-out infinite;
}
.si-line { display: block; width: 1px; height: 56px; background: linear-gradient(to bottom, rgba(255,45,120,.5), transparent); }
.si-txt { font-size: .6rem; letter-spacing: .3em; text-transform: uppercase; font-weight: 500; color: rgba(240,236,228,.2); writing-mode: vertical-lr; }
@keyframes bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(10px); } }

/* marquee */
.fl-mq { overflow: hidden; border-top: 1px solid rgba(255,255,255,.06); border-bottom: 1px solid rgba(255,255,255,.06); background: rgba(255,45,120,.025); padding: 16px 0; }
.fl-mt { display: flex; white-space: nowrap; animation: mq 28s linear infinite; width: max-content; }
.fl-mt span { font-size: 10px; letter-spacing: .3em; font-weight: 600; color: rgba(255,45,120,.5); }
@keyframes mq { from { transform: translateX(0); } to { transform: translateX(-50%); } }

/* platforms */
.fl-plats { display: flex; align-items: center; gap: 2rem; padding: 2rem 0; flex-wrap: wrap; border-bottom: 1px solid rgba(255,255,255,.06); max-width: 1320px; margin: 0 auto; padding-left: clamp(1.5rem,5vw,5rem); padding-right: clamp(1.5rem,5vw,5rem); }
.fl-plats-lbl { font-size: .68rem; letter-spacing: .22em; text-transform: uppercase; font-weight: 500; color: rgba(240,236,228,.22); flex-shrink: 0; }
.fl-plat-list { display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap; }
.fl-plat-list span { font-size: .72rem; letter-spacing: .18em; text-transform: uppercase; font-weight: 500; color: rgba(240,236,228,.3); transition: color .2s; }
.fl-plat-list span:hover { color: rgba(240,236,228,.7); }

/* section base */
.fl-sec { padding: 130px 0; border-top: 1px solid rgba(255,255,255,.06); }
.fl-sh { margin-bottom: 4rem; }
.fl-sh h2, .fl-ht, .fl-ql h2, .fl-ctasec h2 {
  font-family: var(--font-playfair), serif;
  font-size: clamp(2.2rem, 4vw, 4.8rem); font-weight: 700;
  line-height: 1.08; letter-spacing: -.025em; color: #f0ece4;
}
.fl-sh h2 em, .fl-ht em, .fl-ctasec h2 em, .fl-ql h2 em { font-style: italic; color: #FF2D78; }

/* features list */
.fl-flist { display: flex; flex-direction: column; }
.fl-frow {
  display: grid; grid-template-columns: 3.5rem 1fr 2fr 2rem;
  align-items: center; gap: 2rem;
  padding: 1.8rem 0;
  border-top: 1px solid rgba(255,255,255,.05);
  transition: background .25s;
}
.fl-frow:last-child { border-bottom: 1px solid rgba(255,255,255,.05); }
.fl-frow:hover { background: rgba(255,45,120,.025); }
.fl-frow:hover .fl-fnum { color: rgba(255,45,120,.55); }
.fl-frow:hover .fl-farr { opacity: 1; transform: translate(2px,-2px); }
.fl-fnum { font-family: var(--font-playfair), serif; font-style: italic; font-size: 1rem; color: rgba(255,45,120,.22); transition: color .25s; }
.fl-ftit { font-size: 1.05rem; font-weight: 600; color: #f0ece4; letter-spacing: -.01em; }
.fl-fdesc { font-size: .875rem; line-height: 1.65; color: rgba(240,236,228,.38); font-weight: 300; }
.fl-farr { font-size: 1.1rem; color: rgba(255,45,120,.4); opacity: 0; transition: opacity .25s, transform .25s; justify-self: end; }

/* pull quote */
.fl-pull { padding: 100px 0; border-top: 1px solid rgba(255,255,255,.06); overflow: hidden; }
.fl-bq { position: relative; max-width: 900px; margin: 0 auto; text-align: center; }
.bq-q { font-family: var(--font-playfair), serif; font-size: clamp(5rem,12vw,14rem); color: rgba(255,45,120,.07); line-height: .6; display: block; }
.fl-bq p { font-family: var(--font-playfair), serif; font-size: clamp(2rem,4.5vw,5.5rem); font-weight: 700; line-height: 1.1; letter-spacing: -.025em; color: #f0ece4; }
.fl-bq p em { font-style: italic; color: #FF2D78; }

/* how it works */
.fl-hw { display: grid; grid-template-columns: 1fr 1.4fr; gap: 8rem; align-items: start; }
.fl-hw-left { position: sticky; top: 9rem; }
.fl-ht { margin-top: .6rem; }
.fl-hw-sub { font-size: .9rem; line-height: 1.7; color: rgba(240,236,228,.35); font-weight: 300; margin-top: 1.5rem; max-width: 280px; }
.fl-step-list { display: flex; flex-direction: column; }
.fl-step { display: grid; grid-template-columns: 4.5rem 1fr; gap: 1.5rem; padding: 2.2rem 0; border-top: 1px solid rgba(255,255,255,.05); transition: background .25s; }
.fl-step:last-child { border-bottom: 1px solid rgba(255,255,255,.05); }
.fl-step:hover { background: rgba(255,45,120,.02); }
.fl-stepn { font-family: var(--font-playfair), serif; font-style: italic; font-size: 3rem; font-weight: 700; color: rgba(255,45,120,.15); line-height: 1; transition: color .25s; }
.fl-step:hover .fl-stepn { color: rgba(255,45,120,.3); }
.fl-stept { font-size: 1.05rem; font-weight: 600; color: #f0ece4; margin-bottom: .45rem; }
.fl-stepd { font-size: .875rem; line-height: 1.65; color: rgba(240,236,228,.38); font-weight: 300; }

/* pricing */
.fl-pg { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 2px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.06); }
.fl-pc { padding: 3.5rem; background: #080808; position: relative; transition: background .3s; }
.fl-pc:hover { background: rgba(255,255,255,.012); }
.fl-pc--f { background: rgba(255,45,120,.03); }
.fl-badge { position: absolute; top: -1px; left: 3.5rem; font-size: 8px; letter-spacing: .28em; text-transform: uppercase; font-weight: 700; color: #FF2D78; border: 1px solid rgba(255,45,120,.28); border-top: none; padding: 4px 14px; background: rgba(255,45,120,.08); }
.fl-pname { font-size: .68rem; letter-spacing: .3em; text-transform: uppercase; font-weight: 600; color: rgba(240,236,228,.28); margin-bottom: 1.5rem; }
.fl-pamt { font-family: var(--font-playfair), serif; font-size: clamp(2.2rem,4vw,3.8rem); font-weight: 700; color: #f0ece4; line-height: 1; margin-bottom: .4rem; }
.fl-pper { font-size: .68rem; letter-spacing: .2em; text-transform: uppercase; color: rgba(240,236,228,.22); margin-bottom: .7rem; }
.fl-pdesc { font-size: .85rem; color: rgba(240,236,228,.35); margin-bottom: 2rem; font-weight: 300; }
.fl-pf { list-style: none; margin-bottom: 2.5rem; }
.fl-pf li { display: flex; align-items: center; gap: 1rem; padding: .8rem 0; border-top: 1px solid rgba(255,255,255,.04); font-size: .875rem; color: rgba(240,236,228,.48); font-weight: 300; }
.fl-pf li::before { content: ''; width: 20px; height: 1px; background: rgba(255,45,120,.35); flex-shrink: 0; }
.fl-pbtn { display: block; width: 100%; padding: 1rem; font-size: .7rem; letter-spacing: .2em; text-transform: uppercase; font-weight: 600; text-align: center; border: 1px solid rgba(255,255,255,.12); color: rgba(240,236,228,.45); background: transparent; transition: all .25s; }
.fl-pbtn:hover { background: rgba(255,255,255,.04); color: #f0ece4; border-color: rgba(255,255,255,.25); }
.fl-pbtn--p { border-color: rgba(255,45,120,.5); color: #FF2D78; }
.fl-pbtn--p:hover { background: #FF2D78; color: #fff; border-color: #FF2D78; }

/* testimonials */
.fl-tg { display: grid; grid-template-columns: repeat(3,1fr); border: 1px solid rgba(255,255,255,.06); }
.fl-tm { padding: 3rem 2.5rem; border-right: 1px solid rgba(255,255,255,.06); transition: background .25s; }
.fl-tm:last-child { border-right: none; }
.fl-tm:hover { background: rgba(255,45,120,.02); }
.fl-tqmark { font-family: var(--font-playfair), serif; font-size: 5rem; color: rgba(255,45,120,.13); line-height: .5; margin-bottom: 1.5rem; }
.fl-txt { font-size: .9rem; line-height: 1.78; color: rgba(240,236,228,.45); margin-bottom: 2rem; font-weight: 300; font-style: italic; }
.fl-tauth { display: flex; flex-direction: column; gap: .3rem; }
.fl-ta { font-size: .7rem; letter-spacing: .2em; text-transform: uppercase; font-weight: 600; color: #f0ece4; }
.fl-tr { font-size: .65rem; letter-spacing: .15em; text-transform: uppercase; color: rgba(240,236,228,.22); }

/* faq */
.fl-ql { display: grid; grid-template-columns: 1fr 1.6fr; gap: 8rem; align-items: start; }
.fl-qi { border-top: 1px solid rgba(255,255,255,.06); }
.fl-qi:last-child { border-bottom: 1px solid rgba(255,255,255,.06); }
.fl-qt { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1.6rem 0; background: none; border: none; color: #f0ece4; text-align: left; width: 100%; transition: color .2s; }
.fl-qt:hover { color: rgba(240,236,228,.8); }
.fl-qq { font-size: .95rem; font-weight: 500; letter-spacing: -.01em; }
.fl-qi-icon { width: 28px; height: 28px; border-radius: 50%; border: 1px solid rgba(255,255,255,.1); display: flex; align-items: center; justify-content: center; font-size: 1.1rem; color: rgba(240,236,228,.3); flex-shrink: 0; transition: all .3s; }
.fl-qo .fl-qi-icon { background: rgba(255,45,120,.1); border-color: rgba(255,45,120,.3); color: #FF2D78; transform: rotate(45deg); }
.fl-qc { max-height: 0; overflow: hidden; transition: max-height .45s cubic-bezier(.16,1,.3,1); }
.fl-qans { font-size: .88rem; line-height: 1.78; color: rgba(240,236,228,.42); font-weight: 300; padding-bottom: 1.6rem; max-width: 640px; }

/* cta */
.fl-ctasec { padding: 130px 0; border-top: 1px solid rgba(255,255,255,.06); position: relative; overflow: hidden; }
.fl-ctasec::before { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 1000px; height: 500px; background: radial-gradient(ellipse, rgba(255,45,120,.07) 0%, transparent 65%); pointer-events: none; }
.fl-ctasec h2 { font-size: clamp(3rem, 7vw, 9rem); max-width: 1000px; margin-top: 1rem; }

/* footer */
.fl-ft { border-top: 1px solid rgba(255,255,255,.06); padding: 3rem 0; }
.fl-fi { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1.5rem; }
.fl-flogo { font-family: var(--font-playfair), serif; font-size: 1.3rem; font-weight: 700; }
.fl-flogo span { color: #FF2D78; }
.fl-fcopy { font-size: .65rem; letter-spacing: .12em; text-transform: uppercase; color: rgba(240,236,228,.16); }
.fl-flinks { display: flex; gap: 2rem; }
.fl-flinks a { font-size: .65rem; letter-spacing: .18em; text-transform: uppercase; color: rgba(240,236,228,.18); transition: color .2s; }
.fl-flinks a:hover { color: rgba(240,236,228,.55); }

/* reveal */
.fl-r { opacity: 0; transform: translateY(26px); transition: opacity .8s cubic-bezier(.16,1,.3,1), transform .8s cubic-bezier(.16,1,.3,1); }
.fl-in { opacity: 1; transform: translateY(0); }

/* ── hero entrance (pure CSS, no JS needed) ── */
@keyframes hero-up {
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
}
.hero-lbl  { animation: hero-up .7s cubic-bezier(.16,1,.3,1) .05s both; }
.hero-h1   { animation: hero-up .9s cubic-bezier(.16,1,.3,1) .18s both; }
.hero-sub  { animation: hero-up .7s cubic-bezier(.16,1,.3,1) .35s both; }
.hero-cta  { animation: hero-up .7s cubic-bezier(.16,1,.3,1) .5s  both; }
.hero-stats{ animation: hero-up .7s cubic-bezier(.16,1,.3,1) .65s both; }

/* ── logo heart ── */
.fl-heart {
  color: #FF2D78; margin-right: .35rem;
  display: inline-block;
  animation: hb 1.6s ease-in-out infinite;
  transform-origin: center;
}
@keyframes hb {
  0%,100% { transform: scale(1);    }
  14%     { transform: scale(1.25); }
  28%     { transform: scale(1);    }
  42%     { transform: scale(1.15); }
  70%     { transform: scale(1);    }
}
.fl-dot-logo { color: #FF2D78; }

/* ── emoji burst ── */
@keyframes emoji-fly {
  0%   { opacity: 1; transform: translate(-50%,-50%) scale(0) rotate(0deg); }
  60%  { opacity: 1; }
  100% { opacity: 0; transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(1) rotate(20deg); }
}

/* ── word reveal (kept for scroll sections) ── */
.ww { display: inline-block; overflow: hidden; vertical-align: bottom; }
.wi { display: inline-block; transform: translateY(108%); transition: transform .85s cubic-bezier(.16,1,.3,1); }
.wi.wv { transform: translateY(0); }

/* responsive */
@media (max-width: 1024px) {
  .fl-hw { grid-template-columns: 1fr; gap: 3.5rem; }
  .fl-hw-left { position: static; }
  .fl-ql { grid-template-columns: 1fr; gap: 3rem; }
}
@media (max-width: 860px) {
  .fl-nl { display: none; }
  .fl-frow { grid-template-columns: 2.5rem 1fr; grid-template-rows: auto auto; }
  .fl-fdesc { grid-column: 2; }
  .fl-farr { display: none; }
  .fl-pg { grid-template-columns: 1fr; max-width: 420px; }
  .fl-tg { grid-template-columns: 1fr; }
  .fl-tm { border-right: none; border-bottom: 1px solid rgba(255,255,255,.06); }
  .fl-stats { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 600px) {
  .fl-stats { grid-template-columns: 1fr; }
  .fl-nc .fl-ghost { display: none; }
  .fl-scroll-ind { display: none; }
  .fl-plats { flex-direction: column; align-items: flex-start; }
}
`;
