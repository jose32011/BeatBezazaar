import fs from 'fs';
import path from 'path';
import { createConnection } from 'mysql2/promise';
import mysql from 'mysql2/promise';
import { drizzle as drizzleMysql } from 'drizzle-orm/mysql2';
import { createMySQLTablesUsingDb } from './storage';
import bcrypt from 'bcryptjs';

type DbConfig = {
  host: string;
  port?: number | string;
  user: string;
  password: string;
  database: string;
};

export function isMysqlConfigured(): boolean {
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && dbUrl.startsWith('mysql')) return true;
  if (process.env.RAILWAY_MYSQL_HOST) return true;
  if (process.env.MYSQL_HOST && process.env.MYSQL_USER && process.env.MYSQL_DB) return true;
  return false;
}

function buildConnectionOptions(cfg: DbConfig) {
  return {
    host: cfg.host,
    port: cfg.port ? Number(cfg.port) : 3306,
    user: cfg.user,
    password: cfg.password,
    database: cfg.database,
  } as const;
}

export async function checkDbAndAdmin(): Promise<{ configured: boolean; canConnect: boolean; adminExists: boolean }> {
  const configured = isMysqlConfigured();
  if (!configured) return { configured: false, canConnect: false, adminExists: false };

  // try connect using env
  try {
    const host = process.env.RAILWAY_MYSQL_HOST || process.env.MYSQL_HOST;
    const user = process.env.RAILWAY_MYSQL_USERNAME || process.env.MYSQL_USER || process.env.MYSQL_USERNAME || '';
    const password = process.env.RAILWAY_MYSQL_PASSWORD || process.env.MYSQL_PASSWORD || '';
    const database = process.env.RAILWAY_MYSQL_DB || process.env.MYSQL_DB || process.env.MYSQL_DATABASE || '';

    if (!host || !user || !database) {
      // fall back to DATABASE_URL
      const dbUrl = process.env.DATABASE_URL || '';
      if (!dbUrl.startsWith('mysql')) {
        return { configured: true, canConnect: false, adminExists: false };
      }
    }

    const conn = await createConnection({
      host: host || 'localhost',
      user: user || 'root',
      password: password || '',
      database: database || undefined,
    } as any);

    // check users table and admin
    const [rows] = await conn.query(`SELECT COUNT(*) as cnt FROM information_schema.tables WHERE table_schema = ? AND table_name = 'users'`, [database]);
    const tableExists = Array.isArray(rows) && (rows as any)[0] && (rows as any)[0].cnt > 0;
    let adminExists = false;
    if (tableExists) {
      try {
        const [r2] = await conn.query(`SELECT COUNT(*) as cnt FROM users WHERE role = 'admin'`);
        adminExists = (Array.isArray(r2) && (r2 as any)[0] && (r2 as any)[0].cnt > 0) || false;
      } catch (e) {
        // ignore
      }
    }

    await conn.end();
    return { configured: true, canConnect: true, adminExists };
  } catch (error) {
    return { configured: true, canConnect: false, adminExists: false };
  }
}

export async function writeEnvAndCreateAdmin(dbCfg: DbConfig, admin: { username: string; email?: string; password: string }) {
  // write to .env in project root
  const envPath = path.join(process.cwd(), '.env');

  // Build DATABASE_URL
  const host = dbCfg.host;
  const port = dbCfg.port || 3306;
  const user = dbCfg.user;
  const pass = dbCfg.password;
  const database = dbCfg.database;

  const databaseUrl = `mysql://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${port}/${database}`;

  let envContents = '';
  try {
    if (fs.existsSync(envPath)) {
      envContents = fs.readFileSync(envPath, 'utf-8');
    }
  } catch (e) {
    // ignore
  }

  const set = (key: string, value: string) => {
    const re = new RegExp(`^${key}=.*$`, 'm');
    if (re.test(envContents)) {
      envContents = envContents.replace(re, `${key}=${value}`);
    } else {
      envContents += `\n${key}=${value}`;
    }
  };

  set('DATABASE_URL', databaseUrl);
  set('MYSQL_HOST', host);
  set('MYSQL_PORT', String(port));
  set('MYSQL_USER', user);
  set('MYSQL_PASSWORD', pass);
  set('MYSQL_DB', database);

  try {
    fs.writeFileSync(envPath, envContents.trim() + '\n', 'utf-8');
  } catch (e) {
    throw new Error('Failed to write .env file: ' + String(e));
  }

  // try to connect using provided details and create users table + admin
  const conn = await createConnection(buildConnectionOptions(dbCfg) as any);

  // create users table if not exists (simple schema compatible with existing storage)
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'client',
      email VARCHAR(255),
      passwordChangeRequired TINYINT(1) NOT NULL DEFAULT 1,
      theme VARCHAR(100) NOT NULL DEFAULT 'original',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  // check if admin exists
  const [r] = await conn.query(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`);
  const adminExists = Array.isArray(r) && (r as any).length > 0;
  if (!adminExists) {
    const id = cryptoId();
    const hashed = await bcrypt.hash(admin.password, 10);
    await conn.execute(`INSERT INTO users (id, username, password, role, email) VALUES (?, ?, ?, 'admin', ?);`, [id, admin.username, hashed, admin.email || '']);
  }

  await conn.end();
  // After creating the minimal users table and admin, reinitialize the server storage so it switches
  // to the newly-configured MySQL connection and runs the full DDL/bootstrapping.
  let tableResults: any[] = [];
  try {
    // call storage helper to reinitialize module-level DB and run DDL
    const { reinitializeDatabase } = await import('./storage');
    const reinit = await reinitializeDatabase({ host: dbCfg.host, port: dbCfg.port, user: dbCfg.user, password: dbCfg.password, database: dbCfg.database });
    if (reinit && (reinit as any).results) tableResults = (reinit as any).results;
  } catch (e) {
    console.error('Failed to reinitialize storage after setup:', e);
  }

  return { wroteEnv: true, adminCreated: !adminExists, tables: tableResults };
}

function cryptoId() {
  // small helper to generate RFC4122 v4-like id without pulling crypto import in this file
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
