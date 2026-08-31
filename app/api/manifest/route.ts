import { NextResponse } from "next/server";

import { type ManifestPackage } from "../../../lib/scan";
import { readManifest, writeManifest } from "../../../lib/store";

export async function GET() {
  return NextResponse.json({ data: readManifest() });
}

export async function PUT(request: Request) {
  const body = (await request.json()) as { packages?: ManifestPackage[] };
  if (!Array.isArray(body.packages)) {
    return NextResponse.json({ error: "packages must be an array" }, { status: 400 });
  }
  for (const pkg of body.packages) {
    if (!pkg?.name || typeof pkg.version !== "string") {
      return NextResponse.json(
        { error: "each package needs name and version" },
        { status: 400 },
      );
    }
  }
  writeManifest(body.packages);
  return NextResponse.json({ data: body.packages });
}
