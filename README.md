# Timekeeper

A personal time tracking web app with Notion and Google Sheets sync. Track time using a start/stop timer or manual entry, assign entries to multiple projects, and automatically sync everything to your preferred tools.

## Features

- **Timer & Manual Entry** — Start/stop timer with pause, or manually log time
- **Multi-Project Assignment** — Assign entries to one or more projects
- **Notes, Links & Tags** — Add context to every time entry
- **Notion Sync** — Auto-sync entries to a Notion database
- **Google Sheets Sync** — Auto-sync entries to a Google Spreadsheet
- **CSV Export** — Download all entries as CSV from the history page
- **Keyboard Shortcuts** — `S` start/stop, `P` pause/resume, `N` manual entry
- **Responsive** — Works on desktop and mobile browsers

## Tech Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4
- Prisma 6 + SQLite (local dev)
- Notion API (raw HTTP, API version 2025-09-03)
- Google Sheets API (googleapis)

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
git clone https://github.com/Koprowski/timekeeper.git
cd timekeeper
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL="file:./dev.db"
```

### Database

```bash
npx prisma migrate dev
npx prisma db seed
```

This creates the SQLite database and seeds 8 default projects (TPF, Deeper Dialog, Moltbot, Home, Family, CTS, R&R, Exercise).

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Integration Setup

### Notion

1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations) and create a new integration
2. Copy the integration token (starts with `ntn_`)
3. Share your target Notion database with the integration
4. In Timekeeper, go to **Settings** > paste the token > save > select the database

### Google Sheets

1. Create a [Google Cloud service account](https://console.cloud.google.com/iam-admin/serviceaccounts)
2. Create a key (JSON format) and download it
3. Create a Google Spreadsheet and share it with the service account email (Editor access)
4. In Timekeeper, go to **Settings** > paste the full JSON key > enter the Spreadsheet ID (from the URL: `/d/{SPREADSHEET_ID}/edit`) > save

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed default projects |
| `npm run db:studio` | Open Prisma Studio |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `S` | Start / Stop timer |
| `P` | Pause / Resume timer |
| `N` | Open manual time entry |

Shortcuts are disabled when focused on input fields.

## Project Structure

```
src/
  app/
    page.tsx              # Timer home page
    history/page.tsx      # Entry history with filters & CSV export
    projects/page.tsx     # Project management
    settings/page.tsx     # Notion & Sheets configuration
    api/
      entries/            # CRUD for time entries
      projects/           # CRUD for projects
      settings/           # App settings key-value store
      notion/             # Notion sync endpoints
      sheets/             # Sheets sync endpoints
  components/
    Timer.tsx             # Start/stop/pause timer
    TimeEntryForm.tsx     # Entry form (timer & manual)
    ClientShell.tsx       # Layout with nav & toast provider
    Toast.tsx             # Toast notification system
  lib/
    timer.ts              # Timer state management
    prisma.ts             # Prisma client singleton
    notion.ts             # Notion client helpers
    notion-sync.ts        # Notion sync engine
    sheets.ts             # Google Sheets client helpers
    sheets-sync.ts        # Sheets sync engine
prisma/
  schema.prisma           # Database schema
  seed.ts                 # Default project seeder
```
