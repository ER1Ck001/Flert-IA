import { describe, expect, it } from "vitest";
import { TONES, TONES_NO_STORIES, getToneLabel } from "@/components/analyze/tones";
import { DEMO_TONES } from "@/components/landing/demo-data";

// Chaves aceitas pela API (/api/analyze e /api/analyze/text) — NÃO mudar.
const API_TONES = ["flirty", "funny", "casual", "witty", "serious", "pickup", "stories"];

describe("tones.ts", () => {
  it("tem exatamente os 7 values da API, na ordem", () => {
    expect(TONES.map((t) => t.value)).toEqual(API_TONES);
  });

  it("todo tom tem label e ícone (sem emoji)", () => {
    for (const t of TONES) {
      expect(t.label.trim().length).toBeGreaterThan(0);
      expect(t.icon).toBeTruthy();
      expect(t.label).not.toMatch(/\p{Extended_Pictographic}/u);
    }
  });

  it("TONES_NO_STORIES = os 6 primeiros, sem stories", () => {
    expect(TONES_NO_STORIES.map((t) => t.value)).toEqual(API_TONES.filter((v) => v !== "stories"));
  });

  it("getToneLabel devolve o label ou o próprio value", () => {
    expect(getToneLabel("flirty")).toBe("Flertando");
    expect(getToneLabel("desconhecido")).toBe("desconhecido");
  });
});

describe("demo-data usa os mesmos tons", () => {
  it("values, labels e ícones iguais aos de tones.ts", () => {
    expect(DEMO_TONES.map((t) => t.value)).toEqual(API_TONES);
    DEMO_TONES.forEach((d, i) => {
      expect(d.label).toBe(TONES[i].label);
      expect(d.icon).toBe(TONES[i].icon);
      expect(d.description.length).toBeGreaterThan(0);
    });
  });
});
