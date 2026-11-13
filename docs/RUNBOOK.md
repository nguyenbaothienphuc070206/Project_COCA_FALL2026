# Operational Incident Runbook (`docs/RUNBOOK.md`)

This runbook provides step-by-step diagnosis and remediation procedures for the six primary operational incidents in **ShelfPath**.

---

## 1. Open Library or Google Books Outage (`SOURCE_OUTAGE_FAIL_CLOSED`)

### Symptoms
- Cloud Logging emits `EXTERNAL_SOURCE_OUTAGE` events (`jsonPayload.metrics.provider` = `"open_library"`, `"google_books"`, or `"both_catalogs"`).
- If only **one** catalog is down, ShelfPath automatically continues verifying candidates against the healthy catalog and logs a `WARNING`.
- If **both** catalogs are unreachable, ShelfPath enforces its **Fail-Closed policy**: it returns HTTP `503 SOURCE_OUTAGE_FAIL_CLOSED` and displays a clear outage banner with a retry button (never unverified AI-generated books).

### Diagnosis & Remediation Steps
1. **Check Which Provider Failed**:
   Run in Cloud Logging:
   ```text
   jsonPayload.service="shelfpath-server" AND jsonPayload.event="EXTERNAL_SOURCE_OUTAGE"
   ```
2. **Verify Upstream Status**:
   - Check `https://openlibrary.org/status` (or test `curl -I https://openlibrary.org/search.json?title=calculus`).
   - Check Google Cloud Console $\rightarrow$ APIs & Services $\rightarrow$ **Books API** metrics for `403`/`5xx` errors.
3. **Ensure Polite Pool & Secondary Key Are Configured**:
   - Confirm `OPENLIBRARY_CONTACT_EMAIL` is set so Open Library serves requests from the polite pool (`3 req/s` instead of `1 req/s`).
   - Confirm `GOOGLE_BOOKS_API_KEY` is set so Google Books acts as an active secondary verifier whenever Open Library is degraded.
4. **Temporary Mitigation During Prolonged Outage**:
   - Cached verified books (`TTL = 7 days` in Firestore/memory) continue to serve repeats cleanly.
   - If a live demo is occurring during a global catalog outage, set `MOCK_MODE="true"` in environment variables to serve pre-verified sample roadmaps with the explicit `"Sample data"` badge until external catalogs recover.

---

## 2. Gemini Quota Exhausted (`429` Upstream / `DAILY_BUDGET_EXHAUSTED`)

### Symptoms
- Cloud Logging emits `BUDGET_CIRCUIT_BREAKER_TRIP` (`tripReason: "DAILY_BUDGET_EXHAUSTED"` or `"CIRCUIT_BREAKER_OPEN"`) or `LLM_CALL_LATENCY` with `outcome: "fallback"`.
- Users requesting live roadmaps receive a polite `503` message (*"Daily AI call budget reached — service is busy, please try again later or switch to Sample Mode"*).

### Diagnosis & Remediation Steps
1. **Distinguish Internal Cap vs. Google Cloud Quota**:
   - Inspect `/healthz` or `BUDGET_CIRCUIT_BREAKER_TRIP` log fields (`callsUsedToday` vs. `dailyBudgetLimit`).
   - If `callsUsedToday >= dailyBudgetLimit`, ShelfPath's internal cost guard (`DAILY_GEMINI_CALL_BUDGET`, default `250` calls/UTC day) tripped as designed.
   - If `tripReason === "CIRCUIT_BREAKER_OPEN"`, `5` consecutive upstream Gemini errors occurred (e.g., upstream `429 Resource Exhausted`), opening the circuit breaker for `45 seconds`.
2. **Remediation**:
   - If legitimate student traffic exceeded the daily budget, increase `DAILY_GEMINI_CALL_BUDGET` in Cloud Run environment variables (e.g., from `250` to `1000`) after verifying your GCP Billing budget alert threshold.
   - If an automated bot caused the spike, enable `BOT_PROTECTION_PROVIDER="turnstile"` (or `"hcaptcha"`) and tighten `RATE_LIMIT_MAX_REQUESTS`.

---

## 3. Leaked API Key or Admin Token (Rotate in Secrets & Redeploy)

### Symptoms
- GitHub Secret Scanning, Google Cloud Security Command Center, or an external report flags a leaked `GEMINI_API_KEY`, `GOOGLE_BOOKS_API_KEY`, or `EVAL_ADMIN_TOKEN`.

### Immediate Remediation Steps (Target $< 10$ Minutes)
1. **Generate Replacement Key**:
   - For `GEMINI_API_KEY` or `GOOGLE_BOOKS_API_KEY`: Open **Google Cloud Console $\rightarrow$ APIs & Services $\rightarrow$ Credentials**, click **Create Credentials $\rightarrow$ API Key**, restrict the new key to the specific API (*Generative Language API* or *Books API*), and copy the new secret.
   - For `EVAL_ADMIN_TOKEN`: Generate a new 32-byte random secret (`openssl rand -hex 32`).
2. **Update in Secrets Panel / Secret Manager**:
   - In **Google AI Studio Secrets panel** (or **Google Cloud Secret Manager** for Cloud Run), update `GEMINI_API_KEY`, `GOOGLE_BOOKS_API_KEY`, or `EVAL_ADMIN_TOKEN` with the new value.
3. **Redeploy Service**:
   - Trigger a new Cloud Run revision deployment so running containers pick up the rotated secret immediately.
4. **Revoke Old Key & Audit**:
   - Delete/disable the compromised key in Google Cloud Console Credentials.
   - Run `npm run test` (which executes `scanClientBundleForSecrets()` in `src/lib/phase7.security.test.ts`) to confirm zero keys exist in client bundles or source code.

---

## 4. Unexpected Cloud / LLM Cost Spike

### Symptoms
- GCP Billing alert fires at 50%, 80%, or 100% of monthly budget, or Cloud Monitoring shows a surge in Cloud Run billable container instance-hours or Gemini API requests.

### Diagnosis & Remediation Steps
1. **Contain Cost Immediately**:
   - Lower `DAILY_GEMINI_CALL_BUDGET` (e.g., set to `50` or `0`) or set `MOCK_MODE="true"` in Cloud Run environment variables and deploy. This immediately halts all paid outbound Gemini API calls while keeping the UI and sample roadmaps operational.
2. **Enable Bot Challenge**:
   - Set `BOT_PROTECTION_PROVIDER="turnstile"` and `BOT_PROTECTION_SECRET_KEY` to block headless abuse on `POST /api/recommendations`.
3. **Verify Cloud Run Scaling Caps**:
   - Ensure Cloud Run `--max-instances` is capped (e.g., `--max-instances=5`) and `--concurrency=80` so traffic spikes cannot spin up unbounded container instances.

---

## 5. Firestore Persistence Failure or Permission Error

### Symptoms
- `/healthz` reports `"persistence": { "firestoreAvailable": false, "fallbackMode": "in-memory" }` or logs show `[WARN][FirestorePersistence] ... Falling back to in-memory store`.

### Diagnosis & Remediation Steps
1. **Impact Assessment (Non-Fatal by Design)**:
   - ShelfPath's persistence layer (`/server/persistence/firestoreStores.ts`) is designed to **degrade gracefully**: when Firestore is unreachable or unauthenticated, TTL caches, rate-limit buckets, and evaluation runs automatically fall back to `InMemoryTTLCache` and in-memory maps without crashing any user request.
2. **Restore Firestore Connectivity**:
   - Verify `firebase-applet-config.json` has the correct `projectId` and `firestoreDatabaseId`.
   - Note that `firestore.rules` intentionally blocks all unauthenticated client access (`allow read, write: if false;`). On Cloud Run production, attach a service account with the `Cloud Datastore User` role (`roles/datastore.user`) or provide `FIREBASE_SERVICE_ACCOUNT_TOKEN` so server-side REST calls authenticate with privileged bearer tokens.
   - Run `runGlobalPersistenceCleanup()` (automatically triggered on startup and periodically) to prune expired `expiresAtMs` documents.

---

## 6. Production Rollback Procedure

### Symptoms
- A newly deployed revision introduces a regression in UI rendering, verification accuracy, or error rates.

### Rollback Steps
1. **Instant Traffic Rollback on Cloud Run ($< 30$ Seconds)**:
   - List recent revisions:
     ```bash
     gcloud run revisions list --service=shelfpath --region=asia-east1
     ```
   - Route 100% of traffic back to the last known good revision:
     ```bash
     gcloud run services update-traffic shelfpath \
       --region=asia-east1 \
       --to-revisions=<PREVIOUS_HEALTHY_REVISION_NAME>=100
     ```
2. **Verify Rollback Health**:
   - Check `curl -s https://<YOUR_DOMAIN>/healthz` and confirm `status: "ok"` and `X-API-Version: 1`.
   - Run the Playwright E2E suite (`npm run e2e`) against staging before rolling forward again.
