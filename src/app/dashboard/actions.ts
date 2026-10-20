"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import {
  ensureUserCategories,
  getUnclassifiedArticles,
  getUntranslatedArticles,
  insertNewArticles,
  insertUserArticles,
  updateArticleKo,
} from "@/db/queries";
import { classifyArticles } from "@/lib/ai/classify";
import { translateAndSummarize } from "@/lib/ai/translate";
import { FEEDS } from "@/lib/rss/feeds";
import { fetchFeedArticles, type FeedItem } from "@/lib/rss/parse";

// 한 번에 번역할 기사 수의 상한 (서버 액션 시간 제한 대비). 남은 기사는 다음 실행에서 이어 처리한다.
const MAX_TRANSLATE_PER_RUN = 30;

export type FetchNewsResult =
  | {
      ok: true;
      inserted: number;
      translated: number;
      // 번역·요약에 실패해 다음 실행에서 다시 시도할 기사 수
      pending: number;
      failedSources: string[];
    }
  | { ok: false; error: string };

// 지난 24시간 동안의 기사를 RSS에서 읽어 저장하고, 한국어 번역·요약과 카테고리 분류까지 처리한다.
// 이미 번역된 기사와 이미 분류된 기사는 다시 처리하지 않는다.
export async function fetchNewsAction(): Promise<FetchNewsResult> {
  // Server Action은 /api 보호(proxy)를 받지 않으므로 직접 확인한다.
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "로그인이 필요해요." };

  try {
    const now = new Date();
    const results = await Promise.allSettled(
      FEEDS.map((feed) => fetchFeedArticles(feed, now)),
    );

    const fetched: FeedItem[] = [];
    const failedSources: string[] = [];
    results.forEach((r, i) => {
      if (r.status === "fulfilled") fetched.push(...r.value);
      else failedSources.push(FEEDS[i].source);
    });

    // 모든 피드가 실패했으면 저장할 것이 없으니 오류로 처리한다.
    if (failedSources.length === FEEDS.length) {
      return {
        ok: false,
        error: "뉴스를 가져오지 못했어요. 잠시 후 다시 시도해 주세요.",
      };
    }

    const inserted = await insertNewArticles(
      fetched.map(({ url, source, originalTitle, publishedAt }) => ({
        url,
        source,
        originalTitle,
        publishedAt,
      })),
    );

    // A. 번역·요약: titleKo가 비어 있는 기사 (새 기사 + 이전 실패분). 본문은 이번 RSS에서 url로 찾는다.
    const contentByUrl = new Map(fetched.map((f) => [f.url, f.content]));
    const untranslated = await getUntranslatedArticles(MAX_TRANSLATE_PER_RUN);
    const { translated, failed } = await translateAndSummarize(
      untranslated.map((a) => ({
        id: a.id,
        originalTitle: a.originalTitle,
        content: contentByUrl.get(a.url) ?? "",
      })),
    );
    await updateArticleKo(translated);

    // B. 분류: 이 사용자의 분류가 없는 번역 완료 기사
    const categories = await ensureUserCategories(userId);
    const unclassified = await getUnclassifiedArticles(userId);
    if (unclassified.length > 0) {
      const categoryIds = await classifyArticles(
        unclassified.map((a) => ({
          id: a.id,
          titleKo: a.titleKo ?? "",
          summaryKo: a.summaryKo ?? "",
        })),
        categories,
      );
      await insertUserArticles(
        [...categoryIds].map(([articleId, categoryId]) => ({
          userId,
          articleId,
          categoryId,
        })),
      );
    }

    revalidatePath("/dashboard");
    return {
      ok: true,
      inserted,
      translated: translated.length,
      pending: failed,
      failedSources,
    };
  } catch (e) {
    console.error("fetchNewsAction failed", e);
    return {
      ok: false,
      error: "뉴스를 가져오지 못했어요. 잠시 후 다시 시도해 주세요.",
    };
  }
}
