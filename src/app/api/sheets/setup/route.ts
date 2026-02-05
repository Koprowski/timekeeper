import { NextResponse } from "next/server";
import { getSpreadsheetId, ensureSheetHeaders, isSheetsConfigured } from "@/lib/sheets";

export async function POST() {
  const configured = await isSheetsConfigured();
  if (!configured) {
    return NextResponse.json(
      { error: "Google Sheets is not configured" },
      { status: 400 }
    );
  }

  const spreadsheetId = await getSpreadsheetId();
  if (!spreadsheetId) {
    return NextResponse.json(
      { error: "Spreadsheet ID not found" },
      { status: 400 }
    );
  }

  await ensureSheetHeaders(spreadsheetId);
  return NextResponse.json({ success: true });
}
