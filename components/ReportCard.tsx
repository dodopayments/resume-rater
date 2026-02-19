"use client";

import { useState } from "react";

interface PartialReport {
  score: number;
  summary: string;
  keywordsMatched: string[];
  keywordsMissing: string[];
}

interface FullReport extends PartialReport {
  strengths: string[];
  improvements: string[];
  detailedBreakdown: {
    technical: string;
    experience: string;
    education: string;
  };
}

interface Props {
  sessionId: string;
  report: PartialReport | FullReport;
  paid: boolean;
}

function isFullReport(r: PartialReport | FullReport): r is FullReport {
  return "strengths" in r;
}

export default function ReportCard({ sessionId, report, paid }: Props) {
  const [unlocking, setUnlocking] = useState(false);

  async function handleUnlock() {
    setUnlocking(true);
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    const data = await res.json();
    if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
    } else {
      alert("Checkout not available yet.");
      setUnlocking(false);
    }
  }

  const scoreColor =
    report.score >= 75
      ? "text-green-600"
      : report.score >= 50
      ? "text-yellow-600"
      : "text-red-600";

  return (
    <div className="space-y-6">
      {/* Score */}
      <div className="text-center">
        <div className={`text-6xl font-bold ${scoreColor}`}>
          {report.score}
        </div>
        <div className="text-gray-500 text-sm mt-1">Match Score / 100</div>
      </div>

      {/* Summary */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-1">Summary</h3>
        <p className="text-gray-600 text-sm">{report.summary}</p>
      </div>

      {/* Keywords */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold text-gray-800 mb-2 text-sm">
            Keywords Matched
          </h3>
          <div className="flex flex-wrap gap-1">
            {report.keywordsMatched.map((k) => (
              <span
                key={k}
                className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs"
              >
                {k}
              </span>
            ))}
            {!paid && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-400 rounded text-xs">
                +more
              </span>
            )}
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-gray-800 mb-2 text-sm">
            Keywords Missing
          </h3>
          <div className="flex flex-wrap gap-1">
            {report.keywordsMissing.map((k) => (
              <span
                key={k}
                className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs"
              >
                {k}
              </span>
            ))}
            {!paid && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-400 rounded text-xs">
                +more
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Full report (paid only) */}
      {paid && isFullReport(report) && (
        <>
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Strengths</h3>
            <ul className="list-disc list-inside space-y-1">
              {report.strengths.map((s, i) => (
                <li key={i} className="text-gray-600 text-sm">
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-2">
              Improvements
            </h3>
            <ul className="list-disc list-inside space-y-1">
              {report.improvements.map((imp, i) => (
                <li key={i} className="text-gray-600 text-sm">
                  {imp}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-2">
              Detailed Breakdown
            </h3>
            <div className="space-y-3">
              {(
                [
                  ["Technical", report.detailedBreakdown.technical],
                  ["Experience", report.detailedBreakdown.experience],
                  ["Education", report.detailedBreakdown.education],
                ] as [string, string][]
              ).map(([label, text]) => (
                <div key={label}>
                  <div className="text-sm font-medium text-gray-700">
                    {label}
                  </div>
                  <p className="text-gray-600 text-sm">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Paywall */}
      {!paid && (
        <div className="border-t pt-4 text-center">
          <p className="text-gray-500 text-sm mb-3">
            Get the full breakdown: all keywords, strengths, improvements, and
            detailed analysis.
          </p>
          <button
            onClick={handleUnlock}
            disabled={unlocking}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {unlocking ? "Redirecting..." : "Unlock Full Report - $3"}
          </button>
        </div>
      )}
    </div>
  );
}
