import { db } from "./index";
import { articles, categories, userArticles } from "./schema";

// 시드 데이터를 연결할 Clerk userId. 다른 계정으로 확인하려면 이 값을 바꾼다.
const userId = "user_3Kts22dmmxoILGoqV4BicEB00FA";

const categoryRows = [
  { name: "모델·연구", description: "새로운 AI 모델 공개, 벤치마크, 연구 논문" },
  { name: "제품·서비스", description: "AI 기능이 들어간 제품·앱·서비스 출시와 업데이트" },
  { name: "투자·비즈니스", description: "투자 유치, 인수합병, 실적, 기업 전략" },
  { name: "규제·정책", description: "정부 규제, 법안, 저작권·안전 관련 정책" },
  { name: "기타", description: "위 분류에 맞지 않는 뉴스" },
];

const articleRows = [
  {
    category: "모델·연구",
    url: "https://techcrunch.com/2026/10/14/example-lab-releases-open-reasoning-model/",
    source: "TechCrunch AI",
    originalTitle: "Example Lab releases open-weight reasoning model that rivals closed rivals",
    titleKo: "예시 연구소, 폐쇄형 모델에 견줄 오픈 웨이트 추론 모델 공개",
    summaryKo:
      "예시 연구소가 가중치를 공개한 추론 특화 모델을 내놓았다. 수학·코딩 벤치마크에서 상용 모델에 근접한 점수를 기록했고, 상업적 이용도 허용된다. 연구자들은 소규모 팀도 고성능 모델을 직접 운영할 수 있게 됐다고 평가한다.",
    publishedAt: new Date("2026-10-14T13:30:00Z"),
  },
  {
    category: "제품·서비스",
    url: "https://www.theverge.com/2026/10/15/example-ai-assistant-adds-memory",
    source: "The Verge AI",
    originalTitle: "Example's AI assistant now remembers your past conversations across devices",
    titleKo: "예시 AI 비서, 기기 간 과거 대화를 기억하는 기능 추가",
    summaryKo:
      "예시 사의 AI 비서가 스마트폰·PC·스마트워치에서 이전 대화 내용을 이어서 기억한다. 사용자가 기억 항목을 직접 보고 삭제할 수 있으며 기본값은 꺼짐이다. 이번 주부터 유료 구독자에게 먼저 제공된다.",
    publishedAt: new Date("2026-10-15T16:00:00Z"),
  },
  {
    category: "투자·비즈니스",
    url: "https://techcrunch.com/2026/10/16/example-ai-startup-raises-500m-series-c/",
    source: "TechCrunch AI",
    originalTitle: "AI infrastructure startup Example Compute raises $500M Series C at $6B valuation",
    titleKo: "AI 인프라 스타트업 예시 컴퓨트, 기업가치 60억 달러에 시리즈 C 5억 달러 유치",
    summaryKo:
      "GPU 클라우드를 운영하는 예시 컴퓨트가 시리즈 C에서 5억 달러를 모았다. 조달 자금은 데이터센터 확충과 추론 전용 칩 도입에 쓸 계획이다. 최근 1년간 매출이 세 배 늘었다고 밝혔다.",
    publishedAt: new Date("2026-10-16T09:15:00Z"),
  },
  {
    category: "규제·정책",
    url: "https://www.theverge.com/2026/10/17/example-region-ai-safety-law-vote",
    source: "The Verge AI",
    originalTitle: "Lawmakers advance bill requiring safety testing for frontier AI models",
    titleKo: "의회, 첨단 AI 모델 안전성 시험 의무화 법안 통과 절차 진행",
    summaryKo:
      "대형 AI 모델 개발사에 출시 전 안전성 시험과 결과 보고를 의무화하는 법안이 상임위를 통과했다. 위반 시 매출 일정 비율의 과징금이 부과된다. 업계는 혁신을 늦출 수 있다며 우려를 나타냈다.",
    publishedAt: new Date("2026-10-17T11:45:00Z"),
  },
  {
    category: "기타",
    url: "https://techcrunch.com/2026/10/18/example-ai-conference-draws-record-crowd/",
    source: "TechCrunch AI",
    originalTitle: "Record crowds at this year's AI developer conference signal a shift in hiring",
    titleKo: "올해 AI 개발자 콘퍼런스 역대 최대 인파, 채용 흐름 변화 신호",
    summaryKo:
      "올해 AI 개발자 콘퍼런스에 역대 최대 인원이 몰렸다. 현장에서는 모델 개발보다 AI를 제품에 붙이는 엔지니어 수요가 커졌다는 이야기가 많았다. 참가 기업들은 신입 채용 규모를 늘리겠다고 밝혔다.",
    publishedAt: new Date("2026-10-18T08:00:00Z"),
  },
];

async function main() {
  const insertedCategories = await db
    .insert(categories)
    .values(categoryRows.map((c) => ({ ...c, userId })))
    .returning();
  const categoryIdByName = new Map(insertedCategories.map((c) => [c.name, c.id]));

  const insertedArticles = await db
    .insert(articles)
    .values(articleRows.map(({ category: _category, ...a }) => a))
    .onConflictDoNothing()
    .returning();
  const articleIdByUrl = new Map(insertedArticles.map((a) => [a.url, a.id]));

  await db.insert(userArticles).values(
    articleRows.flatMap((a) => {
      const articleId = articleIdByUrl.get(a.url);
      return articleId
        ? [{ userId, articleId, categoryId: categoryIdByName.get(a.category)! }]
        : [];
    }),
  );

  console.log(
    `categories ${insertedCategories.length}, articles ${insertedArticles.length}`,
  );
}

main();
