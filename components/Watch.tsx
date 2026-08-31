"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

import { safeVersionFor, type Finding, type ManifestPackage } from "../lib/scan";

export function Watch() {
  const [manifest, setManifest] = useState<ManifestPackage[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [risk, setRisk] = useState(0);
  const [message, setMessage] = useState("Loading manifest from disk…");
  const [pkgName, setPkgName] = useState("paperclip");
  const [pkgVersion, setPkgVersion] = useState("3.1.4");
  const draftRef = useRef<ManifestPackage[]>([]);

  async function loadFindings() {
    const response = await fetch("/api/findings");
    const body = (await response.json()) as { data: Finding[]; score: number };
    setFindings(body.data);
    setRisk(body.score);
  }

  async function refresh() {
    const response = await fetch("/api/manifest");
    const body = (await response.json()) as { data: ManifestPackage[] };
    setManifest(body.data);
    draftRef.current = body.data;
    await loadFindings();
    setMessage(`${body.data.length} packages in data/manifest.json`);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function saveAndScan(next: ManifestPackage[]) {
    setManifest(next);
    draftRef.current = next;
    const response = await fetch("/api/manifest", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ packages: next }),
    });
    if (!response.ok) {
      setMessage("Failed to save manifest");
      return;
    }
    await loadFindings();
    setMessage("Manifest saved · findings refreshed");
  }

  async function addPackage(event: FormEvent) {
    event.preventDefault();
    const name = pkgName.trim();
    const version = pkgVersion.trim();
    if (!name || !version) {
      setMessage("Name and version are required");
      return;
    }
    const next = draftRef.current.some((pkg) => pkg.name === name)
      ? draftRef.current.map((pkg) => (pkg.name === name ? { ...pkg, version } : pkg))
      : [...draftRef.current, { name, version }];
    await saveAndScan(next);
  }

  async function bumpSafe(pkg: ManifestPackage) {
    const safe = safeVersionFor(pkg);
    if (!safe) return;
    const next = draftRef.current.map((item) =>
      item.name === pkg.name ? { ...item, version: safe } : item,
    );
    await saveAndScan(next);
    setMessage(`${pkg.name} bumped to ${safe}`);
  }

  return (
    <main className="wrap">
      <p className="eyebrow">Supply chain</p>
      <h1>ChainWatch</h1>
      <p>
        Risk score {risk} / 100 from {findings.length} synthetic advisories. {message} Packages
        and advisories are fictional.
      </p>

      <form className="add" onSubmit={(event) => void addPackage(event)}>
        <label>
          Package
          <input value={pkgName} onChange={(event) => setPkgName(event.target.value)} />
        </label>
        <label>
          Version
          <input value={pkgVersion} onChange={(event) => setPkgVersion(event.target.value)} />
        </label>
        <button type="submit">Add / update package</button>
      </form>

      {manifest.length === 0 ? (
        <p className="empty">No packages on disk. Add one to scan synthetic advisories.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Package</th>
              <th>Installed</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {manifest.map((pkg, index) => {
              const finding = findings.find((row) => row.package === pkg.name);
              const safe = safeVersionFor(pkg);
              return (
                <tr key={pkg.name}>
                  <td>{pkg.name}</td>
                  <td>
                    <input
                      value={pkg.version}
                      onChange={(event) => {
                        const next = manifest.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, version: event.target.value } : item,
                        );
                        setManifest(next);
                        draftRef.current = next;
                      }}
                      onBlur={() => void saveAndScan(draftRef.current)}
                    />
                  </td>
                  <td>
                    {finding ? (
                      <span className={`sev ${finding.severity}`}>
                        {finding.severity} · flagged
                      </span>
                    ) : (
                      "clear"
                    )}
                  </td>
                  <td>
                    {safe ? (
                      <button type="button" onClick={() => void bumpSafe(pkg)}>
                        Bump to {safe}
                      </button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {findings.length === 0 ? (
        <p className="empty">No findings — installed versions sit at or above advisory floors.</p>
      ) : (
        <ul>
          {findings.map((finding) => (
            <li key={finding.advisoryId}>
              <strong>{finding.advisoryId}</strong> {finding.summary} ({finding.severity},{" "}
              {finding.installed} &lt; floor)
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
