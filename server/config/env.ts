/**
 * Tính năng: Quản lý cấu hình môi trường và khóa bí mật (Secrets) phía máy chủ.
 * Trường hợp sử dụng: Đọc GEMINI_API_KEY, GEMINI_MODEL, GOOGLE_BOOKS_API_KEY, OPENLIBRARY_CONTACT_EMAIL, MOCK_MODE, DAILY_GEMINI_CALL_BUDGET, EVAL_ADMIN_TOKEN, BOT_PROTECTION_PROVIDER, CORS_ALLOWED_ORIGINS, TRUST_PROXY_HOPS mà không bao giờ ghi cứng khóa hoặc làm sập server khi thiếu khóa.
 */

import { AI_CONFIG } from '@/src/config/constants';

export type BotProtectionProvider = 'off' | 'turnstile' | 'hcaptcha';

export interface ServerEnvironmentConfig {
  geminiApiKey: string;
  geminiModel: string;
  googleBooksApiKey: string;
  openLibraryContactEmail: string;
  mockModeEnv: boolean;
  evalEnabled: boolean;
  evalAdminToken: string;
  rateLimitPerMinute: number;
  globalRateLimitPerMinute: number;
  dailyGeminiCallBudget: number;
  trustProxyHops: number;
  corsAllowedOrigins: string[];
  botProtectionProvider: BotProtectionProvider;
  botProtectionSecretKey: string;
  enforceProductionCspFrameAncestors: boolean;
  siteUrl: string;
  missingSecretWarnings: string[];
}

let hasLoggedStartupWarnings = false;

/**
 * Đọc biến môi trường máy chủ và trả về danh sách cảnh báo rõ ràng nếu thiếu các khóa cấu hình.
 * @returns Cấu hình máy chủ đã kiểm tra
 */
export function getServerEnv(): ServerEnvironmentConfig {
  const rawGeminiKey = (process.env.GEMINI_API_KEY || '').trim();
  const isPlaceholderGeminiKey =
    !rawGeminiKey || rawGeminiKey === 'MY_GEMINI_API_KEY';
  const geminiApiKey = isPlaceholderGeminiKey ? '' : rawGeminiKey;

  const geminiModel = (
    process.env.GEMINI_MODEL || AI_CONFIG.defaultModel
  ).trim();
  const googleBooksApiKey = (process.env.GOOGLE_BOOKS_API_KEY || '').trim();
  const openLibraryContactEmail = (
    process.env.OPENLIBRARY_CONTACT_EMAIL || ''
  ).trim();
  const mockModeEnv =
    (process.env.MOCK_MODE || '').trim().toLowerCase() === 'true';
  const rawEvalFlag = (process.env.EVAL_ENABLED || 'true').trim().toLowerCase();
  const evalEnabled = rawEvalFlag !== 'false' && rawEvalFlag !== '0';
  const evalAdminToken = (process.env.EVAL_ADMIN_TOKEN || '').trim();

  const parsedRateLimit = Number.parseInt(
    process.env.RATE_LIMIT_PER_MINUTE || '',
    10,
  );
  const rateLimitPerMinute =
    Number.isFinite(parsedRateLimit) && parsedRateLimit > 0
      ? parsedRateLimit
      : AI_CONFIG.defaultRateLimitPerMinute;

  const parsedGlobalRateLimit = Number.parseInt(
    process.env.GLOBAL_RATE_LIMIT_PER_MINUTE || '',
    10,
  );
  const globalRateLimitPerMinute =
    Number.isFinite(parsedGlobalRateLimit) && parsedGlobalRateLimit > 0
      ? parsedGlobalRateLimit
      : 60;

  const parsedDailyBudget = Number.parseInt(
    process.env.DAILY_GEMINI_CALL_BUDGET || '',
    10,
  );
  const dailyGeminiCallBudget =
    Number.isFinite(parsedDailyBudget) && parsedDailyBudget > 0
      ? parsedDailyBudget
      : 250;

  const parsedTrustHops = Number.parseInt(
    process.env.TRUST_PROXY_HOPS || '',
    10,
  );
  const trustProxyHops =
    Number.isFinite(parsedTrustHops) && parsedTrustHops >= 0
      ? parsedTrustHops
      : 1;

  const corsAllowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const rawBotProvider = (process.env.BOT_PROTECTION_PROVIDER || 'off')
    .trim()
    .toLowerCase();
  const botProtectionProvider: BotProtectionProvider =
    rawBotProvider === 'turnstile' || rawBotProvider === 'hcaptcha'
      ? rawBotProvider
      : 'off';
  const botProtectionSecretKey = (
    process.env.BOT_PROTECTION_SECRET_KEY || ''
  ).trim();

  const enforceProductionCspFrameAncestors =
    (process.env.ENFORCE_PRODUCTION_CSP_FRAME_ANCESTORS || '')
      .trim()
      .toLowerCase() === 'true';

  const rawSiteUrl = (
    process.env.SITE_URL ||
    process.env.APP_URL ||
    'http://localhost:3000'
  )
    .trim()
    .replace(/\/+$/, '');
  const siteUrl =
    rawSiteUrl.startsWith('http://') || rawSiteUrl.startsWith('https://')
      ? rawSiteUrl
      : 'http://localhost:3000';

  const missingSecretWarnings: string[] = [];

  if (!geminiApiKey) {
    missingSecretWarnings.push(
      'Missing GEMINI_API_KEY: Add GEMINI_API_KEY in the Google AI Studio Secrets panel to enable live AI query understanding and search grounding.',
    );
  }
  if (!openLibraryContactEmail) {
    missingSecretWarnings.push(
      'Missing OPENLIBRARY_CONTACT_EMAIL: Open Library verifier is throttled to 1 req/s (polite anonymous tier). Add OPENLIBRARY_CONTACT_EMAIL in Secrets to unlock 3 req/s.',
    );
  }
  if (!googleBooksApiKey) {
    missingSecretWarnings.push(
      'Missing GOOGLE_BOOKS_API_KEY: Secondary verification and metadata enrichment on Google Books is disabled; falling back to Open Library only.',
    );
  }

  if (!hasLoggedStartupWarnings && missingSecretWarnings.length > 0) {
    hasLoggedStartupWarnings = true;
    for (const warning of missingSecretWarnings) {
      console.warn(`[WARN][ShelfPath Env] ${warning}`);
    }
  }

  return {
    geminiApiKey,
    geminiModel,
    googleBooksApiKey,
    openLibraryContactEmail,
    mockModeEnv,
    evalEnabled,
    evalAdminToken,
    rateLimitPerMinute,
    globalRateLimitPerMinute,
    dailyGeminiCallBudget,
    trustProxyHops,
    corsAllowedOrigins,
    botProtectionProvider,
    botProtectionSecretKey,
    enforceProductionCspFrameAncestors,
    siteUrl,
    missingSecretWarnings,
  };
}
