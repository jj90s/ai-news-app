// Notion 공식 API로 'AI 뉴스 북마크' 데이터베이스에 페이지를 만든다.
// NOTION_API_KEY: 내부 통합 토큰, NOTION_DATABASE_ID: 저장할 데이터베이스 ID

export type NotionArticle = {
  url: string;
  source: string;
  originalTitle: string;
  titleKo: string | null;
  summaryKo: string | null;
  publishedAt: Date | null;
  categoryName: string;
};

// rich_text / title 한 조각의 글자 수 상한
const MAX_TEXT = 2000;

const text = (value: string) => [
  { type: "text", text: { content: value.slice(0, MAX_TEXT) } },
];

// 만든 Notion 페이지 ID를 돌려준다.
export async function createNotionPage(article: NotionArticle): Promise<string> {
  const apiKey = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!apiKey || !databaseId) {
    throw new Error("NOTION_API_KEY 또는 NOTION_DATABASE_ID가 설정되지 않았어요.");
  }

  const properties: Record<string, unknown> = {
    제목: { title: text(article.titleKo ?? article.originalTitle) },
    "원문 제목": { rich_text: text(article.originalTitle) },
    요약: { rich_text: text(article.summaryKo ?? "") },
    카테고리: { select: { name: article.categoryName.replaceAll(",", " ") } },
    출처: { rich_text: text(article.source) },
    원문: { url: article.url },
  };
  if (article.publishedAt) {
    properties["발행일"] = {
      date: { start: article.publishedAt.toISOString().slice(0, 10) },
    };
  }

  const res = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      parent: { database_id: databaseId },
      properties,
    }),
  });
  if (!res.ok) {
    throw new Error(`Notion API ${res.status}: ${await res.text()}`);
  }
  const page = (await res.json()) as { id: string };
  return page.id;
}
