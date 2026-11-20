# QueryMate – Natural Language to SQL with Multi-Database & MongoDB GridFS Storage

**QueryMate** is a modern, enterprise-grade AI analytics web application that translates natural language inquiries into safe, optimized, read-only SQL queries using prompt engineering, executes them in real time against relational datasets, and provides persistent multi-database storage backed by **MongoDB Atlas / GridFS** and **SQLite**.

---

## 🌟 Key Upgrades & Capabilities

### 1. Website Redesign & Top Navigation
- **Top Navigation Bar**: Brand **QueryMate** with primary navigation options:
  1. **Home**
  2. **SQL Playground**
  3. **My Databases**
  - Primary CTA button: **"Start Querying"** (directly launches SQL Playground).
- **Public-Facing Home Page**:
  - **Hero Section**: *"Your Data. Your Questions. No SQL Required."* with interactive live query demonstration.
  - **About QueryMate**: Detailed breakdown of Role Prompting, Database Schema Context, Few-Shot Prompting, and AI-powered SQL generation.
  - **How It Works (3 Steps)**:
    1. Upload or select your database.
    2. Ask questions in plain English.
    3. Generate SQL and view real database results.
  - **Features Showcase**: Natural Language to SQL, Multiple Database Support, Dynamic Schema Detection, Prompt Engineering Transparency, Query Execution, and Query History.
  - **SaaS Footer**: Navigation links, technology stack badges, and system status indicators.

### 2. Multi-Database SQL Playground
- **Direct Database Selector at the Top**:
  - `Selected Database: [ College Database ▼ ]`
  - Instantly switch between any uploaded databases (e.g., *College Database*, *Sales Database*, *Employee Database*, etc.) directly within the playground.
  - **Dynamic In-Context Injection**: When a database is selected, QueryMate retrieves its specific schema, displays its tables/columns, and instructs the LLM with that exact database schema.
  - **Zero Cross-Database Hallucinations**: Queries are guaranteed to target only the tables and columns present in the active database.
  - **Interactive SQL Workspace**: Syntax-highlighted code editor with direct editing, one-click auto-formatting, sub-millisecond execution, paginated results, and CSV download.

### 3. My Databases Management Page
- **Multi-File Uploads**: Supports multiple CSV datasets (`.csv`) and SQLite database files (`.db`, `.sqlite`, `.sqlite3`).
- **Simultaneous Persistence**: Retains Database A, Database B, Database C, and beyond simultaneously with unique IDs (`database_id`).
- **Automatic Data Type Inference**: Automatically analyzes CSV columns and creates structured SQLite tables with inferred types (INTEGER, REAL, TEXT, DATETIME).
- **Interactive Database Cards**: View database name, original filename, upload date, table counts, record counts, and MongoDB GridFS storage status.
- **Inspect Tables Modal**: Previews table structures, data types, primary/foreign keys, and sample data records before querying.
- **Delete Database**: Removes metadata, GridFS binaries, and local cached SQLite files.

### 4. MongoDB Persistent Storage & GridFS Architecture
- **Persistent Binary Storage**: Uses **MongoDB GridFS** to store full CSV and SQLite database binaries securely.
- **Stateless Cloud Materialization**: Automatically materializes databases from GridFS upon request or after backend restarts.
- **MongoDB Collections**:
  1. `databases`: Database metadata, schema definitions, table/record counts, and GridFS file IDs.
  2. `query_history`: Complete audit trail of executed natural language questions, generated SQL, execution times, and statuses.
- **Dual Engine Architecture**: SQLite remains the fast, read-only SQL execution engine; MongoDB manages persistent storage, file recovery, and audit logging.

### 5. Strict SQL Safety & Security
- **AST Parsing (`sqlglot`)**: Enforces single `SELECT` or `UNION` queries only.
- **Destructive Operation Blocking**: Prohibits `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `CREATE`, `TRUNCATE`, `REPLACE`, `ATTACH`, `DETACH`, and `PRAGMA`.
- **Multi-Statement Blocking**: Rejects semicolon chaining.
- **Execution Clamping**: Enforces execution timeouts and automatic `LIMIT` constraints (default 500 rows).

---

## 🏗️ Architecture

```
QueryMate/
├── backend/
│   ├── main.py                     # FastAPI application & SPA static server
│   ├── mongo.py                    # MongoDB client & GridFS file operations
│   ├── database_manager.py         # Multi-database manager & GridFS materialization
│   ├── database.py                 # SQLite configuration & session hooks
│   ├── models.py                   # Benchmark dataset models
│   ├── schema_inspector.py         # Schema introspection & prompt formatting
│   ├── sql_validator.py            # sqlglot AST read-only safety validator
│   ├── prompt_engineering/
│   │   ├── builder.py              # Schema-aware prompt constructor
│   │   ├── templates.py            # Role prompts, constraints, JSON schema
│   │   └── few_shot.py             # Verified few-shot demonstration library
│   ├── services/
│   │   ├── llm_service.py          # Google Gemini API & schema-grounded demo mode
│   │   └── query_service.py        # NL-to-SQL generation, execution, and MongoDB logging
│   ├── routes/
│   │   ├── databases.py            # Multi-database upload, list, inspect, and delete
│   │   ├── query.py                # Database-specific SQL generation and execution
│   │   ├── dashboard.py            # System metrics & timeline charts
│   │   ├── prompt.py               # Prompt breakdown & live prompt inspector
│   │   └── settings.py             # Gemini API key tests & system configuration
│   ├── requirements.txt            # Python dependencies
│   ├── .env.example                # Configuration template
│   └── .env                        # Active environment configuration
├── frontend/
│   ├── src/
│   │   ├── components/             # Navbar, SqlCodeEditor, ConfirmModal
│   │   ├── pages/                  # Home, SqlPlayground, MyDatabases, PromptEngineering, Dashboard, QueryHistory
│   │   ├── services/api.js         # Unified REST client with Multi-DB support
│   │   ├── App.jsx                 # Top-level view router & state
│   │   └── index.css               # Tailwind CSS theme
│   ├── vite.config.js              # Vite server & API reverse proxy configuration
│   └── package.json                # Frontend dependencies
└── README.md
```

---

## ⚙️ Environment Variables

Copy `backend/.env.example` to `backend/.env`:

```env
# MongoDB Connection (Local or MongoDB Atlas)
MONGODB_URI=mongodb://127.0.0.1:27017/
MONGODB_DATABASE_NAME=querymate

# Google Gemini API Key (leave blank for built-in schema-grounded Demo Mode)
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash

# Security & Upload Configuration
SECRET_KEY=querymate-super-secret-key-2026
MAX_UPLOAD_SIZE_MB=25

# Query Limits
QUERY_TIMEOUT_SECONDS=5
MAX_ROWS_LIMIT=500
DEMO_MODE=true
```

---

## 🚀 Quickstart & Setup

### 1. Install Backend Dependencies
```bash
cd backend
python3 -m venv venv
source venv/bin/activate       # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Install Frontend Dependencies & Build
```bash
cd ../frontend
npm install
npm run build
```

### 3. Run the Servers

**Option A: Development Mode**
- Backend:
  ```bash
  cd backend
  source venv/bin/activate
  uvicorn main:app --host 127.0.0.1 --port 8008 --reload
  ```
- Frontend:
  ```bash
  cd frontend
  npm run dev
  ```
  Open **[http://localhost:5173](http://localhost:5173)**.

**Option B: Unified Production Server**
FastAPI directly serves the API and the compiled React SPA:
```bash
cd backend
source venv/bin/activate
uvicorn main:app --host 127.0.0.1 --port 8008
```
Open **[http://localhost:8008](http://localhost:8008)**.

---

## 🧪 Verified Workflow & Test Results

The complete multi-database lifecycle was verified end-to-end:

| Step | Action | Outcome | Verified Result |
|:---:|---|---|---|
| **1** | Upload `students.csv` | Persisted to MongoDB GridFS | `GridFS ID: 6b001151b5df4a02c36f5e80` |
| **2** | Upload `sales.csv` | Persisted to MongoDB GridFS | `GridFS ID: 6b001151b5df4a02c36f5e82` |
| **3** | Retain Multiple DBs | Both databases retained simultaneously | Total registered in MongoDB: 4 DBs |
| **4** | Query Students DB | *"Show all students."* | `SELECT * FROM "students" LIMIT 500` (5 rows returned) |
| **5** | Switch DB in Playground | Switched to Sales DB directly | Active schema refreshed to `products` table |
| **6** | Query Sales DB | *"Show the top 5 products by revenue."* | `SELECT * FROM "products" ORDER BY "unit_price" DESC LIMIT 5` |
| **7** | Cold Backend Restart | Deleted local cache & restarted uvicorn | Databases restored and queryable directly from GridFS |

---

## 📄 License
MIT License. Developed for research and enterprise natural language database systems.
