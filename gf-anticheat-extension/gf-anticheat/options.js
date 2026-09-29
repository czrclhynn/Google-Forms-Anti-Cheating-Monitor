const $ = id => document.getElementById(id), esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const OPTS = { tabSwitch:['OFF','MONITOR','BLOCK'], newTab:['ALLOW','MONITOR','BLOCK'], ai:['ALLOW','MONITOR','BLOCK'], copyPaste:['ALLOW','MONITOR','BLOCK'],
  fullscreen:['OPTIONAL','REQUIRED'], devtools:['MONITOR','RESTRICT'], contextMenu:['ALLOW','MONITOR','BLOCK'] };
const DEF = { tabSwitch:'MONITOR', newTab:'BLOCK', ai:'BLOCK', copyPaste:'BLOCK', fullscreen:'REQUIRED', devtools:'RESTRICT', contextMenu:'BLOCK' };
const DOMS = `chatgpt.com,AI\nchat.openai.com,AI\nclaude.ai,AI\ngemini.google.com,AI\ncopilot.microsoft.com,AI\nperplexity.ai,AI\ngoogle.com,SEARCH,MONITORED\nbing.com,SEARCH,MONITORED\nduckduckgo.com,SEARCH,MONITORED\nmessenger.com,COMM,BLOCKED\ndiscord.com,COMM,BLOCKED\nweb.whatsapp.com,COMM,BLOCKED\nfacebook.com,COMM,MONITORED`;
let cfg;
const load = async () => { cfg = (await chrome.storage.local.get('config')).config || { exams: [], domains: DOMS, endpoint: '' }; };
const save = () => chrome.storage.local.set({ config: cfg });
function render() {
  $('dom').value = cfg.domains; $('ep').value = cfg.endpoint || '';
  $('exams').innerHTML = cfg.exams.map((e, i) => `<div style="border-top:1px solid #eee;padding:6px 0"><b>${esc(e.name)}</b> <small>${esc(e.url)}</small>
   <br>Mode <select data-i="${i}" data-k="mode">${['DETECTION','RESTRICTION'].map(o => `<option ${e.mode === o ? 'selected' : ''}>${o}</option>`).join('')}</select>
   ${Object.entries(OPTS).map(([k, v]) => `${k} <select data-i="${i}" data-r="${k}">${v.map(o => `<option ${e.rules[k] === o ? 'selected' : ''}>${o}</option>`).join('')}</select>`).join(' ')}
   <button data-del="${i}">Remove</button></div>`).join('') || '<i>No exams yet.</i>';
  const sims = ['TAB_SWITCH','AI_WEBSITE_DETECTED','BLOCKED_WEBSITE_DETECTED','FULLSCREEN_EXIT','COPY_ATTEMPT','PASTE_ATTEMPT','DEVTOOLS_ATTEMPT','EXTENSION_DISCONNECTED','PDF_OPENED','DESKTOP_APPLICATION_OPENED'];
  $('sims').innerHTML = sims.map(t => `<button data-sim="${t}">Simulate ${t}</button>`).join(' ');
}
async function log() {
  const { events = [] } = await chrome.storage.local.get('events');
  const s = await new Promise(r => chrome.runtime.sendMessage({ kind: 'SUMMARY' }, r));
  $('sum').textContent = `Monitoring Events: ${s.monitoring}   Potential Violations: ${s.violations}   Score: ${s.score} (not proof of cheating)`;
  $('log').innerHTML = '<tr><th>Time</th><th>Type</th><th>Severity</th><th>Domain</th><th>Details</th></tr>' + events.slice(-200).reverse().map(e =>
    `<tr class="${e.metadata.SIMULATED_EVENT ? 'sim' : ''}"><td>${e.timestamp.slice(11, 19)}</td><td>${e.type}${e.metadata.SIMULATED_EVENT ? ' (SIMULATED EVENT)' : ''}</td><td>${e.severity}</td><td>${esc(e.domain)}</td><td>${esc(JSON.stringify(e.metadata))}</td></tr>`).join('');
}
document.addEventListener('change', async e => {
  const t = e.target, i = t.dataset.i; if (i == null) return;
  if (t.dataset.k) cfg.exams[i].mode = t.value; else cfg.exams[i].rules[t.dataset.r] = t.value; await save();
});
document.addEventListener('click', async e => {
  const t = e.target;
  if (t.dataset.del != null) { cfg.exams.splice(+t.dataset.del, 1); await save(); render(); }
  if (t.dataset.sim) { await new Promise(r => chrome.runtime.sendMessage({ kind: 'SIMULATE', type: t.dataset.sim }, r)); log(); }
});
$('add').onclick = async () => {
  if (!/^https:\/\/docs\.google\.com\/forms\//.test($('u').value)) return alert('Enter a docs.google.com/forms URL.');
  cfg.exams.push({ id: 'x' + Date.now(), name: $('n').value || 'Exam', url: $('u').value.trim(), mode: 'RESTRICTION', rules: { ...DEF } });
  await save(); render();
};
$('save').onclick = async () => { cfg.domains = $('dom').value; cfg.endpoint = $('ep').value.trim(); await save(); };
$('ref').onclick = log; $('clr').onclick = async () => { await chrome.storage.local.set({ events: [] }); log(); };
$('exp').onclick = async () => { const { events = [] } = await chrome.storage.local.get('events'); const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(events, null, 2)], { type: 'application/json' })); a.download = 'events.json'; a.click(); };
(async () => { await load(); render(); log(); })();
