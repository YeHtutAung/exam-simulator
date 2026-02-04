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
