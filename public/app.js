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
  $('result').innerHTML = `${result.delivery === 'recorded' ? '<span class="fixture-tag">RECORDED LIVE API RUN · OCT 27, 2026 · NO NEW API CALL</span>' : result.mode === 'fixture' ? '<span class="fixture-tag">SYNTHETIC FIXTURE · NO API CALLS · FIXED REVIEW TIME</span>' : ''}<div class="verdict ${style}"><p class="eyebrow">${escapeHtml(result.title)}</p><h3>${title}</h3><p>${description}</p>${result.reasons.length ? `<ul>${result.reasons.map(reason => `<li>${escapeHtml(reason)}</li>`).join('')}</ul>` : ''}</div><div class="decisions">${Object.entries(result.decisions).map(([name, decision]) => `<div class="decision"><small>${escapeHtml(name.toUpperCase())} / DECIDE</small><strong>${escapeHtml(decision?.choice?.replaceAll('_', ' ') ?? 'Uncertain')}</strong><em>${pct(decision?.confidence)}</em></div>`).join('')}</div><p class="confidence-note">Confidence describes a model read, not a guarantee. Review threshold: 85%.</p><h3 class="result-title">The source ledger <span class="small-label"> / EXTRACT + VERIFY</span></h3>${result.rows.map(row => `<article class="fact"><div class="fact-head"><span>${escapeHtml(row.label)}</span><span class="status ${row.status}">${row.status === 'supported' ? '✓ SUPPORTED' : row.status === 'missing' ? '○ NOT STATED' : '↗ REVIEW'} ${row.value !== null ? `· ${pct(row.confidence)}` : ''}</span></div><p class="fact-value ${row.value === null ? 'missing-value' : ''}">${escapeHtml(row.value ?? 'Not established by this notice.')}</p>${row.value !== null ? `<details><summary>Inspect source &amp; verification</summary>${row.quote ? `<blockquote>${escapeHtml(row.quote)}</blockquote>` : '<p>No valid source passage was returned.</p>'}<p>Source positions ${row.start ?? '?'}–${row.end ?? '?'} · ${row.exact ? 'exact Unicode match' : 'span requires review'}<br>Verify: ${escapeHtml(row.verification?.verdict ?? 'unavailable')} · support ${pct(row.verification?.support)}</p>${row.verification?.quote && row.verification.quote !== row.quote ? `<blockquote>${escapeHtml(row.verification.quote)}</blockquote>` : ''}</details>` : ''}</article>`).join('')}<details class="metadata"><summary>Review record &amp; request trail</summary><p>Reviewed at ${escapeHtml(result.reviewedAt)}<br>Mode: ${escapeHtml(result.mode)}${result.delivery === 'recorded' ? ' (recorded; not a new call)' : ''}<br>Models: ${escapeHtml(JSON.stringify(result.models))}</p>${result.transport.map(item => `<p>${escapeHtml(item.endpoint)} · ${item.httpStatus ?? 'skipped'} · ${item.elapsedMs ?? 0} ms · ${item.credits ?? '?'} credits<br>Request ${escapeHtml(item.requestId ?? item.skipped)}</p>`).join('')}<p>${escapeHtml(result.policy.description)}</p></details>`;
  $('result').hidden = false;
}

$('review').addEventListener('click', async () => {
  $('error').hidden = true; $('empty').hidden = true; $('result').hidden = true; $('loading').hidden = false;
  $('review').disabled = true; $('export').disabled = true; $('print').disabled = true;
  const text = $('notice-text').value; const profile = $('profile').value;
  try {
    let response;
    if (config.transport === 'static') {
      const sample = config.fixtures.find(item => item.text === text && item.profile === profile);
      if (!sample) throw new Error('This public fixture demo only runs the supplied examples unchanged. Run the Node server with CLOCKED_API_KEY to review your own text.');
      response = await fetch(`./demo/${encodeURIComponent(sample.id)}.json`);
    } else response = await fetch('./api/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, profile }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? 'The review could not be completed.');
    currentResult = data; reviewedInput = JSON.stringify([text, profile]); render(data); markChanged();
  } catch (error) { $('error').textContent = error.message; $('error').hidden = false; $('empty').hidden = false; currentResult = null; }
  finally { $('loading').hidden = true; $('review').disabled = false; }
});
$('example').addEventListener('change', chooseExample);
$('record').addEventListener('click', async () => {
  try {
    const response = await fetch(config.recordPath);
    if (!response.ok) throw new Error('The recorded run is unavailable.');
    const data = { ...await response.json(), delivery: 'recorded' };
    $('notice-text').value = data.source; $('profile').value = data.applicant;
    currentResult = data; reviewedInput = JSON.stringify([data.source, data.applicant]);
    $('empty').hidden = true; $('error').hidden = true; render(data); markChanged(); updateCount();
  } catch (error) { $('error').textContent = error.message; $('error').hidden = false; }
});
for (const id of ['notice-text', 'profile']) $(id).addEventListener('input', () => { updateCount(); markChanged(); });
$('export').addEventListener('click', () => { if (!currentResult) return; const link = document.createElement('a'); const url = URL.createObjectURL(new Blob([JSON.stringify(currentResult, null, 2)], { type: 'application/json' })); link.href = url; link.download = `evidence-desk-${currentResult.mode}-${new Date().toISOString().slice(0, 10)}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); });
$('print').addEventListener('click', () => window.print());
async function loadConfig() {
  // 정적 배포도 픽스처임을 명시하며, 실API 실패를 픽스처 결과로 바꾸지는 않는다.
  try {
    const response = await fetch('./api/config');
    if (response.ok && response.headers.get('content-type')?.includes('application/json')) return await response.json();
  } catch { /* 정적 사이트에서는 설정 파일을 사용한다. */ }
  const response = await fetch('./demo/config.json');
  if (!response.ok) throw new Error('Server unavailable.');
  return await response.json();
}
loadConfig().then(data => {
  config = data; $('mode').textContent = data.mode === 'live' ? 'Live API' : 'Fixture demo'; $('mode').classList.toggle('live', data.mode === 'live');
  $('record-bar').hidden = !data.recordPath;
  $('mode-notice').innerHTML = data.mode === 'live' ? '<strong>LIVE CLOCKED API</strong><span>Reviews send your notice and applicant facts to Clocked. Use public or authorized data.</span>' : '<strong>FIXTURE DEMO / NO API CALLS</strong><span>Explore three synthetic examples. Scores are illustrative fixtures. Add a server-side Clocked key to review your own text.</span>';
  $('example').innerHTML = data.fixtures.map(f => `<option value="${escapeHtml(f.id)}">${escapeHtml(f.label)}</option>`).join(''); chooseExample();
}).catch(error => { $('mode').textContent = 'Offline'; $('error').textContent = error.message; $('error').hidden = false; $('review').disabled = true; });
