/**
 * Tính năng: Barrel re-export sang Typed API Client tập trung (/src/lib/api).
 * Trường hợp sử dụng: Đảm bảo toàn bộ lệnh gọi mạng của trình duyệt đều đi qua /src/lib/api mà không còn lệnh fetch rời rạc nào.
 */

export {
  ApiClientError,
  RateLimitError,
  SourceOutageError,
  type StreamRecommendationsCallbacks,
  createRecommendationSet,
  dismissRecommendationBook,
  fetchBookVerificationDetail,
  fetchBookVietnameseEditions,
  fetchEvalLabOverview,
  fetchEvalLabRunById,
  fetchRecommendationById,
  fetchServerStatus,
  importEvalLabRun,
  recordEvalLabBookSave,
  refineRecommendations,
  startEvalLabRun,
  streamRecommendations,
  submitEvalLabRubric,
} from '@/src/lib/api';
