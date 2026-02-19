"use client";

import { useRef, useState } from "react";

interface Props {
  onResult: (sessionId: string, report: object, paid: boolean) => void;
}

interface FileState {
  name: string;
  text: string;
  error: string;
  loading: boolean;
}

const emptyFile = (): FileState => ({
  name: "",
  text: "",
  error: "",
  loading: false,
});

function UploadZone({
  label,
  file,
  onChange,
}: {
  label: string;
  file: FileState;
  onChange: (f: FileState) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  async function processFile(raw: File) {
    onChange({ name: raw.name, text: "", error: "", loading: true });

    const form = new FormData();
    form.append("file", raw);

    const res = await fetch("/api/extract", { method: "POST", body: form });
    const data = await res.json();

    if (!res.ok) {
      onChange({ name: raw.name, text: "", error: data.error, loading: false });
    } else {
      onChange({ name: raw.name, text: data.text, error: "", loading: false });
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    processFile(files[0]);
  }

  return (
    <div className="flex flex-col h-full">
      <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`flex-1 min-h-56 flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer transition-colors
          ${dragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"}
          ${file.error ? "border-red-400 bg-red-50" : ""}
          ${file.text ? "border-green-400 bg-green-50" : ""}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {file.loading ? (
          <div className="text-center space-y-2">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gray-500">Extracting text...</p>
          </div>
        ) : file.text ? (
          <div className="text-center space-y-2 px-4">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm font-medium text-green-700 truncate max-w-[180px]">{file.name}</p>
            <p className="text-xs text-gray-500">{file.text.length.toLocaleString()} characters extracted</p>
            <p className="text-xs text-blue-500 underline">Replace file</p>
          </div>
        ) : file.error ? (
          <div className="text-center space-y-2 px-4">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-xs text-red-600 leading-snug">{file.error}</p>
            <p className="text-xs text-blue-500 underline">Try another file</p>
          </div>
        ) : (
          <div className="text-center space-y-2 px-4">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-sm text-gray-600">
              <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-400">PDF or DOCX</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResumeForm({ onResult }: Props) {
  const [resume, setResume] = useState<FileState>(emptyFile());
  const [jd, setJd] = useState<FileState>(emptyFile());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = resume.text && jd.text && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume: resume.text, jobDescription: jd.text }),
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
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-5">
        <UploadZone label="Resume" file={resume} onChange={setResume} />
        <UploadZone label="Job Description" file={jd} onChange={setJd} />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Analysing..." : "Analyse"}
      </button>
    </form>
  );
}
