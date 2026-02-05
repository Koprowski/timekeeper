# PRD: Project Timekeeping App

## Overview

A lightweight web-based time-tracking application that lets users start/stop a timer or manually log time, associate entries with one or more projects, annotate with notes and reference links, and sync data to a single Notion database and a single Google Sheet.

## Problem Statement

Freelancers, consultants, and project-based workers need a simple way to track how long they spend on tasks without the overhead of complex project management tools. They also need that data accessible in the tools they already use (Notion, Google Sheets) for invoicing, reporting, and project planning.

## Projects (Default Set)

The app ships with the following pre-configured projects. Users can add, rename, or archive projects over time.

- TPF
- Deeper Dialog
- Moltbot
- Home
- Family
- CTS
- R&R
- Exercise

**Multi-select is required** — a single time entry can be assigned to multiple projects simultaneously (e.g., a meeting that spans both "Deeper Dialog" and "CTS").

## Core Features

### 1. Timer

- **Start/Stop toggle** — single button to begin and end a timing session
- **Live elapsed time display** — shows running duration (HH:MM:SS)
- **Pause/Resume** — ability to pause without ending the session
- **Idle detection** (optional) — prompt if timer has been running with no activity for a configurable period

### 2. Manual Time Entry

- Users can log time without using the timer (e.g., "I worked 2 hours on X yesterday")
- Same entry form as timer-based entries: project(s), duration, date, notes, links
- Duration entered as hours and minutes (e.g., `1h 30m`)
- Date picker defaults to today but can be set to any past date

### 3. Time Entry Fields

All entries — whether created via timer or manual input — share the same fields and are fully editable after creation.

| Field            | Type              | Required | Description                                       |
|------------------|-------------------|----------|---------------------------------------------------|
| Project(s)       | Multi-select      | Yes      | One or more projects from the project list         |
| Duration         | Auto or manual    | Yes      | Captured from timer or entered manually; editable  |
| Date             | Auto-filled       | Yes      | Defaults to today; editable                        |
| Start Time       | Auto or manual    | No       | Captured from timer or entered manually             |
| End Time         | Auto or manual    | No       | Captured from timer or entered manually             |
| Notes            | Free text         | No       | Description of work performed                      |
| Reference Links  | URL list          | No       | One or more links (tickets, docs, PRs, etc.)       |
| Tags             | Multi-select      | No       | Optional labels for filtering/grouping             |
| Entry Source     | Auto-filled       | —        | "timer" or "manual" (system-managed)               |

### 4. Project Management

- Create, rename, and archive projects
- Each project has a name, optional description, and optional color/icon
- View total time logged per project
- Filter time entries by project

### 5. Entry History

- List view of all time entries, sorted by most recent
- Filter by project, date range, and tags
- Edit or delete any past entry (both timer-based and manual)
- Summary stats: total time today, this week, this month

### 6. Notion Sync

- Connect via Notion API (OAuth integration)
- **Single master database** — all time entries live in one Notion database
  - Project(s) stored as a multi-select property
  - Per-project filtered views can be configured in Notion by the user later
- Each time entry creates or updates a row in the database
- Field mapping:

| App Field        | Notion Property Type |
|------------------|---------------------|
| Project(s)       | Multi-select         |
| Duration         | Number (minutes)     |
| Date             | Date                 |
| Start Time       | Date (with time)     |
| End Time         | Date (with time)     |
| Notes            | Rich text            |
| Reference Links  | URL / Rich text      |
| Tags             | Multi-select         |
| Entry Source     | Select               |

- Sync modes:
  - **Auto** — syncs on save
  - **Manual** — user triggers sync via button
- Handles conflicts gracefully (last-write-wins or user prompt)

### 7. Google Sheets Sync

- Connect via Google Sheets API (OAuth integration)
- **Single sheet** — all time entries in one worksheet with columns:

| Column           | Format                          |
|------------------|---------------------------------|
| Date             | YYYY-MM-DD                      |
| Start Time       | HH:MM                           |
| End Time         | HH:MM                           |
| Project(s)       | Comma-separated list             |
| Duration (min)   | Number                           |
| Duration (hrs)   | Number (decimal, e.g., 1.5)     |
| Notes            | Text                             |
| Reference Links  | Comma-separated URLs             |
| Tags             | Comma-separated list             |
| Entry Source     | "timer" or "manual"              |

- Project summary tabs can be added later (out of scope for v1 but the single-sheet structure supports it)
- Sync modes:
  - **Auto** — syncs on save
  - **Manual** — user triggers sync via button

## User Flows

### Timer Flow
```
1. Open app → Timer screen (idle state)
2. Select project(s) (optional — can be set before or after)
3. Click "Start" → Timer begins counting
4. Click "Stop" → Entry form appears with duration pre-filled
   - Project(s): [Multi-select]
   - Notes: [Optional text]
   - Links: [+ Add link]
5. Click "Save" → Entry stored and synced
```

### Manual Entry Flow
```
1. Click "+ Log Time" button
2. Entry form appears (all fields blank)
   - Date: [Defaults to today]
   - Duration: [Enter hours/minutes]
   - Project(s): [Multi-select]
   - Notes: [Optional text]
   - Links: [+ Add link]
3. Click "Save" → Entry stored and synced
```

### Edit Flow
```
1. Open Entry History
2. Click on any entry (timer or manual)
3. All fields are editable — project(s), duration, date, notes, links
4. Click "Save" → Entry updated and re-synced
```

## Technical Considerations

### Platform
- **Web application** — accessible via browser, responsive design
- Framework TBD (e.g., Next.js, SvelteKit, or similar)

### Data Storage
- Server-side database (PostgreSQL or similar) as primary store
- Alternatively: local-first with IndexedDB + cloud sync
- Sync to Notion/Google Sheets as secondary persistence
- Entries queued for sync when connectivity is lost, pushed when restored

### APIs
- **Notion API** — https://developers.notion.com/
  - Requires integration token + database share
  - Maps time entries to database rows
- **Google Sheets API** — https://developers.google.com/sheets/api
  - Requires OAuth 2.0 consent
  - Appends/updates rows in user-selected spreadsheet

### Authentication
- OAuth flows for both Notion and Google
- Tokens stored securely (httpOnly cookies or encrypted server-side)

## Non-Functional Requirements

- **Fast startup** — timer should be usable within 1 second of page load
- **Minimal UI** — the primary screen is the timer, project selector, and a log-time button
- **Offline support** — full functionality without internet; sync when available
- **Data export** — CSV export as a fallback beyond Notion/Sheets

## Out of Scope (v1)

- Team/multi-user features
- Invoicing or billing
- Calendar integrations
- Automated time tracking (window/app monitoring)
- Native mobile app (responsive web serves mobile for now)
- Per-project summary tabs in Google Sheets (structure supports adding later)
- Per-project filtered views in Notion (user can configure in Notion directly)

## Decisions Log

| # | Question | Decision |
|---|----------|----------|
| 1 | Platform | Web app |
| 2 | Notion structure | Single master database; per-project views configured later |
| 3 | Google Sheets structure | Single sheet; project summary tabs added later |
| 4 | Manual time entry | Yes — both timer and manual input supported; all entries editable |
| 5 | Default projects | TPF, Deeper Dialog, Moltbot, Home, Family, CTS, R&R, Exercise |
| 6 | Multi-select projects | Required — entries can span multiple projects |

## Success Metrics

- Timer start-to-stop flow completed in under 3 clicks
- Manual entry logged in under 5 clicks
- Sync to Notion/Sheets completes within 5 seconds of save
- User can view and filter full entry history in under 2 seconds
