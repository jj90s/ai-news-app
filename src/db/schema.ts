import {
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// 기사는 전 사용자 공용으로 한 번만 저장한다.
export const articles = pgTable("articles", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  url: text().notNull().unique(),
  source: text().notNull(),
  originalTitle: text().notNull(),
  // 번역·요약 전에는 비어 있다.
  titleKo: text(),
  summaryKo: text(),
  publishedAt: timestamp({ withTimezone: true }),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

// 카테고리는 사용자(Clerk userId)별로 관리한다.
export const categories = pgTable("categories", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: text().notNull(),
  name: text().notNull(),
  description: text().notNull().default(""),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

// 분류 결과와 Notion 저장 여부는 사용자별로 관리한다.
export const userArticles = pgTable(
  "user_articles",
  {
    userId: text().notNull(),
    articleId: integer()
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    categoryId: integer()
      .notNull()
      .references(() => categories.id),
    notionPageId: text(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.articleId] })],
);
