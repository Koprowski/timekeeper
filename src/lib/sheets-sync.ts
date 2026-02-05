import { prisma } from "./prisma";
import { getSheetsClient, getSpreadsheetId } from "./sheets";

interface EntryForSync {
  id: string;
  duration: number;
  date: string;
  startTime: Date | null;
  endTime: Date | null;
  notes: string | null;
  referenceLinks: string;
  tags: string;
  source: string;
  sheetsRowIndex: number | null;
  projects: {
    project: {
      name: string;
    };
  }[];
}

function entryToRow(entry: EntryForSync): string[] {
  const projectNames = entry.projects.map((p) => p.project.name).join(", ");
  const links: string[] = JSON.parse(entry.referenceLinks);
  const tagsList: string[] = JSON.parse(entry.tags);
  const durationMin = Math.round(entry.duration / 60);
  const durationHrs = Math.round((entry.duration / 3600) * 100) / 100;

  return [
    entry.id,
    entry.date,
    entry.startTime ? new Date(entry.startTime).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" }) : "",
    entry.endTime ? new Date(entry.endTime).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" }) : "",
    projectNames,
    durationMin.toString(),
    durationHrs.toString(),
    entry.notes || "",
    links.join(", "),
    tagsList.join(", "),
    entry.source,
  ];
}

export async function syncEntryToSheets(entryId: string): Promise<boolean> {
  const sheets = await getSheetsClient();
  const spreadsheetId = await getSpreadsheetId();

  if (!sheets || !spreadsheetId) return false;

  const entry = await prisma.timeEntry.findUnique({
    where: { id: entryId },
    include: {
      projects: {
        include: { project: true },
      },
    },
  });

  if (!entry) return false;

  try {
    const row = entryToRow(entry);

    if (entry.sheetsRowIndex) {
      // Update existing row
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Sheet1!A${entry.sheetsRowIndex}:K${entry.sheetsRowIndex}`,
        valueInputOption: "RAW",
        requestBody: {
          values: [row],
        },
      });
    } else {
      // Append new row
      const appendRes = await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "Sheet1!A:K",
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        requestBody: {
          values: [row],
        },
      });

      // Extract the row number from the updated range
      const updatedRange = appendRes.data.updates?.updatedRange;
      if (updatedRange) {
        const match = updatedRange.match(/!A(\d+):/);
        if (match) {
          const rowIndex = parseInt(match[1], 10);
          await prisma.timeEntry.update({
            where: { id: entryId },
            data: { sheetsRowIndex: rowIndex },
          });
        }
      }
    }

    await prisma.timeEntry.update({
      where: { id: entryId },
      data: { sheetsSyncStatus: "synced" },
    });

    return true;
  } catch (error) {
    console.error("Sheets sync failed for entry", entryId, error);
    await prisma.timeEntry.update({
      where: { id: entryId },
      data: { sheetsSyncStatus: "failed" },
    });
    return false;
  }
}

export async function deleteEntryFromSheets(
  sheetsRowIndex: number
): Promise<boolean> {
  const sheets = await getSheetsClient();
  const spreadsheetId = await getSpreadsheetId();

  if (!sheets || !spreadsheetId || !sheetsRowIndex) return false;

  try {
    // Clear the row (don't delete to avoid shifting other rows)
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `Sheet1!A${sheetsRowIndex}:K${sheetsRowIndex}`,
    });
    return true;
  } catch (error) {
    console.error("Sheets delete failed for row", sheetsRowIndex, error);
    return false;
  }
}

export async function syncAllEntriesToSheets(): Promise<{
  synced: number;
  failed: number;
}> {
  const sheets = await getSheetsClient();
  const spreadsheetId = await getSpreadsheetId();

  if (!sheets || !spreadsheetId) {
    return { synced: 0, failed: 0 };
  }

  const entries = await prisma.timeEntry.findMany({
    where: {
      OR: [
        { sheetsSyncStatus: "pending" },
        { sheetsSyncStatus: "failed" },
      ],
    },
  });

  let synced = 0;
  let failed = 0;

  for (const entry of entries) {
    const success = await syncEntryToSheets(entry.id);
    if (success) synced++;
    else failed++;
  }

  return { synced, failed };
}
