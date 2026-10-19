import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <>
      <Show when="signed-out">
        <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">
            AI 뉴스 수집기
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            로그인하고 해외 AI 뉴스를 한국어로 확인하세요.
          </p>
          <div className="flex gap-3">
            <SignInButton mode="modal">
              <button className="h-11 rounded-full bg-foreground px-6 font-medium text-background">
                로그인
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="h-11 rounded-full border border-black/10 px-6 font-medium dark:border-white/20">
                회원가입
              </button>
            </SignUpButton>
          </div>
        </main>
      </Show>

      <Show when="signed-in">
        <header className="flex items-center justify-between border-b border-black/10 px-6 py-4 dark:border-white/20">
          <h1 className="text-lg font-semibold">AI 뉴스 수집기</h1>
          <UserButton />
        </header>
        <main className="flex-1 px-6 py-8">
          <p className="text-zinc-600 dark:text-zinc-400">
            로그인되었습니다. 뉴스 목록은 이후 단계에서 구현됩니다.
          </p>
        </main>
      </Show>
    </>
  );
}
