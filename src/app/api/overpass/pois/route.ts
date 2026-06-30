import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { clampPoiBounds, queryOverpassServer } from "@/lib/overpass";

export const runtime = "nodejs";
export const maxDuration = 25;

const Schema = z.object({
  bounds: z.object({
    south: z.number().min(-90).max(90),
    west: z.number().min(-180).max(180),
    north: z.number().min(-90).max(90),
    east: z.number().min(-180).max(180),
  }),
  types: z.array(z.enum(["shelter", "vet"])),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const { bounds, types } = parsed.data;
  if (types.length === 0) {
    return NextResponse.json({ pois: [] });
  }

  const pois = await queryOverpassServer(clampPoiBounds(bounds), types);
  return NextResponse.json({ pois });
}
