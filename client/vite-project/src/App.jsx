import React, { useState } from "react";

export default function App() {
  const [file, setFile] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]); // single file
  };

  const handleUpload = async () => {
    if (!file) return alert("Please select a file!");
    const formData = new FormData();
    formData.append("file", file); // must match backend parameter

    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8001/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error("Error analyzing document:", err);
      alert("Upload failed!");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white flex flex-col items-center px-6 py-10">
      {/* Header */}
      <header className="mb-12 text-center">
        <h1 className="text-6xl font-extrabold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-pulse drop-shadow-[0_0_20px_rgba(236,72,153,0.8)]">
          ⚡ LexVision AI ⚖️
        </h1>
        <p className="mt-3 text-lg text-gray-300 tracking-wide">
          Upload a legal PDF & let AI analyze it with style ✨
        </p>
      </header>

      {/* Upload Section */}
      <div className="w-full max-w-2xl backdrop-blur-md bg-white/10 border border-white/20 rounded-3xl p-10 shadow-2xl text-center">
        <input
          type="file"
          onChange={handleFileChange}
          className="mb-6 text-gray-300 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-pink-500 file:to-purple-500 file:text-white hover:file:opacity-80"
        />
        <button
          onClick={handleUpload}
          disabled={loading}
          className="px-8 py-3 rounded-full font-bold bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 shadow-[0_0_20px_rgba(59,130,246,0.8)] hover:scale-105 transition-transform"
        >
          {loading ? "⏳ Analyzing..." : "🚀 Upload & Analyze"}
        </button>

        {file && (
          <p className="mt-4 text-gray-300 text-sm border-b border-gray-700 pb-1">
            📂 {file.name}
          </p>
        )}
      </div>

      {/* Results Section */}
      {results && (
        <div className="mt-12 w-full max-w-4xl grid gap-6 md:grid-cols-2">
          {/* Main Result */}
          <div className="bg-gradient-to-br from-green-500/20 to-green-900/40 border border-green-400 rounded-2xl p-6 shadow-lg hover:scale-105 transition">
            <h2 className="font-bold text-green-300 mb-2">✅ Main Analysis</h2>
            <p className="text-gray-200">{results.main}</p>
          </div>

          {/* Summary */}
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-900/40 border border-blue-400 rounded-2xl p-6 shadow-lg hover:scale-105 transition">
            <h2 className="font-bold text-blue-300 mb-2">📄 Summary</h2>
            <p className="text-gray-200">{results.summary}</p>
          </div>

          {/* Comparison */}
          <div className="md:col-span-2 bg-gradient-to-br from-yellow-500/20 to-yellow-900/40 border border-yellow-400 rounded-2xl p-6 shadow-lg hover:scale-105 transition">
            <h2 className="font-bold text-yellow-300 mb-2">⚖️ Comparison</h2>
            <p className="text-gray-200">{results.comparison}</p>
          </div>
        </div>
      )}
    </div>
  );
}
