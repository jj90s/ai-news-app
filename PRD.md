# PRD: AI 뉴스 수집기

## 1. 개요
해외 AI 뉴스를 RSS로 수집하고, Claude AI가 한국어로 번역·요약·카테고리 분류하여 카드 형태로 보여주는 웹앱. 마음에 드는 뉴스는 Notion에 저장할 수 있다.

## 2. 목표
- 해외 AI 뉴스를 한국어로 빠르게 훑어볼 수 있다.
- 카테고리별로 원하는 주제만 골라 본다.
- 중요한 뉴스는 버튼 한 번으로 Notion에 보관한다.

## 3. 뉴스 소스
| 매체 | RSS URL |
|---|---|
| TechCrunch AI | https://techcrunch.com/category/artificial-intelligence/feed/ |
| The Verge AI | https://www.theverge.com/rss/ai-artificial-intelligence/index.xml |

> 참고: 원래 전달받은 TechCrunch 주소는 `artificial-interlligence`로 오타가 있어 `artificial-intelligence`로 정정함. 구현 시 실제 응답 확인 필요.

## 4. 기술 스택
- 프레임워크: Next.js (App Router)
- 인증: Clerk
- DB: Neon (PostgreSQL) + Drizzle ORM
- 번역/요약/분류: Claude API
- Notion 저장: Notion MCP 서버

## 5. 기능 요구사항
### 5.1 로그인
- 앱 실행 시 로그인하지 않았다면 로그인 화면으로 이동한다. (Clerk)
- 모든 페이지와 API는 로그인 사용자만 접근 가능하다.

### 5.2 뉴스 가져오기
- '뉴스 가져오기' 버튼 클릭 시에만 수집한다. (자동 수집 없음)
- 두 RSS 피드를 읽어 URL 기준으로 중복을 제거한다.
- 새 기사만 Claude API로 처리한다: 제목 번역, 내용 요약, 카테고리 분류.
- 처리 결과를 DB에 저장하고 목록을 갱신한다.
- 진행 중 로딩 상태와 실패 시 오류 메시지를 표시한다.

### 5.3 뉴스 카드
- 표시 항목: 한국어 제목, 한국어 요약, 출처, 발행일, 카테고리 배지, 원문 링크
- 'Notion 저장' 버튼 포함

### 5.4 카테고리
- 가져온 뉴스는 자동으로 카테고리별 분류된다.
- 카테고리 필터로 해당 카테고리의 뉴스만 볼 수 있다. ('전체' 포함)
- 카테고리는 언제든지 추가·수정·삭제할 수 있다.
- 카테고리마다 설명을 두어 분류 기준으로 사용한다.
- 카테고리 삭제 시 해당 뉴스는 '기타'로 이동한다.
- 카테고리 변경 후 기존 뉴스를 다시 분류하는 '재분류' 기능을 제공한다.
- 초기 카테고리(안): 모델·연구 / 제품·서비스 / 투자·비즈니스 / 규제·정책 / 기타

### 5.5 Notion 저장
- 카드의 'Notion 저장' 버튼으로 해당 뉴스 1건을 Notion에 저장한다.
- 저장 항목: 제목(한/원문), 요약, 카테고리, 출처, 원문 URL, 발행일
- 저장 후 카드에 '저장됨'을 표시하고 중복 저장을 막는다.
- Notion MCP 서버는 앱 서버(Next.js)에서 클라이언트로 연결한다.

## 6. 데이터 모델 (Drizzle + Neon)
- `articles`: id, url(unique), source, originalTitle, titleKo, summaryKo, publishedAt, createdAt
- `categories`: id, userId, name, description, createdAt
- `user_articles`: userId, articleId, categoryId, notionPageId(nullable)
- 기사는 공용으로 한 번만 저장하고, 카테고리와 분류 결과, Notion 저장 여부는 사용자별로 관리한다.

## 7. 화면 구성
- 로그인 화면 (Clerk)
- 메인: 상단 '뉴스 가져오기' 버튼 + 카테고리 필터 + 뉴스 카드 목록
- 카테고리 관리: 목록, 추가/수정/삭제, 재분류 실행

## 8. 비기능 요구사항
- 모든 UI 문구와 요약은 한국어
- API 키(Claude, Notion, Clerk, DB)는 환경변수로만 관리
- Claude 응답은 JSON으로 받고, 파싱 실패 시 재시도하며 그래도 실패하면 '기타'로 분류
- API 비용 절감을 위해 이미 처리한 기사는 재처리하지 않음

## 9. 구현 단계
1. Next.js 초기화 + Clerk 로그인
2. Neon + Drizzle 스키마/마이그레이션
3. RSS 수집 + Claude 처리 + '뉴스 가져오기'
4. 카드 UI + 카테고리 필터
5. 카테고리 CRUD + 재분류
6. Notion MCP 저장
7. 환경변수 정리 및 배포

## 10. 검증
- RSS 2건 파싱 및 중복 제거 확인
- 비로그인 접근 차단 확인
- 카테고리 CRUD 후 필터 반영 확인
- Notion에 실제 페이지가 생성되는지 확인

## 11. 미결정 사항
- Notion 저장 대상(데이터베이스 vs 페이지)과 MCP 인증 방식
- 기사 요약에 RSS 본문만 쓸지, 원문 페이지까지 가져올지
- 배포 환경 (예: Vercel)
