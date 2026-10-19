# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

AI 뉴스 수집기. 해외 AI 뉴스를 RSS로 수집하고, Claude API가 한국어로 번역·요약·카테고리 분류하여 카드로 보여주는 웹앱이다. 마음에 드는 뉴스는 Notion에 저장할 수 있다. 요구사항의 기준 문서는 `PRD.md`(한국어)이며, 현재는 `create-next-app` 기본 템플릿만 있고 앱 코드는 아직 없다.

## 명령어

```
npm run dev     # 개발 서버
npm run build   # 프로덕션 빌드
npm run lint    # eslint (flat config: eslint.config.mjs)
```

테스트 러너는 아직 설정되어 있지 않다.

## 기술 스택

- Next.js 16.4 (App Router) / React 19.3 / TypeScript / Tailwind v4, 소스는 `src/app/`, 임포트 별칭 `@/*` → `src/*`
- 인증: Clerk
- DB: Neon (PostgreSQL) + Drizzle ORM
- 번역/요약/분류: Claude API
- Notion 저장: Notion MCP 서버 (Next.js 서버에서 MCP 클라이언트로 연결)

### Next.js 주의사항

- `AGENTS.md`에 따라 코드를 쓰기 전에 `node_modules/next/dist/docs/`의 관련 가이드를 먼저 읽을 것 (기존 지식과 API가 다를 수 있음).
- `next.config.ts`에서 `cacheComponents`와 `partialPrefetching`이 켜져 있어 데이터 페칭/캐싱 규칙이 기존 App Router와 다르다.
- Tailwind는 `postcss`가 아니라 `next.config.ts`의 `turbopack.rules`(`@tailwindcss/turbopack` 로더)로 연결된다.

## 뉴스 소스 (RSS)

- TechCrunch AI: `https://techcrunch.com/category/artificial-intelligence/feed/`
- The Verge AI: `https://www.theverge.com/rss/ai-artificial-intelligence/index.xml`
- TechCrunch 주소는 원래 전달받은 값에 오타(`artificial-interlligence`)가 있어 정정한 것이다. 구현 시 실제 응답을 확인할 것.

## 기능 요구사항 요약

- **로그인:** 모든 페이지와 API는 Clerk 로그인 사용자만 접근 가능. 비로그인 시 로그인 화면으로 이동.
- **뉴스 가져오기:** 버튼 클릭 시에만 수집 (자동 수집/크론 없음). 두 피드를 읽어 URL 기준 중복 제거 → 새 기사만 Claude로 제목 번역·내용 요약·카테고리 분류 → DB 저장 → 목록 갱신. 진행 중 로딩 상태와 실패 시 오류 메시지를 표시.
- **뉴스 카드:** 한국어 제목, 한국어 요약, 출처, 발행일, 카테고리 배지, 원문 링크, 'Notion 저장' 버튼.
- **카테고리:** 자동 분류, 필터('전체' 포함), 언제든 추가·수정·삭제 가능. 카테고리별 설명이 분류 기준으로 쓰인다. 삭제 시 해당 뉴스는 '기타'로 이동. 변경 후 기존 뉴스를 다시 분류하는 '재분류' 제공. 초기 카테고리(안): 모델·연구 / 제품·서비스 / 투자·비즈니스 / 규제·정책 / 기타.
- **Notion 저장:** 카드의 버튼으로 1건 저장. 저장 항목은 제목(한/원문), 요약, 카테고리, 출처, 원문 URL, 발행일. 저장 후 '저장됨' 표시 및 중복 저장 방지.

## 데이터 모델 (Drizzle + Neon)

- `articles`: id, url(unique), source, originalTitle, titleKo, summaryKo, publishedAt, createdAt
- `categories`: id, userId, name, description, createdAt
- `user_articles`: userId, articleId, categoryId, notionPageId(nullable)

기사는 전 사용자 공용으로 한 번만 저장하고, 카테고리·분류 결과·Notion 저장 여부는 사용자(Clerk `userId`)별로 관리한다. 이 분리가 중복 제거와 재처리 방지(비용 절감)의 핵심이다.

## 화면 구성

- 로그인 화면 (Clerk)
- 메인: 상단 '뉴스 가져오기' 버튼 + 카테고리 필터 + 뉴스 카드 목록
- 카테고리 관리: 목록, 추가/수정/삭제, 재분류 실행

## 비기능 요구사항

- 모든 UI 문구와 요약은 한국어.
- API 키(Claude, Notion, Clerk, DB)는 환경변수로만 관리.
- Claude 응답은 JSON으로 받고, 파싱 실패 시 재시도하며 그래도 실패하면 '기타'로 분류.
- 이미 처리한 기사는 재처리하지 않는다 (API 비용 절감).

## 구현 단계

PRD §9 순서를 따른다: (1) Next.js 초기화 + Clerk 로그인 → (2) Neon + Drizzle 스키마/마이그레이션 → (3) RSS 수집 + Claude 처리 + '뉴스 가져오기' → (4) 카드 UI + 카테고리 필터 → (5) 카테고리 CRUD + 재분류 → (6) Notion MCP 저장 → (7) 환경변수 정리 및 배포. 현재 1단계의 Next.js 초기화만 끝난 상태다.

## 검증 항목

- RSS 2건 파싱 및 중복 제거 확인
- 비로그인 접근 차단 확인
- 카테고리 CRUD 후 필터 반영 확인
- Notion에 실제 페이지가 생성되는지 확인

## 미결정 사항

관련 단계를 구현하기 전에 사용자에게 확인할 것.

- Notion 저장 대상(데이터베이스 vs 페이지)과 MCP 인증 방식
- 기사 요약에 RSS 본문만 쓸지, 원문 페이지까지 가져올지
- 배포 환경 (예: Vercel)
