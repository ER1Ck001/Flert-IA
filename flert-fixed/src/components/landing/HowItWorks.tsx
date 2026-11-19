import { Copy, ImageUp, SlidersHorizontal } from "lucide-react";
import { Section } from "./Section";

const STEPS = [
  {
    icon: ImageUp,
    title: "Envie o print ou descreva",
    text: "Mande o print da conversa ou do story, ou conte a situação com suas palavras.",
  },
  {
    icon: SlidersHorizontal,
    title: "Escolha o tom",
    text: "Flertando, engraçado, casual, afiado, sério, cantada ou stories.",
  },
  {
    icon: Copy,
    title: "Copie uma das 3",
    text: "A IA sugere 3 respostas. Escolha a que combina com você, edite se quiser e copie.",
  },
] as const;

export function HowItWorks() {
  return (
    <Section id="como-funciona" eyebrow="Como funciona" title="Três passos, sem complicação">
      <ol className="grid gap-4 sm:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, text }, i) => (
          <li key={title} className="rounded-lg border border-border bg-surface p-5 shadow-1">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-violet-500/15 text-violet-400">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="text-caption uppercase text-text-2">Passo {i + 1}</span>
            </div>
            <h3 className="mt-4 font-display text-h3 text-text">{title}</h3>
            <p className="mt-2 text-sm text-text-2">{text}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
