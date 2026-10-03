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
if (Number.isNaN(port)) {
  throw new Error(`PORT must be a number, got "${process.env.PORT}".`);
}

export const env = {
  JWT_SECRET: required("JWT_SECRET"),
  DATABASE_URL: required("DATABASE_URL"),
  PORT: port,
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? "http://localhost:5173",
};
