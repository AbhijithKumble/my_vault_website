import { NextResponse } from "next/server";
import { getDb, syncFtsEntry, removeFtsEntry } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");

  if (date) {
    const logRs = await db.execute({
      sql: "SELECT * FROM daily_logs WHERE date = ?",
      args: [date],
    });
    const log = logRs.rows[0] as any;
    if (!log) {
      return NextResponse.json({ log: null });
    }
    return NextResponse.json({
      log: {
        ...log,
        project_ids: JSON.parse((log.project_ids as string) || "[]"),
      },
    });
  }

  // Get recent logs and projects
  const [logsRs, projectsRs] = await Promise.all([
    db.execute("SELECT * FROM daily_logs ORDER BY date DESC LIMIT 30"),
    db.execute("SELECT id, name, slug FROM projects"),
  ]);

  const logs = logsRs.rows as any[];
  const projects = projectsRs.rows as any[];
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  const parsed = logs.map((l) => {
    const projIds = JSON.parse((l.project_ids as string) || "[]");
    return {
      ...l,
      project_ids: projIds,
      projects: projIds.map((id: string) => projectMap.get(id)).filter(Boolean),
    };
  });

  return NextResponse.json({ logs: parsed });
}

export async function POST(req: Request) {
  const db = getDb();
  const body = await req.json();
  const {
    date = new Date().toISOString().split("T")[0],
    project_ids = [],
    today_goal = "",
    what_did = "",
    what_learned = "",
    blockers = "",
    tomorrow_plan = "",
    notes = "",
  } = body;

  const now = new Date().toISOString();
  const existingRs = await db.execute({
    sql: "SELECT id FROM daily_logs WHERE date = ?",
    args: [date],
  });
  const existing = existingRs.rows[0] as any;

  let logId = existing?.id;
  const projectIdsJson = JSON.stringify(project_ids);

  if (existing) {
    await db.execute({
      sql: `
        UPDATE daily_logs 
        SET project_ids = ?, today_goal = ?, what_did = ?, what_learned = ?, blockers = ?, tomorrow_plan = ?, notes = ?, updated_at = ?
        WHERE id = ?
      `,
      args: [projectIdsJson, today_goal, what_did, what_learned, blockers, tomorrow_plan, notes, now, existing.id],
    });
  } else {
    logId = "daily-" + date;
    await db.execute({
      sql: `
        INSERT INTO daily_logs (id, date, project_ids, today_goal, what_did, what_learned, blockers, tomorrow_plan, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [logId, date, projectIdsJson, today_goal, what_did, what_learned, blockers, tomorrow_plan, notes, now, now],
    });
  }

  // Update FTS Index
  await syncFtsEntry(
    "daily_log",
    logId,
    `Daily Log: ${date}`,
    `${today_goal} ${what_did} ${what_learned} ${blockers} ${tomorrow_plan} ${notes}`,
    "[]"
  );

  return NextResponse.json({ success: true, id: logId });
}

export async function DELETE(req: Request) {
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const date = searchParams.get("date");

  if (!id && !date) {
    return NextResponse.json({ error: "Log id or date is required" }, { status: 400 });
  }

  let logId = id;
  if (!logId && date) {
    const rowRs = await db.execute({
      sql: "SELECT id FROM daily_logs WHERE date = ?",
      args: [date],
    });
    logId = rowRs.rows[0]?.id as string;
  }

  if (logId) {
    await db.execute({
      sql: "DELETE FROM daily_logs WHERE id = ?",
      args: [logId],
    });
    await removeFtsEntry("daily_log", logId);
  }

  return NextResponse.json({ success: true });
}
