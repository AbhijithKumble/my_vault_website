import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

interface TaskCandidate {
  taskId: string;
  taskTitle: string;
  projectId: string;
  projectName: string;
  projectSlug: string;
  priority: number;
  isNextAction: boolean;
  estimatedMinutes: number;
  daysUntouched: number;
  totalScore: number;
  reasons: string[];
}

export async function POST(req: Request) {
  const db = getDb();
  let availableMinutes = 60;

  try {
    const body = await req.json();
    if (body.availableMinutes && typeof body.availableMinutes === "number") {
      availableMinutes = body.availableMinutes;
    }
  } catch {
    // defaults to 60 min if no body
  }

  // Get active projects
  const activeProjectsRs = await db.execute("SELECT * FROM projects WHERE status = 'active'");
  const activeProjects = activeProjectsRs.rows as any[];

  if (activeProjects.length === 0) {
    return NextResponse.json({ error: "No active projects found" }, { status: 404 });
  }

  const today = new Date();
  const candidates: TaskCandidate[] = [];

  for (const project of activeProjects) {
    // Find candidate tasks and last log for this project
    const [tasksRs, lastLogRs] = await Promise.all([
      db.execute({
        sql: "SELECT * FROM tasks WHERE project_id = ? AND status != 'done' ORDER BY is_next_action DESC, priority ASC",
        args: [project.id],
      }),
      db.execute({
        sql: "SELECT date FROM daily_logs WHERE project_ids LIKE ? ORDER BY date DESC LIMIT 1",
        args: [`%"${project.id}"%`],
      }),
    ]);

    const tasks = tasksRs.rows as any[];
    if (tasks.length === 0) continue;

    const lastLog = lastLogRs.rows[0] as unknown as { date: string } | undefined;
    let daysUntouched = 3; // Default baseline
    if (lastLog) {
      const logDate = new Date(lastLog.date);
      const diffMs = today.getTime() - logDate.getTime();
      daysUntouched = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    }

    // Only pick the top 1 or 2 candidate tasks per project to score
    for (const task of tasks.slice(0, 2)) {
      let score = 0;
      const reasons: string[] = [];

      // 1. Task Priority score
      if (task.priority === 1) {
        score += 80;
        reasons.push("High priority task (Priority 1)");
      } else if (task.priority === 2) {
        score += 40;
      } else {
        score += 15;
      }

      // 2. Next action status
      if (task.is_next_action === 1) {
        score += 50;
        reasons.push("Designated as the immediate next smallest step");
      }

      // 3. Staleness / Ignored project boost
      if (daysUntouched >= 3) {
        const boost = Math.min(50, daysUntouched * 10);
        score += boost;
        reasons.push(`Project untouched for ${daysUntouched} day(s) (+${boost} pts)`);
      } else if (daysUntouched === 0) {
        score += 15;
        reasons.push("Maintains current working momentum from today");
      }

      // 4. Time estimate fitness
      const est = task.estimated_minutes || 30;
      if (est <= availableMinutes) {
        score += 25;
        reasons.push(`Fits comfortably in your ${availableMinutes} min session (${est} min estimate)`);
      } else {
        score -= 20;
        reasons.push(`Exceeds current session budget (${est}m vs ${availableMinutes}m available)`);
      }

      candidates.push({
        taskId: task.id,
        taskTitle: task.title,
        projectId: project.id,
        projectName: project.name,
        projectSlug: project.slug,
        priority: task.priority,
        isNextAction: task.is_next_action === 1,
        estimatedMinutes: est,
        daysUntouched,
        totalScore: score,
        reasons,
      });
    }
  }

  // Sort descending by score
  candidates.sort((a, b) => b.totalScore - a.totalScore);

  if (candidates.length === 0) {
    return NextResponse.json({
      message: "All tasks in active projects are completed! Time to plan new project milestones.",
      chosenTask: null,
      runnersUp: [],
    });
  }

  const chosen = candidates[0];
  const runnersUp = candidates.slice(1, 4);

  return NextResponse.json({
    chosenTask: chosen,
    runnersUp,
    totalEvaluated: candidates.length,
    availableMinutes,
  });
}
