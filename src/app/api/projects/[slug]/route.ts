import { NextResponse } from "next/server";
import { getDb, syncFtsEntry, removeFtsEntry } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params;
  const db = getDb();
  const slug = params.slug;

  const projectRs = await db.execute({
    sql: "SELECT * FROM projects WHERE slug = ?",
    args: [slug],
  });
  const project = projectRs.rows[0] as any;
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Related data in parallel
  const [tasksRs, experimentsRs, bugsRs, decisionsRs, commandsRs, notesRs] = await Promise.all([
    db.execute({
      sql: "SELECT * FROM tasks WHERE project_id = ? ORDER BY is_next_action DESC, status = 'done' ASC, priority ASC",
      args: [project.id],
    }),
    db.execute({
      sql: "SELECT * FROM experiments WHERE project_id = ? ORDER BY exp_number DESC",
      args: [project.id],
    }),
    db.execute({
      sql: "SELECT * FROM bugs WHERE project_id = ? ORDER BY bug_number DESC",
      args: [project.id],
    }),
    db.execute({
      sql: "SELECT * FROM decisions WHERE project_id = ? ORDER BY dec_number DESC",
      args: [project.id],
    }),
    db.execute({
      sql: "SELECT * FROM command_vault WHERE project_id = ? ORDER BY created_at DESC",
      args: [project.id],
    }),
    db.execute({
      sql: "SELECT * FROM knowledge_notes WHERE project_id = ? ORDER BY updated_at DESC",
      args: [project.id],
    }),
  ]);

  return NextResponse.json({
    project: {
      ...project,
      tags: JSON.parse((project.tags as string) || "[]"),
    },
    tasks: tasksRs.rows,
    experiments: experimentsRs.rows.map((e: any) => ({ ...e, tags: JSON.parse((e.tags as string) || "[]") })),
    bugs: bugsRs.rows.map((b: any) => ({ ...b, tags: JSON.parse((b.tags as string) || "[]") })),
    decisions: decisionsRs.rows,
    commands: commandsRs.rows.map((c: any) => ({ ...c, tags: JSON.parse((c.tags as string) || "[]") })),
    notes: notesRs.rows.map((n: any) => ({ ...n, tags: JSON.parse((n.tags as string) || "[]") })),
  });
}

export async function PUT(
  req: Request,
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params;
  const db = getDb();
  const slug = params.slug;

  const projectRs = await db.execute({
    sql: "SELECT id FROM projects WHERE slug = ?",
    args: [slug],
  });
  const project = projectRs.rows[0] as any;
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const body = await req.json();
  const { name, goal, why, current_problem, architecture, status, tags } = body;
  const now = new Date().toISOString();
  const tagsJson = tags ? JSON.stringify(tags) : undefined;

  await db.execute({
    sql: `
      UPDATE projects 
      SET 
        name = COALESCE(?, name),
        goal = COALESCE(?, goal),
        why = COALESCE(?, why),
        current_problem = COALESCE(?, current_problem),
        architecture = COALESCE(?, architecture),
        status = COALESCE(?, status),
        tags = COALESCE(?, tags),
        updated_at = ?
      WHERE id = ?
    `,
    args: [
      name ?? null,
      goal ?? null,
      why ?? null,
      current_problem ?? null,
      architecture ?? null,
      status ?? null,
      tagsJson ?? null,
      now,
      project.id,
    ],
  });

  const updatedRs = await db.execute({
    sql: "SELECT * FROM projects WHERE id = ?",
    args: [project.id],
  });
  const updated = updatedRs.rows[0] as any;

  await syncFtsEntry(
    "project",
    project.id,
    updated.name,
    `${updated.goal} ${updated.why} ${updated.current_problem} ${updated.architecture}`,
    updated.tags
  );

  return NextResponse.json({ success: true, project: updated });
}

export async function DELETE(
  _req: Request,
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params;
  const db = getDb();
  const slug = params.slug;

  const projectRs = await db.execute({
    sql: "SELECT id FROM projects WHERE slug = ?",
    args: [slug],
  });
  const project = projectRs.rows[0] as any;
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  await db.batch(
    [
      { sql: "DELETE FROM tasks WHERE project_id = ?", args: [project.id] },
      { sql: "UPDATE experiments SET project_id = NULL WHERE project_id = ?", args: [project.id] },
      { sql: "UPDATE bugs SET project_id = NULL WHERE project_id = ?", args: [project.id] },
      { sql: "UPDATE decisions SET project_id = NULL WHERE project_id = ?", args: [project.id] },
      { sql: "UPDATE command_vault SET project_id = NULL WHERE project_id = ?", args: [project.id] },
      { sql: "UPDATE knowledge_notes SET project_id = NULL WHERE project_id = ?", args: [project.id] },
      { sql: "DELETE FROM projects WHERE id = ?", args: [project.id] },
    ],
    "write"
  );

  await removeFtsEntry("project", project.id);

  return NextResponse.json({ success: true });
}
