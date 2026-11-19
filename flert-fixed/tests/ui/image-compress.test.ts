import { afterEach, describe, expect, it, vi } from "vitest";
import { MAX_UPLOAD_DATA_URL_CHARS, shrinkImageDataUrl } from "@/lib/image-compress";

const BIG = "data:image/png;base64," + "A".repeat(MAX_UPLOAD_DATA_URL_CHARS + 10);

/** Image fake: dispara onload com as dimensões dadas assim que recebe src. */
function stubImage(width: number, height: number, fail = false) {
  class FakeImage {
    naturalWidth = width;
    naturalHeight = height;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    set src(_v: string) {
      queueMicrotask(() => (fail ? this.onerror?.() : this.onload?.()));
    }
  }
  vi.stubGlobal("Image", FakeImage);
}

function stubCanvas(outputs: string[]) {
  const ctx = { fillStyle: "", fillRect: vi.fn(), drawImage: vi.fn() };
  const canvas = { width: 0, height: 0, getContext: vi.fn(() => ctx), toDataURL: vi.fn(() => outputs.shift() ?? "") };
  const orig = document.createElement.bind(document);
  vi.spyOn(document, "createElement").mockImplementation(((tag: string) =>
    tag === "canvas" ? (canvas as unknown as HTMLCanvasElement) : orig(tag)) as typeof document.createElement);
  return { canvas, ctx };
}

afterEach(() => vi.restoreAllMocks());

describe("shrinkImageDataUrl (navegador)", () => {
  it("redimensiona para no máximo 2048px e re-codifica em JPEG", async () => {
    stubImage(4000, 3000);
    const { canvas, ctx } = stubCanvas(["data:image/jpeg;base64,BBBB"]);
    await expect(shrinkImageDataUrl(BIG)).resolves.toBe("data:image/jpeg;base64,BBBB");
    expect(canvas.width).toBe(2048);
    expect(canvas.height).toBe(1536);
    // Fundo branco: PNG transparente não vira preto no JPEG.
    expect(ctx.fillRect).toHaveBeenCalled();
    expect(canvas.toDataURL).toHaveBeenCalledWith("image/jpeg", expect.any(Number));
  });

  it("baixa a qualidade até caber no limite", async () => {
    stubImage(2000, 1000);
    const tooBig = "data:image/jpeg;base64," + "C".repeat(MAX_UPLOAD_DATA_URL_CHARS);
    const { canvas } = stubCanvas([tooBig, "data:image/jpeg;base64,DDDD"]);
    await expect(shrinkImageDataUrl(BIG)).resolves.toBe("data:image/jpeg;base64,DDDD");
    expect(canvas.toDataURL).toHaveBeenCalledTimes(2);
  });

  it("se nada couber ou a imagem não carregar, devolve a original", async () => {
    stubImage(10, 10, true);
    stubCanvas([]);
    await expect(shrinkImageDataUrl(BIG)).resolves.toBe(BIG);
  });
});
