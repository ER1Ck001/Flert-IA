// Fonte única dos tons de resposta (app /analyze, landing e histórico).
import { Camera, Coffee, Flame, Heart, Laugh, MessageSquareText, Zap, type LucideIcon } from "lucide-react";

/** Values IMUTÁVEIS — são as chaves de tom (`style`) aceitas pela API. */
export type ToneValue = "flirty" | "funny" | "casual" | "witty" | "serious" | "pickup" | "stories";

export interface Tone {
  value: ToneValue;
  label: string;
  icon: LucideIcon;
}

export const TONES: readonly Tone[] = [
  { value: "flirty", label: "Flertando", icon: Heart },
  { value: "funny", label: "Engraçado", icon: Laugh },
  { value: "casual", label: "Casual", icon: Coffee },
  { value: "witty", label: "Afiado", icon: Zap },
  { value: "serious", label: "Sério", icon: MessageSquareText },
  { value: "pickup", label: "Cantada", icon: Flame },
  { value: "stories", label: "Stories", icon: Camera },
];

/** Tons sem "stories" (que só aparece quando a pessoa responde a uma foto/story). */
export const TONES_NO_STORIES: readonly Tone[] = TONES.filter((t) => t.value !== "stories");

export function getToneLabel(value: string): string {
  return TONES.find((t) => t.value === value)?.label ?? value;
}
