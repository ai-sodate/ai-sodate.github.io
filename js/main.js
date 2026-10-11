// スマホ用メニューの開け閉め
// ボタンを押すたびに <body> に "menu-open" という印を付けたり外したりする。
// 実際に表示を切り替えるのは CSS（style.css の「スマホ用メニュー」の部分）。
const menuButton = document.querySelector('.menu-button');

menuButton.addEventListener('click', function () {
  const isOpen = document.body.classList.toggle('menu-open');
  menuButton.setAttribute('aria-expanded', isOpen);
});

// ---------- LATEST UPDATE の絞り込みと表示件数 ----------
// <li> の data-month（年-月）と data-type（ラベル）で絞り込む。
// 年月の選択肢は <li> から自動で作る。JSが動かなくても全件が表示される。
const updList = document.getElementById('upd-list');
if (updList) {
  const items = Array.from(updList.children);
  const monthSelect = document.getElementById('upd-month');
  const typeSelect = document.getElementById('upd-type');
  const limitSelect = document.getElementById('upd-limit');
  const countText = document.getElementById('upd-count');
  const emptyText = document.getElementById('upd-empty');

  // 年月の選択肢（新しい順）
  Array.from(new Set(items.map(function (li) { return li.dataset.month; })))
    .sort().reverse()
    .forEach(function (ym) {
      const option = document.createElement('option');
      option.value = ym;
      option.textContent = ym.replace('-', '年') + '月';
      monthSelect.appendChild(option);
    });

  function applyFilter() {
    const limit = Number(limitSelect.value);
    const matched = items.filter(function (li) {
      return (!monthSelect.value || li.dataset.month === monthSelect.value) &&
             (!typeSelect.value || li.dataset.type === typeSelect.value);
    });
    items.forEach(function (li) { li.hidden = true; });
    matched.slice(0, limit).forEach(function (li) { li.hidden = false; });
    const shown = Math.min(matched.length, limit);
    countText.textContent = matched.length + '件中 ' + shown + '件を表示';
    emptyText.hidden = matched.length > 0;
  }

  [monthSelect, typeSelect, limitSelect].forEach(function (select) {
    select.addEventListener('change', applyFilter);
  });
  applyFilter();
}

// ---------- WORKS：タグで絞り込む一覧とページ分け ----------
// 各カードの data-tags（「|」区切り）でタグを集めてボタンを作る。
// 1ページに出す件数は PAGE_SIZE。これを超えると、ページ送りのボタンが出る。
(function () {
  const grid = document.getElementById('work-grid');
  if (!grid) return;

  const PAGE_SIZE = 30;
  const cards = Array.from(grid.querySelectorAll('.card'));
  const tagBox = document.getElementById('work-tags');
  const countText = document.getElementById('work-count');
  const emptyText = document.getElementById('work-empty');
  const pager = document.getElementById('work-pager');

  // 分類のタグには小さなアイコンを付ける（表示順もこの順番が先）
  const A = 'stroke="#0f5132" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"';
  function icon(inner) {
    return '<svg class="ic" viewBox="0 0 40 40" width="20" height="20" aria-hidden="true" focusable="false">' + inner + '</svg>';
  }
  const CATEGORIES = {
    '情報収集': icon('<circle cx="17" cy="17" r="11" fill="#fff" ' + A + '/><path d="M25 25 L35 35" ' + A + '/>'),
    'Excel・VBA': icon('<rect x="5" y="6" width="30" height="28" rx="4" fill="#fff" ' + A + '/><path d="M5 16 H35 M5 25 H35 M16 6 V34" ' + A + '/>'),
    'LP・Web制作': icon('<rect x="4" y="7" width="32" height="26" rx="4" fill="#fff" ' + A + '/><path d="M4 14 H36" ' + A + '/><circle cx="9" cy="10.5" r="1.5" fill="#0f5132"/>'),
    'アプリ開発': icon('<rect x="11" y="3" width="18" height="34" rx="4" fill="#fff" ' + A + '/><path d="M17 31 H23" ' + A + '/>'),
    'AI活用': icon('<rect x="7" y="12" width="26" height="22" rx="6" fill="#fff" ' + A + '/><path d="M20 12 V6" ' + A + '/><circle cx="15" cy="22" r="2" fill="#0f5132"/><circle cx="25" cy="22" r="2" fill="#0f5132"/>'),
    'ライティング': icon('<path d="M8 32 L10 24 L28 6 L34 12 L16 30 Z" fill="#e9c46a" ' + A + '/>')
  };
  // 古いリンク（works.html#writing など）から来たときに、該当のタグを選ぶ
  const HASH_TO_TAG = { collect: '情報収集', excel: 'Excel・VBA', web: 'LP・Web制作', app: 'アプリ開発', ai: 'AI活用', writing: 'ライティング' };

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
    const matched = cards.filter(function (c) { return !currentTag || c.tags.indexOf(currentTag) !== -1; });
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
