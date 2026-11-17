-- Normaliza e-mails (trim + minúsculas) e impede novas variações de caixa.
--
-- ANTES DE APLICAR, rode em produção (somente leitura) para achar colisões:
--   SELECT lower(btrim(email)) AS email, array_agg(id) AS ids, count(*)
--   FROM "User" WHERE email IS NOT NULL GROUP BY 1 HAVING count(*) > 1;
-- Resolva cada colisão manualmente (mantenha a conta com pagamento/assinatura).
-- Esta migration aborta sozinha se ainda houver colisões — nada é alterado nesse caso.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "User" WHERE email IS NOT NULL
    GROUP BY lower(btrim(email)) HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Há contas com o mesmo e-mail em caixas diferentes. Resolva as colisões antes de normalizar.';
  END IF;

  -- Segurança: uma conta cadastrada com variação de caixa do e-mail do admin (brecha antiga)
  -- viraria o próprio admin ao ser normalizada. Exige revisão manual antes de continuar:
  --   SELECT id, email, "createdAt" FROM "User"
  --   WHERE lower(btrim(email)) = 'erickrochas230@gmail.com' AND email <> 'erickrochas230@gmail.com';
  -- (Se ADMIN_EMAIL em produção for outro endereço, rode a mesma consulta com ele.)
  IF EXISTS (
    SELECT 1 FROM "User"
    WHERE lower(btrim(email)) = 'erickrochas230@gmail.com' AND email <> 'erickrochas230@gmail.com'
  ) THEN
    RAISE EXCEPTION 'Existe conta com variação de caixa do e-mail do admin. Revise/remova antes de normalizar.';
  END IF;
END $$;

UPDATE "User" SET email = lower(btrim(email))
WHERE email IS NOT NULL AND email <> lower(btrim(email));

ALTER TABLE "User" ADD CONSTRAINT "User_email_normalized_chk"
  CHECK (email IS NULL OR email = lower(btrim(email)));

-- Tokens de redefinição antigos eram guardados em texto claro e não funcionam com o novo
-- formato (hash SHA-256). Expiram em 1h de qualquer forma.
DELETE FROM "PasswordResetToken";
