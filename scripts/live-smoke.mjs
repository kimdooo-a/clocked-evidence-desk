import { mkdir, writeFile } from 'node:fs/promises';
import { liveReview } from '../lib/evidence.mjs';
import { fixtures } from '../lib/fixtures.mjs';

if (!process.env.CLOCKED_API_KEY) throw new Error('Set CLOCKED_API_KEY in the server environment.');
let credits = 0;
const calls = [];
const budgetedFetch = async (url, options) => {
  if (credits >= 85) throw new Error('Smoke-test credit budget reached.');
  const response = await fetch(url, options);
  const charge = Number(response.headers.get('x-clocked-credits') ?? 0);
  credits += charge;
  calls.push({ endpoint: new URL(url).pathname, status: response.status, credits: charge });
  return response;
};
const sample = fixtures[0];
try {
  const result = await liveReview(sample.text, sample.profile, { apiKey: process.env.CLOCKED_API_KEY, fetchImpl: budgetedFetch });
  await mkdir(new URL('../evidence/', import.meta.url), { recursive: true });
  await writeFile(new URL('../evidence/live-review.json', import.meta.url), JSON.stringify(result, null, 2));
  process.stdout.write(JSON.stringify({ mode: result.mode, outcome: result.outcome, reasons: result.reasons, credits, calls, models: result.models, rowCount: result.rows.length }, null, 2) + '\n');
} catch (error) {
  process.stdout.write(JSON.stringify({ error: error.message, credits, calls }, null, 2) + '\n');
  process.exitCode = 1;
}
