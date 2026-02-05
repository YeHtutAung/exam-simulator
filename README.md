# Exam Simulator

Production-ready web app for practicing Japanese FE exam questions. Phase 1 includes public browsing + admin CRUD for exams and questions, with clean data validation and pagination.

## Tech Stack
- Next.js (App Router, TypeScript)
- Tailwind CSS
- Prisma ORM
- PostgreSQL (Docker Compose)
- Zod + React Hook Form

## Features (Phase 1)
- Public home page with latest exams and search entry point
- Exam page with paginated questions
- Question page with answer reveal, MCQ choices, and attachments
- Search by keyword in question stem, optional exam filter
- Admin dashboard (no auth yet)
- CRUD for Exams and Questions (including choices + attachments)

## Local Setup

### 1) Install dependencies
```bash
npm install
```

### 2) Start Postgres with Docker
```bash
docker compose up -d
```

### 3) Run migrations
```bash
npx prisma migrate dev
```

### 4) Seed sample data
```bash
npx prisma db seed
```

### 5) Start the dev server
```bash
npm run dev
```

Open `http://localhost:3000`.

## Useful Commands
- `npx prisma studio` — browse data
- `npx prisma generate` — regenerate Prisma client

## Project Structure
- `src/app` — routes (public + admin + API)
- `src/components` — shared UI + admin forms
- `src/lib` — Prisma client, validators, helpers
- `prisma` — schema and seed

## Environment
The local database URL is set in `.env`:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/exam_simulator?schema=public"
```

## Notes
- CRUD APIs use Route Handlers under `src/app/api`.
- Data validation lives in `src/lib/validators`.
- Prepared for future extensions: mock exams, attempts, review stats, AI explanations.

## Phase 2 PDF Import

### End-to-end sanity checklist
1. Ensure Postgres is running and migrations are applied:
```bash
npx prisma migrate deploy
```
2. Place sample PDFs for tests:
```bash
# Linux/macOS
mkdir -p /mnt/data
cp ./pdf/2020A_FE_AM_Question.pdf /mnt/data/2020A_FE_AM_Question.pdf
cp ./pdf/2020A_FE_AM_Answer.pdf /mnt/data/2020A_FE_AM_Answer.pdf

# Windows (PowerShell)
New-Item -ItemType Directory -Force -Path C:\mnt\data | Out-Null
Copy-Item -Force .\pdf\2020A_FE_AM_Question.pdf C:\mnt\data\2020A_FE_AM_Question.pdf
Copy-Item -Force .\pdf\2020A_FE_AM_Answer.pdf C:\mnt\data\2020A_FE_AM_Answer.pdf
```
3. Run tests:
```bash
npx vitest run
```
4. Use the import UI:
```text
/admin/import
```
Upload question/answer PDFs, then review the draft at `/admin/import/[draftId]`. Fix issues in the per-question editor and publish when status is `READY_TO_PUBLISH`.

### Common failures
- `ENOENT: no such file or directory, open '/mnt/data/...'`  
  The test fixtures are missing. Copy PDFs to `/mnt/data` (or `C:\mnt\data` on Windows).
- `Draft is not ready to publish`  
  Open the draft detail page, fix warnings in the question editor, and ensure status becomes `READY_TO_PUBLISH`.
