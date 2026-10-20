# UI 가이드

앱 이름: **AI 뉴스 수집기**
스택: Next.js (App Router) + Tailwind CSS v4
원칙: 깔끔하고 읽기 편하게. 여백은 넉넉하게, 색은 절제해서 쓰고, 정보의 위계는 글자 크기와 굵기로 나타낸다.

---

## 1. 디자인 원칙

1. **콘텐츠가 주인공:** 뉴스 제목과 요약이 가장 눈에 띄어야 한다. 장식은 최소화한다.
2. **차분한 색:** 바탕은 흰색·옅은 회색, 강조색은 하나(인디고)만 쓴다.
3. **넉넉한 여백:** 카드 안팎 간격을 충분히 두어 답답하지 않게 한다.
4. **일관성:** 모서리 둥글기, 그림자, 간격은 아래 토큰만 사용한다.
5. **한국어 우선:** 모든 UI 문구는 한국어. 긴 문장은 `break-keep`으로 단어 단위 줄바꿈.

---

## 2. 디자인 토큰

### 색상 (Tailwind 클래스 기준)

| 용도 | 라이트 | 다크 |
|---|---|---|
| 페이지 배경 | `bg-slate-50` | `dark:bg-slate-950` |
| 카드/헤더 배경 | `bg-white` | `dark:bg-slate-900` |
| 테두리 | `border-slate-200` | `dark:border-slate-800` |
| 본문 텍스트 | `text-slate-900` | `dark:text-slate-100` |
| 보조 텍스트 | `text-slate-500` | `dark:text-slate-400` |
| 강조색(버튼·선택) | `bg-indigo-600` / `hover:bg-indigo-700` | `dark:bg-indigo-500` |
| 오류 | `text-red-600` / `bg-red-50` | `dark:bg-red-950` |
| 성공(저장됨) | `text-emerald-600` | `dark:text-emerald-400` |

### 카테고리 배지 색

카테고리마다 색을 하나씩 배정한다. 사용자가 만든 카테고리는 아래 팔레트를 순서대로 돌려 쓴다.

| 카테고리 | 클래스 |
|---|---|
| 모델·연구 | `bg-violet-100 text-violet-700` |
| 제품·서비스 | `bg-sky-100 text-sky-700` |
| 투자·비즈니스 | `bg-amber-100 text-amber-700` |
| 규제·정책 | `bg-rose-100 text-rose-700` |
| 기타 | `bg-slate-100 text-slate-600` |

### 타이포그래피

| 요소 | 클래스 |
|---|---|
| 앱 이름 | `text-lg font-bold tracking-tight` |
| 페이지 제목 | `text-2xl font-bold tracking-tight` |
| 카드 제목 | `text-base font-semibold leading-snug` |
| 카드 요약 | `text-sm leading-relaxed text-slate-600` |
| 메타 정보(출처·날짜) | `text-xs text-slate-500` |
| 배지 | `text-xs font-medium` |

폰트는 `layout.tsx`에서 불러온 Geist(`font-sans`)를 쓴다. `globals.css`의 `body`에 `Arial`이 지정되어 있어 한글이 어색해 보이면 시스템 한글 폰트(`Pretendard`, `Apple SD Gothic Neo`, `Malgun Gothic`)를 `--font-sans` 뒤에 폴백으로 추가한다.

### 형태

- 모서리: 카드 `rounded-xl`, 버튼·입력 `rounded-lg`, 배지·칩 `rounded-full`
- 그림자: 카드 기본 `shadow-sm`, 호버 시 `hover:shadow-md`
- 간격: 4의 배수(`gap-2`, `gap-4`, `gap-6`)만 사용
- 전환: `transition` 기본값(150ms)을 모든 호버/포커스에 적용
- 포커스: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500`

---

## 3. 레이아웃

```
┌──────────────────────────────────────────────────────┐
│ 헤더: [AI 뉴스 수집기]              [뉴스 가져오기] [👤] │  ← 상단 고정
├──────────────────────────────────────────────────────┤
│                                                      │
│  오늘의 AI 뉴스                                        │
│  해외 AI 뉴스를 한국어로 요약해 드려요                    │
│                                                      │
│  [전체] [모델·연구] [제품·서비스] [투자·비즈니스] … [+ 카테고리 추가] │  ← 카테고리 바
│                                                      │
│  ┌────────┐  ┌────────┐  ┌────────┐                  │
│  │ 카드    │  │ 카드    │  │ 카드    │                  │
│  └────────┘  └────────┘  └────────┘                  │
│  ┌────────┐  ┌────────┐  ┌────────┐                  │
│  │ 카드    │  │ 카드    │  │ 카드    │                  │
│  └────────┘  └────────┘  └────────┘                  │
└──────────────────────────────────────────────────────┘
```

- 페이지 컨테이너: `mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8`
- 본문 영역: `py-8` (제목 블록과 카테고리 바 사이 `mt-6`, 카테고리 바와 카드 목록 사이 `mt-6`)
- 카드 그리드: `grid gap-6 sm:grid-cols-2 lg:grid-cols-3`

---

## 4. 컴포넌트

### 4.1 헤더

- `sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80`
- 안쪽: `flex h-16 items-center justify-between` (컨테이너 폭은 위 페이지 컨테이너와 동일)
- 왼쪽: 로고 아이콘 + 앱 이름 `AI 뉴스 수집기`
- 오른쪽: **뉴스 가져오기** 버튼 → Clerk `UserButton`

### 4.2 뉴스 가져오기 버튼 (주 버튼)

```
inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2
text-sm font-medium text-white shadow-sm transition
hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60
```

- 기본 문구: `뉴스 가져오기`
- 진행 중: 스피너 아이콘(`animate-spin`) + `가져오는 중…`, `disabled` 처리
- 완료 후 목록 위에 결과를 한 줄로 알린다. 예: `새 기사 8건을 가져왔어요.`
- 실패 시 오류 배너(4.7)를 표시한다.

### 4.3 페이지 제목 블록

```
<h1 class="text-2xl font-bold tracking-tight">오늘의 AI 뉴스</h1>
<p class="mt-1 text-sm text-slate-500">해외 AI 뉴스를 한국어로 요약해 드려요.</p>
```

### 4.4 카테고리 바 (뉴스 카드 목록 위)

카테고리 칩을 가로로 나열하고, **맨 끝에 카테고리 추가 버튼**을 둔다.

- 컨테이너: `flex flex-wrap items-center gap-2` (모바일에서는 `flex-nowrap overflow-x-auto pb-1`로 가로 스크롤 가능)
- 순서: `전체` → 각 카테고리(생성순) → `+ 카테고리 추가`

**카테고리 칩**

```
기본:  rounded-full border border-slate-200 bg-white px-3.5 py-1.5
       text-sm text-slate-600 transition hover:bg-slate-100
선택:  border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-600
```

- 선택된 칩에는 `aria-pressed="true"`를 준다.
- 칩 안에 해당 카테고리 기사 수를 작은 숫자로 덧붙일 수 있다 (`text-xs opacity-70`).

**카테고리 추가 버튼 (바의 마지막 항목)**

```
inline-flex items-center gap-1 rounded-full border border-dashed
border-slate-300 px-3.5 py-1.5 text-sm text-slate-500 transition
hover:border-indigo-500 hover:text-indigo-600
```

- 문구: `+ 카테고리 추가` (아이콘 `+`와 텍스트)
- 클릭 시 카테고리 추가 다이얼로그(4.6)를 연다.
- 점선 테두리로 일반 칩(필터)과 구분되는 '동작' 버튼임을 드러낸다.
- 칩이 많아 줄바꿈되어도 항상 마지막 위치를 유지한다.

### 4.5 뉴스 카드

```
flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5
shadow-sm transition hover:shadow-md
dark:border-slate-800 dark:bg-slate-900
```

카드 내부 구성 (위 → 아래):

1. **상단 줄:** 카테고리 배지(왼쪽) · 출처와 발행일(오른쪽, 메타 스타일). 예: `TechCrunch · 2026.10.19`
2. **제목:** 한국어 제목, `mt-3 text-base font-semibold leading-snug line-clamp-2 break-keep`. 원문 제목은 제목 아래 `mt-1 text-xs text-slate-400 line-clamp-1`로 작게 표시한다.
3. **요약:** `mt-3 text-sm leading-relaxed text-slate-600 line-clamp-4 break-keep` (`flex-1`로 하단 영역을 아래로 밀어낸다)
4. **하단 액션 줄:** `mt-5 flex items-center justify-between border-t border-slate-100 pt-4`
   - 왼쪽: `원문 보기 ↗` 링크 (`text-sm font-medium text-indigo-600 hover:underline`, `target="_blank" rel="noopener noreferrer"`)
   - 오른쪽: `뉴스 저장` 버튼

**카테고리 배지:** `inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium` + 2장의 색 클래스

**뉴스 저장 버튼 상태**

| 상태 | 표시 | 클래스 |
|---|---|---|
| 기본 | `뉴스 저장` | `rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50` |
| 저장 중 | 스피너 + `저장 중…` | 위와 동일 + `disabled opacity-60` |
| 저장됨 | `✓ 저장됨` | `border-transparent bg-emerald-50 text-emerald-700 cursor-default` (`disabled`, 중복 저장 방지) |
| 실패 | `다시 시도` | `border-red-200 text-red-600` |

### 4.6 카테고리 추가 다이얼로그

- 오버레이: `fixed inset-0 z-20 bg-slate-900/40`
- 패널: `mx-auto mt-24 w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900`
- 구성: 제목 `카테고리 추가`(`text-lg font-semibold`) → 이름 입력 → 설명 입력 → 버튼
  - 이름: 라벨 `이름`, 한 줄 입력
  - 설명: 라벨 `설명`, 안내문 `AI가 기사를 분류할 때 이 설명을 기준으로 삼아요.`, `textarea rows-3`
  - 하단 버튼: 오른쪽 정렬 `취소`(보조) / `추가`(주 버튼)
- 입력창: `w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200`
- ESC 키와 오버레이 클릭으로 닫는다. 열릴 때 이름 입력에 포커스한다.
- 수정·삭제·재분류는 별도 카테고리 관리 화면에서 한다 (이 문서 범위 밖).

### 4.7 상태 화면

**로딩 (목록 불러오기):** 카드와 같은 크기의 스켈레톤 6개
`animate-pulse rounded-xl bg-slate-200/70 h-56`

**빈 상태 (기사 없음):**
```
rounded-xl border border-dashed border-slate-300 py-20 text-center
```
- 문구: `아직 가져온 뉴스가 없어요.` + 보조 문구 `상단의 ‘뉴스 가져오기’ 버튼을 눌러 시작해 보세요.`

**필터 결과 없음:** `이 카테고리에는 아직 뉴스가 없어요.`

**오류 배너:**
```
rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700
```
- 예: `뉴스를 가져오지 못했어요. 잠시 후 다시 시도해 주세요.`

---

## 5. 반응형

| 구간 | 카드 열 수 | 비고 |
|---|---|---|
| 기본(모바일) | 1열 | 카테고리 바 가로 스크롤, 헤더 버튼은 아이콘+짧은 문구 |
| `sm` (≥640px) | 2열 | |
| `lg` (≥1024px) | 3열 | 컨테이너 최대 폭 `max-w-6xl` |

---

## 6. 접근성

- 색만으로 상태를 구분하지 않는다 (선택 칩은 색 + `aria-pressed`, 저장됨은 색 + 체크 표시).
- 아이콘만 있는 버튼에는 `aria-label`을 붙인다.
- 본문 텍스트 대비는 WCAG AA(4.5:1) 이상을 유지한다 (`text-slate-400`은 메타 보조 정보에만 사용).
- 로딩/결과 알림 영역에는 `role="status"` (오류는 `role="alert"`)를 준다.
- 키보드로 모든 칩, 버튼, 다이얼로그를 조작할 수 있어야 한다.

---

## 7. 구현 메모

- 다크 모드는 `prefers-color-scheme`을 따른다. 현재 `globals.css`의 `--background`/`--foreground`와 충돌하지 않도록 페이지 배경은 `body` 대신 최상위 래퍼의 `bg-slate-50 dark:bg-slate-950`로 지정한다.
- Tailwind v4이므로 `tailwind.config.js` 없이 `globals.css`의 `@theme`로 토큰을 확장한다.
- 컴포넌트는 `src/components/`에 둔다: `Header`, `CategoryBar`, `CategoryChip`, `AddCategoryButton`, `AddCategoryDialog`, `NewsCard`, `NewsGrid`, `EmptyState`.
- 카테고리 바와 Notion 저장 버튼처럼 상호작용이 있는 컴포넌트만 `"use client"`로 두고, 나머지는 서버 컴포넌트로 유지한다.
