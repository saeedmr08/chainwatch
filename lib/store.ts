import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { type ManifestPackage } from "./scan";

const DATA_FILE = path.join(process.cwd(), "data", "manifest.json");

const seed: ManifestPackage[] = [
  { name: "paperclip", version: "3.1.4" },
  { name: "northwind-sdk", version: "1.2.0" },
  { name: "safe-kit", version: "8.0.1" },
];

export function readManifest(): ManifestPackage[] {
  try {
    return JSON.parse(readFileSync(DATA_FILE, "utf8")) as ManifestPackage[];
  } catch {
    mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    writeFileSync(DATA_FILE, `${JSON.stringify(seed, null, 2)}\n`);
    return seed.map((pkg) => ({ ...pkg }));
  }
}

export function writeManifest(packages: ManifestPackage[]): void {
  mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  writeFileSync(DATA_FILE, `${JSON.stringify(packages, null, 2)}\n`);
}
