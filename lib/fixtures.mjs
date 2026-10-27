import { assembleReview, FIELD_LABELS } from './evidence.mjs';

const profile = 'I am a 29-year-old independent developer living in South Korea. I am not employed by the organizer. I am applying alone.';
export const fixtures = [
  {
    id: 'clear', label: 'A clear opportunity', detail: 'Complete rules · inspect every fact', profile,
    text: 'FICTIONAL OPPORTUNITY — Open Tools Microgrant\n\nEligibility: Independent developers aged 18 or older may apply worldwide. Employees of the organizer may not enter.\n\nSubmission deadline: December 15, 2026 at 17:00 UTC.\nRequired documents: A project proposal; a budget spreadsheet; a public source repository URL.\nEntry fee: No entry fee.\nAI policy: AI-assisted development is allowed with disclosure.\nThis synthetic notice is for demonstration only.',
    facts: { title: 'Open Tools Microgrant', deadline: 'December 15, 2026 at 17:00 UTC', timezone: 'UTC', eligibility: ['Independent developers aged 18 or older', 'worldwide', 'Employees of the organizer may not enter'], documents: ['A project proposal', 'a budget spreadsheet', 'a public source repository URL'], fee: 'No entry fee', ai_policy: 'AI-assisted development is allowed with disclosure' },
    eligibility: 'eligible', deadline: 'open',
  },
  {
    id: 'ambiguous', label: 'The missing timezone', detail: 'A missing fact should stop the handoff', profile,
    text: 'FICTIONAL OPPORTUNITY — Local Futures Award\n\nEligibility: Independent developers aged 18 or older may apply worldwide.\nSubmission deadline: December 15, 2026 at 17:00.\nRequired documents: A project proposal. Additional supporting documents will be announced later.\nEntry fee: No entry fee.\nThis synthetic notice is for demonstration only.',
    facts: { title: 'Local Futures Award', deadline: 'December 15, 2026 at 17:00', timezone: null, eligibility: ['Independent developers aged 18 or older', 'worldwide'], documents: ['A project proposal'], fee: 'No entry fee', ai_policy: null },
    eligibility: 'eligible', deadline: 'needs_review',
  },
  {
    id: 'excluded', label: 'A real eligibility blocker', detail: 'Good evidence can still mean no', profile,
    text: 'FICTIONAL OPPORTUNITY — Campus Makers Prize\n\nEligibility: Applicants must be currently enrolled university students in Canada.\nSubmission deadline: December 15, 2026 at 17:00 UTC.\nRequired documents: Proof of university enrollment; a project proposal.\nEntry fee: No entry fee.\nAI policy: AI-assisted development is allowed with disclosure.\nThis synthetic notice is for demonstration only.',
    facts: { title: 'Campus Makers Prize', deadline: 'December 15, 2026 at 17:00 UTC', timezone: 'UTC', eligibility: ['currently enrolled university students in Canada'], documents: ['Proof of university enrollment', 'a project proposal'], fee: 'No entry fee', ai_policy: 'AI-assisted development is allowed with disclosure' },
    eligibility: 'ineligible', deadline: 'open',
  },
];

function span(text, value) {
  if (value === null) return { value: null, confidence: 1 };
  const index = text.indexOf(value);
  if (index < 0) throw new Error('Fixture evidence is absent.');
  const start = Array.from(text.slice(0, index)).length;
  return { value, start, end: start + Array.from(value).length, confidence: 0.98 };
}

export function fixtureReview(text, applicant) {
  const fixture = fixtures.find(item => item.text === text && item.profile === applicant);
  if (!fixture) throw Object.assign(new Error('Fixture mode only runs the supplied synthetic examples unchanged. Set CLOCKED_API_KEY on the server to analyze your own text.'), { status: 422 });
  const fields = Object.fromEntries(Object.entries(fixture.facts).map(([key, value]) => [key, Array.isArray(value) ? { value, items: value.map(v => span(text, v)) } : span(text, value)]));
  const claims = Object.entries(fixture.facts).flatMap(([key, value]) => (Array.isArray(value) ? value : [value]).filter(v => v !== null).map(v => ({ claim: `${FIELD_LABELS[key]}: ${v}`, verdict: 'supported', supported: 0.98, evidence: { document: 'notice', quote: v } })));
  return assembleReview({ text, profile: applicant, asOf: '2026-10-27T12:00:00.000Z', mode: 'fixture', extract: { model: 'synthetic-fixture-not-an-api-response', fields }, decide: { model: 'synthetic-fixture-not-an-api-response', answers: { eligibility: { choice: fixture.eligibility, confidence: 0.97, probabilities: { [fixture.eligibility]: 0.97 } }, deadline: { choice: fixture.deadline, confidence: 0.97, probabilities: { [fixture.deadline]: 0.97 } } } }, verify: { model: 'synthetic-fixture-not-an-api-response', claims }, transport: [] });
}
