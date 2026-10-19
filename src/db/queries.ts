import { and, asc, desc, eq, sql } from "drizzle-orm";
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

export type DashboardArticle = Awaited<
  ReturnType<typeof getDashboardArticles>
>[number];
export type UserCategory = Awaited<ReturnType<typeof getUserCategories>>[number];
