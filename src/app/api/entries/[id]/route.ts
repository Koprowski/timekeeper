import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncEntryToNotion, deleteEntryFromNotion } from "@/lib/notion-sync";
import { isNotionConfigured } from "@/lib/notion";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const entry = await prisma.timeEntry.findUnique({
    where: { id },
    include: {
      projects: {
        include: { project: true },
      },
    },
  });

  if (!entry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
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
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  await prisma.timeEntryProject.deleteMany({
    where: { timeEntryId: id },
  });

  const entry = await prisma.timeEntry.update({
    where: { id },
    data: {
      duration: body.duration,
      date: body.date,
      startTime: body.startTime ?? null,
      endTime: body.endTime ?? null,
      notes: body.notes ?? null,
      referenceLinks: JSON.stringify(body.referenceLinks ?? []),
      tags: JSON.stringify(body.tags ?? []),
      source: body.source,
      notionSyncStatus: "pending",
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
  });

  // Auto-sync to Notion in background
  isNotionConfigured().then((configured) => {
    if (configured) {
      syncEntryToNotion(entry.id).catch(console.error);
    }
  });

  return response;
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Get the entry first to check for Notion page ID
  const entry = await prisma.timeEntry.findUnique({ where: { id } });

  if (entry?.notionPageId) {
    // Archive in Notion (don't block on failure)
    deleteEntryFromNotion(entry.notionPageId).catch(console.error);
  }

  await prisma.timeEntry.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
