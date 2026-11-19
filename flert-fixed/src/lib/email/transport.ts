// Transporte SMTP compartilhado (somente servidor).
import nodemailer from "nodemailer";

/**
 * Timeouts curtos: os padrões do nodemailer (2 min para conectar, 10 min de socket) passam do
 * tempo máximo da função serverless — um SMTP lento derrubaria a requisição inteira.
 */
export function smtpOptions() {
  return {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  };
}

export const createMailTransport = () => nodemailer.createTransport(smtpOptions());
