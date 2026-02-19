import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const result = await pool.query(
    "SELECT analysis, paid FROM sessions WHERE id = $1",
    [id]
  );

  if (result.rowCount === 0) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const { analysis, paid } = result.rows[0];

  if (!paid) {
    return NextResponse.json({
      sessionId: id,
      paid: false,
      report: {
        score: analysis.score,
        summary: analysis.summary,
        keywordsMatched: analysis.keywordsMatched.slice(0, 3),
        keywordsMissing: analysis.keywordsMissing.slice(0, 3),
      },
    });
  }

  return NextResponse.json({ sessionId: id, paid: true, report: analysis });
}
