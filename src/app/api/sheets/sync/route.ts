import { NextRequest, NextResponse } from "next/server";
import { syncEntryToSheets, syncAllEntriesToSheets } from "@/lib/sheets-sync";
import { isSheetsConfigured } from "@/lib/sheets";

export async function POST(request: NextRequest) {
  const configured = await isSheetsConfigured();
  if (!configured) {
    return NextResponse.json(
      { error: "Google Sheets is not configured" },
      { status: 400 }
    );
  }

  const body = await request.json();

  if (body.entryId) {
    const success = await syncEntryToSheets(body.entryId);
    return NextResponse.json({ success });
  }

  const result = await syncAllEntriesToSheets();
  return NextResponse.json(result);
}
