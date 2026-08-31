export type Severity = "low" | "medium" | "high" | "critical";

export interface ManifestPackage {
  name: string;
  version: string;
}

export interface Advisory {
  id: string;
  package: string;
  below: string;
  severity: Severity;
  summary: string;
}

export interface Finding {
  advisoryId: string;
  package: string;
  installed: string;
  severity: Severity;
  summary: string;
}

function versionParts(version: string): number[] {
  return version.split(".").map((part) => Number.parseInt(part, 10) || 0);
}

export function isBelow(installed: string, threshold: string): boolean {
  const left = versionParts(installed);
  const right = versionParts(threshold);
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const a = left[index] ?? 0;
    const b = right[index] ?? 0;
    if (a < b) return true;
    if (a > b) return false;
  }
  return false;
}

export const demoAdvisories: Advisory[] = [
  {
    id: "ADV-104",
    package: "paperclip",
    below: "3.2.0",
    severity: "high",
    summary: "Path traversal in thumbnail helper (synthetic advisory).",
  },
  {
    id: "ADV-220",
    package: "northwind-sdk",
    below: "1.4.0",
    severity: "medium",
    summary: "Retry storm can replay signed requests (synthetic advisory).",
  },
];

export function scan(manifest: ManifestPackage[], advisories = demoAdvisories): Finding[] {
  const findings: Finding[] = [];
  for (const pkg of manifest) {
    for (const advisory of advisories) {
      if (pkg.name === advisory.package && isBelow(pkg.version, advisory.below)) {
        findings.push({
          advisoryId: advisory.id,
          package: pkg.name,
          installed: pkg.version,
          severity: advisory.severity,
          summary: advisory.summary,
        });
      }
    }
  }
  return findings.sort((left, right) => right.severity.localeCompare(left.severity));
}

export function score(findings: Finding[]): number {
  const weights: Record<Severity, number> = {
    low: 5,
    medium: 15,
    high: 35,
    critical: 60,
  };
  return Math.min(100, findings.reduce((sum, finding) => sum + weights[finding.severity], 0));
}

export function safeVersionFor(
  pkg: ManifestPackage,
  advisories = demoAdvisories,
): string | null {
  const hit = advisories.find(
    (advisory) => advisory.package === pkg.name && isBelow(pkg.version, advisory.below),
  );
  return hit ? hit.below : null;
}
