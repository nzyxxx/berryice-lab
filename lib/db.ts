import mysql from "mysql2/promise";
import { Pool } from "pg";

export type DbDialect = "postgres" | "mysql";

let pgPool: Pool | null = null;
let mySqlPool: mysql.Pool | null = null;

function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL environment variable.");
  }
  return databaseUrl;
}

export function getDialect(): DbDialect {
  const protocol = new URL(getDatabaseUrl()).protocol.replace(":", "");
  if (protocol === "postgres" || protocol === "postgresql") {
    return "postgres";
  }
  if (protocol === "mysql" || protocol === "mariadb") {
    return "mysql";
  }
  throw new Error(`Unsupported DATABASE_URL protocol: ${protocol}`);
}

export function getPgPool(): Pool {
  if (!pgPool) {
    pgPool = new Pool({
      connectionString: getDatabaseUrl(),
      max: 10,
      idleTimeoutMillis: 30_000,
    });
  }
  return pgPool;
}

export function getMySqlPool(): mysql.Pool {
  if (!mySqlPool) {
    mySqlPool = mysql.createPool({
      uri: getDatabaseUrl(),
      connectionLimit: 10,
      waitForConnections: true,
    });
  }
  return mySqlPool;
}
