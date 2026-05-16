"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
  motion, AnimatePresence,
  useScroll, useTransform,
  useMotionValue, useSpring,
} from "framer-motion";

// ─── DATA ─────────────────────────────────────────────────────────────────────

const chatMessages = [
  { side: "them", text: "Oi! Vi que você também curte fotografia 📸" },
  { side: "me",   text: "Sim! Adoro capturar momentos especiais ✨" },
  { side: "them", text: "Qual o lugar mais bonito que já fotografou?" },
  { side: "me",   text: "As dunas do Maranhão, sem dúvidas 🌅" },
  { side: "them", text: "Precisamos ir juntos algum dia 😊" },
];

const REACTIONS = ["❤️", "💕", "✨", "💫", "🥰", "💘", "💝", "🔥"];

const NOTIFICATIONS = [
  { icon: "💕", text: "Ana curtiu sua foto", sub: "Há 2 minutos", side: "left" },
  { icon: "💬", text: "Nova mensagem de Julia", sub: "Resposta sugerida pronta", side: "right" },
  { icon: "🎯", text: "98% de chance de resposta", sub: "Mensagem otimizada pela IA", side: "left" },
  { icon: "❤️", text: "Match com Fernanda!", sub: "Flert IA já preparou 3 abertas", side: "right" },
  { icon: "✨", text: "Conversa iniciada com sucesso", sub: "Ela respondeu em 4 minutos", side: "left" },
];

const STORIES = [
  { name: "Lucas, 28", city: "São Paulo", text: "Mandei a sugestão da IA e ela me chamou pra sair no mesmo dia 🤯", emoji: "😍", color: "#D946EF" },
  { name: "Rafael, 31", city: "Rio de Janeiro", text: "Estava travado há dias. A IA gerou a mensagem perfeita. Agora estamos juntos.", emoji: "💑", color: "#FF4D6D" },
  { name: "Mateus, 25", city: "Belo Horizonte", text: "Ela disse que eu tinha a conversa mais interessante do Tinder. Foi 100% Flert IA 😂", emoji: "🏆", color: "#6F1DFF" },
];

const FEATURES = [
  { icon: "📸", title: "Analisa prints", desc: "Upload da conversa e a IA entende o contexto completo em segundos", big: true },
  { icon: "🎯", title: "Resposta cirúrgica", desc: "Gerada no seu tom de voz. Natural. Humana.", big: false },
  { icon: "💡", title: "Lê nas entrelinhas", desc: "Entende emoções, sinais e o que ela realmente quis dizer", big: false },
  { icon: "🔄", title: "Múltiplas opções", desc: "Casual, intenso ou romântico — você escolhe", big: false },
  { icon: "📱", title: "Funciona em tudo", desc: "Tinder, Bumble, Instagram, WhatsApp e mais", big: true },
];

const STEPS = [
  { num: "01", title: "Manda o print", desc: "Tira um screenshot da conversa. Pode ser qualquer app de relacionamento." },
  { num: "02", title: "IA analisa tudo", desc: "Em segundos, a IA lê o contexto, o tom, as emoções e o que está nas entrelinhas." },
  { num: "03", title: "Resposta perfeita", desc: "Recebe opções de resposta no seu estilo. Escolhe, adapta e manda. Simples assim." },
];

const FAQS = [
  { q: "Para quais apps funciona?", a: "Tinder, Bumble, Hinge, Instagram DMs, WhatsApp, Badoo e qualquer app de conversa." },
  { q: "A resposta vai parecer robótica?", a: "Não. A IA aprende seu estilo de escrita e gera respostas que soam naturalmente suas." },
  { q: "Quantas análises posso fazer?", a: "No plano gratuito, 3 análises por mês. No Premium, ilimitado." },
  { q: "Meus prints ficam salvos?", a: "Não. Por segurança, os uploads são processados e descartados imediatamente." },
  { q: "Funciona no celular?", a: "Sim. O site é totalmente responsivo e otimizado para mobile." },
];

const TESTIMONIALS = [
  { text: "Eu finalmente consegui sair com a menina que eu achava que tava fora do meu alcance. A IA entendeu ela melhor do que eu.", name: "Pedro M.", role: "São Paulo", stars: 5 },
  { text: "Eu travava em conversas de Tinder sempre. Agora tenho confiança e as conversas fluem naturalmente.", name: "Carlos R.", role: "Rio de Janeiro", stars: 5 },
  { text: "Pensei que seria só mais um app. Acabou me ajudando a ter a conversa mais bonita que já tive.", name: "André L.", role: "Curitiba", stars: 5 },
];

const PLATFORMS = ["Tinder", "Bumble", "Hinge", "Instagram", "WhatsApp", "Badoo"];

const revealMsgs = [
  { side: "them", text: "Oi, vi que você toca violão… é verdade mesmo ou só na bio? 🎸" },
  { side: "me",   text: "kkk juro que é de verdade! Aprendi pra impressionar alguém especial um dia" },
  { side: "them", text: "Funcionou 👀" },
  { side: "me",   text: "Missão cumprida então. Agora só falta você me ensinar a dançar 😅" },
  { side: "them", text: "Aceito a troca 😄 Quando?" },
];

// ─── UTILS ────────────────────────────────────────────────────────────────────

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

// ─── COUPLE SCENE ─────────────────────────────────────────────────────────────

const BOKEH = [
  { l:6,  t:72, s:10, bl:5,  w:true,  op:.50, d:0,   dur:6  },
  { l:14, t:78, s:16, bl:8,  w:true,  op:.35, d:1.2, dur:8  },
  { l:21, t:68, s:6,  bl:3,  w:false, op:.30, d:0.5, dur:5  },
  { l:30, t:82, s:22, bl:11, w:true,  op:.25, d:2.0, dur:9  },
  { l:38, t:74, s:7,  bl:3,  w:false, op:.38, d:0.8, dur:6  },
  { l:45, t:83, s:12, bl:6,  w:true,  op:.40, d:1.5, dur:7  },
  { l:52, t:70, s:9,  bl:4,  w:true,  op:.32, d:0.3, dur:8  },
  { l:61, t:76, s:18, bl:9,  w:true,  op:.28, d:1.8, dur:6  },
  { l:68, t:71, s:5,  bl:2,  w:false, op:.42, d:0.7, dur:5  },
  { l:76, t:79, s:13, bl:6,  w:true,  op:.30, d:2.2, dur:9  },
  { l:84, t:74, s:8,  bl:4,  w:false, op:.38, d:0.4, dur:7  },
  { l:91, t:70, s:10, bl:5,  w:true,  op:.32, d:1.1, dur:6  },
  { l:3,  t:84, s:20, bl:10, w:true,  op:.18, d:3.0, dur:10 },
  { l:26, t:88, s:8,  bl:4,  w:false, op:.30, d:1.4, dur:5  },
  { l:43, t:87, s:14, bl:7,  w:true,  op:.22, d:0.9, dur:8  },
  { l:58, t:89, s:6,  bl:3,  w:false, op:.45, d:2.4, dur:6  },
  { l:72, t:85, s:16, bl:8,  w:true,  op:.20, d:1.7, dur:9  },
  { l:88, t:82, s:9,  bl:5,  w:true,  op:.30, d:0.6, dur:7  },
  { l:50, t:76, s:5,  bl:2,  w:false, op:.50, d:2.8, dur:5  },
  { l:35, t:75, s:7,  bl:3,  w:true,  op:.40, d:1.3, dur:8  },
];

// Imagens: public/couple/
// scene-1.jpg = casal à distância (última imagem)
// scene-2.jpg = ela sorri, aproximação (3ª imagem)
// scene-3.jpg = testas juntas, conexão (2ª imagem)
// scene-4.jpg = abraço, beijo na testa (1ª imagem)
const PHOTO_SCENES = [
  { src: "/couple/scene-1.jpg" },
  { src: "/couple/scene-2.jpg" },
  { src: "/couple/scene-3.jpg" },
  { src: "/couple/scene-4.jpg" },
];

function CoupleScene() {
  const { scrollYProgress: sp } = useScroll();

  // Crossfade com janelas generosas — transições muito suaves
  const s1 = useTransform(sp, [0,    0.10, 0.38], [1, 1, 0]);
  const s2 = useTransform(sp, [0.25, 0.38, 0.60, 0.72], [0, 1, 1, 0]);
  const s3 = useTransform(sp, [0.58, 0.72, 0.86, 0.94], [0, 1, 1, 0]);
  const s4 = useTransform(sp, [0.82, 0.93, 1],    [0, 1, 1]);

  // Ken Burns — zoom suave enquanto a cena está ativa
  const z1 = useTransform(sp, [0,    0.38], [1.00, 1.08]);
  const z2 = useTransform(sp, [0.25, 0.72], [1.00, 1.08]);
  const z3 = useTransform(sp, [0.58, 0.94], [1.00, 1.08]);
  const z4 = useTransform(sp, [0.82, 1.00], [1.00, 1.06]);

  // Fade in/out global da cena
  const sceneOp = useTransform(sp, [0, 0.04, 0.96, 1], [0, 1, 1, 0.82]);

  // Color grade — intensifica a identidade visual com o scroll
  const gradeOp = useTransform(sp, [0, 0.5, 1], [0.12, 0.22, 0.38]);

  const opacities = [s1, s2, s3, s4];
  const zooms     = [z1, z2, z3, z4];

  return (
    <div className="cp-scene" aria-hidden>
      {PHOTO_SCENES.map((scene, i) => (
        <motion.div key={i} className="cp-photo" style={{ opacity: opacities[i] }}>
          <motion.img
            src={scene.src}
            alt=""
            className="cp-photo-img"
            style={{ scale: zooms[i] }}
            loading={i === 0 ? "eager" : "lazy"}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </motion.div>
      ))}

      {/* Brand color grade — tinge magenta/violet com o scroll */}
      <motion.div className="cp-grade" style={{ opacity: gradeOp }} />

      {/* Vignette cinematográfica */}
      <motion.div className="cp-vignette" style={{ opacity: sceneOp }} />

      {/* Bokeh — discreta sobre as fotos */}
      {BOKEH.map((b, i) => (
        <div key={i} className="cp-bk" style={{
          left:`${b.l}%`, top:`${b.t}%`,
          width:b.s, height:b.s,
          opacity: b.op * 0.55,
          filter:`blur(${b.bl * 1.4}px)`,
          background: b.w
            ? `rgba(195,105,30,${b.op + .12})`
            : `rgba(130,25,155,${b.op})`,
          animationDelay:`${b.d}s`,
          animationDuration:`${b.dur}s`,
        }}/>
      ))}
    </div>
  );
}

// ─── BACKGROUND SCENE ────────────────────────────────────────────────────────

const BG_PARTICLES = [
  { top:  7, left:  6, s:2.5, d:0,   dur:6 },
  { top: 13, left: 87, s:1.5, d:1.3, dur:7 },
  { top: 19, left: 41, s:3,   d:0.6, dur:5 },
  { top: 26, left: 14, s:2,   d:2.1, dur:8 },
  { top: 32, left: 71, s:1.5, d:0.3, dur:6 },
  { top: 38, left: 28, s:2.5, d:1.8, dur:7 },
  { top: 44, left: 58, s:2,   d:0.9, dur:5 },
  { top: 51, left:  8, s:3,   d:2.5, dur:8 },
  { top: 57, left: 82, s:1.5, d:0.4, dur:6 },
  { top: 63, left: 36, s:2,   d:1.1, dur:7 },
  { top: 69, left: 66, s:2.5, d:1.7, dur:5 },
  { top: 75, left: 21, s:1.5, d:0.7, dur:8 },
  { top: 80, left: 91, s:2,   d:2.3, dur:6 },
  { top: 86, left: 48, s:3,   d:1.0, dur:7 },
  { top: 92, left: 76, s:2,   d:1.5, dur:5 },
  { top: 96, left: 11, s:1.5, d:2.8, dur:8 },
];

function BackgroundScene() {
  const { scrollYProgress } = useScroll();

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -550]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0,  380]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -250]);
  const y4 = useTransform(scrollYProgress, [0, 1], [0,  480]);
  const x4 = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const y5 = useTransform(scrollYProgress, [0, 1], [0, -180]);
  const x5 = useTransform(scrollYProgress, [0, 1], [0,  160]);

  return (
    <div className="bg-scene" aria-hidden>
      <motion.div className="bg-o bg-o1" style={{ y: y1 }} />
      <motion.div className="bg-o bg-o2" style={{ y: y2 }} />
      <motion.div className="bg-o bg-o3" style={{ y: y3 }} />
      <motion.div className="bg-o bg-o4" style={{ y: y4, x: x4 }} />
      <motion.div className="bg-o bg-o5" style={{ y: y5, x: x5 }} />
      <div className="bg-grid" />
      {BG_PARTICLES.map((p, i) => (
        <div
          key={i}
          className="bg-particle"
          style={{
            top: `${p.top}%`,
            left: `${p.left}%`,
            width: p.s,
            height: p.s,
            animationDelay: `${p.d}s`,
            animationDuration: `${p.dur}s`,
          }}
        />
      ))}
    </div>
  );
}

function useSmoothScroll() {
  useEffect(() => {
    let lenis: any;
    import("lenis").then(({ default: Lenis }) => {
      lenis = new Lenis({ lerp: 0.08, smoothWheel: true });
      const raf = (t: number) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    });
    return () => lenis?.destroy();
  }, []);
}

// ─── STORY PROGRESS ──────────────────────────────────────────────────────────

function StoryProgress() {
  const { scrollYProgress } = useScroll();
  const scaleY = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  return (
    <motion.div
      aria-hidden
      style={{ scaleY, transformOrigin: "top", originY: 0 }}
      className="lp-progress"
    />
  );
}

// ─── FLOATING REACTIONS ───────────────────────────────────────────────────────

function FloatingReactions({ count = 8 }: { count?: number }) {
  return (
    <div className="freactions" aria-hidden>
      {REACTIONS.slice(0, count).map((emoji, i) => (
        <motion.span
          key={i} className="freaction"
          style={{ left: `${4 + i * 12}%`, fontSize: `${14 + (i % 3) * 5}px` }}
          animate={{ y: [0, -(160 + i * 22)], opacity: [0, 0.9, 0], x: [0, i % 2 === 0 ? 14 : -14] }}
          transition={{ duration: 2.8 + i * 0.3, repeat: Infinity, delay: i * 0.65, ease: "easeOut", repeatDelay: 0.8 }}
        >{emoji}</motion.span>
      ))}
    </div>
  );
}

// ─── PHONE MOCKUP ─────────────────────────────────────────────────────────────

function PhoneMockup() {
  const [visible, setVisible] = useState<number[]>([]);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const show = async () => {
      for (let i = 0; i < chatMessages.length; i++) {
        if (i % 2 === 0) { setTyping(true); await delay(900); setTyping(false); }
        await delay(200);
        setVisible(v => [...v, i]);
        await delay(700);
      }
    };
    const t = setTimeout(show, 1400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="phone">
      <div className="phone-notch" />
      <div className="phone-screen">
        <div className="phone-header">
          <div className="phone-avatar" />
          <div>
            <div className="phone-name">Ana</div>
            <div className="phone-status"><span className="phone-dot" />online agora</div>
          </div>
        </div>
        <div className="phone-msgs">
          <AnimatePresence>
            {chatMessages.map((m, i) => visible.includes(i) && (
              <motion.div key={i} className={`msg msg--${m.side}`}
                initial={{ opacity: 0, y: 12, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.38, ease: [0.34, 1.56, 0.64, 1] }}
              >{m.text}</motion.div>
            ))}
          </AnimatePresence>
          {typing && (
            <motion.div className="msg msg--typing"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            ><span /><span /><span /></motion.div>
          )}
        </div>
        <div className="phone-ia-badge"><span>✦</span> gerado pelo Flert IA</div>
      </div>
    </div>
  );
}

// ─── CINEMATIC TEXT BREAK ─────────────────────────────────────────────────────

function CinematicText({ line, sub }: { line: string; sub?: string }) {
  return (
    <section className="ct-s">
      <div className="ct-glow" aria-hidden />
      <div className="ct-inner">
        <motion.div
          className="ct-line"
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
        >{line}</motion.div>
        {sub && (
          <motion.p
            className="ct-sub"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.35 }}
          >{sub}</motion.p>
        )}
      </div>
    </section>
  );
}

// ─── MATCH SECTION ────────────────────────────────────────────────────────────

function MatchSection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const heartScale = useTransform(scrollYProgress, [0, 0.45, 0.85], [0.15, 1.3, 1.0]);
  const heartOpacity = useTransform(scrollYProgress, [0, 0.15, 0.75, 1], [0, 0.12, 0.12, 0]);

  return (
    <section ref={ref} className="match-s">
      <motion.div className="match-bg-heart" style={{ scale: heartScale, opacity: heartOpacity }} aria-hidden>
        ❤️
      </motion.div>

      <motion.div
        className="match-card"
        initial={{ opacity: 0, y: 60, scale: 0.88 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 1, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <motion.div
          className="match-icon"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >❤️</motion.div>
        <div className="match-label">É um match!</div>
        <div className="match-names">Você e <strong>Ana</strong> gostaram um do outro</div>
        <div className="match-sub">A Flert IA já preparou 3 opções de abertura perfeitas</div>
        <motion.div className="match-cta"
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 2.2, repeat: Infinity }}
        >Ver sugestões ✦</motion.div>
      </motion.div>

      {[...Array(6)].map((_, i) => (
        <motion.div key={i} className="match-heart" aria-hidden
          style={{ left: `${8 + i * 16}%`, bottom: "12%" }}
          animate={{ y: [0, -(120 + i * 28)], opacity: [0, 1, 0], scale: [0.4, 1.1, 0.4] }}
          transition={{ duration: 2.8 + i * 0.35, repeat: Infinity, delay: i * 0.6, ease: "easeOut" }}
        >{["❤️","💕","💗","💖","💝","💘"][i]}</motion.div>
      ))}
    </section>
  );
}

// ─── NOTIFICATION STREAM ─────────────────────────────────────────────────────

function NotificationStream() {
  return (
    <section className="notif-s">
      <motion.p
        className="notif-eyebrow"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
      >— enquanto você dormia —</motion.p>

      <div className="notif-list">
        {NOTIFICATIONS.map((n, i) => (
          <motion.div
            key={i}
            className={`notif-card notif-card--${n.side}`}
            initial={{ opacity: 0, x: n.side === "left" ? -100 : 100 }}
            whileInView={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.02 }}
            viewport={{ once: true, margin: "-5%" }}
            transition={{ duration: 0.65, delay: i * 0.1, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <span className="notif-icon">{n.icon}</span>
            <div className="notif-body">
              <div className="notif-text">{n.text}</div>
              <div className="notif-sub">{n.sub}</div>
            </div>
            <motion.div
              className="notif-dot"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ─── CHAT REVEAL ─────────────────────────────────────────────────────────────

function ChatRevealSection() {
  return (
    <section className="chatrev-s">
      <div className="chatrev-inner">
        <div className="chatrev-left">
          <motion.p
            className="sec-eyebrow"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >— a conversa perfeita —</motion.p>

          <div className="chatrev-msgs">
            {revealMsgs.map((m, i) => (
              <motion.div
                key={i}
                className={`chatrev-msg chatrev-msg--${m.side}`}
                initial={{ opacity: 0, y: 22, scale: 0.94 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-5%" }}
                transition={{ duration: 0.55, delay: i * 0.12, ease: [0.34, 1.56, 0.64, 1] }}
              >
                {m.text}
                {m.side === "me" && <span className="chatrev-ia-tag">✦ IA</span>}
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          className="chatrev-right"
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="chatrev-title">
            Cada mensagem,<br /><em>calculada.</em>
          </h2>
          <p className="chatrev-desc">
            A IA lê o contexto, entende o tom dela, analisa as
            entrelinhas e gera uma resposta que soa 100% sua — só melhorada.
          </p>
          <div className="chatrev-stats">
            <div className="chatrev-stat">
              <span className="chatrev-stat-n">4min</span>
              <span className="chatrev-stat-l">tempo médio de resposta dela</span>
            </div>
            <div className="chatrev-stat">
              <span className="chatrev-stat-n">87%</span>
              <span className="chatrev-stat-l">taxa de continuidade da conversa</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── HOW IT WORKS ─────────────────────────────────────────────────────────────

function HowItWorks() {
  return (
    <section className="how-s">
      <motion.div
        className="how-head"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <p className="sec-eyebrow">— como funciona —</p>
        <h2 className="sec-h2">Três passos.<br /><em>Uma conexão.</em></h2>
      </motion.div>

      <div className="how-steps">
        {STEPS.map((s, i) => (
          <motion.div
            key={i}
            className="how-step"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-5%" }}
            transition={{ duration: 0.7, delay: i * 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="how-num">{s.num}</div>
            <div className="how-content">
              <div className="how-title">{s.title}</div>
              <div className="how-desc">{s.desc}</div>
            </div>
            {i < STEPS.length - 1 && <div className="how-connector" aria-hidden />}
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ─── FEATURES BENTO ──────────────────────────────────────────────────────────

function FeaturesBento() {
  return (
    <section className="feat-s">
      <motion.div
        className="feat-head"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <p className="sec-eyebrow">— o que você ganha —</p>
        <h2 className="sec-h2">Tecnologia invisível.<br /><em>Conexão real.</em></h2>
      </motion.div>

      <div className="feat-bento">
        {FEATURES.map((f, i) => (
          <motion.div
            key={i}
            className={`feat-card ${f.big ? "feat-card--big" : ""}`}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.6, delay: i * 0.09 }}
          >
            <div className="feat-icon">{f.icon}</div>
            <div className="feat-title">{f.title}</div>
            <div className="feat-desc">{f.desc}</div>
            <div className="feat-glow" aria-hidden />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ─── STORIES SECTION ─────────────────────────────────────────────────────────

function StoriesSection() {
  return (
    <section className="stories-s">
      <motion.div
        className="stories-head"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <p className="sec-eyebrow">— histórias reais —</p>
        <h2 className="sec-h2">Vidas que mudaram<br /><em>de conversa.</em></h2>
      </motion.div>

      <div className="stories-grid">
        {STORIES.map((s, i) => (
          <motion.div
            key={i}
            className="story-card"
            initial={{ opacity: 0, y: 60, rotate: i === 1 ? 0 : i === 0 ? -2 : 2 }}
            whileInView={{ opacity: 1, y: 0, rotate: 0 }}
            whileHover={{ y: -8, scale: 1.02 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.85, delay: i * 0.14, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <div className="story-emoji">{s.emoji}</div>
            <p className="story-text">"{s.text}"</p>
            <div className="story-author">
              <div className="story-avatar" style={{ background: s.color }}>{s.name[0]}</div>
              <div>
                <div className="story-name">{s.name}</div>
                <div className="story-city">{s.city}</div>
              </div>
            </div>
            <div className="story-glow" style={{ background: s.color }} aria-hidden />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ─── TESTIMONIALS ─────────────────────────────────────────────────────────────

function TestimonialsSection() {
  return (
    <section className="test-s">
      <motion.div
        className="test-head"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <p className="sec-eyebrow">— o que dizem —</p>
        <h2 className="sec-h2">Eles conectaram.<br /><em>Você pode também.</em></h2>
      </motion.div>

      <div className="test-grid">
        {TESTIMONIALS.map((t, i) => (
          <motion.div
            key={i}
            className="test-card"
            initial={{ opacity: 0, y: 50, rotate: [-2, 1, -1][i] }}
            whileInView={{ opacity: 1, y: 0, rotate: 0 }}
            whileHover={{ y: -6, scale: 1.02 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.8, delay: i * 0.15, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <div className="test-stars">{"★".repeat(t.stars)}</div>
            <p className="test-text">"{t.text}"</p>
            <div className="test-author">
              <div className="test-avatar">{t.name[0]}</div>
              <div>
                <div className="test-name">{t.name}</div>
                <div className="test-role">{t.role}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ─── PRICING ──────────────────────────────────────────────────────────────────

function PricingSection() {
  const plans = [
    {
      name: "Grátis",
      originalPrice: null,
      price: "R$ 0",
      per: "para sempre",
      badge: null,
      variant: "free" as const,
      features: ["3 análises por mês", "1 sugestão por análise", "Plataformas básicas"],
      cta: "Começar grátis",
      href: "/auth/register",
    },
    {
      name: "Mensal",
      originalPrice: "R$ 59,90",
      price: "R$ 29,90",
      per: "por mês",
      badge: "Mais popular",
      variant: "accent" as const,
      features: ["Análises ilimitadas", "5 sugestões por análise", "Todos os apps", "Modo intenso e romântico", "Suporte prioritário"],
      cta: "Assinar agora",
      href: "/auth/register?plan=monthly",
    },
    {
      name: "Anual",
      originalPrice: "R$ 297,00",
      price: "R$ 147,00",
      per: "por ano",
      badge: "Economize 51%",
      variant: "annual" as const,
      features: ["Tudo do Mensal", "Equivale a R$12,25/mês", "Acesso completo 12 meses", "Suporte prioritário"],
      cta: "Assinar anual",
      href: "/auth/register?plan=annual",
    },
    {
      name: "Vitalício",
      originalPrice: "R$ 497,00",
      price: "R$ 297,00",
      per: "pagamento único",
      badge: "Melhor investimento",
      variant: "lifetime" as const,
      features: ["Tudo do Premium", "Acesso para sempre", "Novas features primeiro", "Acesso exclusivo beta", "Sem mensalidade jamais"],
      cta: "Garantir acesso vitalício",
      href: "/auth/register?plan=lifetime",
    },
  ];

  return (
    <section className="price-s" id="precos">
      <motion.div
        className="price-head"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <p className="sec-eyebrow">— planos —</p>
        <h2 className="sec-h2">Invista na sua<br /><em>conexão.</em></h2>
      </motion.div>

      <div className="price-grid price-grid--4">
        {plans.map((p, i) => (
          <motion.div
            key={i}
            className={`price-card price-card--${p.variant}`}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ y: -6 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.7, delay: i * 0.12 }}
          >
            {p.badge && (
              <div className={`price-badge price-badge--${p.variant}`}>{p.badge}</div>
            )}
            <div className="price-name">{p.name}</div>
            {p.originalPrice && (
              <div className="price-original">De <s>{p.originalPrice}</s> por</div>
            )}
            <div className="price-amount">
              {p.price}<span className="price-per"> / {p.per}</span>
            </div>
            <ul className="price-list">
              {p.features.map((f, j) => (
                <li key={j}><span>✓</span> {f}</li>
              ))}
            </ul>
            <Link href={p.href} className={`price-btn price-btn--${p.variant}`}>
              {p.cta}
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="faq-s">
      <motion.div
        className="faq-head"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <p className="sec-eyebrow">— dúvidas —</p>
        <h2 className="sec-h2">Perguntas<br /><em>frequentes.</em></h2>
      </motion.div>

      <div className="faq-list">
        {FAQS.map((f, i) => (
          <motion.div
            key={i}
            className={`faq-item ${open === i ? "faq-item--open" : ""}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.07 }}
          >
            <button className="faq-q" onClick={() => setOpen(open === i ? null : i)}>
              {f.q}
              <motion.span
                className="faq-icon"
                animate={{ rotate: open === i ? 45 : 0 }}
                transition={{ duration: 0.28 }}
              >+</motion.span>
            </button>
            <AnimatePresence>
              {open === i && (
                <motion.div
                  className="faq-a"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.32 }}
                >
                  <p>{f.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ─── MARQUEE ──────────────────────────────────────────────────────────────────

function Marquee() {
  const items = ["Match perfeito ✦", "Conversa fluindo ✦", "Ela respondeu ✦", "Conexão real ✦", "Momento certo ✦", "Flert IA ✦"];
  return (
    <div className="marquee" aria-hidden>
      <motion.div
        className="marquee-track"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
      >
        {[...items, ...items].map((item, i) => (
          <span key={i} className="marquee-item">{item}</span>
        ))}
      </motion.div>
    </div>
  );
}

// ─── HERO ─────────────────────────────────────────────────────────────────────

function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  return (
    <section ref={ref} className="hero">

      <div className="hero-grid" aria-hidden />

      <motion.div className="hero-inner" style={{ y: heroY, opacity: heroOpacity }}>
        <div className="hero-content">
          <motion.div
            className="hero-badge"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="hero-badge-dot" />
            IA para conversas que conectam
          </motion.div>

          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            A conversa perfeita<br />
            <em>estava dentro de você.</em>
            <span className="hero-title-sub">A IA só revelou.</span>
          </motion.h1>

          <motion.p
            className="hero-sub"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            Manda o print. Recebe a resposta certa.<br />
            Conexões reais. Histórias que começam aqui.
          </motion.p>

          <motion.div
            className="hero-ctas"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
          >
            <Link href="/auth/register" className="hero-cta-primary">
              Começar agora — é grátis
            </Link>
            <Link href="/auth/login" className="hero-cta-secondary">
              Já tenho conta →
            </Link>
          </motion.div>

          <motion.div
            className="hero-social"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            <div className="hero-avatars">
              {["A","R","M","C","L"].map((l, i) => (
                <div key={i} className="hero-avatar-pill" style={{ zIndex: 5 - i, marginLeft: i > 0 ? "-10px" : 0 }}>{l}</div>
              ))}
            </div>
            <span className="hero-social-text"><strong>+3.200</strong> conexões esse mês</span>
          </motion.div>
        </div>

        <motion.div
          className="hero-visual"
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.3, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <PhoneMockup />
          <FloatingReactions count={6} />
        </motion.div>
      </motion.div>

      <motion.div
        className="hero-scroll-hint"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2.2, repeat: Infinity }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
      >
        <div className="hero-scroll-line" />
        <span>role para descobrir</span>
      </motion.div>
    </section>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  useSmoothScroll();

  const mouseX = useMotionValue(-600);
  const mouseY = useMotionValue(-600);
  const glowX = useSpring(mouseX, { stiffness: 350, damping: 35, mass: 0.4 });
  const glowY = useSpring(mouseY, { stiffness: 350, damping: 35, mass: 0.4 });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      mouseX.set(e.clientX - 200);
      mouseY.set(e.clientY - 200);
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [mouseX, mouseY]);

  return (
    <main className="lp">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <CoupleScene />
      <BackgroundScene />
      <motion.div className="cursor-glow" style={{ x: glowX, y: glowY }} aria-hidden />
      <StoryProgress />

      <motion.nav
        className="lp-nav"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Link href="/" className="lp-nav-logo">
          <span className="lp-nav-heart">♥</span>Flert<em>.</em>IA
        </Link>
        <div className="lp-nav-links">
          <Link href="#precos" className="lp-nav-link">Planos</Link>
          <Link href="/auth/login" className="lp-nav-link">Entrar</Link>
          <Link href="/auth/register" className="lp-nav-cta">Começar grátis</Link>
        </div>
      </motion.nav>

      <Hero />

      <CinematicText
        line="Então aconteceu o match."
        sub="E você não sabia o que dizer."
      />

      <MatchSection />

      <CinematicText
        line="A IA entendeu tudo."
        sub="Em segundos. Sem julgamento."
      />

      <NotificationStream />
      <Marquee />

      <section className="plat-s">
        <motion.p
          className="plat-label"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >Funciona em todos os seus apps</motion.p>
        <div className="plat-list">
          {PLATFORMS.map((p, i) => (
            <motion.span
              key={i}
              className="plat-item"
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
            >{p}</motion.span>
          ))}
        </div>
      </section>

      <ChatRevealSection />

      <CinematicText
        line="Simples como respirar."
        sub="Poderoso como nenhum outro."
      />

      <HowItWorks />
      <FeaturesBento />

      <CinematicText line="Conexão real começa aqui." />

      <StoriesSection />
      <TestimonialsSection />

      <section className="quote-s">
        <div className="quote-glow" aria-hidden />
        <motion.div
          className="quote-inner"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="quote-mark">"</div>
          <blockquote className="quote-text">
            Não é sobre ter as palavras certas.<br />
            É sobre ter a coragem de mandá-las.
          </blockquote>
          <div className="quote-source">— Flert IA —</div>
        </motion.div>
      </section>

      <PricingSection />
      <FAQSection />

      <section className="cta-s">
        <FloatingReactions count={8} />
        <motion.div
          className="cta-inner"
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="sec-eyebrow">— comece agora —</p>
          <h2 className="cta-title">
            Sua próxima conversa<br /><em>pode mudar tudo.</em>
          </h2>
          <p className="cta-sub">
            Mais de 3.200 histórias começaram aqui.<br />A sua pode ser a próxima.
          </p>
          <Link href="/auth/register" className="cta-btn">
            Começar agora — é grátis
          </Link>
          <p className="cta-note">Sem cartão de crédito. Sem complicação.</p>
        </motion.div>
      </section>

      <footer className="lp-footer">
        <Link href="/" className="footer-logo">
          <span>♥</span>Flert<em>.</em>IA
        </Link>
        <div className="footer-links">
          <Link href="/terms" className="footer-link">Termos</Link>
          <Link href="/privacy" className="footer-link">Privacidade</Link>
          <Link href="mailto:contato@flertia.com.br" className="footer-link">Contato</Link>
        </div>
        <p className="footer-copy">© 2026 Flert IA. Feito com ❤️ no Brasil.</p>
      </footer>
    </main>
  );
}

// ─── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
.lp {
  --bg:#0B0B0F; --tx:#F2EDE8; --tx2:rgba(242,237,232,.55); --tx3:rgba(242,237,232,.3);
  --bd:rgba(255,255,255,.07); --bd2:rgba(255,255,255,.12);
  --acc:#D946EF; --acc2:#FF4D6D; --acc3:#6F1DFF;
  --grad:linear-gradient(135deg,#D946EF,#FF4D6D);
  background:var(--bg); color:var(--tx);
  font-family:'Cabinet Grotesk',sans-serif; overflow-x:hidden;
  position:relative;
}
.lp section, .lp footer, .lp .marquee { position:relative; z-index:1; }
.bg-scene { position:absolute; inset:0; z-index:0; pointer-events:none; overflow:hidden; }
.bg-o { position:absolute; border-radius:50%; will-change:transform; }
.bg-o1 { width:min(90vw,900px); height:min(90vw,900px); top:-15%; left:-20%;
  background:radial-gradient(circle,rgba(217,70,239,.08) 0%,transparent 65%);
  filter:blur(90px); animation:bgd1 22s ease-in-out infinite alternate; }
.bg-o2 { width:min(75vw,750px); height:min(75vw,750px); top:25%; right:-18%;
  background:radial-gradient(circle,rgba(255,77,109,.07) 0%,transparent 65%);
  filter:blur(80px); animation:bgd2 28s ease-in-out infinite alternate; }
.bg-o3 { width:min(65vw,650px); height:min(65vw,650px); top:55%; left:15%;
  background:radial-gradient(circle,rgba(111,29,255,.07) 0%,transparent 65%);
  filter:blur(100px); animation:bgd3 19s ease-in-out infinite alternate 2s; }
.bg-o4 { width:min(55vw,500px); height:min(55vw,500px); top:75%; right:10%;
  background:radial-gradient(circle,rgba(217,70,239,.06) 0%,transparent 65%);
  filter:blur(80px); animation:bgd1 24s ease-in-out infinite alternate 4s; }
.bg-o5 { width:min(45vw,400px); height:min(45vw,400px); top:40%; left:45%;
  background:radial-gradient(circle,rgba(255,77,109,.05) 0%,transparent 65%);
  filter:blur(70px); animation:bgd2 16s ease-in-out infinite alternate 1s; }
.bg-grid { position:absolute; inset:0;
  background-image:radial-gradient(rgba(255,255,255,.028) 1px,transparent 1px);
  background-size:44px 44px; }
.bg-particle { position:absolute; border-radius:50%;
  background:rgba(217,70,239,.55);
  box-shadow:0 0 6px 1px rgba(217,70,239,.3);
  animation:float-p linear infinite; }
@keyframes bgd1 { 0%{transform:translate(0,0) scale(1)} 100%{transform:translate(8%,6%) scale(1.08)} }
@keyframes bgd2 { 0%{transform:translate(0,0) scale(1)} 100%{transform:translate(-7%,-5%) scale(0.93)} }
@keyframes bgd3 { 0%{transform:translate(0,0) scale(1)} 50%{transform:translate(5%,4%) scale(1.04)} 100%{transform:translate(-4%,3%) scale(0.97)} }
@keyframes float-p { 0%{transform:translateY(0) scale(1);opacity:.6} 50%{transform:translateY(-12px) scale(1.1);opacity:1} 100%{transform:translateY(0) scale(1);opacity:.6} }
.sec-eyebrow { font-size:10px; letter-spacing:.25em; text-transform:uppercase; font-weight:700; color:var(--tx3); margin-bottom:1rem; display:block; }
.sec-h2 { font-family:var(--font-cormorant),Georgia,serif; font-size:clamp(2.2rem,4vw,3.5rem); font-weight:600; line-height:1.1; letter-spacing:-0.02em; color:var(--tx); }
.sec-h2 em { font-style:italic; color:var(--acc); }
.lp-progress { position:fixed; right:0; top:0; width:3px; height:100vh; background:var(--grad); z-index:200; transform-origin:top; }
.lp-nav { position:fixed; top:0; left:0; right:0; z-index:90; display:flex; align-items:center; justify-content:space-between; padding:1.2rem clamp(1.5rem,6vw,5rem); background:rgba(11,11,15,.88); backdrop-filter:blur(20px); border-bottom:1px solid var(--bd); }
.lp-nav-logo { font-family:var(--font-cormorant),Georgia,serif; font-size:1.3rem; font-weight:600; font-style:italic; color:var(--tx); display:flex; align-items:center; gap:.3rem; }
.lp-nav-logo em { color:var(--acc); font-style:normal; }
.lp-nav-heart { color:var(--acc); animation:hb 1.8s ease-in-out infinite; display:inline-block; }
.lp-nav-links { display:flex; align-items:center; gap:2rem; }
.lp-nav-link { font-size:10px; letter-spacing:.2em; text-transform:uppercase; font-weight:700; color:var(--tx2); transition:color .2s; }
.lp-nav-link:hover { color:var(--tx); }
.lp-nav-cta { font-size:10px; letter-spacing:.2em; text-transform:uppercase; font-weight:800; padding:.6rem 1.4rem; background:var(--grad); color:#fff; transition:opacity .2s,transform .2s,box-shadow .2s; }
.lp-nav-cta:hover { opacity:.88; transform:translateY(-1px); box-shadow:0 4px 16px rgba(217,70,239,.4); }
.hero { position:relative; min-height:100vh; display:flex; align-items:center; padding:7rem clamp(1.5rem,6vw,5rem) 5rem; overflow:hidden; }
.hero-grid { position:absolute; inset:0; background-image:linear-gradient(rgba(217,70,239,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(217,70,239,.04) 1px,transparent 1px); background-size:60px 60px; mask-image:radial-gradient(ellipse 80% 80% at 50% 50%,black 30%,transparent 100%); pointer-events:none; }
.cursor-glow { position:fixed; top:0; left:0; width:400px; height:400px; border-radius:50%; background:radial-gradient(circle,rgba(217,70,239,.13) 0%,transparent 70%); pointer-events:none; z-index:1; will-change:transform; }
.hero-inner { display:grid; grid-template-columns:1fr 1fr; align-items:center; gap:4rem; width:100%; max-width:1200px; margin:0 auto; position:relative; z-index:2; }
.hero-content { display:flex; flex-direction:column; gap:1.75rem; }
.hero-badge { display:inline-flex; align-items:center; gap:.6rem; font-size:10px; letter-spacing:.2em; text-transform:uppercase; font-weight:700; color:var(--tx2); border:1px solid var(--bd2); padding:.4rem 1rem; width:fit-content; }
.hero-badge-dot { width:6px; height:6px; border-radius:50%; background:var(--acc); animation:pulse-dot 2s ease-in-out infinite; }
.hero-title { font-family:var(--font-cormorant),Georgia,serif; font-size:clamp(2.8rem,5.5vw,5rem); font-weight:600; line-height:1.05; letter-spacing:-0.02em; color:var(--tx); }
.hero-title em { font-style:italic; color:var(--acc); }
.hero-title-sub { font-size:clamp(1.3rem,2.3vw,2rem); font-weight:300; color:var(--tx2); font-style:normal; display:block; margin-top:.25em; font-family:var(--font-cormorant),Georgia,serif; }
.hero-sub { font-size:1rem; line-height:1.8; color:var(--tx2); font-weight:300; max-width:420px; }
.hero-ctas { display:flex; align-items:center; gap:1.25rem; flex-wrap:wrap; }
.hero-cta-primary { display:inline-block; padding:1rem 2rem; background:var(--grad); color:#fff; font-size:11px; letter-spacing:.22em; text-transform:uppercase; font-weight:800; transition:opacity .2s,transform .2s,box-shadow .2s; position:relative; overflow:hidden; }
.hero-cta-primary::after { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(255,255,255,.15) 0%,transparent 60%); }
.hero-cta-primary:hover { opacity:.88; transform:translateY(-2px); box-shadow:0 10px 32px rgba(217,70,239,.45); }
.hero-cta-secondary { font-size:10px; letter-spacing:.2em; text-transform:uppercase; font-weight:700; color:var(--tx3); transition:color .2s; }
.hero-cta-secondary:hover { color:var(--tx); }
.hero-social { display:flex; align-items:center; gap:1rem; }
.hero-avatars { display:flex; }
.hero-avatar-pill { width:32px; height:32px; border-radius:50%; background:var(--grad); display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; color:#fff; border:2px solid var(--bg); }
.hero-social-text { font-size:12px; color:var(--tx3); font-weight:300; }
.hero-social-text strong { color:var(--tx); font-weight:700; }
.hero-visual { position:relative; display:flex; justify-content:center; }
.hero-scroll-hint { position:absolute; bottom:2.5rem; left:50%; transform:translateX(-50%); display:flex; flex-direction:column; align-items:center; gap:.5rem; z-index:2; }
.hero-scroll-line { width:1px; height:36px; background:linear-gradient(to bottom,transparent,var(--acc)); }
.hero-scroll-hint span { font-size:9px; letter-spacing:.2em; text-transform:uppercase; color:var(--tx3); font-weight:600; }
.phone { width:280px; height:560px; background:#12111A; border-radius:40px; border:2px solid rgba(255,255,255,.1); box-shadow:0 0 0 8px rgba(255,255,255,.03),0 40px 80px rgba(0,0,0,.6),0 0 60px rgba(217,70,239,.12); position:relative; overflow:hidden; display:flex; flex-direction:column; }
.phone-notch { position:absolute; top:12px; left:50%; transform:translateX(-50%); width:80px; height:6px; background:rgba(0,0,0,.5); border-radius:99px; z-index:2; }
.phone-screen { display:flex; flex-direction:column; height:100%; padding-top:28px; }
.phone-header { display:flex; align-items:center; gap:.6rem; padding:.85rem 1rem; border-bottom:1px solid rgba(255,255,255,.06); }
.phone-avatar { width:32px; height:32px; border-radius:50%; background:var(--grad); flex-shrink:0; }
.phone-name { font-size:13px; font-weight:700; color:var(--tx); }
.phone-status { display:flex; align-items:center; gap:.3rem; font-size:10px; color:var(--tx3); }
.phone-dot { width:6px; height:6px; border-radius:50%; background:#22c55e; flex-shrink:0; }
.phone-msgs { flex:1; overflow:hidden; padding:1rem; display:flex; flex-direction:column; gap:.5rem; justify-content:flex-end; }
.msg { padding:.55rem .85rem; border-radius:16px; font-size:12px; line-height:1.5; max-width:80%; word-break:break-word; }
.msg--them { background:rgba(255,255,255,.08); color:var(--tx2); border-bottom-left-radius:4px; align-self:flex-start; }
.msg--me { background:var(--grad); color:#fff; border-bottom-right-radius:4px; align-self:flex-end; }
.msg--typing { background:rgba(255,255,255,.08); align-self:flex-start; display:flex; gap:4px; padding:.7rem 1rem; border-radius:16px; border-bottom-left-radius:4px; }
.msg--typing span { width:6px; height:6px; border-radius:50%; background:rgba(255,255,255,.4); animation:typing-dot 1.2s ease-in-out infinite; }
.msg--typing span:nth-child(2) { animation-delay:.2s; }
.msg--typing span:nth-child(3) { animation-delay:.4s; }
.phone-ia-badge { padding:.5rem 1rem; font-size:9.5px; letter-spacing:.15em; text-transform:uppercase; font-weight:700; color:var(--acc); text-align:center; border-top:1px solid rgba(255,255,255,.05); display:flex; align-items:center; justify-content:center; gap:.4rem; }
.freactions { position:absolute; bottom:0; left:0; right:0; height:200px; pointer-events:none; overflow:hidden; }
.freaction { position:absolute; bottom:0; }
.ct-s { position:relative; padding:9rem clamp(1.5rem,6vw,5rem); display:flex; justify-content:center; overflow:hidden; }
.ct-glow { position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); width:700px; height:350px; background:radial-gradient(ellipse,rgba(217,70,239,.07) 0%,transparent 70%); pointer-events:none; }
.ct-inner { text-align:center; position:relative; z-index:1; }
.ct-line { font-family:var(--font-cormorant),Georgia,serif; font-size:clamp(2.5rem,6vw,5.5rem); font-weight:600; font-style:italic; line-height:1.1; letter-spacing:-0.02em; color:var(--tx); display:block; }
.ct-sub { font-size:1rem; color:var(--tx3); font-weight:300; margin-top:1rem; letter-spacing:.04em; }
.match-s { position:relative; padding:6rem clamp(1.5rem,6vw,5rem); display:flex; flex-direction:column; align-items:center; justify-content:center; overflow:hidden; min-height:75vh; }
.match-bg-heart { position:absolute; font-size:clamp(300px,42vw,520px); line-height:1; pointer-events:none; user-select:none; filter:blur(1px); }
.match-card { position:relative; z-index:2; background:rgba(217,70,239,.06); border:1px solid rgba(217,70,239,.22); padding:2.5rem 3rem; text-align:center; max-width:380px; width:100%; backdrop-filter:blur(20px); box-shadow:0 20px 60px rgba(217,70,239,.1),inset 0 1px 0 rgba(255,255,255,.06); }
.match-icon { font-size:3rem; margin-bottom:1rem; display:block; }
.match-label { font-size:9px; letter-spacing:.3em; text-transform:uppercase; font-weight:800; color:var(--acc); margin-bottom:.75rem; }
.match-names { font-family:var(--font-cormorant),Georgia,serif; font-size:1.8rem; font-weight:600; color:var(--tx); margin-bottom:.5rem; }
.match-names strong { color:var(--acc); }
.match-sub { font-size:.85rem; color:var(--tx3); margin-bottom:1.5rem; font-weight:300; }
.match-cta { display:inline-block; padding:.7rem 1.5rem; background:var(--grad); color:#fff; font-size:9.5px; letter-spacing:.2em; text-transform:uppercase; font-weight:800; }
.match-heart { position:absolute; font-size:1.5rem; pointer-events:none; }
.notif-s { padding:5rem clamp(1.5rem,6vw,5rem); max-width:700px; margin:0 auto; }
.notif-eyebrow { text-align:center; font-size:10px; letter-spacing:.25em; text-transform:uppercase; color:var(--tx3); font-weight:600; margin-bottom:3rem; display:block; }
.notif-list { display:flex; flex-direction:column; gap:1rem; }
.notif-card { display:flex; align-items:center; gap:1rem; padding:1rem 1.25rem; background:rgba(255,255,255,.03); border:1px solid var(--bd); backdrop-filter:blur(10px); max-width:440px; transition:border-color .2s,background .2s; cursor:default; }
.notif-card:hover { border-color:rgba(217,70,239,.3); background:rgba(217,70,239,.04); }
.notif-card--left { align-self:flex-start; }
.notif-card--right { align-self:flex-end; }
.notif-icon { font-size:1.5rem; flex-shrink:0; }
.notif-body { flex:1; }
.notif-text { font-size:13px; font-weight:600; color:var(--tx); margin-bottom:.2rem; }
.notif-sub { font-size:11px; color:var(--tx3); font-weight:300; }
.notif-dot { width:8px; height:8px; border-radius:50%; background:var(--acc); flex-shrink:0; }
.marquee { overflow:hidden; border-top:1px solid var(--bd); border-bottom:1px solid var(--bd); padding:1rem 0; }
.marquee-track { display:flex; gap:0; white-space:nowrap; }
.marquee-item { display:inline-block; padding:.25rem 2.5rem; font-size:10px; letter-spacing:.2em; text-transform:uppercase; font-weight:700; color:var(--tx3); }
.plat-s { padding:3rem clamp(1.5rem,6vw,5rem); text-align:center; }
.plat-label { font-size:10px; letter-spacing:.2em; text-transform:uppercase; color:var(--tx3); font-weight:600; margin-bottom:1.75rem; display:block; }
.plat-list { display:flex; flex-wrap:wrap; gap:.75rem; justify-content:center; }
.plat-item { padding:.5rem 1.25rem; border:1px solid var(--bd); font-size:10.5px; letter-spacing:.16em; text-transform:uppercase; font-weight:700; color:var(--tx3); transition:border-color .2s,color .2s; }
.plat-item:hover { border-color:rgba(217,70,239,.3); color:var(--tx); }
.chatrev-s { padding:7rem clamp(1.5rem,6vw,5rem); background:rgba(255,255,255,.01); border-top:1px solid var(--bd); border-bottom:1px solid var(--bd); }
.chatrev-inner { max-width:1000px; margin:0 auto; display:grid; grid-template-columns:1fr 1fr; gap:5rem; align-items:center; }
.chatrev-msgs { display:flex; flex-direction:column; gap:.75rem; margin-top:1.5rem; }
.chatrev-msg { position:relative; padding:.75rem 1rem; border-radius:16px; font-size:14px; line-height:1.5; max-width:88%; }
.chatrev-msg--them { background:rgba(255,255,255,.07); color:var(--tx2); border-bottom-left-radius:4px; align-self:flex-start; }
.chatrev-msg--me { background:linear-gradient(135deg,rgba(217,70,239,.22),rgba(255,77,109,.22)); border:1px solid rgba(217,70,239,.3); color:var(--tx); border-bottom-right-radius:4px; align-self:flex-end; }
.chatrev-ia-tag { display:block; font-size:8px; letter-spacing:.2em; text-transform:uppercase; color:var(--acc); font-weight:700; margin-top:.4rem; opacity:.8; }
.chatrev-title { font-family:var(--font-cormorant),Georgia,serif; font-size:clamp(2.5rem,4vw,3.5rem); font-weight:600; line-height:1.1; letter-spacing:-0.02em; color:var(--tx); margin-bottom:1.25rem; }
.chatrev-title em { font-style:italic; color:var(--acc); }
.chatrev-desc { font-size:1rem; line-height:1.8; color:var(--tx2); font-weight:300; margin-bottom:2rem; }
.chatrev-stats { display:flex; gap:2.5rem; }
.chatrev-stat { display:flex; flex-direction:column; gap:.25rem; }
.chatrev-stat-n { font-family:var(--font-cormorant),Georgia,serif; font-size:2.5rem; font-weight:600; color:var(--acc); line-height:1; }
.chatrev-stat-l { font-size:11px; color:var(--tx3); font-weight:300; max-width:100px; line-height:1.4; }
.how-s { padding:7rem clamp(1.5rem,6vw,5rem); max-width:780px; margin:0 auto; }
.how-head { margin-bottom:4rem; }
.how-steps { display:flex; flex-direction:column; }
.how-step { display:grid; grid-template-columns:80px 1fr; gap:2rem; position:relative; padding-bottom:3rem; }
.how-step:last-child { padding-bottom:0; }
.how-num { font-family:var(--font-cormorant),Georgia,serif; font-size:5rem; font-weight:700; color:transparent; -webkit-text-stroke:1px rgba(217,70,239,.3); line-height:1; letter-spacing:-0.05em; }
.how-content { padding-top:.5rem; }
.how-title { font-size:1.15rem; font-weight:700; color:var(--tx); margin-bottom:.5rem; }
.how-desc { font-size:.9rem; line-height:1.8; color:var(--tx2); font-weight:300; }
.how-connector { position:absolute; left:40px; top:80px; bottom:0; width:1px; background:linear-gradient(to bottom,rgba(217,70,239,.3),transparent); }
.feat-s { padding:7rem clamp(1.5rem,6vw,5rem); max-width:1100px; margin:0 auto; }
.feat-head { margin-bottom:4rem; }
.feat-bento { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; }
.feat-card { position:relative; padding:2rem; background:rgba(255,255,255,.02); border:1px solid var(--bd); overflow:hidden; transition:border-color .2s,transform .2s; }
.feat-card--big { grid-column:span 2; }
.feat-icon { font-size:2rem; margin-bottom:1rem; }
.feat-title { font-size:1rem; font-weight:700; color:var(--tx); margin-bottom:.5rem; }
.feat-desc { font-size:.875rem; line-height:1.7; color:var(--tx2); font-weight:300; }
.feat-glow { position:absolute; inset:0; background:radial-gradient(circle at 100% 0%,rgba(217,70,239,.1) 0%,transparent 55%); pointer-events:none; opacity:0; transition:opacity .3s; }
.feat-card:hover .feat-glow { opacity:1; }
.stories-s { padding:7rem clamp(1.5rem,6vw,5rem); max-width:1000px; margin:0 auto; }
.stories-head { margin-bottom:4rem; }
.stories-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1.5rem; }
.story-card { position:relative; padding:2rem; background:rgba(255,255,255,.02); border:1px solid var(--bd); overflow:hidden; transition:border-color .2s; cursor:default; }
.story-card:hover { border-color:rgba(217,70,239,.2); }
.story-emoji { font-size:2.5rem; margin-bottom:1rem; display:block; }
.story-text { font-size:.9rem; line-height:1.8; color:var(--tx2); font-weight:300; font-style:italic; margin-bottom:1.5rem; }
.story-author { display:flex; align-items:center; gap:.75rem; }
.story-avatar { width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; color:#fff; flex-shrink:0; }
.story-name { font-size:13px; font-weight:700; color:var(--tx); }
.story-city { font-size:11px; color:var(--tx3); }
.story-glow { position:absolute; bottom:-40px; right:-40px; width:130px; height:130px; border-radius:50%; filter:blur(45px); opacity:.1; pointer-events:none; transition:opacity .3s; }
.story-card:hover .story-glow { opacity:.22; }
.test-s { padding:7rem clamp(1.5rem,6vw,5rem); max-width:1000px; margin:0 auto; }
.test-head { margin-bottom:4rem; }
.test-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1.5rem; }
.test-card { padding:2rem; background:rgba(255,255,255,.02); border:1px solid var(--bd); transition:border-color .2s; cursor:default; }
.test-card:hover { border-color:rgba(217,70,239,.22); }
.test-stars { color:var(--acc); letter-spacing:.1em; margin-bottom:1rem; font-size:.9rem; }
.test-text { font-size:.9rem; line-height:1.8; color:var(--tx2); font-style:italic; font-weight:300; margin-bottom:1.5rem; }
.test-author { display:flex; align-items:center; gap:.75rem; }
.test-avatar { width:36px; height:36px; border-radius:50%; background:var(--grad); display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; color:#fff; flex-shrink:0; }
.test-name { font-size:13px; font-weight:700; color:var(--tx); }
.test-role { font-size:11px; color:var(--tx3); }
.quote-s { padding:8rem clamp(1.5rem,6vw,5rem); display:flex; justify-content:center; position:relative; overflow:hidden; }
.quote-glow { position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); width:900px; height:450px; background:radial-gradient(ellipse,rgba(217,70,239,.05) 0%,transparent 70%); pointer-events:none; }
.quote-inner { text-align:center; position:relative; z-index:1; max-width:700px; }
.quote-mark { font-family:var(--font-cormorant),Georgia,serif; font-size:8rem; line-height:.6; color:var(--acc); opacity:.25; margin-bottom:1rem; }
.quote-text { font-family:var(--font-cormorant),Georgia,serif; font-size:clamp(1.8rem,3.5vw,3rem); font-weight:400; font-style:italic; line-height:1.4; color:var(--tx); letter-spacing:-0.01em; }
.quote-source { margin-top:2rem; font-size:10px; letter-spacing:.25em; text-transform:uppercase; color:var(--tx3); font-weight:700; }
.price-s { padding:7rem clamp(1.5rem,6vw,5rem); max-width:1300px; margin:0 auto; }
.price-head { margin-bottom:4rem; }
.price-grid--4 { display:grid; grid-template-columns:repeat(4,1fr); gap:1.25rem; align-items:start; }
.price-card { position:relative; padding:2rem 1.5rem; background:rgba(255,255,255,.02); border:1px solid var(--bd); transition:border-color .2s,box-shadow .2s; }
.price-card--free { background:rgba(255,255,255,.01); }
.price-card--accent { background:rgba(217,70,239,.06); border-color:rgba(217,70,239,.3); box-shadow:0 0 40px rgba(217,70,239,.08); }
.price-card--annual { background:rgba(111,29,255,.05); border-color:rgba(111,29,255,.35); box-shadow:0 0 40px rgba(111,29,255,.07); }
.price-card--lifetime { background:linear-gradient(160deg,rgba(255,77,109,.09),rgba(217,70,239,.06)); border:1px solid rgba(255,77,109,.5); box-shadow:0 0 70px rgba(255,77,109,.18),0 0 140px rgba(217,70,239,.08); }
.price-badge { position:absolute; top:-1px; left:50%; transform:translateX(-50%); font-size:9px; letter-spacing:.18em; text-transform:uppercase; font-weight:800; padding:.3rem 1rem; white-space:nowrap; color:#fff; }
.price-badge--accent { background:var(--grad); }
.price-badge--annual { background:linear-gradient(135deg,#6F1DFF,#D946EF); }
.price-badge--lifetime { background:linear-gradient(135deg,#FF4D6D,#D946EF); }
.price-name { font-size:10px; letter-spacing:.2em; text-transform:uppercase; font-weight:700; color:var(--tx3); margin-bottom:.6rem; }
.price-card--lifetime .price-name { color:rgba(255,77,109,.7); letter-spacing:.25em; }
.price-original { font-size:11px; color:var(--tx3); font-weight:400; margin-bottom:.3rem; font-family:'Cabinet Grotesk',sans-serif; }
.price-original s { color:rgba(242,237,232,.35); text-decoration-color:rgba(255,77,109,.6); font-weight:500; }
.price-amount { font-family:var(--font-cormorant),Georgia,serif; font-size:2.2rem; font-weight:600; color:var(--tx); line-height:1; margin-bottom:.25rem; }
.price-card--lifetime .price-amount { font-size:2.6rem; background:linear-gradient(135deg,#FF4D6D,#D946EF); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
.price-per { font-size:.8rem; color:var(--tx3); font-family:'Cabinet Grotesk',sans-serif; font-weight:300; -webkit-text-fill-color:var(--tx3); }
.price-list { list-style:none; display:flex; flex-direction:column; gap:.6rem; margin:1.5rem 0; padding:0; }
.price-list li { font-size:.82rem; color:var(--tx2); display:flex; align-items:center; gap:.5rem; font-weight:300; }
.price-list li span { color:var(--acc); font-weight:700; }
.price-card--lifetime .price-list li span { color:#FF4D6D; }
.price-btn { display:block; width:100%; padding:.85rem; text-align:center; font-size:9px; letter-spacing:.18em; text-transform:uppercase; font-weight:800; border:1px solid var(--bd2); color:var(--tx2); transition:border-color .2s,color .2s,background .2s,box-shadow .2s; font-family:'Cabinet Grotesk',sans-serif; }
.price-btn--free:hover { border-color:rgba(217,70,239,.4); color:var(--tx); background:rgba(217,70,239,.04); }
.price-btn--accent { background:var(--grad); color:#fff; border-color:transparent; }
.price-btn--accent:hover { opacity:.88; box-shadow:0 6px 20px rgba(217,70,239,.4); }
.price-btn--annual { background:linear-gradient(135deg,#6F1DFF,#D946EF); color:#fff; border-color:transparent; }
.price-btn--annual:hover { opacity:.88; box-shadow:0 6px 20px rgba(111,29,255,.4); }
.price-btn--lifetime { background:linear-gradient(135deg,#FF4D6D,#D946EF); color:#fff; border-color:transparent; padding:.9rem; }
.price-btn--lifetime:hover { opacity:.9; box-shadow:0 8px 28px rgba(255,77,109,.45); }
.faq-s { padding:7rem clamp(1.5rem,6vw,5rem); max-width:700px; margin:0 auto; }
.faq-head { margin-bottom:3rem; }
.faq-list { display:flex; flex-direction:column; }
.faq-item { border-bottom:1px solid var(--bd); }
.faq-q { width:100%; display:flex; align-items:center; justify-content:space-between; padding:1.25rem 0; font-size:.95rem; font-weight:600; color:var(--tx); background:none; border:none; cursor:pointer; text-align:left; gap:1rem; transition:color .2s; font-family:'Cabinet Grotesk',sans-serif; }
.faq-q:hover { color:var(--acc); }
.faq-icon { font-size:1.5rem; color:var(--tx3); flex-shrink:0; font-weight:300; display:inline-block; }
.faq-a { overflow:hidden; }
.faq-a p { padding:0 0 1.25rem; font-size:.9rem; line-height:1.8; color:var(--tx2); font-weight:300; }
.cta-s { position:relative; padding:10rem clamp(1.5rem,6vw,5rem); display:flex; flex-direction:column; align-items:center; overflow:hidden; background:radial-gradient(ellipse 80% 60% at 50% 100%,rgba(217,70,239,.08) 0%,transparent 70%); }
.cta-inner { text-align:center; position:relative; z-index:1; max-width:600px; }
.cta-title { font-family:var(--font-cormorant),Georgia,serif; font-size:clamp(2.5rem,6vw,5rem); font-weight:600; line-height:1.1; letter-spacing:-0.02em; color:var(--tx); margin-bottom:1.5rem; }
.cta-title em { font-style:italic; color:var(--acc); }
.cta-sub { font-size:1rem; line-height:1.8; color:var(--tx2); font-weight:300; margin-bottom:2.5rem; }
.cta-btn { display:inline-block; padding:1.1rem 2.5rem; background:var(--grad); color:#fff; font-size:11px; letter-spacing:.22em; text-transform:uppercase; font-weight:800; transition:opacity .2s,transform .2s,box-shadow .2s; position:relative; overflow:hidden; margin-bottom:1rem; }
.cta-btn::after { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(255,255,255,.15) 0%,transparent 60%); }
.cta-btn:hover { opacity:.88; transform:translateY(-2px); box-shadow:0 12px 36px rgba(217,70,239,.5); }
.cta-note { font-size:10px; letter-spacing:.15em; color:var(--tx3); text-transform:uppercase; font-weight:600; }
.lp-footer { padding:3rem clamp(1.5rem,6vw,5rem); border-top:1px solid var(--bd); display:flex; flex-direction:column; align-items:center; gap:1.5rem; text-align:center; }
.footer-logo { font-family:var(--font-cormorant),Georgia,serif; font-size:1.2rem; font-weight:600; font-style:italic; color:var(--tx2); display:flex; align-items:center; gap:.3rem; }
.footer-logo em { color:var(--acc); font-style:normal; }
.footer-logo span { color:var(--acc); }
.footer-links { display:flex; gap:2rem; }
.footer-link { font-size:10px; letter-spacing:.2em; text-transform:uppercase; font-weight:600; color:var(--tx3); transition:color .2s; }
.footer-link:hover { color:var(--tx); }
.footer-copy { font-size:11px; color:var(--tx3); font-weight:300; }
.cp-scene { position:fixed; inset:0; z-index:0; pointer-events:none; overflow:hidden; }
.cp-photo { position:absolute; inset:0; overflow:hidden; }
.cp-photo-img { position:absolute; inset:-4%; width:108%; height:108%; object-fit:cover; object-position:center 22%; will-change:transform; transform-origin:center center; }
.cp-grade { position:absolute; inset:0; background:linear-gradient(135deg,rgba(217,70,239,.22) 0%,rgba(111,29,255,.14) 48%,rgba(255,77,109,.18) 100%); mix-blend-mode:color; pointer-events:none; }
.cp-vignette { position:absolute; inset:0; pointer-events:none;
  background:
    radial-gradient(ellipse 72% 88% at 50% 48%,transparent 35%,rgba(11,11,15,.38) 65%,rgba(11,11,15,.82) 100%),
    linear-gradient(to bottom,rgba(11,11,15,.68) 0%,rgba(11,11,15,.06) 20%,rgba(11,11,15,.06) 58%,rgba(11,11,15,.96) 84%,#0B0B0F 100%); }
.cp-bk { position:absolute; border-radius:50%; animation:bk-float linear infinite; }
@keyframes bk-float { 0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-10px) scale(1.04)} }
@keyframes hb { 0%,100%{transform:scale(1)}14%{transform:scale(1.3)}28%{transform:scale(1)}42%{transform:scale(1.15)}70%{transform:scale(1)} }
@keyframes typing-dot { 0%,80%,100%{opacity:.3;transform:scale(1)}40%{opacity:1;transform:scale(1.2)} }
@keyframes pulse-dot { 0%,100%{opacity:1}50%{opacity:.35} }
@media (max-width:1024px) { .feat-bento { grid-template-columns:repeat(2,1fr); } .feat-card--big { grid-column:span 1; } .price-grid--4 { grid-template-columns:repeat(2,1fr); } }
@media (max-width:768px) {
  .hero-inner { grid-template-columns:1fr; }
  .hero-visual { order:-1; }
  .phone { width:220px; height:440px; }
  .chatrev-inner { grid-template-columns:1fr; gap:3rem; }
  .chatrev-left { order:1; }
  .chatrev-right { order:0; }
  .stories-grid,.test-grid { grid-template-columns:1fr; }
  .price-grid--4 { grid-template-columns:1fr; }
  .feat-bento { grid-template-columns:1fr; }
  .lp-nav-links .lp-nav-cta { display:none; }
  .ct-line { font-size:clamp(2rem,8vw,3.5rem); }
  .how-step { grid-template-columns:60px 1fr; gap:1.5rem; }
  .how-num { font-size:3.5rem; }
  .notif-s { max-width:100%; }
  .hero-ctas { flex-direction:column; align-items:flex-start; }
  .notif-card { max-width:100%; }
  .notif-card--right { align-self:flex-start; }
}
@media (max-width:480px) {
  .phone { width:200px; height:400px; }
  .lp-nav-links { gap:1rem; }
  .match-card { padding:2rem 1.5rem; }
  .chatrev-stats { gap:1.5rem; }
}
`;
