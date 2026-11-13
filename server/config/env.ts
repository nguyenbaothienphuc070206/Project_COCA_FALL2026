/**
 * Tính năng: Quản lý cấu hình môi trường và khóa bí mật (Secrets) phía máy chủ cho cả môi trường phát triển và sản xuất (Phase 11).
 * Trường hợp sử dụng:
 * - Đọc SITE_URL, NODE_ENV, PORT, GEMINI_API_KEY, GEMINI_MODEL, GOOGLE_BOOKS_API_KEY, OPENLIBRARY_CONTACT_EMAIL, MOCK_MODE, EVAL_ENABLED, DAILY_GEMINI_CALL_BUDGET, EVAL_ADMIN_TOKEN, BOT_PROTECTION_PROVIDER, CORS_ALLOWED_ORIGINS, TRUST_PROXY_HOPS.
 * - Trong môi trường sản xuất (NODE_ENV=production): mặc định MOCK_MODE=false, EVAL_ENABLED=false, lắng nghe trên biến PORT, và hỗ trợ kiểm tra Fail-Fast khi khởi động (assertProductionStartupEnv) nếu thiếu khóa bắt buộc.
 */

import { AI_CONFIG } from '@/src/config/constants';

export type BotProtectionProvider = 'off' | 'turnstile' | 'hcaptcha';

export interface ServerEnvironmentConfig {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
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
  shutdownTimeoutMs: number;
  missingSecretWarnings: string[];
}

let hasLoggedStartupWarnings = false;

/**
 * Đọc biến môi trường máy chủ và trả về danh sách cảnh báo rõ ràng nếu thiếu các khóa cấu hình.
 * @param envSource - Nguồn biến môi trường (mặc định process.env)
 * @returns Cấu hình máy chủ đã kiểm tra
 */
export function getServerEnv(
  envSource: NodeJS.ProcessEnv = process.env,
): ServerEnvironmentConfig {
  const rawNodeEnv = (envSource.NODE_ENV || 'development').trim().toLowerCase();
  const nodeEnv: 'development' | 'production' | 'test' =
    rawNodeEnv === 'production'
      ? 'production'
      : rawNodeEnv === 'test'
        ? 'test'
        : 'development';

  const parsedPort = Number.parseInt(envSource.PORT || '', 10);
  const port =
    Number.isFinite(parsedPort) && parsedPort > 0 && parsedPort <= 65535
      ? parsedPort
      : 3000;

  const rawGeminiKey = (envSource.GEMINI_API_KEY || '').trim();
  const isPlaceholderGeminiKey =
    !rawGeminiKey || rawGeminiKey === 'MY_GEMINI_API_KEY';
  const geminiApiKey = isPlaceholderGeminiKey ? '' : rawGeminiKey;

  const geminiModel = (
    envSource.GEMINI_MODEL || AI_CONFIG.defaultModel
  ).trim();
  const googleBooksApiKey = (envSource.GOOGLE_BOOKS_API_KEY || '').trim();
  const openLibraryContactEmail = (
    envSource.OPENLIBRARY_CONTACT_EMAIL || ''
  ).trim();

  // Trong môi trường production, mặc định MOCK_MODE=false trừ khi được bật tường minh
  const mockModeEnv =
    (envSource.MOCK_MODE || 'false').trim().toLowerCase() === 'true';

  // Trong môi trường production, mặc định EVAL_ENABLED=false trừ khi được bật tường minh ("true" hoặc "1")
  const defaultEvalFlag = nodeEnv === 'production' ? 'false' : 'true';
  const rawEvalFlag = (envSource.EVAL_ENABLED ?? defaultEvalFlag)
    .trim()
    .toLowerCase();
  const evalEnabled = rawEvalFlag === 'true' || rawEvalFlag === '1';
  const evalAdminToken = (envSource.EVAL_ADMIN_TOKEN || '').trim();

  const parsedRateLimit = Number.parseInt(
    envSource.RATE_LIMIT_PER_MINUTE || '',
    10,
  );
  const rateLimitPerMinute =
    Number.isFinite(parsedRateLimit) && parsedRateLimit > 0
      ? parsedRateLimit
      : AI_CONFIG.defaultRateLimitPerMinute;

  const parsedGlobalRateLimit = Number.parseInt(
    envSource.GLOBAL_RATE_LIMIT_PER_MINUTE || '',
    10,
  );
  const globalRateLimitPerMinute =
    Number.isFinite(parsedGlobalRateLimit) && parsedGlobalRateLimit > 0
      ? parsedGlobalRateLimit
      : 60;

  const parsedDailyBudget = Number.parseInt(
    envSource.DAILY_GEMINI_CALL_BUDGET || '',
    10,
  );
  const dailyGeminiCallBudget =
    Number.isFinite(parsedDailyBudget) && parsedDailyBudget > 0
      ? parsedDailyBudget
      : 250;

  const parsedTrustHops = Number.parseInt(envSource.TRUST_PROXY_HOPS || '', 10);
  const trustProxyHops =
    Number.isFinite(parsedTrustHops) && parsedTrustHops >= 0
      ? parsedTrustHops
      : 1;

  const corsAllowedOrigins = (envSource.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const rawBotProvider = (envSource.BOT_PROTECTION_PROVIDER || 'off')
    .trim()
    .toLowerCase();
  const botProtectionProvider: BotProtectionProvider =
    rawBotProvider === 'turnstile' || rawBotProvider === 'hcaptcha'
      ? rawBotProvider
      : 'off';
  const botProtectionSecretKey = (
    envSource.BOT_PROTECTION_SECRET_KEY || ''
  ).trim();

  const enforceProductionCspFrameAncestors =
    (envSource.ENFORCE_PRODUCTION_CSP_FRAME_ANCESTORS || '')
      .trim()
      .toLowerCase() === 'true';

  const rawSiteUrl = (
    envSource.SITE_URL ||
    envSource.APP_URL ||
    'http://localhost:3000'
  )
    .trim()
    .replace(/\/+$/, '');
  const siteUrl =
    rawSiteUrl.startsWith('http://') || rawSiteUrl.startsWith('https://')
      ? rawSiteUrl
      : 'http://localhost:3000';

  const parsedShutdownTimeout = Number.parseInt(
    envSource.SHUTDOWN_TIMEOUT_MS || '',
    10,
  );
  const shutdownTimeoutMs =
    Number.isFinite(parsedShutdownTimeout) && parsedShutdownTimeout >= 1000
      ? parsedShutdownTimeout
      : 10000;

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

  if (
    envSource === process.env &&
    !hasLoggedStartupWarnings &&
    missingSecretWarnings.length > 0
  ) {
    hasLoggedStartupWarnings = true;
    for (const warning of missingSecretWarnings) {
      console.warn(`[WARN][ShelfPath Env] ${warning}`);
    }
  }

  return {
    nodeEnv,
    port,
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
    shutdownTimeoutMs,
    missingSecretWarnings,
  };
}

/**
 * Kiểm tra Fail-Fast khi khởi động máy chủ ở chế độ Production (`NODE_ENV=production` và `MOCK_MODE=false`).
 * Nếu thiếu khóa bí mật bắt buộc (`GEMINI_API_KEY`, hoặc `BOT_PROTECTION_SECRET_KEY` khi bật Bot Challenge),
 * ném lỗi rõ ràng ngay khi khởi động để không chạy một container sản xuất bị hỏng ngầm.
 */
export function assertProductionStartupEnv(
  envSource: NodeJS.ProcessEnv = process.env,
): ServerEnvironmentConfig {
  const cfg = getServerEnv(envSource);

  if (cfg.nodeEnv === 'production' && !cfg.mockModeEnv) {
    const fatalErrors: string[] = [];

    if (!cfg.geminiApiKey) {
      fatalErrors.push(
        'Missing required secret GEMINI_API_KEY in production (NODE_ENV=production, MOCK_MODE=false). Add GEMINI_API_KEY in Google AI Studio Secrets or Cloud Run Secret Manager before starting the server.',
      );
    }

    if (
      cfg.botProtectionProvider !== 'off' &&
      !cfg.botProtectionSecretKey
    ) {
      fatalErrors.push(
        `Missing required secret BOT_PROTECTION_SECRET_KEY while BOT_PROTECTION_PROVIDER="${cfg.botProtectionProvider}".`,
      );
    }

    if (cfg.evalEnabled && !cfg.evalAdminToken) {
      fatalErrors.push(
        'EVAL_ENABLED=true in production requires a strong EVAL_ADMIN_TOKEN secret to guard /api/eval/*.',
      );
    }

    if (fatalErrors.length > 0) {
      const message = `[FATAL][STARTUP_SECRET_CHECK_FAILED] ShelfPath refused to start in production:\n- ${fatalErrors.join('\n- ')}`;
      throw new Error(message);
    }
  }

  return cfg;
}
