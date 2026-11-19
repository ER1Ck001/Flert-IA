-- Tarefa 10 (LGPD): consentimentos no User. Só aditiva e idempotente.
-- Contas existentes começam SEM opt-in de marketing (DEFAULT false) e sem confirmação de 18+
-- (NULL): elas confirmam a idade na próxima visita (/auth/confirmar-idade).

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "marketingOptIn" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "marketingOptInAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "adultConfirmedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "termsAcceptedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "termsVersion" TEXT;
