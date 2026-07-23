// serve.js — tiny dependency-free static file server for Playwright tests
// and manual smoke testing. Serves the project root (the deployable app).
//
//   node scripts/serve.js [port]      (default 8123)
//
// No caching headers are sent, so edited files are always fresh.

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, dirname, extname, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.argv[2] || process.env.PORT || 8123);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
};

const server = createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    let rel = urlPath === "/" ? "/index.html" : urlPath;
    const abs = normalize(join(root, rel));
    if (!abs.startsWith(normalize(root))) {
      res.writeHead(403).end("Forbidden");
      return;
    }
    const body = await readFile(abs);
    res.writeHead(200, {
      "Content-Type": MIME[extname(abs).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(body);
  } catch {
    res.writeHead(404).end("Not found");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Vanguard Calendar static server: http://127.0.0.1:${port}/`);
});
