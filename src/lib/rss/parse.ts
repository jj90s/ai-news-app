import { XMLParser } from "fast-xml-parser";
import type { Feed } from "./feeds";

export type FeedArticle = {
  url: string;
  source: string;
  originalTitle: string;
  publishedAt: Date;
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
});

// 태그가 텍스트이거나 { "#text": ... } 객체인 경우 모두 문자열로 꺼낸다.
function text(node: unknown): string {
  if (typeof node === "string") return node.trim();
  if (typeof node === "number") return String(node);
  if (node && typeof node === "object" && "#text" in node) {
    return text((node as Record<string, unknown>)["#text"]);
  }
  return "";
}

function toArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

// Atom의 <link>는 href 속성에 주소가 있고, alternate가 원문 링크다.
function atomLink(node: unknown): string {
  const links = toArray(node as Record<string, string> | Record<string, string>[]);
  const link = links.find((l) => !l["@_rel"] || l["@_rel"] === "alternate");
  return link?.["@_href"]?.trim() ?? "";
}

type RawItem = { url: string; title: string; date: string };

function extractItems(xml: string): RawItem[] {
  const doc = parser.parse(xml);

  // RSS 2.0 (TechCrunch)
  if (doc.rss) {
    return toArray(doc.rss.channel?.item).map((item: Record<string, unknown>) => ({
      url: text(item.link),
      title: text(item.title),
      date: text(item.pubDate),
    }));
  }

  // Atom (The Verge)
  if (doc.feed) {
    return toArray(doc.feed.entry).map((entry: Record<string, unknown>) => ({
      url: atomLink(entry.link),
      title: text(entry.title),
      date: text(entry.published) || text(entry.updated),
    }));
  }

  throw new Error("지원하지 않는 피드 형식이에요.");
}

// 피드 한 곳을 읽어 지난 hours시간 안에 발행된 기사만 돌려준다.
// 날짜가 없거나 해석할 수 없는 항목은 24시간 기준을 판단할 수 없어 제외한다.
export async function fetchFeedArticles(
  feed: Feed,
  now: Date,
  hours = 24,
): Promise<FeedArticle[]> {
  const res = await fetch(feed.url, {
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
    headers: { "User-Agent": "Mozilla/5.0 (compatible; ai-news-collector)" },
  });
  if (!res.ok) throw new Error(`${feed.source} 응답 오류 (${res.status})`);

  const since = now.getTime() - hours * 60 * 60 * 1000;
  const articles: FeedArticle[] = [];

  for (const item of extractItems(await res.text())) {
    const publishedAt = new Date(item.date);
    if (!item.url || !item.title || Number.isNaN(publishedAt.getTime())) continue;
    if (publishedAt.getTime() < since) continue;

    articles.push({
      url: item.url,
      source: feed.source,
      originalTitle: item.title,
      publishedAt,
    });
  }
  return articles;
}
