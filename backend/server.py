from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from typing import List, Dict, Any

from PPB_DB import load_df, populate_db, connect_db

DB_NAME = "roster.db"
EXCEL_PATH = os.environ.get("ROSTER_EXCEL", "StdInfo.xlsx")

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

class Student(BaseModel):
    sheet: str
    row: Dict[str, Any]

@app.post("/update-roster", response_model=UpdateResponse)
async def update_roster():
    """Reload Excel roster, repopulate SQLite tables."""
    data, teacherData = load_df(EXCEL_PATH)
    if data is None:
        raise HTTPException(status_code=404, detail=f"Excel file not found or unreadable: {EXCEL_PATH}")
    populate_db(DB_NAME, data)
    return UpdateResponse(status="ok", sheets=list(data.keys()))

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

@app.get("/health")
async def health():
    return {"status": "ok"}

# Run: uvicorn server:app --reload --port 8000
