import fs from 'fs';
import path from 'path';
import postgres from 'postgres';
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import bcrypt from 'bcryptjs';

type DbConfig = {
  host: string;
  port?: number | string;
  user: string;
  password: string;
  database: string;
};

export function isPostgresConfigured(): boolean {
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://'))) return true;
  if (process.env.POSTGRES_HOST && process.env.POSTGRES_USER && process.env.POSTGRES_DB) return true;
  return false;
}

function buildConnectionString(cfg: DbConfig): string {
  const host = cfg.host;
  const port = cfg.port ? Number(cfg.port) : 5432;
  const user = cfg.user;
  const password = cfg.password;
  const database = cfg.database;
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${encodeURIComponent(database)}`;
}

export async function checkDbAndAdmin(): Promise<{ configured: boolean; canConnect: boolean; adminExists: boolean }> {
  const configured = isPostgresConfigured();
  if (!configured) return { configured: false, canConnect: false, adminExists: false };

  try {
    const host = process.env.POSTGRES_HOST;
    const user = process.env.POSTGRES_USER || '';
    const password = process.env.POSTGRES_PASSWORD || '';
    const database = process.env.POSTGRES_DB || '';
    const port = process.env.POSTGRES_PORT || '5432';

    if (!host || !user || !database) {
      const dbUrl = process.env.DATABASE_URL || '';
      if (!dbUrl.startsWith('postgres')) {
        return { configured: true, canConnect: false, adminExists: false };
      }
    }

    const connectionString = host 
      ? `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${encodeURIComponent(database)}`
      : process.env.DATABASE_URL!;

    const client = postgres(connectionString);

    // check users table and admin
    const tableCheck = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      ) as exists
    `;
    const tableExists = tableCheck[0]?.exists || false;
    
    let adminExists = false;
    if (tableExists) {
      try {
        const adminCheck = await client`SELECT COUNT(*) as cnt FROM users WHERE role = 'admin'`;
        adminExists = Number(adminCheck[0]?.cnt || 0) > 0;
      } catch (e) {
        // ignore
      }
    }

    await client.end();
    return { configured: true, canConnect: true, adminExists };
  } catch (error) {
    console.error('Database connection check failed:', error);
    return { configured: true, canConnect: false, adminExists: false };
  }
}

export async function writeEnvAndCreateAdmin(dbCfg: DbConfig, admin: { username: string; email?: string; password: string }) {
  const envPath = path.join(process.cwd(), '.env');

  const host = dbCfg.host;
  const port = dbCfg.port || 5432;
  const user = dbCfg.user;
  const pass = dbCfg.password;
  const database = dbCfg.database;

  const databaseUrl = `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${port}/${database}`;

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
  set('POSTGRES_HOST', host);
  set('POSTGRES_PORT', String(port));
  set('POSTGRES_USER', user);
  set('POSTGRES_PASSWORD', pass);
  set('POSTGRES_DB', database);

  try {
    fs.writeFileSync(envPath, envContents.trim() + '\n', 'utf-8');
  } catch (e) {
    throw new Error('Failed to write .env file: ' + String(e));
  }

  const connectionString = buildConnectionString(dbCfg);
  const client = postgres(connectionString);

  // create users table if not exists
  await client`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'client',
      email TEXT,
      password_change_required BOOLEAN NOT NULL DEFAULT true,
      theme TEXT NOT NULL DEFAULT 'original',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // check if admin exists
  const adminCheck = await client`SELECT id FROM users WHERE role = 'admin' LIMIT 1`;
  const adminExists = adminCheck.length > 0;
  
  if (!adminExists) {
    const id = cryptoId();
    const hashed = await bcrypt.hash(admin.password, 10);
    await client`
      INSERT INTO users (id, username, password, role, email) 
      VALUES (${id}, ${admin.username}, ${hashed}, 'admin', ${admin.email || ''})
    `;
  }

  await client.end();

  return { wroteEnv: true, adminCreated: !adminExists, tables: [] };
}

function cryptoId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
