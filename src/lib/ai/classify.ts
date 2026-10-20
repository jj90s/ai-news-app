import { z } from "zod";
import { CLASSIFY_MODEL, callJson } from "./client";

export type ClassifyInput = { id: number; titleKo: string; summaryKo: string };
export type ClassifyCategory = { id: number; name: string; description: string };

const BATCH_SIZE = 10;
const CONCURRENCY = 3;
const FALLBACK_NAME = "기타";

const resultSchema = z.array(z.object({ id: z.number(), category: z.string() }));

function buildSystem(categories: ClassifyCategory[]) {
  const list = categories
    .map((c) => `- ${c.name}${c.description ? `: ${c.description}` : ""}`)
    .join("\n");
  return `당신은 AI 뉴스를 카테고리로 분류합니다.
카테고리 목록과 분류 기준은 다음과 같습니다. 반드시 이 중 이름 하나만 고르세요.
${list}

어느 기준에도 맞지 않으면 "${FALLBACK_NAME}"을 고르세요.
반드시 JSON 배열만 답하세요. 설명이나 코드 펜스는 쓰지 않습니다.
형식: [{"id": 숫자, "category": "카테고리 이름"}]
입력으로 받은 모든 id를 빠짐없이 포함하세요.`;
}

// 분류 실패·알 수 없는 이름일 때 쓸 카테고리: '기타', 없으면 첫 번째 카테고리.
export function fallbackCategory(categories: ClassifyCategory[]) {
  return categories.find((c) => c.name === FALLBACK_NAME) ?? categories[0];
}

// 기사별로 카테고리 id를 돌려준다. 실패하거나 목록에 없는 이름이면 '기타'로 둔다.
export async function classifyArticles(
  items: ClassifyInput[],
  categories: ClassifyCategory[],
): Promise<Map<number, number>> {
  const fallback = fallbackCategory(categories);
  const byName = new Map(categories.map((c) => [c.name, c.id]));
  const result = new Map<number, number>(items.map((i) => [i.id, fallback.id]));
  const system = buildSystem(categories);

  const batches: ClassifyInput[][] = [];
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    batches.push(items.slice(i, i + BATCH_SIZE));
  }

  let next = 0;
  async function worker() {
    while (next < batches.length) {
      const batch = batches[next++];
      try {
        const rows = await callJson({
          model: CLASSIFY_MODEL,
          system,
          user: JSON.stringify(
            batch.map((i) => ({ id: i.id, title: i.titleKo, summary: i.summaryKo })),
          ),
          schema: resultSchema,
          maxTokens: 1000,
        });
        for (const row of rows) {
          const categoryId = byName.get(row.category);
          if (categoryId !== undefined && result.has(row.id)) {
            result.set(row.id, categoryId);
          }
        }
      } catch (e) {
        // 파싱 실패가 반복되면 해당 묶음은 '기타'로 남는다.
        console.error("classify batch failed", e);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return result;
}
