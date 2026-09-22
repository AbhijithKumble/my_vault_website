import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    const today = new Date().toISOString().split("T")[0];

    // Fetch initial summary metrics in parallel
    const [
      todayLogRs,
      activeProjectsRs,
      completedTodayRs,
      recentExperimentsRs,
      recentBugsRs,
      recentNotesRs,
      totalProjectsRs,
      totalExperimentsRs,
      totalBugsRs,
    ] = await Promise.all([
      db.execute({
        sql: "SELECT * FROM daily_logs WHERE date = ?",
        args: [today],
      }),
      db.execute("SELECT * FROM projects WHERE status = 'active' ORDER BY updated_at DESC"),
      db.execute({
        sql: "SELECT count(*) as count FROM tasks WHERE status = 'done' AND completed_at LIKE ?",
        args: [`${today}%`],
      }),
      db.execute(`
        SELECT e.*, p.name as project_name, p.slug as project_slug 
        FROM experiments e 
        LEFT JOIN projects p ON e.project_id = p.id 
        ORDER BY e.exp_number DESC LIMIT 4
      `),
      db.execute(`
        SELECT b.*, p.name as project_name, p.slug as project_slug 
        FROM bugs b 
        LEFT JOIN projects p ON b.project_id = p.id 
        ORDER BY b.bug_number DESC LIMIT 4
      `),
      db.execute(`
        SELECT n.*, p.name as project_name 
        FROM knowledge_notes n 
        LEFT JOIN projects p ON n.project_id = p.id 
        ORDER BY n.updated_at DESC LIMIT 4
      `),
      db.execute("SELECT count(*) as count FROM projects"),
      db.execute("SELECT count(*) as count FROM experiments"),
      db.execute("SELECT count(*) as count FROM bugs"),
    ]);

    const todayLog = todayLogRs.rows[0] as any;
    const activeProjects = activeProjectsRs.rows as any[];
    const completedToday = completedTodayRs.rows[0] as any;
    const recentExperiments = recentExperimentsRs.rows as any[];
    const recentBugs = recentBugsRs.rows as any[];
    const recentNotes = recentNotesRs.rows as any[];
    const totalProjects = totalProjectsRs.rows[0] as any;
    const totalExperiments = totalExperimentsRs.rows[0] as any;
    const totalBugs = totalBugsRs.rows[0] as any;

    // Enrich active projects with their single next action and counts
    const projectsWithActions = await Promise.all(
      activeProjects.map(async (project) => {
        const [nextActionRs, pendingCountRs, totalCountRs] = await Promise.all([
          db.execute({
            sql: "SELECT * FROM tasks WHERE project_id = ? AND is_next_action = 1 AND status != 'done' LIMIT 1",
            args: [project.id],
          }),
          db.execute({
            sql: "SELECT count(*) as count FROM tasks WHERE project_id = ? AND status != 'done'",
            args: [project.id],
          }),
          db.execute({
            sql: "SELECT count(*) as count FROM tasks WHERE project_id = ?",
            args: [project.id],
          }),
        ]);

        const nextAction = nextActionRs.rows[0] as any;
        const pendingCount = pendingCountRs.rows[0] as any;
        const totalCount = totalCountRs.rows[0] as any;

        return {
          ...project,
          tags: JSON.parse((project.tags as string) || "[]"),
          next_action: nextAction || null,
          pending_tasks: Number(pendingCount?.count || 0),
          total_tasks: Number(totalCount?.count || 0),
        };
      })
    );

    return NextResponse.json({
      today,
      todayLog: todayLog
        ? { ...todayLog, project_ids: JSON.parse((todayLog.project_ids as string) || "[]") }
        : null,
      projects: projectsWithActions,
      completedTodayCount: Number(completedToday?.count || 0),
      recentExperiments: recentExperiments.map((e) => ({
        ...e,
        tags: JSON.parse((e.tags as string) || "[]"),
      })),
      recentBugs: recentBugs.map((b) => ({
        ...b,
        tags: JSON.parse((b.tags as string) || "[]"),
      })),
      recentNotes: recentNotes.map((n) => ({
        ...n,
        tags: JSON.parse((n.tags as string) || "[]"),
      })),
      stats: {
        activeProjectsCount: activeProjects.length,
        totalProjects: Number(totalProjects?.count || 0),
        totalExperiments: Number(totalExperiments?.count || 0),
        totalBugs: Number(totalBugs?.count || 0),
      },
    });
  } catch (error: any) {
    console.error("[API Error] /api/cockpit/summary:", error);
    return NextResponse.json(
      {
        error: error?.message || "Failed to load cockpit summary",
        hint: "Check that TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are set in Cloudflare Dashboard (Settings -> Variables and Secrets).",
      },
      { status: 500 }
    );
  }
}
