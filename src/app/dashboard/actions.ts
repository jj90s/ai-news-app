"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { insertNewArticles } from "@/db/queries";
import { FEEDS } from "@/lib/rss/feeds";
import { fetchFeedArticles, type FeedArticle } from "@/lib/rss/parse";

export type FetchNewsResult =
  | { ok: true; inserted: number; failedSources: string[] }
  | { ok: false; error: string };

// 지난 24시간 동안의 기사를 RSS에서 읽어 articles에 저장한다.
// 번역·요약·분류는 별도 단계에서 채우므로 여기서는 원문 정보만 저장한다.
export async function fetchNewsAction(): Promise<FetchNewsResult> {
  // Server Action은 /api 보호(proxy)를 받지 않으므로 직접 확인한다.
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "로그인이 필요해요." };

  try {
    const now = new Date();
    const results = await Promise.allSettled(
      FEEDS.map((feed) => fetchFeedArticles(feed, now)),
    );

    const fetched: FeedArticle[] = [];
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

    const inserted = await insertNewArticles(fetched);
    revalidatePath("/dashboard");
    return { ok: true, inserted, failedSources };
  } catch (e) {
    console.error("fetchNewsAction failed", e);
    return {
      ok: false,
      error: "뉴스를 가져오지 못했어요. 잠시 후 다시 시도해 주세요.",
    };
  }
}
