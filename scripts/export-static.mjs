import { cp, mkdir, writeFile, readFile } from 'node:fs/promises';
import { fixtures, fixtureReview } from '../lib/fixtures.mjs';

const root = new URL('../dist/', import.meta.url);
await mkdir(new URL('demo/', root), { recursive: true });
for (const file of ['index.html', 'style.css', 'app.js']) await cp(new URL(`../public/${file}`, import.meta.url), new URL(file, root));
await writeFile(new URL('demo/config.json', root), JSON.stringify({ mode: 'fixture', transport: 'static', recordPath: './demo/live-record.json', fixtures: fixtures.map(({ id, label, detail, text, profile }) => ({ id, label, detail, text, profile })) }, null, 2));
const record = JSON.parse(await readFile(new URL('../evidence/live-review.json', import.meta.url), 'utf8'));
await writeFile(new URL('demo/live-record.json', root), JSON.stringify({ ...record, delivery: 'recorded' }, null, 2));
for (const fixture of fixtures) await writeFile(new URL(`demo/${fixture.id}.json`, root), JSON.stringify(fixtureReview(fixture.text, fixture.profile), null, 2));
await writeFile(new URL('.nojekyll', root), '');
process.stdout.write('Static fixture demo exported to dist/, with a separately labeled recorded live run. No API key is included.\n');
