import { NextResponse } from "next/server";

export async function POST() {
  // Database properties are configured during initial setup.
  // This endpoint exists for the settings page flow but is a no-op
  // when properties are already in place.
  return NextResponse.json({ success: true });
}
