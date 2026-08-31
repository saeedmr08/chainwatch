import { NextResponse } from "next/server";

import { scan, score } from "../../../lib/scan";
import { readManifest } from "../../../lib/store";

export async function GET() {
  const findings = scan(readManifest());
  return NextResponse.json({ data: findings, score: score(findings) });
}
