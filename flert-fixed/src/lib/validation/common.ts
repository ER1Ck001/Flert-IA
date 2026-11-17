// Validações compartilhadas (isomórfico: usado no cliente e no servidor).
import { z } from "zod";

/** IDs gerados pelo Prisma (cuid) — sem barras, aspas ou espaços. */
export const idSchema = z
  .string({ invalid_type_error: "ID inválido", required_error: "ID é obrigatório" })
  .trim()
  .min(1, "ID é obrigatório")
  .max(64, "ID inválido")
  .regex(/^[A-Za-z0-9_-]+$/, "ID inválido");

export const utf8ByteLength = (s: string) => new TextEncoder().encode(s).length;

/** Formulários enviam "" para campos não preenchidos: trata como ausente. */
export const emptyToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);
