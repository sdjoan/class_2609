const CATEGORY_ORDER = ['AI', '경제', '창업', '수익화/크리에이터 이코노미', '날씨', '정부지원정책'];
const CATEGORY_EMOJI = {
  AI: '🤖',
  경제: '💹',
  창업: '🚀',
  '수익화/크리에이터 이코노미': '💵',
  날씨: '☀️',
  정부지원정책: '🏛️',
};
const ALL = '전체';

let state = { items: [], activeTab: ALL };

function relativeTime(iso) {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.round(diffMs / 60000);
  if (min < 60) return `${Math.max(min, 0)}분 전`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  return `${Math.round(hr / 24)}일 전`;
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function renderTabs(categories) {
  const tabs = document.getElementById('tabs');
  tabs.innerHTML = '';
  [ALL, ...categories].forEach((cat) => {
    const btn = document.createElement('button');
    btn.className = 'tab' + (state.activeTab === cat ? ' active' : '');
    btn.textContent = cat === ALL ? ALL : `${CATEGORY_EMOJI[cat] || ''} ${cat}`;
    btn.addEventListener('click', () => {
      state.activeTab = cat;
      render();
    });
    tabs.appendChild(btn);
  });
}

function renderContent(categories) {
  const content = document.getElementById('content');
  content.innerHTML = '';

  if (state.items.length === 0) {
    content.innerHTML = '<p class="empty">아직 수집된 뉴스가 없습니다. 첫 수집이 실행되면 여기에 표시됩니다.</p>';
    return;
  }

  const shownCategories = state.activeTab === ALL ? categories : [state.activeTab];

  for (const cat of shownCategories) {
    const items = state.items
      .filter((it) => it.category === cat)
      .sort((a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0));
    if (items.length === 0) continue;

    const group = document.createElement('section');
    group.className = 'category-group';

    const title = document.createElement('h2');
    title.className = 'category-title';
    title.textContent = `${CATEGORY_EMOJI[cat] || ''} ${cat} (${items.length})`;
    group.appendChild(title);

    for (const item of items) {
      const a = document.createElement('a');
      a.className = 'card';
      a.href = item.link;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.innerHTML = `
        <p class="card-title">${escapeHtml(item.title)}</p>
        <p class="card-meta">${escapeHtml(item.source)} · ${relativeTime(item.pubDate)}</p>
      `;
      group.appendChild(a);
    }
    content.appendChild(group);
  }
}

function render() {
  const present = new Set(state.items.map((it) => it.category));
  const categories = CATEGORY_ORDER.filter((c) => present.has(c));
  renderTabs(categories);
  renderContent(categories);
}

async function load() {
  try {
    const res = await fetch(`data/news.json?t=${Date.now()}`);
    const data = await res.json();
    state.items = data.items || [];
    const updatedEl = document.getElementById('updated');
    updatedEl.textContent = data.lastUpdated
      ? `마지막 업데이트: ${new Date(data.lastUpdated).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`
      : '아직 수집 전';
    render();
  } catch (err) {
    document.getElementById('content').innerHTML = '<p class="empty">뉴스를 불러오지 못했습니다.</p>';
    console.error(err);
  }
}

document.getElementById('refresh').addEventListener('click', load);
load();
