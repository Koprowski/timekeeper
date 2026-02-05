import https from "https";
import { prisma } from "./prisma";
import { getNotionDatabaseId } from "./notion";

const NOTION_API_VERSION = "2025-09-03";

async function getNotionToken(): Promise<string | null> {
  const setting = await prisma.settings.findUnique({
    where: { key: "notion_token" },
  });
  if (!setting?.value) return null;
  return JSON.parse(setting.value);
}

function notionRequest(
  method: string,
  path: string,
  token: string,
  body?: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.notion.com",
      path,
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": NOTION_API_VERSION,
        "Content-Type": "application/json",
      },
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk: string) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error(`Invalid JSON response: ${data.slice(0, 200)}`));
        }
      });
    });
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

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
    Name: {
      title: [
        {
          text: {
            content:
              entry.notes || `${projectNames.join(", ")} — ${entry.date}`,
          },
        },
      ],
    },
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
    Notes: entry.notes
      ? { rich_text: [{ text: { content: entry.notes } }] }
      : { rich_text: [] },
    "Reference Links":
      links.length > 0
        ? { rich_text: [{ text: { content: links.join(", ") } }] }
        : { rich_text: [] },
    Tags:
      tagsList.length > 0
        ? { multi_select: tagsList.map((t) => ({ name: t })) }
        : { multi_select: [] },
  };

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
  const token = await getNotionToken();
  const databaseId = await getNotionDatabaseId();

  if (!token || !databaseId) {
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
      const result = await notionRequest(
        "PATCH",
        `/v1/pages/${entry.notionPageId}`,
        token,
        { properties: buildNotionProperties(entry) }
      );

      if (result.object === "error") {
        throw new Error(result.message as string);
      }
    } else {
      // Create new page
      const result = await notionRequest("POST", "/v1/pages", token, {
        parent: { database_id: databaseId },
        properties: buildNotionProperties(entry),
      });

      if (result.object === "error") {
        throw new Error(result.message as string);
      }

      await prisma.timeEntry.update({
        where: { id: entryId },
        data: { notionPageId: result.id as string },
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
  const token = await getNotionToken();
  if (!token || !notionPageId) return false;

  try {
    await notionRequest("PATCH", `/v1/pages/${notionPageId}`, token, {
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
  const token = await getNotionToken();
  const databaseId = await getNotionDatabaseId();

  if (!token || !databaseId) {
    return { synced: 0, failed: 0 };
  }

  const entries = await prisma.timeEntry.findMany({
    where: {
      OR: [
        { notionSyncStatus: "pending" },
        { notionSyncStatus: "failed" },
      ],
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
