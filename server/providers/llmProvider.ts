/**
 * Tính năng: Adapter LLMProvider đóng gói SDK @google/genai phía máy chủ kèm Ngân sách gọi Gemini hàng ngày (Daily Global Budget), Cầu dao ngắt mạch (Circuit Breaker), timeout, thử lại (retry exponential backoff) và log mức info không chứa dữ liệu cá nhân/khóa bí mật.
 * Trường hợp sử dụng: Thực thi mọi lệnh gọi Gemini ở Stage 1 (Query Understanding), Stage 2 (Search Grounding), Stage 3 (Candidate Extraction), Stage 5/6 (Explanations) và Phase 4 (Refinement).
 */

import { GoogleGenAI, Schema } from '@google/genai';
import { getServerEnv } from '../config/env';
import { AI_CONFIG } from '@/src/config/constants';
import {
  globalGeminiBudgetCircuitBreaker,
  redactSecretsInLog,
} from '../security/securityControls';

export interface StructuredLLMRequest {
  operationName: string;
  prompt: string;
  systemInstruction?: string;
  responseSchema: Schema;
  signal?: AbortSignal;
}

export interface LLMProvider {
  generateStructuredJson(req: StructuredLLMRequest): Promise<string>;
}

/**
 * Tạo đối tượng GoogleGenAI dùng GEMINI_API_KEY phía server và gắn header User-Agent: aistudio-build.
 * @returns Instance GoogleGenAI
 */
export function createGenAIClient(): GoogleGenAI {
  const { geminiApiKey } = getServerEnv();
  if (!geminiApiKey) {
    throw new Error('MISSING_GEMINI_API_KEY');
  }
  return new GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      timeout: 8000,
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Bọc một Promise với bộ đếm thời gian chờ (timeout) cứng để tránh SDK giữ kết nối quá lâu khi chạm ngưỡng 429.
 */
export async function withHardTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`TIMEOUT: ${label} exceeded ${timeoutMs}ms`));
    }, timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Cài đặt LLMProvider sử dụng Gemini API chính thức kèm kiểm tra Ngân sách hàng ngày và Cầu dao bảo vệ.
 */
export class GeminiLLMProvider implements LLMProvider {
  async generateStructuredJson(req: StructuredLLMRequest): Promise<string> {
    const budgetCheck = globalGeminiBudgetCircuitBreaker.consumeCallSlot();
    if (!budgetCheck.allowed) {
      throw new Error(budgetCheck.reason || 'DAILY_BUDGET_EXHAUSTED');
    }

    const { geminiModel } = getServerEnv();
    const ai = createGenAIClient();
    let lastError: unknown = null;

    for (let attempt = 0; attempt <= AI_CONFIG.maxRetries; attempt++) {
      if (req.signal?.aborted) {
        throw new Error('ABORTED');
      }
      const startedAt = Date.now();
      try {
        const response = await withHardTimeout(
          ai.models.generateContent({
            model: geminiModel,
            contents: req.prompt,
            config: {
              systemInstruction: req.systemInstruction,
              responseMimeType: 'application/json',
              responseSchema: req.responseSchema,
            },
          }),
          8000,
          req.operationName,
        );

        const text = (response.text ?? '').trim();
        const elapsedMs = Date.now() - startedAt;
        globalGeminiBudgetCircuitBreaker.recordSuccess();
        console.info(
          `[INFO][GeminiLLMProvider] fn=${req.operationName} model=${geminiModel} inputLen=${req.prompt.length} timeMs=${elapsedMs} status=success attempt=${attempt + 1}`,
        );
        return text;
      } catch (err) {
        lastError = err;
        const elapsedMs = Date.now() - startedAt;
        const rawErrMsg = err instanceof Error ? err.message : String(err);
        const safeErrMsg = redactSecretsInLog(rawErrMsg).slice(0, 120);
        console.info(
          `[INFO][GeminiLLMProvider] fn=${req.operationName} model=${geminiModel} inputLen=${req.prompt.length} timeMs=${elapsedMs} status=error attempt=${attempt + 1}`,
        );
        // Nếu chạm giới hạn Quota 429 RESOURCE_EXHAUSTED, ghi nhận lỗi vào cầu dao và chuyển ngay sang phương án dự phòng
        if (
          safeErrMsg.includes('429') ||
          safeErrMsg.includes('RESOURCE_EXHAUSTED')
        ) {
          globalGeminiBudgetCircuitBreaker.recordFailure();
          break;
        }
        if (attempt < AI_CONFIG.maxRetries) {
          const backoffMs = 450 * Math.pow(2, attempt);
          await new Promise((r) => setTimeout(r, backoffMs));
        } else {
          globalGeminiBudgetCircuitBreaker.recordFailure();
        }
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error(`LLM call ${req.operationName} failed after retries`);
  }
}

export const defaultLLMProvider = new GeminiLLMProvider();
