// Schemas do painel admin (isomórfico — sem importar @prisma/client).
import { z } from "zod";
import { idSchema } from "@/lib/validation/common";

const PLANS = ["FREE", "PREMIUM", "ANNUAL", "LIFETIME"] as const;

export const adminEmailSchema = z
  .object({
    template: z.enum(["free_upsell", "expiring", "custom"], { errorMap: () => ({ message: "Template inválido" }) }),
    userId: idSchema.optional(),
    targetPlan: z.enum(["ALL", ...PLANS], { errorMap: () => ({ message: "Plano inválido" }) }).default("ALL"),
    customSubject: z
      .string()
      .trim()
      .max(150, "Assunto deve ter no máximo 150 caracteres")
      .refine((s) => !/[\r\n]/.test(s), "Assunto não pode ter quebras de linha")
      .optional(),
    customBody: z.string().trim().max(10_000, "Mensagem deve ter no máximo 10.000 caracteres").optional(),
  })
  .superRefine((d, ctx) => {
    if (d.template !== "custom") return;
    if (!d.customSubject) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["customSubject"], message: "Assunto é obrigatório" });
    if (!d.customBody) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["customBody"], message: "Mensagem é obrigatória" });
  });

export const adminPatchUserSchema = z.object({
  subscription: z.enum(PLANS, { errorMap: () => ({ message: "Plano inválido" }) }),
});
