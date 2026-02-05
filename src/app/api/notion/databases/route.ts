import { NextResponse } from "next/server";
import { getNotionClient } from "@/lib/notion";

export async function GET() {
  const notion = await getNotionClient();

  if (!notion) {
    return NextResponse.json(
      { error: "Notion not configured. Please add your API token first." },
      { status: 400 }
    );
  }

  try {
    // Search for all objects and filter databases client-side
    // (the SDK types for search filter don't include "database" in all versions)
    const response = await notion.search({ page_size: 100 });

    const databases = response.results
      .filter((r) => (r as { object: string }).object === "database")
      .map((db) => {
        const d = db as { id: string; title?: { plain_text: string }[] };
        const title = d.title
          ? d.title.map((t) => t.plain_text).join("")
          : "Untitled";
        return { id: d.id, title };
      });

    return NextResponse.json(databases);
  } catch (error) {
    console.error("Failed to fetch Notion databases:", error);
    return NextResponse.json(
      { error: "Failed to fetch databases. Check your API token." },
      { status: 500 }
    );
  }
}
