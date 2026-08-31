# ChainWatch

Software supply-chain review against a **local synthetic advisory list**. It does not fetch live vulnerability feeds and does not scan arbitrary untrusted package tarballs.

The installed package list lives in `data/manifest.json`. The App Router API seeds a demo manifest on first run; changing versions writes the file, and findings are computed server-side. Restart keeps your versions.

## API

- `GET /api/manifest` — current packages
- `PUT /api/manifest` — `{ packages: ManifestPackage[] }`
- `GET /api/findings` — scan current manifest against synthetic advisories

## Complete product flows

1. Add or edit `paperclip` at `3.1.4` — ADV-104 appears as high and the risk score rises.
2. Click **Bump to 3.2.0** — the finding clears. Restart `npm run dev` — the bumped version is still in `data/manifest.json`.
3. Drop a package below its floor again (or add `northwind-sdk@1.2.0`) to see medium findings return.

```bash
npm install
npm test
npm run dev
```

http://localhost:3000
