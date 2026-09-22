import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  const ideasRs = await db.execute("SELECT * FROM ideas ORDER BY created_at DESC");
  return NextResponse.json({ ideas: ideasRs.rows });
}

export async function POST(req: Request) {
  const db = getDb();
  const body = await req.json();
  const { title, notes = "", status = "inbox" } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Idea title is required" }, { status: 400 });
  }

  const id = "idea-" + Date.now().toString(36);
  const now = new Date().toISOString();

  await db.execute({
    sql: `
      INSERT INTO ideas (id, title, notes, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    args: [id, title, notes, status, now, now],
  });

  return NextResponse.json({ success: true, id });
}

export async function PATCH(req: Request) {
  const db = getDb();
  const body = await req.json();
  const { id, status, title, notes } = body;

  if (!id) {
    return NextResponse.json({ error: "Idea id is required" }, { status: 400 });
  }

  const now = new Date().toISOString();
  await db.execute({
    sql: `
      UPDATE ideas 
      SET 
        status = COALESCE(?, status),
        title = COALESCE(?, title),
        notes = COALESCE(?, notes),
        updated_at = ?
      WHERE id = ?
    `,
    args: [status ?? null, title ?? null, notes ?? null, now, id],
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
    sql: "DELETE FROM ideas WHERE id = ?",
    args: [id],
  });

  return NextResponse.json({ success: true });
}
