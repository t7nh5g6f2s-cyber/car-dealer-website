const params = new URLSearchParams(window.location.search);
const id = params.get('id');
const data = SERVICES[id];

if (!data) {
  document.getElementById('serviceTitle').textContent = 'サービスが見つかりません';
} else {
  // ページタイトル
  document.title = `${data.title} | 株式会社セグチ`;

  document.getElementById('serviceTitle').textContent = data.title;
  document.getElementById('serviceSubtitle').textContent = data.subtitle;

  // 概要
  document.getElementById('serviceDescription').textContent = data.description;

  // ポイント
  const pointsEl = document.getElementById('servicePoints');
  data.points.forEach(p => {
    pointsEl.innerHTML += `
      <div class="point-item">
        <div class="point-text">
          <strong>${p.title}</strong>
          <p>${p.body}</p>
        </div>
      </div>`;
  });

  // バッジ
  if (data.badges && data.badges.length > 0) {
    const bar = document.getElementById('serviceBadgesBar');
    bar.style.display = 'block';
    document.getElementById('serviceBadges').innerHTML =
      data.badges.map(b => `<span class="svc-badge">${b}</span>`).join('');
  }

  // サービス項目グリッド
  if (data.items && data.items.length > 0) {
    document.getElementById('serviceItemsSection').style.display = 'block';
    document.getElementById('serviceItemsGrid').innerHTML = data.items.map(item => `
      <div class="svc-item-card">
        <div class="svc-item-header">
          <span class="svc-item-icon">${item.icon}</span>
          <h3>${item.title}</h3>
        </div>
        <p>${item.desc}</p>
        <ul class="svc-item-list">
          ${item.list.map(l => `<li>${l}</li>`).join('')}
        </ul>
      </div>`).join('');
  }

  // FAQ（アコーディオン）
  if (data.faq && data.faq.length > 0) {
    const faqSection = document.getElementById('serviceFaqSection');
    faqSection.style.display = 'block';
    document.getElementById('serviceFaqList').innerHTML = data.faq.map(f => `
      <div class="faq-item">
        <div class="faq-q">
          <span class="faq-icon">Q</span>
          <p>${f.q}</p>
          <span class="faq-chevron">▼</span>
        </div>
        <div class="faq-a"><span class="faq-icon a">A</span><p>${f.a}</p></div>
      </div>`).join('');

    document.querySelectorAll('.faq-q').forEach(q => {
      q.addEventListener('click', () => {
        q.parentElement.classList.toggle('open');
      });
    });
  }

  // 料金テーブル（複数対応）
  if (data.tables && data.tables.length > 0) {
    const section = document.getElementById('serviceTableSection');
    section.style.display = 'block';
    // 既存の単一テーブル要素を削除して複数テーブルを動的生成
    section.querySelector('.shaken-table-wrap').remove();
    section.querySelector('h2').remove();
    section.querySelector('.shaken-note')?.remove();

    data.tables.forEach(t => {
      const wrap = document.createElement('div');
      wrap.className = 'price-table-block';
      wrap.innerHTML = `
        <h3 class="price-table-title">${t.title}</h3>
        <div class="shaken-table-wrap">
          <table class="shaken-table">
            <thead>
              <tr>${t.headers.map(h => `<th>${h.replace('\n', '<br>')}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${t.rows.map(row => {
                const isBold = row[0].startsWith('__');
                const label = row[0].replace('__', '');
                return `<tr class="${isBold ? 'row-total' : ''}">
                  <td>${label}</td>
                  ${row.slice(1).map(cell => `<td>${cell}</td>`).join('')}
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
        <p class="shaken-note">${t.note}</p>`;
      section.appendChild(wrap);
    });
  }

  // その他のサービス（現在表示中を除く最大8件）
  const othersEl = document.getElementById('otherServices');
  Object.entries(SERVICES)
    .filter(([key]) => key !== id)
    .slice(0, 8)
    .forEach(([key, svc]) => {
      othersEl.innerHTML += `
        <a href="service.html?id=${key}" class="other-service-card">
          <span class="svc-icon">${svc.icon}</span>
          <h3>${svc.title}</h3>
          <p>${svc.subtitle}</p>
        </a>`;
    });
}

// ハンバーガーメニュー
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => navLinks.classList.remove('open'));
});
