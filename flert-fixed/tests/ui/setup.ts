import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";

// Sem `globals: true`, o Testing Library não registra o cleanup sozinho.
afterEach(async () => {
  if (typeof document === "undefined") return;
  const { cleanup } = await import("@testing-library/react");
  cleanup();
});

if (typeof window !== "undefined") {
  // jsdom não implementa matchMedia (usado por useReducedMotion do framer-motion).
  if (!window.matchMedia) {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  }
}
