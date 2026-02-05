import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const settings = await prisma.settings.findMany();
  const result: Record<string, unknown> = {};
  for (const s of settings) {
    result[s.key] = JSON.parse(s.value);
  }
  return NextResponse.json(result);
}

export async function PUT(request: Request) {
  const body = await request.json();

  for (const [key, value] of Object.entries(body)) {
    await prisma.settings.upsert({
      where: { key },
      update: { value: JSON.stringify(value) },
      create: { key, value: JSON.stringify(value) },
    });
  }

  return NextResponse.json({ success: true });
}
