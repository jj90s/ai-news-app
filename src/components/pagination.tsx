import Link from "next/link";

const itemBase =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500";
const itemIdle =
  "border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800";
const itemActive = "border-indigo-600 bg-indigo-600 font-semibold text-white";
const itemDisabled =
  "cursor-not-allowed border-slate-200 text-slate-300 dark:border-slate-800 dark:text-slate-600";

// 첫/마지막 페이지와 현재 페이지 앞뒤 2페이지를 보여주고, 번호가 이어지지 않는 곳만 '…'로 줄인다.
// 예: 1 … 48 49 [50] 51 52 … 100
function pageItems(current: number, total: number): (number | "gap")[] {
  const pages = new Set([
    1,
    total,
    current - 2,
    current - 1,
    current,
    current + 1,
    current + 2,
  ]);
  const sorted = [...pages]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);

  const items: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) items.push("gap");
    items.push(p);
  });
  return items;
}

export function Pagination({
  page,
  totalPages,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  // 페이지 번호를 받아 이동할 주소를 만든다 (카테고리 등 다른 쿼리는 호출한 쪽에서 유지).
  hrefFor: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="페이지 이동"
      className="mt-8 flex flex-wrap items-center justify-center gap-2"
    >
      <NavButton label="처음" href={hrefFor(1)} disabled={page <= 1} />
      <NavButton label="이전" href={hrefFor(page - 1)} disabled={page <= 1} />


      {pageItems(page, totalPages).map((item, i) =>
        item === "gap" ? (
          <span key={`gap-${i}`} aria-hidden className="px-1 text-slate-400">
            …
          </span>
        ) : (
          <Link
            key={item}
            href={hrefFor(item)}
            aria-current={item === page ? "page" : undefined}
            className={`${itemBase} ${item === page ? itemActive : itemIdle}`}
          >
            {item}
          </Link>
        ),
      )}

      <NavButton
        label="다음"
        href={hrefFor(page + 1)}
        disabled={page >= totalPages}
      />
      <NavButton
        label="끝"
        href={hrefFor(totalPages)}
        disabled={page >= totalPages}
      />
    </nav>
  );
}

function NavButton({
  label,
  href,
  disabled,
}: {
  label: string;
  href: string;
  disabled: boolean;
}) {
  return disabled ? (
    <span aria-disabled className={`${itemBase} ${itemDisabled}`}>
      {label}
    </span>
  ) : (
    <Link href={href} className={`${itemBase} ${itemIdle}`}>
      {label}
    </Link>
  );
}
