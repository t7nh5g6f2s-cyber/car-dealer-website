const MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

const today = new Date();
let viewYear  = today.getFullYear();
let viewMonth = today.getMonth();
let selectedKey = null;

// ── データ操作 ──────────────────────────────────────────
let overridesCache = {};

function loadOverrides() {
  return overridesCache;
}

function saveOverrides(data) {
  fetch('/api/calendar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(res => {
    if (!res.ok) alert(`保存に失敗しました（${res.status}）。Cloudflare の KV バインディングを確認してください。`);
  }).catch(() => alert('保存に失敗しました。通信状態を確認してください。'));
}

async function initOverrides() {
  try {
    const res = await fetch('/api/calendar');
    overridesCache = await res.json();
  } catch {
    overridesCache = {};
  }
}

function dateKey(y, m, d) {
  return `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

function defaultStatus(y, m, d) {
  const dow = new Date(y, m, d).getDay();
  if (dow === 0) return 'closed';
  if (dow === 6) {
    const week = Math.ceil(d / 7);
    return (week === 2 || week === 4) ? 'closed' : 'open';
  }
  return 'open';
}

function resolvedStatus(y, m, d) {
  const ov = loadOverrides()[dateKey(y, m, d)];
  return ov ? ov.status : defaultStatus(y, m, d);
}

function labelFromKey(key) {
  const [y, m, d] = key.split('-');
  return `${y}年${parseInt(m)}月${parseInt(d)}日`;
}

// ── カレンダー描画 ──────────────────────────────────────
function renderCal() {
  const overrides = loadOverrides();
  const firstDay  = new Date(viewYear, viewMonth, 1);
  const lastDay   = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startDow  = (firstDay.getDay() + 6) % 7; // Mon=0

  document.getElementById('monthLabel').textContent = `${viewYear}年 ${MONTHS[viewMonth]}`;

  let html = '<div class="cal-grid">';
  ['月','火','水','木','金','土','日'].forEach((d, i) => {
    html += `<div class="cal-dow ${i===5?'sat':''} ${i===6?'sun':''}">${d}</div>`;
  });

  for (let i = 0; i < startDow; i++) html += '<div class="cal-cell empty"></div>';

  for (let d = 1; d <= lastDay; d++) {
    const key = dateKey(viewYear, viewMonth, d);
    const ov  = overrides[key];
    const def = defaultStatus(viewYear, viewMonth, d);
    const isToday = (d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear());
    const isSel   = key === selectedKey;

    let cls = def; // 'open' | 'closed'
    let badge = '';

    if (ov) {
      if (ov.status !== def) {
        cls   = ov.status === 'open' ? 'manual-open' : 'manual-closed';
        badge = `<span class="cal-badge ${ov.status === 'open' ? 'b-open' : 'b-closed'}">${ov.status === 'open' ? '営' : '休'}</span>`;
      } else if (ov.note) {
        badge = '<span class="cal-badge b-note">✎</span>';
      }
    }

    html += `
      <div class="cal-cell ${cls}${isToday?' today':''}${isSel?' selected':''}" data-key="${key}">
        <span class="cal-num">${d}</span>
        ${badge}
        ${ov?.note ? `<span class="cal-note">${ov.note}</span>` : ''}
      </div>`;
  }

  html += '</div>';
  document.getElementById('admCal').innerHTML = html;

  document.querySelectorAll('.cal-cell:not(.empty)').forEach(el => {
    el.addEventListener('click', () => openPanel(el.dataset.key));
  });

  renderOverrides();
}

// ── 編集パネル ──────────────────────────────────────────
function openPanel(key) {
  selectedKey = key;
  const ov  = loadOverrides()[key];
  const [y, m, d] = key.split('-').map(Number);
  const def = defaultStatus(y, m - 1, d);
  const cur = ov ? ov.status : def;
  const isManual = ov && ov.status !== def;

  document.getElementById('editDateLabel').textContent = labelFromKey(key);
  document.getElementById('editCurrent').innerHTML =
    `現在: <strong>${cur === 'open' ? '営業日' : '定休日'}</strong>` +
    (isManual ? ' <span class="tag-manual">手動</span>' : ' <span class="tag-default">ルール</span>');
  document.getElementById('noteInput').value = ov?.note || '';
  document.getElementById('editPanel').style.display = 'block';

  renderCal();
  document.getElementById('editPanel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function closePanel() {
  selectedKey = null;
  document.getElementById('editPanel').style.display = 'none';
  renderCal();
}

function applyStatus(status) {
  if (!selectedKey) return;
  const note = document.getElementById('noteInput').value.trim();
  overridesCache[selectedKey] = { status, note };
  saveOverrides(overridesCache);
  closePanel();
}

function resetDay() {
  if (!selectedKey) return;
  delete overridesCache[selectedKey];
  saveOverrides(overridesCache);
  closePanel();
}

function saveNote() {
  if (!selectedKey) return;
  const note = document.getElementById('noteInput').value.trim();
  const [y, m, d] = selectedKey.split('-').map(Number);
  const def = defaultStatus(y, m - 1, d);
  const cur = overridesCache[selectedKey]?.status || def;
  if (note) {
    overridesCache[selectedKey] = { status: cur, note };
  } else {
    if (overridesCache[selectedKey]) {
      overridesCache[selectedKey].note = '';
      if (overridesCache[selectedKey].status === def) delete overridesCache[selectedKey];
    }
  }
  saveOverrides(overridesCache);
  closePanel();
}

// ── 変更一覧 ────────────────────────────────────────────
function renderOverrides() {
  const data = loadOverrides();
  const keys = Object.keys(data).sort();
  const el   = document.getElementById('overridesList');

  if (keys.length === 0) {
    el.innerHTML = '<p class="no-ov">変更済みの日付はありません</p>';
    return;
  }

  el.innerHTML = keys.map(key => {
    const ov = data[key];
    const [y, m, d] = key.split('-').map(Number);
    const def     = defaultStatus(y, m - 1, d);
    const changed = ov.status !== def;
    return `
      <div class="ov-item">
        <span class="ov-date">${labelFromKey(key)}</span>
        <span class="ov-status ${ov.status}">${ov.status === 'open' ? '営業' : '定休'}</span>
        ${changed ? '<span class="ov-tag">変更済</span>' : ''}
        ${ov.note ? `<span class="ov-note">${ov.note}</span>` : ''}
        <button class="ov-del" data-key="${key}">削除</button>
      </div>`;
  }).join('');

  document.querySelectorAll('.ov-del').forEach(btn => {
    btn.addEventListener('click', () => {
      delete overridesCache[btn.dataset.key];
      saveOverrides(overridesCache);
      renderCal();
    });
  });
}

// ── イベントリスナー ────────────────────────────────────
document.getElementById('prevMonth').addEventListener('click', () => {
  if (--viewMonth < 0) { viewMonth = 11; viewYear--; }
  renderCal();
});
document.getElementById('nextMonth').addEventListener('click', () => {
  if (++viewMonth > 11) { viewMonth = 0; viewYear++; }
  renderCal();
});
document.getElementById('resetAll').addEventListener('click', () => {
  if (confirm('全ての手動変更をリセットしますか？\nこの操作は取り消せません。')) {
    overridesCache = {};
    saveOverrides(overridesCache);
    renderCal();
  }
});
document.getElementById('btnSetOpen').addEventListener('click',   () => applyStatus('open'));
document.getElementById('btnSetClosed').addEventListener('click', () => applyStatus('closed'));
document.getElementById('btnReset').addEventListener('click',     resetDay);
document.getElementById('btnSaveNote').addEventListener('click',  saveNote);
document.getElementById('btnCancel').addEventListener('click',    closePanel);

// ── 初期描画 ────────────────────────────────────────────
initOverrides().then(() => renderCal());
