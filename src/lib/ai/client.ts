import Anthropic from "@anthropic-ai/sdk";
import type { z } from "zod";

// 번역·요약·분류에 쓰는 모델. 품질이 아쉬우면 여기서 바꾼다.
export const TRANSLATE_MODEL = "claude-haiku-5-5";
export const CLASSIFY_MODEL = "claude-haiku-5-5";

const client = new Anthropic();

// 코드 펜스나 앞뒤 설명이 섞여 와도 JSON 본문만 꺼낸다.
function extractJson(raw: string): string {
  const start = raw.search(/[[{]/);
  const end = Math.max(raw.lastIndexOf("]"), raw.lastIndexOf("}"));
  return start >= 0 && end > start ? raw.slice(start, end + 1) : raw;
}

// Claude에게 JSON만 답하게 하고 zod로 검증한다. 파싱·검증에 실패하면 한 번 더 시도한다.
export async function callJson<T>(options: {
  model: string;
  system: string;
  user: string;
  schema: z.ZodType<T>;
  maxTokens: number;
}): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await client.messages.create({
      model: options.model,
      max_tokens: options.maxTokens,
      system: options.system,
      messages: [{ role: "user", content: options.user }],
    });
    const raw = res.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("");
    try {
      return options.schema.parse(JSON.parse(extractJson(raw)));
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}
