import { NextResponse } from "next/server";
import { getNotionClient, getNotionDatabaseId } from "@/lib/notion";
import { ensureNotionDatabaseProperties } from "@/lib/notion-sync";

export async function POST() {
  const notion = await getNotionClient();
  const databaseId = await getNotionDatabaseId();

  if (!notion || !databaseId) {
    return NextResponse.json(
      { error: "Notion not fully configured" },
      { status: 400 }
    );
  }

  try {
    await ensureNotionDatabaseProperties(notion, databaseId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to set up Notion database properties:", error);
    return NextResponse.json(
      { error: "Failed to configure database properties" },
      { status: 500 }
    );
  }
}
