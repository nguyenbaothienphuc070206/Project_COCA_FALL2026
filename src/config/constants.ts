/**
 * Tính năng: Hằng số cấu hình hệ thống, tên model AI, ngưỡng xác thực (Verification Thresholds), giới hạn tần suất và chủ đề gợi ý.
 * Trường hợp sử dụng: Dùng chung cho cả client và server để đảm bảo tính nhất quán, không rải rác hằng số trong code.
 */

export const AI_CONFIG = {
  defaultModel: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  embeddingModel: process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-2-preview',
  maxRetries: 2,
  timeoutMs: 25000,
  maxCandidatesPerRequest: 20,
  maxExternalVerifyCallsPerRequest: 20,
  verificationConcurrency: 2,
  cacheTtlMs: 1000 * 60 * 30, // 30 minutes
  cacheMaxEntries: 250,
  defaultRateLimitPerMinute: 10,
} as const;

export const VERIFICATION_CONFIG = {
  minTitleSimilarity: 0.62,
  highConfidenceThreshold: 0.85,
  openLibraryIdentifiedIntervalMs: 340, // ~3 requests per second when OPENLIBRARY_CONTACT_EMAIL is set
  openLibraryAnonymousIntervalMs: 1000, // 1 request per second when email is missing
  externalFetchTimeoutMs: 8000,
} as const;

export interface TopicPreset {
  id: string;
  labelVi: string;
  labelEn: string;
  queryVi: string;
  queryEn: string;
}

export const SUGGESTED_TOPICS: readonly TopicPreset[] = [
  {
    id: 'machine-learning',
    labelVi: 'Học máy & Trí tuệ nhân tạo',
    labelEn: 'Machine Learning',
    queryVi: 'Học máy và trí tuệ nhân tạo',
    queryEn: 'Machine Learning',
  },
  {
    id: 'philosophy',
    labelVi: 'Triết học & Tư duy phản biện',
    labelEn: 'Philosophy',
    queryVi: 'Triết học nhập môn và tư duy phản biện',
    queryEn: 'Philosophy',
  },
  {
    id: 'personal-finance',
    labelVi: 'Tài chính cá nhân & Đầu tư',
    labelEn: 'Personal Finance',
    queryVi: 'Tài chính cá nhân và kinh tế học hành vi',
    queryEn: 'Personal Finance',
  },
  {
    id: 'distributed-systems',
    labelVi: 'Kiến trúc phần mềm & Hệ phân tán',
    labelEn: 'Software Architecture',
    queryVi: 'Thiết kế hệ thống phân tán và kiến trúc phần mềm',
    queryEn: 'Software Architecture',
  },
  {
    id: 'cognitive-psychology',
    labelVi: 'Tâm lý học nhận thức',
    labelEn: 'Cognitive Psychology',
    queryVi: 'Tâm lý học nhận thức và khoa học não bộ',
    queryEn: 'Cognitive Psychology',
  },
] as const;

export const STORAGE_KEYS = {
  locale: 'shelfpath_locale_v1',
  theme: 'shelfpath_theme_v1',
  preferences: 'shelfpath_prefs_v1',
  savedShelf: 'shelfpath_saved_shelf_v1',
  viewMode3D: 'shelfpath_3d_mode_v1',
  onboardingSeen: 'shelfpath_onboarding_seen_v1',
} as const;
