import { NextResponse } from "next/server";
import { computeFileFingerprint } from "@/lib/fs/file-fingerprint";

export const dynamic = "force-dynamic";

/**
 * GET /api/watch
 *
 * Returns a fingerprint hash of all tracked markdown file mtimes.
 * The auto-refresh client polls this endpoint and triggers a refresh
 * when the fingerprint changes.
 */
export async function GET() {
  const fingerprint = await computeFileFingerprint();
  return NextResponse.json({ fingerprint });
}
