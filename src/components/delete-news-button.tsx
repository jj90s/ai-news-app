"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function DeleteNewsButton({ articleId }: { articleId: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  function handleClick() {
    setFailed(false);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/news/${articleId}`, { method: "DELETE" });
        if (!res.ok) {
          setFailed(true);
          return;
        }
        router.refresh();
      } catch {
        setFailed(true);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label="뉴스 삭제"
      title={failed ? "삭제하지 못했어요. 다시 시도해 주세요." : "뉴스 삭제"}
      className={`absolute right-3 top-3 inline-flex size-6 items-center justify-center rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 ${
        failed
          ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
          : "text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
      }`}
    >
      <svg className="size-4" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M6 6l12 12M18 6L6 18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
