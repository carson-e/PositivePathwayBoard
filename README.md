# PositivePathwayBoard

A classroom behavioral management system that tracks student positive and negative interactions ("taps"), displays real-time point totals, generates monthly character trait equations, and produces detailed PDF progress reports. Teachers can manage multiple class rosters, record behavioral data efficiently, and identify students eligible for recognition events.

## Overview

**Architecture:**
- **Frontend**: React Native + Expo (web via react-native-web) with TypeScript
- **Backend**: FastAPI + SQLite with behavioral tracking and PDF report generation
- **Data Pipeline**: Excel roster import via pandas/openpyxl → SQLite → REST API → React UI

**Key Features:**
- **Behavioral Tracking**: Record positive/negative taps across 4 PAWS categories (Prepared for Learning, Acting Responsibly, Working Respectfully, Solving Problems)
- **Real-time Scoring**: Dynamic point calculations (positive - negative taps) displayed on student tiles
- **Monthly Character Equations**: Rotating trait combinations (e.g., "Goodness + Skills = Ability") with video content
- **PDF Reports**: ReportLab-generated monthly progress reports with tap analytics and character traits
- **Multi-Class Support**: Switch between different classroom rosters (Sheet1, Sheet2, etc.)
- **Town Hall Eligibility**: Filter students meeting positive behavior thresholds (≥95% positive taps)

**Core Files:**
- Frontend: `App.tsx`, `App.styles.ts`, `index.tsx`
- Backend: `backend/server.py`, `backend/PPB_DB.py`, `backend/tap_tracker.py`, `backend/generate_reports.py`
- Database: `roster.db` (SQLite with roster, taps, metadata tables)
- Dependencies: `backend/requirements.txt`, `package.json`

## Prerequisites

- **Node.js** 20+ and npm 10+ (for frontend)
- **Python** 3.10+ with pip (for backend)
- **System libraries** (for ReportLab C extensions):
  - Debian/Ubuntu: `sudo apt-get install -y build-essential pkg-config python3-dev libfreetype6-dev libjpeg-dev zlib1g-dev libpng-dev`
  - macOS: `brew install freetype libjpeg zlib libpng pkg-config`
- **Excel roster file** (.xlsx) with student data (or use `StdInfo.xlsx` / `sample_data.xlsx` in repo root)

## Backend (FastAPI) — Setup and Run

### 1. Create and activate virtual environment

**bash/zsh:**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
```

### 2. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure roster Excel path

Set the absolute path to your Excel roster file (defaults to `../StdInfo.xlsx`):

```bash
export ROSTER_EXCEL="/absolute/path/to/StdInfo.xlsx"
```

### 4. Start the API server

```bash
uvicorn server:app --reload --host 127.0.0.1 --port 8000
```
Server runs at `http://127.0.0.1:8000` with auto-reload enabled.

### 5. Verify backend health (optional)

```bash
curl http://127.0.0.1:8000/health
# Expected: {"status":"ok"}
```

### API Endpoints Overview

**Roster Management:**
- `POST /update-roster` — Refresh student data from Excel (preserves taps table)
- `POST /populate-roster` — **RESET**: Clear all tables including taps, repopulate from Excel
- `GET /students?limit=33` — Fetch student records (filtered by class table)
- `GET /teacher-info` — Retrieve teacher name and grade from metadata

**Behavioral Tracking:**
- `POST /taps/record` — Record single tap (body: `{student_name, tap_type, choice}`)
- `POST /taps/batch` — Record multiple taps
- `GET /taps/student/{name}?month=November&year=2025` — Student tap summary
- `GET /taps/all?month=November&year=2025` — All students tap data

**Reports:**
- `POST /reports/generate` — Generate PDF report (body: `{student_name, month, year, character_equations}`)
- `GET /reports/download/{filename}` — Download PDF report
- `GET /reports/town-hall-list?threshold=95` — Students ≥95% positive taps (eligible for recognition)
- `GET /reports/student-report?student={name}&month={month}&year={year}&format=csv` — Download CSV tap data

### Backend Notes

- **CORS**: Permissive settings for local development (`allow_origins=["*"]`). Tighten for production.
- **Database**: `roster.db` created automatically with three main tables:
  - Student roster tables (e.g., `Sheet1`, `Sheet2`)
  - `taps` — behavioral tracking with timestamps
  - `metadata` — teacher name, grade
- **Excel Format**: Expects columns A-H for student data, I-L for teacher info (Teacher Name, Grade, Room Number in first row)

## Frontend (Expo Web) — Setup and Run

### 1. Install dependencies

From repository root:

```bash
npm install
```

### 2. Configure backend URL

Set the backend API endpoint (defaults to `http://127.0.0.1:8000`):
```bash
export EXPO_PUBLIC_API_URL="http://127.0.0.1:8000"
```

### 3. Start the development server

**Option A: Expo CLI (recommended)**
```bash
npx expo start --web
```

**Option B: npm script**
```bash
npm run web
```

Web app opens at `http://localhost:<port>`. 

### 4. Initial data load

1. Click the **⚙️ Settings** button (top-right)
2. Choose action:
   - **Update Roster** — Refresh student names/teacher info from database (keeps tap data)
   - **RESET** (red button) — Complete fresh start from Excel (⚠️ deletes all tap data)
   - **Select Class Table** — Switch between Sheet1, Sheet2, etc.
3. Close settings to view student grid

### Frontend Features

**Student Grid:**
- 33 student tiles arranged in pyramid (1 → 2 → 3 → 4 → 5 → 6 → 7 → 8)
- Click tile without selection: show point total (3 seconds)
- Click tile with PAWS choice selected: record tap, flash choice label (3 seconds)
- Real-time point updates via async tap fetching

**PAWS Choice Recording:**
- 4 categories × 2 types (positive/negative) = 8 tap buttons
- Color-coded: Yellow (Prepared), Blue (Acting/Working), Red (Solving)
- "Select All Students" tile applies choice to entire class

**Monthly Character Equation:**
- Auto-updates based on current month (January–December)
- Three trait tiles (clickable to record positive taps for character traits)
- Optional video link icon (if `videoUrl` set in `monthlyEquations`)
- Previous month traits carousel

**Town Hall Popup:**
- Shows students with ≥95% positive taps this month (default threshold)
- Green highlight on student tiles meeting criteria
- Click student in popup → opens detailed report modal

**Reports:**
- Generate PDF for individual student (Settings → Generate Student Report)
- Download CSV tap data per student
- View tap counts, positive percentage, monthly trends

## Environment Variables

**Backend:**
- `ROSTER_EXCEL` — Absolute path to Excel roster file (defaults to `../StdInfo.xlsx`)

**Frontend:**
- `EXPO_PUBLIC_API_URL` — Backend API base URL (defaults to `http://127.0.0.1:8000`)

```bash
export ROSTER_EXCEL="/absolute/path/to/StdInfo.xlsx"
export EXPO_PUBLIC_API_URL="http://127.0.0.1:8000"
```

> **Tip**: Add these to your shell config (`~/.bashrc`, `~/.zshrc`, `~/.tcshrc`) to persist across sessions.

## Troubleshooting

### Backend Issues

**ReportLab build failure ("ft2build.h: No such file or directory")**
- Install system development packages (see Prerequisites)
- Upgrade pip/setuptools/wheel before installing: `pip install --upgrade pip setuptools wheel`
- If still failing, try: `pip install reportlab --no-cache-dir`

**Python.h missing during pip install**
- Install python3-dev (Debian/Ubuntu: `python3-dev`, Fedora: `python3-devel`)

**Excel parsing errors**
- Ensure file is `.xlsx` format (not `.xls` or `.csv`)
- Verify columns A-H contain student data, I-L contain teacher info
- Set `ROSTER_EXCEL` to absolute path
- Check backend terminal for detailed `openpyxl` error messages

**Backend won't start**
- Verify virtual environment activated (`which python` should show `.venv/bin/python`)
- Check uvicorn version: `uvicorn --version` (expecting 0.32.0+)
- Test server manually: `python -c "from server import app; print('OK')"`

### Frontend Issues

**API connection failures**
- Confirm backend running: `curl http://127.0.0.1:8000/health` should return `{"status":"ok"}`
- Check `EXPO_PUBLIC_API_URL` matches backend address (including port)
- Open browser DevTools → Network tab to inspect failed requests
- Verify CORS headers in response (backend allows `*` in dev mode)

**CORS preflight errors**
- Backend explicitly handles `OPTIONS` requests for all endpoints
- If changing ports/origins, ensure both frontend and backend use same base URL
- Check browser console for specific CORS error messages

**Students not loading after "Update Roster"**
- Verify `/update-roster` returned HTTP 200 (check Network tab)
- Confirm database has student records: `sqlite3 backend/roster.db "SELECT COUNT(*) FROM Sheet1;"`
- Refresh page after roster update to fetch new data
- Check class table selection dropdown (may be on Sheet2, not Sheet1)

**Dependency version warnings**
- Run `npx expo install` to align package versions
- If conflicts persist: `rm -rf node_modules package-lock.json && npm install --legacy-peer-deps`

### Data Issues

**Tap data disappeared**
- Check if "RESET" button was used (deletes taps table permanently)
- Use "Update Roster" instead to preserve tap history
- Restore from backup: `cp roster.db.backup backend/roster.db`

**Town Hall list empty**
- Verify students have tap data for current month: `GET /taps/all?month=December&year=2025`
- Check threshold parameter (default 95%): `GET /reports/town-hall-list?threshold=90`
- Ensure positive tap percentage calculation working (requires both positive and negative taps)

**PDF report generation fails**
- Confirm ReportLab installed: `python -c "import reportlab; print(reportlab.Version)"`
- Check student name exists in database
- Verify `month` and `year` parameters match tap data
- Check backend terminal for detailed error traceback

## Notes

- Student tile count currently targets 33 tiles. Adjust via the `limit` parameter in `/students` or in the frontend state handling if needed.