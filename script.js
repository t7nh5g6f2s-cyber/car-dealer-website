// ハンバーガーメニュー
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => navLinks.classList.remove('open'));
});

// スムーズスクロール
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

// 営業日カレンダー
(async function() {
  const cal = document.getElementById('monthlyCal');
  if (!cal) return;

  const now        = new Date();
  const todayYear  = now.getFullYear();
  const todayMonth = now.getMonth();
  const todayDate  = now.getDate();

  let curYear  = todayYear;
  let curMonth = todayMonth;

  const MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

  let calOverrides = {};
  try {
    const res = await fetch('/api/calendar');
    calOverrides = await res.json();
  } catch { /* ネットワークエラー時はデフォルトルールのみ使用 */ }

  function dayStatus(y, m, d) {
    const key = `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    if (calOverrides[key]) return calOverrides[key].status;
    const dow = new Date(y, m, d).getDay();
    if (dow === 0) return 'closed';
    if (dow === 6) {
      const week = Math.ceil(d / 7);
      return (week === 2 || week === 4) ? 'closed' : 'open';
    }
    return 'open';
  }

  function render() {
    const firstDay = new Date(curYear, curMonth, 1);
    const lastDay  = new Date(curYear, curMonth + 1, 0).getDate();
    const startDow = (firstDay.getDay() + 6) % 7;

    let html = `
      <div class="mc-header">
        <button class="mc-nav" id="mcPrev">&#8249;</button>
        <span class="mc-title">${curYear}年 ${MONTHS[curMonth]}</span>
        <button class="mc-nav" id="mcNext">&#8250;</button>
      </div>
      <div class="mc-grid">
        <div class="mc-dow">月</div>
        <div class="mc-dow">火</div>
        <div class="mc-dow">水</div>
        <div class="mc-dow">木</div>
        <div class="mc-dow">金</div>
        <div class="mc-dow sat">土</div>
        <div class="mc-dow sun">日</div>
    `;

    for (let i = 0; i < startDow; i++) html += `<div class="mc-day"></div>`;
    for (let d = 1; d <= lastDay; d++) {
      const isToday = d === todayDate && curMonth === todayMonth && curYear === todayYear;
      const cls = isToday ? 'today' : dayStatus(curYear, curMonth, d);
      html += `<div class="mc-day ${cls}">${d}</div>`;
    }
    html += '</div>';
    cal.innerHTML = html;

    document.getElementById('mcPrev').addEventListener('click', () => {
      if (--curMonth < 0) { curMonth = 11; curYear--; }
      render();
    });
    document.getElementById('mcNext').addEventListener('click', () => {
      if (++curMonth > 11) { curMonth = 0; curYear++; }
      render();
    });
  }

  render();
}());

AOS.init({
  duration: 650,
  easing: 'ease-out-cubic',
  once: true,
  offset: 50,
});
