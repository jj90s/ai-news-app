import { z } from "zod";
import { callJson, TRANSLATE_MODEL } from "./client";

export type TranslateInput = {
  id: number;
  originalTitle: string;
  content: string;
};

export type Translated = { id: number; titleKo: string; summaryKo: string };

const BATCH_SIZE = 5;
const CONCURRENCY = 3;

const resultSchema = z.array(
  z.object({
    id: z.number(),
    titleKo: z.string().min(1),
    summaryKo: z.string().min(1),
  }),
);

const SYSTEM = `당신은 해외 AI 뉴스를 한국어로 옮기는 편집자입니다.
각 기사에 대해 다음을 작성하세요.
- titleKo: 자연스러운 한국어 제목 번역
- summaryKo: 핵심만 담은 2~3문장 한국어 요약 (본문에 없는 내용은 추가하지 않음)
회사명·제품명·모델명 같은 고유명사는 원문 표기를 유지합니다.
반드시 JSON 배열만 답하세요. 설명이나 코드 펜스는 쓰지 않습니다.
형식: [{"id": 숫자, "titleKo": "...", "summaryKo": "..."}]
입력으로 받은 모든 id를 빠짐없이 포함하세요.`;

async function translateBatch(items: TranslateInput[]): Promise<Translated[]> {
  const user = JSON.stringify(
    items.map((i) => ({
      id: i.id,
      title: i.originalTitle,
      // 본문이 비어 있으면 제목만으로 요약하도록 안내한다.
      content: i.content || "(본문 없음: 제목만으로 요약)",
    })),
  );
  const result = await callJson({
    model: TRANSLATE_MODEL,
    system: SYSTEM,
    user,
    schema: resultSchema,
    maxTokens: 2000,
  });
  // 요청하지 않은 id는 버린다.
  const ids = new Set(items.map((i) => i.id));
  return result.filter((r) => ids.has(r.id));
}

// 기사들을 5건씩 묶어 번역·요약한다. 실패한 묶음은 건너뛰고 성공분만 돌려준다.
export async function translateAndSummarize(
  items: TranslateInput[],
): Promise<{ translated: Translated[]; failed: number }> {
  const batches: TranslateInput[][] = [];
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    batches.push(items.slice(i, i + BATCH_SIZE));
  }

  const translated: Translated[] = [];
  let failed = 0;
  let next = 0;

  // 동시에 CONCURRENCY개까지만 호출한다.
  async function worker() {
    while (next < batches.length) {
      const batch = batches[next++];
      try {
        translated.push(...(await translateBatch(batch)));
      } catch (e) {
        console.error("translateBatch failed", e);
        failed += batch.length;
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  // 응답에서 빠진 기사도 실패로 센다.
  failed += items.length - failed - translated.length;
  return { translated, failed };
}
