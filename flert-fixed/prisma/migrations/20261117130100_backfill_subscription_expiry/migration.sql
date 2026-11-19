-- Backfill: PREMIUM/ANNUAL sem "expiresAt" (ex.: liberados manualmente antes da regra de
-- expiração) passariam a valer como FREE. Calcula a expiração a partir da ativação, para
-- que ninguém perca o acesso que efetivamente pagou no momento do deploy.
UPDATE "subscription_statuses"
SET "expiresAt" = COALESCE("activatedAt", "createdAt") + INTERVAL '30 days'
WHERE "status" = 'PREMIUM' AND "expiresAt" IS NULL;

UPDATE "subscription_statuses"
SET "expiresAt" = COALESCE("activatedAt", "createdAt") + INTERVAL '365 days'
WHERE "status" = 'ANNUAL' AND "expiresAt" IS NULL;
