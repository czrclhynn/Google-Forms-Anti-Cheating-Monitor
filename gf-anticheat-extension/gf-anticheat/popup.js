const send = m => new Promise(r => chrome.runtime.sendMessage(m, r));
(async () => {
  const s = await send({ kind: 'SUMMARY' }), o = document.getElementById('o');
  const on = s.session && s.session.active, ex = on && s.cfg.exams.find(e => e.id === s.session.examId);
  if (!on || !ex) o.innerHTML = '● Not monitoring<br><small>Monitoring is active only during an approved exam.</small>';
  else {
    const r = ex.rules, t = v => (v === 'OFF' || v === 'ALLOW' ? '–' : '✓');
    o.innerHTML = `<span style="color:#0a7a2f">● Monitoring Active</span><br>Exam: ${ex.name.replace(/</g, '&lt;')}<br>Google Form: Connected<br>
    Tab switching ${t(r.tabSwitch)}<br>Blocked websites ✓<br>Copy/paste ${t(r.copyPaste)}<br>Fullscreen ${r.fullscreen === 'REQUIRED' ? '✓' : '–'}<br>AI websites ${t(r.ai)}<br>
    Events: ${s.monitoring}<br><small>Monitoring is active only during this examination.</small>`;
  }
  document.getElementById('opt').onclick = () => chrome.runtime.openOptionsPage();
  document.getElementById('end').onclick = async () => { await send({ kind: 'END', reason: 'ended from popup' }); location.reload(); };
})();
