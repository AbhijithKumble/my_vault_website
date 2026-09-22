import { NextResponse } from "next/server";
import { getDb, syncFtsEntry, removeFtsEntry } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const projectId = searchParams.get("project_id");

  let query = `
    SELECT c.*, p.name as project_name, p.slug as project_slug 
    FROM command_vault c
    LEFT JOIN projects p ON c.project_id = p.id
  `;
  const conditions: string[] = [];
  const params: any[] = [];

  if (category) {
    conditions.push("c.category = ?");
    params.push(category);
  }
  if (projectId) {
    conditions.push("c.project_id = ?");
    params.push(projectId);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  query += " ORDER BY c.last_used DESC, c.created_at DESC";

  const rowsRs = await db.execute({ sql: query, args: params });
  const rows = rowsRs.rows as any[];

  return NextResponse.json({
    commands: rows.map((r) => ({
      ...r,
      tags: JSON.parse((r.tags as string) || "[]"),
    })),
  });
}

export async function POST(req: Request) {
  const db = getDb();
  const body = await req.json();
  const { command, explanation = "", category = "general", project_id = null, tags = [] } = body;

  if (!command?.trim()) {
    return NextResponse.json({ error: "Command is required" }, { status: 400 });
  }

  const id = "cmd-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const now = new Date().toISOString();
  const tagsJson = JSON.stringify(tags);

  await db.execute({
    sql: `
      INSERT INTO command_vault (id, project_id, command, explanation, category, tags, last_used, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [id, project_id || null, command, explanation, category, tagsJson, now, now],
  });

  await syncFtsEntry(
    "command",
    id,
    `${category}: ${command.slice(0, 80)}`,
    `${command} ${explanation}`,
    tagsJson
  );

  return NextResponse.json({ success: true, id });
}

export async function PUT(req: Request) {
  const db = getDb();
  const body = await req.json();
  const { id, command, explanation = "", category = "general", project_id = null, tags = [] } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const existingRs = await db.execute({
    sql: "SELECT * FROM command_vault WHERE id = ?",
    args: [id],
  });
  const existing = existingRs.rows[0] as any;
  if (!existing) {
    return NextResponse.json({ error: "Command not found" }, { status: 404 });
  }

  const tagsJson = JSON.stringify(tags);

  await db.execute({
    sql: `
      UPDATE command_vault
      SET
        project_id = ?,
        command = COALESCE(?, command),
        explanation = ?,
        category = ?,
        tags = ?
      WHERE id = ?
    `,
    args: [
      project_id !== undefined ? (project_id || null) : existing.project_id,
      command ?? null,
      explanation,
      category,
      tagsJson,
      id,
    ],
  });

  await syncFtsEntry(
    "command",
    id,
    `${category}: ${(command || existing.command).slice(0, 80)}`,
    `${command || existing.command} ${explanation}`,
    tagsJson
  );

  return NextResponse.json({ success: true });
}

export async function PATCH(req: Request) {
  const db = getDb();
  const body = await req.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: "Command id is required" }, { status: 400 });
  }

  const now = new Date().toISOString();
  await db.execute({
    sql: "UPDATE command_vault SET last_used = ? WHERE id = ?",
    args: [now, id],
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  await db.execute({
    sql: "DELETE FROM command_vault WHERE id = ?",
    args: [id],
  });
  await removeFtsEntry("command", id);

  return NextResponse.json({ success: true });
}
