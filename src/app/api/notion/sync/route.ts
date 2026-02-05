import { NextRequest, NextResponse } from "next/server";
import { syncEntryToNotion, syncAllEntriesToNotion } from "@/lib/notion-sync";
import { isNotionConfigured } from "@/lib/notion";

export async function POST(request: NextRequest) {
  const configured = await isNotionConfigured();
  if (!configured) {
    return NextResponse.json(
      { error: "Notion is not configured" },
      { status: 400 }
    );
  }

  const body = await request.json();

  // Sync a single entry
  if (body.entryId) {
    const success = await syncEntryToNotion(body.entryId);
    return NextResponse.json({ success });
  }

  // Sync all pending/failed entries
  const result = await syncAllEntriesToNotion();
  return NextResponse.json(result);
}
