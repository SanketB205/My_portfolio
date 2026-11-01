# Backend Services

This directory contains core services for the portfolio backend.

---

## embeddingService.js - Embedding Generation Service

Generates vector embeddings for text using OpenAI's text-embedding-3-small model.

### Quick Start

```javascript
const embeddingService = require('./services/embeddingService');

// Initialize (done automatically on server start)
embeddingService.initialize();

// Generate embedding
const embedding = await embeddingService.generateEmbedding("Your text here");
// Returns: [0.1, 0.2, ..., 0.5] (1536 dimensions)
```

### Key Methods

- `initialize()` - Initialize OpenAI client
- `isReady()` - Check if service is ready
- `generateEmbedding(text)` - Generate single embedding
- `generateEmbeddings(texts)` - Batch generate embeddings
- `getModelInfo()` - Get model details

### Configuration

Requires `OPENAI_API_KEY` in `.env`

---

## chromaService.js - Vector Storage Service

Manages vector storage and retrieval in ChromaDB.

### Quick Start

```javascript
const chromaService = require('./services/chromaService');

// Initialize (done automatically on server start)
await chromaService.initialize();

// Store document with embedding
await chromaService.upsertDocument({
  id: 'doc-1',
  content: 'Document text',
  embedding: [...],  // 1536-dim vector
  metadata: { type: 'project', title: 'Title' }
});

// Get document
const doc = await chromaService.getDocument('doc-1');
```

### Key Methods

- `initialize()` - Connect to ChromaDB
- `upsertDocument()` - Store/update single document
- `upsertDocuments()` - Batch store/update
- `getDocument(id)` - Retrieve by ID
- `getAllDocuments()` - Get all documents
- `count()` - Count documents
- `getStats()` - Get statistics

### Configuration

Requires ChromaDB server running on port 8000 (configurable via `CHROMA_URL`)

---

## portfolioIndexer.js - Indexing Orchestration

Orchestrates the complete indexing pipeline: generate documents → embeddings → storage.

### Quick Start

```javascript
const { indexPortfolioDocuments } = require('./services/portfolioIndexer');

// Index all portfolio documents
const stats = await indexPortfolioDocuments();
// {
//   totalDocuments: 17,
//   indexed: 17,
//   failed: 0
// }
```

### Key Functions

- `indexPortfolioDocuments()` - Full indexing pipeline
- `reindexPortfolio()` - Re-index (safe, no duplicates)
- `getIndexingStatus()` - Get service status

---

## vectorDB.js - Vector Database Service (Legacy)

**Note:** This service has been superseded by `chromaService.js`.

A singleton service for managing ChromaDB vector database operations.

### Quick Start

```javascript
const vectorDBService = require('./services/vectorDB');

// Service is auto-initialized when server starts
// Check if ready
if (vectorDBService.isReady()) {
  // Use the service
}
```

### Usage Examples

#### Example 1: Add Portfolio Projects to Vector DB

```javascript
const vectorDBService = require('./services/vectorDB');

// Assume you have embeddings from OpenAI
const projects = [
  {
    id: 'project-1',
    text: 'E-commerce platform built with React and Node.js',
    embedding: [0.1, 0.2, 0.3, ...], // 1536-dim vector
    metadata: {
      type: 'project',
      title: 'E-commerce Platform',
      technologies: 'React, Node.js, MongoDB'
    }
  }
];

await vectorDBService.addDocuments({
  ids: projects.map(p => p.id),
  documents: projects.map(p => p.text),
  embeddings: projects.map(p => p.embedding),
  metadatas: projects.map(p => p.metadata)
});
```

#### Example 2: Semantic Search

```javascript
// User asks: "What projects use React?"
const queryEmbedding = [0.15, 0.22, 0.31, ...]; // Embedding of the question

const results = await vectorDBService.query({
  queryEmbedding,
  nResults: 3 // Top 3 most similar documents
});

console.log(results);
// {
//   ids: [['project-1', 'project-5', 'project-3']],
//   documents: [['E-commerce platform...', 'Portfolio website...', ...]],
//   metadatas: [[{type: 'project', ...}, {...}, {...}]],
//   distances: [[0.12, 0.18, 0.24]] // Lower = more similar
// }
```

#### Example 3: Get Collection Stats

```javascript
const stats = await vectorDBService.getStats();
console.log(stats);
// {
//   initialized: true,
//   collectionName: 'portfolio',
//   documentCount: 25,
//   chromaUrl: 'http://localhost:8000'
// }
```

#### Example 4: Clear and Re-index

```javascript
// Clear all documents
await vectorDBService.clearCollection();

// Re-index fresh data
await indexAllPortfolioData();
```

### Methods Reference

| Method | Description | Returns |
|--------|-------------|---------|
| `initialize()` | Connect to ChromaDB and create collection | `Promise<boolean>` |
| `isReady()` | Check if DB is initialized | `boolean` |
| `addDocuments({ ids, documents, embeddings, metadatas })` | Add documents with vectors | `Promise<boolean>` |
| `query({ queryEmbedding, nResults })` | Semantic search | `Promise<QueryResults>` |
| `getAllDocuments()` | Retrieve all documents | `Promise<Documents>` |
| `count()` | Get document count | `Promise<number>` |
| `deleteDocuments(ids)` | Delete by IDs | `Promise<boolean>` |
| `clearCollection()` | Delete all documents | `Promise<boolean>` |
| `getStats()` | Get collection info | `Promise<Stats>` |

### Error Handling

The service is designed to fail gracefully:

```javascript
// If ChromaDB is not running
await vectorDBService.initialize(); // Returns false, doesn't crash

if (!vectorDBService.isReady()) {
  console.log('Vector DB not available');
  // Your app continues working without chatbot
}
```

### Integration with RAG Pipeline

```javascript
// 1. User sends a question
const userQuestion = "What are your React projects?";

// 2. Generate embedding for the question (using OpenAI)
const questionEmbedding = await generateEmbedding(userQuestion);

// 3. Find relevant context from vector DB
const context = await vectorDBService.query({
  queryEmbedding: questionEmbedding,
  nResults: 3
});

// 4. Build prompt with context
const prompt = `
Context:
${context.documents[0].join('\n')}

Question: ${userQuestion}
`;

// 5. Send to LLM for final response
const response = await callLLM(prompt);
```

### Notes

- **Singleton pattern**: One instance shared across the entire app
- **Auto-initialization**: Called automatically in `server.js` after MongoDB connects
- **Graceful degradation**: If ChromaDB is unavailable, app continues without chatbot
- **Cosine similarity**: Uses cosine distance for vector search (best for text embeddings)

### Dependencies

- `chromadb` - ChromaDB JavaScript client
- ChromaDB server running on port 8000 (configurable via `CHROMA_URL`)

### See Also

- [CHROMA_SETUP.md](../CHROMA_SETUP.md) - Full setup guide
- [ChromaDB Docs](https://docs.trychroma.com/)
