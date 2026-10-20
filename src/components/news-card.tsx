import type { DashboardArticle, UserCategory } from "@/db/queries";
import { categoryBadgeClass } from "./category-style";
import { SaveNewsButton } from "./save-news-button";

// 2026.10.19 형식 (한국 시간 기준)
function formatDate(date: Date | null) {
  if (!date) return null;
  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${get("year")}.${get("month")}.${get("day")}`;
}

export function NewsCard({
  article,
  category,
}: {
  article: DashboardArticle;
  category?: UserCategory;
}) {
  const date = formatDate(article.publishedAt);
  const saved = article.notionPageId !== null;

  return (
    <article className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        {category ? (
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryBadgeClass(category.name, category.id)}`}
          >
            {category.name}
          </span>
        ) : (
          <span />
        )}
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
          {article.source}
          {date && ` · ${date}`}
        </p>
      </div>

      <h2 className="mt-3 line-clamp-2 break-keep text-base font-semibold leading-snug">
        {article.titleKo ?? article.originalTitle}
      </h2>
      {article.titleKo && (
        <p className="mt-1 line-clamp-1 text-xs text-slate-400">
          {article.originalTitle}
        </p>
      )}

      {/* 요약이 아직 없으면 버튼 영역이 아래로 붙도록 빈 공간만 둔다. */}
      <p className="mt-3 line-clamp-4 flex-1 break-keep text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        {article.summaryKo ?? ""}
      </p>

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded text-sm font-medium text-indigo-600 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:text-indigo-400"
        >
          원문 보기 ↗
        </a>
        <SaveNewsButton articleId={article.id} saved={saved} />
      </div>
    </article>
  );
}
