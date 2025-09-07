import React, { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

export default function App() {
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [whatIfInput, setWhatIfInput] = useState("");
  const [whatIfResponse, setWhatIfResponse] = useState(null);
  const [whatIfLoading, setWhatIfLoading] = useState(false);
  const [language, setLanguage] = useState("English");
  const [mode, setMode] = useState("summarize"); // summarize or compare
  const [summaryMode, setSummaryMode] = useState("concise"); // concise or detailed

  // Change to your Render backend URL after deploy
  const API_BASE = "";

  const handleFileChange = (e, fileNumber) => {
    if (fileNumber === 1) setFile1(e.target.files[0]);
    if (fileNumber === 2) setFile2(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file1 || (mode === "compare" && !file2)) return alert("Please select required file(s)!");
    const formData = new FormData();
    formData.append("file1", file1);
    if (mode === "compare") formData.append("file2", file2);
    formData.append("language", language);
    formData.append("summaryMode", summaryMode); // send concise/detailed to backend

    setLoading(true);
    try {
      const resp = await fetch(`/analyze`, {
        method: "POST",
        body: formData,
      });
      if (!resp.ok) {
        const txt = await resp.text().catch(() => "");
        throw new Error(`Server returned ${resp.status} ${txt}`);
      }
      const data = await resp.json();
      /**
       * Backend returns:
       * - For compare: summary1, summary2, comparison (array of {aspect, doc1, doc2}), favorability
       * - For single: summary, comparison (array), timeline (string)
       */
      // Normalize into fields our UI expects:
      if (mode === "compare") {
        // create a table-friendly structure from comparison array
        const comparisonArr = Array.isArray(data.comparison) ? data.comparison : [];
        const tableRows = comparisonArr.map((c) => {
          // c expected shape: { aspect: "Aspect name", doc1: "...", doc2: "..." }
          return {
            feature: c.aspect || c.name || "Aspect",
            file1: c.doc1 || c.left || c.value1 || "",
            file2: c.doc2 || c.right || c.value2 || "",
          };
        });

        // chart data from favorability if present
        const fav = data.favorability || { doc1: 50, doc2: 50 };
        const chartData = [
          { name: "File 1", value: typeof fav.doc1 === "number" ? fav.doc1 : 50 },
          { name: "File 2", value: typeof fav.doc2 === "number" ? fav.doc2 : 50 },
        ];

        setResults({
          ...data,
          comparisonTable: tableRows,
          chartData,
          timeline: data.timeline ?? null,
        });
      } else {
        // single doc
        // backend supplies summary, comparison (array), timeline (string)
        const comparisonArr = Array.isArray(data.comparison) ? data.comparison : [];
        // turn comparison into table-like rows (aspect + doc)
        const tableRows = comparisonArr.map((c) => {
          return {
            feature: c.aspect || c.name || "Aspect",
            file1: c.doc || c.value || "",
            file2: "", // single doc view: second column blank
          };
        });
        setResults({
          ...data,
          comparisonTable: tableRows,
          chartData: null,
        });
      }
    } catch (err) {
      console.error("Error analyzing document:", err);
      alert("Upload failed! " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  const handleWhatIf = async () => {
    if (!whatIfInput.trim()) return;
    setWhatIfLoading(true);
    try {
      const formData = new FormData();
      formData.append("query", whatIfInput);
      const response = await fetch(`/whatif`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const txt = await response.text().catch(() => "");
        throw new Error(`Server ${response.status} ${txt}`);
      }
      const data = await response.json();
      setWhatIfResponse(data.response || data.error || JSON.stringify(data));
    } catch (err) {
      console.error("Error in What If query:", err);
      alert("Failed to process your query!");
    }
    setWhatIfLoading(false);
  };

  // Export PDF (GET /export/pdf)
  const handleExport = async () => {
    try {
      const res = await fetch(`/export/pdf`, { method: "GET" });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "results.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export results");
    }
  };

  const COLORS = ["#06b6d4", "#7c3aed"];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white flex flex-col items-center px-6 py-10 relative">
      {/* Header */}
      <header className="mb-12 text-center">
        <h1 className="text-6xl font-extrabold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-pulse drop-shadow-[0_0_20px_rgba(236,72,153,0.8)]">
          ⚡ Lawgic AI ⚖️
        </h1>
        <p className="mt-3 text-lg text-gray-300 tracking-wide">Upload a legal PDF & let AI analyze it with style ✨</p>
      </header>

      {/* Mode Buttons */}
<div className="flex gap-2 mb-4 justify-center">
  <button 
    onClick={() => setMode("summarize")}
    className={`px-4 py-1.5 text-sm rounded-full font-semibold ${mode==="summarize" ? "bg-gradient-to-r from-blue-400 via-white-500 to-blue-600 text-white" : "bg-gray-700 text-gray-300"}`}>
    Summarize
  </button>
  <button 
    onClick={() => setMode("compare")}
    className={`px-4 py-1.5 text-sm rounded-full font-semibold ${mode==="compare" ? "bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 text-white" : "bg-gray-700 text-gray-300"}`}>
    Compare
  </button>
</div>





      {/* Upload Section */}
      <div className="w-full max-w-2xl backdrop-blur-md bg-white/10 border border-white/20 rounded-3xl p-10 shadow-2xl text-center">
        <div className="flex flex-col items-center gap-4 mb-6">
          <input type="file" onChange={(e) => handleFileChange(e, 1)} className="w-full text-gray-300 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-pink-500 file:to-purple-500 file:text-white hover:file:opacity-80" />
          {mode === "compare" && (
            <input type="file" onChange={(e) => handleFileChange(e, 2)} className="w-full text-gray-300 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-cyan-500 file:to-blue-500 file:text-white hover:file:opacity-80" />
          )}
          <button onClick={handleUpload} disabled={loading} className="px-6 py-2 rounded-full font-bold bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 shadow-[0_0_20px_rgba(59,130,246,0.8)] hover:scale-105 transition-transform w-full max-w-xs">
            {loading ? "⏳ Analyzing..." : "🚀 Upload & Analyze"}
          </button>
        </div>

        {/* Concise / Detailed Toggle */}
<div className="flex justify-center items-center gap-3 mb-6">
  <span className="text-gray-300 text-sm font-medium">Summary Mode:</span>
  <div
    className="relative w-36 h-10 bg-gray-700 rounded-full cursor-pointer flex items-center p-1"
    onClick={() => setSummaryMode(summaryMode === "concise" ? "detailed" : "concise")}
  >
    {/* Slider */}
    <div
      className={`absolute top-1 left-0 w-1/2 h-8 rounded-full transition-transform duration-300 ease-in-out transform ${
        summaryMode === "concise"
          ? "translate-x-0 bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600"
          : "translate-x-full bg-gradient-to-r from-pink-400 via-pink-500 to-pink-600"
      }`}
    />
    {/* Labels */}
    <div className="relative w-full flex justify-between px-2 text-xs font-semibold text-white z-10">
      <span className={`${summaryMode === "concise" ? "opacity-100" : "opacity-50"}`}>Concise</span>
      <span className={`${summaryMode === "detailed" ? "opacity-100" : "opacity-50"}`}>Detailed</span>
    </div>
  </div>
</div>


        <select value={language} onChange={(e) => setLanguage(e.target.value)} className="mb-6 block w-1/2 mx-auto px-4 py-2 rounded-xl bg-gray-800 text-white border border-gray-600">
          <option value="English">English</option>
          <option value="Hindi">Hindi</option>
          <option value="French">French</option>
          <option value="Spanish">Spanish</option>
          <option value="Assamese">Assamese</option>
          <option value="Punjabi">Punjabi</option>
          <option value="Marathi">Marathi</option>
          <option value="Kannada">Kannada</option>
          <option value="Gujarati">Gujarati</option>
          <option value="Tamil">Tamil</option>
          <option value="Telugu">Telugu</option>
          <option value="Odia">Odia</option>
          <option value="Malayalam">Malayalam</option>
          <option value="Urdu">Urdu</option>
        </select>

        {file1 && <p className="mt-2 text-gray-300 text-sm border-b border-gray-700 pb-1">📂 {file1.name}</p>}
        {mode === "compare" && file2 && <p className="mt-2 text-gray-300 text-sm border-b border-gray-700 pb-1">📂 {file2.name}</p>}
      </div>

      {/* Results Section */}
      {results && (
        <div className="pb-14 mt-12 w-full max-w-5xl">
          {/* Export Button */}
          <div className="text-center mb-6">
            <button onClick={handleExport} className="px-6 py-2 rounded-full font-bold bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 shadow-lg hover:scale-105 transition-transform">
              📥 Export Results
            </button>
          </div>

          {/* Summarize Mode (Timeline first, then summary) */}
          {mode === "summarize" && (
            <>
              <div className="bg-gradient-to-br from-green-500/20 to-green-900/40 border border-green-400 rounded-2xl p-6 shadow-lg mb-6">
                <h2 className="font-bold text-green-300 mb-2">📅 Timeline</h2>
                <p className="text-gray-200 whitespace-pre-line">{results.timeline || "No timeline extracted."}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-900/40 border border-blue-400 rounded-2xl p-6 shadow-lg">
                <h2 className="font-bold text-blue-300 mb-2">📄 Summary ({language})</h2>
                <p className="text-gray-200">{results.summary || "No summary available."}</p>
              </div>
            </>
          )}

          {/* Compare Mode (Summary1, Summary2, Table, PieChart) */}
          {mode === "compare" && (
            <div className="space-y-6">
              {/* Individual Summaries first */}
              <div className="grid md:grid-cols-2 gap-6 mb-4">
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-900/40 border border-blue-400 rounded-2xl p-6 shadow-lg">
                  <h2 className="font-bold text-blue-300 mb-2">📄 Summary 1</h2>
                  <p className="text-gray-200">{results.summary1 || "—"}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-900/40 border border-purple-400 rounded-2xl p-6 shadow-lg">
                  <h2 className="font-bold text-purple-300 mb-2">📄 Summary 2</h2>
                  <p className="text-gray-200">{results.summary2 || "—"}</p>
                </div>
              </div>

              {/* Tabular Comparison */}
              {results.comparisonTable && results.comparisonTable.length > 0 ? (
                <div className="overflow-x-auto bg-gray-900/60 border border-gray-700 rounded-xl p-4">
                  <h3 className="font-bold text-gray-200 mb-3">🔎 Tabular Comparison</h3>
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-800">
                      <tr>
                        <th className="px-4 py-2 border border-gray-700 text-left text-gray-300">Aspect</th>
                        <th className="px-4 py-2 border border-gray-700 text-left text-gray-300">File 1</th>
                        <th className="px-4 py-2 border border-gray-700 text-left text-gray-300">File 2</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.comparisonTable.map((row, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? "bg-gray-900" : "bg-gray-800"}>
                          <td className="px-4 py-2 border border-gray-700 text-gray-200 align-top">{row.feature}</td>
                          <td className="px-4 py-2 border border-gray-700 text-gray-200 align-top">{row.file1}</td>
                          <td className="px-4 py-2 border border-gray-700 text-gray-200 align-top">{row.file2}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-gray-400 italic">No comparison table available.</div>
              )}

              {/* PieChart using favorability */}
              {results.chartData && (
                <div className="flex justify-center mt-4">
                  <PieChart width={380} height={260}>
                    <Pie data={results.chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                      {results.chartData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </div>
              )}

            </div>
          )}
        </div>
      )}

      {/* Connect Lawyer Button */}
      <button onClick={() => setShowModal(true)} className="fixed bottom-20 right-6 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-white font-bold py-3 px-5 rounded-full shadow-2xl transition-transform hover:scale-110 hover:brightness-110 z-50">
        🤝 Connect to Lawyer
      </button>

      {/* Lawyer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50 animate-fade-in">
          <div className="bg-gray-900 rounded-t-3xl p-8 w-full max-w-md shadow-2xl transform transition-transform duration-300 ease-out animate-slide-up">
            <h2 className="text-3xl font-extrabold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-6">Available Lawyers</h2>
            <ul className="space-y-4">
              <li className="p-4 bg-gray-800/80 border border-gray-700 rounded-2xl flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <img src="https://randomuser.me/api/portraits/women/65.jpg" alt="Anjali" className="w-14 h-14 rounded-full object-cover border-2 border-white/30" />
                  <div className="flex flex-col">
                    <span className="font-bold text-white text-lg">Anjali Sharma</span>
                    <span className="text-gray-300">Corporate Law</span>
                    <span className="text-gray-200 font-semibold">₹600 / hour</span>
                  </div>
                </div>
                <button className="mt-2 py-2 px-4 bg-gradient-to-r from-green-400 via-green-500 to-green-600 text-white font-bold rounded-full hover:scale-105 transition-transform shadow-lg">Hire</button>
              </li>
              <li className="p-4 bg-gray-800/80 border border-gray-700 rounded-2xl flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Rohit" className="w-14 h-14 rounded-full object-cover border-2 border-white/30" />
                  <div className="flex flex-col">
                    <span className="font-bold text-white text-lg">Rohit Verma</span>
                    <span className="text-gray-300">Criminal Law</span>
                    <span className="text-gray-200 font-semibold">₹800 / hour</span>
                  </div>
                </div>
                <button className="mt-2 py-2 px-4 bg-gradient-to-r from-green-400 via-green-500 to-green-600 text-white font-bold rounded-full hover:scale-105 transition-transform shadow-lg">Hire</button>
              </li>
            </ul>
            <button onClick={() => setShowModal(false)} className="mt-6 w-full py-2 bg-gradient-to-r from-red-400 via-red-500 to-red-600 text-white font-bold rounded-full hover:scale-105 transition-transform shadow-lg">Close</button>
          </div>
        </div>
      )}

      {/* What If Bar */}
      {results && (
        <div className="fixed bottom-0 left-0 w-full z-40">
          {whatIfResponse && (
            <div className="relative mx-4 bg-gradient-to-br from-gray-950 to-blue-950 border border-gray-700 rounded-xl p-4 shadow-lg max-h-40 overflow-y-auto">
              <button onClick={() => setWhatIfResponse(null)} className="absolute top-2 right-2 text-gray-400 hover:text-red-400 text-lg font-bold">✕</button>
              <h2 className="font-bold text-purple-300 mb-1">💡 What If Response</h2>
              <p className="text-gray-200 text-sm">{whatIfResponse}</p>
            </div>
          )}

          <div className="bg-gradient-to-r from-gray-800 via-gray-900 to-black border-t border-gray-700 p-4 flex items-center gap-3">
            <input type="text" value={whatIfInput} onChange={(e) => setWhatIfInput(e.target.value)} placeholder="🤔 What if I break the..." className="flex-grow px-4 py-2 rounded-full bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
            <button onClick={handleWhatIf} disabled={whatIfLoading} className="px-6 py-2 rounded-full font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 shadow-md hover:scale-105 transition-transform">
              {whatIfLoading ? "Thinking..." : "Ask"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
