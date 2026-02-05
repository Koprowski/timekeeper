-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TimeEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "duration" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "startTime" DATETIME,
    "endTime" DATETIME,
    "notes" TEXT,
    "referenceLinks" TEXT NOT NULL DEFAULT '[]',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "source" TEXT NOT NULL,
    "notionPageId" TEXT,
    "notionSyncStatus" TEXT NOT NULL DEFAULT 'pending',
    "sheetsRowIndex" INTEGER,
    "sheetsSyncStatus" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_TimeEntry" ("createdAt", "date", "duration", "endTime", "id", "notes", "notionPageId", "notionSyncStatus", "referenceLinks", "source", "startTime", "tags", "updatedAt") SELECT "createdAt", "date", "duration", "endTime", "id", "notes", "notionPageId", "notionSyncStatus", "referenceLinks", "source", "startTime", "tags", "updatedAt" FROM "TimeEntry";
DROP TABLE "TimeEntry";
ALTER TABLE "new_TimeEntry" RENAME TO "TimeEntry";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
