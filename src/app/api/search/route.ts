import { NextResponse } from "next/server";
import { searchFts, getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query || !query.trim()) {
    return NextResponse.json({ results: [] });
  }

  const results = await searchFts(query.trim(), 25);
  const db = getDb();

  // Resolve project slugs for accurate navigation links
  const projectsRs = await db.execute("SELECT id, slug, name FROM projects");
  const projects = projectsRs.rows as any[];
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  const enriched = results.map((r) => {
    let url = "/";
    let badge = r.entity_type;

    switch (r.entity_type) {
      case "project": {
        const p = projectMap.get(r.entity_id);
        url = p ? `/projects/${p.slug}` : "/projects";
        badge = "Project";
        break;
      }
      case "daily_log": {
        const dateMatch = r.title.match(/\d{4}-\d{2}-\d{2}/);
        url = dateMatch ? `/daily?date=${dateMatch[0]}` : "/daily";
        badge = "Daily Log";
        break;
      }
      case "experiment": {
        url = "/experiments";
        badge = "Experiment";
        break;
      }
      case "bug": {
        url = "/bugs";
        badge = "Bug / Problem";
        break;
      }
      case "decision": {
        url = "/decisions";
        badge = "Decision";
        break;
      }
      case "command": {
        url = "/commands";
        badge = "Command";
        break;
      }
      case "note": {
        url = "/knowledge";
        badge = "Knowledge Note";
        break;
      }
    }

    return {
      ...r,
      url,
      badge,
      tags: JSON.parse(r.tags || "[]"),
    };
  });

  return NextResponse.json({ results: enriched, query });
}
