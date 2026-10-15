// スマホ用メニューの開け閉め
// ボタンを押すたびに <body> に "menu-open" という印を付けたり外したりする。
// 実際に表示を切り替えるのは CSS（style.css の「スマホ用メニュー」の部分）。
const menuButton = document.querySelector('.menu-button');

menuButton.addEventListener('click', function () {
  const isOpen = document.body.classList.toggle('menu-open');
  menuButton.setAttribute('aria-expanded', isOpen);
});

// ---------- LATEST UPDATE：新しい順に直近5件だけ表示 ----------
// <li> が6件以上あっても、6件目以降は隠す（絞り込みはなし。全件は WORKS で見られる）。
const updList = document.getElementById('upd-list');
if (updList) {
  Array.from(updList.children).forEach(function (li, i) { li.hidden = i >= 5; });
}

// ---------- WORKS：タグで絞り込む一覧とページ分け ----------
// 各カードの data-tags（「|」区切り）でタグを集めてボタンを作る。
// 1ページに出す件数は表示件数のセレクト（10/20/50）。これを超えると、ページ送りのボタンが出る。
// 年月は各カードの data-month（例 2026-10）から選択肢を作る。
(function () {
  const grid = document.getElementById('work-grid');
  if (!grid) return;

  const cards = Array.from(grid.querySelectorAll('.card'));
  const tagBox = document.getElementById('work-tags');
  const countText = document.getElementById('work-count');
  const emptyText = document.getElementById('work-empty');
  const pager = document.getElementById('work-pager');
  const monthSelect = document.getElementById('work-month');
  const limitSelect = document.getElementById('work-limit');

  // 分類のタグには小さなアイコンを付ける（表示順もこの順番が先）
  const A = 'stroke="#0f5132" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"';
  function icon(inner) {
    return '<svg class="ic" viewBox="0 0 40 40" width="20" height="20" aria-hidden="true" focusable="false">' + inner + '</svg>';
  }
  const CATEGORIES = {
    '情報収集': icon('<circle cx="17" cy="17" r="11" fill="#fff" ' + A + '/><path d="M25 25 L35 35" ' + A + '/>'),
    'Excel・データ整理': icon('<rect x="5" y="6" width="30" height="28" rx="4" fill="#fff" ' + A + '/><path d="M5 16 H35 M5 25 H35 M16 6 V34" ' + A + '/>'),
    'Excel・VBA': icon('<rect x="5" y="6" width="30" height="28" rx="4" fill="#fff" ' + A + '/><path d="M5 16 H35 M5 25 H35 M16 6 V34" ' + A + '/>'),
    'LP・Web制作': icon('<rect x="4" y="7" width="32" height="26" rx="4" fill="#fff" ' + A + '/><path d="M4 14 H36" ' + A + '/><circle cx="9" cy="10.5" r="1.5" fill="#0f5132"/>'),
    'アプリ開発': icon('<rect x="11" y="3" width="18" height="34" rx="4" fill="#fff" ' + A + '/><path d="M17 31 H23" ' + A + '/>'),
    'AI活用': icon('<rect x="7" y="12" width="26" height="22" rx="6" fill="#fff" ' + A + '/><path d="M20 12 V6" ' + A + '/><circle cx="15" cy="22" r="2" fill="#0f5132"/><circle cx="25" cy="22" r="2" fill="#0f5132"/>'),
    'ライティング': icon('<path d="M8 32 L10 24 L28 6 L34 12 L16 30 Z" fill="#e9c46a" ' + A + '/>')
  };
  // 古いリンク（works.html#writing など）から来たときに、該当のタグを選ぶ
  const HASH_TO_TAG = { collect: '情報収集', excel: 'Excel・データ整理', web: 'LP・Web制作', app: 'アプリ開発', ai: 'AI活用', writing: 'ライティング', slides: '資料作成' };

  // タグごとの件数
  const counts = {};
  cards.forEach(function (card) {
    card.tags = card.dataset.tags.split('|').filter(Boolean);
    card.tags.forEach(function (t) { counts[t] = (counts[t] || 0) + 1; });
  });
  const names = Object.keys(counts);
  const categoryNames = Object.keys(CATEGORIES).filter(function (t) { return counts[t]; });
  const otherNames = names.filter(function (t) { return !CATEGORIES[t]; })
    .sort(function (a, b) { return counts[b] - counts[a] || a.localeCompare(b, 'ja'); });

  // 年月の選択肢（新しい順）
  Array.from(new Set(cards.map(function (c) { return c.dataset.month; }).filter(Boolean)))
    .sort().reverse()
    .forEach(function (ym) {
      const option = document.createElement('option');
      option.value = ym;
      option.textContent = ym.replace('-', '年') + '月';
      monthSelect.appendChild(option);
    });

  let currentTag = '';
  let currentPage = 1;
  const buttons = [];

  function addButton(label, tag, total) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.tag = tag;
    b.innerHTML = (CATEGORIES[tag] || '') + '<span>' + label + '</span><span class="n">' + total + '</span>';
    b.addEventListener('click', function () {
      // 選んでいるタグをもう一度押すと「すべて」に戻る
      currentTag = (currentTag === tag) ? '' : tag;
      currentPage = 1;
      render();
    });
    tagBox.appendChild(b);
    buttons.push(b);
  }
  addButton('すべて', '', cards.length);
  categoryNames.concat(otherNames).forEach(function (t) { addButton(t, t, counts[t]); });

  function render() {
    const PAGE_SIZE = Number(limitSelect.value);
    const matched = cards.filter(function (c) {
      return (!currentTag || c.tags.indexOf(currentTag) !== -1) &&
             (!monthSelect.value || c.dataset.month === monthSelect.value);
    });
    const pages = Math.max(1, Math.ceil(matched.length / PAGE_SIZE));
    if (currentPage > pages) currentPage = pages;
    const start = (currentPage - 1) * PAGE_SIZE;
    const visible = matched.slice(start, start + PAGE_SIZE);

    cards.forEach(function (c) { c.hidden = visible.indexOf(c) === -1; });
    buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.tag === currentTag)); });
    countText.textContent = matched.length + '件中 ' + (matched.length ? (start + 1) + '〜' + (start + visible.length) : 0) + '件を表示';
    emptyText.hidden = matched.length > 0;

    // ページ送り（2ページ以上のときだけ表示）
    pager.innerHTML = '';
    pager.hidden = pages < 2;
    if (pages >= 2) {
      const make = function (label, page, opts) {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = label;
        if (opts && opts.disabled) b.disabled = true;
        if (opts && opts.current) b.setAttribute('aria-current', 'page');
        b.addEventListener('click', function () {
          currentPage = page;
          render();
          grid.scrollIntoView({ block: 'start' });
        });
        pager.appendChild(b);
      };
      make('前へ', currentPage - 1, { disabled: currentPage === 1 });
      for (let i = 1; i <= pages; i++) make(String(i), i, { current: i === currentPage });
      make('次へ', currentPage + 1, { disabled: currentPage === pages });
    }
  }

  [monthSelect, limitSelect].forEach(function (s) {
    s.addEventListener('change', function () { currentPage = 1; render(); });
  });

  function applyHash() {
    const tag = HASH_TO_TAG[location.hash.replace('#', '')];
    if (tag && counts[tag]) { currentTag = tag; currentPage = 1; render(); }
  }
  window.addEventListener('hashchange', applyHash);
  window.applyWorksHash = function (hash) { // プレビュー用：ページ内リンクで来たときに呼ぶ
    const tag = HASH_TO_TAG[(hash || '').replace('#', '')];
    currentTag = tag && counts[tag] ? tag : '';
    currentPage = 1;
    render();
  };
  render();
  applyHash();
})();

// ---------- お問い合わせフォーム：送信後は同じページに日本語で完了メッセージを出す ----------
(function () {
  const form = document.getElementById('contact-form');
  if (!form || !window.fetch) return;
  const result = document.getElementById('form-result');
  const error = document.getElementById('form-error');
  const button = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    error.hidden = true;
    button.disabled = true;
    const original = button.textContent;
    button.textContent = '送信中…';
    fetch(form.action, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: new FormData(form)
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (!data.success) throw new Error(data.message || 'failed');
        form.hidden = true;
        result.hidden = false;
        result.focus();
        result.scrollIntoView({ block: 'center' });
      })
      .catch(function () {
        error.hidden = false;
        button.disabled = false;
        button.textContent = original;
      });
  });
})();

// ---------- 作品ページ：スライドビューア（戻る・進む・ページ数の入力） ----------
// .slide-viewer の中の .sv-slide を1枚ずつ表示する。JSが動かないときは全部縦に並んで見える。
(function () {
  document.querySelectorAll('.slide-viewer').forEach(function (box) {
    const slides = Array.from(box.querySelectorAll('.sv-slide'));
    const total = slides.length;
    if (total < 2) return;
    let index = 0;

    const controls = document.createElement('div');
    controls.className = 'sv-controls';
    controls.innerHTML =
      '<button type="button" class="sv-prev">← 戻る</button>' +
      '<label class="sv-page"><input type="number" inputmode="numeric" min="1" max="' + total + '" value="1" aria-label="表示するページ"> / ' + total + ' ページ</label>' +
      '<button type="button" class="sv-next">進む →</button>';
    const hint = document.createElement('p');
    hint.className = 'sv-hint';
    hint.textContent = 'ページ数を入力するか、ボタン（キーボードの ← → ）で切り替えられます';
    box.appendChild(controls);
    box.appendChild(hint);

    const prev = controls.querySelector('.sv-prev');
    const next = controls.querySelector('.sv-next');
    const input = controls.querySelector('input');

    function show(i) {
      index = Math.max(0, Math.min(total - 1, i));
      slides.forEach(function (s, n) { s.classList.toggle('is-current', n === index); });
      input.value = String(index + 1);
      prev.disabled = index === 0;
      next.disabled = index === total - 1;
      const img = slides[Math.min(index + 1, total - 1)].querySelector('img');
      if (img) img.loading = 'eager'; // 次のページを先に読み込む
    }
    prev.addEventListener('click', function () { show(index - 1); });
    next.addEventListener('click', function () { show(index + 1); });
    function jump() {
      const n = parseInt(input.value, 10);
      show(isNaN(n) ? index : n - 1);
    }
    input.addEventListener('change', jump);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); jump(); } });
    box.tabIndex = 0;
    box.addEventListener('keydown', function (e) {
      if (e.target === input) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); }
    });
    // スマホ：左右にスワイプ
    let startX = null;
    box.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', function (e) {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      startX = null;
      if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
    });

    box.classList.add('is-js');
    show(0);
  });
})();
