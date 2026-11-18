// Paginação do GET /api/history (isomórfico).
import { z } from "zod";
import { idSchema } from "@/lib/validation/common";

export const HISTORY_DEFAULT_LIMIT = 20;
export const HISTORY_MAX_LIMIT = 50;

/** Parâmetros opcionais de paginação. Strings vazias ou fora do formato → 400. */
export const historyPageQuerySchema = z.object({
  cursor: idSchema.optional(),
  limit: z
    .string()
    .regex(/^\d+$/, "limit inválido")
    .transform(Number)
    .pipe(z.number().int().min(1).max(HISTORY_MAX_LIMIT))
    .optional(),
});
