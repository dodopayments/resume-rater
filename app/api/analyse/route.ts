import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import pool from "@/lib/db";
import { analyseResume } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const { resume, jobDescription } = await req.json();

  if (!resume?.trim() || !jobDescription?.trim()) {
    return NextResponse.json(
      { error: "Resume and job description are required" },
      { status: 400 }
    );
  }

  const sessionId = uuidv4();

  // Store session before analysis so the ID exists immediately
  await pool.query(
    "INSERT INTO sessions (id, resume, job_description) VALUES ($1, $2, $3)",
    [sessionId, resume, jobDescription]
  );

  const analysis = await analyseResume(resume, jobDescription);

  await pool.query("UPDATE sessions SET analysis = $1 WHERE id = $2", [
    JSON.stringify(analysis),
    sessionId,
  ]);

  // Return only the teaser to free users
  return NextResponse.json({
    sessionId,
    paid: false,
    report: {
      score: analysis.score,
      summary: analysis.summary,
      keywordsMatched: analysis.keywordsMatched.slice(0, 3),
      keywordsMissing: analysis.keywordsMissing.slice(0, 3),
    },
  });
}
