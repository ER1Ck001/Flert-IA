"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type Stage = "hook" | "react_hook" | "demo_1" | "demo_2" | "video" | "pricing";

interface ChatMessage {
  id: string;
  from: "ai" | "user";
  text?: string;
  rich?: React.ReactNode;
}

interface Option {
  label: string;
  value: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const ease = [0.16, 1, 0.3, 1];
let _id = 0;
const uid = () => `m${++_id}`;

// ─────────────────────────────────────────────────────────────────────────────
// AVATAR — tenta carregar /images/flertia-avatar.png, fallback CSS
// Salve sua foto de perfil em: public/images/flertia-avatar.png
// ─────────────────────────────────────────────────────────────────────────────

function FlertAvatar({ pulse = false, size = "sm" }: { pulse?: boolean; size?: "sm" | "lg" }) {
  const [imgError, setImgError] = useState(false);
  const dim = size === "lg" ? "w-11 h-11" : "w-8 h-8";

  return (
    <div
      className={`chat-avatar relative shrink-0 ${dim} overflow-hidden shadow-lg shadow-[#8B0A2A]/45 ring-1 ring-[#8B0A2A]/30`}
    >
      {!imgError ? (
        <img
          src="/couple/perfil.jpeg"
          alt="Flert.IA"
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-[#8B0A2A] to-[#3D050F] flex items-center justify-center">
          <span className={`select-none leading-none ${size === "lg" ? "text-xl" : "text-[13px]"}`}>♥</span>
        </div>
      )}
      {pulse && (
        <motion.span
          className="chat-avatar absolute inset-0 bg-[#8B0A2A] pointer-events-none"
          animate={{ scale: [1, 1.8], opacity: [0.3, 0] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPING DOTS
// ─────────────────────────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex gap-[5px] items-center py-0.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="chat-avatar block w-[7px] h-[7px] bg-[#C9A84C]/80"
          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHAT BUBBLES
// ─────────────────────────────────────────────────────────────────────────────

function AiBubble({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.38, ease }}
      className="flex items-end gap-2.5 max-w-[90%]"
    >
      <FlertAvatar />
      <div className="chat-bubble-ai bg-[#13090C]/85 border border-[#8B0A2A]/20 px-4 py-3 shadow-md shadow-[#8B0A2A]/8 backdrop-blur-sm">
        <p className="text-[15px] text-[#F2EDE8] leading-[1.6]">{text}</p>
      </div>
    </motion.div>
  );
}

function RichMessage({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease }}
      className="flex items-start gap-2.5"
    >
      <FlertAvatar />
      <div className="flex-1 min-w-0 max-w-[calc(100%-44px)]">{children}</div>
    </motion.div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, x: 12 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ duration: 0.3, ease }}
      className="flex justify-end"
    >
      <div className="chat-bubble-user max-w-[72%] px-4 py-3 bg-[#8B0A2A]/22 border border-[#8B0A2A]/32 shadow-sm">
        <p className="text-[15px] text-[#F2EDE8] leading-[1.6]">{text}</p>
      </div>
    </motion.div>
  );
}

function AiTypingRow() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4, transition: { duration: 0.15 } }}
      className="flex items-end gap-2.5"
    >
      <FlertAvatar pulse />
      <div className="chat-bubble-ai bg-[#13090C]/85 border border-[#8B0A2A]/20 px-4 py-3 backdrop-blur-sm">
        <TypingDots />
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OPTION BUTTONS
// ─────────────────────────────────────────────────────────────────────────────

function OptionButtons({
  options,
  onSelect,
  disabled,
}: {
  options: Option[];
  onSelect: (opt: Option) => void;
  disabled: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -4, transition: { duration: 0.15 } }}
      transition={{ duration: 0.3, ease }}
      className="flex flex-wrap gap-2 pl-[42px]"
    >
      {options.map((opt, i) => (
        <motion.button
          key={opt.value + i}
          initial={{ opacity: 0, scale: 0.85, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: i * 0.09, duration: 0.25 }}
          whileHover={disabled ? {} : { scale: 1.04, borderColor: "rgba(139,10,42,0.55)" }}
          whileTap={disabled ? {} : { scale: 0.96 }}
          onClick={() => !disabled && onSelect(opt)}
          disabled={disabled}
          className="chat-tag px-5 py-2.5 text-[14px] font-semibold text-[#F2EDE8] border border-[#8B0A2A]/38 bg-[#8B0A2A]/7 hover:bg-[#8B0A2A]/18 transition-all backdrop-blur-sm disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {opt.label}
        </motion.button>
      ))}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DEMO CARD 1 — "oi td bem" vs abertura com gancho
// ─────────────────────────────────────────────────────────────────────────────

function DemoCard1() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const ts = [
      setTimeout(() => setStep(1), 500),
      setTimeout(() => setStep(2), 1700),
      setTimeout(() => setStep(3), 2900),
      setTimeout(() => setStep(4), 4200),
    ];
    return () => ts.forEach(clearTimeout);
  }, []);

  return (
    <div className="chat-card bg-[#110A0C]/75 border border-[#8B0A2A]/14 p-4 space-y-3.5 w-full backdrop-blur-sm">
      <AnimatePresence>
        {step >= 1 && (
          <motion.div key="b1" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5">
            <p className="text-[10px] text-[#9E8E7E]/50 tracking-[0.16em] uppercase font-medium">O que a maioria manda</p>
            <div className="chat-bubble-user inline-block bg-white/5 border border-white/7 px-3 py-2">
              <p className="text-sm text-[#F2EDE8]/45">oi td bem</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {step >= 2 && (
          <motion.div key="b2" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
            <div className="chat-tag bg-red-950/35 border border-red-900/25 px-3 py-2">
              <p className="text-[11px] text-red-400/75 font-medium">❌ Essa conversa vai morrer em menos de 3 mensagens</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {step >= 3 && (
          <motion.div key="b3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
            <div className="h-px flex-1 bg-[#C9A84C]/12" />
            <span className="text-[10px] text-[#C9A84C]/65 tracking-[0.14em] uppercase font-bold shrink-0">Com Flert.IA</span>
            <div className="h-px flex-1 bg-[#C9A84C]/12" />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {step >= 4 && (
          <motion.div key="b4" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5">
            <div className="chat-bubble-user inline-block bg-gradient-to-br from-[#8B0A2A]/42 to-[#6d0820]/30 border border-[#8B0A2A]/38 px-3 py-2.5 shadow-md shadow-[#8B0A2A]/12">
              <p className="text-sm text-[#F2EDE8] leading-snug">
                oi! me conta uma coisa — você é realmente assim ou só parece perigosa por foto? 👀
              </p>
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="chat-tag bg-green-950/30 border border-green-900/22 px-3 py-1.5 inline-block"
            >
              <p className="text-[11px] text-green-400/75 font-medium">✓ Ela respondeu: "hahaha que isso 😳" — conversa aberta</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DEMO CARD 2 — pergunta sobre viagem respondida com profundidade
// ─────────────────────────────────────────────────────────────────────────────

function DemoCard2() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const ts = [
      setTimeout(() => setStep(1), 500),
      setTimeout(() => setStep(2), 1900),
      setTimeout(() => setStep(3), 3100),
      setTimeout(() => setStep(4), 4400),
    ];
    return () => ts.forEach(clearTimeout);
  }, []);

  return (
    <div className="chat-card bg-[#110A0C]/75 border border-[#8B0A2A]/14 p-4 space-y-3.5 w-full backdrop-blur-sm">
      <AnimatePresence>
        {step >= 1 && (
          <motion.div key="c1" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5">
            <p className="text-[10px] text-[#9E8E7E]/50 tracking-[0.16em] uppercase font-medium">Ela perguntou</p>
            <div className="chat-bubble-ai inline-block bg-white/5 border border-white/7 px-3 py-2">
              <p className="text-sm text-[#F2EDE8]/60">adoro viajar, você viaja muito?</p>
            </div>
            <div className="chat-bubble-user inline-block bg-white/4 border border-white/6 px-3 py-2">
              <p className="text-sm text-[#F2EDE8]/38">sim adoro também 😊</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {step >= 2 && (
          <motion.div key="c2" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
            <div className="chat-tag bg-red-950/35 border border-red-900/25 px-3 py-2">
              <p className="text-[11px] text-red-400/75 font-medium">❌ Sem personalidade. Ela vai perder o interesse.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {step >= 3 && (
          <motion.div key="c3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
            <div className="h-px flex-1 bg-[#C9A84C]/12" />
            <span className="text-[10px] text-[#C9A84C]/65 tracking-[0.14em] uppercase font-bold shrink-0">Com Flert.IA</span>
            <div className="h-px flex-1 bg-[#C9A84C]/12" />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {step >= 4 && (
          <motion.div key="c4" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5">
            <div className="chat-bubble-user inline-block bg-gradient-to-br from-[#8B0A2A]/42 to-[#6d0820]/30 border border-[#8B0A2A]/38 px-3 py-2.5 shadow-md shadow-[#8B0A2A]/12">
              <p className="text-sm text-[#F2EDE8] leading-snug">
                depende do destino… mas a melhor viagem que já fiz foi uma que eu não planejei. tem algum lugar que te mudou de verdade?
              </p>
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="chat-tag bg-green-950/30 border border-green-900/22 px-3 py-1.5 inline-block"
            >
              <p className="text-[11px] text-green-400/75 font-medium">✓ Ela mandou 3 áudios seguidos 🔥</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VIDEO CARD — usa /couple/video.mp4 (vídeo real já na pasta public)
// ─────────────────────────────────────────────────────────────────────────────

function VideoCard() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease }}
      className="relative w-full max-w-[230px]"
    >
      {/* Glow */}
      <div className="absolute -inset-3 bg-[#8B0A2A]/18 blur-3xl chat-avatar pointer-events-none" />

      <div className="relative chat-card aspect-[9/16] overflow-hidden border border-[#8B0A2A]/30 shadow-2xl shadow-[#3D050F]/55 bg-[#0E0809]">
        <video
          src="/couple/video.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        />
        {/* Cinematic bars */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
      </div>

      <p className="text-center mt-3 text-[11px] text-[#9E8E7E]/45 tracking-wider">
        Resultado real. Sem edição.
      </p>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRICING CARDS — preços reais + Vitalício em destaque máximo
// ─────────────────────────────────────────────────────────────────────────────

const PLANS = [
  {
    id: "monthly",
    name: "Mensal",
    price: "R$ 29,90",
    period: "/mês",
    description: "Para começar",
    features: ["30 análises por dia", "Respostas avançadas com IA", "Análise de perfil", "Uploads ilimitados"],
    cta: "Assinar Mensal",
    highlight: false,
  },
  {
    id: "annual",
    name: "Anual",
    price: "R$ 147,00",
    period: "/ano",
    description: "2 meses grátis — economia de R$211",
    features: ["50 análises por dia", "Análise de perfil completa", "Alertas de padrões", "Suporte prioritário"],
    cta: "Assinar Anual",
    highlight: false,
  },
  {
    id: "lifetime",
    name: "Vitalício",
    price: "R$ 297,00",
    period: "único",
    description: "Pague uma vez. Use para sempre.",
    features: [
      "Análises ilimitadas",
      "Acesso vitalício garantido",
      "Todos os updates futuros",
      "Suporte VIP",
      "Acesso antecipado a novidades",
      "Badge exclusivo",
    ],
    cta: "Garantir Acesso Vitalício",
    highlight: true,
  },
];

function PricingCards() {
  return (
    <div className="w-full space-y-3">
      {/* Mensal e Anual — compactos */}
      {PLANS.filter((p) => !p.highlight).map((plan, i) => (
        <motion.div
          key={plan.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="chat-tag p-4 border bg-[#110A0C]/50 border-[#8B0A2A]/12 hover:border-[#8B0A2A]/22 transition-colors"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] text-[#9E8E7E]/55 font-bold tracking-[0.16em] uppercase">{plan.name}</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-lg font-black text-[#F2EDE8]">{plan.price}</span>
                <span className="text-xs text-[#9E8E7E]/45">{plan.period}</span>
              </div>
              <p className="text-[11px] text-[#9E8E7E]/38 mt-0.5">{plan.description}</p>
            </div>
            <Link
              href="/auth/register"
              className="chat-tag shrink-0 text-[12px] font-bold px-3.5 py-2 bg-white/5 text-[#F2EDE8]/60 hover:bg-white/9 border border-white/8 transition-all"
            >
              {plan.cta}
            </Link>
          </div>
        </motion.div>
      ))}

      {/* Vitalício — destaque máximo */}
      {PLANS.filter((p) => p.highlight).map((plan) => (
        <motion.div
          key={plan.id}
          initial={{ opacity: 0, y: 14, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.22, duration: 0.5, ease }}
          className="relative chat-card p-5 border bg-gradient-to-b from-[#8B0A2A]/28 to-[#3D050F]/45 border-[#8B0A2A]/50 shadow-2xl shadow-[#8B0A2A]/22"
        >
          {/* Glow ring */}
          <motion.div
            className="absolute inset-0 chat-card border border-[#8B0A2A]/30 pointer-events-none"
            animate={{ opacity: [0.4, 0.85, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />

          {/* Badge */}
          <div className="flex items-center justify-between mb-4">
            <div className="chat-pill bg-gradient-to-r from-[#8B0A2A] to-[#6d0820] text-[#F2EDE8] text-[10px] font-black px-3 py-1 shadow-md shadow-[#8B0A2A]/30 tracking-wider">
              ♥ MELHOR ESCOLHA
            </div>
            <span className="text-[11px] text-[#C9A84C]/70 font-semibold">Mais popular</span>
          </div>

          {/* Price */}
          <div className="mb-4">
            <p className="text-[10px] text-[#9E8E7E]/50 font-bold tracking-[0.16em] uppercase mb-1">{plan.name}</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-[#F2EDE8] tracking-tight">{plan.price}</span>
              <span className="text-sm text-[#9E8E7E]/45">{plan.period}</span>
            </div>
            <p className="text-xs text-[#C9A84C]/60 mt-1 font-medium">{plan.description}</p>
          </div>

          {/* Features */}
          <ul className="space-y-1.5 mb-5">
            {plan.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-[13px] text-[#F2EDE8]/70">
                <span className="text-[#C9A84C] shrink-0 text-xs">✓</span>
                {f}
              </li>
            ))}
          </ul>

          <Link
            href="/auth/register"
            className="chat-tag block text-center py-3.5 font-black text-sm bg-gradient-to-r from-[#8B0A2A] to-[#6d0820] text-[#F2EDE8] shadow-lg shadow-[#8B0A2A]/35 hover:from-[#9B1A3A] hover:to-[#7d1830] hover:shadow-[#8B0A2A]/55 transition-all hover:scale-[1.02]"
          >
            {plan.cta}
          </Link>
        </motion.div>
      ))}

      {/* CTA final */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center pt-1 space-y-3"
      >
        <Link
          href="/auth/register"
          className="chat-tag inline-flex items-center gap-2 bg-gradient-to-r from-[#8B0A2A] to-[#6d0820] text-[#F2EDE8] font-black px-8 py-3.5 shadow-xl shadow-[#8B0A2A]/28 hover:from-[#9B1A3A] hover:to-[#7d1830] hover:scale-[1.03] transition-all text-sm tracking-wide"
        >
          Entrar na Flertia ♥
        </Link>
        <p className="text-[11px] text-[#9E8E7E]/28 mt-1">
          PIX · Cartão · Sem assinatura obrigatória
        </p>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONVERSATION SCRIPTS
// ─────────────────────────────────────────────────────────────────────────────

function getReactLines(choice: string): string[] {
  const variants: Record<string, string[]> = {
    Sim: [
      "Então você sabe como é.",
      "Aquela mensagem que você ficou reescrevendo por 10 minutos...",
      "E no fim mandou 'oi' mesmo.",
    ],
    Talvez: [
      "Esse 'talvez' diz mais do que parece.",
      "Provavelmente você já ficou travado sem saber como começar...",
      "Ou viu uma conversa esfriar sem entender por quê.",
    ],
    "Muitas vezes": [
      "Então você já sentiu isso de perto.",
      "Conversas que tinham tudo pra dar certo...",
      "E morreram no silêncio de uma mensagem sem resposta.",
    ],
  };
  const base = variants[choice] ?? [
    "Isso é mais comum do que parece.",
    "A maioria das pessoas passa por isso.",
  ];
  return [
    ...base,
    "Não é falta de interesse. Não é aparência.",
    "É que as palavras certas são uma habilidade. E a maioria nunca aprendeu.",
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// OPTION SETS
// ─────────────────────────────────────────────────────────────────────────────

const HOOK_OPTIONS: Option[] = [
  { label: "Sim", value: "Sim" },
  { label: "Talvez", value: "Talvez" },
  { label: "Muitas vezes", value: "Muitas vezes" },
];
const REACT_OPTIONS: Option[] = [
  { label: "Pode mostrar", value: "demo_1" },
  { label: "Tenho curiosidade", value: "demo_1" },
];
const DEMO1_OPTIONS: Option[] = [
  { label: "Sinto a diferença", value: "demo_2" },
  { label: "Me mostra mais", value: "demo_2" },
];
const DEMO2_OPTIONS: Option[] = [
  { label: "Quero ver ao vivo", value: "video" },
  { label: "Como funciona?", value: "video" },
];
const VIDEO_OPTIONS: Option[] = [
  { label: "Quero isso", value: "pricing" },
  { label: "Ver os planos", value: "pricing" },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function ConversationalLanding() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [options, setOptions] = useState<Option[] | null>(null);
  const [optionsDisabled, setOptionsDisabled] = useState(false);
  const [stage, setStage] = useState<Stage>("hook");

  const bottomRef = useRef<HTMLDivElement>(null);
  const hookChoiceRef = useRef("");
  const running = useRef(false);

  // Auto-scroll
  useEffect(() => {
    const t = setTimeout(
      () => bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }),
      90
    );
    return () => clearTimeout(t);
  }, [messages, isTyping, options]);

  const push = useCallback((msg: Omit<ChatMessage, "id">) => {
    setMessages((prev) => [...prev, { ...msg, id: uid() }]);
  }, []);

  // FlertIA "types" then reveals text
  const aiSay = useCallback(
    async (text: string, typingMs?: number) => {
      // typing duration scales with message length but within human bounds
      const ms = typingMs ?? Math.min(750 + text.length * 24, 3000);
      setIsTyping(true);
      await sleep(ms);
      setIsTyping(false);
      await sleep(55);
      push({ from: "ai", text });
      await sleep(340);
    },
    [push]
  );

  // FlertIA reveals rich content (card, video, etc.)
  const aiShow = useCallback(
    async (node: React.ReactNode, typingMs = 500) => {
      setIsTyping(true);
      await sleep(typingMs);
      setIsTyping(false);
      await sleep(55);
      push({ from: "ai", rich: node });
      await sleep(340);
    },
    [push]
  );

  const showOpts = useCallback((opts: Option[]) => {
    setOptions(opts);
    setOptionsDisabled(false);
  }, []);

  const runStage = useCallback(
    async (s: Stage, choice = "") => {
      if (running.current) return;
      running.current = true;
      setOptions(null);

      try {
        // ── HOOK ──────────────────────────────────────────────────────────
        if (s === "hook") {
          await sleep(800);
          await aiSay("Você já perdeu alguém...", 1000);
          await aiSay("...simplesmente por não saber o que dizer no momento certo?", 1150);
          showOpts(HOOK_OPTIONS);
        }

        // ── REACT AO HOOK ─────────────────────────────────────────────────
        else if (s === "react_hook") {
          const lines = getReactLines(choice);
          for (const line of lines) {
            await aiSay(line);
            // pausa extra entre blocos
            if (line.endsWith(".") || line.endsWith("?")) await sleep(180);
          }
          await sleep(280);
          await aiSay("Posso te mostrar algo interessante?", 1050);
          showOpts(REACT_OPTIONS);
        }

        // ── DEMO 1 ────────────────────────────────────────────────────────
        else if (s === "demo_1") {
          await aiSay("Olha esse print aqui:", 850);
          await aiShow(<DemoCard1 />, 400);
          await sleep(4700); // espera animação do DemoCard1 completar
          await aiSay("Sente a diferença?", 750);
          showOpts(DEMO1_OPTIONS);
        }

        // ── DEMO 2 ────────────────────────────────────────────────────────
        else if (s === "demo_2") {
          await aiSay("Olha mais um:", 750);
          await aiShow(<DemoCard2 />, 400);
          await sleep(5000); // espera animação do DemoCard2 completar
          await aiSay("A Flert.IA lê o contexto inteiro. O tom, as emoções, o que está nas entrelinhas.", 1200);
          await aiSay("Quer ver isso funcionando ao vivo?", 900);
          showOpts(DEMO2_OPTIONS);
        }

        // ── VIDEO ─────────────────────────────────────────────────────────
        else if (s === "video") {
          await aiSay("Deixa eu te mostrar.", 800);
          await aiShow(<VideoCard />, 350);
          await sleep(1100);
          await aiSay("Exatamente assim. Sem enrolação.", 950);
          await aiSay("Pronto pra ter conversas assim?", 850);
          showOpts(VIDEO_OPTIONS);
        }

        // ── PRICING ───────────────────────────────────────────────────────
        else if (s === "pricing") {
          await aiSay("Bem-vindo à Flertia.", 900);
          await aiShow(<PricingCards />, 400);
          await sleep(800);
          await aiSay("A partir de hoje, você nunca mais vai ficar sem saber o que responder. ♥", 1100);
        }
      } finally {
        running.current = false;
      }
    },
    [aiSay, aiShow, showOpts]
  );

  // Inicia com o hook
  useEffect(() => {
    runStage("hook");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOption = useCallback(
    (opt: Option) => {
      if (running.current || optionsDisabled) return;
      setOptionsDisabled(true);

      setTimeout(async () => {
        setOptions(null);
        push({ from: "user", text: opt.label });
        await sleep(440);

        const next: Record<Stage, Stage> = {
          hook: "react_hook",
          react_hook: "demo_1",
          demo_1: "demo_2",
          demo_2: "video",
          video: "pricing",
          pricing: "pricing",
        };

        const nextStage = next[stage];
        setStage(nextStage);

        if (stage === "hook") {
          hookChoiceRef.current = opt.value;
          runStage("react_hook", opt.value);
        } else {
          runStage(nextStage);
        }
      }, 160);
    },
    [stage, push, runStage, optionsDisabled]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-[100svh] bg-[#08060A] flex flex-col text-[#F2EDE8]">

      {/* Ambient wine glow */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[8%] -left-48 w-[500px] h-[500px] bg-[#8B0A2A]/7 blur-[130px] chat-avatar" />
        <div className="absolute top-[65%] -right-48 w-[500px] h-[500px] bg-[#6d0820]/5 blur-[130px] chat-avatar" />
        <div className="absolute bottom-[5%] left-[25%] w-96 h-96 bg-[#3D050F]/8 blur-[100px] chat-avatar" />
      </div>

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 flex items-center gap-3 px-5 py-3.5 border-b border-[#8B0A2A]/10 bg-[#08060A]/90 backdrop-blur-xl">
        <FlertAvatar />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#F2EDE8] leading-tight tracking-tight">
            Flert<span className="text-[#8B0A2A]">.IA</span>
          </p>
          <div className="flex items-center gap-1.5">
            <motion.span
              className="chat-avatar block w-[5px] h-[5px] bg-green-400"
              animate={{ opacity: [1, 0.35, 1] }}
              transition={{ duration: 2.4, repeat: Infinity }}
            />
            <p className="text-[10px] text-[#9E8E7E]/45 leading-tight">online agora</p>
          </div>
        </div>
        <Link
          href="/auth/login"
          className="chat-tag text-[11px] text-[#9E8E7E]/50 hover:text-[#F2EDE8]/65 px-3 py-1.5 border border-[#8B0A2A]/18 hover:border-[#8B0A2A]/35 transition-all"
        >
          Entrar
        </Link>
      </header>

      {/* ── Chat feed ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[520px] mx-auto w-full px-4 py-7 space-y-4">

          {messages.map((msg) => {
            if (msg.from === "user") return <UserBubble key={msg.id} text={msg.text!} />;
            if (msg.rich) return <RichMessage key={msg.id}>{msg.rich}</RichMessage>;
            return <AiBubble key={msg.id} text={msg.text!} />;
          })}

          <AnimatePresence mode="wait">
            {isTyping && <AiTypingRow key="typing" />}
          </AnimatePresence>

          <AnimatePresence>
            {options && !isTyping && (
              <OptionButtons
                key="opts"
                options={options}
                onSelect={handleOption}
                disabled={optionsDisabled}
              />
            )}
          </AnimatePresence>

          <div ref={bottomRef} className="h-2" />
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-[#8B0A2A]/8 py-5 text-center px-6">
        <p className="text-[10px] text-[#9E8E7E]/22 tracking-wider">
          © 2025 Flert.IA — Inteligência Artificial para Conversas
        </p>
      </footer>
    </div>
  );
}
