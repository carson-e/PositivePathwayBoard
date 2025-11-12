from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import os
from typing import List, Dict, Any, Optional
from datetime import datetime

from PPB_DB import load_df, populate_db, connect_db
from tap_tracker import TapTracker
from generate_reports import ReportGenerator

DB_NAME = "roster.db"
# Look for StdInfo.xlsx in parent directory (project root)
EXCEL_PATH = os.environ.get("ROSTER_EXCEL", os.path.join(os.path.dirname(__file__), "..", "StdInfo.xlsx"))

app = FastAPI(title="Positive Pathway Board Backend", version="1.0.0")

# Allow Expo web / local dev origins
origins = [
    "http://localhost:19006",  # typical Expo web
    "http://127.0.0.1:19006",
    "http://localhost:8081",   # Metro bundler
    "http://127.0.0.1:8081",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:19000",  # Expo DevTools
    "http://127.0.0.1:19000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

class UpdateResponse(BaseModel):
    status: str
    sheets: List[str]
    teacher_name: Optional[str] = None
    grade: Optional[str] = None

class Student(BaseModel):
    sheet: str
    row: Dict[str, Any]

class TapRecord(BaseModel):
    student_name: str
    tap_type: str  # 'positive' or 'negative'
    choice: str

class TapBatch(BaseModel):
    taps: List[TapRecord]

class GenerateReportRequest(BaseModel):
    student_name: str
    month: Optional[str] = None
    year: Optional[int] = None
    character_equations: Optional[List[str]] = None

@app.post("/update-roster", response_model=UpdateResponse)
async def update_roster():
    """Reload Excel roster, repopulate SQLite tables."""
    data, teacherData, teacher_info = load_df(EXCEL_PATH)
    if data is None:
        raise HTTPException(status_code=404, detail=f"Excel file not found or unreadable: {EXCEL_PATH}")
    populate_db(DB_NAME, data)
    return UpdateResponse(
        status="ok",
        sheets=list(data.keys()),
        teacher_name=teacher_info.get("Teacher Name"),
        grade=teacher_info.get("Grade")
    )

@app.options("/update-roster")
async def update_roster_options():
    """Handle OPTIONS preflight for update-roster."""
    return {"status": "ok"}

@app.get("/students", response_model=List[Student])
async def get_students(limit: int = 500):
    """Return flattened student rows across all sheet tables."""
    conn, cur = connect_db(DB_NAME)
    try:
        cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [r[0] for r in cur.fetchall()]
        results: List[Student] = []
        for t in tables:
            # fetch first 'limit' from each table
            cur.execute(f"SELECT * FROM '{t}' LIMIT ?", (limit,))
            columns = [desc[0] for desc in cur.description]
            for row in cur.fetchall():
                row_dict = {col: row[i] for i, col in enumerate(columns)}
                results.append(Student(sheet=t, row=row_dict))
        return results
    finally:
        conn.close()

@app.post("/taps/record")
async def record_tap(tap: TapRecord):
    """Record a single tap interaction"""
    tracker = TapTracker()
    tap_id = tracker.record_tap(tap.student_name, tap.tap_type, tap.choice)
    return {"status": "ok", "tap_id": tap_id}

@app.post("/taps/batch")
async def record_taps_batch(batch: TapBatch):
    """Record multiple tap interactions at once"""
    tracker = TapTracker()
    tap_dicts = [{"student_name": t.student_name, "tap_type": t.tap_type, "choice": t.choice} for t in batch.taps]
    tap_ids = tracker.record_multiple_taps(tap_dicts)
    return {"status": "ok", "tap_ids": tap_ids, "count": len(tap_ids)}

@app.get("/taps/student/{student_name}")
async def get_student_taps(student_name: str, month: Optional[str] = None, year: Optional[int] = None):
    """Get tap summary for a specific student"""
    tracker = TapTracker()
    data = tracker.get_taps_for_student(student_name, month, year)
    return data

@app.get("/taps/all")
async def get_all_taps(month: Optional[str] = None, year: Optional[int] = None):
    """Get tap data for all students"""
    tracker = TapTracker()
    data = tracker.get_all_students_taps(month, year)
    return data

@app.post("/reports/generate")
async def generate_report(request: GenerateReportRequest):
    """Generate a PDF report for a student"""
    # Get tap data for the student
    tracker = TapTracker()
    month = request.month or datetime.now().strftime("%B")
    year = request.year or datetime.now().year
    
    behavior_data = tracker.get_taps_for_student(request.student_name, month, year)
    
    # Get student info from database
    conn, cur = connect_db(DB_NAME)
    try:
        cur.execute("SELECT * FROM Sheet1 WHERE [Student Name] = ?", (request.student_name,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail=f"Student not found: {request.student_name}")
        
        columns = [desc[0] for desc in cur.description]
        student_data = {columns[i]: row[i] for i in range(len(columns))}
    finally:
        conn.close()
    
    # Generate the PDF report
    generator = ReportGenerator()
    character_equations = request.character_equations or ["Integrity", "Respect", "Responsibility"]
    
    output_dir = os.path.join(os.path.dirname(__file__), 'reports')
    os.makedirs(output_dir, exist_ok=True)
    
    # Generate filename
    safe_name = request.student_name.replace(" ", "_").replace("/", "_").replace("\\", "_")
    filename = f"{safe_name}_report_{month}_{year}.pdf"
    output_path = os.path.join(output_dir, filename)
    
    try:
        generator.generate_report_pdf(
            student_data=student_data,
            behavior_data=behavior_data,
            output_path=output_path,
            month=month,
            character_equations=character_equations
        )
        
        return {
            "status": "ok",
            "filename": filename,
            "path": output_path,
            "student_name": request.student_name,
            "month": month,
            "year": year
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")

@app.get("/reports/download/{filename}")
async def download_report(filename: str):
    """Download a generated report PDF"""
    output_dir = os.path.join(os.path.dirname(__file__), 'reports')
    file_path = os.path.join(output_dir, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Report file not found")
    
    return FileResponse(
        file_path,
        media_type="application/pdf",
        filename=filename
    )

@app.get("/health")
async def health():
    return {"status": "ok"}

# Run: uvicorn server:app --reload --port 8000
