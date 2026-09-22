import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  const [rowsRs, projectsRs] = await Promise.all([
    db.execute("SELECT * FROM hardware ORDER BY created_at DESC"),
    db.execute("SELECT id, name, slug FROM projects"),
  ]);

  const rows = rowsRs.rows as any[];
  const projects = projectsRs.rows as any[];
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  const hardware = rows.map((h) => {
    const projIds = JSON.parse((h.project_ids as string) || "[]");
    return {
      ...h,
      project_ids: projIds,
      projects: projIds.map((id: string) => projectMap.get(id)).filter(Boolean),
    };
  });

  return NextResponse.json({ hardware });
}

export async function POST(req: Request) {
  const db = getDb();
  const body = await req.json();
  const { name, specs = "", status = "working", project_ids = [], notes = "" } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Hardware name is required" }, { status: 400 });
  }

  const id = "hw-" + Date.now().toString(36);
  const now = new Date().toISOString();
  const projIdsJson = JSON.stringify(project_ids);

  await db.execute({
    sql: `
      INSERT INTO hardware (id, name, specs, status, project_ids, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [id, name, specs, status, projIdsJson, notes, now, now],
  });

  return NextResponse.json({ success: true, id });
}

export async function PUT(req: Request) {
  const db = getDb();
  const body = await req.json();
  const { id, name, specs = "", status = "working", project_ids = [], notes = "" } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const existingRs = await db.execute({
    sql: "SELECT * FROM hardware WHERE id = ?",
    args: [id],
  });
  const existing = existingRs.rows[0] as any;
  if (!existing) {
    return NextResponse.json({ error: "Hardware not found" }, { status: 404 });
  }

  const now = new Date().toISOString();
  const projIdsJson = JSON.stringify(project_ids);

  await db.execute({
    sql: `
      UPDATE hardware
      SET
        name = COALESCE(?, name),
        specs = ?,
        status = ?,
        project_ids = ?,
        notes = ?,
        updated_at = ?
      WHERE id = ?
    `,
    args: [name ?? null, specs, status, projIdsJson, notes, now, id],
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
    sql: "DELETE FROM hardware WHERE id = ?",
    args: [id],
  });

  return NextResponse.json({ success: true });
}
