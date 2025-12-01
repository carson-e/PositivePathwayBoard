from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
import os
import csv
import io
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
    populate_db(DB_NAME, data, teacher_info=teacher_info)
    return UpdateResponse(
        status="ok",
        sheets=list(data.keys()),
        teacher_name=teacher_info.get("Teacher Name"),
        grade=teacher_info.get("Grade")
    )

@app.post("/populate-roster", response_model=UpdateResponse)
async def populate_roster():
    """Reload Excel roster from scratch, clearing all old tables (including taps) and repopulating from Excel file."""
    data, teacherData, teacher_info = load_df(EXCEL_PATH)
    if data is None:
        raise HTTPException(status_code=404, detail=f"Excel file not found or unreadable: {EXCEL_PATH}")
    # Use clear_first=True and clear_taps=True to start completely fresh from Excel
    populate_db(DB_NAME, data, teacher_info=teacher_info, clear_first=True, clear_taps=True)
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

@app.options("/populate-roster")
async def populate_roster_options():
    """Handle OPTIONS preflight for populate-roster."""
    return {"status": "ok"}

@app.get("/students", response_model=List[Student])
async def get_students(limit: int = 500):
    """Return flattened student rows across all sheet tables (excluding system tables)."""
    conn, cur = connect_db(DB_NAME)
    try:
        cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
        all_tables = [r[0] for r in cur.fetchall()]
        
        # Filter out non-roster tables (system tables we want to exclude)
        exclude_tables = {'taps', 'metadata', 'sqlite_sequence'}
        tables = [t for t in all_tables if t not in exclude_tables]
        
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

@app.get("/teacher-info")
async def get_teacher_info():
    """Return teacher name and grade from the database metadata table."""
    conn, cur = connect_db(DB_NAME)
    try:
        # Check if metadata table exists
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='metadata';")
        if cur.fetchone():
            # Fetch teacher name and grade from metadata table
            cur.execute("SELECT value FROM metadata WHERE key='teacher_name'")
            teacher_name_row = cur.fetchone()
            teacher_name = teacher_name_row[0] if teacher_name_row else None
            
            cur.execute("SELECT value FROM metadata WHERE key='grade'")
            grade_row = cur.fetchone()
            grade = grade_row[0] if grade_row else None
            
            print(f"Retrieved teacher info - Name: {teacher_name}, Grade: {grade}")
            
            return {
                "teacher_name": teacher_name,
                "grade": grade
            }
        
        print("Warning: metadata table does not exist")
        return {"teacher_name": None, "grade": None}
    finally:
        conn.close()

@app.post("/taps/record")
async def record_tap(tap: TapRecord):
    """Record a single tap interaction"""
    tracker = TapTracker(db_path=DB_NAME)
    tap_id = tracker.record_tap(tap.student_name, tap.tap_type, tap.choice)
    return {"status": "ok", "tap_id": tap_id}

@app.post("/taps/batch")
async def record_taps_batch(batch: TapBatch):
    """Record multiple tap interactions at once"""
    tracker = TapTracker(db_path=DB_NAME)
    tap_dicts = [{"student_name": t.student_name, "tap_type": t.tap_type, "choice": t.choice} for t in batch.taps]
    tap_ids = tracker.record_multiple_taps(tap_dicts)
    return {"status": "ok", "tap_ids": tap_ids, "count": len(tap_ids)}

@app.get("/taps/student/{student_name}")
async def get_student_taps(student_name: str, month: Optional[str] = None, year: Optional[int] = None):
    """Get tap summary for a specific student"""
    tracker = TapTracker(db_path=DB_NAME)
    data = tracker.get_taps_for_student(student_name, month, year)
    return data

@app.get("/taps/all")
async def get_all_taps(month: Optional[str] = None, year: Optional[int] = None):
    """Get tap data for all students"""
    tracker = TapTracker(db_path=DB_NAME)
    data = tracker.get_all_students_taps(month, year)
    return data

@app.post("/reports/generate")
async def generate_report(request: GenerateReportRequest):
    """Generate a PDF report for a student"""
    # Get tap data for the student
    tracker = TapTracker(db_path=DB_NAME)
    month = request.month or datetime.now().strftime("%B")
    year = request.year or datetime.now().year
    
    behavior_data = tracker.get_taps_for_student(request.student_name, month, year)
    
    # Get student info from database (search across all sheet tables)
    conn, cur = connect_db(DB_NAME)
    try:
        cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
        all_tables = [r[0] for r in cur.fetchall()]
        exclude_tables = {'taps', 'metadata', 'sqlite_sequence'}
        target_tables = [t for t in all_tables if t not in exclude_tables]

        student_data = None
        for table_name in target_tables:
            cur.execute(f"SELECT * FROM '{table_name}' WHERE [Student Name] = ?", (request.student_name,))
            row = cur.fetchone()
            if row:
                columns = [desc[0] for desc in cur.description]
                student_data = {columns[i]: row[i] for i in range(len(columns))}
                student_data['__sheet'] = table_name
                break

        if not student_data:
            raise HTTPException(status_code=404, detail=f"Student not found: {request.student_name}")

        # Supplement with teacher name from metadata when available
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='metadata';")
        if cur.fetchone():
            cur.execute("SELECT value FROM metadata WHERE key='teacher_name'")
            metadata_row = cur.fetchone()
            if metadata_row and metadata_row[0]:
                student_data.setdefault('Teacher Name', metadata_row[0])
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

@app.get("/reports/town-hall-list")
async def download_town_hall_list(
    month: Optional[str] = None,
    year: Optional[int] = None,
):
    """
    Download a CSV of students who currently qualify
    for the monthly town hall.

    A student qualifies if:
        positive_taps / (positive_taps + negative_taps) >= 0.9
    for the given month/year.
    """
    tracker = TapTracker(db_path=DB_NAME)

    # Default to current month/year if not provided
    now = datetime.now()
    month = month or now.strftime("%B")
    year = year or now.year

    all_data = tracker.get_all_students_taps(month, year)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        ["Student Name", "Positive Taps", "Negative Taps", "Total Taps", "Positive Percent"]
    )

    for student_name, stats in all_data.items():
        pos = stats.get("positive_taps", 0)
        neg = stats.get("negative_taps", 0)
        total = pos + neg

        if total == 0:
            continue

        pct = pos / total
        if pct >= 0.9:
            writer.writerow(
                [student_name, pos, neg, total, f"{pct * 100:.1f}%"]
            )

    output.seek(0)
    filename = f"town_hall_list_{month}_{year}.csv"
    headers = {"Content-Disposition": f'attachment; filename="{filename}"'}

    return StreamingResponse(
        iter([output.getvalue().encode("utf-8")]),
        media_type="text/csv",
        headers=headers,
    )


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

@app.get("/reports/student-report")
async def download_student_report(
    student_name: str,
    month: Optional[str] = None,
    year: Optional[int] = None,
    character_equations: Optional[str] = None,  # comma-separated list
):
    """
    Stream a single student's report PDF directly to the browser
    (no file written to the 'reports' folder).
    """
    # 1) Resolve month/year (defaults to current)
    tracker = TapTracker(db_path=DB_NAME)
    now = datetime.now()
    month = month or now.strftime("%B")
    year = year or now.year

    # 2) Get tap/behavior data for the student
    behavior_data = tracker.get_taps_for_student(student_name, month, year)

    # 3) Get student info from DB (same logic as /reports/generate)
    conn, cur = connect_db(DB_NAME)
    try:
        cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
        all_tables = [r[0] for r in cur.fetchall()]
        exclude_tables = {'taps', 'metadata', 'sqlite_sequence'}
        target_tables = [t for t in all_tables if t not in exclude_tables]

        student_data: Optional[Dict[str, Any]] = None
        for table_name in target_tables:
            cur.execute(
                f"SELECT * FROM '{table_name}' WHERE [Student Name] = ?",
                (student_name,),
            )
            row = cur.fetchone()
            if row:
                columns = [desc[0] for desc in cur.description]
                student_data = {columns[i]: row[i] for i in range(len(columns))}
                student_data["__sheet"] = table_name
                break

        if not student_data:
            raise HTTPException(
                status_code=404, detail=f"Student not found: {student_name}"
            )

        # Add teacher name from metadata if available
        cur.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='metadata';"
        )
        if cur.fetchone():
            cur.execute("SELECT value FROM metadata WHERE key='teacher_name'")
            metadata_row = cur.fetchone()
            if metadata_row and metadata_row[0]:
                student_data.setdefault("Teacher Name", metadata_row[0])
    finally:
        conn.close()

    # 4) Prepare character equations
    if character_equations:
        ce_list = [s.strip() for s in character_equations.split(",") if s.strip()]
    else:
        ce_list = ["Integrity", "Respect", "Responsibility"]

    # 5) Generate PDF into memory (NOT into the 'reports' folder)
    generator = ReportGenerator()
    pdf_buffer = io.BytesIO()

    generator.generate_report_pdf(
        student_data=student_data,
        behavior_data=behavior_data,
        output_path=pdf_buffer,  # ReportLab's SimpleDocTemplate accepts file-like objects
        month=month,
        character_equations=ce_list,
    )

    pdf_buffer.seek(0)
    safe_name = (
        student_name.replace(" ", "_")
        .replace("/", "_")
        .replace("\\", "_")
    )
    filename = f"{safe_name}_report_{month}_{year}.pdf"
    headers = {"Content-Disposition": f'attachment; filename="{filename}"'}

    # 6) Stream directly to browser
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers=headers,
    )


@app.get("/health")
async def health():
    return {"status": "ok"}

# Run: uvicorn server:app --reload --port 8000
