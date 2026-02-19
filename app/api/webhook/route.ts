import { NextRequest, NextResponse } from "next/server";

// Sentra will implement this route
export async function POST(_req: NextRequest) {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
