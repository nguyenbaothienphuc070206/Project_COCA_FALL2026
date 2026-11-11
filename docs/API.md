# ShelfPath REST API & Server-Sent Events (SSE) Contract (`v1`)

This document specifies the HTTP headers, Error Envelope, REST endpoints, and **Server-Sent Events (SSE)** protocol for **ShelfPath**. All schemas are strictly validated at runtime by `/src/lib/schemas/apiContract.ts` (Zod) and documented in `/openapi.yaml` (OpenAPI 3.1).

---

## 1. Standard Headers & Versioning

Every HTTP response from `/api/*` and `/healthz` returns:
- `X-API-Version: 1`
- `X-Request-Id: <string>` (propagated from the client's `X-Request-Id` request header if valid, or generated on the server as `req_<timestamp>_<random>`)

---

## 2. Standard Error Envelope

All non-2xx JSON responses use a single deterministic Error Envelope:

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded. Please wait 12 seconds before requesting another reading roadmap.",
    "requestId": "req_m9z8x7_4a2f1c",
    "retryAfterSeconds": 12
  }
}
```

### HTTP Status & Error Code Mapping

| HTTP Status | Error Code | Meaning & Client Behavior |
| :---: | :--- | :--- |
| `400` | `INVALID_JSON_BODY`, `INVALID_PREFERENCES`, `INVALID_REFINE_PAYLOAD`, `INVALID_DISMISS_PAYLOAD`, `INVALID_RUBRIC_VALUES`, `INVALID_SAVE_PAYLOAD`, `INVALID_IMPORT_RUN_FORMAT`, `UNKNOWN_ACTION` | Request validation failed against Zod schema. Client displays localized validation message. |
| `403` | `EVAL_DISABLED` | `/api/eval/*` was called while `EVAL_ENABLED=false`. |
| `404` | `RECOMMENDATION_SET_NOT_FOUND`, `SESSION_NOT_FOUND`, `BOOK_VERIFICATION_NOT_FOUND`, `EVAL_RUN_NOT_FOUND` | Requested resource ID does not exist or has expired. |
| `429` | `RATE_LIMITED` | Sliding-window per-IP rate limit exceeded (10 requests / 60s). Includes `Retry-After` HTTP header and `error.retryAfterSeconds`. |
| `500` | `PIPELINE_ERROR`, `REFINE_ERROR`, `DISMISS_ERROR`, `EDITION_LOOKUP_ERROR`, `INTERNAL_SERVER_ERROR` | Unexpected internal error. |
| `503` | `SOURCE_OUTAGE_FAIL_CLOSED`, `MISSING_GEMINI_KEY` | Fail-Closed policy triggered (both Open Library and Google Books unreachable) or required server secret missing in Live Mode. Never returns unverified books. |

---

## 3. Server-Sent Events (SSE) Specification (`POST /api/recommendations`)

When a client calls `POST /api/recommendations` with header `Accept: text/event-stream`, the server responds with `Content-Type: text/event-stream; charset=utf-8`, `X-API-Version: 1`, `X-Request-Id`, and `X-Recommendation-Id`, streaming newline-delimited SSE frames (`event: <type>\ndata: <json>\n\n`).

If the client aborts the request (`AbortController.abort()`), the server immediately halts downstream external calls and closes the stream.

### 3.1 `stage`
Emitted whenever the pipeline transitions between its 6 stages (`searching`, `extracting`, `verifying`, `ranking`, `building_path`, `completed`).

```json
{
  "type": "stage",
  "stage": "verifying",
  "stats": {
    "candidatesFound": 6,
    "candidatesVerified": 1,
    "candidatesRemoved": 0,
    "currentStage": "verifying",
    "queriesExecuted": ["Machine Learning beginner textbook"]
  },
  "queries": ["Machine Learning beginner textbook"],
  "warnings": []
}
```

### 3.2 `candidate_found`
Emitted in Stage 3 as each raw book candidate is extracted from grounded search results prior to catalog verification.

```json
{
  "type": "candidate_found",
  "candidate": {
    "title": "Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow",
    "author": "Aurélien Géron",
    "isbn": "9781492032649",
    "sourceUrl": "https://openlibrary.org/books/OL27326455M",
    "whyFound": "Practical introductory machine learning textbook"
  },
  "stats": {
    "candidatesFound": 1,
    "candidatesVerified": 0,
    "candidatesRemoved": 0,
    "currentStage": "extracting"
  }
}
```

### 3.3 `book_verified`
Emitted in Stage 4 as soon as a candidate passes Fail-Closed verification against Open Library and/or Google Books (`titleSimilarityScore >= 0.72` and exact normalized author surname match). Allows the UI to render verified cards progressively.

```json
{
  "type": "book_verified",
  "book": {
    "id": "ml-1-hands-on-ml",
    "title": "Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow",
    "authors": ["Aurélien Géron"],
    "pageCount": 856,
    "roadmapStepOrder": 1,
    "verification": {
      "status": "verified",
      "matchedSources": "both",
      "titleSimilarityScore": 0.99,
      "authorSurnameMatched": "geron",
      "openLibraryUrl": "https://openlibrary.org/books/OL27326455M",
      "checkedAtIso": "2026-11-09T18:00:00.000Z"
    }
  },
  "stats": {
    "candidatesFound": 6,
    "candidatesVerified": 1,
    "candidatesRemoved": 0,
    "currentStage": "verifying"
  }
}
```

### 3.4 `book_removed`
Emitted in Stage 4 whenever a candidate fails catalog verification (`not_found`, `author_mismatch`, or `low_title_similarity`). Logged in the UI's transparency audit counter.

```json
{
  "type": "book_removed",
  "rejected": {
    "candidateTitle": "Practical Deep Neural Alchemy",
    "candidateAuthor": "J. R. Vance",
    "failureReasonCode": "not_found",
    "reasonVi": "Không tìm thấy bản ghi khớp trên Open Library hoặc Google Books.",
    "reasonEn": "No matching record found in Open Library or Google Books.",
    "timestampIso": "2026-11-09T18:00:01.000Z"
  },
  "stats": {
    "candidatesFound": 6,
    "candidatesVerified": 1,
    "candidatesRemoved": 1,
    "currentStage": "verifying"
  }
}
```

### 3.5 `done`
Emitted once Stage 5 (MMR diversity re-ranking) and Stage 6 (pedagogical roadmap sequencing) complete. Delivers the final `RecommendationSet`.

```json
{
  "type": "done",
  "recommendationSet": {
    "id": "rec_1794250000_x8k2p",
    "isSampleData": false,
    "preferences": {
      "topic": "Machine Learning",
      "level": "beginner",
      "length": "any",
      "language": "any",
      "adventurousness": 30
    },
    "books": [],
    "rejectedCandidates": [],
    "stats": {
      "candidatesFound": 6,
      "candidatesVerified": 4,
      "candidatesRemoved": 2,
      "currentStage": "completed"
    },
    "createdAtIso": "2026-11-09T18:00:02.000Z"
  }
}
```

### 3.6 `error`
Emitted if an unrecoverable error occurs after the SSE stream headers have already been flushed (e.g., `SOURCE_OUTAGE_FAIL_CLOSED`, `MISSING_GEMINI_KEY`, `RATE_LIMITED`, or `PIPELINE_ERROR`).

```json
{
  "type": "error",
  "code": "SOURCE_OUTAGE_FAIL_CLOSED",
  "message": "Open Library and Google Books verification endpoints did not respond. Results withheld per Fail-Closed policy."
}
```
