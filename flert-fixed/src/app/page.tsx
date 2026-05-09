"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const features = [
  { n: "001", title: "Respostas Inteligentes",  desc: "Nossa IA entende contexto, tom e intenção para gerar respostas que soam completamente naturais." },
  { n: "002", title: "Velocidade Real",          desc: "Sugestões em menos de 3 segundos. Nunca mais perca o ritmo de uma conversa." },
  { n: "003", title: "Flertes Personalizados",   desc: "Adaptado ao seu estilo, à pessoa e ao momento. Nunca genérico, sempre autêntico." },
  { n: "004", title: "Privacidade Total",         desc: "Suas conversas são processadas e descartadas imediatamente. Nada fica armazenado." },
  { n: "005", title: "Multi-Plataforma",          desc: "Tinder, Bumble, Hinge, Instagram, WhatsApp. Qualquer screenshot funciona." },
  { n: "006", title: "Aprendizado Contínuo",      desc: "A IA evolui com o seu uso e fica cada vez mais alinhada ao seu jeito único." },
];

const steps = [
  { n: "01", title: "Faça Upload",    desc: "Envie um print da conversa que você quer responder. Qualquer app funciona." },
  { n: "02", title: "Escolha o Tom",  desc: "Flertando, engraçado, casual, afiado, cantada, stories e mais. Você define o clima." },
  { n: "03", title: "Use a Sugestão", desc: "3 opções geradas pela IA. Copie, adapte ou envie direto. É isso." },
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

const marqueeItems = [
  "Conversas que funcionam",
  "A arte do flerte",
  "Inteligência real",
  "Conexões verdadeiras",
  "Seu jeito, amplificado",
];

const burst = (e: React.MouseEvent) => {
  const emos = ["❤️","💕","✨","💘","🥰","💖","🔥"];
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  for (let i = 0; i < 9; i++) {
    const el = document.createElement("span");
    el.textContent = emos[Math.floor(Math.random() * emos.length)];
    const angle = (i / 9) * Math.PI * 2;
    const dist = 55 + Math.random() * 60;
    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * dist - 25;
    el.style.cssText = `position:fixed;pointer-events:none;z-index:9999;font-size:${14+Math.random()*10}px;left:${cx}px;top:${cy}px;--tx:${tx}px;--ty:${ty}px;animation:emoji-fly 1s ease-out forwards;`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1050);
  }
};

export default function HomePage() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });

    const ro = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          const el = e.target as HTMLElement;
          el.style.transitionDelay = el.dataset.d ?? "0ms";
          el.classList.add("in");
          ro.unobserve(el);
        }
      }),
      { threshold: 0.05, rootMargin: "0px 0px -30px 0px" }
    );
    document.querySelectorAll(".r").forEach((el) => ro.observe(el));

    const co = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target as HTMLElement;
        const target = +(el.dataset.n!);
        const suf = el.dataset.s ?? "";
        const t0 = performance.now(), dur = 1800;
        const run = (now: number) => {
          const ease = 1 - Math.pow(1 - Math.min((now - t0) / dur, 1), 3);
          el.textContent = Math.round(ease * target) + suf;
          if (ease < 1) requestAnimationFrame(run);
        };
        requestAnimationFrame(run);
        co.unobserve(el);
      }),
      { threshold: 0.3 }
    );
    document.querySelectorAll("[data-n]").forEach((el) => co.observe(el));

    return () => { window.removeEventListener("scroll", onScroll); ro.disconnect(); co.disconnect(); };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="p">

        {/* ── MOBILE MENU ── */}
        {menuOpen && (
          <div className="p-mob-overlay" onClick={() => setMenuOpen(false)}>
            <div className="p-mob-menu" onClick={e => e.stopPropagation()}>
              <button className="p-mob-close" onClick={() => setMenuOpen(false)}>✕</button>
              <nav className="p-mob-nav">
                <a href="#features" onClick={() => setMenuOpen(false)}>Funcionalidades</a>
                <a href="#como-funciona" onClick={() => setMenuOpen(false)}>Como Funciona</a>
                <a href="#precos" onClick={() => setMenuOpen(false)}>Preços</a>
                <a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a>
              </nav>
              <div className="p-mob-ctas">
                <Link href="/auth/login" onClick={() => setMenuOpen(false)}>Entrar</Link>
                <Link href="/auth/register" className="p-mob-cta" onClick={() => setMenuOpen(false)}>Começar agora</Link>
              </div>
            </div>
          </div>
        )}

        {/* ── NAVBAR ── */}
        <nav className={`p-nav${scrolled ? " p-nav--on" : ""}`}>
          <div className="p-nw">
            <Link href="/" className="p-logo">
              <span className="p-heart">♥</span>Flert<em>.</em>IA
            </Link>
            <div className="p-nl">
              <a href="#features">Funcionalidades</a>
              <a href="#como-funciona">Como Funciona</a>
              <a href="#precos">Preços</a>
              <a href="#faq">FAQ</a>
            </div>
            <div className="p-nc">
              <button className="p-theme" onClick={toggleTheme} aria-label="Tema">
                {theme === "dark" ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                  </svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                )}
              </button>
              <Link href="/auth/login" className="p-ghost">Entrar</Link>
              <Link href="/auth/register" className="p-cta" onClick={burst}>Começar</Link>
              <button className="p-ham" onClick={() => setMenuOpen(true)} aria-label="Menu">
                <span/><span/><span/>
              </button>
            </div>
          </div>
        </nav>

        <main>

          {/* ══════════════════════════════════
               HERO
          ══════════════════════════════════ */}
          <section className="p-hero">
            {/* Animated orbs */}
            <div className="p-hero-orb p-hero-orb--1" aria-hidden/>
            <div className="p-hero-orb p-hero-orb--2" aria-hidden/>
            <div className="p-hero-orb p-hero-orb--3" aria-hidden/>

            {/* Background letter */}
            <div className="p-wm" aria-hidden>F</div>

            {/* Vertical label — left spine */}
            <div className="p-spine" aria-hidden>
              <span>Flert IA — 2026 — São Paulo, BR</span>
            </div>

            {/* Horizontal rule — draws in on load */}
            <div className="p-hrule" aria-hidden />

            <div className="p-w">
              <div className="p-hero-inner">
                <div className="p-hero-top">
                  <p className="p-lbl hero-lbl">— Inteligência Artificial para Conversas —</p>
                  <div className="p-hero-badge-wrap">
                    <div className="p-badge-rot">
                      <svg viewBox="0 0 110 110" width="110" height="110">
                        <path id="cp" d="M55,55 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" fill="none"/>
                        <text fontSize="8.5" letterSpacing="5.5" fill="currentColor" fontFamily="'Cabinet Grotesk'" fontWeight="700">
                          <textPath href="#cp">FLERT IA · CONVERSAS · INTELIGÊNCIA ·</textPath>
                        </text>
                      </svg>
                      <span className="p-badge-center">IA</span>
                    </div>
                  </div>
                </div>

                <h1 className="p-h1 hero-h1">
                  A forma mais<br/>
                  <em>inteligente</em><br/>
                  de se conectar.
                </h1>

                <div className="p-hero-bottom">
                  <p className="p-sub hero-sub">
                    O Flert IA analisa suas conversas e gera
                    respostas que soam como você — mas na
                    melhor versão de você.
                  </p>
                  <div className="p-hcta hero-cta">
                    <Link href="/auth/register" className="p-cta p-cta--lg" onClick={burst}>
                      Começar agora
                    </Link>
                    <a href="#como-funciona" className="p-ghost-link">
                      <span className="p-gl-line"/>ver como funciona
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Scroll indicator */}
            <div className="p-scroll" aria-hidden>
              <span className="p-scroll-line"/>
              <span className="p-scroll-txt">scroll</span>
            </div>
          </section>

          {/* ══════════════════════════════════
               STATS STRIP
          ══════════════════════════════════ */}
          <section className="p-stats-strip">
            <div className="p-w">
              <div className="p-stats-grid">
                {[
                  { n: 10, s: "K+", l: "Usuários ativos" },
                  { n: 1,  s: "M+", l: "Mensagens geradas" },
                  { n: 95, s: "%",  l: "Taxa de sucesso" },
                ].map((st, i) => (
                  <div key={i} className="p-stat r" data-d={`${i * 120}ms`}>
                    <span className="p-stat-n" data-n={st.n} data-s={st.s}>0</span>
                    <div className="p-stat-right">
                      <span className="p-stat-l">{st.l}</span>
                      <span className="p-stat-idx">0{i+1}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════
               MARQUEE — italic Cormorant
          ══════════════════════════════════ */}
          <div className="p-mq">
            <div className="p-mt">
              {[0,1].map(k => (
                <span key={k} aria-hidden={k > 0}>
                  {marqueeItems.map((m, i) => (
                    <span key={i}><em>{m}</em><b>·</b></span>
                  ))}
                </span>
              ))}
            </div>
          </div>

          {/* ══════════════════════════════════
               PLATFORMS
          ══════════════════════════════════ */}
          <div className="p-plats r">
            <span className="p-plats-lbl">Funciona com</span>
            <div className="p-plat-list">
              {["Tinder", "Bumble", "Hinge", "Instagram", "WhatsApp", "Telegram"].map((p, i) => (
                <span key={i}>{p}</span>
              ))}
            </div>
          </div>

          {/* ══════════════════════════════════
               FEATURES
          ══════════════════════════════════ */}
          <section id="features" className="p-sec">
            <div className="p-w">
              <div className="p-sec-head r">
                <div className="p-sec-label">
                  <span className="p-lbl">§ 001</span>
                  <span className="p-lbl">Funcionalidades</span>
                </div>
                <h2>Por que o Flert IA<br/><em>é diferente?</em></h2>
              </div>

              <div className="p-fgrid">
                {features.map((f, i) => (
                  <div key={i} className="p-fcard r" data-d={`${(i % 3) * 70}ms`}>
                    <span className="p-fcard-n">{f.n}</span>
                    <div className="p-fcard-divider"/>
                    <h3 className="p-fcard-t">{f.title}</h3>
                    <p className="p-fcard-d">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════
               INVERTED PULL QUOTE (wine bg)
          ══════════════════════════════════ */}
          <section className="p-invert">
            <div className="p-w">
              <blockquote className="p-quote r">
                <span className="p-qmark">&ldquo;</span>
                <p>A IA que sabe<br/><em>o que você quer dizer.</em></p>
                <cite>— Flert IA, 2026</cite>
              </blockquote>
            </div>
          </section>

          {/* ══════════════════════════════════
               HOW IT WORKS
          ══════════════════════════════════ */}
          <section id="como-funciona" className="p-sec">
            <div className="p-w">
              <div className="p-hw">
                <div className="p-hw-left">
                  <div className="p-sec-label r">
                    <span className="p-lbl">§ 002</span>
                    <span className="p-lbl">Como Funciona</span>
                  </div>
                  <h2 className="p-hw-h r" data-d="60ms">
                    Três<br/>passos.<br/><em>Resultado.</em>
                  </h2>
                  <p className="p-hw-sub r" data-d="120ms">
                    Do upload ao resultado em<br/>menos de 3 segundos.
                  </p>
                </div>
                <div className="p-steps">
                  {steps.map((s, i) => (
                    <div key={i} className="p-step r" data-d={`${i * 100}ms`}>
                      <span className="p-step-n">{s.n}</span>
                      <div className="p-step-body">
                        <h3 className="p-step-t">{s.title}</h3>
                        <p className="p-step-d">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════
               PRICING
          ══════════════════════════════════ */}
          <section id="precos" className="p-sec p-pricing-sec">
            <div className="p-w">
              <div className="p-sec-head r">
                <div className="p-sec-label">
                  <span className="p-lbl">§ 003</span>
                  <span className="p-lbl">Planos</span>
                </div>
                <h2>Preços <em>simples.</em><br/>Sem surpresas.</h2>
              </div>
              <div className="p-pg r" data-d="80ms">

                {/* Mensal */}
                <div className="p-pc">
                  <p className="p-pc-n">Mensal</p>
                  <div className="p-pc-price">
                    <span className="p-pc-currency">R$</span>
                    <span className="p-pc-amt">29</span>
                    <span className="p-pc-dec">,90</span>
                  </div>
                  <p className="p-pc-per">por mês</p>
                  <ul className="p-pc-f">
                    {["30 análises por dia","Respostas avançadas com IA","Análise de perfil","Suporte via email","Uploads ilimitados"].map(f => <li key={f}>{f}</li>)}
                  </ul>
                  <Link href="/auth/register?plan=monthly" className="p-pc-btn" onClick={burst}>
                    Assinar Mensal
                  </Link>
                </div>

                {/* Anual — featured */}
                <div className="p-pc p-pc--hot">
                  <span className="p-pc-hot-badge">✦ Mais Popular</span>
                  <p className="p-pc-n">Anual</p>
                  <div className="p-pc-price">
                    <span className="p-pc-currency">R$</span>
                    <span className="p-pc-amt">147</span>
                    <span className="p-pc-dec">,00</span>
                  </div>
                  <p className="p-pc-per">por ano · economia de R$211</p>
                  <ul className="p-pc-f">
                    {["50 análises por dia","2 meses grátis","Análise de perfil completa","Alertas de padrões","Suporte prioritário"].map(f => <li key={f}>{f}</li>)}
                  </ul>
                  <Link href="/auth/register?plan=annual" className="p-pc-btn p-pc-btn--inv" onClick={burst}>
                    Assinar Anual
                  </Link>
                </div>

                {/* Vitalício */}
                <div className="p-pc">
                  <p className="p-pc-n">Vitalício</p>
                  <div className="p-pc-price">
                    <span className="p-pc-currency">R$</span>
                    <span className="p-pc-amt">297</span>
                    <span className="p-pc-dec">,00</span>
                  </div>
                  <p className="p-pc-per">pagamento único · acesso eterno</p>
                  <ul className="p-pc-f">
                    {["Análises ilimitadas","Acesso vitalício","Updates futuros inclusos","Suporte VIP","Acesso antecipado a novidades"].map(f => <li key={f}>{f}</li>)}
                  </ul>
                  <Link href="/auth/register?plan=lifetime" className="p-pc-btn" onClick={burst}>
                    Comprar Vitalício
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════
               TESTIMONIALS — assimétrico
          ══════════════════════════════════ */}
          <section className="p-sec">
            <div className="p-w">
              <div className="p-sec-head r">
                <div className="p-sec-label">
                  <span className="p-lbl">§ 004</span>
                  <span className="p-lbl">Depoimentos</span>
                </div>
                <h2>O que nossos<br/><em>usuários</em> dizem.</h2>
              </div>
              <div className="p-tgrid">
                <div className="p-tm p-tm--big r">
                  <div className="p-tq">&ldquo;</div>
                  <p className="p-ttxt">{testimonials[0].text}</p>
                  <div className="p-tauth">
                    <span className="p-ta">{testimonials[0].author}</span>
                    <span className="p-tr">{testimonials[0].role}</span>
                  </div>
                </div>
                <div className="p-tm-col">
                  {testimonials.slice(1).map((t, i) => (
                    <div key={i} className="p-tm r" data-d={`${i * 100}ms`}>
                      <div className="p-tq p-tq--sm">&ldquo;</div>
                      <p className="p-ttxt">{t.text}</p>
                      <div className="p-tauth">
                        <span className="p-ta">{t.author}</span>
                        <span className="p-tr">{t.role}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════
               FAQ
          ══════════════════════════════════ */}
          <section id="faq" className="p-sec">
            <div className="p-w">
              <div className="p-ql">
                <div className="p-ql-left">
                  <div className="p-sec-label r">
                    <span className="p-lbl">§ 005</span>
                    <span className="p-lbl">FAQ</span>
                  </div>
                  <h2 className="r" data-d="60ms">Perguntas<br/><em>frequentes.</em></h2>
                </div>
                <div className="p-ql-right">
                  {faqs.map((faq, i) => (
                    <div key={i} className={`p-qi r${openFaq === i ? " p-qo" : ""}`} data-d={`${i * 60}ms`}>
                      <button className="p-qt" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                        <span className="p-qq">{faq.q}</span>
                        <span className="p-qi-icon">{openFaq === i ? "−" : "+"}</span>
                      </button>
                      <div className="p-qc" style={{ maxHeight: openFaq === i ? "300px" : "0" }}>
                        <p className="p-qa">{faq.a}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════
               CTA FINAL — tipografia gigante
          ══════════════════════════════════ */}
          <section className="p-cta-sec">
            <div className="p-cta-bg" aria-hidden/>
            <div className="p-cta-orb" aria-hidden/>
            <div className="p-w">
              <p className="p-lbl r">— Pronto para começar? —</p>
              <h2 className="p-cta-h r" data-d="80ms">
                Transforme<br/>suas <em>conversas</em><br/>agora.
              </h2>
              <div className="r" data-d="200ms" style={{ marginTop: "3rem" }}>
                <Link href="/auth/register" className="p-cta p-cta--lg p-cta--pulse" onClick={burst}>
                  Criar conta gratuita
                </Link>
              </div>
            </div>
          </section>

        </main>

        {/* ── FOOTER ── */}
        <footer className="p-ft">
          <div className="p-ft-line"/>
          <div className="p-w">
            <div className="p-fi">
              <Link href="/" className="p-flogo">
                <span className="p-heart p-heart--sm">♥</span>Flert<em>.</em>IA
              </Link>
              <p className="p-fcopy">© 2026 Flert IA. Todos os direitos reservados.</p>
              <div className="p-flinks">
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

/* ══════════════════════════════════════════════
   CSS
══════════════════════════════════════════════ */
const CSS = `
@keyframes emoji-fly {
  0%   { opacity:1; transform:translate(-50%,-50%) scale(0); }
  60%  { opacity:1; }
  100% { opacity:0; transform:translate(calc(-50% + var(--tx)),calc(-50% + var(--ty))) scale(1.1) rotate(20deg); }
}
@keyframes hb   { 0%,100%{transform:scale(1)} 14%{transform:scale(1.35)} 28%{transform:scale(1)} 42%{transform:scale(1.18)} 70%{transform:scale(1)} }
@keyframes orb1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(40px,-30px) scale(1.1)} 66%{transform:translate(-25px,20px) scale(0.93)} }
@keyframes orb2 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-30px,25px) scale(0.9)} 66%{transform:translate(25px,-20px) scale(1.08)} }
@keyframes orb3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(20px,30px) scale(1.05)} }
@keyframes pulse-ring {
  0%   { box-shadow: 0 0 0 0 rgba(139,10,42,0.5), 0 8px 32px rgba(139,10,42,0.4); }
  70%  { box-shadow: 0 0 0 14px rgba(139,10,42,0), 0 8px 32px rgba(139,10,42,0.4); }
  100% { box-shadow: 0 0 0 0 rgba(139,10,42,0), 0 8px 32px rgba(139,10,42,0.4); }
}
@keyframes shine {
  0%   { transform: translateX(-120%) skewX(-20deg); }
  100% { transform: translateX(220%) skewX(-20deg); }
}

.p *, .p *::before, .p *::after { box-sizing: border-box; margin: 0; padding: 0; }
.p { background: var(--bg); color: var(--tx); min-height: 100vh; overflow-x: hidden; font-family: 'Cabinet Grotesk', sans-serif; -webkit-font-smoothing: antialiased; }
.p a { color: inherit; text-decoration: none; }
.p-w { max-width: 1380px; margin: 0 auto; padding: 0 clamp(1.5rem, 5vw, 5rem); }

/* ── HEART ── */
.p-heart {
  color: var(--wine); display: inline-block; transform-origin: center;
  animation: hb 1.8s ease-in-out infinite; margin-right: 0.3rem;
  font-style: normal; font-size: 1em;
}
.p-heart--sm { font-size: 0.8em; margin-right: 0.25rem; }

/* ── REVEAL ── */
.r { opacity: 0; transform: translateY(32px); transition: opacity 0.85s cubic-bezier(0.16,1,0.3,1), transform 0.85s cubic-bezier(0.16,1,0.3,1); }
.r.in { opacity: 1; transform: translateY(0); }

/* ── NAVBAR ── */
.p-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 300;
  padding: 0 clamp(1.5rem, 5vw, 5rem);
  transition: background 0.4s, border-color 0.4s;
  border-bottom: 1px solid transparent;
}
.p-nav--on {
  background: rgba(8,6,10,0.94);
  backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
  border-bottom-color: var(--bd);
}
[data-theme="light"] .p-nav--on { background: rgba(245,240,232,0.94); }
.p-nw { max-width: 1380px; margin: 0 auto; height: 68px; display: flex; align-items: center; justify-content: space-between; }

.p-logo {
  font-family: var(--font-cormorant), Georgia, serif;
  font-size: 1.45rem; font-weight: 600; font-style: italic; letter-spacing: -0.01em;
  display: inline-flex; align-items: center;
}
.p-logo em { color: var(--gold); font-style: normal; }

.p-nl { display: flex; gap: 2.5rem; }
.p-nl a { font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; font-weight: 600; color: var(--tx-2); transition: color 0.2s; position: relative; }
.p-nl a::after { content: ''; position: absolute; bottom: -3px; left: 0; right: 0; height: 1px; background: var(--gold); transform: scaleX(0); transform-origin: left; transition: transform 0.3s cubic-bezier(0.16,1,0.3,1); }
.p-nl a:hover { color: var(--tx); }
.p-nl a:hover::after { transform: scaleX(1); }

.p-nc { display: flex; align-items: center; gap: 1rem; }

.p-theme { width: 32px; height: 32px; border: 1px solid var(--bd); background: transparent; color: var(--tx-2); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: border-color 0.2s, color 0.2s; }
.p-theme:hover { border-color: var(--gold); color: var(--gold); }

.p-ghost { font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; font-weight: 600; color: var(--tx-2); transition: color 0.2s; padding: 0 0.5rem; min-height: 44px; display: flex; align-items: center; }
.p-ghost:hover { color: var(--tx); }

/* ── CTA BUTTON — enhanced ── */
.p-cta {
  font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; font-weight: 700;
  color: var(--tx); border: 1px solid var(--bd-2); padding: 0.6rem 1.4rem;
  transition: background 0.25s, color 0.25s, border-color 0.25s, transform 0.15s, box-shadow 0.25s;
  min-height: 44px; display: inline-flex; align-items: center; justify-content: center;
  white-space: nowrap; position: relative; overflow: hidden;
}
.p-cta::before {
  content: ''; position: absolute; top: 0; left: -60%; width: 40%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
  transform: skewX(-20deg); opacity: 0; transition: opacity 0.2s;
}
.p-cta:hover { background: var(--wine); border-color: var(--wine); color: #fff; transform: translateY(-2px); box-shadow: 0 8px 28px rgba(139,10,42,0.4); }
.p-cta:hover::before { opacity: 1; animation: shine 0.6s ease-out; }
.p-cta:active { transform: translateY(0) !important; box-shadow: none !important; }

.p-cta--lg { padding: 1.1rem 2.8rem; font-size: 11px; letter-spacing: 0.26em; }
.p-cta--lg:hover { transform: translateY(-3px); box-shadow: 0 14px 40px rgba(139,10,42,0.45); }

/* Pulse ring on final CTA */
.p-cta--pulse { background: var(--wine); border-color: var(--wine); color: #F2EDE8; }
.p-cta--pulse:hover { background: var(--wine-2) !important; border-color: var(--wine-2) !important; animation: pulse-ring 1.8s ease-out infinite; }

.p-ham { display: none; flex-direction: column; gap: 5px; background: none; border: none; cursor: pointer; padding: 8px; }
.p-ham span { display: block; width: 22px; height: 1px; background: var(--tx-2); transition: background 0.2s; }
.p-ham:hover span { background: var(--tx); }

/* ── MOBILE MENU OVERLAY ── */
.p-mob-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 400; backdrop-filter: blur(4px); }
.p-mob-menu { position: fixed; top: 0; right: 0; bottom: 0; width: min(360px, 100vw); background: var(--bg-card); border-left: 1px solid var(--bd); padding: 5rem 2.5rem 3rem; display: flex; flex-direction: column; gap: 3rem; }
.p-mob-close { position: absolute; top: 1.5rem; right: 1.5rem; background: none; border: none; font-size: 1.2rem; color: var(--tx-2); cursor: pointer; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; }
.p-mob-nav { display: flex; flex-direction: column; gap: 0; }
.p-mob-nav a { font-family: var(--font-cormorant), Georgia, serif; font-size: 2.5rem; font-weight: 500; font-style: italic; color: var(--tx); padding: 0.8rem 0; border-bottom: 1px solid var(--bd); transition: color 0.2s; }
.p-mob-nav a:hover { color: var(--wine); }
.p-mob-ctas { display: flex; flex-direction: column; gap: 1rem; }
.p-mob-ctas a { font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; font-weight: 600; color: var(--tx-2); padding: 0.75rem 0; transition: color 0.2s; min-height: 44px; display: flex; align-items: center; }
.p-mob-cta { border: 1px solid var(--bd-2) !important; justify-content: center; }
.p-mob-cta:hover { background: var(--wine) !important; color: #fff !important; border-color: var(--wine) !important; }

/* ══════════════════════════════════════════
   HERO
══════════════════════════════════════════ */
.p-hero { min-height: 100vh; display: flex; flex-direction: column; justify-content: center; position: relative; overflow: hidden; padding: 130px 0 100px; }

/* Animated orbs */
.p-hero-orb { position: absolute; border-radius: 50%; pointer-events: none; filter: blur(120px); }
.p-hero-orb--1 {
  width: 700px; height: 700px;
  background: radial-gradient(circle, rgba(139,10,42,0.13) 0%, transparent 70%);
  top: -150px; right: -150px; animation: orb1 14s ease-in-out infinite;
}
.p-hero-orb--2 {
  width: 450px; height: 450px;
  background: radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%);
  bottom: 5%; left: 5%; animation: orb2 11s ease-in-out infinite;
}
.p-hero-orb--3 {
  width: 320px; height: 320px;
  background: radial-gradient(circle, rgba(139,10,42,0.07) 0%, transparent 70%);
  top: 35%; left: -80px; animation: orb3 9s ease-in-out infinite 1.5s;
}

/* Watermark */
.p-wm {
  position: absolute; top: 50%; right: -0.08em; transform: translateY(-50%);
  font-family: var(--font-cormorant), Georgia, serif;
  font-size: clamp(220px, 40vw, 600px); font-weight: 700; font-style: italic;
  color: transparent; -webkit-text-stroke: 1px rgba(201,168,76,0.07);
  line-height: 1; pointer-events: none; user-select: none; letter-spacing: -0.05em;
}

/* Left spine — vertical text */
.p-spine {
  position: absolute; left: 0; top: 0; bottom: 0;
  width: clamp(1.5rem, 4vw, 4rem);
  display: flex; align-items: center; justify-content: center;
  border-right: 1px solid var(--bd); pointer-events: none;
}
.p-spine span {
  font-size: 9px; letter-spacing: 0.28em; text-transform: uppercase; font-weight: 600;
  color: var(--tx-3); writing-mode: vertical-lr; transform: rotate(180deg); white-space: nowrap;
}

/* Horizontal rule — gold, draws in */
.p-hrule {
  position: absolute; left: clamp(1.5rem, 4vw, 4rem); right: 0; top: 50%;
  height: 1px; background: linear-gradient(to right, var(--gold), transparent);
  transform-origin: left; opacity: 0.15;
  animation: hrule-in 1.4s cubic-bezier(0.16,1,0.3,1) 0.6s both;
}
@keyframes hrule-in { from { transform: scaleX(0); } to { transform: scaleX(1); } }

.p-hero-inner { padding-left: clamp(1.5rem, 4vw, 4rem); position: relative; z-index: 1; }
.p-hero-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem; }

.p-lbl {
  font-size: 9.5px; letter-spacing: 0.3em; text-transform: uppercase; font-weight: 600;
  color: var(--tx-3); display: flex; align-items: center; gap: 1rem;
}
.p-lbl::before, .p-lbl::after { content: ''; height: 1px; background: var(--bd-2); flex-shrink: 0; width: 20px; }

/* Rotating badge */
.p-hero-badge-wrap { flex-shrink: 0; }
.p-badge-rot { position: relative; color: var(--tx-3); animation: rot 20s linear infinite; }
@keyframes rot { to { transform: rotate(360deg); } }
.p-badge-center {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
  font-family: var(--font-cormorant), Georgia, serif;
  font-size: 1.4rem; font-weight: 600; font-style: italic; color: var(--gold);
  animation: rot-reverse 20s linear infinite;
}
@keyframes rot-reverse { to { transform: translate(-50%,-50%) rotate(-360deg); } }

/* TITLE */
.p-h1 {
  font-family: var(--font-cormorant), Georgia, serif;
  font-size: clamp(72px, 11.5vw, 168px);
  font-weight: 600; line-height: 0.92; letter-spacing: -0.03em; color: var(--tx); margin-bottom: 0;
}
.p-h1 em { font-style: italic; color: var(--wine); display: block; }

.p-hero-bottom { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: end; margin-top: 3.5rem; padding-top: 2.5rem; border-top: 1px solid var(--bd); }
.p-sub { font-size: 0.9rem; line-height: 1.85; font-weight: 300; color: var(--tx-2); max-width: 340px; }
.p-hcta { display: flex; align-items: center; gap: 2.5rem; flex-wrap: wrap; justify-content: flex-end; }

.p-ghost-link { font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; font-weight: 600; color: var(--tx-3); display: flex; align-items: center; gap: 0.8rem; transition: color 0.25s; min-height: 44px; }
.p-ghost-link:hover { color: var(--tx-2); }
.p-gl-line { width: 36px; height: 1px; background: currentColor; transition: width 0.3s; flex-shrink: 0; }
.p-ghost-link:hover .p-gl-line { width: 56px; }

/* Scroll indicator */
.p-scroll { position: absolute; bottom: 2.5rem; left: clamp(3rem, 5.5vw, 5.5rem); display: flex; flex-direction: column; align-items: flex-start; gap: 0.5rem; animation: scr-bob 2.8s ease-in-out infinite; }
@keyframes scr-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(9px); } }
.p-scroll-line { display: block; width: 1px; height: 52px; background: linear-gradient(to bottom, var(--wine), transparent); }
.p-scroll-txt { font-size: 9px; letter-spacing: 0.3em; text-transform: uppercase; font-weight: 600; color: var(--tx-3); writing-mode: vertical-lr; }

/* ══════════════════════════════════════════
   STATS STRIP
══════════════════════════════════════════ */
.p-stats-strip { border-top: 1px solid var(--bd); border-bottom: 1px solid var(--bd); padding: 0; }
.p-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); }
.p-stat { padding: 3.5rem clamp(2rem, 4vw, 4rem); border-right: 1px solid var(--bd); display: flex; align-items: baseline; gap: 2rem; }
.p-stat:last-child { border-right: none; }
.p-stat-n { font-family: var(--font-cormorant), Georgia, serif; font-size: clamp(3.5rem, 7vw, 8rem); font-weight: 600; color: var(--tx); line-height: 1; letter-spacing: -0.02em; flex-shrink: 0; }
.p-stat-right { display: flex; flex-direction: column; gap: 0.3rem; padding-bottom: 0.4rem; }
.p-stat-l { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; font-weight: 600; color: var(--tx-2); }
.p-stat-idx { font-size: 9px; letter-spacing: 0.16em; color: var(--tx-3); }

/* ══════════════════════════════════════════
   MARQUEE — italic Cormorant
══════════════════════════════════════════ */
.p-mq { overflow: hidden; border-bottom: 1px solid var(--bd); padding: 1.2rem 0; }
.p-mt { display: flex; white-space: nowrap; animation: mq 36s linear infinite; width: max-content; }
.p-mt span { display: flex; align-items: center; gap: 0; }
.p-mt em { font-family: var(--font-cormorant), Georgia, serif; font-style: italic; font-size: clamp(1.1rem, 2vw, 1.6rem); font-weight: 500; color: var(--tx-2); padding: 0 1.2rem; }
.p-mt b { font-size: 0.5rem; color: var(--wine); opacity: 0.7; font-weight: 400; padding: 0 0.4rem; }
@keyframes mq { from { transform: translateX(0); } to { transform: translateX(-50%); } }

/* ══════════════════════════════════════════
   PLATFORMS
══════════════════════════════════════════ */
.p-plats { display: flex; align-items: center; gap: 2.5rem; flex-wrap: wrap; border-bottom: 1px solid var(--bd); max-width: 1380px; margin: 0 auto; padding: 1.75rem clamp(1.5rem, 5vw, 5rem); }
.p-plats-lbl { font-size: 9px; letter-spacing: 0.26em; text-transform: uppercase; font-weight: 600; color: var(--tx-3); flex-shrink: 0; }
.p-plat-list { display: flex; align-items: center; gap: 2rem; flex-wrap: wrap; }
.p-plat-list span { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; font-weight: 600; color: var(--tx-3); transition: color 0.2s; cursor: default; }
.p-plat-list span:hover { color: var(--gold); }

/* ══════════════════════════════════════════
   SECTIONS — shared
══════════════════════════════════════════ */
.p-sec { padding: 120px 0; border-top: 1px solid var(--bd); }
.p-sec-head { margin-bottom: 5rem; display: grid; grid-template-columns: 160px 1fr; gap: 3rem; align-items: end; }
.p-sec-label { display: flex; flex-direction: column; gap: 0.5rem; padding-bottom: 0.5rem; }
.p-sec-head h2, .p-ql h2, .p-hw-h, .p-cta-h {
  font-family: var(--font-cormorant), Georgia, serif;
  font-size: clamp(2.5rem, 5vw, 5.5rem); font-weight: 600;
  line-height: 1.05; letter-spacing: -0.02em; color: var(--tx);
}
.p-sec-head h2 em, .p-hw-h em, .p-cta-h em, .p-ql h2 em { font-style: italic; color: var(--wine); }

/* ══════════════════════════════════════════
   FEATURES GRID
══════════════════════════════════════════ */
.p-fgrid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: var(--bd); border: 1px solid var(--bd); }
.p-fcard { background: var(--bg); padding: 2.5rem 2rem; display: flex; flex-direction: column; gap: 1rem; transition: background 0.2s; cursor: default; position: relative; overflow: hidden; }
.p-fcard::after { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: var(--wine); transform: scaleY(0); transform-origin: bottom; transition: transform 0.35s cubic-bezier(0.16,1,0.3,1); }
.p-fcard:hover { background: rgba(139,10,42,0.025); }
.p-fcard:hover::after { transform: scaleY(1); }
.p-fcard-n { font-size: 9px; letter-spacing: 0.3em; font-weight: 700; color: var(--bd-2); }
.p-fcard-divider { width: 24px; height: 1px; background: var(--bd-2); }
.p-fcard-t { font-size: 1rem; font-weight: 600; color: var(--tx); letter-spacing: -0.01em; }
.p-fcard-d { font-size: 0.85rem; line-height: 1.72; color: var(--tx-2); font-weight: 300; }

/* ══════════════════════════════════════════
   INVERTED SECTION — wine background
══════════════════════════════════════════ */
.p-invert { background: var(--wine); padding: 100px 0; position: relative; overflow: hidden; }
.p-invert::before {
  content: ''; position: absolute; top: 50%; right: -100px; transform: translateY(-50%);
  width: 500px; height: 500px;
  background: radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 65%);
  pointer-events: none;
}
.p-quote { text-align: center; max-width: 900px; margin: 0 auto; }
.p-qmark { font-family: var(--font-cormorant), Georgia, serif; font-size: clamp(6rem, 15vw, 18rem); color: rgba(201,168,76,0.15); line-height: 0.5; display: block; }
.p-quote p { font-family: var(--font-cormorant), Georgia, serif; font-size: clamp(2.5rem, 5.5vw, 6.5rem); font-weight: 500; line-height: 1.05; letter-spacing: -0.02em; color: #F2EDE8; }
.p-quote em { font-style: italic; color: var(--gold); }
.p-quote cite { display: block; font-size: 10px; letter-spacing: 0.28em; text-transform: uppercase; font-weight: 600; color: rgba(242,237,232,0.4); margin-top: 2rem; font-style: normal; }

/* ══════════════════════════════════════════
   HOW IT WORKS
══════════════════════════════════════════ */
.p-hw { display: grid; grid-template-columns: 1fr 1.5fr; gap: 8rem; align-items: start; }
.p-hw-left { position: sticky; top: 9rem; }
.p-hw-h { margin-top: 0.75rem; }
.p-hw-sub { font-size: 0.875rem; line-height: 1.8; color: var(--tx-2); font-weight: 300; margin-top: 1.5rem; max-width: 260px; }
.p-steps { display: flex; flex-direction: column; }
.p-step { display: grid; grid-template-columns: 5rem 1fr; gap: 2rem; padding: 2.5rem 0; border-top: 1px solid var(--bd); transition: background 0.2s; }
.p-step:last-child { border-bottom: 1px solid var(--bd); }
.p-step:hover { background: rgba(139,10,42,0.02); }
.p-step-n { font-family: var(--font-cormorant), Georgia, serif; font-size: 3.5rem; font-weight: 600; font-style: italic; color: rgba(201,168,76,0.18); line-height: 1; transition: color 0.25s; }
.p-step:hover .p-step-n { color: rgba(201,168,76,0.45); }
.p-step-t { font-size: 1rem; font-weight: 600; color: var(--tx); margin-bottom: 0.4rem; letter-spacing: -0.01em; }
.p-step-d { font-size: 0.85rem; line-height: 1.72; color: var(--tx-2); font-weight: 300; }

/* ══════════════════════════════════════════
   PRICING — enhanced interactions
══════════════════════════════════════════ */
.p-pg { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1px; background: var(--bd); border: 1px solid var(--bd); }
.p-pc { padding: 3.5rem; background: var(--bg); position: relative; transition: background 0.25s, transform 0.25s, box-shadow 0.25s; display: flex; flex-direction: column; overflow: hidden; }
.p-pc:hover { background: rgba(201,168,76,0.02); transform: translateY(-4px); box-shadow: 0 20px 60px rgba(0,0,0,0.2); z-index: 1; }
.p-pc--hot { background: var(--wine); }
.p-pc--hot:hover { background: var(--wine) !important; transform: translateY(-6px); box-shadow: 0 24px 70px rgba(139,10,42,0.5) !important; }
/* shimmer on featured card */
.p-pc--hot::after {
  content: ''; position: absolute; top: 0; left: -80%; width: 60%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(242,237,232,0.05), transparent);
  transform: skewX(-15deg);
  animation: shine 3.5s ease-in-out infinite 0.5s;
  pointer-events: none;
}
.p-pc-hot-badge { position: absolute; top: -1px; left: 3.5rem; font-size: 8px; letter-spacing: 0.32em; text-transform: uppercase; font-weight: 700; color: var(--wine); background: #F2EDE8; padding: 4px 14px; }
.p-pc-n { font-size: 9px; letter-spacing: 0.32em; text-transform: uppercase; font-weight: 700; color: var(--tx-3); margin-bottom: 1.75rem; }
.p-pc--hot .p-pc-n { color: rgba(242,237,232,0.5); }
.p-pc-price { display: flex; align-items: baseline; gap: 0.2rem; margin-bottom: 0.5rem; }
.p-pc-currency { font-family: var(--font-cormorant), Georgia, serif; font-size: 1.5rem; font-weight: 500; color: var(--tx-2); }
.p-pc-amt { font-family: var(--font-cormorant), Georgia, serif; font-size: clamp(3rem, 5vw, 4.5rem); font-weight: 600; color: var(--tx); line-height: 1; letter-spacing: -0.02em; }
.p-pc-dec { font-family: var(--font-cormorant), Georgia, serif; font-size: 1.5rem; font-weight: 500; color: var(--tx-2); }
.p-pc--hot .p-pc-currency, .p-pc--hot .p-pc-amt, .p-pc--hot .p-pc-dec { color: #F2EDE8; }
.p-pc-per { font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--tx-3); margin-bottom: 2rem; }
.p-pc--hot .p-pc-per { color: rgba(242,237,232,0.45); }
.p-pc-f { list-style: none; margin-bottom: 2.5rem; flex: 1; }
.p-pc-f li { display: flex; align-items: center; gap: 1rem; padding: 0.8rem 0; border-top: 1px solid var(--bd); font-size: 0.85rem; color: var(--tx-2); font-weight: 300; transition: color 0.2s; }
.p-pc-f li:hover { color: var(--tx); }
.p-pc--hot .p-pc-f li { border-top-color: rgba(242,237,232,0.12); color: rgba(242,237,232,0.7); }
.p-pc--hot .p-pc-f li:hover { color: #F2EDE8; }
.p-pc-f li::before { content: ''; width: 16px; height: 1px; background: var(--bd-2); flex-shrink: 0; }
.p-pc--hot .p-pc-f li::before { background: rgba(201,168,76,0.5); }

/* Purchase buttons — dramatic hover */
.p-pc-btn {
  display: block; width: 100%; padding: 1rem 1.5rem;
  font-size: 9.5px; letter-spacing: 0.22em; text-transform: uppercase; font-weight: 700;
  text-align: center; border: 1px solid var(--bd-2); color: var(--tx-2);
  background: transparent; position: relative; overflow: hidden;
  transition: background 0.25s, color 0.25s, border-color 0.25s, transform 0.15s, box-shadow 0.25s;
  min-height: 52px; cursor: pointer;
}
.p-pc-btn::before {
  content: ''; position: absolute; top: 0; left: -60%; width: 40%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
  transform: skewX(-20deg); opacity: 0;
}
.p-pc-btn:hover { background: var(--wine); color: #F2EDE8; border-color: var(--wine); transform: translateY(-2px); box-shadow: 0 10px 30px rgba(139,10,42,0.4); }
.p-pc-btn:hover::before { opacity: 1; animation: shine 0.55s ease-out; }
.p-pc-btn:active { transform: translateY(0); box-shadow: none; }

.p-pc-btn--inv { border-color: rgba(242,237,232,0.4); color: #F2EDE8; background: rgba(242,237,232,0.06); }
.p-pc-btn--inv:hover { background: #F2EDE8 !important; color: var(--wine) !important; border-color: #F2EDE8 !important; box-shadow: 0 10px 30px rgba(242,237,232,0.25) !important; }

/* ══════════════════════════════════════════
   TESTIMONIALS — assimétrico
══════════════════════════════════════════ */
.p-tgrid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 1px; background: var(--bd); border: 1px solid var(--bd); }
.p-tm { padding: 3rem 2.5rem; background: var(--bg); transition: background 0.2s; }
.p-tm:hover { background: rgba(139,10,42,0.02); }
.p-tm--big { padding: 4rem 3.5rem; }
.p-tm-col { display: flex; flex-direction: column; gap: 1px; background: var(--bd); }
.p-tm-col .p-tm { flex: 1; }
.p-tq { font-family: var(--font-cormorant), Georgia, serif; font-size: 5.5rem; color: rgba(139,10,42,0.12); line-height: 0.45; margin-bottom: 1.5rem; }
.p-tq--sm { font-size: 3.5rem; margin-bottom: 1rem; }
.p-ttxt { font-size: 0.9rem; line-height: 1.82; color: var(--tx-2); font-weight: 300; font-style: italic; margin-bottom: 2rem; }
.p-tm--big .p-ttxt { font-size: 1rem; line-height: 1.85; }
.p-tauth { display: flex; flex-direction: column; gap: 0.25rem; }
.p-ta { font-size: 9.5px; letter-spacing: 0.22em; text-transform: uppercase; font-weight: 700; color: var(--tx); }
.p-tr { font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--tx-3); }

/* ══════════════════════════════════════════
   FAQ
══════════════════════════════════════════ */
.p-ql { display: grid; grid-template-columns: 1fr 1.8fr; gap: 8rem; align-items: start; }
.p-ql-left { position: sticky; top: 9rem; }
.p-qi { border-top: 1px solid var(--bd); }
.p-qi:last-child { border-bottom: 1px solid var(--bd); }
.p-qt { display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; padding: 1.5rem 0; background: none; border: none; color: var(--tx); text-align: left; width: 100%; cursor: pointer; transition: color 0.2s; min-height: 44px; }
.p-qt:hover { color: var(--tx-2); }
.p-qq { font-size: 0.9rem; font-weight: 500; letter-spacing: -0.01em; flex: 1; text-align: left; }
.p-qi-icon { width: 28px; height: 28px; border: 1px solid var(--bd); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; color: var(--tx-3); flex-shrink: 0; transition: all 0.3s; line-height: 1; font-weight: 300; }
.p-qo .p-qi-icon { background: rgba(139,10,42,0.08); border-color: rgba(139,10,42,0.3); color: var(--wine); }
.p-qc { overflow: hidden; transition: max-height 0.45s cubic-bezier(0.16,1,0.3,1); }
.p-qa { font-size: 0.875rem; line-height: 1.82; color: var(--tx-2); font-weight: 300; padding-bottom: 1.5rem; }

/* ══════════════════════════════════════════
   CTA FINAL
══════════════════════════════════════════ */
.p-cta-sec { padding: 140px 0; border-top: 1px solid var(--bd); position: relative; overflow: hidden; }
.p-cta-bg { position: absolute; top: 50%; left: 20%; transform: translateY(-50%); width: 800px; height: 400px; background: radial-gradient(ellipse, rgba(139,10,42,0.1) 0%, transparent 65%); pointer-events: none; }
.p-cta-orb {
  position: absolute; border-radius: 50%; pointer-events: none; filter: blur(100px);
  width: 350px; height: 350px;
  background: radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%);
  bottom: -50px; right: 10%; animation: orb2 12s ease-in-out infinite;
}
.p-cta-h { font-size: clamp(3.5rem, 8.5vw, 11rem) !important; max-width: none; line-height: 0.94 !important; margin-top: 1.2rem; }

/* ══════════════════════════════════════════
   FOOTER
══════════════════════════════════════════ */
.p-ft { padding: 2.5rem 0; position: relative; }
.p-ft-line { height: 1px; background: linear-gradient(to right, var(--wine), var(--gold), var(--wine)); opacity: 0.5; }
.p-ft .p-w { padding-top: 2rem; }
.p-fi { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1.5rem; }
.p-flogo {
  font-family: var(--font-cormorant), Georgia, serif;
  font-size: 1.3rem; font-weight: 600; font-style: italic;
  display: inline-flex; align-items: center;
}
.p-flogo em { color: var(--gold); font-style: normal; }
.p-fcopy { font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--tx-3); }
.p-flinks { display: flex; gap: 2rem; }
.p-flinks a { font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--tx-3); transition: color 0.2s; }
.p-flinks a:hover { color: var(--gold); }

/* ══════════════════════════════════════════
   HERO ENTRANCE ANIMATIONS
══════════════════════════════════════════ */
@keyframes h-up { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
.hero-lbl   { animation: h-up 0.7s cubic-bezier(0.16,1,0.3,1) 0.12s both; }
.hero-h1    { animation: h-up 1s  cubic-bezier(0.16,1,0.3,1) 0.25s both; }
.hero-sub   { animation: h-up 0.7s cubic-bezier(0.16,1,0.3,1) 0.42s both; }
.hero-cta   { animation: h-up 0.7s cubic-bezier(0.16,1,0.3,1) 0.55s both; }

/* ══════════════════════════════════════════
   RESPONSIVE
══════════════════════════════════════════ */
@media (max-width: 1100px) {
  .p-hw { grid-template-columns: 1fr; gap: 4rem; }
  .p-hw-left { position: static; }
  .p-ql { grid-template-columns: 1fr; gap: 3rem; }
  .p-ql-left { position: static; }
  .p-sec-head { grid-template-columns: 1fr; gap: 1.5rem; }
  .p-tgrid { grid-template-columns: 1fr; }
  .p-tm-col { gap: 1px; }
}
@media (max-width: 860px) {
  .p-nl { display: none; }
  .p-ghost { display: none; }
  .p-ham { display: flex; }
  .p-fgrid { grid-template-columns: 1fr 1fr; }
  .p-pg { grid-template-columns: 1fr; max-width: 440px; }
  .p-stats-grid { grid-template-columns: 1fr; }
  .p-stat { border-right: none; border-bottom: 1px solid var(--bd); }
  .p-stat:last-child { border-bottom: none; }
  .p-badge-rot { display: none; }
  .p-hero-bottom { grid-template-columns: 1fr; gap: 2rem; }
  .p-hcta { justify-content: flex-start; }
  .p-spine { display: none; }
  .p-hero-inner { padding-left: 0; }
  .p-hrule { left: 0; }
}
@media (max-width: 580px) {
  .p-fgrid { grid-template-columns: 1fr; }
  .p-scroll { display: none; }
  .p-plats { flex-direction: column; align-items: flex-start; gap: 1rem; }
  .p-hero { padding: 100px 0 60px; }
  .p-wm { font-size: 55vw; opacity: 0.6; }
  .p-cta--lg { padding: 0.85rem 1.75rem; }
}
`;
