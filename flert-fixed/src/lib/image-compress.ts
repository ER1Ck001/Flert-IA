// Redução do print no navegador antes do envio para /api/analyze.
//
// A Vercel rejeita corpos de requisição acima de 4,5 MB (413, antes de chegar à rota), mas o
// front aceita arquivos de até 10 MB. Prints grandes são redimensionados para no máximo 2048px
// (a OpenAI reduz para esse tamanho de qualquer forma) e re-codificados em JPEG até caberem.
// Prints pequenos seguem intactos. Qualquer falha devolve a imagem original.

/** ~3,4 MB em data URL: o JSON do pedido fica bem abaixo dos 4,5 MB da Vercel. */
export const MAX_UPLOAD_DATA_URL_CHARS = 3_400_000;
export const MAX_IMAGE_SIDE = 2048;
const JPEG_QUALITIES = [0.85, 0.72, 0.6, 0.45];

export const needsShrink = (dataUrl: string) => dataUrl.length > MAX_UPLOAD_DATA_URL_CHARS;

export function fitWithin(width: number, height: number, max: number): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= max) return { width, height };
  const scale = max / longest;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });
}

export async function shrinkImageDataUrl(dataUrl: string): Promise<string> {
  if (!needsShrink(dataUrl)) return dataUrl;
  if (typeof Image === "undefined" || typeof document === "undefined") return dataUrl;
  try {
    const img = await loadImage(dataUrl);
    const { width, height } = fitWithin(img.naturalWidth, img.naturalHeight, MAX_IMAGE_SIDE);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    // JPEG não tem transparência: fundo branco em vez de preto.
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    for (const q of JPEG_QUALITIES) {
      const out = canvas.toDataURL("image/jpeg", q);
      if (out.startsWith("data:image/jpeg") && !needsShrink(out)) return out;
    }
    return dataUrl;
  } catch {
    return dataUrl;
  }
}
