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

Detailed architecture and validation instructions will accompany the completed application.
