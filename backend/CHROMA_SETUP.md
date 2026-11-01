# ChromaDB Vector Database Setup (No Docker Required!)

## Overview

This project uses **ChromaDB** as a local vector database for the RAG (Retrieval-Augmented Generation) chatbot system. ChromaDB stores vector embeddings of portfolio content and enables semantic search.

**Good news:** ChromaDB runs locally without Docker! No external server needed.

---

## Installation

ChromaDB is already installed via npm:

```bash
npm install chromadb
```

---

## Running ChromaDB Locally (No Docker!)

### Default: Local Mode (Recommended for Windows)

**No setup required!** ChromaDB runs in-process with your Node.js backend.

Data is stored in: `backend/chroma_data/` directory

**Configuration in `.env`:**
```env
CHROMA_IN_MEMORY=true
CHROMA_COLLECTION=portfolio
```

That's it! No Docker, no separate server, no additional software needed.

---

## Configuration

### Local Mode (No Docker - Default)

**`.env` configuration:**
```env
CHROMA_IN_MEMORY=true
CHROMA_COLLECTION=portfolio
```

**Optional:** Customize data directory:
```env
CHROMA_DATA_PATH=D:\My_portfolio\backend\chroma_data
```

### Server Mode (Docker/Hosted - Optional)

If you want to use an external ChromaDB server:

**`.env` configuration:**
```env
CHROMA_IN_MEMORY=false
CHROMA_URL=http://localhost:8000
CHROMA_COLLECTION=portfolio
```

Then start ChromaDB server:
```bash
docker run -p 8000:8000 chromadb/chroma
```

---

## Collection Details

### Collection Name
`portfolio`

### Metadata
- **Description**: Portfolio content embeddings for RAG chatbot
- **Distance Metric**: Cosine similarity (`hnsw:space: cosine`)

### Document Structure
Each document stored in ChromaDB contains:
- **id**: Unique identifier (e.g., `project-123`, `skill-456`)
- **document**: The actual text content
- **embedding**: 1536-dimensional vector (from OpenAI embeddings)
- **metadata**: Additional info (type, title, category, etc.)

---

## Vector Database Service API

The `vectorDB.js` service provides these methods:

### Initialize
```javascript
await vectorDBService.initialize();
```

### Check if Ready
```javascript
const isReady = vectorDBService.isReady();
```

### Add Documents
```javascript
await vectorDBService.addDocuments({
  ids: ['project-1', 'project-2'],
  documents: ['Project description 1', 'Project description 2'],
  embeddings: [[0.1, 0.2, ...], [0.3, 0.4, ...]],
  metadatas: [
    { type: 'project', title: 'Project 1' },
    { type: 'project', title: 'Project 2' }
  ]
});
```

### Query (Semantic Search)
```javascript
const results = await vectorDBService.query({
  queryEmbedding: [0.1, 0.2, ...],  // Query vector
  nResults: 3  // Number of results
});
```

### Get All Documents
```javascript
const allDocs = await vectorDBService.getAllDocuments();
```

### Count Documents
```javascript
const count = await vectorDBService.count();
```

### Delete Documents
```javascript
await vectorDBService.deleteDocuments(['project-1', 'project-2']);
```

### Clear Collection
```javascript
await vectorDBService.clearCollection();
```

### Get Stats
```javascript
const stats = await vectorDBService.getStats();
// Returns: { initialized, collectionName, documentCount, chromaUrl }
```

---

## Testing the Vector Database

### Local Mode (No Docker)

```bash
# 1. Ensure .env has:
# CHROMA_IN_MEMORY=true

# 2. Start backend server
cd backend
npm start
```

### Server Mode (Docker)

```bash
# 1. Start ChromaDB Server
docker run -p 8000:8000 chromadb/chroma

# 2. Ensure .env has:
# CHROMA_IN_MEMORY=false
# CHROMA_URL=http://localhost:8000

# 3. Start backend server
cd backend
npm start
```

### Check Status

```bash
# Health check
curl http://localhost:5000/api/vectordb/health

# Full status
curl http://localhost:5000/api/vectordb/status
```

**Expected Response (Local Mode):**
```json
{
  "success": true,
  "initialized": true,
  "collectionName": "portfolio",
  "documentCount": 0,
  "mode": "local",
  "dataPath": "D:\\My_portfolio\\backend\\chroma_data"
}
```

**Expected Response (Server Mode):**
```json
{
  "success": true,
  "initialized": true,
  "collectionName": "portfolio",
  "documentCount": 0,
  "mode": "server",
  "chromaUrl": "http://localhost:8000"
}
```

---

## Server Startup Flow

### Local Mode (No Docker)

1. **MongoDB connects** → Success
2. **ChromaDB initializes** → Creates/uses local directory `chroma_data/`
3. **Collection created/loaded** → `portfolio` collection ready

### Console Output (Local Mode)
```
✅ MongoDB connected successfully
📊 Database: portfolio
✓ ChromaDB initialized in local mode (no Docker required)
✓ Data directory: D:\My_portfolio\backend\chroma_data
✓ Collection "portfolio" ready
✅ Vector Database initialized
🚀 Server is running on port 5000
```

### Server Mode (Docker)

1. **MongoDB connects** → Success
2. **VectorDB initializes** → Connects to ChromaDB at `localhost:8000`
3. **Collection created/loaded** → `portfolio` collection ready

### Console Output (Server Mode)
```
✅ MongoDB connected successfully
📊 Database: portfolio
✓ Connected to ChromaDB at http://localhost:8000
✓ Collection "portfolio" ready
✅ Vector Database initialized
🚀 Server is running on port 5000
```

### If ChromaDB is Not Running (Local Mode)

This should never happen in local mode! ChromaDB runs in-process.

If you see this error, check:
1. `.env` has `CHROMA_IN_MEMORY=true`
2. Backend directory has write permissions

### If ChromaDB is Not Running (Server Mode)

```
✅ MongoDB connected successfully
📊 Database: portfolio
⚠ ChromaDB not available - chatbot will be disabled
⚠ Vector Database initialization failed: fetch failed
🚀 Server is running on port 5000
```

The server will still run, but chatbot features will be disabled gracefully.

---

## Troubleshooting

### ChromaDB Connection Failed (Server Mode)

**Error**: `fetch failed` or `ECONNREFUSED`

**Solution**: 
- Make sure you're using local mode: `CHROMA_IN_MEMORY=true`
- OR if using server mode, start ChromaDB server: `docker run -p 8000:8000 chromadb/chroma`

### Collection Not Found

**Error**: `Collection not found`

**Solution**: The collection is auto-created. If deleted manually, restart the backend server.

### Port Already in Use (Server Mode Only)

**Error**: `Port 8000 is already allocated`

**Solution**: 
- Switch to local mode: `CHROMA_IN_MEMORY=true` (recommended)
- OR stop existing ChromaDB instance
- OR change `CHROMA_URL` in `.env` to a different port

### Data Directory Permission Error (Local Mode)

**Error**: `EACCES` or permission denied

**Solution**: 
- Ensure backend directory has write permissions
- OR specify custom path: `CHROMA_DATA_PATH=C:\some\writable\path`

---

## Data Persistence

### Local Mode

ChromaDB data is automatically stored in the `backend/chroma_data/` directory.

**Persistent across:**
- ✅ Server restarts
- ✅ Node.js process restarts
- ✅ System reboots

**Backup:**
Simply copy the entire `chroma_data/` directory.

### Server Mode (Docker)

Docker Volume: ChromaDB data persists in Docker volumes by default.

### Custom Data Directory

Using Docker Compose with volume mount:
```yaml
volumes:
  - ./chroma_data:/chroma/chroma
```

This stores data in `backend/chroma_data/` folder.

---

## Next Steps

After vector database setup:

1. **Create embeddings** → Use OpenAI API to convert text to vectors
2. **Index portfolio data** → Store projects, skills, certifications in ChromaDB
3. **Implement RAG** → Query vector DB + generate responses with LLM
4. **Build chatbot UI** → Frontend component to interact with the system

---

## API Endpoints

### Check Vector DB Health
```
GET /api/vectordb/health
```

### Get Vector DB Status
```
GET /api/vectordb/status
```

Response:
```json
{
  "success": true,
  "initialized": true,
  "collectionName": "portfolio",
  "documentCount": 25,
  "chromaUrl": "http://localhost:8000"
}
```

---

## Architecture

```
┌─────────────────┐
│   Backend API   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  vectorDB.js    │  ← Service Layer
│  (Singleton)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   ChromaDB      │  ← Vector Database
│  (Port 8000)    │
└─────────────────┘
```

---

## Security Notes

- ChromaDB runs locally in-process (no external network calls in local mode)
- No authentication required for local development
- Data stored in local file system
- Don't expose ChromaDB port (8000) to public internet if using server mode

---

## Resources

- [ChromaDB Documentation](https://docs.trychroma.com/)
- [ChromaDB GitHub](https://github.com/chroma-core/chroma)
- [ChromaDB JavaScript Client](https://docs.trychroma.com/js_reference/Client)
