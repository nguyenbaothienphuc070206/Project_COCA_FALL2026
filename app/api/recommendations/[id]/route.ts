/**
 * Tính năng: REST API Endpoint GET /api/recommendations/[id] trả về trạng thái hiện tại của một bộ gợi ý theo đúng hợp đồng mục 6.
 * Trường hợp sử dụng: Cho phép client truy vấn hoặc đồng bộ lại trạng thái của một phiên gợi ý theo ID.
 */

import { NextRequest } from 'next/server';
import { getRecommendationSetById } from '@/server/store/recommendationStore';
import {
  apiJsonError,
  apiJsonSuccess,
  resolveRequestId,
} from '@/server/http/apiResponse';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const requestId = resolveRequestId(req);
  const { id } = await context.params;
  const recSet = getRecommendationSetById(id);

  if (!recSet) {
    return apiJsonError({
      code: 'RECOMMENDATION_SET_NOT_FOUND',
      message: `Recommendation set '${id}' was not found.`,
      status: 404,
      requestId,
    });
  }

  return apiJsonSuccess(recSet, { status: 200, requestId });
}
