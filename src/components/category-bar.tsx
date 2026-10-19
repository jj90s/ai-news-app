import Link from "next/link";
import type { UserCategory } from "@/db/queries";
import { categoryBadgeClass } from "./category-style";

const chipBase =
  "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500";
const chipIdle =
  "border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800";
const chipActive = "border-indigo-600 bg-indigo-600 text-white";

function Chip({
  href,
  active,
  label,
  count,
  tone,
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
  // 카테고리 칩은 카드 배지와 같은 색을 쓴다. 없으면 '전체' 칩 스타일.
  tone?: string;
}) {
  const style = tone
    ? `border-transparent ${tone} hover:brightness-95 ${active ? "font-semibold ring-2 ring-current" : ""}`
    : active
      ? chipActive
      : chipIdle;
  return (
    <Link
      href={href}
      aria-pressed={active}
      className={`${chipBase} ${style}`}
    >
      {label}
      <span className="text-xs opacity-70">{count}</span>
    </Link>
  );
}

export function CategoryBar({
  categories,
  counts,
  total,
  selectedId,
}: {
  categories: UserCategory[];
  counts: Map<number, number>;
  total: number;
  selectedId: number | null;
}) {
  return (
    <nav
      aria-label="카테고리"
      className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1 sm:flex-wrap"
    >
      <Chip
        href="/dashboard"
        active={selectedId === null}
        label="전체"
        count={total}
      />
      {categories.map((c) => (
        <Chip
          key={c.id}
          href={`/dashboard?category=${c.id}`}
          active={selectedId === c.id}
          label={c.name}
          count={counts.get(c.id) ?? 0}
          tone={categoryBadgeClass(c.name, c.id)}
        />
      ))}
      {/* 추가 다이얼로그는 카테고리 CRUD 단계에서 연결한다. */}
      <button
        type="button"
        disabled
        title="카테고리 추가는 준비 중이에요"
        className="inline-flex shrink-0 items-center gap-1 rounded-full border border-dashed border-slate-300 px-3.5 py-1.5 text-sm text-slate-500 transition enabled:hover:border-indigo-500 enabled:hover:text-indigo-600 disabled:opacity-70 dark:border-slate-600 dark:text-slate-400"
      >
        <span aria-hidden>+</span> 카테고리 추가
      </button>
    </nav>
  );
}
