import { readFile } from 'node:fs/promises';
import path from 'node:path';

const DATA_FILE = path.join(process.cwd(), 'data', 'news.json');
const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const WINDOW_HOURS = 24;
const MAX_PER_CATEGORY = 8;

const CATEGORY_ORDER = ['AI', '경제', '창업', '수익화/크리에이터 이코노미', '날씨', '정부지원정책'];
const CATEGORY_EMOJI = {
  AI: '🤖',
  경제: '💹',
  창업: '🚀',
  '수익화/크리에이터 이코노미': '💵',
  날씨: '☀️',
  정부지원정책: '🏛️',
};

function truncate(str, max) {
  return str.length > max ? `${str.slice(0, max - 1)}…` : str;
}

async function postToDiscord(body) {
  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Discord 웹훅 전송 실패: HTTP ${res.status} ${text}`);
  }
}

async function main() {
  if (!WEBHOOK_URL) {
    throw new Error('DISCORD_WEBHOOK_URL 환경변수가 설정되어 있지 않습니다.');
  }

  const raw = await readFile(DATA_FILE, 'utf-8');
  const data = JSON.parse(raw);
  const cutoff = Date.now() - WINDOW_HOURS * 60 * 60 * 1000;
  const recent = (data.items || []).filter(
    (item) => item.pubDate && new Date(item.pubDate).getTime() >= cutoff
  );

  const today = new Date().toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (recent.length === 0) {
    await postToDiscord({
      username: 'RSS 뉴스봇',
      content: `📰 **${today} 뉴스 요약**\n최근 ${WINDOW_HOURS}시간 동안 수집된 새 뉴스가 없습니다.`,
    });
    console.log('수집된 뉴스 없음 - 안내 메시지 전송');
    return;
  }

  const byCategory = new Map();
  for (const item of recent) {
    if (!byCategory.has(item.category)) byCategory.set(item.category, []);
    byCategory.get(item.category).push(item);
  }

  const categories = [...byCategory.keys()].sort(
    (a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b)
  );

  const embeds = categories.slice(0, 10).map((category) => {
    const items = byCategory
      .get(category)
      .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    const shown = items.slice(0, MAX_PER_CATEGORY);
    const lines = shown.map(
      (item) => `• [${truncate(item.title, 90)}](${item.link}) — ${item.source}`
    );
    if (items.length > shown.length) {
      lines.push(`…외 ${items.length - shown.length}건`);
    }
    return {
      title: `${CATEGORY_EMOJI[category] || '📌'} ${category} (${items.length}건)`,
      description: truncate(lines.join('\n'), 4000),
      color: 0x5865f2,
    };
  });

  await postToDiscord({
    username: 'RSS 뉴스봇',
    content: `📰 **${today} 뉴스 요약** — 최근 ${WINDOW_HOURS}시간, 총 ${recent.length}건`,
    embeds,
  });
  console.log(`디스코드 전송 완료: ${recent.length}건, ${embeds.length}개 카테고리`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
