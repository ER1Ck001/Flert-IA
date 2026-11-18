// Schemas de conta — fonte única para front e back (isomórfico).
import { z } from "zod";
import { emptyToUndefined, utf8ByteLength } from "@/lib/validation/common";

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const emailSchema = z
  .string({ required_error: "E-mail é obrigatório", invalid_type_error: "E-mail inválido" })
  .trim()
  .toLowerCase()
  .min(1, "E-mail é obrigatório")
  .max(254, "E-mail muito longo")
  .email("E-mail inválido");

export const PASSWORD_RULES_HINT = "Mínimo de 8 caracteres, com letras e números.";

/** Senha nova. bcrypt considera só os primeiros 72 bytes — acima disso, rejeita. */
export const newPasswordSchema = z
  .string({ required_error: "Senha é obrigatória", invalid_type_error: "Senha inválida" })
  .min(8, "A senha deve ter pelo menos 8 caracteres")
  .max(72, "A senha deve ter no máximo 72 caracteres")
  .refine((s) => utf8ByteLength(s) <= 72, "A senha é longa demais")
  .refine((s) => /\p{L}/u.test(s) && /\p{N}/u.test(s), "A senha precisa ter letras e números");

/** Senha no login: sem regra de força, para não bloquear contas antigas (mín. 6). */
export const loginPasswordSchema = z.string().min(1, "Senha é obrigatória").max(256, "Senha inválida");

const CONTROL_CHARS = /\p{Cc}/u;
const LOOKS_LIKE_URL = /:\/\/|www\./i;

export const nameSchema = z
  .string({ required_error: "Nome é obrigatório", invalid_type_error: "Nome inválido" })
  .refine((s) => !CONTROL_CHARS.test(s), "Nome contém caracteres inválidos")
  .transform((s) => s.trim().replace(/\s+/g, " "))
  .pipe(
    z
      .string()
      .min(2, "Nome deve ter pelo menos 2 caracteres")
      .max(60, "Nome deve ter no máximo 60 caracteres")
      .refine((s) => !/[<>]/.test(s), "Nome contém caracteres inválidos")
      .refine((s) => !LOOKS_LIKE_URL.test(s), "Nome não pode conter links")
  );

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: newPasswordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetTokenSchema = z
  .string({ required_error: "Link inválido", invalid_type_error: "Link inválido" })
  .regex(/^[a-f0-9]{64}$/, "Link inválido ou expirado");

export const resetPasswordSchema = z.object({
  token: resetTokenSchema,
  password: newPasswordSchema,
});

export const resetPasswordFormSchema = resetPasswordSchema
  .extend({ confirm: z.string() })
  .refine((d) => d.password === d.confirm, { message: "As senhas não coincidem", path: ["confirm"] });

export const profileUpdateSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    currentPassword: z.preprocess(emptyToUndefined, loginPasswordSchema.optional()),
    newPassword: z.preprocess(emptyToUndefined, newPasswordSchema.optional()),
  })
  .superRefine((d, ctx) => {
    if (d.newPassword && !d.currentPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["currentPassword"],
        message: "Informe a senha atual para definir uma nova senha",
      });
    }
  });

export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;

/** Excluir a conta exige digitar EXCLUIR (e a senha, quando a conta tem senha — checado na rota). */
export const DELETE_CONFIRMATION = "EXCLUIR";
export const deleteAccountSchema = z.object({
  confirm: z.literal(DELETE_CONFIRMATION, { errorMap: () => ({ message: `Digite ${DELETE_CONFIRMATION} para confirmar` }) }),
  password: z.preprocess(emptyToUndefined, loginPasswordSchema.optional()),
});
