import { and, asc, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "./index";
import { articles, categories, userArticles } from "./schema";

// 사용자의 카테고리 목록 (생성순)
export function getUserCategories(userId: string) {
  return db
    .select()
    .from(categories)
    .where(eq(categories.userId, userId))
    .orderBy(asc(categories.createdAt), asc(categories.id));
}

// 전체 기사를 최신순(발행일 → 저장일)으로 가져오고,
// 해당 사용자가 분류한 카테고리와 Notion 저장 여부를 함께 붙인다.
export function getDashboardArticles(userId: string) {
  return db
    .select({
      id: articles.id,
      url: articles.url,
      source: articles.source,
      originalTitle: articles.originalTitle,
      titleKo: articles.titleKo,
      summaryKo: articles.summaryKo,
      publishedAt: articles.publishedAt,
      categoryId: categories.id,
      notionPageId: userArticles.notionPageId,
    })
    .from(articles)
    .leftJoin(
      userArticles,
      and(
        eq(userArticles.articleId, articles.id),
        eq(userArticles.userId, userId),
      ),
    )
    .leftJoin(categories, eq(categories.id, userArticles.categoryId))
    .orderBy(sql`${articles.publishedAt} desc nulls last`, desc(articles.createdAt));
}

// url이 이미 있는 기사는 건너뛰고, 새로 저장된 건수를 돌려준다.
export async function insertNewArticles(
  rows: (typeof articles.$inferInsert)[],
) {
  if (rows.length === 0) return 0;
  const inserted = await db
    .insert(articles)
    .values(rows)
    .onConflictDoNothing({ target: articles.url })
    .returning({ id: articles.id });
  return inserted.length;
}

// 번역·요약이 아직 안 된 기사 (새 기사 + 이전에 실패한 기사). 최신순으로 limit건.
export function getUntranslatedArticles(limit: number) {
  return db
    .select({
      id: articles.id,
      url: articles.url,
      originalTitle: articles.originalTitle,
    })
    .from(articles)
    .where(isNull(articles.titleKo))
    .orderBy(sql`${articles.publishedAt} desc nulls last`, desc(articles.createdAt))
    .limit(limit);
}

export async function updateArticleKo(
  rows: { id: number; titleKo: string; summaryKo: string }[],
) {
  // neon-http는 트랜잭션이 없으므로 건별로 갱신한다. 각 갱신은 독립적이라 중간에 실패해도 안전하다.
  await Promise.all(
    rows.map((r) =>
      db
        .update(articles)
        .set({ titleKo: r.titleKo, summaryKo: r.summaryKo })
        .where(eq(articles.id, r.id)),
    ),
  );
}

// 번역은 끝났지만 이 사용자의 분류가 아직 없는 기사
export function getUnclassifiedArticles(userId: string) {
  return db
    .select({
      id: articles.id,
      titleKo: articles.titleKo,
      summaryKo: articles.summaryKo,
    })
    .from(articles)
    .leftJoin(
      userArticles,
      and(
        eq(userArticles.articleId, articles.id),
        eq(userArticles.userId, userId),
      ),
    )
    .where(and(isNotNull(articles.titleKo), isNull(userArticles.articleId)));
}

export async function insertUserArticles(
  rows: (typeof userArticles.$inferInsert)[],
) {
  if (rows.length === 0) return;
  await db.insert(userArticles).values(rows).onConflictDoNothing();
}

// 같은 이름의 카테고리가 이미 있으면 null을 돌려주고 만들지 않는다.
export async function insertCategory(
  userId: string,
  name: string,
  description: string,
) {
  const [duplicate] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.userId, userId), eq(categories.name, name)))
    .limit(1);
  if (duplicate) return null;

  const [created] = await db
    .insert(categories)
    .values({ userId, name, description })
    .returning();
  return created;
}

const DEFAULT_CATEGORIES = [
  { name: "모델·연구", description: "새로운 AI 모델 공개, 벤치마크, 연구 논문" },
  { name: "제품·서비스", description: "AI 기능이 들어간 제품·앱·서비스 출시와 업데이트" },
  { name: "투자·비즈니스", description: "투자 유치, 인수합병, 실적, 기업 전략" },
  { name: "규제·정책", description: "정부 규제, 법안, 저작권·안전 관련 정책" },
  { name: "기타", description: "위 분류에 맞지 않는 뉴스" },
];

// 카테고리가 하나도 없는 사용자에게 기본 카테고리를 만들어 주고 목록을 돌려준다.
export async function ensureUserCategories(userId: string) {
  const existing = await getUserCategories(userId);
  if (existing.length > 0) return existing;
  await db
    .insert(categories)
    .values(DEFAULT_CATEGORIES.map((c) => ({ ...c, userId })));
  return getUserCategories(userId);
}

export type DashboardArticle = Awaited<
  ReturnType<typeof getDashboardArticles>
>[number];
export type UserCategory = Awaited<ReturnType<typeof getUserCategories>>[number];
