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
last_document_text2 = ""  # For second file

@app.post("/analyze")
async def analyze_document(
    file1: UploadFile = File(...),
    file2: UploadFile = File(None),
    language: str = Form("English")  # 👈 default is English
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
        # Compare two uploaded files
        summary1_prompt = f"Summarize this legal document in 4–6 sentences in {language}:\n\n{text1}"
        summary2_prompt = f"Summarize this legal document in 4–6 sentences in {language}:\n\n{text2}"
        comparison_prompt = f"Compare these two legal documents and highlight differences and risks in {language}:\n\nDocument 1:\n{text1}\n\nDocument 2:\n{text2}"

        summary1 = model.generate_content(summary1_prompt).text
        summary2 = model.generate_content(summary2_prompt).text
        comparison = model.generate_content(comparison_prompt).text

        return {
            "main": "✅ Analysis complete: AI review finished.",
            "summary1": summary1,
            "summary2": summary2,
            "comparison": comparison,
            "timeline": None
        }

    else:
        # Single file → summarize, timeline, compare with standard file
        summary_prompt = f"Summarize this legal document in 4–6 sentences in {language}:\n\n{text1}"
        comparison_prompt = f"Compare this document to standard legal agreements. Highlight fairness, risks, and missing clauses. Keep it short. Don't give similarities, just red flags in the document in 4–5 lines in {language}:\n\n{text1}"
        timeline_prompt = f"Just give timeline and important dates of the document in the specified format:\n\nDate:What happens (in one or two words)\nDate2:What happens\n\nJust return dates nothing else:\n\n{text1}"

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
