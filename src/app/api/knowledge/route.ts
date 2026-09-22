import { NextResponse } from "next/server";
import { getDb, syncFtsEntry, removeFtsEntry } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const projectId = searchParams.get("project_id");

  let query = `
    SELECT n.*, p.name as project_name, p.slug as project_slug 
    FROM knowledge_notes n 
    LEFT JOIN projects p ON n.project_id = p.id
  `;
  const conditions: string[] = [];
  const params: any[] = [];

  if (category) {
    conditions.push("n.category = ?");
    params.push(category);
  }
  if (projectId) {
    conditions.push("n.project_id = ?");
    params.push(projectId);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  query += " ORDER BY n.updated_at DESC";

  const rowsRs = await db.execute({ sql: query, args: params });
  const rows = rowsRs.rows as any[];

  return NextResponse.json({
    notes: rows.map((r) => ({
      ...r,
      tags: JSON.parse((r.tags as string) || "[]"),
    })),
  });
}

export async function POST(req: Request) {
  const db = getDb();
  const body = await req.json();
  const { title, category = "general", project_id = null, content = "", tags = [] } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const id = "note-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const now = new Date().toISOString();
  const tagsJson = JSON.stringify(tags);

  await db.execute({
    sql: `
      INSERT INTO knowledge_notes (id, project_id, title, category, content, tags, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [id, project_id || null, title, category, content, tagsJson, now, now],
  });

  await syncFtsEntry("note", id, title, content, tagsJson);

  return NextResponse.json({ success: true, id });
}

export async function PUT(req: Request) {
  const db = getDb();
  const body = await req.json();
  const { id, title, category = "general", project_id = null, content = "", tags = [] } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const existingRs = await db.execute({
    sql: "SELECT * FROM knowledge_notes WHERE id = ?",
    args: [id],
  });
  const existing = existingRs.rows[0] as any;
  if (!existing) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  const now = new Date().toISOString();
  const tagsJson = JSON.stringify(tags);

  await db.execute({
    sql: `
      UPDATE knowledge_notes
      SET
        project_id = ?,
        title = COALESCE(?, title),
        category = ?,
        content = ?,
        tags = ?,
        updated_at = ?
      WHERE id = ?
    `,
    args: [
      project_id !== undefined ? (project_id || null) : existing.project_id,
      title ?? null,
      category,
      content,
      tagsJson,
      now,
      id,
    ],
  });

  await syncFtsEntry("note", id, title || existing.title, content, tagsJson);

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
    sql: "DELETE FROM knowledge_notes WHERE id = ?",
    args: [id],
  });
  await removeFtsEntry("note", id);

  return NextResponse.json({ success: true });
}
