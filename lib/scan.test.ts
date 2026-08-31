import { describe, expect, it } from "vitest";

import { isBelow, safeVersionFor, scan, score } from "./scan";

describe("ChainWatch scanner", () => {
  it("compares dotted versions", () => {
    expect(isBelow("3.1.9", "3.2.0")).toBe(true);
    expect(isBelow("3.2.0", "3.2.0")).toBe(false);
    expect(isBelow("4.0.0", "3.2.0")).toBe(false);
  });

  it("matches only the named package below the advisory version", () => {
    const findings = scan([
      { name: "paperclip", version: "3.1.4" },
      { name: "northwind-sdk", version: "1.4.0" },
    ]);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.advisoryId).toBe("ADV-104");
  });

  it("scores high findings more heavily", () => {
    const findings = scan([{ name: "paperclip", version: "1.0.0" }]);
    expect(score(findings)).toBe(35);
  });

  it("returns the advisory floor as a safe bump", () => {
    expect(safeVersionFor({ name: "paperclip", version: "3.1.4" })).toBe("3.2.0");
    expect(safeVersionFor({ name: "safe-kit", version: "8.0.1" })).toBeNull();
  });
});
