import { beforeEach, vi } from "vitest";

process.env.OPENAI_API_KEY = "test-key";
process.env.NEXTAUTH_SECRET = "test-secret";

// Silencia logs esperados nos caminhos de erro, sem esconder falhas de asserção.
beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
});
