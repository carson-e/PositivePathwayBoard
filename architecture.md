# PositivePathwayBoard - Technical Architecture Documentation

**Version:** 1.0.0  
**Last Updated:** November 17, 2025  
**Project Type:** Full-Stack Educational Web Application

---

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Database Design](#database-design)
5. [API Architecture](#api-architecture)
6. [Frontend Architecture](#frontend-architecture)
7. [Backend Modules](#backend-modules)
8. [Data Flow](#data-flow)
9. [Project Structure](#project-structure)
10. [Configuration](#configuration)
11. [Design Patterns](#design-patterns)
12. [Security Considerations](#security-considerations)
13. [Scalability & Performance](#scalability--performance)
14. [Deployment Strategy](#deployment-strategy)

---

## Overview

**PositivePathwayBoard** is a classroom management application that enables teachers to track and report student behavioral progress in real-time. The system uses a "SMILE Board" (Student Motivation & Interactive Learning Equations) metaphor to encourage positive behavior through immediate feedback and monthly character education themes.

### Core Features

- **Real-time Behavioral Tracking**: Record positive and negative student behaviors ("taps")
- **PAWS Framework**: Prepared for Learning, Acting Responsibly, Working/Playing Respectfully, Solving Problems
- **Character Equations**: Monthly themes combining virtues (e.g., Hope + Knowledge = Discernment)
- **Visual Dashboard**: 33-student triangle layout with color-coded feedback
- **Report Generation**: Automated PDF progress reports with behavior analytics
- **Roster Management**: Excel-based student roster import

---

## System Architecture

### Architecture Pattern

**Client-Server Architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT TIER                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  React Native Web (Expo)                              │  │
│  │  - UI Components (App.tsx)                            │  │
│  │  - State Management (React Hooks)                     │  │
│  │  - HTTP Client (Fetch API)                            │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ▼ HTTP/JSON
┌─────────────────────────────────────────────────────────────┐
│                       SERVER TIER                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  FastAPI Application (server.py)                      │  │
│  │  - RESTful Endpoints                                  │  │
│  │  - CORS Middleware                                    │  │
│  │  - Request Validation (Pydantic)                      │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    BUSINESS LOGIC TIER                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────┐   │
│  │  PPB_DB.py      │  │  tap_tracker.py │  │ generate_  │   │
│  │  (Excel→DB)     │  │  (Behavior)     │  │ reports.py │   │
│  └─────────────────┘  └─────────────────┘  └────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATA TIER                              │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │  roster.db       │         │  taps.db         │          │
│  │  (SQLite)        │         │  (SQLite)        │          │
│  │  - Student Info  │         │  - Behaviors     │          │
│  │  - Teacher Data  │         │  - Timestamps    │          │
│  └──────────────────┘         └──────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### Communication Flow

1. **Frontend → Backend**: REST API calls over HTTP
2. **Backend → Database**: SQL queries via Python sqlite3
3. **Backend → Files**: Excel parsing (openpyxl), PDF generation (ReportLab)

---

## Technology Stack

### Frontend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Expo** | 54.0.23 | Cross-platform framework & development tools |
| **React** | 19.1.0 | UI library for component-based architecture |
| **React Native** | 0.81.5 | Native mobile & web rendering |
| **React Native Web** | 0.21.0 | Web compatibility layer |
| **TypeScript** | 5.0+ | Static type checking |
| **Expo Status Bar** | 3.0.8 | Status bar styling |

**Build Tools:**
- Node.js 20+
- npm 10+
- TypeScript Compiler

### Backend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **FastAPI** | 0.115.5 | Modern async API framework |
| **Uvicorn** | 0.32.0 | ASGI web server |
| **Pydantic** | 2.9.2 | Data validation & serialization |
| **Pandas** | 2.2.3 | Data manipulation & analysis |
| **openpyxl** | 3.1.5 | Excel file parsing |
| **ReportLab** | 4.4.4 | PDF generation |
| **SQLite3** | Built-in | Embedded database |

**Runtime:**
- Python 3.10+
- Virtual environment (.venv)

---

## Database Design

### Two-Database Strategy

The application uses **two separate SQLite databases** to separate concerns:

#### 1. `roster.db` - Student Information Database

**Purpose**: Store static student roster data imported from Excel

**Schema**: Dynamic (table-per-sheet)
- Table names correspond to Excel sheet names (e.g., `Sheet1`)
- Columns dynamically created based on Excel structure

**Common Columns**:
```sql
CREATE TABLE Sheet1 (
    "Student Name" TEXT,
    "Teacher Name" TEXT,
    "Grade" TEXT,
    "Room Number" TEXT,
    -- Additional contact columns
    "Parent 1 Email" TEXT,
    "Parent 2 Email" TEXT,
    -- etc.
);
```

**Characteristics**:
- No primary key constraints (flexible data model)
- Supports multi-sheet Excel files
- Repopulated on each roster update (`if_exists='replace'`)

#### 2. `taps.db` - Behavioral Tracking Database

**Purpose**: Log all behavioral interactions (taps) with timestamps

**Schema**: Single table with indexes

```sql
CREATE TABLE taps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_name TEXT NOT NULL,
    tap_type TEXT NOT NULL CHECK(tap_type IN ('positive', 'negative')),
    choice TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    date TEXT NOT NULL,      -- Format: YYYY-MM-DD
    month TEXT NOT NULL,     -- Format: Full name (e.g., "November")
    year INTEGER NOT NULL
);

CREATE INDEX idx_student_date ON taps(student_name, date);
CREATE INDEX idx_student_month ON taps(student_name, month, year);
```

**Data Retention**: Permanent (no automatic deletion)

### Database Interaction Patterns

```python
# Read-Only Pattern (roster.db)
conn, cur = connect_db("roster.db")
cur.execute("SELECT * FROM Sheet1 WHERE [Student Name] = ?", (name,))
conn.close()

# Write-Heavy Pattern (taps.db)
tracker = TapTracker()  # Manages connection lifecycle
tap_id = tracker.record_tap(student_name, tap_type, choice)
```

---

## API Architecture

### Base URL
```
Development: http://127.0.0.1:8000
Production: Configurable via EXPO_PUBLIC_API_URL
```

### Endpoint Specifications

#### Roster Management

##### `POST /update-roster`
**Purpose**: Reload Excel roster into database

**Request**:
```json
{
  "initiatedAt": "2025-11-17T10:30:00Z"
}
```

**Response**:
```json
{
  "status": "ok",
  "sheets": ["Sheet1", "Sheet2"],
  "teacher_name": "Ms. Johnson",
  "grade": "5th Grade"
}
```

**Process Flow**:
1. Read `ROSTER_EXCEL` environment variable (default: `../StdInfo.xlsx`)
2. Parse Excel using `load_df()`
3. Extract teacher metadata from first row
4. Populate `roster.db` using `populate_db()`
5. Return sheet names and teacher info

##### `GET /students?limit=33`
**Purpose**: Fetch student list for UI rendering

**Query Parameters**:
- `limit` (optional, default: 500): Maximum students to return

**Response**:
```json
[
  {
    "sheet": "Sheet1",
    "row": {
      "Student Name": "John Doe",
      "fname": "John",
      "lname": "Doe",
      "Parent 1 Email": "parent@example.com"
    }
  }
]
```

#### Behavioral Tracking

##### `POST /taps/record`
**Purpose**: Record a single behavioral tap

**Request**:
```json
{
  "student_name": "John Doe",
  "tap_type": "positive",
  "choice": "+ Prepared for Learning"
}
```

**Response**:
```json
{
  "status": "ok",
  "tap_id": 142
}
```

##### `POST /taps/batch`
**Purpose**: Record multiple taps simultaneously (bulk operation)

**Request**:
```json
{
  "taps": [
    {
      "student_name": "John Doe",
      "tap_type": "positive",
      "choice": "+ Acting Responsibly"
    },
    {
      "student_name": "Jane Smith",
      "tap_type": "negative",
      "choice": "- Needs to work on Solving Problems"
    }
  ]
}
```

**Response**:
```json
{
  "status": "ok",
  "tap_ids": [143, 144],
  "count": 2
}
```

##### `GET /taps/student/{student_name}`
**Purpose**: Get behavior summary for specific student

**Query Parameters**:
- `month` (optional): Filter by month name (e.g., "November")
- `year` (optional): Filter by year (e.g., 2025)

**Response**:
```json
{
  "positive_taps": 18,
  "negative_taps": 3,
  "daily_data": [
    ["2025-11-17", "3", "0"],
    ["2025-11-16", "2", "1"],
    ["2025-11-15", "4", "0"]
  ]
}
```

##### `GET /taps/all`
**Purpose**: Get behavior data for all students

**Response**:
```json
{
  "John Doe": {
    "positive_taps": 18,
    "negative_taps": 3,
    "daily_data": [...]
  },
  "Jane Smith": {
    "positive_taps": 22,
    "negative_taps": 1,
    "daily_data": [...]
  }
}
```

#### Report Generation

##### `POST /reports/generate`
**Purpose**: Generate PDF progress report

**Request**:
```json
{
  "student_name": "John Doe",
  "month": "November",
  "year": 2025,
  "character_equations": ["Hope", "Knowledge", "Discernment"]
}
```

**Response**:
```json
{
  "status": "ok",
  "filename": "John_Doe_report_November_2025.pdf",
  "path": "/backend/reports/John_Doe_report_November_2025.pdf",
  "student_name": "John Doe",
  "month": "November",
  "year": 2025
}
```

##### `GET /reports/download/{filename}`
**Purpose**: Download generated PDF

**Response**: Binary PDF file with `Content-Type: application/pdf`

#### Health Check

##### `GET /health`
**Purpose**: Service health verification

**Response**:
```json
{
  "status": "ok"
}
```

### CORS Configuration

```python
CORSMiddleware(
    allow_origins=["*"],  # Development: permissive
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)
```

**Pre-configured Development Origins**:
- `http://localhost:19006` (Expo web)
- `http://127.0.0.1:19006`
- `http://localhost:8081` (Metro bundler)
- `http://localhost:8000`
- `http://localhost:19000` (Expo DevTools)

---

## Frontend Architecture

### Component Structure

**Single-Component Design**: `App.tsx` contains the entire UI

#### Component Hierarchy

```
PathwayBoard (root component)
├── SafeAreaView
│   └── ScrollView
│       ├── Header
│       │   ├── HeaderLeft (spacer)
│       │   ├── HeaderCenter (title text)
│       │   └── HeaderRight
│       │       ├── SettingsButton
│       │       └── LogoImage
│       ├── SettingsOverlay (conditional)
│       │   └── SettingsPopup
│       │       ├── UpdateRosterButton
│       │       └── GenerateReportButton
│       ├── ReportDialog (conditional)
│       │   └── StudentListScroll
│       └── MainContent
│           ├── LeftSection
│           │   ├── ChoiceTapsSection
│           │   │   ├── ChoiceHeaderRow
│           │   │   └── ChoiceRows (4x PAWS)
│           │   │       ├── PAWSCell (P/A/W/S)
│           │   │       ├── PositiveChoiceButton
│           │   │       └── NegativeChoiceButton
│           │   └── CharacterEquation (monthly)
│           │       ├── Trait1Button
│           │       ├── Trait2Button
│           │       └── ResultDisplay
│           └── RightSection (TriangleContainer)
│               ├── Row 0: SelectAllButton
│               ├── Row 1: TeacherName, ClassGrade
│               └── Rows 2-7: StudentCards (33 total)
```

### State Management

#### State Variables

```typescript
// Student data (33 items)
const [students, setStudents] = useState<Student[]>([...]);

// Teacher metadata
const [teacherName, setTeacherName] = useState('Teacher Name');
const [classGrade, setClassGrade] = useState('Grade');

// UI interaction
const [selectedChoice, setSelectedChoice] = useState<string>('');

// Modal visibility
const [showSettings, setShowSettings] = useState(false);
const [showReportDialog, setShowReportDialog] = useState(false);

// Loading states
const [updatingRoster, setUpdatingRoster] = useState(false);
const [generatingReport, setGeneratingReport] = useState(false);
const [loadingStudents, setLoadingStudents] = useState(false);

// Report generation
const [selectedStudentForReport, setSelectedStudentForReport] = useState<string>('');

// Character education (monthly)
const [characterTrait1, setCharacterTrait1] = useState('');
const [characterTrait2, setCharacterTrait2] = useState('');
const [equationResult, setEquationResult] = useState('');
const [equationBgColor, setEquationBgColor] = useState('#fef8dc');
```

#### Student Type Definition

```typescript
type Student = {
  id: number;
  name: string;
  choices: string[];       // History of selected behaviors
  points: number;          // Running point total
  recentChoice?: string;   // Last 3s feedback overlay
  showingScore?: boolean;  // 3s score display toggle
  selected?: boolean;      // Bulk selection state
};
```

### Responsive Design System

#### Dynamic Sizing Calculations

```typescript
const { width } = useWindowDimensions();
const isSmall = width < 768;  // Mobile breakpoint

// Responsive sizing (all scale with viewport width)
const cardSize = Math.max(40, Math.min(75, width * 0.055));
const cardGap = Math.max(4, Math.min(6, width * 0.004));
const fontSize = Math.max(8, Math.min(10, cardSize * 0.13));
const headerFontSize = Math.max(14, Math.min(18, width * 0.02));
const pawsSize = Math.max(45, Math.min(60, width * 0.04));
const choiceButtonHeight = Math.max(45, Math.min(55, width * 0.04));
```

**Design Philosophy**: Fluid scaling with safety bounds (min/max)

### Visual Design System

#### Color Schemes

**PAWS Colors**:
```typescript
const pawsLetters = ['P', 'A', 'W', 'S'];
const pawsColors = ['#f4e4a6', '#a8b5e3', '#a8b5e3', '#f4a6a6'];
const lightPawsColors = ['#fef8dc', '#d9e2f7', '#d9e2f7', '#fdd9d9'];
```

**Rainbow Pattern** (Student Cards):
```typescript
const rainbowColors = [
  '#f4a6a6',  // red
  '#ffb366',  // orange
  '#fff9c4',  // yellow
  '#c8e6c9',  // green
  '#a8b5e3',  // blue
  '#d8b4e2',  // purple
];

// Diagonal flow: each row starts at different color
const getBoxColor = (col: number, row: number) => {
  const colorIndex = ((row * 4) + col) % rainbowColors.length;
  return rainbowColors[colorIndex];
};
```

**Monthly Character Equation Colors**:
```typescript
const monthlyEquations: Record<number, MonthlyEquation> = {
  0: { color: '#ffcdd2' },  // January (red)
  1: { color: '#fff9c4' },  // February (yellow)
  2: { color: '#d9e2f7' },  // March (blue)
  // Cycles through red/yellow/blue pattern
};
```

### User Interaction Patterns

#### 1. Choice Selection Flow

```
User clicks choice button
  ↓
selectedChoice state updated
  ↓
Button background changes (green/red)
  ↓
User clicks student card
  ↓
Student receives choice
  ↓
Black overlay shows choice text (3s)
  ↓
Points updated (+1 or -1)
  ↓
Tap recorded to backend
```

#### 2. Score Display Flow

```
User clicks student (no choice selected)
  ↓
showingScore = true
  ↓
White overlay shows point total (3s)
  ↓
showingScore = false
```

#### 3. Bulk Selection Flow

```
User clicks choice button
  ↓
User clicks "Select All Students"
  ↓
All students receive choice simultaneously
  ↓
33 black overlays appear (3s)
  ↓
33 tap records sent to backend
```

### Character Education System

#### Monthly Themes (Month Index 0-11)

```typescript
const monthlyEquations: Record<number, MonthlyEquation> = {
  0:  { trait1: '+ Goodness',      trait2: '+ Skills',       result: 'Ability' },
  1:  { trait1: '+ Hope',          trait2: '+ Knowledge',    result: 'Discernment' },
  2:  { trait1: '+ Respect',       trait2: '+ Gentleness',   result: 'Friendships' },
  3:  { trait1: '+ Self-Control',  trait2: '+ Purpose',      result: 'Resilience' },
  4:  { trait1: '',                trait2: '',               result: '' }, // Summer
  5:  { trait1: '',                trait2: '',               result: '' },
  6:  { trait1: '',                trait2: '',               result: '' },
  7:  { trait1: '+ Helpfulness',   trait2: '+ Organization', result: 'Learning Environment' },
  8:  { trait1: '+ Care',          trait2: '+ Safety',       result: 'Stability' },
  9:  { trait1: '+ Joy',           trait2: '+ Focus',        result: 'Learning Energy' },
  10: { trait1: '+ Patience',      trait2: '+ Excellent Senses', result: 'Perception' },
  11: { trait1: '+ Kindness',      trait2: '+ Understanding', result: 'Responsibility' },
};
```

**Usage**: Automatically set via `useEffect()` on mount based on `new Date().getMonth()`

---

## Backend Modules

### 1. `server.py` - API Server

**Role**: Central routing and request handling

**Key Components**:
```python
app = FastAPI(title="Positive Pathway Board Backend", version="1.0.0")

# Middleware
app.add_middleware(CORSMiddleware, ...)

# Pydantic Models
class UpdateResponse(BaseModel): ...
class Student(BaseModel): ...
class TapRecord(BaseModel): ...
class GenerateReportRequest(BaseModel): ...

# Route Handlers
@app.post("/update-roster")
@app.get("/students")
@app.post("/taps/record")
@app.post("/reports/generate")
# ... etc.
```

**Dependencies**:
- `PPB_DB`: Data loading
- `tap_tracker.TapTracker`: Behavior tracking
- `generate_reports.ReportGenerator`: PDF creation

### 2. `PPB_DB.py` - Excel Data Loader

**Role**: Parse Excel rosters and populate SQLite

**Key Functions**:

```python
def load_df(filepath: str) -> Tuple[Dict, DataFrame, Dict]:
    """
    Load Excel file into DataFrames
    
    Returns:
        - roster_processed: Dict of sheet_name → DataFrame
        - teacherData: DataFrame with teacher metadata
        - teacher_info: Dict with Teacher Name and Grade
    """
    roster_full = pd.read_excel(filepath, usecols='A:I', sheet_name=None)
    # Extract teacher info from first row
    # Drop metadata columns (Teacher Name, Grade, Room Number)
    # Return processed data

def populate_db(db_name: str, data: Dict, conn=None, cur=None):
    """
    Write DataFrames to SQLite tables
    
    Uses pandas.to_sql() with if_exists='replace'
    """
```

**Error Handling**:
- Gracefully handles missing columns
- Falls back to loading all columns if specified range fails
- Auto-renames columns if no header row detected

### 3. `tap_tracker.py` - Behavioral Data Manager

**Role**: CRUD operations for behavioral taps

**Class: `TapTracker`**

```python
class TapTracker:
    def __init__(self, db_path: str = None):
        """Initialize with taps.db path"""
        
    def _init_database(self):
        """Create taps table and indexes"""
        
    def record_tap(self, student_name: str, tap_type: str, choice: str) -> int:
        """Insert single tap, return tap_id"""
        
    def record_multiple_taps(self, taps: List[Dict]) -> List[int]:
        """Bulk insert, return tap_ids"""
        
    def get_taps_for_student(
        self, 
        student_name: str, 
        month: Optional[str] = None,
        year: Optional[int] = None
    ) -> Dict:
        """
        Return:
        {
            'positive_taps': int,
            'negative_taps': int,
            'daily_data': [[date, pos, neg], ...]
        }
        """
        
    def get_all_students_taps(
        self, 
        month: Optional[str] = None,
        year: Optional[int] = None
    ) -> Dict[str, Dict]:
        """Return {student_name: tap_data} for all students"""
        
    def clear_taps(
        self,
        student_name: Optional[str] = None,
        month: Optional[str] = None,
        year: Optional[int] = None
    ):
        """Dangerous: delete tap records (use with caution)"""
```

**Automatic Timestamp Handling**:
```python
now = datetime.now()
date_str = now.strftime('%Y-%m-%d')       # 2025-11-17
month_str = now.strftime('%B')            # November
year = now.year                            # 2025
```

### 4. `generate_reports.py` - PDF Report Generator

**Role**: Create professional PDF reports using ReportLab

**Class: `ReportGenerator`**

```python
class ReportGenerator:
    def __init__(self, db_path: str = None):
        """Initialize with roster.db path"""
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
        
    def _setup_custom_styles(self):
        """Define custom paragraph styles"""
        # CustomTitle, CustomHeading, CustomBody
        
    def generate_report_pdf(
        self,
        student_data: Dict,
        behavior_data: Dict,
        output_path: str,
        month: str = None,
        character_equations: List[str] = None
    ):
        """
        Generate PDF with:
        - Title and greeting
        - Behavior summary table
        - Daily breakdown table
        - Closing remarks
        """
```

**Report Structure**:
1. **Header**: "Student Behavioral Progress Report"
2. **Greeting**: Personalized letter to parents
3. **Summary Table**: Positive/negative tap counts and percentages
4. **Daily Breakdown**: Last 20 days of behavior data
5. **Closing**: Teacher signature and remarks

**Styling**:
- Professional color scheme (blue: `#2d5aa8`)
- Tables with borders and alternating row colors
- ReportLab `Paragraph` with HTML-like markup
- Letter-sized pages (8.5" × 11")

---

## Data Flow

### 1. Initial Setup Flow

```
Excel File (StdInfo.xlsx)
    ↓
Backend: load_df() → Parse sheets → Extract teacher info
    ↓
Backend: populate_db() → Write to roster.db
    ↓
Frontend: POST /update-roster
    ↓
Backend: Return {status, sheets, teacher_name, grade}
    ↓
Frontend: Update teacherName, classGrade state
    ↓
Frontend: GET /students?limit=33
    ↓
Backend: Query roster.db → Flatten rows
    ↓
Frontend: Update students state → Render UI
```

### 2. Behavioral Tracking Flow

```
Teacher clicks choice button
    ↓
Frontend: selectedChoice = "+ Prepared for Learning"
    ↓
Teacher clicks student card
    ↓
Frontend: 
  - Update local state (points, recentChoice)
  - Show black overlay (3s)
    ↓
Frontend: POST /taps/record
    ↓
Backend: TapTracker.record_tap()
    ↓
Backend: INSERT INTO taps (student_name, tap_type, choice, date, month, year)
    ↓
taps.db: New row with auto-generated timestamp
```

### 3. Report Generation Flow

```
Teacher clicks "Generate Student Report"
    ↓
Frontend: Show student selection dialog
    ↓
Teacher selects student
    ↓
Frontend: POST /reports/generate
    ↓
Backend: 
  1. TapTracker.get_taps_for_student() → behavior_data
  2. Query roster.db → student_data
  3. ReportGenerator.generate_report_pdf()
    ↓
Backend: 
  - Create PDF using ReportLab
  - Save to backend/reports/{student_name}_report_{month}_{year}.pdf
    ↓
Backend: Return {status, filename, path}
    ↓
Frontend: Show success alert with download button
    ↓
User clicks "Download"
    ↓
Frontend: window.open(`${API_URL}/reports/download/{filename}`)
    ↓
Backend: FileResponse with application/pdf
    ↓
Browser: Download PDF to user's device
```

---

## Project Structure

```
PositivePathwayBoard/
│
├── frontend/ (root directory)
│   ├── App.tsx                     # Main UI component (580 lines)
│   ├── index.tsx                   # Expo entry point (3 lines)
│   ├── package.json                # Node dependencies
│   ├── package-lock.json           # Locked dependency versions
│   ├── tsconfig.json               # TypeScript compiler config
│   │
│   ├── assets/
│   │   └── images/
│   │       └── dominoeffect.png    # Header logo image
│   │
│   ├── .expo/
│   │   ├── settings.json           # Expo development settings
│   │   └── devices.json            # Connected device registry
│   │
│   ├── node_modules/               # Frontend dependencies (gitignored)
│   └── .gitignore                  # Frontend ignore rules
│
├── backend/
│   ├── server.py                   # FastAPI application (180 lines)
│   ├── PPB_DB.py                   # Excel data loader (150 lines)
│   ├── tap_tracker.py              # Behavioral tracking (250 lines)
│   ├── generate_reports.py         # PDF report generator (300 lines)
│   ├── requirements.txt            # Python dependencies
│   │
│   ├── .venv/                      # Python virtual environment (gitignored)
│   │   ├── bin/
│   │   ├── lib/
│   │   └── pyvenv.cfg
│   │
│   ├── roster.db                   # Student roster database
│   ├── taps.db                     # Behavioral taps database
│   │
│   ├── reports/                    # Generated PDF reports directory
│   │   └── *.pdf                   # Individual student reports
│   │
│   └── __pycache__/                # Python bytecode cache (gitignored)
│
├── StdInfo.xlsx                    # Default student roster file
├── sample_data.xlsx                # Sample roster for testing
├── StudentInformation_template.xlsx # Blank roster template
│
├── README.md                       # User-facing documentation
├── architecture.md                 # This file (technical docs)
│
└── .git/                           # Git version control (gitignored)
```

### File Sizes (Approximate)

| File | Lines | Purpose |
|------|-------|---------|
| `App.tsx` | 580 | Entire frontend UI |
| `server.py` | 180 | API routing |
| `tap_tracker.py` | 250 | Behavior CRUD |
| `generate_reports.py` | 300 | PDF generation |
| `PPB_DB.py` | 150 | Excel parsing |
| **Total Code** | **~1,460** | Core application logic |

---

## Configuration

### Environment Variables

#### Backend Configuration

```bash
# Location of Excel roster file (absolute path recommended)
export ROSTER_EXCEL="/home/user/PositivePathwayBoard/StdInfo.xlsx"
```

**Default**: `../StdInfo.xlsx` (relative to backend directory)

**Usage in Code**:
```python
EXCEL_PATH = os.environ.get("ROSTER_EXCEL", 
    os.path.join(os.path.dirname(__file__), "..", "StdInfo.xlsx"))
```

#### Frontend Configuration

```bash
# Backend API base URL
export EXPO_PUBLIC_API_URL="http://127.0.0.1:8000"
```

**Default**: `http://127.0.0.1:8000`

**Usage in Code**:
```typescript
const API_URL: string =
    (Constants as any)?.expoConfig?.extra?.API_URL ||
    (process.env as any)?.EXPO_PUBLIC_API_URL ||
    'http://127.0.0.1:8000';
```

**Precedence**: `expo.config.js` > environment variable > hardcoded default

### Excel File Requirements

#### Supported Formats
- `.xlsx` (Office Open XML)
- Not supported: `.xls` (old binary format), `.csv`

#### Expected Structure

```
| Student Name     | Teacher Name | Grade | Room Number | Parent 1 Email      | Parent 2 Email      |
|------------------|--------------|-------|-------------|---------------------|---------------------|
| John Doe         | Ms. Johnson  | 5th   | 102         | parent1@example.com | parent2@example.com |
| Jane Smith       | Ms. Johnson  | 5th   | 102         | parent3@example.com |                     |
```

**Flexible Column Handling**:
- First row used for metadata extraction (Teacher Name, Grade)
- Metadata columns removed from student data
- Missing columns handled gracefully
- Multi-sheet files supported (each sheet → separate table)

#### Alternative Column Names

The system accepts various column naming conventions:
- `Student Name`, `fname`, `name`
- Any contact-related columns (dynamically parsed)

---

## Design Patterns

### 1. **Repository Pattern**

**Purpose**: Abstract database operations

**Implementation**:
```python
# PPB_DB.py - Roster repository
def connect_db(db_name):
    return sq.connect(db_name)

# tap_tracker.py - Tap repository
class TapTracker:
    def __init__(self, db_path: str = None):
        self.db_path = db_path
        self._init_database()
```

**Benefits**:
- Database logic centralized
- Easy to swap databases (e.g., SQLite → PostgreSQL)
- Testable with mock databases

### 2. **Service Layer Pattern**

**Purpose**: Encapsulate business logic

**Implementation**:
```python
# server.py routes delegate to services
@app.post("/taps/record")
async def record_tap(tap: TapRecord):
    tracker = TapTracker()  # Service
    tap_id = tracker.record_tap(...)
    return {"status": "ok", "tap_id": tap_id}
```

**Benefits**:
- Routes remain thin (routing only)
- Business logic reusable outside API context
- Clear separation of concerns

### 3. **Data Transfer Objects (DTOs)**

**Purpose**: Type-safe API contracts

**Implementation**:
```python
from pydantic import BaseModel

class TapRecord(BaseModel):
    student_name: str
    tap_type: str
    choice: str

@app.post("/taps/record")
async def record_tap(tap: TapRecord):
    # Automatic validation and serialization
```

**Benefits**:
- Automatic validation
- Self-documenting API (FastAPI auto-generates OpenAPI docs)
- Type safety

### 4. **Component-Based Architecture**

**Purpose**: Modular, reusable UI

**Implementation**:
```typescript
// Single-file component with clear internal structure
export default function PathwayBoard() {
    // State
    const [students, setStudents] = useState<Student[]>([]);
    
    // Effects
    useEffect(() => { /* character equation setup */ }, []);
    
    // Event handlers
    const handleStudentClick = (id: number) => { /* ... */ };
    
    // Render helpers
    const renderTriangle = () => { /* ... */ };
    
    // Main render
    return <SafeAreaView>...</SafeAreaView>;
}
```

**Benefits**:
- Colocation of related logic
- Easy to understand data flow
- React DevTools compatibility

### 5. **Strategy Pattern (Color Assignment)**

**Purpose**: Dynamic behavior selection

**Implementation**:
```typescript
const getBoxColor = (col: number, row: number) => {
    const colorIndex = ((row * 4) + col) % rainbowColors.length;
    return rainbowColors[colorIndex];
};

// Usage
<View style={{ backgroundColor: getBoxColor(col, row) }} />
```

**Benefits**:
- Algorithmic color distribution
- Easy to swap color schemes
- No hardcoded colors in components

### 6. **Facade Pattern (API Module)**

**Purpose**: Simplified interface to complex subsystems

**Implementation**:
```typescript
// Single API_URL hides complexity
const API_URL: string =
    (Constants as any)?.expoConfig?.extra?.API_URL ||
    (process.env as any)?.EXPO_PUBLIC_API_URL ||
    'http://127.0.0.1:8000';

// All API calls use this facade
fetch(`${API_URL}/students?limit=33`)
```

**Benefits**:
- Single point of configuration
- Easy environment switching
- Testable with mock servers

---

## Security Considerations

### Current Security Posture

**⚠️ Development-Focused**: Not production-ready

#### Vulnerabilities

1. **CORS Wide Open**
   ```python
   allow_origins=["*"]  # Allows ANY origin
   ```
   **Risk**: Cross-site request forgery (CSRF)

2. **No Authentication**
   - All endpoints publicly accessible
   - No user/role management
   - No API keys or tokens

3. **No Rate Limiting**
   - Vulnerable to DoS attacks
   - No throttling on expensive operations (PDF generation)

4. **File System Access**
   - Excel file path configurable via environment
   - No validation of file contents
   - PDF reports stored in filesystem (no access control)

5. **SQL Injection (Mitigated)**
   - ✅ Uses parameterized queries
   - ✅ Pydantic validation on inputs
   - Still vulnerable if raw SQL is added

6. **Data Privacy**
   - Student PII (names, parent emails) in plaintext
   - No encryption at rest
   - No GDPR compliance measures

### Production Security Roadmap

#### Phase 1: Authentication & Authorization

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    # Verify JWT token, return user
    pass

@app.post("/taps/record")
async def record_tap(
    tap: TapRecord,
    current_user: User = Depends(get_current_user)
):
    # Only authenticated users can record taps
    if not current_user.is_teacher:
        raise HTTPException(status_code=403)
    # ...
```

**Recommended**: OAuth2 + JWT tokens

#### Phase 2: CORS Restrictions

```python
origins = [
    "https://pathwayboard.school.edu",
    "https://app.pathwayboard.school.edu",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Whitelist only
    allow_credentials=True,
    allow_methods=["GET", "POST"],  # Explicit methods
    allow_headers=["Authorization", "Content-Type"],
)
```

#### Phase 3: Rate Limiting

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/taps/record")
@limiter.limit("100/minute")  # Max 100 taps per minute
async def record_tap(request: Request, tap: TapRecord):
    # ...
```

#### Phase 4: Data Encryption

```python
# Environment-based encryption key
FERNET_KEY = os.environ.get("FERNET_KEY")
cipher = Fernet(FERNET_KEY)

# Encrypt PII before storage
encrypted_email = cipher.encrypt(parent_email.encode())

# Decrypt on retrieval
decrypted_email = cipher.decrypt(encrypted_email).decode()
```

#### Phase 5: Input Validation

```python
from pydantic import validator, constr

class TapRecord(BaseModel):
    student_name: constr(min_length=1, max_length=100)
    tap_type: Literal["positive", "negative"]
    choice: constr(min_length=1, max_length=200)
    
    @validator('student_name')
    def validate_student_exists(cls, v):
        # Check against roster.db
        if not student_exists(v):
            raise ValueError('Student not found')
        return v
```

#### Phase 6: Audit Logging

```python
import logging

audit_logger = logging.getLogger("audit")

@app.post("/taps/record")
async def record_tap(tap: TapRecord, user: User = Depends(get_current_user)):
    tap_id = tracker.record_tap(...)
    
    audit_logger.info(
        f"User {user.id} recorded {tap.tap_type} tap for {tap.student_name}",
        extra={"user_id": user.id, "tap_id": tap_id}
    )
    
    return {"status": "ok", "tap_id": tap_id}
```

---

## Scalability & Performance

### Current Limitations

#### 1. **Database: SQLite**
- **Single-writer limitation**: Concurrent writes will block
- **File-based**: No network access, single server only
- **No connection pooling**: New connection per request

**Bottleneck**: ~10-50 concurrent users max

#### 2. **PDF Generation**
- **Synchronous**: Blocks request thread during generation
- **CPU-intensive**: Can take 2-5 seconds per report
- **No caching**: Regenerates even if data hasn't changed

**Bottleneck**: ~5 reports/minute per server

#### 3. **Excel Parsing**
- **Loads entire file into memory**: Pandas reads all sheets
- **No incremental updates**: Full roster replacement on each update
- **Single-threaded**: openpyxl is synchronous

**Bottleneck**: ~1000 rows per file max

#### 4. **Frontend State**
- **No pagination**: Loads all students at once
- **No virtualization**: Renders 33 DOM elements always
- **Local-only state**: No shared state across tabs

**Bottleneck**: UI lag with >100 students

### Scalability Improvements

#### Phase 1: Database Migration

**Upgrade to PostgreSQL**:

```python
# Instead of sqlite3
import asyncpg
from databases import Database

DATABASE_URL = os.environ.get("DATABASE_URL")
database = Database(DATABASE_URL)

@app.on_event("startup")
async def startup():
    await database.connect()

@app.get("/students")
async def get_students(limit: int = 500):
    query = "SELECT * FROM students LIMIT :limit"
    rows = await database.fetch_all(query=query, values={"limit": limit})
    return rows
```

**Benefits**:
- Connection pooling (100+ concurrent connections)
- Full ACID compliance
- Network-accessible (multi-server deployment)
- Advanced indexing (GIN, BRIN)

#### Phase 2: Async Task Queue

**Use Celery for background jobs**:

```python
from celery import Celery

celery_app = Celery('pathwayboard', broker='redis://localhost:6379')

@celery_app.task
def generate_report_async(student_name, month, year):
    generator = ReportGenerator()
    output_path = f"/reports/{student_name}_{month}_{year}.pdf"
    generator.generate_report_pdf(...)
    return output_path

@app.post("/reports/generate")
async def generate_report(request: GenerateReportRequest):
    task = generate_report_async.delay(
        request.student_name,
        request.month,
        request.year
    )
    return {
        "status": "processing",
        "task_id": task.id,
        "check_status_url": f"/reports/status/{task.id}"
    }
```

**Benefits**:
- Non-blocking report generation
- Horizontal scaling (add worker nodes)
- Retry logic for failures
- Progress tracking

#### Phase 3: Caching Layer

**Add Redis for caching**:

```python
import redis
import json

redis_client = redis.Redis(host='localhost', port=6379)

@app.get("/students")
async def get_students(limit: int = 500):
    cache_key = f"students:limit:{limit}"
    
    # Try cache first
    cached = redis_client.get(cache_key)
    if cached:
        return json.loads(cached)
    
    # Miss: query database
    rows = await database.fetch_all(...)
    
    # Cache for 5 minutes
    redis_client.setex(cache_key, 300, json.dumps(rows))
    
    return rows
```

**Benefits**:
- Sub-millisecond response times
- Reduces database load
- Shared cache across servers

#### Phase 4: CDN for Static Assets

```typescript
// Instead of local assets
const LOGO_URL = "https://cdn.pathwayboard.com/images/dominoeffect.png";

<Image source={{ uri: LOGO_URL }} />
```

**Benefits**:
- Faster asset loading (edge servers)
- Reduced server bandwidth
- Browser caching

#### Phase 5: Frontend Optimization

**Virtual scrolling for large student lists**:

```typescript
import { FlatList } from 'react-native';

<FlatList
    data={students}
    renderItem={({ item }) => <StudentCard student={item} />}
    keyExtractor={(item) => item.id.toString()}
    initialNumToRender={33}
    maxToRenderPerBatch={10}
    windowSize={5}
/>
```

**Benefits**:
- Renders only visible items
- Smooth scrolling with 1000+ students
- Lower memory usage

### Performance Monitoring

#### Backend Metrics (Prometheus + Grafana)

```python
from prometheus_fastapi_instrumentator import Instrumentator

Instrumentator().instrument(app).expose(app)

# Metrics available:
# - http_requests_total
# - http_request_duration_seconds
# - http_requests_in_progress
```

#### Frontend Metrics (Sentry)

```typescript
import * as Sentry from "@sentry/react-native";

Sentry.init({
    dsn: "https://your-sentry-dsn",
    tracesSampleRate: 1.0,
});

// Automatic performance tracking
```

---

## Deployment Strategy

### Development Environment (Current)

**Frontend**:
```bash
cd /home/carson/school/PositivePathwayBoard
npm install
npm run web  # or: npx expo start --web
# Access: http://localhost:19006
```

**Backend**:
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn server:app --reload --host 127.0.0.1 --port 8000
# Access: http://127.0.0.1:8000
```

### Production Deployment Options

#### Option 1: Traditional VPS (DigitalOcean, Linode)

**Architecture**:
```
Internet
   ↓
Nginx (reverse proxy, SSL termination)
   ↓
Gunicorn/Uvicorn (ASGI server, 4 workers)
   ↓
FastAPI app
   ↓
PostgreSQL database (separate server)
```

**nginx.conf**:
```nginx
server {
    listen 443 ssl http2;
    server_name api.pathwayboard.school.edu;

    ssl_certificate /etc/letsencrypt/live/pathwayboard/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pathwayboard/privkey.pem;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Systemd Service** (`/etc/systemd/system/pathwayboard.service`):
```ini
[Unit]
Description=Positive Pathway Board API
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/pathwayboard/backend
Environment="ROSTER_EXCEL=/var/www/pathwayboard/rosters/StdInfo.xlsx"
ExecStart=/var/www/pathwayboard/backend/.venv/bin/gunicorn \
    -k uvicorn.workers.UvicornWorker \
    -w 4 \
    -b 0.0.0.0:8000 \
    server:app

[Install]
WantedBy=multi-user.target
```

**Frontend Hosting**: Vercel, Netlify, or AWS S3 + CloudFront

#### Option 2: Containerized (Docker + Docker Compose)

**`Dockerfile` (Backend)**:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

EXPOSE 8000

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
```

**`Dockerfile` (Frontend)**:
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

CMD ["npm", "run", "serve"]
```

**`docker-compose.yml`**:
```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "8000:8000"
    environment:
      - ROSTER_EXCEL=/data/StdInfo.xlsx
      - DATABASE_URL=postgresql://user:pass@postgres:5432/pathwayboard
    volumes:
      - ./backend/reports:/app/reports
      - ./rosters:/data
    depends_on:
      - postgres

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "3000:3000"
    environment:
      - EXPO_PUBLIC_API_URL=http://backend:8000

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: pathwayboard
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

**Deployment**:
```bash
docker-compose up -d
docker-compose logs -f backend
```

#### Option 3: Serverless (AWS Lambda + S3)

**Not Recommended**: SQLite incompatible with Lambda's read-only filesystem

**Alternative**: Use AWS RDS for database, Lambda for API

#### Option 4: Platform-as-a-Service (Railway, Render)

**Railway**:
```yaml
# railway.toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "uvicorn server:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/health"
```

**Render**:
```yaml
# render.yaml
services:
  - type: web
    name: pathwayboard-api
    env: python
    buildCommand: "pip install -r backend/requirements.txt"
    startCommand: "uvicorn backend.server:app --host 0.0.0.0 --port $PORT"
```

### Database Migration for Production

**From SQLite to PostgreSQL**:

```python
import sqlite3
import psycopg2

# Export from SQLite
sqlite_conn = sqlite3.connect('roster.db')
students = pd.read_sql_query("SELECT * FROM Sheet1", sqlite_conn)

# Import to PostgreSQL
pg_conn = psycopg2.connect(DATABASE_URL)
students.to_sql('students', pg_conn, if_exists='replace', index=False)
```

### SSL/TLS Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.pathwayboard.school.edu
sudo certbot renew --dry-run  # Test auto-renewal
```

### Monitoring & Logging

**Application Logs**:
```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/var/log/pathwayboard/app.log'),
        logging.StreamHandler()
    ]
)
```

**Error Tracking (Sentry)**:
```python
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn=os.environ.get("SENTRY_DSN"),
    integrations=[FastApiIntegration()],
    traces_sample_rate=1.0,
)
```

**Uptime Monitoring**: UptimeRobot, StatusCake

---

## Future Enhancements

### Short-Term (3-6 months)

1. **Mobile App**: Native iOS/Android builds via Expo EAS
2. **Real-time Updates**: WebSockets for live dashboard updates
3. **Data Export**: CSV/Excel export of tap data
4. **Undo Functionality**: Reverse accidental taps
5. **Student Photos**: Upload and display student photos in cards

### Medium-Term (6-12 months)

1. **Multi-Class Support**: Teacher can manage multiple classes
2. **Parent Portal**: Parents view their child's progress
3. **Analytics Dashboard**: Trends, charts, class-wide insights
4. **Notifications**: Email/SMS alerts for negative behaviors
5. **Customizable Behaviors**: Teachers define their own choices

### Long-Term (12+ months)

1. **District-Wide Deployment**: Multi-school architecture
2. **AI Insights**: Predictive analytics for at-risk students
3. **Gamification**: Student-facing rewards and achievements
4. **Integration**: Google Classroom, Canvas, Schoology
5. **Mobile Offline Mode**: Record taps without internet

---

## Appendix

### A. API Request Examples (curl)

**Health Check**:
```bash
curl http://127.0.0.1:8000/health
```

**Update Roster**:
```bash
curl -X POST http://127.0.0.1:8000/update-roster \
  -H "Content-Type: application/json" \
  -d '{"initiatedAt": "2025-11-17T10:30:00Z"}'
```

**Get Students**:
```bash
curl http://127.0.0.1:8000/students?limit=33
```

**Record Tap**:
```bash
curl -X POST http://127.0.0.1:8000/taps/record \
  -H "Content-Type: application/json" \
  -d '{
    "student_name": "John Doe",
    "tap_type": "positive",
    "choice": "+ Prepared for Learning"
  }'
```

**Generate Report**:
```bash
curl -X POST http://127.0.0.1:8000/reports/generate \
  -H "Content-Type: application/json" \
  -d '{
    "student_name": "John Doe",
    "month": "November",
    "year": 2025,
    "character_equations": ["Hope", "Knowledge", "Discernment"]
  }'
```

**Download Report**:
```bash
curl -O http://127.0.0.1:8000/reports/download/John_Doe_report_November_2025.pdf
```

### B. Database Schema Diagrams

**`roster.db`**:
```
┌─────────────────────────────────┐
│           Sheet1                │
├─────────────────────────────────┤
│ Student Name       TEXT         │
│ Teacher Name       TEXT         │
│ Grade              TEXT         │
│ Room Number        TEXT         │
│ Parent 1 Email     TEXT         │
│ Parent 2 Email     TEXT         │
│ ... (dynamic columns)           │
└─────────────────────────────────┘
```

**`taps.db`**:
```
┌─────────────────────────────────┐
│             taps                │
├─────────────────────────────────┤
│ id               INTEGER PK     │
│ student_name     TEXT NOT NULL  │
│ tap_type         TEXT NOT NULL  │
│ choice           TEXT NOT NULL  │
│ timestamp        DATETIME       │
│ date             TEXT           │
│ month            TEXT           │
│ year             INTEGER        │
└─────────────────────────────────┘
     │
     ├─ INDEX: idx_student_date (student_name, date)
     └─ INDEX: idx_student_month (student_name, month, year)
```

### C. TypeScript Type Definitions

```typescript
type Student = {
  id: number;
  name: string;
  choices: string[];
  points: number;
  recentChoice?: string;
  showingScore?: boolean;
  selected?: boolean;
};

type MonthlyEquation = {
  trait1: string;
  trait2: string;
  result: string;
  color: string;
  badge_image: string;
};

type ApiStudent = {
  sheet: string;
  row: Record<string, any>;
};

type TapRecord = {
  student_name: string;
  tap_type: 'positive' | 'negative';
  choice: string;
};

type ReportRequest = {
  student_name: string;
  month?: string;
  year?: number;
  character_equations?: string[];
};
```

### D. Useful Commands

**Backend**:
```bash
# Activate virtual environment
source backend/.venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Run server (development)
uvicorn backend.server:app --reload --host 127.0.0.1 --port 8000

# Run server (production)
gunicorn -k uvicorn.workers.UvicornWorker -w 4 backend.server:app

# Check database
sqlite3 backend/roster.db "SELECT * FROM Sheet1 LIMIT 5;"
sqlite3 backend/taps.db "SELECT * FROM taps ORDER BY timestamp DESC LIMIT 10;"

# Generate requirements.txt
pip freeze > requirements.txt
```

**Frontend**:
```bash
# Install dependencies
npm install

# Start development server
npm run web

# Build for production
npm run build

# Type check
npx tsc --noEmit

# Clean cache
rm -rf node_modules .expo
npm install
```

### E. Troubleshooting

**Issue**: Frontend can't reach backend

**Solution**:
```bash
# Check backend is running
curl http://127.0.0.1:8000/health

# Check EXPO_PUBLIC_API_URL
echo $EXPO_PUBLIC_API_URL

# Set correct URL
export EXPO_PUBLIC_API_URL="http://127.0.0.1:8000"

# Restart Expo server
npm run web
```

**Issue**: Excel file not found

**Solution**:
```bash
# Use absolute path
export ROSTER_EXCEL="/home/user/PositivePathwayBoard/StdInfo.xlsx"

# Check file exists
ls -l $ROSTER_EXCEL

# Check backend logs
tail -f backend/logs/app.log
```

**Issue**: PDF generation fails

**Solution**:
```bash
# Check ReportLab installation
pip show reportlab

# Check reports directory exists
mkdir -p backend/reports

# Check file permissions
chmod 755 backend/reports
```