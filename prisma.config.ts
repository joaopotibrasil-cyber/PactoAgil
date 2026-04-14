import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Placeholder só para `prisma generate` em CI sem DATABASE_URL (não conecta ao gerar client)
    url:
      process.env.DATABASE_URL ||
      "postgresql://build:build@127.0.0.1:5432/postgres?schema=public",
  },
});
