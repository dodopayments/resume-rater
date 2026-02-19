import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const name = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  if (name.endsWith(".pdf")) {
    const data = await pdfParse(buffer);
    const text = data.text.trim();

    if (data.numpages > 0 && text.length < 30) {
      return NextResponse.json(
        {
          error:
            "This PDF appears to be image-based (scanned). Text cannot be extracted. Please use a text-based PDF.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({ text });
  }

  if (name.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value.trim();

    if (!text) {
      return NextResponse.json(
        { error: "Could not extract text from this document." },
        { status: 422 }
      );
    }

    return NextResponse.json({ text });
  }

  return NextResponse.json(
    { error: "Unsupported file type. Please upload a PDF or DOCX file." },
    { status: 400 }
  );
}
