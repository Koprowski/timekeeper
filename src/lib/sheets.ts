import { google } from "googleapis";
import { prisma } from "./prisma";

export async function getSheetsClient() {
  const credsSetting = await prisma.settings.findUnique({
    where: { key: "google_service_account" },
  });
  if (!credsSetting?.value) return null;

  const creds = JSON.parse(credsSetting.value);
  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

export async function getSpreadsheetId(): Promise<string | null> {
  const setting = await prisma.settings.findUnique({
    where: { key: "google_spreadsheet_id" },
  });
  if (!setting?.value) return null;
  return JSON.parse(setting.value);
}

export async function isSheetsConfigured(): Promise<boolean> {
  const [client, sheetId] = await Promise.all([
    getSheetsClient(),
    getSpreadsheetId(),
  ]);
  return client !== null && sheetId !== null;
}

export const SHEET_HEADERS = [
  "Entry ID",
  "Date",
  "Start Time",
  "End Time",
  "Project(s)",
  "Duration (min)",
  "Duration (hrs)",
  "Notes",
  "Reference Links",
  "Tags",
  "Source",
];

export async function ensureSheetHeaders(
  spreadsheetId: string
): Promise<void> {
  const sheets = await getSheetsClient();
  if (!sheets) return;

  // Check if header row exists
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Sheet1!A1:K1",
  });

  if (!res.data.values || res.data.values.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "Sheet1!A1:K1",
      valueInputOption: "RAW",
      requestBody: {
        values: [SHEET_HEADERS],
      },
    });
  }
}
