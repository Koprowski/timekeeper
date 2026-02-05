import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncEntryToNotion } from "@/lib/notion-sync";
import { isNotionConfigured } from "@/lib/notion";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const projectId = searchParams.get("projectId");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  const where: Record<string, unknown> = {};

  if (projectId) {
    where.projects = { some: { projectId } };
  }
  if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) (where.date as Record<string, string>).gte = dateFrom;
    if (dateTo) (where.date as Record<string, string>).lte = dateTo;
  }

  const entries = await prisma.timeEntry.findMany({
    where,
    include: {
      projects: {
        include: { project: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const formatted = entries.map((entry) => ({
    id: entry.id,
    projectIds: entry.projects.map((p) => p.projectId),
    projectNames: entry.projects.map((p) => p.project.name),
    projectColors: entry.projects.map((p) => p.project.color),
    duration: entry.duration,
    date: entry.date,
    startTime: entry.startTime,
    endTime: entry.endTime,
    notes: entry.notes,
    referenceLinks: JSON.parse(entry.referenceLinks),
    tags: JSON.parse(entry.tags),
    source: entry.source,
    notionSyncStatus: entry.notionSyncStatus,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  }));

  return NextResponse.json(formatted);
}

export async function POST(request: Request) {
  const body = await request.json();

  const entry = await prisma.timeEntry.create({
    data: {
      duration: body.duration,
      date: body.date,
      startTime: body.startTime ?? null,
      endTime: body.endTime ?? null,
      notes: body.notes ?? null,
      referenceLinks: JSON.stringify(body.referenceLinks ?? []),
      tags: JSON.stringify(body.tags ?? []),
      source: body.source,
      projects: {
        create: (body.projectIds as string[]).map((projectId: string) => ({
          projectId,
        })),
      },
    },
    include: {
      projects: {
        include: { project: true },
      },
    },
  });

  const response = NextResponse.json({
    ...entry,
    referenceLinks: JSON.parse(entry.referenceLinks),
    tags: JSON.parse(entry.tags),
  }, { status: 201 });

  // Auto-sync to Notion in background (don't block response)
  isNotionConfigured().then((configured) => {
    if (configured) {
      syncEntryToNotion(entry.id).catch(console.error);
    }
  });

  return response;
}
