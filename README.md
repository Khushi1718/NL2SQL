# NL2SQL

An enterprise-grade natural language interface for relational databases. NL2SQL translates plain English questions into schema-grounded, read-only SQL queries, verifies them using Abstract Syntax Tree (AST) enforcement, and executes them against SQLite with persistent binary storage managed by MongoDB GridFS.

---

## System Architecture

```
                  +----------------------------------------------------+
                  |               Frontend (React 18 + Vite)           |
                  |     Editorial UI • GSAP Visuals • Tailwind CSS     |
                  +-------------------------+--------------------------+
                                            |
                                            | REST API (JSON / Multipart)
                                            v
+-----------------------------------------------------------------------------------+
|                            Backend Service (FastAPI)                              |
|                                                                                   |
|  +--------------------+    +-----------------------+    +----------------------+  |
|  |  Schema Inspector  |    |  Prompt Engineering   |    |  SQL AST Validator   |  |
|  |  • Table Schemas   | -> |  • Dynamic Context    | -> |  • sqlglot Compiler  |  |
|  |  • Foreign Keys    |    |  • Few-Shot Examples  |    |  • Read-Only Safety  |  |
|  +--------------------+    +-----------+-----------+    +----------+-----------+  |
|                                        |                               |          |
+----------------------------------------|-------------------------------|----------+
                                         |                               |
                      +------------------v------------------+            |
                      |           LLM Inference             |            |
                      |  • Google Gemini API                |            |
                      |  • Schema-Grounded Fallback Engine  |            |
                      +------------------+------------------+            |
                                         | (Generated SQL)               |
                                         +---------------+---------------+
                                                         |
                                                         v
                                       +-----------------------------------+
                                       |          Execution Layer          |
                                       +-----------------+-----------------+
                                                         |
                               +-------------------------+-------------------------+
                               |                                                   |
                               v                                                   v
                  +-------------------------+                         +-------------------------+
                  |   SQLite Execution      |                         |     MongoDB GridFS      |
                  |   • In-Memory / Cached  |                         |   • Binary Persistence  |
                  |   • Real-Time Queries   |                         |   • Multi-DB Storage    |
                  |   • Sub-10ms Latency    |                         |   • Schema Metadata     |
                  +-------------------------+                         +-------------------------+
```

---

## Core Capabilities

- **Schema-Grounded SQL Synthesis**: Injects verified table schemas, column types, and relational constraints into the prompt context to eliminate fictitious syntax.
- **AST Security Enforcement**: Uses `sqlglot` to parse queries at compiler level. Only single `SELECT` or `UNION` statements are permitted; all mutations (`INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`) and multi-statement injection attempts are blocked.
- **Multi-Database Management**: Supports simultaneous upload, inspection, and switching across multiple `.csv` and `.sqlite` / `.db` files with automatic schema inference.
- **MongoDB GridFS Persistence**: Stores dataset binaries permanently in MongoDB GridFS, dynamically materializing execution engines on demand.
- **Transparent Query Workspace**: Interactive code editor with schema inspection, execution latency tracking, and CSV data export.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, GSAP, Lucide Icons |
| **Backend** | Python 3.10+, FastAPI, Uvicorn, Pydantic |
| **SQL Engine** | SQLite3, `sqlglot` (AST validation & transpilation) |
| **Persistence** | MongoDB, GridFS, PyMongo |
| **AI / LLM** | Google Gemini API (`google-genai`), Schema-Grounded Heuristic Fallback |

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB instance (local or MongoDB Atlas)

### 1. Clone & Configure Environment

```bash
git clone https://github.com/Khushi1718/NL2SQL.git
cd NL2SQL
```

Create `backend/.env`:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/
MONGODB_DATABASE_NAME=nl2sql

GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

MAX_UPLOAD_SIZE_MB=25
QUERY_TIMEOUT_SECONDS=5
MAX_ROWS_LIMIT=500
```

*(Note: If `GEMINI_API_KEY` is omitted, the application operates in self-contained schema-grounded evaluation mode.)*

---

### 2. Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate    # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The application will be accessible at `http://localhost:5173`.

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | System health and database connectivity |
| `GET` | `/api/databases` | List registered databases and metadata |
| `POST` | `/api/databases/upload` | Upload `.csv` or `.sqlite` dataset to GridFS |
| `GET` | `/api/databases/{id}/schema` | Retrieve tables, column types, and foreign keys |
| `POST` | `/api/query/generate` | Synthesize SQL from natural language input |
| `POST` | `/api/query/execute` | Validate AST and execute SQL query |
| `DELETE` | `/api/databases/{id}` | Remove database metadata and GridFS binaries |

---

## Security Architecture

1. **Strict Read-Only Enforcement**: Query ASTs must resolve to an isolated `Select` root node.
2. **Deterministic Timeouts**: Query execution is clamped to a strict 5-second ceiling.
3. **Result Clamping**: Query outputs are bounded to 500 rows to prevent memory exhaustion.
4. **Data Isolation**: Only metadata (table names and column identifiers) is passed to language models; raw database records never leave the local execution boundary.

---

## License

MIT License.
