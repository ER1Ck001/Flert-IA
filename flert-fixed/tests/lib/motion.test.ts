import { describe, expect, it } from "vitest";
import { reduced, sheetUp, fadeUp } from "@/lib/motion";

describe("reduced() — prefers-reduced-motion", () => {
  it("remove deslocamento e mantém só opacidade", () => {
    const r = reduced(fadeUp) as Record<string, Record<string, unknown>>;
    expect(r.hidden).not.toHaveProperty("y");
    expect(r.hidden.opacity).toBe(0);
  });

  it("variante sem opacidade (sheetUp) ganha fade, em vez de aparecer/sumir sem transição", () => {
    const r = reduced(sheetUp) as Record<string, Record<string, unknown>>;
    expect(r.hidden).not.toHaveProperty("y");
    expect(r.hidden.opacity).toBe(0);
    expect(r.show.opacity).toBe(1);
    expect(r.exit.opacity).toBe(0);
  });
});
