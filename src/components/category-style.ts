// 카테고리 배지 색 (ui.md §2). 지정되지 않은 이름은 팔레트를 순서대로 돌려 쓴다.
const NAMED: Record<string, string> = {
  "모델·연구": "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
  "제품·서비스": "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
  "투자·비즈니스": "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  "규제·정책": "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
  기타: "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300",
};

const PALETTE = [
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/20 dark:text-fuchsia-300",
  "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300",
  "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
];

export function categoryBadgeClass(name: string, id: number) {
  return NAMED[name] ?? PALETTE[id % PALETTE.length];
}
