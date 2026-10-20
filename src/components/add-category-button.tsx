"use client";

import { useRef, useState, useTransition } from "react";
import { createCategoryAction } from "@/app/dashboard/actions";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-indigo-900";

export function AddCategoryButton() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function open() {
    setName("");
    setDescription("");
    setError(null);
    dialogRef.current?.showModal();
    nameRef.current?.focus();
  }

  function close() {
    dialogRef.current?.close();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const result = await createCategoryAction(name, description);
        if (result.ok) close();
        else setError(result.error);
      } catch {
        setError("카테고리를 추가하지 못했어요. 잠시 후 다시 시도해 주세요.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="inline-flex shrink-0 items-center gap-1 rounded-full border border-dashed border-slate-300 px-3.5 py-1.5 text-sm text-slate-500 transition hover:border-indigo-500 hover:text-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-slate-600 dark:text-slate-400"
      >
        <span aria-hidden>+</span> 카테고리 추가
      </button>

      {/* 기본 <dialog>가 ESC 닫기와 포커스 가둠을 처리한다. 바깥(배경) 클릭도 닫는다. */}
      <dialog
        ref={dialogRef}
        onClick={(e) => {
          if (e.target === dialogRef.current && !pending) close();
        }}
        onCancel={(e) => {
          if (pending) e.preventDefault();
        }}
        aria-labelledby="add-category-title"
        className="m-auto w-full max-w-md bg-transparent p-4 backdrop:bg-slate-900/40"
      >
        <form
          onSubmit={handleSubmit}
          className="rounded-xl bg-white p-6 text-slate-900 shadow-xl dark:bg-slate-900 dark:text-slate-100"
        >
          <h2 id="add-category-title" className="text-lg font-semibold">
            카테고리 추가
          </h2>

          <label className="mt-4 block text-sm font-medium" htmlFor="category-name">
            이름
          </label>
          <input
            ref={nameRef}
            id="category-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            required
            autoComplete="off"
            className={`mt-1 ${inputClass}`}
          />

          <label
            className="mt-4 block text-sm font-medium"
            htmlFor="category-description"
          >
            설명
          </label>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            AI가 기사를 분류할 때 이 설명을 기준으로 삼아요.
          </p>
          <textarea
            id="category-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={200}
            rows={3}
            className={`mt-1 ${inputClass}`}
          />

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
            >
              {error}
            </p>
          )}

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={close}
              disabled={pending}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={pending || !name.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-indigo-500"
            >
              {pending ? "추가 중…" : "추가"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
