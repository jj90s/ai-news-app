import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { getDashboardArticles, getUserCategories } from "@/db/queries";
import { CategoryBar } from "@/components/category-bar";
import { NewsCard } from "@/components/news-card";
import { Pagination } from "@/components/pagination";
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
          <span className="text-lg font-bold tracking-tight">AI 뉴스 수집기</span>
          <div className="flex items-center gap-3">
            <FetchNewsButton />
            <Suspense>
              <UserButton />
            </Suspense>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold tracking-tight">오늘의 AI 뉴스</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          해외 AI 뉴스를 한국어로 요약해 드려요.
        </p>

        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
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

  const { category, page: pageParam } = await searchParams;
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
  const visible =
    selectedId === null
      ? articles
      : articles.filter((a) => a.categoryId === selectedId);

  // 잘못된 값이나 범위를 벗어난 페이지는 가까운 유효 페이지로 맞춘다.
  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const requestedPage = Number(Array.isArray(pageParam) ? pageParam[0] : pageParam);
  const page = Number.isInteger(requestedPage)
    ? Math.min(Math.max(requestedPage, 1), totalPages)
    : 1;
  const pageArticles = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // 카테고리 필터는 유지하고 페이지만 바꾼다. 1페이지는 쿼리에서 생략한다.
  function pageHref(p: number) {
    const params = new URLSearchParams();
    if (selectedId !== null) params.set("category", String(selectedId));
    if (p > 1) params.set("page", String(p));
    const query = params.toString();
    return query ? `/dashboard?${query}` : "/dashboard";
  }

  return (
    <>
      <div className="mt-6">
        <CategoryBar
          categories={categories}
          counts={counts}
          total={articles.length}
          selectedId={selectedId}
        />
      </div>

      {visible.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 py-20 text-center dark:border-slate-700">
          <p className="font-medium">
            {articles.length === 0
              ? "아직 가져온 뉴스가 없어요."
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
                  a.categoryId !== null ? categoryById.get(a.categoryId) : undefined
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
