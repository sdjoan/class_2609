import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { feeds } from '../feeds.mjs';
import { fetchFeed } from './lib/fetchFeed.mjs';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'news.json');
const MAX_AGE_DAYS = 7;
const MAX_ITEMS = 500;

function toIso(date) {
  const d = date ? new Date(date) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toISOString() : null;
}

async function loadExisting() {
  try {
    const raw = await readFile(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.items) ? parsed.items : [];
  } catch {
    return [];
  }
}

async function collectFeed(feed) {
  try {
    const parsed = await fetchFeed(feed.url);
    const items = (parsed.items || [])
      .map((item) => ({
        title: (item.title || '').trim(),
        link: item.link || item.guid || '',
        pubDate: toIso(item.pubDate || item.isoDate),
        source: feed.name,
        category: feed.category,
      }))
      .filter((it) => it.title && it.link);
    console.log(`OK   ${feed.category} / ${feed.name}: ${items.length}건`);
    return items;
  } catch (err) {
    console.warn(`SKIP ${feed.category} / ${feed.name}: ${err.message}`);
    return [];
  }
}

async function main() {
  await mkdir(DATA_DIR, { recursive: true });
  const existing = await loadExisting();
  const fetched = (await Promise.all(feeds.map(collectFeed))).flat();

  const byLink = new Map();
  for (const item of [...existing, ...fetched]) {
    if (!item.link) continue;
    const prev = byLink.get(item.link);
    if (!prev || (item.pubDate && (!prev.pubDate || item.pubDate > prev.pubDate))) {
      byLink.set(item.link, item);
    }
  }

  const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  const merged = [...byLink.values()]
    .filter((item) => !item.pubDate || new Date(item.pubDate).getTime() >= cutoff)
    .sort((a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0))
    .slice(0, MAX_ITEMS);

  const payload = {
    lastUpdated: new Date().toISOString(),
    count: merged.length,
    items: merged,
  };

  await writeFile(DATA_FILE, JSON.stringify(payload, null, 2) + '\n', 'utf-8');
  console.log(`저장 완료: ${merged.length}건 -> data/news.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
