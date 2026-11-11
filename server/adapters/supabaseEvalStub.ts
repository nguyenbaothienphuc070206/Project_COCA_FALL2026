/**
 * Tính năng: Adapter lưu trữ kết quả Phòng Thí nghiệm Đánh giá (Evaluation Lab Persistence Adapter) kèm bản mẫu tài liệu tích hợp Supabase (Supabase Persistence Stub).
 * Trường hợp sử dụng:
 * - Lưu trữ các phiên chạy đánh giá (EvalRunRecord) và phiếu chấm Rubric của người kiểm thử trong bộ nhớ máy chủ (InMemoryEvalPersistenceAdapter).
 * - Cung cấp SupabaseEvalPersistenceStub đã định nghĩa sẵn cấu trúc bảng PostgreSQL (`eval_runs`, `eval_rubric_ratings`) cho kiến trúc sản xuất (Production Architecture: Next.js + FastAPI + Supabase).
 */

import {
  EvalRunRecord,
  EvalTesterRubricSubmission,
} from '@/src/lib/evalMetrics';
import { FirestoreBackedEvalRunStore } from '../persistence/firestoreStores';

export interface EvalPersistenceAdapter {
  saveRun(run: EvalRunRecord): Promise<void>;
  getRunById(runId: string): Promise<EvalRunRecord | undefined>;
  listRuns(): Promise<EvalRunRecord[]>;
  saveRubricSubmission(submission: EvalTesterRubricSubmission): Promise<void>;
}

/**
 * Cấu trúc bảng SQL chuẩn trên Supabase / PostgreSQL (dành cho môi trường Production):
 *
 * CREATE TABLE IF NOT EXISTS public.eval_runs (
 *   id TEXT PRIMARY KEY,
 *   status TEXT NOT NULL,
 *   mode TEXT NOT NULL,
 *   model_name TEXT NOT NULL,
 *   started_at_iso TIMESTAMPTZ NOT NULL,
 *   completed_at_iso TIMESTAMPTZ,
 *   payload JSONB NOT NULL
 * );
 *
 * CREATE TABLE IF NOT EXISTS public.eval_rubric_ratings (
 *   id TEXT PRIMARY KEY,
 *   run_id TEXT NOT NULL REFERENCES public.eval_runs(id) ON DELETE CASCADE,
 *   profile_id TEXT NOT NULL,
 *   config_id TEXT NOT NULL,
 *   was_blind_mode BOOLEAN NOT NULL DEFAULT FALSE,
 *   relevance SMALLINT NOT NULL CHECK (relevance BETWEEN 1 AND 5),
 *   level_fit SMALLINT NOT NULL CHECK (level_fit BETWEEN 1 AND 5),
 *   usefulness SMALLINT NOT NULL CHECK (usefulness BETWEEN 1 AND 5),
 *   notes TEXT,
 *   submitted_at_iso TIMESTAMPTZ NOT NULL DEFAULT NOW()
 * );
 */
export class SupabaseEvalPersistenceStub implements EvalPersistenceAdapter {
  private readonly supabaseUrl: string;
  private readonly fallbackMemory: InMemoryEvalPersistenceAdapter;

  constructor(
    supabaseUrl = process.env.SUPABASE_URL || '',
    fallbackMemory = new InMemoryEvalPersistenceAdapter(),
  ) {
    this.supabaseUrl = supabaseUrl;
    this.fallbackMemory = fallbackMemory;
  }

  async saveRun(run: EvalRunRecord): Promise<void> {
    // Trong bản mẫu AI Studio không kết nối cơ sở dữ liệu ngoài, tự động chuyển tiếp sang bộ nhớ máy chủ kèm hỗ trợ Xuất/Nhập JSON.
    await this.fallbackMemory.saveRun(run);
  }

  async getRunById(runId: string): Promise<EvalRunRecord | undefined> {
    return this.fallbackMemory.getRunById(runId);
  }

  async listRuns(): Promise<EvalRunRecord[]> {
    return this.fallbackMemory.listRuns();
  }

  async saveRubricSubmission(
    submission: EvalTesterRubricSubmission,
  ): Promise<void> {
    await this.fallbackMemory.saveRubricSubmission(submission);
  }

  public getConnectionStatus(): {
    adapter: 'supabase_stub_with_memory_fallback';
    configuredUrl: boolean;
    backend: 'firestore' | 'memory_fallback';
    configured: boolean;
    note: string;
  } {
    const fsStatus = getGlobalFirestoreEvalStore().getConnectionStatus();
    return {
      adapter: 'supabase_stub_with_memory_fallback',
      configuredUrl: Boolean(this.supabaseUrl),
      backend: fsStatus.backend,
      configured: fsStatus.configured,
      note: fsStatus.note,
    };
  }
}

const globalForEvalFirestore = globalThis as unknown as {
  __shelfPathFirestoreEvalStoreV6?: FirestoreBackedEvalRunStore;
};

export function getGlobalFirestoreEvalStore(): FirestoreBackedEvalRunStore {
  if (!globalForEvalFirestore.__shelfPathFirestoreEvalStoreV6) {
    globalForEvalFirestore.__shelfPathFirestoreEvalStoreV6 =
      new FirestoreBackedEvalRunStore();
  }
  return globalForEvalFirestore.__shelfPathFirestoreEvalStoreV6;
}

export class InMemoryEvalPersistenceAdapter implements EvalPersistenceAdapter {
  private readonly store = getGlobalFirestoreEvalStore();

  async saveRun(run: EvalRunRecord): Promise<void> {
    await this.store.saveRun(run);
  }

  async getRunById(runId: string): Promise<EvalRunRecord | undefined> {
    const found = await this.store.getRunById(runId);
    return found ?? undefined;
  }

  async listRuns(): Promise<EvalRunRecord[]> {
    return this.store.listRuns();
  }

  async saveRubricSubmission(
    submission: EvalTesterRubricSubmission,
  ): Promise<void> {
    const run = await this.store.getRunById(submission.runId);
    if (!run) return;
    run.rubricRatings.push(submission);
    await this.store.saveRun(run);
  }
}

export const globalEvalPersistence = new SupabaseEvalPersistenceStub();

