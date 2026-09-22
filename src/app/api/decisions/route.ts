import { NextResponse } from "next/server";
import { getDb, syncFtsEntry, removeFtsEntry } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("project_id");

  let query = `
    SELECT d.*, p.name as project_name, p.slug as project_slug
    FROM decisions d
    LEFT JOIN projects p ON d.project_id = p.id
  `;
  const params: any[] = [];

  if (projectId) {
    query += " WHERE d.project_id = ?";
    params.push(projectId);
  }

  query += " ORDER BY d.dec_number DESC";

  const rowsRs = await db.execute({ sql: query, args: params });
  const rows = rowsRs.rows as any[];

  return NextResponse.json({ decisions: rows });
}

export async function POST(req: Request) {
  const db = getDb();
  const body = await req.json();
  const {
    project_id,
    decision,
    alternatives = "",
    why = "",
    assumptions = "",
    expected_result = "",
    revisit_date = "",
    outcome_assessment = "",
  } = body;

  if (!decision?.trim()) {
    return NextResponse.json({ error: "Decision statement is required" }, { status: 400 });
  }

  const maxRowRs = await db.execute("SELECT MAX(dec_number) as max_num FROM decisions");
  const maxRow = maxRowRs.rows[0] as any;
  const dec_number = Number(maxRow?.max_num || 0) + 1;

  const id = "dec-" + dec_number + "-" + Date.now().toString(36);
  const now = new Date().toISOString();

  await db.execute({
    sql: `
      INSERT INTO decisions (id, dec_number, project_id, decision, alternatives, why, assumptions, expected_result, revisit_date, outcome_assessment, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      id,
      dec_number,
      project_id || null,
      decision,
      alternatives,
      why,
      assumptions,
      expected_result,
      revisit_date,
      outcome_assessment,
      now,
      now,
    ],
  });

  await syncFtsEntry(
    "decision",
    id,
    `DECISION #${dec_number}: ${decision}`,
    `${alternatives} ${why} ${assumptions} ${expected_result} ${outcome_assessment}`,
    "[]"
  );

  return NextResponse.json({ success: true, id, dec_number });
}

export async function PUT(req: Request) {
  const db = getDb();
  const body = await req.json();
  const {
    id,
    project_id,
    decision,
    alternatives = "",
    why = "",
    assumptions = "",
    expected_result = "",
    revisit_date = "",
    outcome_assessment = "",
  } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const existingRs = await db.execute({
    sql: "SELECT * FROM decisions WHERE id = ?",
    args: [id],
  });
  const existing = existingRs.rows[0] as any;
  if (!existing) {
    return NextResponse.json({ error: "Decision not found" }, { status: 404 });
  }

  const now = new Date().toISOString();

  await db.execute({
    sql: `
      UPDATE decisions
      SET
        project_id = ?,
        decision = COALESCE(?, decision),
        alternatives = ?,
        why = ?,
        assumptions = ?,
        expected_result = ?,
        revisit_date = ?,
        outcome_assessment = ?,
        updated_at = ?
      WHERE id = ?
    `,
    args: [
      project_id !== undefined ? (project_id || null) : existing.project_id,
      decision ?? null,
      alternatives,
      why,
      assumptions,
      expected_result,
      revisit_date,
      outcome_assessment,
      now,
      id,
    ],
  });

  await syncFtsEntry(
    "decision",
    id,
    `DECISION #${existing.dec_number}: ${decision || existing.decision}`,
    `${alternatives} ${why} ${assumptions} ${expected_result} ${outcome_assessment}`,
    "[]"
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
    sql: "DELETE FROM decisions WHERE id = ?",
    args: [id],
  });
  await removeFtsEntry("decision", id);

  return NextResponse.json({ success: true });
}
