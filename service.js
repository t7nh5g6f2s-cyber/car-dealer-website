const params = new URLSearchParams(window.location.search);
const id = params.get('id');
const data = SERVICES[id];

if (!data) {
  window.location.replace('index.html#services');
} else {
  // ページタイトル・メタ情報
  document.title = `${data.title} | 株式会社セグチ`;
  document.querySelector('meta[name="description"]')?.setAttribute('content', data.description);
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', `${data.title} | 株式会社セグチ`);
  document.querySelector('meta[property="og:description"]')?.setAttribute('content', data.description);

  document.getElementById('serviceTitle').textContent = data.title;
  document.getElementById('serviceSubtitle').textContent = data.subtitle;
  document.getElementById('serviceHeaderIcon').textContent = data.icon;

  // 概要
  document.getElementById('serviceDescription').textContent = data.description;

  // ポイント
  const pointsEl = document.getElementById('servicePoints');
  pointsEl.innerHTML = data.points.map((p, i) => `
    <div class="point-item" data-aos="fade-up" data-aos-delay="${i * 80}">
      <div class="point-text">
        <strong>${p.title}</strong>
        <p>${p.body}</p>
      </div>
    </div>`).join('');

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
    document.getElementById('serviceItemsTitle').textContent = data.itemsTitle || '対応サービス一覧';
    document.getElementById('serviceItemsGrid').innerHTML = data.items.map((item, i) => `
      <div class="svc-item-card" data-aos="fade-up" data-aos-delay="${(i % 3) * 100}">
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
    document.getElementById('serviceFaqList').innerHTML = data.faq.map((f, i) => `
      <div class="faq-item" data-aos="fade-up" data-aos-delay="${i * 80}">
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

  // その他のサービス（現在表示中を除く）
  const othersEl = document.getElementById('otherServices');
  othersEl.innerHTML = Object.entries(SERVICES)
    .filter(([key]) => key !== id)
    .map(([key, svc]) => `
      <a href="service.html?id=${key}" class="other-service-card">
        <span class="svc-icon">${svc.icon}</span>
        <h3>${svc.title}</h3>
        <p>${svc.subtitle}</p>
      </a>`)
    .join('');
}

AOS.init({
  duration: 650,
  easing: 'ease-out-cubic',
  once: true,
  offset: 50,
});

// ハンバーガーメニュー
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => navLinks.classList.remove('open'));
});

// スムーズスクロール（ページ内リンク用）
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const href = anchor.getAttribute('href');
    if (href === '#') return;
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      const headerH = document.querySelector('header').offsetHeight;
      const top = target.getBoundingClientRect().top + window.scrollY - headerH;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});
