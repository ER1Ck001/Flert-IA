// Validação das variáveis de ambiente do servidor (somente servidor).
//
// Chamada uma vez na subida do servidor (src/instrumentation.ts). Nunca durante o `next build`:
// o CI e o build da Vercel podem rodar sem segredos, e nada aqui é necessário para compilar.
// Mensagens contêm só NOMES de variáveis — nunca valores.

type Env = Record<string, string | undefined>;

/** Sem estas o app não funciona em nada (banco e sessões): falha na subida. */
export const CRITICAL_ENV = ["DATABASE_URL", "NEXTAUTH_SECRET"] as const;

/** Sem estas uma parte do app quebra (IA, pagamento, e-mail, admin): avisa no log. */
export const RECOMMENDED_ENV = [
  "NEXTAUTH_URL",
  "NEXT_PUBLIC_APP_URL",
  "OPENAI_API_KEY",
  "ABACATEPAY_API_KEY",
  "ABACATEPAY_BASE_URL",
  "ABACATEPAY_WEBHOOK_SECRET",
  "ABACATEPAY_PRODUCT_ID_MONTHLY",
  "ABACATEPAY_PRODUCT_ID_ANNUAL",
  "ABACATEPAY_PRODUCT_ID_LIFETIME",
  "SMTP_HOST",
  "SMTP_USER",
  "SMTP_PASSWORD",
  "SMTP_FROM",
  "ADMIN_EMAIL",
] as const;

export type EnvReport = {
  missingCritical: string[];
  invalid: string[];
  missingRecommended: string[];
  warnings: string[];
};

const isSet = (v: string | undefined) => typeof v === "string" && v.trim() !== "";

const isUrl = (v: string) => {
  try {
    return /^https?:$/.test(new URL(v).protocol);
  } catch {
    return false;
  }
};

export function checkEnv(env: Env): EnvReport {
  const missingCritical = CRITICAL_ENV.filter((k) => !isSet(env[k]));
  const missingRecommended = RECOMMENDED_ENV.filter((k) => !isSet(env[k]));

  const invalid: string[] = [];
  if (isSet(env.DATABASE_URL) && !/^postgres(ql)?:\/\//.test(env.DATABASE_URL!.trim())) invalid.push("DATABASE_URL");

  // Avisos não derrubam o app: valores que funcionam hoje continuam funcionando.
  const warnings: string[] = [];
  if (isSet(env.NEXTAUTH_SECRET) && env.NEXTAUTH_SECRET!.length < 32) {
    warnings.push("NEXTAUTH_SECRET tem menos de 32 caracteres");
  }
  for (const k of ["NEXTAUTH_URL", "NEXT_PUBLIC_APP_URL"] as const) {
    if (isSet(env[k]) && !isUrl(env[k]!.trim())) warnings.push(`${k} não é uma URL http(s) válida`);
  }

  return { missingCritical: [...missingCritical], invalid, missingRecommended: [...missingRecommended], warnings };
}

/**
 * Falha rápido (com mensagem clara e só nomes) quando falta configuração essencial.
 * Ignorada na fase de build do Next (`NEXT_PHASE=phase-production-build`).
 */
export function assertServerEnv(env: Env = process.env): void {
  if (env.NEXT_PHASE === "phase-production-build") return;

  const report = checkEnv(env);
  const fatal = [...report.missingCritical, ...report.invalid];
  if (fatal.length > 0) {
    throw new Error(
      `[env] Variáveis de ambiente obrigatórias ausentes ou inválidas: ${fatal.join(", ")}. ` +
        "Configure-as no painel da hospedagem (veja .env.example)."
    );
  }
  if (report.missingRecommended.length > 0) {
    console.warn(`[env] Variáveis não configuradas (partes do app ficarão indisponíveis): ${report.missingRecommended.join(", ")}`);
  }
  for (const w of report.warnings) console.warn(`[env] ${w}`);
}
