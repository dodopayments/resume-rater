"use client";

import { useState } from "react";
import ResumeForm from "@/components/ResumeForm";
import ReportCard from "@/components/ReportCard";

export default function Home() {
  const [result, setResult] = useState<{
    sessionId: string;
    report: object;
    paid: boolean;
  } | null>(null);

  function handleResult(sessionId: string, report: object, paid: boolean) {
    setResult({ sessionId, report, paid });
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Resume Rater</h1>
          <p className="text-gray-500 mt-2">
            Paste your resume and a job description to see how well you match.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {!result ? (
            <ResumeForm onResult={handleResult} />
          ) : (
            <div className="space-y-4">
              <ReportCard
                sessionId={result.sessionId}
                report={result.report as never}
                paid={result.paid}
              />
              <button
                onClick={() => setResult(null)}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Analyse another resume
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
