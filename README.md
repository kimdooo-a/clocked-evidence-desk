# Evidence Desk

A fresh application for the Clocked Build Challenge, started on October 27, 2026.
Evidence Desk turns an opportunity notice into an inspectable review: exact requirements,
an applicant eligibility assessment, and a source check for each extracted claim.

## Run

Node.js 22 or later. No packages, build step, or paid assets required.

```sh
npm start
```

Open http://127.0.0.1:4318. Without a key, only the clearly labeled synthetic fixtures run.
To analyze your own text, set `CLOCKED_API_KEY` in the server environment and restart.
The server does not load `.env` files automatically. Never put the key in the browser.

```powershell
$env:CLOCKED_API_KEY = 'your-key'
npm start
```

## Development and disclosure

This implementation was created specifically for this challenge; it does not import
an existing product's core functionality. Development uses OpenAI Codex AI assistance
for code, interface copy, tests, and documentation. The human entrant remains responsible
for the entry. All included notices and applicant profiles are fictional synthetic data.
Original code and inline graphics: MIT. No third-party packages, media, or copied code.
The Node.js runtime is an external prerequisite, licensed separately.

## Official references

- [Challenge rules](https://clocked.rezolve.ai/build-challenge/rules)
- [Clocked authentication](https://clocked.rezolve.ai/docs/authentication)
- [Extract](https://clocked.rezolve.ai/docs/extract)
- [Decide](https://clocked.rezolve.ai/docs/decide)
- [Verify / grounding](https://clocked.rezolve.ai/docs/grounding)
- [Unicode offsets and response contracts](https://clocked.rezolve.ai/docs/responses)

## Why these three endpoints matter

1. **Extract** reads the title, final deadline, timezone, eligibility requirements,
   required documents, fee, and AI policy. The application preserves `null` and uses
   Unicode code points to check that every returned span exactly matches its value.
2. **Decide** compares the notice with applicant facts and the review time. Eligibility
   becomes `eligible`, `ineligible`, or `needs_review`; the deadline becomes `open`,
   `closed`, or `needs_review`. The app displays the returned confidence.
3. **Verify** (`/grounding`) checks each non-null extracted claim against the original
   notice. Its output controls each evidence row and the final review route. A
   contradicted, absent, mismatched, or low-support critical claim produces a hold.

The sequence is **Extract → Decide → Verify → application policy**. The interface's
ledger makes the contribution of every endpoint visible. No call is ornamental.

Application policy uses an explicit 0.85 threshold, not a claim that probabilities
are calibrated for this use case. Missing deadline, timezone, eligibility, documents,
or fee information requires review. Missing AI policy is shown as unknown. A high
confidence exclusion or expired deadline takes priority; otherwise critical gaps
produce `hold`. `ready_to_review` means ready for a human to inspect, not approval.
An exact quote can still select the wrong fact; semantic verification is separate.

## Reproducible verification

```sh
npm test
```

Eight tests cover: three distinct fixture routes; refusal to fake analysis of edited
inputs; emoji and Korean source offsets; all three real request contracts with a
mock transport; a contradiction changing the outcome; bounded API failures without
automatic retries; missing and mismatched evidence; and HTTP routes, CSP, request
validation, cross-origin rejection, and secret-file inaccessibility.

On October 27, 2026, the three real Clocked endpoints were also called with the
included fictional notice and applicant. All returned HTTP 200 using `clocked-1.0`.
Their reported cost was **20 credits**: Extract 9, Decide 1, Verify 10. The actual
reconstructed review is [evidence/live-review.json](evidence/live-review.json).
Decide returned `needs_review` for eligibility, and the application correctly held
the review. These real outputs are distinct from the deterministic demo fixtures.
The API is probabilistic; future results may differ. No keys or authorization headers
are included in this record.

To repeat a small live smoke test, set the key and run `npm run smoke:live`.
It uses synthetic inputs, records request identities and the returned credit headers,
and stops starting further calls after 85 reported credits. A single call's cost
cannot be predicted, so this is a soft budget, not an account spending limit.

Optional browser QA: `node scripts/browser-qa.mjs` with an existing Playwright
installation. `PLAYWRIGHT_MODULE` may point to that installation's `index.mjs`;
`QA_URL` defaults to the local app. The script expects fixture mode. Browser QA
requires a browser binary supplied by the QA environment; it is not a runtime dependency.

## Public fixture demo

```sh
npm run export:static
```

Publish the resulting **contents of `dist/`** with any static host, including GitHub
Pages. Relative asset URLs support hosting under a repository subpath. This is
explicitly labeled **Fixture demo / No API calls** at every stage. Only the three
unchanged synthetic examples run. A separate **Inspect recorded live run** button
opens the preserved October 27 real response, explicitly labeled **Recorded live API
run / No new API call**. No API key or server code is copied into the static bundle.
The Node server is the full live application.

## Privacy, failures, and limits

- API keys remain in the Node environment. No browser key field, external analytics,
  remote fonts, or database is present. Public or authorized data only.
- In live mode, notices and applicant facts are sent to Clocked. The app keeps them
  in memory; the optional JSON export contains them, so review it before sharing.
- The default server binds to loopback. If you expose it publicly, add authentication
  and rate limiting at your hosting boundary; the backend has one concurrent review
  slot, but is not an internet-scale quota or identity service.
- API failures never become invented success or a fixture result. Each logical call
  has its own UUID idempotency key. Unknown network outcomes are not automatically
  retried, to avoid duplicate billing. Error messages contain a request identity,
  never the authorization header or an unfiltered upstream response.
- Each call times out after 60 seconds. An entire review can take up to three minutes.
  Review text is limited to 40,000 characters, profiles to 6,000, bodies to 100 KB.
- No automated submission, web scraping, document upload, or legal advice is provided.
  Users paste the authoritative notice, including corrections and exceptions.
- The public fixture demo deliberately uses a fixed October 27, 2026 review time;
  the UI and exported record state that fact. Live mode uses the actual UTC time.

## Short demo walkthrough

1. Run **A clear opportunity** and open a source passage. The fixture shows a complete
   ledger and readiness for human review.
2. Run **The missing timezone**. The missing timezone stays null and routes to a hold.
3. Run **A real eligibility blocker**. The Canadian student restriction blocks the
   fictional South Korean independent developer.
4. Show the live API record, request trail, three model identifiers, and real hold.
   Set a server-side key and run a fresh live example if demonstrating live behavior.
