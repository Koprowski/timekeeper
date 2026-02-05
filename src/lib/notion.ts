import { Client } from "@notionhq/client";
import { prisma } from "./prisma";

export async function getNotionClient(): Promise<Client | null> {
  const setting = await prisma.settings.findUnique({
    where: { key: "notion_token" },
  });
  if (!setting?.value) return null;
  const token = JSON.parse(setting.value);
  if (!token) return null;
  return new Client({ auth: token });
}

export async function getNotionDatabaseId(): Promise<string | null> {
  const setting = await prisma.settings.findUnique({
    where: { key: "notion_database_id" },
  });
  if (!setting?.value) return null;
  return JSON.parse(setting.value);
}

export async function isNotionConfigured(): Promise<boolean> {
  const [token, dbId] = await Promise.all([
    getNotionClient(),
    getNotionDatabaseId(),
  ]);
  return token !== null && dbId !== null;
}
