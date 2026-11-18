// Limites do envio em massa do admin (POST /api/admin/email, maxDuration = 60 s).

/** Envios simultâneos ao SMTP (limite baixo para não ser bloqueado pelo provedor). */
export const EMAIL_CONCURRENCY = 5;
/** Depois disso não começa um novo lote: o que falta volta como `remaining` + `nextCursor`. */
export const EMAIL_START_CUTOFF_MS = 30_000;
/**
 * Prazo dos envios em andamento. Um envio que passa disso conta como falha e não é reenviado
 * na próxima chamada (pode ter sido entregue). 45 s + consultas ficam abaixo do maxDuration.
 */
export const EMAIL_SEND_DEADLINE_MS = 45_000;
