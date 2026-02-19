import OpenAI from "openai";

function getClient() {
  return new OpenAI({
    apiKey: process.env.FIREWORKS_API_KEY,
    baseURL: "https://api.fireworks.ai/inference/v1",
  });
}

export interface AnalysisResult {
  score: number;
  summary: string;
  keywordsMatched: string[];
  keywordsMissing: string[];
  strengths: string[];
  improvements: string[];
  detailedBreakdown: {
    technical: string;
    experience: string;
    education: string;
  };
}

export async function analyseResume(
  resume: string,
  jobDescription: string
): Promise<AnalysisResult> {
  const prompt = `You are an expert resume analyst. Analyse the following resume against the job description and return a structured JSON report.

Resume:
${resume}

Job Description:
${jobDescription}

Return ONLY valid JSON matching this exact structure:
{
  "score": <number 0-100>,
  "summary": "<2-3 sentence overall assessment>",
  "keywordsMatched": ["<keyword>", ...],
  "keywordsMissing": ["<keyword>", ...],
  "strengths": ["<strength>", ...],
  "improvements": ["<specific improvement>", ...],
  "detailedBreakdown": {
    "technical": "<paragraph on technical skill match>",
    "experience": "<paragraph on experience relevance>",
    "education": "<paragraph on education fit>"
  }
}`;

  const response = await getClient().chat.completions.create({
    model: "accounts/fireworks/models/deepseek-v3p1",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error("No response from AI");

  return JSON.parse(content) as AnalysisResult;
}
