# Observability & Cloud Logging Guide (`docs/OBSERVABILITY.md`)

ShelfPath emits **single-line structured JSON logs** (`service: "shelfpath-server"`) directly to `stdout`/`stderr` so Google Cloud Run automatically ingests every event into **Google Cloud Logging** as `jsonPayload`.

## 1. Privacy & Security Guarantee in Logs
Every log entry passes through `logStructuredEvent()` in `/server/observability/logger.ts`:
- **Zero User Text**: Keys such as `topic`, `rawTopic`, `query`, `queries`, `searchQueries`, `refinementText`, `userText`, `notes`, and `prompt` are strictly stripped at the logger boundary. Only character counts (`inputCharCount`) and enum settings (`level`, `language`, `isMockMode`) are logged.
- **Zero PII**: Client IP addresses are never logged; rate-limiting uses transient daily-rotating salted SHA-256 hashes in memory.
- **Automatic Secret Redaction**: Every string field is passed through `redactSecretsInLog()` before serialization to guarantee that `AIzaSy...` keys or `Bearer` tokens can never leak into Cloud Logging.

---

## 2. Standard Structured Log Schema

Every structured log entry conforms to this schema:

```json
{
  "severity": "INFO | WARNING | ERROR | CRITICAL",
  "timestamp": "2026-11-11T11:25:00.000Z",
  "service": "shelfpath-server",
  "event": "BOOK_VERIFICATION_SUCCESS",
  "requestId": "req_m3abc123_9f8a1b",
  "stage": "stage4_verification",
  "durationMs": 184,
  "outcome": "success",
  "metrics": {
    "catalogSource": "open_library+google_books",
    "titleSimilarity": 0.96,
    "authorMatched": true,
    "hasIsbn13": true
  }
}
```

---

## 3. Defined Observability Events (`jsonPayload.event`)

| Event Name (`jsonPayload.event`) | Severity | Stage (`jsonPayload.stage`) | Outcome (`jsonPayload.outcome`) | Key Metrics (`jsonPayload.metrics`) |
| :--- | :--- | :--- | :--- | :--- |
| `BOOK_VERIFICATION_SUCCESS` | `INFO` | `stage4_verification` | `success` | `catalogSource` (`open_library`, `google_books`, `open_library+google_books`, `cache`), `titleSimilarity` (`0..1`), `authorMatched` (`boolean`), `hasIsbn13` (`boolean`) |
| `BOOK_VERIFICATION_FAILURE` | `INFO` / `WARNING` | `stage4_verification` | `rejected` | `failureReason` (`not_found`, `low_title_similarity`, `author_mismatch`, `source_unavailable`), `titleSimilarity` (`0..1`) |
| `EXTERNAL_SOURCE_OUTAGE` | `WARNING` / `ERROR` | `stage4_verification` | `outage_fail_closed` / `failure` | `provider` (`open_library`, `google_books`, `both_catalogs`), `failClosedTriggered` (`boolean`) |
| `RATE_LIMIT_429` | `WARNING` | `http_ingress` | `rate_limited` | `limiterScope` (`per_ip_recommendations`, `global_recommendations`, `verification_anti_scrape`, `refine_or_dismiss`), `retryAfterSeconds` (`number`) |
| `BUDGET_CIRCUIT_BREAKER_TRIP` | `CRITICAL` | `http_ingress` | `circuit_open` / `budget_exhausted` | `tripReason` (`DAILY_BUDGET_EXHAUSTED`, `CIRCUIT_BREAKER_OPEN`), `callsUsedToday`, `dailyBudgetLimit`, `consecutiveFailures`, `retryAfterSeconds` |
| `LLM_CALL_LATENCY` | `INFO` / `WARNING` | `stage1_*` .. `stage5_*` | `success` / `failure` / `fallback` | `model` (e.g., `gemini-3-flash-preview`), `inputCharCount` (`number`) |
| `TIME_TO_FIRST_BOOK` | `INFO` | `stage4_verification` | `success` | `isMockMode` (`boolean`), `durationMs` (latency from request start to first verified book emitted) |
| `PIPELINE_STAGE_OUTCOME` | `INFO` / `ERROR` | `pipeline_complete` | `success` / `failure` / `outage_fail_closed` | `candidatesFound`, `candidatesVerified`, `candidatesRemoved`, `isMockMode` |

---

## 4. Recommended Log-Based Metrics & Alerts in Google Cloud Logging

After deploying ShelfPath to Google Cloud Run, create the following **Log-based Alerts** in **Google Cloud Monitoring $\rightarrow$ Alerting**:

### Alert 1: Fail-Closed Source Outage (`EXTERNAL_SOURCE_OUTAGE`)
Triggers when both Open Library and Google Books fail to respond and ShelfPath withholds results per its Fail-Closed policy.
- **Cloud Logging Filter**:
  ```text
  resource.type="cloud_run_revision"
  jsonPayload.service="shelfpath-server"
  jsonPayload.event="EXTERNAL_SOURCE_OUTAGE"
  jsonPayload.metrics.failClosedTriggered=true
  ```
- **Condition**: Rate $\ge 3$ events within a `5-minute` rolling window.
- **Notification Channel**: On-call email / Pager / Slack.

### Alert 2: Daily Gemini Budget Exhausted or Circuit Breaker Open (`BUDGET_CIRCUIT_BREAKER_TRIP`)
Triggers immediately when the daily Gemini API budget cap is reached or 5 consecutive LLM failures trip the circuit breaker.
- **Cloud Logging Filter**:
  ```text
  resource.type="cloud_run_revision"
  jsonPayload.service="shelfpath-server"
  jsonPayload.event="BUDGET_CIRCUIT_BREAKER_TRIP"
  ```
- **Condition**: Any occurrence ($\ge 1$ event in `1 minute`).

### Alert 3: Sustained 429 Rate-Limit Spike / Abuse Wave (`RATE_LIMIT_429`)
Triggers when an automated scraper or traffic spike hits the per-IP or global rate limiters.
- **Cloud Logging Filter**:
  ```text
  resource.type="cloud_run_revision"
  jsonPayload.service="shelfpath-server"
  jsonPayload.event="RATE_LIMIT_429"
  ```
- **Condition**: Count $\ge 25$ events within `5 minutes`.

### Alert 4: High Verification Failure Rate (`BOOK_VERIFICATION_FAILURE`)
Monitors the ratio of candidate books rejected during Stage 4 catalog verification (e.g., if an upstream catalog API changes its response schema).
- **Cloud Logging Filter**:
  ```text
  resource.type="cloud_run_revision"
  jsonPayload.service="shelfpath-server"
  jsonPayload.event="BOOK_VERIFICATION_FAILURE"
  ```
- **Log-based Counter Metric**: Group by `jsonPayload.metrics.failureReason` (`not_found`, `low_title_similarity`, `author_mismatch`, `source_unavailable`). Alert if `source_unavailable` exceeds `20%` of verification attempts over `10 minutes`.

### Alert 5: P95 Time-to-First-Book & LLM Latency (`TIME_TO_FIRST_BOOK`, `LLM_CALL_LATENCY`)
Creates a distribution metric on `jsonPayload.durationMs` to track user-perceived streaming responsiveness.
- **Cloud Logging Filter**:
  ```text
  resource.type="cloud_run_revision"
  jsonPayload.service="shelfpath-server"
  (jsonPayload.event="TIME_TO_FIRST_BOOK" OR jsonPayload.event="LLM_CALL_LATENCY")
  ```
- **Condition**: P95 `jsonPayload.durationMs` $> 12000\text{ ms}$ over `15 minutes`.
