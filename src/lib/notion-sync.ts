import { Client } from "@notionhq/client";
import { prisma } from "./prisma";
import { getNotionClient, getNotionDatabaseId } from "./notion";

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
  notionPageId: string | null;
  projects: {
    project: {
      name: string;
    };
  }[];
}

function buildNotionProperties(entry: EntryForSync) {
  const projectNames = entry.projects.map((p) => p.project.name);
  const links: string[] = JSON.parse(entry.referenceLinks);
  const tagsList: string[] = JSON.parse(entry.tags);
  const hours = entry.duration / 3600;

  const properties: Record<string, unknown> = {
    Date: {
      date: { start: entry.date },
    },
    "Project(s)": {
      multi_select: projectNames.map((name) => ({ name })),
    },
    "Duration (min)": {
      number: Math.round(entry.duration / 60),
    },
    "Duration (hrs)": {
      number: Math.round(hours * 100) / 100,
    },
    Source: {
      select: { name: entry.source },
    },
  };

  // Title property — use notes or a default
  properties["Entry"] = {
    title: [
      {
        text: {
          content: entry.notes || `${projectNames.join(", ")} — ${entry.date}`,
        },
      },
    ],
  };

  if (entry.notes) {
    properties["Notes"] = {
      rich_text: [{ text: { content: entry.notes } }],
    };
  } else {
    properties["Notes"] = {
      rich_text: [],
    };
  }

  if (links.length > 0) {
    properties["Reference Links"] = {
      rich_text: [{ text: { content: links.join(", ") } }],
    };
  } else {
    properties["Reference Links"] = {
      rich_text: [],
    };
  }

  if (tagsList.length > 0) {
    properties["Tags"] = {
      multi_select: tagsList.map((t) => ({ name: t })),
    };
  } else {
    properties["Tags"] = {
      multi_select: [],
    };
  }

  if (entry.startTime) {
    properties["Start Time"] = {
      date: { start: entry.startTime.toISOString() },
    };
  }

  if (entry.endTime) {
    properties["End Time"] = {
      date: { start: entry.endTime.toISOString() },
    };
  }

  return properties;
}

export async function syncEntryToNotion(entryId: string): Promise<boolean> {
  const notion = await getNotionClient();
  const databaseId = await getNotionDatabaseId();

  if (!notion || !databaseId) {
    return false;
  }

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
    if (entry.notionPageId) {
      // Update existing page
      await notion.pages.update({
        page_id: entry.notionPageId,
        properties: buildNotionProperties(entry) as Parameters<
          Client["pages"]["update"]
        >[0]["properties"],
      });
    } else {
      // Create new page
      const response = await notion.pages.create({
        parent: { database_id: databaseId },
        properties: buildNotionProperties(entry) as Parameters<
          Client["pages"]["create"]
        >[0]["properties"],
      });

      await prisma.timeEntry.update({
        where: { id: entryId },
        data: { notionPageId: response.id },
      });
    }

    await prisma.timeEntry.update({
      where: { id: entryId },
      data: { notionSyncStatus: "synced" },
    });

    return true;
  } catch (error) {
    console.error("Notion sync failed for entry", entryId, error);
    await prisma.timeEntry.update({
      where: { id: entryId },
      data: { notionSyncStatus: "failed" },
    });
    return false;
  }
}

export async function deleteEntryFromNotion(
  notionPageId: string
): Promise<boolean> {
  const notion = await getNotionClient();
  if (!notion || !notionPageId) return false;

  try {
    await notion.pages.update({
      page_id: notionPageId,
      archived: true,
    });
    return true;
  } catch (error) {
    console.error("Notion delete failed for page", notionPageId, error);
    return false;
  }
}

export async function syncAllEntriesToNotion(): Promise<{
  synced: number;
  failed: number;
}> {
  const notion = await getNotionClient();
  const databaseId = await getNotionDatabaseId();

  if (!notion || !databaseId) {
    return { synced: 0, failed: 0 };
  }

  const entries = await prisma.timeEntry.findMany({
    where: {
      OR: [
        { notionSyncStatus: "pending" },
        { notionSyncStatus: "failed" },
      ],
    },
    include: {
      projects: {
        include: { project: true },
      },
    },
  });

  let synced = 0;
  let failed = 0;

  for (const entry of entries) {
    const success = await syncEntryToNotion(entry.id);
    if (success) synced++;
    else failed++;
  }

  return { synced, failed };
}

export async function ensureNotionDatabaseProperties(
  notion: Client,
  databaseId: string
): Promise<void> {
  // Retrieve current database to check properties
  const db = await notion.databases.retrieve({ database_id: databaseId });
  const existingProps = Object.keys(
    (db as unknown as { properties: Record<string, unknown> }).properties
  );

  const requiredProperties: Record<string, Record<string, unknown>> = {
    "Date": { date: {} },
    "Project(s)": { multi_select: {} },
    "Duration (min)": { number: {} },
    "Duration (hrs)": { number: {} },
    "Notes": { rich_text: {} },
    "Reference Links": { rich_text: {} },
    "Tags": { multi_select: {} },
    "Source": { select: {} },
    "Start Time": { date: {} },
    "End Time": { date: {} },
  };

  const propsToAdd: Record<string, Record<string, unknown>> = {};
  for (const [name, config] of Object.entries(requiredProperties)) {
    if (!existingProps.includes(name)) {
      propsToAdd[name] = config;
    }
  }

  if (Object.keys(propsToAdd).length > 0) {
    await notion.databases.update({
      database_id: databaseId,
      properties: propsToAdd,
    } as Parameters<typeof notion.databases.update>[0]);
  }
}
