# AI Resume Recommender (MERN)

A lightweight, end-to-end demo that lets a hiring manager upload multiple PDF résumés plus a job description, then instantly see the best-matching candidates ranked by semantic similarity.

## Quick Start (local)

### 1. Clone & install
```bash
git clone https://github.com/<you>/resume-recommender.git
cd resume-recommender
npm run dev:install   # installs both client & server deps
```

### 2. Env variables
```bash
cp server/.env.example server/.env
# add your Mongo URI + OpenAI key
```

### 3. Run
```bash
npm run dev           # concurrently spins up client and server
```

Visit http://localhost:3000 → drag-and-drop résumés → paste JD → get ranked results in <30 s.

## Tech choices
- MERN (MongoDB, Express, React, Node)  
- PDF parsing: pdf-parse  
- Embeddings: OpenAI text-embedding-3-small  
- Similarity: cosine similarity via ml-distance  
- Upload: Multer + memory storage (drops after session)  
- Styling: pure CSS modules (no heavy UI libs)

## Folder map (condensed)
```
server/
├── app.js               # Express config + routes
├── controllers/         # business logic
├── services/            # pdf, ai, similarity
├── models/              # Session, Resume
client/
├── src/
│── components/          # FileUpload, JobDescriptionInput, ResultsPanel
│── pages/Dashboard.js   # orchestrates UI
```

## 90-second architecture
1. User uploads PDFs + JD → React POSTs multipart form to `/api/upload`
2. Express (Multer) buffers files → pdfService extracts raw text
3. aiService calls OpenAI → 1536-dim embeddings for each résumé + JD
4. similarityService ranks by cosine similarity
5. Results stored in Mongo (`Session`) → returned to React
6. React displays cards sorted by score

## Extending
- Swap OpenAI for HuggingFace inference endpoint by editing `aiService.js`
- Add keyword extraction: after embeddings, ask LLM for "top 5 keywords"
- Persist files to S3 instead of memory storage

## License
MIT – feel free to cannibalise for interviews or side-projects.