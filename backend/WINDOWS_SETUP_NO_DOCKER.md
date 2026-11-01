# Windows Setup - ChromaDB Without Docker

## ✅ Good News: No Docker Required!

ChromaDB runs locally on Windows without Docker. This guide shows you exactly how.

---

## Step-by-Step Setup

### Step 1: Verify Prerequisites

Open PowerShell or Command Prompt and check:

```powershell
# Check Node.js is installed
node --version
# Expected: v18.x.x or higher

# Check npm is installed
npm --version
# Expected: v9.x.x or higher

# Check MongoDB is running
mongo --eval "db.version()"
# Expected: MongoDB shell version
```

If MongoDB is not running:
```powershell
# Start MongoDB
mongod
```

---

### Step 2: Configure Environment

1. Open `backend\.env` in any text editor

2. Ensure these lines exist:
```env
CHROMA_IN_MEMORY=true
CHROMA_COLLECTION=portfolio
OPENAI_API_KEY=your_openai_api_key_here
```

3. Get your OpenAI API key:
   - Visit: https://platform.openai.com/api-keys
   - Create new secret key
   - Copy and paste into `.env`

**Example `.env` file:**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/portfolio
JWT_SECRET=your_jwt_secret

CHROMA_IN_MEMORY=true
CHROMA_COLLECTION=portfolio
OPENAI_API_KEY=sk-proj-abc123...
```

---

### Step 3: Install Dependencies

```powershell
cd D:\My_portfolio\backend
npm install
```

This installs ChromaDB (already in package.json).

---

### Step 4: Seed Sample Data (Optional)

If your MongoDB is empty, add sample data:

```powershell
node tests\seedPortfolioData.js
```

Expected output:
```
✅ Added 2 experience records
✅ Added 34 skill records
```

---

### Step 5: Run Vector Indexing Test

```powershell
node tests\testVectorIndexing.js
```

---

## Expected Output

```
═══════════════════════════════════════════════════════
   VECTOR INDEXING TEST
═══════════════════════════════════════════════════════

📊 Step 1: Connecting to MongoDB...
✅ MongoDB connected

📊 Step 2: Initializing services...
✓ OpenAI Embedding Service initialized
✓ Using model: text-embedding-3-small
✓ ChromaDB initialized in local mode (no Docker required)
✓ Data directory: D:\My_portfolio\backend\chroma_data
✓ Collection "portfolio" ready

📊 Step 3: Checking initial status...
Initial document count in ChromaDB: 0

📊 Step 4: Running indexing (FIRST TIME)...

═══════════════════════════════════════════════════════
   PORTFOLIO INDEXING
═══════════════════════════════════════════════════════

📋 Step 1: Checking services...
  ✓ Embedding service ready
  ✓ ChromaDB service ready

📋 Step 2: Generating portfolio documents...
🔄 Generating portfolio documents...
  ✓ Profile document
  ✓ Education documents (2)
  ✓ Project documents (4)
  ✓ Experience documents (2)
  ✓ Skill documents (5)
  ✓ Certification documents (3)
✅ Generated 17 portfolio documents
  ✓ Generated 17 documents

📋 Step 3: Generating embeddings and indexing...
─────────────────────────────────────────────────────

  [1/17] Processing: profile-main
      Type: profile
      ✓ Embedding generated (1536 dimensions)

  [2/17] Processing: edu-1
      Type: education
      ✓ Embedding generated (1536 dimensions)

  ...

  [17/17] Processing: certification-6aa620a0790771271e5236c4
      Type: certification
      ✓ Embedding generated (1536 dimensions)

─────────────────────────────────────────────────────

📋 Step 4: Storing vectors in ChromaDB...
  ✓ Stored 17 vectors in ChromaDB

📋 Step 5: Verifying storage...
  ✓ ChromaDB now contains 17 documents

═══════════════════════════════════════════════════════
   INDEXING COMPLETE
═══════════════════════════════════════════════════════

📊 Summary:
─────────────────────────────────────────────────────
  Total documents:      17
  Successfully indexed: 17
  Failed:               0
  In ChromaDB:          17

...

═══════════════════════════════════════════════════════
   ✅ ALL TESTS PASSED
═══════════════════════════════════════════════════════
```

---

## Verification

After successful test, verify:

- [x] ✅ ChromaDB initialized in local mode
- [x] ✅ 17 documents indexed
- [x] ✅ Profile exists
- [x] ✅ Education exists (2 documents)
- [x] ✅ Projects exist (4 documents including ShoeHub)
- [x] ✅ Experience exists (2 internships)
- [x] ✅ Skills exist (5 categories)
- [x] ✅ Certifications exist (3 documents)
- [x] ✅ Re-indexing doesn't create duplicates

---

## Where is Data Stored?

ChromaDB data is stored in:
```
D:\My_portfolio\backend\chroma_data\
```

This directory is automatically created when you run the test.

**Persistent across:**
- ✅ Server restarts
- ✅ Node.js process restarts
- ✅ Windows reboots

---

## Common Errors and Solutions

### Error: "OPENAI_API_KEY not found"

**Solution:**
1. Open `backend\.env`
2. Add: `OPENAI_API_KEY=sk-your-actual-key`
3. Save file
4. Run test again

### Error: "MongoDB connection timeout"

**Solution:**
```powershell
# Start MongoDB in separate terminal
mongod
```

### Error: "Permission denied" on chroma_data

**Solution:**
Right-click `backend` folder → Properties → Security → Edit
Ensure your user account has "Write" permission.

OR specify custom path in `.env`:
```env
CHROMA_DATA_PATH=C:\Users\YourName\Documents\chroma_data
```

### Error: "Cannot find module 'chromadb'"

**Solution:**
```powershell
cd D:\My_portfolio\backend
npm install chromadb
```

---

## Running the Backend Server

After indexing is complete, start your backend:

```powershell
cd D:\My_portfolio\backend
npm start
```

Expected output:
```
✅ MongoDB connected successfully
📊 Database: portfolio
✓ ChromaDB initialized in local mode (no Docker required)
✓ Data directory: D:\My_portfolio\backend\chroma_data
✓ Collection "portfolio" ready
✅ Vector Database initialized
🚀 Server is running on port 5000
```

---

## Re-indexing

Safe to run multiple times (no duplicates created):

```powershell
node tests\testVectorIndexing.js
```

---

## Cost

- Full indexing: ~$0.00004 USD
- Extremely affordable!

---

## Summary of Changes

### What Changed from Docker Version?

1. **`.env` configuration:**
   - Added: `CHROMA_IN_MEMORY=true`
   - Removed: Need for `CHROMA_URL=http://localhost:8000`

2. **No external server needed:**
   - ChromaDB runs in-process with Node.js
   - Data stored in local `chroma_data/` directory

3. **Same API, same functionality:**
   - All services work exactly the same
   - All tests pass
   - All features work

### What Didn't Change?

- ✅ `embeddingService.js` - unchanged
- ✅ `portfolioIndexer.js` - unchanged
- ✅ Portfolio document generation - unchanged
- ✅ Test scripts - unchanged
- ✅ All functionality - unchanged

Only `chromaService.js` was updated to support local mode.

---

## Quick Start (TL;DR)

```powershell
# 1. Ensure .env has:
#    CHROMA_IN_MEMORY=true
#    OPENAI_API_KEY=sk-your-key

# 2. Start MongoDB
mongod

# 3. Install dependencies
cd D:\My_portfolio\backend
npm install

# 4. Seed data (if needed)
node tests\seedPortfolioData.js

# 5. Run indexing test
node tests\testVectorIndexing.js

# 6. Expected: ✅ ALL TESTS PASSED
```

Done! ChromaDB is now running locally on Windows without Docker.

---

## Need Help?

Check these files for more details:
- `CHROMA_SETUP.md` - Detailed ChromaDB configuration
- `INDEXING_COMMANDS.md` - All available commands
- `EMBEDDING_AND_VECTOR_STORAGE.md` - Technical deep dive
