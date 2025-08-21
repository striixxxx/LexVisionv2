from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import fitz  # PyMuPDF for PDF text extraction
import google.generativeai as genai
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

# 🔑 Configure Gemini API key
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# Global variable to hold last uploaded document text
last_document_text = ""

@app.post("/analyze")
async def analyze_document(
    file: UploadFile = File(...),
    language: str = Form("English")  # 👈 default is English
):
    global last_document_text

    # 1. Extract text from PDF
    doc = fitz.open(stream=await file.read(), filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()

    last_document_text = text  

    # 2. Ask AI for summary + comparison
    model = genai.GenerativeModel("gemini-2.5-flash-lite")
    
    summary_prompt = f"Summarize this legal document in 4–6 sentences in {language}:\n\n{text}"
    comparison_prompt = f"Compare this document to standard legal agreements. Highlight fairness, risks, and missing clauses. Keep it short. Don't give similarities, just red flags in the document in 4 5 lines in {language}:\n\n{text}"
    timeline_prompt = f"Just give timeline and important dates of the document in the specified format:\n\nDate:What happens (in one or two words)\nDate2:What happens\n\nJust return dates nothing else:\n\n{text}"


    
    summary = model.generate_content(summary_prompt).text
    comparison = model.generate_content(comparison_prompt).text
    timeline = model.generate_content(timeline_prompt).text
    return {
        "main": "✅ Analysis complete: AI review finished.",
        "summary": summary,
        "comparison": comparison,
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
