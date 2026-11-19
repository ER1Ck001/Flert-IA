import { ChevronLeft, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DemoMessage } from "./demo-data";

// Cena ILUSTRATIVA do cenário "Conversa" da demonstração: interface genérica de chat (sem marca de
// nenhum app), contato fictício e uma "foto" do pão desenhada em SVG. Nada aqui é real.
const TIMES = ["21:14", "21:15", "21:15", "21:16"];

function BreadPhoto() {
  return (
    <svg aria-hidden data-scene="bread" viewBox="0 0 200 150" className="block h-auto w-full">
      <defs>
        <linearGradient id="chat-counter" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F4DDB8" />
          <stop offset="1" stopColor="#E2B884" />
        </linearGradient>
        <linearGradient id="chat-loaf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E9A552" />
          <stop offset=".6" stopColor="#C8772F" />
          <stop offset="1" stopColor="#9C5523" />
        </linearGradient>
        <radialGradient id="chat-light" cx=".25" cy=".1" r=".9">
          <stop offset="0" stopColor="#fff" stopOpacity=".55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Bancada e luz da janela */}
      <rect width="200" height="150" fill="url(#chat-counter)" />
      <rect width="200" height="150" fill="url(#chat-light)" />

      {/* Tábua retangular em leve perspectiva, com veios */}
      <path d="M22 104 L178 98 Q188 98 188 108 L186 134 Q186 142 176 142 L24 146 Q14 146 14 136 L14 114 Q14 104 22 104 Z" fill="#8A5530" />
      <path d="M22 98 L178 92 Q188 92 188 102 L186 128 Q186 136 176 136 L24 140 Q14 140 14 130 L14 108 Q14 98 22 98 Z" fill="#B57A47" />
      <g fill="none" stroke="#9A6235" strokeWidth="1.2" opacity=".5">
        <path d="M26 112 Q100 106 176 106" />
        <path d="M24 124 Q90 120 178 118" />
      </g>

      {/* Pão "meio torto": filão alongado, bem mais alto e inchado de um lado */}
      <ellipse cx="100" cy="116" rx="66" ry="7" fill="#000" opacity=".2" />
      <path
        d="M36 110 C 26 80, 52 46, 88 50 C 122 54, 160 74, 166 96 C 170 112, 144 118, 102 118 C 68 118, 40 118, 36 110 Z"
        fill="url(#chat-loaf)"
      />
      {/* Cortes diagonais na casca */}
      <g fill="none" stroke="#F7D69C" strokeWidth="3.5" strokeLinecap="round" opacity=".9">
        <path d="M54 76 q8 -12 22 -16" />
        <path d="M82 80 q10 -12 24 -14" />
        <path d="M112 86 q10 -8 24 -8" />
        <path d="M140 96 q6 -4 14 -2" />
      </g>
      {/* Brilho */}
      <path
        d="M44 92 C 44 76, 56 62, 70 56"
        fill="none"
        stroke="#fff"
        strokeOpacity=".25"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Migalhas */}
      <g fill="#C8772F">
        <circle cx="30" cy="126" r="2" />
        <circle cx="172" cy="112" r="1.6" />
        <circle cx="164" cy="126" r="1.2" />
        <circle cx="44" cy="132" r="1.3" />
      </g>
    </svg>
  );
}

export function ChatMock({ messages }: { messages: readonly DemoMessage[] }) {
  const label = `Exemplo ilustrativo: print de uma conversa com Alex, que mandou ${messages
    .map((m) => `“${m.text}”`)
    .join(", ")} e uma foto do pão`;

  return (
    <div
      role="img"
      aria-label={label}
      className="relative mx-auto mt-4 flex w-full max-w-[320px] flex-col overflow-hidden rounded-2xl bg-[#140D28] shadow-2 ring-1 ring-white/10"
    >
      {/* Cabeçalho */}
      <div aria-hidden className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-3 py-2.5">
        <ChevronLeft className="h-5 w-5 shrink-0 text-white/60" />
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-pink-500 p-[2px]">
          <span className="flex h-full w-full items-center justify-center rounded-full bg-[#140D28] text-sm font-semibold text-white">
            A
          </span>
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#140D28]" />
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-sm font-semibold text-white">Alex</span>
          <span className="block truncate text-[11px] text-white/55">online agora</span>
        </span>
      </div>

      {/* Mensagens */}
      <div
        aria-hidden
        className="flex flex-col gap-1.5 px-3 pb-3 pt-3 [background-image:radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:14px_14px]"
      >
        <span className="mx-auto mb-1 rounded-full bg-white/[0.07] px-2.5 py-0.5 text-[11px] text-white/60">Hoje</span>

        {messages.map((msg, i) => {
          const mine = msg.from === "me";
          return (
            <div key={msg.text} className={cn("flex flex-col gap-1.5", mine ? "items-end" : "items-start")}>
              <p
                data-chat-bubble
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-snug",
                  mine ? "rounded-br-md bg-violet-600 text-white" : "rounded-bl-md bg-white/[0.09] text-white/95"
                )}
              >
                {msg.text}
                <span className="ml-2 inline-block translate-y-0.5 text-[10px] text-white/45">
                  {TIMES[i % TIMES.length]}
                </span>
              </p>
              {/* A foto do pão vem logo depois da primeira mensagem, antes do comentário sobre ela */}
              {i === 0 && !mine && (
                <div className="w-[68%] overflow-hidden rounded-2xl rounded-bl-md bg-white/[0.09] p-1">
                  <div className="overflow-hidden rounded-xl">
                    <BreadPhoto />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Campo de digitação */}
      <div aria-hidden className="flex items-center gap-2 border-t border-white/10 px-3 py-2.5">
        <span className="flex h-9 flex-1 items-center rounded-full bg-white/[0.07] px-4 text-sm text-white/50">
          Mensagem…
        </span>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-pink-500">
          <Send className="h-4 w-4 text-white" />
        </span>
      </div>
    </div>
  );
}
