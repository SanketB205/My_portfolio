# Portfolio Indexing - Quick Command Reference

## Prerequisites

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and update:
```bash
copy .env.example .env
```

Required variables:
```env
OPENAI_API_KEY=your_openai_api_key_here
CHROMA_IN_MEMORY=true
CHROMA_COLLECTION=portfolio
```

### 3. Get OpenAI API Key
1. Visit: https://platform.openai.com/api-keys
2. Sign up / Log in
3. Create new API key
4. Copy to `.env`

---

## Running ChromaDB (No Docker Required!)

**Good news:** ChromaDB runs locally without Docker!

Simply ensure your `.env` has:
```env
CHROMA_IN_MEMORY=true
```

Data will be stored in: `backend/chroma_data/` directory

**No separate server needed!** ChromaDB runs in-process with your Node.js backend.

---

## Seeding Sample Data

If your MongoDB is empty, seed sample data first:

```bash
node tests/seedPortfolioData.js
```

This adds:
- 2 internship/experience records
- 34 skill records

---

## Running Indexing

### Full Test (Recommended)
```bash
node tests/testVectorIndexing.js
```

This will:
1. Connect to MongoDB
2. Initialize services
3. Generate portfolio documents
4. Generate embeddings
5. Store in ChromaDB
6. Verify storage
7. Test re-indexing (duplicate prevention)

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

## Programmatic Usage

### In Your Code

```javascript
const { indexPortfolioDocuments } = require('./services/portfolioIndexer');

// Index portfolio
const stats = await indexPortfolioDocuments();
console.log(stats);
```

### From Server Startup

Add to `server.js`:

```javascript
const { indexPortfolioDocuments } = require('./services/portfolioIndexer');

// After MongoDB connects
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');
    
    // Auto-index on server start (optional)
    await indexPortfolioDocuments();
  });
```

---

## Troubleshooting

### Error: "OPENAI_API_KEY not found"

**Solution:**
```bash
# Add to .env
echo OPENAI_API_KEY=sk-your-key-here >> .env
```

### Error: "ChromaDB not available"

**Solution:**
- Ensure `.env` has: `CHROMA_IN_MEMORY=true`
- Ensure backend directory has write permissions
- Check that `chroma_data` directory can be created

### Error: "MongoDB connection timeout"

**Solution:**
```bash
# Start MongoDB
mongod
```

### Error: "Permission denied" on chroma_data

**Solution:**
```bash
# Windows PowerShell: Grant write permissions to backend folder
# Or specify custom path in .env:
echo CHROMA_DATA_PATH=C:\some\writable\path >> .env
```

---

## Manual Indexing API

You can also create a manual indexing endpoint:

```javascript
// routes/indexing.js
const router = require('express').Router();
const { indexPortfolioDocuments } = require('../services/portfolioIndexer');
const auth = require('../middleware/auth');

// POST /api/indexing/reindex (admin only)
router.post('/reindex', auth, async (req, res) => {
  try {
    const stats = await indexPortfolioDocuments();
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
```

Then trigger from admin dashboard or curl:
```bash
curl -X POST http://localhost:5000/api/indexing/reindex \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Re-indexing

Safe to run multiple times - uses deterministic IDs:

```bash
# Run indexing
node tests/testVectorIndexing.js
# Result: 17 documents

# Run again
node tests/testVectorIndexing.js
# Result: Still 17 documents (no duplicates)
```

---

## Checking Status

### Check Services

```bash
node -e "
const { getIndexingStatus } = require('./services/portfolioIndexer');
(async () => {
  const status = await getIndexingStatus();
  console.log(JSON.stringify(status, null, 2));
  process.exit(0);
})();
"
```

### Check ChromaDB Count

```bash
node -e "
const chromaService = require('./services/chromaService');
(async () => {
  await chromaService.initialize();
  const count = await chromaService.count();
  console.log('Documents in ChromaDB:', count);
  process.exit(0);
})();
"
```

---

## Cost Estimation

**Per full indexing run:**
- 17 documents × ~400 chars = ~7,000 characters
- ~1,750 tokens
- Cost: ~$0.00004

**Extremely cheap!**

---

## Next Steps

After indexing is complete:

1. ✅ Verify all tests pass
2. ✅ Confirm ChromaDB has 17 documents
3. ✅ Check for ShoeHub, Profile, Education
4. ❌ Do NOT implement chatbot retrieval yet (that's Step 5)

---

## Summary

```bash
# 1. Start ChromaDB
docker run -p 8000:8000 chromadb/chroma

# 2. Start MongoDB (if not running)
mongod

# 3. Configure .env
# Add OPENAI_API_KEY

# 4. Seed data (if needed)
node tests/seedPortfolioData.js

# 5. Run indexing test
node tests/testVectorIndexing.js

# 6. Verify success
# Expected: ✅ ALL TESTS PASSED
```

Done! Your portfolio is now vectorized and stored in ChromaDB.
