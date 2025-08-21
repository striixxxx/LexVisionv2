from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import fitz  # PyMuPDF for PDF text extraction
import google.generativeai as genai  # or OpenAI if you prefer
import os

app = FastAPI()

# ✅ Allow frontend to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🔑 Configure Gemini / OpenAI key
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

@app.post("/analyze")
async def analyze_document(file: UploadFile = File(...)):
    # 1. Extract text from PDF
    doc = fitz.open(stream=await file.read(), filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()

    # 2. Ask AI for summary + comparison
    model = genai.GenerativeModel("gemini-1.5-flash")
    summary_prompt = f"Summarize this legal document in 4–6 sentences:\n\n{text}"
    comparison_prompt = f"Compare this document to standard legal agreements. Highlight fairness, risks, and missing clauses:\n\n{text}"

    summary = model.generate_content(summary_prompt).text
    comparison = model.generate_content(comparison_prompt).text

    return {
        "main": "✅ Analysis complete: AI review finished.",
        "summary": summary,
        "comparison": comparison
    }
