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

## Features (Phase 2: User Management)
- Google login with NextAuth
- User dashboard with attempts, scores, and suggestions
- Admin user management (RBAC)

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

### 6) Start background import worker (Phase 2)
```bash
npm run worker
```

## Useful Commands
- `npx prisma studio` - browse data
- `npx prisma generate` - regenerate Prisma client

## Project Structure
- `src/app` - routes (public + admin + API)
- `src/components` - shared UI + admin forms
- `src/lib` - Prisma client, validators, helpers
- `prisma` - schema and seed

## Internationalization (i18n)
Locale strategy: cookie-based (no URL prefixes). The selected locale is stored in `locale` cookie and applied app-wide via `next-intl`.

### How to add a language
1. Add the locale code to `src/i18n/config.ts`.
2. Create `src/messages/{locale}.json` with the same keys as `en.json`.
3. Update `src/components/LanguageToggle.tsx` if you want a custom label.

### How to run and verify
1. Start the app: `npm run dev`.
2. Use the language toggle in the header.
3. Refresh the page and confirm the language persists.

## Environment
The local database URL is set in `.env`:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/exam_simulator?schema=public"
```

Phase 2 auth env vars:
```
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-a-strong-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
OWNER_EMAILS="owner1@example.com,owner2@example.com"
EMAIL_FROM="no-reply@example.com"
```

Admin bootstrap: the first sign-in for any email in `OWNER_EMAILS` is assigned `OWNER` role. Everyone else becomes `USER`.

Email/password auth notes:
- Registration, verification, and reset links are logged to the server console in dev by default.
- Wire SMTP later by replacing the stub in `src/lib/email.ts`.

## Notes
- CRUD APIs use Route Handlers under `src/app/api`.
- Data validation lives in `src/lib/validators`.
- Prepared for future extensions: mock exams, attempts, review stats, AI explanations.

## Exam Runner Manual Tests (Phase 3)
1. Start an exam run, answer a few questions, skip some, then click `Submit` on the last question: a modal lists unanswered questions.
2. Click `Review unanswered`: you jump to the first unanswered question.
3. Click `Submit anyway`: results page shows total, answered/unanswered, and correct counts.
4. Refresh mid-run: timer and answers persist, and the countdown resumes.
5. Let the timer expire: the run auto-submits and results show `Time is up`.

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
Imports run asynchronously: the draft page polls status/progress until parsing finishes.

Recommended workflow:
1. Import PDFs.
2. Batch crop stems in the draft question list (open each question and adjust the crop).
3. Publish once the missing crops counter is 0 and warnings are cleared.

### Phase 2 Attachments MVP
The import flow renders PDF pages to PNGs and attaches a page image to each question using its `sourcePage`.

Notes:
- Rendered images are stored under `public/uploads/imports/{draftId}/pages/`.
- Draft attachments are created as type `IMAGE` with a caption like `Source page N`.
- When publishing, draft attachments are copied into the `Attachment` table and appear on the public question page.

### Stem Image Cropping
For FE imports, the worker can crop a per-question image and store it in `stemImageUrl`.
The public question page will render the image when available and fall back to text otherwise.

Manual cropping (per question):
- Open `/admin/import/[draftId]/questions/[draftQuestionId]`.
- Use the crop panel to select a rectangle on the full page image.
- Save the crop to update `stemImageUrl` and store the crop box.

Debug crop script:
```bash
npm run crop:debug
```

If a crop looks off, use the admin question editor to auto-detect or manually adjust the crop.

### Common failures
- `ENOENT: no such file or directory, open '/mnt/data/...'`  
  The test fixtures are missing. Copy PDFs to `/mnt/data` (or `C:\mnt\data` on Windows).
- `Draft is not ready to publish`  
  Open the draft detail page, fix warnings in the question editor, and ensure status becomes `READY_TO_PUBLISH`.

## Phase 3A Attempt Pipeline

### How it works
- Starting an exam run creates an `Attempt` for the signed-in user.
- Answer selections are batched and saved as `AttemptAnswer`.
- Submit finalizes the attempt with server-side scoring.

### Manual test checklist
1. Sign in with Google and open `/exam-runner?examId=...`
2. Answer a few questions and refresh:
   - Answers persist locally
   - Attempt continues saving answers
3. Submit on the last question:
   - Attempt status becomes `SUBMITTED`
   - Dashboard at `/dashboard` shows the attempt
4. Double-submit:
   - No duplicate attempts
   - Same totals returned

## Auth (Email + Password) Manual Tests
1. Register with email/password at `/register` -> verification link logged.
2. Open `/api/auth/verify?token=...` -> redirected to `/signin?verified=1`.
3. Sign in with credentials -> redirected to `/dashboard`.
4. Invalid password -> generic error.
5. Forgot/reset password -> reset link logged, new password works.
