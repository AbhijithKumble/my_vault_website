import { createClient, type Client } from "@libsql/client";

// Global cached client for hot reload in development and edge environments
const globalForDb = globalThis as unknown as {
  tursoClient?: Client;
};

export function getDb(): Client {
  if (!globalForDb.tursoClient) {
    const url = process.env.TURSO_DATABASE_URL || "file:data/vault.db";
    const authToken = process.env.TURSO_AUTH_TOKEN;

    globalForDb.tursoClient = createClient({
      url,
      authToken,
    });
  }
  return globalForDb.tursoClient;
}

export const SCHEMA_DDL = `
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    goal TEXT,
    why TEXT,
    current_problem TEXT,
    architecture TEXT,
    tags TEXT DEFAULT '[]',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'todo',
    is_next_action INTEGER NOT NULL DEFAULT 0,
    priority INTEGER NOT NULL DEFAULT 2,
    estimated_minutes INTEGER DEFAULT 30,
    completed_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS daily_logs (
    id TEXT PRIMARY KEY,
    date TEXT UNIQUE NOT NULL,
    project_ids TEXT DEFAULT '[]',
    today_goal TEXT,
    what_did TEXT,
    what_learned TEXT,
    blockers TEXT,
    tomorrow_plan TEXT,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS experiments (
    id TEXT PRIMARY KEY,
    exp_number INTEGER NOT NULL,
    project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
    question TEXT NOT NULL,
    hypothesis TEXT,
    setup TEXT,
    command TEXT,
    result TEXT,
    observation TEXT,
    conclusion TEXT,
    next_experiment TEXT,
    tags TEXT DEFAULT '[]',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS knowledge_notes (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    content TEXT NOT NULL,
    tags TEXT DEFAULT '[]',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS command_vault (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
    command TEXT NOT NULL,
    explanation TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    tags TEXT DEFAULT '[]',
    last_used TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS bugs (
    id TEXT PRIMARY KEY,
    bug_number INTEGER NOT NULL,
    project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    symptoms TEXT,
    tried TEXT,
    root_cause TEXT,
    fix TEXT,
    lesson TEXT,
    tags TEXT DEFAULT '[]',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS decisions (
    id TEXT PRIMARY KEY,
    dec_number INTEGER NOT NULL,
    project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
    decision TEXT NOT NULL,
    alternatives TEXT,
    why TEXT,
    assumptions TEXT,
    expected_result TEXT,
    revisit_date TEXT,
    outcome_assessment TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS ideas (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'inbox',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS hardware (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    specs TEXT,
    status TEXT NOT NULL DEFAULT 'working',
    project_ids TEXT DEFAULT '[]',
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE VIRTUAL TABLE IF NOT EXISTS fts_index USING fts5(
    entity_type,
    entity_id UNINDEXED,
    title,
    content,
    tags,
    tokenize='porter unicode61'
  );
`;

// Full text search helper
export interface SearchResult {
  entity_type: string;
  entity_id: string;
  title: string;
  content: string;
  tags: string;
  rank?: number;
}

export async function searchFts(query: string, limit = 20): Promise<SearchResult[]> {
  const db = getDb();
  const cleaned = query.replace(/[^\w\s-]/g, " ").trim();
  if (!cleaned) return [];

  // Create match phrase (prefix matching on each word)
  const ftsQuery = cleaned
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => `"${word}"*`)
    .join(" AND ");

  try {
    const rs = await db.execute({
      sql: `
        SELECT entity_type, entity_id, title, content, tags, rank
        FROM fts_index
        WHERE fts_index MATCH ?
        ORDER BY rank
        LIMIT ?
      `,
      args: [ftsQuery, limit],
    });
    return rs.rows as unknown as SearchResult[];
  } catch (err) {
    console.error("FTS search error:", err);
    return [];
  }
}

export async function syncFtsEntry(
  entityType: string,
  entityId: string,
  title: string,
  content: string,
  tags: string = "[]"
): Promise<void> {
  const db = getDb();
  try {
    await db.batch([
      {
        sql: "DELETE FROM fts_index WHERE entity_type = ? AND entity_id = ?",
        args: [entityType, entityId],
      },
      {
        sql: "INSERT INTO fts_index (entity_type, entity_id, title, content, tags) VALUES (?, ?, ?, ?, ?)",
        args: [entityType, entityId, title, content, tags],
      },
    ]);
  } catch (err) {
    console.error("Failed to sync FTS entry:", err);
  }
}

export async function removeFtsEntry(entityType: string, entityId: string): Promise<void> {
  const db = getDb();
  try {
    await db.execute({
      sql: "DELETE FROM fts_index WHERE entity_type = ? AND entity_id = ?",
      args: [entityType, entityId],
    });
  } catch (err) {
    console.error("Failed to remove FTS entry:", err);
  }
}
