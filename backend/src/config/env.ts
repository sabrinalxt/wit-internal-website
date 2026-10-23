import dotenv from "dotenv";

// Load .env exactly once, here. Everything else imports `env` from this file.
dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. ` +
        `Copy backend/.env.example to backend/.env and set ${name}.`,
    );
  }
  return value;
}

const port = Number(process.env.PORT ?? 4000);
if (!Number.isInteger(port) || port <= 0) {
  throw new Error(`PORT must be a number, got "${process.env.PORT}".`);
}

const NODE_ENV = process.env.NODE_ENV ?? "development";
const IS_PRODUCTION = NODE_ENV === "production";
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:5173";

export type EmailProviderName = "console" | "smtp";

const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER ?? (IS_PRODUCTION ? "smtp" : "console");
if (EMAIL_PROVIDER !== "console" && EMAIL_PROVIDER !== "smtp") {
  throw new Error(`EMAIL_PROVIDER must be "console" or "smtp", got "${EMAIL_PROVIDER}".`);
}
if (IS_PRODUCTION && EMAIL_PROVIDER === "console") {
  throw new Error("EMAIL_PROVIDER=console is not allowed when NODE_ENV=production.");
}

const EMAIL_FROM = process.env.EMAIL_FROM;
if (EMAIL_PROVIDER === "smtp" && !EMAIL_FROM) {
  throw new Error("Missing required environment variable EMAIL_FROM.");
}

const smtp =
  EMAIL_PROVIDER === "smtp"
    ? (() => {
        const smtpPort = Number(process.env.SMTP_PORT ?? 587);
        if (!Number.isInteger(smtpPort) || smtpPort <= 0) {
          throw new Error(`SMTP_PORT must be a positive integer, got "${process.env.SMTP_PORT}".`);
        }

        const hasUser = Boolean(process.env.SMTP_USER);
        const hasPass = Boolean(process.env.SMTP_PASS);
        if (hasUser !== hasPass) {
          throw new Error("SMTP_USER and SMTP_PASS must be provided together.");
        }

        const secureValue = process.env.SMTP_SECURE ?? "false";
        if (secureValue !== "true" && secureValue !== "false") {
          throw new Error(`SMTP_SECURE must be "true" or "false", got "${secureValue}".`);
        }

        return {
          host: required("SMTP_HOST"),
          port: smtpPort,
          secure: secureValue === "true",
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        };
      })()
    : null;

export const env = {
  JWT_SECRET: required("JWT_SECRET"),
  DATABASE_URL: required("DATABASE_URL"),
  PORT: port,
  CORS_ORIGIN,
  NODE_ENV,
  IS_PRODUCTION,
  APP_URL: process.env.APP_URL ?? CORS_ORIGIN,
  EMAIL_PROVIDER: EMAIL_PROVIDER as EmailProviderName,
  EMAIL_FROM: EMAIL_FROM ?? "WIT Internal <no-reply@example.com>",
  SMTP: smtp,
};
