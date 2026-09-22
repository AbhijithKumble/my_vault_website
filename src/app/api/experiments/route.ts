import { NextResponse } from "next/server";
import { getDb, syncFtsEntry, removeFtsEntry } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("project_id");

  let query = `
    SELECT e.*, p.name as project_name, p.slug as project_slug 
    FROM experiments e 
    LEFT JOIN projects p ON e.project_id = p.id
  `;
  const params: any[] = [];

  if (projectId) {
    query += " WHERE e.project_id = ?";
    params.push(projectId);
  }

  query += " ORDER BY e.exp_number DESC";

  const rowsRs = await db.execute({ sql: query, args: params });
  const rows = rowsRs.rows as any[];

  return NextResponse.json({
    experiments: rows.map((r) => ({
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
    question,
    hypothesis = "",
    setup = "",
    command = "",
    result = "",
    observation = "",
    conclusion = "",
    next_experiment = "",
    tags = [],
  } = body;

  if (!question?.trim()) {
    return NextResponse.json({ error: "Experiment question is required" }, { status: 400 });
  }

  // Get next experiment number
  const maxRowRs = await db.execute("SELECT MAX(exp_number) as max_num FROM experiments");
  const maxRow = maxRowRs.rows[0] as any;
  const exp_number = Number(maxRow?.max_num || 0) + 1;

  const id = "exp-" + exp_number + "-" + Date.now().toString(36);
  const now = new Date().toISOString();
  const tagsJson = JSON.stringify(tags);

  await db.execute({
    sql: `
      INSERT INTO experiments (id, exp_number, project_id, question, hypothesis, setup, command, result, observation, conclusion, next_experiment, tags, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      id,
      exp_number,
      project_id || null,
      question,
      hypothesis,
      setup,
      command,
      result,
      observation,
      conclusion,
      next_experiment,
      tagsJson,
      now,
      now,
    ],
  });

  await syncFtsEntry(
    "experiment",
    id,
    `EXP #${exp_number}: ${question}`,
    `${hypothesis} ${setup} ${command} ${result} ${observation} ${conclusion} ${next_experiment}`,
    tagsJson
  );

  return NextResponse.json({ success: true, id, exp_number });
}

export async function PUT(req: Request) {
  const db = getDb();
  const body = await req.json();
  const {
    id,
    project_id,
    question,
    hypothesis = "",
    setup = "",
    command = "",
    result = "",
    observation = "",
    conclusion = "",
    next_experiment = "",
    tags = [],
  } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const existingRs = await db.execute({
    sql: "SELECT * FROM experiments WHERE id = ?",
    args: [id],
  });
  const existing = existingRs.rows[0] as any;
  if (!existing) {
    return NextResponse.json({ error: "Experiment not found" }, { status: 404 });
  }

  const now = new Date().toISOString();
  const tagsJson = JSON.stringify(tags);

  await db.execute({
    sql: `
      UPDATE experiments
      SET
        project_id = ?,
        question = COALESCE(?, question),
        hypothesis = ?,
        setup = ?,
        command = ?,
        result = ?,
        observation = ?,
        conclusion = ?,
        next_experiment = ?,
        tags = ?,
        updated_at = ?
      WHERE id = ?
    `,
    args: [
      project_id !== undefined ? (project_id || null) : existing.project_id,
      question ?? null,
      hypothesis,
      setup,
      command,
      result,
      observation,
      conclusion,
      next_experiment,
      tagsJson,
      now,
      id,
    ],
  });

  await syncFtsEntry(
    "experiment",
    id,
    `EXP #${existing.exp_number}: ${question || existing.question}`,
    `${hypothesis} ${setup} ${command} ${result} ${observation} ${conclusion} ${next_experiment}`,
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
    sql: "DELETE FROM experiments WHERE id = ?",
    args: [id],
  });
  await removeFtsEntry("experiment", id);

  return NextResponse.json({ success: true });
}
