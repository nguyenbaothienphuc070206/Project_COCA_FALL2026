/**
 * Tính năng: Định nghĩa kiểu dữ liệu TypeScript và Zod schema cho sách, bản ghi xác thực, lộ trình, các bước pipeline và luồng sự kiện SSE.
 * Trường hợp sử dụng: Kiểm tra hợp lệ dữ liệu ở mọi ranh giới REST API, SSE stream và giữa 6 bước trong pipeline.
 */

import { z } from 'zod';

export const ReaderLevelSchema = z.enum(['beginner', 'intermediate', 'advanced']);
export type ReaderLevel = z.infer<typeof ReaderLevelSchema>;

export const BookLengthPreferenceSchema = z.enum(['any', 'short', 'medium', 'deep']);
export type BookLengthPreference = z.infer<typeof BookLengthPreferenceSchema>;

export const BookLanguagePreferenceSchema = z.enum(['any', 'en', 'vi']);
export type BookLanguagePreference = z.infer<typeof BookLanguagePreferenceSchema>;

export const VerificationSourceSchema = z.enum([
  'open_library',
  'google_books',
  'both',
]);
export type VerificationSource = z.infer<typeof VerificationSourceSchema>;

export const VerificationFailureReasonSchema = z.enum([
  'not_found',
  'author_mismatch',
  'low_title_similarity',
  'source_unavailable',
]);
export type VerificationFailureReason = z.infer<typeof VerificationFailureReasonSchema>;

export const ReadingStatusSchema = z.enum(['to_read', 'reading', 'done']);
export type ReadingStatus = z.infer<typeof ReadingStatusSchema>;

export const UserPreferencesSchema = z.object({
  topic: z.string().min(1).max(160),
  level: ReaderLevelSchema,
  length: BookLengthPreferenceSchema,
  language: BookLanguagePreferenceSchema,
  adventurousness: z.number().min(0).max(100),
});
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

// Stage 1: Query Understanding Output Schema
export const NormalizedQueryProfileSchema = z.object({
  topics: z.array(z.string().min(1)).min(1).max(5),
  level: ReaderLevelSchema,
  lengthPref: BookLengthPreferenceSchema,
  language: BookLanguagePreferenceSchema,
  adventurousness: z.number().min(0).max(100),
  searchQueries: z.array(z.string().min(2)).min(3).max(5),
});
export type NormalizedQueryProfile = z.infer<typeof NormalizedQueryProfileSchema>;

// Stage 2: Search Grounding Output Schema
export const GroundingChunkItemSchema = z.object({
  uri: z.string(),
  title: z.string(),
});
export type GroundingChunkItem = z.infer<typeof GroundingChunkItemSchema>;

// Stage 3: Candidate Extraction Schema
export const ExtractedCandidateSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  isbn: z.string().optional(),
  sourceUrl: z.string().optional(),
  whyFound: z.string().min(1),
});
export type ExtractedCandidate = z.infer<typeof ExtractedCandidateSchema>;

export const ExtractedCandidateListSchema = z.array(ExtractedCandidateSchema);

export const VerificationDetailSchema = z.object({
  status: z.literal('verified'),
  matchedSources: VerificationSourceSchema,
  matchedSourcesList: z.array(z.enum(['open_library', 'google_books'])).optional(),
  matchConfidence: z.number().min(0).max(1).optional(),
  normalizedQueryTitle: z.string(),
  normalizedMatchedTitle: z.string(),
  titleSimilarityScore: z.number().min(0).max(1),
  authorSurnameMatched: z.string(),
  openLibraryId: z.string().optional(),
  openLibraryUrl: z.string().url().optional(),
  googleBooksId: z.string().optional(),
  googleBooksUrl: z.string().url().optional(),
  isbn13: z.string().optional(),
  firstPublishYear: z.number().int().optional(),
  checkedAtIso: z.string(),
  fromCache: z.boolean().optional(),
});
export type VerificationDetail = z.infer<typeof VerificationDetailSchema>;

export const VietnameseEditionInfoSchema = z.object({
  available: z.boolean(),
  vietnameseTitle: z.string().optional(),
  publisherOrNoteVi: z.string().optional(),
  publisherOrNoteEn: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  sourceName: z.enum(['open_library', 'google_books']).optional(),
  checkedAtIso: z.string().optional(),
});
export type VietnameseEditionInfo = z.infer<typeof VietnameseEditionInfoSchema>;

export const BookDiffStatusSchema = z.enum([
  'moved_up',
  'moved_down',
  'new',
  'unchanged',
]);
export type BookDiffStatus = z.infer<typeof BookDiffStatusSchema>;

export const InterpretedRefinementChipSchema = z.object({
  id: z.string(),
  dimension: z.enum([
    'lengthDelta',
    'practicalVsTheory',
    'levelDelta',
    'emphasisTopic',
    'excludeAuthor',
  ]),
  value: z.string(),
  labelVi: z.string(),
  labelEn: z.string(),
});
export type InterpretedRefinementChip = z.infer<
  typeof InterpretedRefinementChipSchema
>;

export const RefinementAdjustmentSchema = z.object({
  lengthDelta: z.enum(['shorter', 'longer', 'none']),
  practicalVsTheory: z.enum(['more_practical', 'more_theoretical', 'balanced']),
  levelDelta: z.enum(['easier', 'harder', 'same']),
  emphasisTopics: z.array(z.string().min(1)).max(5),
  excludeAuthors: z.array(z.string().min(1)).max(5),
  chips: z.array(InterpretedRefinementChipSchema).optional(),
});
export type RefinementAdjustment = z.infer<typeof RefinementAdjustmentSchema>;

export const VerifiedBookSchema = z.object({
  id: z.string(),
  topicCategory: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  authors: z.array(z.string()).min(1),
  pageCount: z.number().int().positive(),
  language: z.enum(['en', 'vi', 'bilingual']),
  level: ReaderLevelSchema,
  roadmapStepOrder: z.number().int().positive(),
  roadmapStageLabelVi: z.string(),
  roadmapStageLabelEn: z.string(),
  roadmapStepReasonVi: z.string(),
  roadmapStepReasonEn: z.string(),
  shortDescriptionVi: z.string(),
  shortDescriptionEn: z.string(),
  matchReasonVi: z.string(),
  matchReasonEn: z.string(),
  coverColorHex: z.string(),
  verification: VerificationDetailSchema,
  vietnameseEdition: VietnameseEditionInfoSchema,
  relevanceScore: z.number().min(0).max(1),
  diversityBonus: z.number().min(0).max(1),
  groundingSourceUrl: z.string().optional(),
  diffStatus: BookDiffStatusSchema.optional(),
  previousStepOrder: z.number().int().positive().optional(),
  embeddingVector: z.array(z.number()).optional(),
});
export type VerifiedBook = z.infer<typeof VerifiedBookSchema>;

export const RejectedCandidateLogSchema = z.object({
  candidateTitle: z.string(),
  candidateAuthor: z.string(),
  failureReasonCode: VerificationFailureReasonSchema.optional(),
  reasonVi: z.string(),
  reasonEn: z.string(),
  timestampIso: z.string(),
});
export type RejectedCandidateLog = z.infer<typeof RejectedCandidateLogSchema>;

export const PipelineStageKeySchema = z.enum([
  'searching',
  'extracting',
  'verifying',
  'ranking',
  'building_path',
  'completed',
]);
export type PipelineStageKey = z.infer<typeof PipelineStageKeySchema>;

export const PipelineStatsSchema = z.object({
  candidatesFound: z.number().int().nonnegative(),
  candidatesVerified: z.number().int().nonnegative(),
  candidatesRemoved: z.number().int().nonnegative(),
  currentStage: PipelineStageKeySchema,
  queriesExecuted: z.array(z.string()).optional(),
  groundingSources: z.array(GroundingChunkItemSchema).optional(),
  warnings: z.array(z.string()).optional(),
  oneSourceDownWarning: z.string().optional(),
});
export type PipelineStats = z.infer<typeof PipelineStatsSchema>;

export const RecommendationSetSchema = z.object({
  id: z.string(),
  isSampleData: z.boolean(),
  preferences: UserPreferencesSchema,
  books: z.array(VerifiedBookSchema),
  rejectedCandidates: z.array(RejectedCandidateLogSchema),
  stats: PipelineStatsSchema,
  createdAtIso: z.string(),
  activeAdjustment: RefinementAdjustmentSchema.optional(),
});
export type RecommendationSet = z.infer<typeof RecommendationSetSchema>;

export interface SavedShelfItem {
  book: VerifiedBook;
  status: ReadingStatus;
  savedAtIso: string;
}

export type PipelineSSEEvent =
  | {
      type: 'stage';
      stage: PipelineStageKey;
      stats: PipelineStats;
      queries?: string[];
      warnings?: string[];
    }
  | {
      type: 'candidate_found';
      candidate: ExtractedCandidate;
      stats: PipelineStats;
    }
  | {
      type: 'book_verified';
      book: VerifiedBook;
      stats: PipelineStats;
    }
  | {
      type: 'book_removed';
      rejected: RejectedCandidateLog;
      stats: PipelineStats;
    }
  | {
      type: 'done';
      recommendationSet: RecommendationSet;
    }
  | {
      type: 'error';
      code: 'SOURCE_OUTAGE_FAIL_CLOSED' | 'RATE_LIMITED' | 'MISSING_GEMINI_KEY' | 'PIPELINE_ERROR';
      message: string;
      retryAfterMs?: number;
      warnings?: string[];
    };
