import { Send } from "lucide-react";

// Cena ILUSTRATIVA do cenário "Story" da demonstração: interface genérica de story (sem marca de
// nenhuma rede social), autor fictício e um pôr do sol desenhado em SVG. Nada aqui é real.
export function StoryMock({ caption }: { caption: string }) {
  return (
    <div
      role="img"
      aria-label={`Exemplo ilustrativo: story de pôr do sol na praia com a legenda “${caption}”`}
      className="relative mx-auto mt-4 aspect-[9/14] w-full max-w-[280px] overflow-hidden rounded-2xl bg-[#1A1033] shadow-2 ring-1 ring-white/10"
    >
      {/* Cena */}
      <svg
        aria-hidden
        data-scene="sunset"
        viewBox="0 0 360 560"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient id="story-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1E1240" />
            <stop offset=".38" stopColor="#5B2BB5" />
            <stop offset=".62" stopColor="#E0457B" />
            <stop offset=".8" stopColor="#FF8A5B" />
            <stop offset="1" stopColor="#FFC27A" />
          </linearGradient>
          <linearGradient id="story-sea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7A2E8C" />
            <stop offset=".5" stopColor="#3B1C6E" />
            <stop offset="1" stopColor="#1B103A" />
          </linearGradient>
          <radialGradient id="story-glow" cx=".5" cy=".5" r=".5">
            <stop offset="0" stopColor="#FFD9A0" stopOpacity=".9" />
            <stop offset=".45" stopColor="#FF9A6B" stopOpacity=".35" />
            <stop offset="1" stopColor="#FF7A59" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="story-sand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3A2150" />
            <stop offset="1" stopColor="#150B26" />
          </linearGradient>
          <linearGradient id="story-shade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#000" stopOpacity=".45" />
            <stop offset=".18" stopColor="#000" stopOpacity="0" />
            <stop offset=".75" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity=".55" />
          </linearGradient>
        </defs>

        {/* Céu, estrelas discretas e brilho do sol */}
        <rect width="360" height="560" fill="url(#story-sky)" />
        {[
          [40, 60], [110, 34], [300, 70], [250, 28], [330, 130], [70, 140],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="1.3" fill="#fff" opacity=".55" />
        ))}
        <circle cx="180" cy="330" r="150" fill="url(#story-glow)" />
        <circle cx="180" cy="335" r="46" fill="#FFD48A" />

        {/* Nuvens finas */}
        <g fill="#FFB38A" opacity=".55">
          <rect x="40" y="250" width="120" height="5" rx="2.5" />
          <rect x="210" y="268" width="110" height="4" rx="2" />
          <rect x="90" y="286" width="80" height="3" rx="1.5" />
        </g>

        {/* Pássaros */}
        <g fill="none" stroke="#2A1640" strokeWidth="2" strokeLinecap="round" opacity=".7">
          <path d="M92 200 q6 -6 12 0 q6 -6 12 0" />
          <path d="M124 182 q4 -4 8 0 q4 -4 8 0" />
          <path d="M250 214 q5 -5 10 0 q5 -5 10 0" />
        </g>

        {/* Mar com reflexo do sol */}
        <rect y="340" width="360" height="220" fill="url(#story-sea)" />
        <g fill="#FFD48A">
          <rect x="140" y="348" width="80" height="4" rx="2" opacity=".85" />
          <rect x="150" y="360" width="60" height="3" rx="1.5" opacity=".7" />
          <rect x="158" y="371" width="44" height="3" rx="1.5" opacity=".55" />
          <rect x="166" y="382" width="28" height="2" rx="1" opacity=".45" />
          <rect x="172" y="392" width="16" height="2" rx="1" opacity=".35" />
        </g>
        <g fill="none" stroke="#C25A9A" strokeWidth="1.5" opacity=".35">
          <path d="M20 410 q20 -6 40 0 t40 0" />
          <path d="M230 420 q20 -6 40 0 t40 0" />
          <path d="M100 440 q20 -6 40 0 t40 0" />
        </g>

        {/* Areia em primeiro plano */}
        <path d="M0 470 C 90 440, 200 470, 360 448 L360 560 L0 560 Z" fill="url(#story-sand)" />

        {/* Sombra para legibilidade do topo e da base */}
        <rect width="360" height="560" fill="url(#story-shade)" />
      </svg>

      {/* Barras de progresso */}
      <div aria-hidden className="absolute inset-x-3 top-3 flex gap-1">
        {[100, 55, 0].map((p, i) => (
          <span key={i} data-story-progress className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/30">
            <span className="block h-full rounded-full bg-white" style={{ width: `${p}%` }} />
          </span>
        ))}
      </div>

      {/* Autor fictício */}
      <div aria-hidden className="absolute inset-x-3 top-6 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-pink-500 p-[2px]">
          <span className="flex h-full w-full items-center justify-center rounded-full bg-[#1A1033] text-xs font-semibold text-white">
            J
          </span>
        </span>
        <span className="text-sm font-semibold text-white">Jordan</span>
        <span className="text-xs text-white/70">2 h</span>
      </div>

      {/* Legenda como adesivo */}
      <div aria-hidden className="absolute inset-x-0 top-[71%] flex justify-center">
        <span className="-rotate-3 rounded-lg bg-white px-3 py-1.5 font-display text-base font-bold text-[#1A1033] shadow-2">
          {caption}
        </span>
      </div>

      {/* Campo de resposta */}
      <div aria-hidden className="absolute inset-x-3 bottom-3 flex items-center gap-2">
        <span className="flex h-10 flex-1 items-center rounded-full border border-white/50 px-4 text-sm text-white/85">
          Responder ao story…
        </span>
        <Send className="h-5 w-5 text-white" />
      </div>
    </div>
  );
}
