"use client";

import { useState } from "react";

interface Props {
  onResult: (sessionId: string, report: object, paid: boolean) => void;
}

export default function ResumeForm({ onResult }: Props) {
  const [resume, setResume] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume, jobDescription }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Analysis failed");
      }

      const data = await res.json();
      onResult(data.sessionId, data.report, data.paid);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Resume
        </label>
        <textarea
          className="w-full h-48 p-3 border border-gray-300 rounded-lg resize-none text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Paste your resume here..."
          value={resume}
          onChange={(e) => setResume(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Job Description
        </label>
        <textarea
          className="w-full h-48 p-3 border border-gray-300 rounded-lg resize-none text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Paste the job description here..."
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          required
        />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Analysing..." : "Analyse"}
      </button>
    </form>
  );
}
