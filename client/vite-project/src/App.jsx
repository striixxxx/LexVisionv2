import React, { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from "recharts";

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

  const lawyers = [
    { name: "Anjali Sharma", specialization: "Corporate Law", price: 600, photo: "https://randomuser.me/api/portraits/women/65.jpg" },
    { name: "Rohit Verma", specialization: "Criminal Law", price: 800, photo: "https://randomuser.me/api/portraits/men/32.jpg" },
    { name: "Priya Nair", specialization: "Intellectual Property", price: 700, photo: "https://randomuser.me/api/portraits/women/44.jpg" },
  ];

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

    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8001/analyze", { method: "POST", body: formData });
      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error("Error analyzing document:", err);
      alert("Upload failed!");
    }
    setLoading(false);
  };

  const handleWhatIf = async () => {
    if (!whatIfInput.trim()) return;
    setWhatIfLoading(true);
    try {
      const formData = new FormData();
      formData.append("query", whatIfInput);
      const response = await fetch("http://127.0.0.1:8001/whatif", { method: "POST", body: formData });
      const data = await response.json();
      setWhatIfResponse(data.response);
    } catch (err) {
      console.error("Error in What If query:", err);
      alert("Failed to process your query!");
    }
    setWhatIfLoading(false);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white flex flex-col items-center px-6 py-10 relative">
      
      {/* Header */}
      <header className="mb-12 text-center">
        <h1 className="text-6xl font-extrabold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-pulse drop-shadow-[0_0_20px_rgba(236,72,153,0.8)]">
          ⚡ LexVision AI ⚖️
        </h1>
        <p className="mt-3 text-lg text-gray-300 tracking-wide">Upload a legal PDF & let AI analyze it with style ✨</p>
      </header>

      {/* Mode Buttons */}
      <div className="flex gap-4 mb-6">
        <button onClick={() => setMode("summarize")} className={`px-6 py-2 rounded-full font-bold ${mode==="summarize" ? "bg-green-500" : "bg-gray-700"}`}>Summarize</button>
        <button onClick={() => setMode("compare")} className={`px-6 py-2 rounded-full font-bold ${mode==="compare" ? "bg-blue-500" : "bg-gray-700"}`}>Compare</button>
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
  <div className="pb-14 mt-12 w-full max-w-4xl grid gap-6 md:grid-cols-2">
    {mode === "summarize" ? (
      <>
        <div className="bg-gradient-to-br from-green-500/20 to-green-900/40 border border-green-400 rounded-2xl p-6 shadow-lg hover:scale-105 transition">
          <h2 className="font-bold text-green-300 mb-2">📅 Timeline</h2>
          <p className="text-gray-200 whitespace-pre-line">{results.timeline}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-900/40 border border-blue-400 rounded-2xl p-6 shadow-lg hover:scale-105 transition">
          <h2 className="font-bold text-blue-300 mb-2">📄 Summary ({language})</h2>
          <p className="text-gray-200">{results.summary}</p>
        </div>
      </>
    ) : (
      <>
        {/* Two Summaries */}
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-900/40 border border-blue-400 rounded-2xl p-6 shadow-lg hover:scale-105 transition">
          <h2 className="font-bold text-blue-300 mb-2">📄 Summary 1 ({language})</h2>
          <p className="text-gray-200">{results.summary1}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500/20 to-purple-900/40 border border-purple-400 rounded-2xl p-6 shadow-lg hover:scale-105 transition">
          <h2 className="font-bold text-purple-300 mb-2">📄 Summary 2 ({language})</h2>
          <p className="text-gray-200">{results.summary2}</p>
        </div>

        {/* Comparison Table */}
        <div className="md:col-span-2 bg-gradient-to-br from-yellow-500/20 to-yellow-900/40 border border-yellow-400 rounded-2xl p-6 shadow-lg">
          <h2 className="font-bold text-yellow-300 mb-4">⚖️ Detailed Comparison</h2>
          {Array.isArray(results.comparison) ? (
            <table className="table-auto w-full border text-gray-200">
              <thead>
                <tr className="bg-yellow-700/40">
                  <th className="p-2 border">Aspect</th>
                  <th className="p-2 border">Document 1</th>
                  <th className="p-2 border">Document 2</th>
                </tr>
              </thead>
              <tbody>
                {results.comparison.map((row, idx) => (
                  <tr key={idx} className="border">
                    <td className="p-2 border font-semibold">{row.aspect}</td>
                    <td className="p-2 border">{row.doc1}</td>
                    <td className="p-2 border">{row.doc2}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-200">{results.comparison}</p>
          )}
        </div>

        {/* Favorability Pie Chart */}
        {results.favorability && (
          <div className="md:col-span-2 bg-gradient-to-br from-purple-500/20 to-purple-900/40 border border-purple-400 rounded-2xl p-6 shadow-lg flex flex-col items-center">
            <h2 className="font-bold text-purple-300 mb-4">📊 Favorability</h2>
            <PieChart width={400} height={300}>
              <Pie
                data={[
                  { name: "Document 1", value: results.favorability.doc1 },
                  { name: "Document 2", value: results.favorability.doc2 },
                ]}
                cx="50%"
                cy="50%"
                outerRadius={120}
                dataKey="value"
                label
              >
                <Cell fill="#22c55e" />
                <Cell fill="#ef4444" />
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </div>
        )}
      </>
    )}
  </div>
)}

      {/* Fixed bottom-right gradient button */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-20 right-6 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-white font-bold py-3 px-5 rounded-full shadow-2xl transition-transform hover:scale-110 hover:brightness-110 z-50"
      >
        🤝 Connect to Lawyer
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50 animate-fade-in">
          <div className="bg-gray-900 rounded-t-3xl p-8 w-full max-w-md shadow-2xl transform transition-transform duration-300 ease-out animate-slide-up">
            <h2 className="text-3xl font-extrabold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-6">
              Available Lawyers
            </h2>
            <ul className="space-y-4">
              {lawyers.map((lawyer, idx) => (
                <li key={idx} className="p-4 bg-gray-800/80 border border-gray-700 rounded-2xl flex flex-col gap-2 hover:scale-105 transition-transform shadow-md">
                  <div className="flex items-center gap-3">
                    <img src={lawyer.photo} alt={lawyer.name} className="w-14 h-14 rounded-full object-cover border-2 border-white/30" />
                    <div className="flex flex-col">
                      <span className="font-bold text-white text-lg">{lawyer.name}</span>
                      <span className="text-gray-300">{lawyer.specialization}</span>
                      <span className="text-gray-200 font-semibold">₹{lawyer.price} / hour</span>
                    </div>
                  </div>
                  <button className="mt-2 py-2 px-4 bg-gradient-to-r from-green-400 via-green-500 to-green-600 text-white font-bold rounded-full hover:scale-105 transition-transform shadow-lg">
                    Hire
                  </button>
                </li>
              ))}
            </ul>
            <button onClick={() => setShowModal(false)} className="mt-6 w-full py-2 bg-gradient-to-r from-red-400 via-red-500 to-red-600 text-white font-bold rounded-full hover:scale-105 transition-transform shadow-lg">
              Close
            </button>
          </div>
        </div>
      )}

      {/* What If Bar + Response */}
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