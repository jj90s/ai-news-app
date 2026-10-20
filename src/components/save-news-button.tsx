"use client";

import { useState, useTransition } from "react";
import { saveNewsToNotionAction } from "@/app/dashboard/actions";

export function SaveNewsButton({
  articleId,
  saved,
}: {
  articleId: number;
  saved: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  if (saved) {
    return (
      <button
        type="button"
        disabled
        className="cursor-default rounded-lg border border-transparent bg-emerald-50 px-3 py-1.5 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
      >
        ✓ 저장됨
      </button>
    );
  }

  function handleClick() {
    setFailed(false);
    startTransition(async () => {
      try {
        const result = await saveNewsToNotionAction(articleId);
        if (!result.ok) setFailed(true);
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
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-60 ${
        failed
          ? "border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
          : "border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
      }`}
    >
      {pending && (
        <svg className="size-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            strokeWidth="3"
            className="opacity-30"
          />
          <path
            d="M21 12a9 9 0 0 0-9-9"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      )}
      {pending ? "저장 중…" : failed ? "다시 시도" : "뉴스 저장"}
    </button>
  );
}
