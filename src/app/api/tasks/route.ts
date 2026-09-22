import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const db = getDb();
  const body = await req.json();
  const {
    project_id,
    title,
    priority = 2,
    is_next_action = false,
    estimated_minutes = 30,
  } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Task title is required" }, { status: 400 });
  }

  const id = "task-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const now = new Date().toISOString();

  // If setting is_next_action to true, clear any other next actions for this project
  if (is_next_action && project_id) {
    await db.execute({
      sql: "UPDATE tasks SET is_next_action = 0 WHERE project_id = ?",
      args: [project_id],
    });
  }

  await db.execute({
    sql: `
      INSERT INTO tasks (id, project_id, title, status, is_next_action, priority, estimated_minutes, created_at, updated_at)
      VALUES (?, ?, ?, 'todo', ?, ?, ?, ?, ?)
    `,
    args: [id, project_id || null, title, is_next_action ? 1 : 0, priority, estimated_minutes, now, now],
  });

  return NextResponse.json({ success: true, id });
}

export async function PATCH(req: Request) {
  const db = getDb();
  const body = await req.json();
  const { id, status, is_next_action, priority, title, estimated_minutes } = body;

  if (!id) {
    return NextResponse.json({ error: "Task id is required" }, { status: 400 });
  }

  const existingRs = await db.execute({
    sql: "SELECT * FROM tasks WHERE id = ?",
    args: [id],
  });
  const existing = existingRs.rows[0] as any;
  if (!existing) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const now = new Date().toISOString();
  let completed_at = existing.completed_at;

  if (status !== undefined) {
    if (status === "done" && existing.status !== "done") {
      completed_at = now;
    } else if (status !== "done") {
      completed_at = null;
    }
  }

  // If this task becomes is_next_action = true, clear previous next action in same project
  if (is_next_action === 1 || is_next_action === true) {
    if (existing.project_id) {
      await db.execute({
        sql: "UPDATE tasks SET is_next_action = 0 WHERE project_id = ?",
        args: [existing.project_id],
      });
    }
  }

  await db.execute({
    sql: `
      UPDATE tasks
      SET
        status = COALESCE(?, status),
        is_next_action = COALESCE(?, is_next_action),
        priority = COALESCE(?, priority),
        title = COALESCE(?, title),
        estimated_minutes = COALESCE(?, estimated_minutes),
        completed_at = ?,
        updated_at = ?
      WHERE id = ?
    `,
    args: [
      status ?? null,
      is_next_action === undefined ? null : is_next_action ? 1 : 0,
      priority ?? null,
      title ?? null,
      estimated_minutes ?? null,
      completed_at ?? null,
      now,
      id,
    ],
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Task id is required" }, { status: 400 });
  }

  await db.execute({
    sql: "DELETE FROM tasks WHERE id = ?",
    args: [id],
  });
  return NextResponse.json({ success: true });
}
