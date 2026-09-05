import Parser from 'rss-parser';

const parser = new Parser();

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  Accept: 'application/rss+xml, application/xml, text/xml, */*',
};

export async function fetchFeed(url, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers: HEADERS, signal: controller.signal, redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const head = text.trimStart().slice(0, 100);
    if (!/^(<\?xml|<rss|<feed|<rdf)/i.test(head)) {
      throw new Error('응답이 RSS/Atom XML이 아님 (페이지 구조가 바뀌었을 수 있음)');
    }
    return await parser.parseString(text);
  } finally {
    clearTimeout(timer);
  }
}
