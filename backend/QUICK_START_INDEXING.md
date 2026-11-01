# Quick Start: Portfolio Vector Indexing

Run these commands in order to index your portfolio into ChromaDB.

---

## Prerequisites Check

```bash
# 1. Check if Node.js is installed
node --version

# 2. Check if MongoDB is running
mongo --eval "db.version()"
```

**Note:** Docker is NOT required for ChromaDB!

---

## Step 1: Configure ChromaDB (No Docker!)

Ensure your `backend/.env` has:
```env
CHROMA_IN_MEMORY=true
CHROMA_COLLECTION=portfolio
```

Data will be stored in: `backend/chroma_data/` directory

**No separate server needed!**

---

## Step 2: Configure OpenAI API Key

1. Get API key: https://platform.openai.com/api-keys
2. Add to `backend/.env`:
   ```env
   OPENAI_API_KEY=sk-your_actual_key_here
   ```

---

## Step 3: (Optional) Seed Sample Data

If your MongoDB is empty:

```bash
cd backend
node tests/seedPortfolioData.js
```

---

## Step 4: Run Vector Indexing

```bash
cd backend
node tests/testVectorIndexing.js
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
  ✓ Generated 17 documents

📋 Step 3: Generating embeddings and indexing...

  [1/17] Processing: profile-main
      Type: profile
      ✓ Embedding generated (1536 dimensions)
      
  [2/17] Processing: edu-1
      Type: education
      ✓ Embedding generated (1536 dimensions)

  ...

  [17/17] Processing: certification-...
      Type: certification
      ✓ Embedding generated (1536 dimensions)

📋 Step 4: Storing vectors in ChromaDB...
  ✓ Stored 17 vectors in ChromaDB

═══════════════════════════════════════════════════════
   INDEXING COMPLETE
═══════════════════════════════════════════════════════

📊 Summary:
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

After successful indexing:

- ✅ ChromaDB has 17 documents
- ✅ Profile exists
- ✅ Education exists (2 documents)
- ✅ Projects exist (4 documents)
- ✅ Experience exists (2 documents)
- ✅ Skills exist (5 categories)
- ✅ Certifications exist (3 documents)

---

## Troubleshooting

### Error: "OPENAI_API_KEY not found"
→ Add to `.env`: `OPENAI_API_KEY=sk-...`

### Error: "ChromaDB not available"
→ Ensure `.env` has: `CHROMA_IN_MEMORY=true`

### Error: "MongoDB connection timeout"
→ Start MongoDB: `mongod`

---

## Cost

- Full indexing: ~$0.00004 (less than $0.0001)
- Extremely affordable!

---

## Re-indexing

Safe to run multiple times:
```bash
node tests/testVectorIndexing.js
```

No duplicates will be created.

---

## Done!

Your portfolio is now vectorized and ready for RAG-powered chatbot integration.
