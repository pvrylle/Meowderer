import { NextResponse } from "next/server";

import { getStrayCatSightings } from "@/lib/stray-cats";
import { createClient } from "@/lib/supabase/server";

/**
 * Shared album for a single stray cat — the public (share_photo = true)
 * sightings used by the "Same cat?" match dialog so users can compare a
 * candidate's other photos before confirming. Auth-gated to match the rest
 * of the stray-cats API.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sightings = await getStrayCatSightings(id);
  return NextResponse.json({ sightings });
}
