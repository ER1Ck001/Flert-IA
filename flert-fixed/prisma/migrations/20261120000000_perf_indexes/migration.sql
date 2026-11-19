-- Tarefa 6 (produção e performance): índices para as consultas por usuário.
-- Só aditiva e idempotente. Postgres não indexa FKs sozinho: sem estes índices,
-- histórico (/api/history), estatísticas (/api/stats), exclusão de conta (ON DELETE CASCADE)
-- e o adapter do NextAuth fazem varredura completa das tabelas.

-- /api/history (WHERE userId ORDER BY createdAt DESC) e /api/stats (COUNT por userId e período).
CREATE INDEX IF NOT EXISTS "Conversation_userId_createdAt_idx" ON "Conversation"("userId", "createdAt");

-- include messages ORDER BY createdAt; cascade ao excluir conversa.
CREATE INDEX IF NOT EXISTS "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- Cascade ao excluir usuário e consultas do adapter do NextAuth.
CREATE INDEX IF NOT EXISTS "Account_userId_idx" ON "Account"("userId");
CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");

-- /api/auth/forgot-password (cooldown por userId e deleteMany por userId).
CREATE INDEX IF NOT EXISTS "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");
