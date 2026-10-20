"use client";

import { useState, useTransition } from "react";
import { fetchNewsAction, type FetchNewsResult } from "./actions";

export function FetchNewsButton() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<FetchNewsResult | null>(null);

  function handleClick() {
    setResult(null);
    startTransition(async () => {
      try {
        setResult(await fetchNewsAction());
      } catch {
        setResult({
          ok: false,
          error: "뉴스를 가져오지 못했어요. 잠시 후 다시 시도해 주세요.",
        });
      }
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-indigo-500"
      >
        {pending && (
          <svg
            className="size-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
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
        {pending ? "수집·번역 중…" : "뉴스 가져오기"}
      </button>

      {/* 결과·오류는 헤더 아래 버튼 옆에 떠서 표시한다. */}
      <div className="absolute right-0 top-full z-20 mt-2 w-72">
        {pending && (
          <p role="status" className="sr-only">
            뉴스를 가져오는 중이에요.
          </p>
        )}
        {result?.ok && (
          <p
            role="status"
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
          >
            {result.inserted > 0
              ? `새 기사 ${result.inserted}건을 가져왔어요.`
              : result.translated > 0
                ? `이전에 못 한 기사 ${result.translated}건을 번역했어요.`
                : "새로운 기사가 없어요."}
            {result.pending > 0 &&
              ` (${result.pending}건은 번역에 실패해 다음에 다시 시도해요.)`}
            {result.failedSources.length > 0 &&
              ` (${result.failedSources.join(", ")}은(는) 가져오지 못했어요.)`}
          </p>
        )}
        {result && !result.ok && (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
          >
            {result.error}
          </p>
        )}
      </div>
    </div>
  );
}
