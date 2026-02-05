# Timekeeper — Phased Development Plan

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: NextAuth.js (for OAuth flows with Notion/Google)
- **State**: React Context + hooks (no external state lib needed at this scale)
- **Deployment**: Vercel (natural fit for Next.js)

---

## Phase 1: Project Scaffold & Timer Core

**Goal**: Working web app with a functional start/stop/pause timer and local state.

- [ ] Initialize Next.js project with TypeScript, Tailwind, ESLint
- [ ] Set up project structure (`/app`, `/components`, `/lib`, `/prisma`)
- [ ] Set up Prisma with PostgreSQL schema:
  - `Project` (id, name, description, color, archived, createdAt)
  - `TimeEntry` (id, projectIds[], duration, date, startTime, endTime, notes, referenceLinks[], tags[], source, createdAt, updatedAt)
- [ ] Seed database with 8 default projects
- [ ] Build Timer component (start/stop/pause, live HH:MM:SS display)
- [ ] Build basic layout shell (header, timer area, navigation)

**Deliverable**: App runs locally, timer counts up and captures duration.

---

## Phase 2: Time Entry Form & Manual Logging

**Goal**: Users can save timer sessions and manually log time entries.

- [ ] Build TimeEntryForm component:
  - Multi-select project picker
  - Duration input (auto-filled from timer or manual `Xh Ym` input)
  - Date picker (defaults to today)
  - Start/End time inputs (optional)
  - Notes textarea
  - Reference links (add/remove URL fields)
  - Tags multi-select
- [ ] Wire timer stop → form pre-fill flow
- [ ] Add "+ Log Time" manual entry flow
- [ ] Create API routes: `POST /api/entries`, `GET /api/entries`, `PUT /api/entries/[id]`, `DELETE /api/entries/[id]`
- [ ] Create API routes: `GET /api/projects`, `POST /api/projects`, `PUT /api/projects/[id]`
- [ ] Persist entries to database

**Deliverable**: Full create flow works for both timer and manual entries.

---

## Phase 3: Entry History & Project Views

**Goal**: Users can view, filter, edit, and delete past entries.

- [ ] Build EntryHistory list view (sorted by most recent)
- [ ] Add filters: project, date range, tags
- [ ] Inline or modal edit for any entry (all fields editable)
- [ ] Delete with confirmation
- [ ] Summary stats bar: total time today / this week / this month
- [ ] Project management page: list projects, create, rename, archive
- [ ] Per-project total time display

**Deliverable**: Full CRUD + filtering on entries and projects.

---

## Phase 4: Notion Integration

**Goal**: Time entries sync to a single Notion database.

- [ ] Set up Notion OAuth flow via NextAuth provider
- [ ] Build settings page for Notion connection
- [ ] Database selection/creation UI
- [ ] Implement sync logic:
  - Map entry fields → Notion properties (multi-select, number, date, rich text)
  - Create new rows on entry save
  - Update rows on entry edit
  - Delete rows on entry delete
- [ ] Add auto-sync (on save) and manual sync button
- [ ] Handle sync failures gracefully (queue + retry, user notification)
- [ ] Store sync status per entry (synced, pending, failed)

**Deliverable**: Entries appear in Notion database immediately after save.

---

## Phase 5: Google Sheets Integration

**Goal**: Time entries sync to a single Google Sheet.

- [ ] Set up Google OAuth flow via NextAuth provider
- [ ] Build settings page for Google Sheets connection
- [ ] Spreadsheet selection/creation UI
- [ ] Implement sync logic:
  - Append row on new entry
  - Update row on entry edit (match by entry ID stored in a hidden column)
  - Delete row on entry delete
  - Format: Date, Start, End, Project(s), Duration (min), Duration (hrs), Notes, Links, Tags, Source
- [ ] Add auto-sync and manual sync button
- [ ] Handle sync failures (queue + retry)
- [ ] Store sync status per entry

**Deliverable**: Entries appear in Google Sheet immediately after save.

---

## Phase 6: Polish & Deploy

**Goal**: Production-ready app with good UX.

- [ ] Responsive design pass (works on mobile browsers)
- [ ] Loading states, error boundaries, toast notifications
- [ ] Keyboard shortcuts (S to start/stop, N for new entry)
- [ ] CSV export for all entries
- [ ] Settings page: manage integrations, default project, preferences
- [ ] Offline support: service worker + IndexedDB cache (entries queued for sync)
- [ ] Deploy to Vercel with production PostgreSQL (e.g., Neon, Supabase)
- [ ] Environment variable setup guide in README

**Deliverable**: Deployed, usable production app.

---

## Execution Order

| Phase | Depends On | Estimated Scope |
|-------|-----------|-----------------|
| 1     | —         | Scaffold + timer |
| 2     | 1         | Entry form + API |
| 3     | 2         | History + CRUD   |
| 4     | 3         | Notion sync      |
| 5     | 3         | Sheets sync      |
| 6     | 4, 5      | Polish + deploy  |

Phases 4 and 5 can be worked in parallel once Phase 3 is complete.
