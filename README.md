# PositivePathwayBoard

A smart classroom tool that tracks and reports student effort and positive choices in real time. Teachers can quickly record data, view trends, and share progress, all through an intuitive, mobile-friendly web UI.

## Overview

- Frontend: Expo + React Native (web via react-native-web) in the repository root (`app/…`).
- Backend: FastAPI server under `backend/server.py`, with SQLite for storage and `pandas`/`openpyxl` to ingest Excel rosters.
- Data flow: The frontend calls the backend at `${EXPO_PUBLIC_API_URL}` for:
	- `POST /update-roster` — load/refresh students from the Excel file into SQLite
	- `GET /students?limit=33` — list students to render tiles (defaults to 33)

Key files:

- Frontend screen: `app/(tabs)/index.tsx`
- Backend app: `backend/server.py`
- Excel loader: `backend/PPB_DB.py`
- Python dependencies: `backend/requirements.txt`

## Prerequisites

- Node.js 20+ and npm 10+
- Python 3.10+ with `pip`
- Excel file (.xlsx) to serve as the roster, or use the included `sample_data.xlsx`

## Backend (FastAPI) — setup and run

1) Create and activate a virtual environment (tcsh):

```tcsh
cd backend
python -m venv .venv
source .venv/bin/activate.csh
```

2) Install dependencies:

```tcsh
pip install -r requirements.txt
```

3) Point the server at your roster Excel file (absolute path recommended). By default it tries `StdInfo.xlsx` in the repo root; you can override with an env var:

```tcsh
setenv ROSTER_EXCEL "/absolute/path/to/your_roster.xlsx"
```

OR (for bash)

```bash
export ROSTER_EXCEL="/absolute/path/to/your_roster.xlsx"
```

4) Start the API server:

```tcsh
uvicorn server:app --reload --host 127.0.0.1 --port 8000
```

5) Health check (optional):

```tcsh
curl http://127.0.0.1:8000/health
```

Notes:

- The API includes CORS with permissive settings for local development.
- The `/update-roster` endpoint accepts preflight OPTIONS and a POST from the frontend.
- The Excel loader in `PPB_DB.py` is resilient to header/column variations, but a clean header row helps (e.g., first name, last name, contacts, etc.).

## Frontend (Expo web) — setup and run

1) From the repository root, install dependencies:

```tcsh
npm install
```

2) Tell the frontend where the backend lives (defaults to `http://127.0.0.1:8000` if not set).

```tcsh
setenv EXPO_PUBLIC_API_URL "http://127.0.0.1:8000"
```

OR (for bash)

```bash
export EXPO_PUBLIC_API_URL="http://127.0.0.1:8000"
```

3) Start the web dev server (either):

```bash
# Option A: Expo CLI
npx expo start --web

# Option B: if a start script exists
npm run web
```

4) Open the app in the browser and use the Settings panel to press "Update Roster". After a successful update, student tiles are fetched via `/students` on next load. You can refresh the page to see the latest names.

## Environment variables (tcsh)

- Backend:
	- `ROSTER_EXCEL` — absolute path to the Excel roster file (e.g., `/home/you/projects/PositivePathwayBoard/sample_data.xlsx`).
- Frontend:
	- `EXPO_PUBLIC_API_URL` — base URL for the backend (e.g., `http://127.0.0.1:8000`).

Set them with tcsh:

```tcsh
setenv ROSTER_EXCEL "/absolute/path/to/your_roster.xlsx"
setenv EXPO_PUBLIC_API_URL "http://127.0.0.1:8000"
```

OR (for bash)

```bash
export ROSTER_EXCEL="/absolute/path/to/your_roster.xlsx"
export EXPO_PUBLIC_API_URL="http://127.0.0.1:8000"
```

## Troubleshooting

- Backend won’t start or Excel parsing fails:
	- Ensure the file is `.xlsx` and readable; `openpyxl` must be installed (included in `requirements.txt`).
	- Try setting `ROSTER_EXCEL` to an absolute path.
	- Check server logs for detailed errors.

- Frontend can’t reach the API:
	- Confirm the backend is running on `127.0.0.1:8000` (or update `EXPO_PUBLIC_API_URL`).
	- Open the browser console/network tab to verify requests and CORS headers.

- Preflight/CORS issues:
	- The server enables CORS for development and explicitly handles `OPTIONS /update-roster`. If you change ports/origins, verify both sides use the same base URL.

- Dependency/version warnings in the frontend:
	- You can run `npx expo install` to align versions where possible, or reinstall with legacy peer deps: `npm install --legacy-peer-deps`.

## Project structure (partial)

```
PositivePathwayBoard/
	app/(tabs)/index.tsx          # Main screen (Expo Router)
	backend/
		server.py                   # FastAPI app
		PPB_DB.py                   # Excel -> SQLite loader
		requirements.txt            # Python deps
	README.md                     # This file
```

## Notes

- Student tile count currently targets 33 tiles. Adjust via the `limit` parameter in `/students` or in the frontend state handling if needed.
- For production, tighten CORS and consider authentication before enabling roster updates.
