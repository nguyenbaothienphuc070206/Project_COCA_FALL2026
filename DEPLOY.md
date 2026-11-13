# Hướng Dẫn Triển Khai Sản Xuất (Production Deployment Guide — DEPLOY.md)

Tài liệu này hướng dẫn từng bước cách triển khai **ShelfPath** lên môi trường sản xuất (Production) từ **Google AI Studio** và **Google Cloud Run**, cấu hình biến môi trường/khóa bí mật, gắn tên miền riêng (Custom Domain), tối ưu hóa hạn mức miễn phí (Starter / Free Tier) và chọn vùng máy chủ (Region).

---

## 1. Các Khóa Bí Mật (Secrets) và Biến Môi Trường Cần Thêm

Mọi cấu hình sản xuất của ShelfPath đều được điều khiển hoàn toàn bằng biến môi trường (`/server/config/env.ts`). Máy chủ lắng nghe trên biến `PORT` do Cloud Run cấp phát và **tự động kiểm tra Fail-Fast khi khởi động** (`assertProductionStartupEnv`) — nếu `NODE_ENV=production` và `MOCK_MODE=false` mà thiếu `GEMINI_API_KEY`, tiến trình sẽ báo lỗi rõ ràng ngay lập tức thay vì chạy ngầm ở trạng thái hỏng.

### 1.1. Danh sách Khóa Bí Mật (Thêm trong bảng **Secrets** của AI Studio hoặc **Cloud Run Secret Manager**)

| Tên Secret | Bắt buộc ở Production (`MOCK_MODE=false`)? | Mô tả & Cách lấy |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | **Bắt buộc (Fail-Fast)** | Khóa API từ Google AI Studio dùng cho Stage 1 (Query Understanding), Stage 2 (Google Search Grounding), Stage 3 (Zod Extraction), Stage 5 (`gemini-embedding-2-preview`) và Stage 6 (Giải thích lộ trình). Chỉ đọc trên server, tuyệt đối không có tiền tố `NEXT_PUBLIC_`. |
| `GOOGLE_BOOKS_API_KEY` | Khuyến nghị cao | Khóa API từ Google Cloud Console (*Books API*) dùng cho nguồn đối chiếu danh mục thứ hai (Stage 4) và làm giàu số trang/ISBN. |
| `OPENLIBRARY_CONTACT_EMAIL` | Khuyến nghị cao | Email liên hệ thực tế của bạn (được gửi trong header `User-Agent: ShelfPath (<email>)`) để Open Library nâng hạn mức từ `1 req/s` lên `3 req/s` (Polite Tier). |
| `EVAL_ADMIN_TOKEN` | Chỉ khi bật `/eval` | Chuỗi ngẫu nhiên tối thiểu 32 ký tự (`openssl rand -hex 32`) để bảo vệ `/api/eval/*` bằng phép so sánh thời gian hằng số (`timingSafeEqual`). |
| `BOT_PROTECTION_SECRET_KEY` | Chỉ khi bật CAPTCHA | Khóa bí mật phía server của Cloudflare Turnstile hoặc hCaptcha nếu đặt `BOT_PROTECTION_PROVIDER="turnstile"` hoặc `"hcaptcha"`. |

### 1.2. Danh sách Biến Môi Trường Sản Xuất (Production Environment Variables)

```bash
NODE_ENV="production"
PORT="8080"                                    # Cloud Run tự động tiêm biến PORT (mặc định 3000 ở local)
SITE_URL="https://your-custom-domain.edu.vn"   # URL gốc chính thức (không có dấu / ở cuối)
MOCK_MODE="false"                              # Bật luồng kiểm chứng trực tiếp (Live Pipeline)
EVAL_ENABLED="false"                           # Tắt phòng thí nghiệm nội bộ /eval trên môi trường công khai
TRUST_PROXY_HOPS="1"                           # Cloud Run sử dụng đúng 1 lớp Google Front End load balancer
DAILY_GEMINI_CALL_BUDGET="250"                 # Ngắt mạch bảo vệ chi phí hàng ngày (Circuit Breaker)
RATE_LIMIT_PER_MINUTE="10"                     # Giới hạn 10 yêu cầu/phút/IP (đã băm SHA-256 theo ngày)
GLOBAL_RATE_LIMIT_PER_MINUTE="60"              # Giới hạn tổng 60 yêu cầu/phút toàn hệ thống
SHUTDOWN_TIMEOUT_MS="10000"                    # Thời gian chờ đóng kết nối êm ái (Graceful Shutdown 10 giây)
ENFORCE_PRODUCTION_CSP_FRAME_ANCESTORS="true"  # Bật frame-ancestors 'none' khi chạy trên tên miền độc lập
```

> **Xác nhận đồng bộ `SITE_URL`**: Toàn bộ `sitemap.xml` (`/app/sitemap.ts`), `robots.txt` (`/app/robots.ts`), thẻ `<link rel="canonical">`, các thẻ `hreflang` (`vi`, `en`, `x-default`), thẻ `og:url` (Open Graph) và dữ liệu có cấu trúc `JSON-LD` (`WebApplication`, `Organization`, `FAQPage`, `BreadcrumbList` trong `/src/lib/seo.ts`) đều lấy URL gốc trực tiếp từ `SITE_URL`.

---

## 2. Cách Xuất Bản (Publish) Trực Tiếp Từ Google AI Studio

1. **Mở bảng Secrets trong AI Studio**:
   - Nhấn vào biểu tượng **Secrets (🔑)** ở thanh công cụ bên trái của Google AI Studio Build.
   - Thêm `GEMINI_API_KEY`, `GOOGLE_BOOKS_API_KEY`, `OPENLIBRARY_CONTACT_EMAIL`, và đặt `MOCK_MODE="false"`, `EVAL_ENABLED="false"`.
2. **Kiểm tra ứng dụng trước khi xuất bản**:
   - Đảm bảo bản xem trước (Preview) hoạt động mượt mà và không còn cảnh báo thiếu khóa trong dải thông báo trạng thái.
3. **Nhấn nút Publish / Deploy to Cloud Run**:
   - Nhấn nút **Publish** (hoặc **Deploy**) ở góc trên bên phải giao diện Google AI Studio.
   - Chọn dự án **Google Cloud Project** của bạn (đã liên kết tài khoản thanh toán để kích hoạt Cloud Run).
   - AI Studio sẽ đóng gói container Next.js Production (`npm run build` $\rightarrow$ `npm run start`), đẩy lên **Artifact Registry** và triển khai dịch vụ trên **Google Cloud Run**.
4. **Cập nhật `SITE_URL` sau lần triển khai đầu tiên**:
   - Sau khi Cloud Run trả về URL dịch vụ chính thức (hoặc sau khi bạn gắn tên miền riêng ở Bước 4), đặt biến môi trường `SITE_URL` thành URL đó và nhấn **Deploy** lại để `sitemap.xml`, `canonical`, `Open Graph` và `JSON-LD` trỏ đúng về tên miền thật.

---

## 3. Cách Đặt URL Tùy Chỉnh (Custom Service URL) Trên Cloud Run

1. Mở **Google Cloud Console** $\rightarrow$ **Cloud Run** (https://console.cloud.google.com/run).
2. Khi tạo dịch vụ mới hoặc triển khai từ CLI, bạn có thể đặt tên dịch vụ ngắn gọn, rõ nghĩa (ví dụ `shelfpath-prod`) để có URL dạng:
   ```text
   https://shelfpath-prod-<hash>.<region>.run.app
   ```
3. Qua Google Cloud CLI (`gcloud`), triển khai kèm tên dịch vụ và biến môi trường chuẩn:
   ```bash
   gcloud run deploy shelfpath-prod \
     --source . \
     --region asia-east1 \
     --platform managed \
     --allow-unauthenticated \
     --set-env-vars="NODE_ENV=production,MOCK_MODE=false,EVAL_ENABLED=false,TRUST_PROXY_HOPS=1,ENFORCE_PRODUCTION_CSP_FRAME_ANCESTORS=true,SITE_URL=https://shelfpath.yourdomain.com" \
     --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest,GOOGLE_BOOKS_API_KEY=GOOGLE_BOOKS_API_KEY:latest,OPENLIBRARY_CONTACT_EMAIL=OPENLIBRARY_CONTACT_EMAIL:latest"
   ```

---

## 4. Cách Gắn Tên Miền Riêng (Custom Domain Mapping) Qua Google Cloud Run

### Bước 4.1: Xác minh quyền sở hữu tên miền
1. Truy cập **Google Cloud Console** $\rightarrow$ **Cloud Run** $\rightarrow$ thẻ **Manage Custom Domains** (Quản lý tên miền tùy chỉnh).
2. Nhấn **Add Mapping** $\rightarrow$ chọn dịch vụ `shelfpath-prod`.
3. Nhập tên miền của bạn (ví dụ `shelfpath.yourdomain.edu.vn` hoặc `yourdomain.com`). Nếu tên miền chưa được xác minh trong Google Search Console, làm theo hướng dẫn thêm bản ghi `TXT` vào nhà cung cấp DNS (Cloudflare, Route53, Tenten, Matbao, v.v.).

### Bước 4.2: Tạo Domain Mapping bằng CLI (Tùy chọn)
```bash
gcloud beta run domain-mappings create \
  --service shelfpath-prod \
  --domain shelfpath.yourdomain.com \
  --region asia-east1
```

### Bước 4.3: Trỏ bản ghi DNS và cấp phát chứng chỉ SSL/TLS tự động
- **Nếu dùng tên miền phụ (Subdomain, ví dụ `shelfpath.yourdomain.com`)**:
  - Thêm bản ghi `CNAME` tại nhà quản lý DNS:
    - **Name/Host**: `shelfpath`
    - **Target/Value**: `ghs.googlehosted.com.`
    - **Proxy status (nếu dùng Cloudflare)**: Đặt thành **DNS Only (Đám mây xám)** trong quá trình Google cấp chứng chỉ TLS tự động.
- **Nếu dùng tên miền gốc (Apex domain, ví dụ `yourdomain.com`)**:
  - Thêm 4 bản ghi `A` (`216.239.32.21`, `216.239.34.21`, `216.239.36.21`, `216.239.38.21`) và 4 bản ghi `AAAA` (`2001:4860:4802:32::15`, `2001:4860:4802:34::15`, `2001:4860:4802:36::15`, `2001:4860:4802:38::15`) theo màn hình hướng dẫn của Cloud Run.
- Google Cloud Run sẽ tự động cấp phát và gia hạn chứng chỉ **Google-managed SSL/TLS** trong vòng 15–30 phút.
- Sau khi HTTPS hoạt động, cập nhật `SITE_URL="https://shelfpath.yourdomain.com"`.

---

## 5. Điều Kiện Hưởng Gói Miễn Phí (Starter / Free Tier Eligibility)

1. **Google Cloud Run Free Tier**:
   - Miễn phí **2 triệu yêu cầu (requests) / tháng**, **360.000 GB-giây bộ nhớ**, và **180.000 vCPU-giây / tháng**.
   - **Cấu hình khuyến nghị để nằm gọn trong gói miễn phí**:
     - `--min-instances=0` (Scale-to-Zero: không tốn tiền khi không có người dùng truy cập; giao diện ShelfPath đã có bộ khung xương Cold-Start và nút thử lại thân thiện ở Giai đoạn 11).
     - `--max-instances=3` (Giới hạn trần số lượng container đồng thời để chống tăng vọt chi phí).
     - `--cpu=1 --memory=512Mi` -- `--concurrency=40`.
   - *Lưu ý*: Nếu muốn triệt tiêu hoàn toàn độ trễ Cold Start trong buổi thuyết trình giám khảo, bạn có thể đặt `--min-instances=1` tạm thời trong ngày chấm thi rồi trả về `0` sau khi kết thúc.
2. **Cloud Firestore Free Tier (Starter)**:
   - Miễn phí **1 GiB dung lượng lưu trữ**, **50.000 lượt đọc/ngày**, **20.000 lượt ghi/ngày**, **20.000 lượt xóa/ngày**.
   - Nhờ bộ nhớ đệm L1 trong RAM kết hợp TTL 24 giờ trên Firestore (`cache_entries`), một ngày vận hành bình thường của ShelfPath chỉ tiêu thụ vài trăm lượt đọc/ghi, hoàn toàn nằm trong ngưỡng 0 đồng.
3. **Google Gemini API & Google Books API**:
   - `Google Books API`: Miễn phí (hạn mức mặc định 1.000 yêu cầu/ngày, có thể yêu cầu nâng hạn mức miễn phí trong Cloud Console).
   - `Open Library API`: Hoàn toàn miễn phí và mở (chỉ cần truyền `OPENLIBRARY_CONTACT_EMAIL` để đạt 3 req/s).
   - `Gemini API`: Bảo vệ bởi ngân sách cứng trong code (`DAILY_GEMINI_CALL_BUDGET=250` lượt gọi/ngày).

---

## 6. Lựa Chọn Vùng Máy Chủ (Recommended Cloud Run Region)

- **Khuyến nghị số 1 cho người dùng tại Việt Nam & Châu Á**: **`asia-east1` (Đài Loan — Taiwan)** hoặc **`asia-southeast1` (Singapore)**.
  - Độ trễ mạng (RTT) từ Việt Nam tới `asia-east1` và `asia-southeast1` chỉ khoảng **25–45 ms**, giúp thời gian phản hồi trang SSR (TTFB) và luồng SSE cực nhanh.
  - Dịch vụ hiện tại trong AI Studio (`ais-dev-...` / `ais-pre-...`) đang chạy tại **`asia-east1`**, đồng bộ vùng với cơ sở dữ liệu Firestore giúp giảm tối đa độ trễ truy vấn bộ nhớ đệm.
- **Nếu ưu tiên Free Tier băng thông Bắc Mỹ**: Có thể chọn `us-central1` (Iowa), tuy nhiên độ trễ mạng từ Việt Nam sẽ cao hơn (~180–220 ms). Do đó, **`asia-east1`** là lựa chọn tối ưu nhất cho ShelfPath.
