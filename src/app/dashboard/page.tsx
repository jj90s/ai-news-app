import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import {
  getArticleCount,
  getDashboardArticles,
  getUserCategories,
} from "@/db/queries";
import { CategoryBar } from "@/components/category-bar";
import { NewsCard } from "@/components/news-card";
import { Pagination } from "@/components/pagination";
import { SearchForm } from "@/components/search-form";
import { FetchNewsButton } from "./fetch-news-button";

export const metadata = { title: "대시보드 · AI 뉴스 수집기" };

const PAGE_SIZE = 9;

export default function DashboardPage({
  searchParams,
}: PageProps<"/dashboard">) {
  return (
    <div className="flex-1 bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <span className="text-lg font-bold tracking-tight">
            AI 뉴스 수집기
          </span>
          <div className="flex items-center gap-3">
            <FetchNewsButton />
            <Suspense>
              <UserButton />
            </Suspense>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                오늘의 AI 뉴스
              </h1>
              <Suspense
                fallback={
                  <span
                    className="h-6 w-24 animate-pulse rounded-full bg-slate-200/70 dark:bg-slate-800"
                    aria-hidden
                  />
                }
              >
                <ArticleCountBadge />
              </Suspense>
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              해외 AI 뉴스를 한국어로 요약해 드려요.
            </p>
          </div>
          <Suspense fallback={<div className="h-10 sm:w-96" aria-hidden />}>
            <SearchSlot searchParams={searchParams} />
          </Suspense>
        </div>

        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  );
}

// 제목 옆의 총 뉴스 수 배지. DB 조회라 요청 시점에 실행되도록 connection()으로 동적 처리한다.
async function ArticleCountBadge() {
  await connection();
  const total = await getArticleCount();
  return (
    <span
      role="status"
      className="inline-flex rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
    >
      총 {total.toLocaleString("ko-KR")}개의 뉴스
    </span>
  );
}

// 제목 줄의 검색창. searchParams는 요청 시점 데이터라 별도 Suspense 안에서 읽는다.
async function SearchSlot({
  searchParams,
}: {
  searchParams: PageProps<"/dashboard">["searchParams"];
}) {
  const { category, q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q)?.trim() ?? "";
  const categoryId = Number(Array.isArray(category) ? category[0] : category);
  return (
    <SearchForm
      query={query}
      categoryId={Number.isInteger(categoryId) ? categoryId : null}
    />
  );
}

async function DashboardContent({
  searchParams,
}: {
  searchParams: PageProps<"/dashboard">["searchParams"];
}) {
  // 세션과 searchParams는 요청 시점 데이터라 Suspense 안에서 읽는다.
  const { userId } = await auth();
  if (!userId) redirect("/");

  const { category, page: pageParam, q } = await searchParams;
  const [categories, articles] = await Promise.all([
    getUserCategories(userId),
    getDashboardArticles(userId),
  ]);

  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const counts = new Map<number, number>();
  for (const a of articles) {
    if (a.categoryId !== null) {
      counts.set(a.categoryId, (counts.get(a.categoryId) ?? 0) + 1);
    }
  }

  const requestedId = Number(Array.isArray(category) ? category[0] : category);
  const selectedId = categoryById.has(requestedId) ? requestedId : null;
  const query = (Array.isArray(q) ? q[0] : q)?.trim() ?? "";
  const keyword = query.toLowerCase();
  // 카테고리 필터 위에 키워드 검색을 겹친다. 한국어 제목·요약과 원문 제목에서 찾는다.
  const visible = articles.filter(
    (a) =>
      (selectedId === null || a.categoryId === selectedId) &&
      (keyword === "" ||
        [a.titleKo, a.summaryKo, a.originalTitle].some((text) =>
          text?.toLowerCase().includes(keyword),
        )),
  );

  // 잘못된 값이나 범위를 벗어난 페이지는 가까운 유효 페이지로 맞춘다.
  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const requestedPage = Number(
    Array.isArray(pageParam) ? pageParam[0] : pageParam,
  );
  const page = Number.isInteger(requestedPage)
    ? Math.min(Math.max(requestedPage, 1), totalPages)
    : 1;
  const pageArticles = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // 카테고리 필터와 검색어는 유지하고 페이지만 바꾼다. 1페이지는 쿼리에서 생략한다.
  function pageHref(p: number) {
    const params = new URLSearchParams();
    if (selectedId !== null) params.set("category", String(selectedId));
    if (query) params.set("q", query);
    if (p > 1) params.set("page", String(p));
    const search = params.toString();
    return search ? `/dashboard?${search}` : "/dashboard";
  }

  return (
    <>
      <div className="mt-6">
        <CategoryBar
          categories={categories}
          counts={counts}
          total={articles.length}
          selectedId={selectedId}
          query={query}
        />
      </div>

      {query && (
        <p
          role="status"
          className="mt-4 text-sm text-slate-500 dark:text-slate-400"
        >
          ‘{query}’ 검색 결과 {visible.length}건
        </p>
      )}

      {visible.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 py-20 text-center dark:border-slate-700">
          <p className="font-medium">
            {articles.length === 0
              ? "아직 가져온 뉴스가 없어요."
              : query
                ? "검색 결과가 없어요."
                : "이 카테고리에는 아직 뉴스가 없어요."}
          </p>
          {articles.length === 0 && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              뉴스를 가져오면 이곳에 카드로 표시돼요.
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pageArticles.map((a) => (
              <NewsCard
                key={a.id}
                article={a}
                category={
                  a.categoryId !== null
                    ? categoryById.get(a.categoryId)
                    : undefined
                }
              />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} hrefFor={pageHref} />
        </>
      )}
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mt-6" aria-hidden>
      <div className="h-9 w-2/3 animate-pulse rounded-full bg-slate-200/70 dark:bg-slate-800" />
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="h-56 animate-pulse rounded-xl bg-slate-200/70 dark:bg-slate-800"
          />
        ))}
      </div>
    </div>
  );
}
