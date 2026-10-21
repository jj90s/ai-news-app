import Link from "next/link";

// GET 폼이라 '검색' 버튼 클릭과 Enter 키가 모두 같은 방식으로 /dashboard?q=... 로 이동한다.
// 선택한 카테고리는 hidden 입력으로 유지하고, 페이지는 1페이지로 돌아간다.
export function SearchForm({
  query,
  categoryId,
}: {
  query: string;
  categoryId: number | null;
}) {
  const clearHref =
    categoryId !== null ? `/dashboard?category=${categoryId}` : "/dashboard";

  return (
    <form
      action="/dashboard"
      role="search"
      aria-label="뉴스 검색"
      className="flex shrink-0 items-center gap-2 sm:w-96"
    >
      {categoryId !== null && (
        <input type="hidden" name="category" value={categoryId} />
      )}
      {/* key로 검색어가 바뀔 때 입력값을 새로 맞춘다 (초기화 링크 이동 포함). */}
      <input
        key={query}
        type="search"
        name="q"
        defaultValue={query}
        placeholder="키워드로 뉴스 검색"
        aria-label="검색어"
        className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-900 dark:focus:ring-indigo-900"
      />
      <button
        type="submit"
        className="inline-flex shrink-0 items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600"
      >
        검색
      </button>
      {query && (
        <Link
          href={clearHref}
          className="shrink-0 rounded-lg px-2 py-2 text-sm text-slate-500 transition hover:text-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:text-slate-400"
        >
          초기화
        </Link>
      )}
    </form>
  );
}
