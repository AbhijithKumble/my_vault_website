import { NextResponse } from "next/server";
import { getDb, syncFtsEntry } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  let query = "SELECT * FROM projects";
  const params: any[] = [];
  if (status) {
    query += " WHERE status = ?";
    params.push(status);
  }
  query += " ORDER BY status = 'active' DESC, updated_at DESC";

  const projectsRs = await db.execute({ sql: query, args: params });
  const projects = projectsRs.rows as any[];

  // Attach counts for each project
  const enriched = await Promise.all(
    projects.map(async (p) => {
      const [taskStatsRs, expCountRs, nextActionRs] = await Promise.all([
        db.execute({
          sql: "SELECT count(*) as total, sum(case when status = 'done' then 1 else 0 end) as done FROM tasks WHERE project_id = ?",
          args: [p.id],
        }),
        db.execute({
          sql: "SELECT count(*) as count FROM experiments WHERE project_id = ?",
          args: [p.id],
        }),
        db.execute({
          sql: "SELECT * FROM tasks WHERE project_id = ? AND is_next_action = 1 AND status != 'done' LIMIT 1",
          args: [p.id],
        }),
      ]);

      const taskStats = taskStatsRs.rows[0] as any;
      const expCount = expCountRs.rows[0] as any;
      const nextAction = nextActionRs.rows[0] as any;

      return {
        ...p,
        tags: JSON.parse((p.tags as string) || "[]"),
        next_action: nextAction || null,
        total_tasks: Number(taskStats?.total || 0),
        done_tasks: Number(taskStats?.done || 0),
        experiment_count: Number(expCount?.count || 0),
      };
    })
  );

  return NextResponse.json({ projects: enriched });
}

export async function POST(req: Request) {
  const db = getDb();
  const body = await req.json();
  const { name, goal = "", why = "", current_problem = "", architecture = "", tags = [], status = "active" } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Project name is required" }, { status: 400 });
  }

  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const id = "proj-" + slug + "-" + Date.now().toString(36);
  const now = new Date().toISOString();
  const tagsJson = JSON.stringify(tags);

  await db.execute({
    sql: `
      INSERT INTO projects (id, slug, name, status, goal, why, current_problem, architecture, tags, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [id, slug, name, status, goal, why, current_problem, architecture, tagsJson, now, now],
  });

  await syncFtsEntry(
    "project",
    id,
    name,
    `${goal} ${why} ${current_problem} ${architecture}`,
    tagsJson
  );

  return NextResponse.json({ success: true, id, slug });
}
