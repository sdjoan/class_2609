const govGrantQuery = encodeURIComponent('"지원사업" 공고 OR 모집');

export const feeds = [
  {
    category: 'AI',
    name: 'AI타임스',
    url: 'https://www.aitimes.com/rss/allArticle.xml',
  },
  {
    category: 'AI',
    name: 'OpenAI',
    url: 'https://openai.com/news/rss.xml',
  },
  {
    category: '경제',
    name: '매일경제 경제',
    url: 'https://www.mk.co.kr/rss/30100041/',
  },
  {
    category: '경제',
    name: '한국경제',
    url: 'https://www.hankyung.com/feed/economy',
  },
  {
    category: '경제',
    name: '미 연준 보도자료',
    url: 'https://www.federalreserve.gov/feeds/press_all.xml',
  },
  {
    category: '창업',
    name: '플래텀',
    url: 'https://platum.kr/feed',
  },
  {
    category: '수익화/크리에이터 이코노미',
    name: 'Tubefilter',
    url: 'https://www.tubefilter.com/feed/',
  },
  {
    category: '날씨',
    name: '기상청',
    // weather.go.kr/plus/rss.jsp is a landing page, not a raw feed, and the
    // legacy mid-term-rss3.jsp endpoints now redirect to an HTML guide page.
    // Kept as-is per the source list; collect.mjs skips it if it's not XML.
    url: 'https://www.weather.go.kr/plus/rss.jsp',
  },
  {
    category: '정부지원정책',
    name: 'Google 뉴스: 지원사업 공고/모집',
    url: `https://news.google.com/rss/search?q=${govGrantQuery}&hl=ko&gl=KR&ceid=KR:ko`,
  },
];
