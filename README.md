# AI 뉴스 수집기

해외 AI 뉴스를 RSS로 수집하고, Claude가 한국어로 번역·요약·카테고리 분류해 카드로 보여주는 웹앱입니다. 마음에 드는 뉴스는 버튼 한 번으로 Notion 데이터베이스에 저장할 수 있습니다.

## 주요 기능

- **로그인:** Clerk 로그인 사용자만 접근할 수 있습니다.
- **뉴스 가져오기:** 버튼을 누를 때만 수집합니다. 지난 24시간 기사를 URL 기준으로 중복 없이 저장하고, 새 기사만 Claude로 처리합니다.
- **뉴스 카드:** 한국어 제목·요약, 출처, 발행일, 카테고리 배지, 원문 링크를 보여주며 9개씩 페이지를 나눕니다.
- **카테고리:** 자동 분류와 필터, 카테고리 추가를 지원합니다. 카테고리 설명이 분류 기준으로 쓰입니다.
- **뉴스 저장:** 카드의 `뉴스 저장` 버튼으로 Notion DB에 저장하고, 저장 후에는 `저장됨`으로 바뀝니다. 중복 저장은 막습니다.
- **예정:** 카테고리 수정·삭제, 기존 뉴스 재분류

## 뉴스 소스

- TechCrunch AI: `https://techcrunch.com/category/artificial-intelligence/feed/`
- The Verge AI: `https://www.theverge.com/rss/ai-artificial-intelligence/index.xml`

## 기술 스택

- Next.js 16 (App Router) / React 19 / TypeScript / Tailwind CSS v4
- 인증: Clerk
- DB: Neon (PostgreSQL) + Drizzle ORM
- 번역·요약·분류: Claude API (`@anthropic-ai/sdk`)
- 저장: Notion 공식 API

## 시작하기

### 1. 설치

```bash
npm install
```

### 2. 환경변수

프로젝트 루트에 `.env.local` 파일을 만들고 아래 값을 채웁니다. 이 파일은 git에 올라가지 않습니다.

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
DATABASE_URL=
ANTHROPIC_API_KEY=
NOTION_API_KEY=
NOTION_DATABASE_ID=
```

| 변수 | 설명 |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | Clerk 대시보드의 API 키 |
| `DATABASE_URL` | Neon 연결 문자열 |
| `ANTHROPIC_API_KEY` | Claude API 키 |
| `NOTION_API_KEY` | Notion 내부 통합(Integration)의 시크릿 토큰 |
| `NOTION_DATABASE_ID` | 뉴스를 저장할 Notion 데이터베이스 ID |

### 3. Notion 준비

1. https://www.notion.so/profile/integrations 에서 내부 통합을 만들고 시크릿 토큰을 `NOTION_API_KEY`에 넣습니다.
2. 저장할 데이터베이스에 아래 속성을 만듭니다.

   | 속성 | 유형 |
   |---|---|
   | 제목 | 제목 |
   | 원문 제목 | 텍스트 |
   | 요약 | 텍스트 |
   | 카테고리 | 선택 |
   | 출처 | 텍스트 |
   | 원문 | URL |
   | 발행일 | 날짜 |

3. 데이터베이스 우측 상단 `···` → 연결(Connections)에서 만든 통합을 추가합니다. 연결하지 않으면 저장이 실패합니다.
4. 데이터베이스 URL의 ID를 `NOTION_DATABASE_ID`에 넣습니다.

### 4. DB 마이그레이션

```bash
npm run db:migrate
```

### 5. 실행

```bash
npm run dev
```

http://localhost:3000/dashboard 에서 확인합니다.

## 명령어

```
npm run dev          # 개발 서버
npm run build        # 프로덕션 빌드
npm run start        # 프로덕션 서버
npm run lint         # eslint
npm run db:generate  # 스키마 변경으로 마이그레이션 생성
npm run db:migrate   # 마이그레이션 적용
npm run db:studio    # Drizzle Studio
```

## 데이터 모델

- `articles`: 기사. 전 사용자 공용으로 한 번만 저장합니다 (`url` 유일).
- `categories`: 사용자별 카테고리 (이름, 분류 기준이 되는 설명).
- `user_articles`: 사용자별 분류 결과와 Notion 저장 여부(`notionPageId`).

기사를 공용으로 두고 분류·저장 상태만 사용자별로 나눠서, 중복 수집과 재처리 비용을 줄입니다.

## 폴더 구조

```
src/
  app/dashboard/   대시보드 페이지와 서버 액션
  components/      뉴스 카드, 카테고리 바, 저장 버튼 등
  db/              Drizzle 스키마와 쿼리
  lib/rss/         RSS 수집·파싱
  lib/ai/          Claude 번역·요약·분류
  lib/notion/      Notion 저장
```

## 문서

- `PRD.md`: 요구사항 기준 문서
- `ui.md`: UI 스타일·컴포넌트 규칙
