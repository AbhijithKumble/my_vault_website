import { NextResponse } from "next/server";
import { getDb, syncFtsEntry, removeFtsEntry } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("project_id");

  let query = `
    SELECT b.*, p.name as project_name, p.slug as project_slug
    FROM bugs b
    LEFT JOIN projects p ON b.project_id = p.id
  `;
  const params: any[] = [];

  if (projectId) {
    query += " WHERE b.project_id = ?";
    params.push(projectId);
  }

  query += " ORDER BY b.bug_number DESC";

  const rowsRs = await db.execute({ sql: query, args: params });
  const rows = rowsRs.rows as any[];

  return NextResponse.json({
    bugs: rows.map((r) => ({
      ...r,
      tags: JSON.parse((r.tags as string) || "[]"),
    })),
  });
}

export async function POST(req: Request) {
  const db = getDb();
  const body = await req.json();
  const {
    project_id,
    title,
    symptoms = "",
    tried = "",
    root_cause = "",
    fix = "",
    lesson = "",
    tags = [],
  } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Bug title is required" }, { status: 400 });
  }

  const maxRowRs = await db.execute("SELECT MAX(bug_number) as max_num FROM bugs");
  const maxRow = maxRowRs.rows[0] as any;
  const bug_number = Number(maxRow?.max_num || 0) + 1;

  const id = "bug-" + bug_number + "-" + Date.now().toString(36);
  const now = new Date().toISOString();
  const tagsJson = JSON.stringify(tags);

  await db.execute({
    sql: `
      INSERT INTO bugs (id, bug_number, project_id, title, symptoms, tried, root_cause, fix, lesson, tags, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      id,
      bug_number,
      project_id || null,
      title,
      symptoms,
      tried,
      root_cause,
      fix,
      lesson,
      tagsJson,
      now,
      now,
    ],
  });

  await syncFtsEntry(
    "bug",
    id,
    `BUG #${bug_number}: ${title}`,
    `${symptoms} ${tried} ${root_cause} ${fix} ${lesson}`,
    tagsJson
  );

  return NextResponse.json({ success: true, id, bug_number });
}

export async function PUT(req: Request) {
  const db = getDb();
  const body = await req.json();
  const {
    id,
    project_id,
    title,
    symptoms = "",
    tried = "",
    root_cause = "",
    fix = "",
    lesson = "",
    tags = [],
  } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const existingRs = await db.execute({
    sql: "SELECT * FROM bugs WHERE id = ?",
    args: [id],
  });
  const existing = existingRs.rows[0] as any;
  if (!existing) {
    return NextResponse.json({ error: "Bug not found" }, { status: 404 });
  }

  const now = new Date().toISOString();
  const tagsJson = JSON.stringify(tags);

  await db.execute({
    sql: `
      UPDATE bugs
      SET
        project_id = ?,
        title = COALESCE(?, title),
        symptoms = ?,
        tried = ?,
        root_cause = ?,
        fix = ?,
        lesson = ?,
        tags = ?,
        updated_at = ?
      WHERE id = ?
    `,
    args: [
      project_id !== undefined ? (project_id || null) : existing.project_id,
      title ?? null,
      symptoms,
      tried,
      root_cause,
      fix,
      lesson,
      tagsJson,
      now,
      id,
    ],
  });

  await syncFtsEntry(
    "bug",
    id,
    `BUG #${existing.bug_number}: ${title || existing.title}`,
    `${symptoms} ${tried} ${root_cause} ${fix} ${lesson}`,
    tagsJson
  );

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
    sql: "DELETE FROM bugs WHERE id = ?",
    args: [id],
  });
  await removeFtsEntry("bug", id);

  return NextResponse.json({ success: true });
}
