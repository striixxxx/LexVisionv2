from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import fitz  # PyMuPDF for PDF text extraction
import google.generativeai as genai
import os, json, re

app = FastAPI()

# ✅ Allow frontend to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🔑 Configure Gemini API key
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# Global variable to hold last uploaded document text
last_document_text = ""
last_document_text2 = ""  # For second file

@app.post("/analyze")
async def analyze_document(
    file1: UploadFile = File(...),
    file2: UploadFile = File(None),
    language: str = Form("English")
):
    global last_document_text, last_document_text2

    # 1. Extract text from PDF 1
    doc1 = fitz.open(stream=await file1.read(), filetype="pdf")
    text1 = "".join([page.get_text() for page in doc1])
    last_document_text = text1

    text2 = ""
    if file2:
        doc2 = fitz.open(stream=await file2.read(), filetype="pdf")
        text2 = "".join([page.get_text() for page in doc2])
        last_document_text2 = text2

    model = genai.GenerativeModel("gemini-2.5-flash-lite")

    if file2:
        # ----------------- COMPARE TWO FILES -----------------
        summary1_prompt = f"Summarize this legal document in 4–6 sentences in {language} . simplify the language and techincial words:\n\n{text1}"
        summary2_prompt = f"Summarize this legal document in 4–6 sentences in {language}  simplify the language and techincial words :\n\n{text2}"

        comparison_prompt = f"""
Compare the following two legal documents and return the result in **valid JSON** only in {language}. 
Do not include any explanations outside JSON. Use this format:

{{
  "comparison": [
    {{"aspect": "Aspect name", "doc1": "what doc1 says", "doc2": "what doc2 says"}}
  ],
  "favorability": {{
    "doc1": <number between 0 and 100 indicating strength for doc1>,
    "doc2": <number between 0 and 100 indicating strength for doc2>
  }}
}}

Document 1:
{text1}

Document 2:
{text2}
"""

        summary1 = model.generate_content(summary1_prompt).text
        summary2 = model.generate_content(summary2_prompt).text
        comparison_raw = model.generate_content(comparison_prompt).text

        # ✅ Safe JSON extraction
        try:
            match = re.search(r"\{.*\}", comparison_raw, re.DOTALL)
            if match:
                comparison_data = json.loads(match.group(0))
            else:
                comparison_data = {"comparison": [], "favorability": {"doc1": 50, "doc2": 50}}
        except Exception:
            comparison_data = {"comparison": [], "favorability": {"doc1": 50, "doc2": 50}}

        return {
            "main": "✅ Analysis complete: AI review finished.",
            "summary1": summary1,
            "summary2": summary2,
            "comparison": comparison_data.get("comparison", []),
            "favorability": comparison_data.get("favorability", {"doc1": 50, "doc2": 50}),
            "timeline": None
        }

    else:
        # ----------------- SINGLE FILE -----------------
        summary_prompt = f"Summarize this legal document in 4–6 sentences in {language} . simplify the language and techincial words:\n\n{text1}"
        comparison_prompt = f"""
Analyze this legal document and return **valid JSON only**.
Highlight these aspects: Fairness, Risks, Missing Clauses.
Format:

{{
  "comparison": [
    {{"aspect": "Fairness", "doc": "..."}},
    {{"aspect": "Risks", "doc": "..."}},
    {{"aspect": "Missing Clauses", "doc": "..."}}
  ]
}}

Document:
{text1}
"""
        timeline_prompt = f"Just give timeline and important dates of the document in the specified format:\n\nDate:What happens (in one or two words)\nDate2:What happens\n\nJust return dates nothing else:\n\n{text1}"

        summary = model.generate_content(summary_prompt).text
        comparison_raw = model.generate_content(comparison_prompt).text
        timeline = model.generate_content(timeline_prompt).text

        # ✅ Safe JSON extraction for table rendering
        try:
            match = re.search(r"\{.*\}", comparison_raw, re.DOTALL)
            if match:
                comparison_data = json.loads(match.group(0))
            else:
                comparison_data = {"comparison": []}
        except Exception:
            comparison_data = {"comparison": []}

        return {
            "main": "✅ Analysis complete: AI review finished.",
            "summary": summary,
            "comparison": comparison_data.get("comparison", []),
            "timeline": timeline
        }


@app.post("/whatif")
async def what_if(query: str = Form(...)):
    global last_document_text
    if not last_document_text:
        return {"error": "No document analyzed yet. Please upload and analyze a file first."}

    model = genai.GenerativeModel("gemini-2.5-flash-lite")
    whatif_prompt = f"Based on this legal document:\n\n{last_document_text}\n\nAnswer this hypothetical scenario: {query}"
    response = model.generate_content(whatif_prompt).text

    return {"response": response}
