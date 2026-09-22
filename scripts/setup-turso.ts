import { createClient } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";
import { SCHEMA_DDL } from "../src/lib/db";

// Load environment variables from .env.local or .env if present
const envFiles = [".env.local", ".env"];
for (const envFile of envFiles) {
  const envPath = path.join(process.cwd(), envFile);
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const [key, ...vals] = trimmed.split("=");
      const val = vals.join("=").replace(/^["']|["']$/g, "");
      if (key && !process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

async function main() {
  const targetUrl = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!targetUrl) {
    console.error("\x1b[31m[ERROR] TURSO_DATABASE_URL is not set!\x1b[0m");
    console.log("Please create a .env.local file with:");
    console.log("  TURSO_DATABASE_URL=\"libsql://your-db.turso.io\"");
    console.log("  TURSO_AUTH_TOKEN=\"your-turso-token\"\n");
    process.exit(1);
  }

  console.log(`\x1b[36mConnecting to target database: ${targetUrl}...\x1b[0m`);
  const targetDb = createClient({
    url: targetUrl,
    authToken,
  });

  console.log("\x1b[33m[1/3] Initializing schema and FTS5 tables...\x1b[0m");
  await targetDb.executeMultiple(SCHEMA_DDL);
  console.log("\x1b[32m✓ Schema initialized successfully.\x1b[0m");

  const localDbPath = path.join(process.cwd(), "data", "vault.db");
  const hasLocalDb = fs.existsSync(localDbPath);

  if (hasLocalDb && targetUrl !== "file:data/vault.db") {
    console.log("\x1b[33m[2/3] Migrating data from local data/vault.db to Turso...\x1b[0m");
    const localDb = createClient({ url: `file:${localDbPath}` });

    const tables = [
      "projects",
      "tasks",
      "daily_logs",
      "experiments",
      "knowledge_notes",
      "command_vault",
      "bugs",
      "decisions",
      "ideas",
      "hardware",
    ];

    for (const table of tables) {
      try {
        const localRows = await localDb.execute(`SELECT * FROM ${table}`);
        if (localRows.rows.length === 0) continue;

        console.log(`  Migrating ${localRows.rows.length} row(s) from table '${table}'...`);
        const columns = localRows.columns;
        const placeholders = columns.map(() => "?").join(", ");
        const insertSql = `INSERT OR REPLACE INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`;

        const batchStatements = localRows.rows.map((row) => ({
          sql: insertSql,
          args: columns.map((col) => row[col] as any),
        }));

        // Execute in batches of 50 to avoid payload limits
        const chunkSize = 50;
        for (let i = 0; i < batchStatements.length; i += chunkSize) {
          const chunk = batchStatements.slice(i, i + chunkSize);
          await targetDb.batch(chunk, "write");
        }
      } catch (err) {
        console.error(`  Warning: failed to migrate table ${table}:`, err);
      }
    }

    console.log("\x1b[33m[3/3] Synchronizing full-text search index (fts_index)...\x1b[0m");
    await targetDb.execute("DELETE FROM fts_index");

    // Sync projects
    const pRows = await targetDb.execute("SELECT id, name, goal, why, current_problem, architecture, tags FROM projects");
    for (const p of pRows.rows) {
      await targetDb.execute({
        sql: "INSERT INTO fts_index (entity_type, entity_id, title, content, tags) VALUES ('project', ?, ?, ?, ?)",
        args: [
          p.id as string,
          p.name as string,
          `${p.goal || ""} ${p.why || ""} ${p.current_problem || ""} ${p.architecture || ""}`,
          (p.tags as string) || "[]",
        ],
      });
    }

    // Sync daily logs
    const logRows = await targetDb.execute("SELECT id, date, today_goal, what_did, what_learned, blockers, tomorrow_plan, notes FROM daily_logs");
    for (const l of logRows.rows) {
      await targetDb.execute({
        sql: "INSERT INTO fts_index (entity_type, entity_id, title, content, tags) VALUES ('daily_log', ?, ?, ?, '[]')",
        args: [
          l.id as string,
          `Daily Log: ${l.date}`,
          `${l.today_goal || ""} ${l.what_did || ""} ${l.what_learned || ""} ${l.blockers || ""} ${l.tomorrow_plan || ""} ${l.notes || ""}`,
        ],
      });
    }

    // Sync experiments
    const expRows = await targetDb.execute("SELECT id, exp_number, question, hypothesis, setup, command, result, observation, conclusion, next_experiment, tags FROM experiments");
    for (const exp of expRows.rows) {
      await targetDb.execute({
        sql: "INSERT INTO fts_index (entity_type, entity_id, title, content, tags) VALUES ('experiment', ?, ?, ?, ?)",
        args: [
          exp.id as string,
          `EXP #${exp.exp_number}: ${exp.question}`,
          `${exp.hypothesis || ""} ${exp.setup || ""} ${exp.command || ""} ${exp.result || ""} ${exp.observation || ""} ${exp.conclusion || ""} ${exp.next_experiment || ""}`,
          (exp.tags as string) || "[]",
        ],
      });
    }

    // Sync bugs
    const bugRows = await targetDb.execute("SELECT id, bug_number, title, symptoms, tried, root_cause, fix, lesson, tags FROM bugs");
    for (const b of bugRows.rows) {
      await targetDb.execute({
        sql: "INSERT INTO fts_index (entity_type, entity_id, title, content, tags) VALUES ('bug', ?, ?, ?, ?)",
        args: [
          b.id as string,
          `BUG #${b.bug_number}: ${b.title}`,
          `${b.symptoms || ""} ${b.tried || ""} ${b.root_cause || ""} ${b.fix || ""} ${b.lesson || ""}`,
          (b.tags as string) || "[]",
        ],
      });
    }

    // Sync decisions
    const decRows = await targetDb.execute("SELECT id, dec_number, decision, alternatives, why, assumptions, expected_result, outcome_assessment FROM decisions");
    for (const d of decRows.rows) {
      await targetDb.execute({
        sql: "INSERT INTO fts_index (entity_type, entity_id, title, content, tags) VALUES ('decision', ?, ?, ?, '[]')",
        args: [
          d.id as string,
          `DECISION #${d.dec_number}: ${d.decision}`,
          `${d.alternatives || ""} ${d.why || ""} ${d.assumptions || ""} ${d.expected_result || ""} ${d.outcome_assessment || ""}`,
        ],
      });
    }

    // Sync commands
    const cmdRows = await targetDb.execute("SELECT id, category, command, explanation, tags FROM command_vault");
    for (const c of cmdRows.rows) {
      await targetDb.execute({
        sql: "INSERT INTO fts_index (entity_type, entity_id, title, content, tags) VALUES ('command', ?, ?, ?, ?)",
        args: [
          c.id as string,
          `${c.category}: ${((c.command as string) || "").slice(0, 80)}`,
          `${c.command || ""} ${c.explanation || ""}`,
          (c.tags as string) || "[]",
        ],
      });
    }

    // Sync knowledge notes
    const noteRows = await targetDb.execute("SELECT id, title, content, tags FROM knowledge_notes");
    for (const n of noteRows.rows) {
      await targetDb.execute({
        sql: "INSERT INTO fts_index (entity_type, entity_id, title, content, tags) VALUES ('note', ?, ?, ?, ?)",
        args: [n.id as string, n.title as string, (n.content as string) || "", (n.tags as string) || "[]"],
      });
    }

    console.log("\x1b[32m✓ FTS5 Search index synchronized.\x1b[0m");
  } else {
    console.log("\x1b[32m✓ Target database schema ready.\x1b[0m");
  }

  console.log("\n\x1b[32m✨ Turso database setup completed successfully!\x1b[0m\n");
}

main().catch((err) => {
  console.error("\x1b[31mSetup failed:\x1b[0m", err);
  process.exit(1);
});
