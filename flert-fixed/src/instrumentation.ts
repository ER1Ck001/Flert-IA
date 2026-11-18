// Executado uma vez quando o servidor (ou a função serverless) sobe — não no `next build`.
export async function register() {
  // O middleware roda no Edge runtime: a validação é só para o runtime Node.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertServerEnv } = await import("@/lib/env");
    assertServerEnv();
  }
}
