const $ = id => document.getElementById(id);
let config;
let currentResult;
let reviewedInput;
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pct = value => Number.isFinite(value) ? `${Math.round(value * 100)}%` : 'unavailable';

function updateCount() { $('count').textContent = `${$('notice-text').value.length.toLocaleString()} CHAR`; }
function chooseExample() {
  const fixture = config.fixtures.find(f => f.id === $('example').value);
  $('notice-text').value = fixture.text;
  $('profile').value = fixture.profile;
  $('example-detail').textContent = fixture.detail;
  $('error').hidden = true;
  markChanged(); updateCount();
}
function markChanged() {
  const stale = currentResult && reviewedInput !== JSON.stringify([$('notice-text').value, $('profile').value]);
  $('export').disabled = !currentResult || stale;
  $('print').disabled = !currentResult || stale;
  document.getElementById('stale')?.remove();
  if (stale) { const message = document.createElement('div'); message.id = 'stale'; message.className = 'changed'; message.textContent = 'Inputs changed. This result belongs to the previous text. Run a new review to export.'; $('result').prepend(message); }
}

function render(result) {
  const outcomes = { ready_to_review: ['Ready for your review.', 'The critical facts have evidence. Confirm the original notice before taking action.', ''], hold: ['Hold. A fact is still missing.', 'Resolve the gaps below before spending time on an application.', 'hold'], not_eligible: ['This applicant does not fit.', 'A stated eligibility rule excludes the supplied applicant. Review the exact requirement.', 'blocked'], deadline_passed: ['The deadline has passed.', 'The source deadline is earlier than the review time. Check for an official extension.', 'blocked'] };
  const [title, description, style] = outcomes[result.outcome];
  $('result').innerHTML = `${result.mode === 'fixture' ? '<span class="fixture-tag">SYNTHETIC FIXTURE · NO API CALLS · FIXED REVIEW TIME</span>' : ''}<div class="verdict ${style}"><p class="eyebrow">${escapeHtml(result.title)}</p><h3>${title}</h3><p>${description}</p>${result.reasons.length ? `<ul>${result.reasons.map(reason => `<li>${escapeHtml(reason)}</li>`).join('')}</ul>` : ''}</div><div class="decisions">${Object.entries(result.decisions).map(([name, decision]) => `<div class="decision"><small>${escapeHtml(name.toUpperCase())} / DECIDE</small><strong>${escapeHtml(decision?.choice?.replaceAll('_', ' ') ?? 'Uncertain')}</strong><em>${pct(decision?.confidence)}</em></div>`).join('')}</div><p class="confidence-note">Confidence describes a model read, not a guarantee. Review threshold: 85%.</p><h3 class="result-title">The source ledger <span class="small-label"> / EXTRACT + VERIFY</span></h3>${result.rows.map(row => `<article class="fact"><div class="fact-head"><span>${escapeHtml(row.label)}</span><span class="status ${row.status}">${row.status === 'supported' ? '✓ SUPPORTED' : row.status === 'missing' ? '○ NOT STATED' : '↗ REVIEW'} ${row.value !== null ? `· ${pct(row.confidence)}` : ''}</span></div><p class="fact-value ${row.value === null ? 'missing-value' : ''}">${escapeHtml(row.value ?? 'Not established by this notice.')}</p>${row.value !== null ? `<details><summary>Inspect source &amp; verification</summary>${row.quote ? `<blockquote>${escapeHtml(row.quote)}</blockquote>` : '<p>No valid source passage was returned.</p>'}<p>Source positions ${row.start ?? '?'}–${row.end ?? '?'} · ${row.exact ? 'exact Unicode match' : 'span requires review'}<br>Verify: ${escapeHtml(row.verification?.verdict ?? 'unavailable')} · support ${pct(row.verification?.support)}</p>${row.verification?.quote && row.verification.quote !== row.quote ? `<blockquote>${escapeHtml(row.verification.quote)}</blockquote>` : ''}</details>` : ''}</article>`).join('')}<details class="metadata"><summary>Review record &amp; request trail</summary><p>Reviewed at ${escapeHtml(result.reviewedAt)}<br>Mode: ${escapeHtml(result.mode)}<br>Models: ${escapeHtml(JSON.stringify(result.models))}</p>${result.transport.map(item => `<p>${escapeHtml(item.endpoint)} · ${item.httpStatus ?? 'skipped'} · ${item.elapsedMs ?? 0} ms · ${item.credits ?? '?'} credits<br>Request ${escapeHtml(item.requestId ?? item.skipped)}</p>`).join('')}<p>${escapeHtml(result.policy.description)}</p></details>`;
  $('result').hidden = false;
}

$('review').addEventListener('click', async () => {
  $('error').hidden = true; $('empty').hidden = true; $('result').hidden = true; $('loading').hidden = false;
  $('review').disabled = true; $('export').disabled = true; $('print').disabled = true;
  const text = $('notice-text').value; const profile = $('profile').value;
  try {
    const response = await fetch('/api/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, profile }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? 'The review could not be completed.');
    currentResult = data; reviewedInput = JSON.stringify([text, profile]); render(data); markChanged();
  } catch (error) { $('error').textContent = error.message; $('error').hidden = false; $('empty').hidden = false; currentResult = null; }
  finally { $('loading').hidden = true; $('review').disabled = false; }
});
$('example').addEventListener('change', chooseExample);
for (const id of ['notice-text', 'profile']) $(id).addEventListener('input', () => { updateCount(); markChanged(); });
$('export').addEventListener('click', () => { if (!currentResult) return; const link = document.createElement('a'); const url = URL.createObjectURL(new Blob([JSON.stringify(currentResult, null, 2)], { type: 'application/json' })); link.href = url; link.download = `evidence-desk-${currentResult.mode}-${new Date().toISOString().slice(0, 10)}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); });
$('print').addEventListener('click', () => window.print());
fetch('/api/config').then(response => { if (!response.ok) throw new Error('Server unavailable.'); return response.json(); }).then(data => {
  config = data; $('mode').textContent = data.mode === 'live' ? 'Live API' : 'Fixture demo'; $('mode').classList.toggle('live', data.mode === 'live');
  $('mode-notice').innerHTML = data.mode === 'live' ? '<strong>LIVE CLOCKED API</strong><span>Reviews send your notice and applicant facts to Clocked. Use public or authorized data.</span>' : '<strong>FIXTURE DEMO / NO API CALLS</strong><span>Explore three synthetic examples. Scores are illustrative fixtures. Add a server-side Clocked key to review your own text.</span>';
  $('example').innerHTML = data.fixtures.map(f => `<option value="${escapeHtml(f.id)}">${escapeHtml(f.label)}</option>`).join(''); chooseExample();
}).catch(error => { $('mode').textContent = 'Offline'; $('error').textContent = error.message; $('error').hidden = false; $('review').disabled = true; });
