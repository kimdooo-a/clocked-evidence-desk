import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { fixtures, fixtureReview } from './lib/fixtures.mjs';
import { liveReview } from './lib/evidence.mjs';

const assets = { '/': ['index.html', 'text/html; charset=utf-8'], '/style.css': ['style.css', 'text/css; charset=utf-8'], '/app.js': ['app.js', 'text/javascript; charset=utf-8'] };

export function createServer({ apiKey = process.env.CLOCKED_API_KEY, review = liveReview } = {}) {
  let active = false;
  return http.createServer(async (req, res) => {
    const send = (status, body) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(body)); };
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
    const path = new URL(req.url, 'http://localhost').pathname;
    try {
      if (req.method === 'GET' && path === '/api/config') return send(200, { mode: apiKey ? 'live' : 'fixture', fixtures: fixtures.map(({ id, label, detail, text, profile }) => ({ id, label, detail, text, profile })) });
      if (req.method === 'POST' && path === '/api/review') {
        // 외부 사이트의 브라우저를 통한 로컬 API 사용을 차단한다.
        if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) return send(403, { error: 'Cross-origin requests are not accepted.' });
        if (!req.headers['content-type']?.startsWith('application/json')) return send(415, { error: 'Send application/json.' });
        if (active) return send(429, { error: 'Another review is running. Please wait.' });
        let size = 0;
        const chunks = [];
        for await (const chunk of req) {
          size += chunk.length;
          if (size > 100000) return send(413, { error: 'Request exceeds the 100 KB limit.' });
          chunks.push(chunk);
        }
        let body;
        try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return send(400, { error: 'Invalid JSON.' }); }
        if (typeof body.text !== 'string' || body.text.trim().length < 20 || body.text.length > 40000 || typeof body.profile !== 'string' || body.profile.trim().length < 10 || body.profile.length > 6000) return send(400, { error: 'Provide a notice (20–40,000 characters) and applicant facts (10–6,000 characters).' });
        active = true;
        try {
          const result = apiKey ? await review(body.text, body.profile, { apiKey }) : fixtureReview(body.text, body.profile);
          return send(200, result);
        } finally { active = false; }
      }
      if (req.method === 'GET' && assets[path]) {
        const [file, type] = assets[path];
        const content = await readFile(new URL(`./public/${file}`, import.meta.url));
        res.writeHead(200, { 'Content-Type': type }); return res.end(content);
      }
      send(404, { error: 'Not found.' });
    } catch (error) { send(error.status ?? 500, { error: error.status ? error.message : 'The review could not be completed. No result was issued.' }); }
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL(`file:///${process.argv[1].replaceAll('\\', '/')}`))) {
  const port = Number(process.env.PORT ?? 4318);
  const host = process.env.HOST ?? '127.0.0.1';
  createServer().listen(port, host, () => process.stdout.write(`Evidence Desk: http://${host}:${port} (${process.env.CLOCKED_API_KEY ? 'live Clocked API' : 'synthetic fixtures; no API calls'})\n`));
}
