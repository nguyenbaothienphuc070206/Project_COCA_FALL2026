# Danh Mục Kiểm Tra Trước Khi Ra Mắt (Launch Checklist — LAUNCH_CHECKLIST.md)

Tài liệu này liệt kê toàn bộ các hạng mục kiểm tra trước và ngay sau khi đưa **ShelfPath** lên môi trường sản xuất (Production).
Mỗi hạng mục được gắn nhãn rõ ràng:
- **`[done in code]`**: Đã được triển khai, cấu hình và kiểm thử tự động trong mã nguồn.
- **`[needs me]`**: Cần thao tác thủ công của bạn trên Google Cloud Console, trình duyệt thiết bị thật hoặc bảng quản trị DNS/Search Console.

---

## 1. Bảo Mật (Security)

- **`[done in code]`** **Cấu hình Security Headers với Helmet & Middleware**: Đã thiết lập `Content-Security-Policy` (tương thích Three.js WebGL), `Strict-Transport-Security` (HSTS 1 năm), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, và hỗ trợ `frame-ancestors 'none'` ở production qua `ENFORCE_PRODUCTION_CSP_FRAME_ANCESTORS="true"`.
- **`[done in code]`** **Chống SSRF, Prompt Injection & XSS**: Mọi URL gọi ra ngoài đều đi qua `assertAllowedOutboundUrl` (chỉ cho phép HTTPS tới `openlibrary.org`, `covers.openlibrary.org`, `www.googleapis.com`, `books.google.com` với `redirect: 'error'`); mọi đầu vào người dùng và kết quả web được bọc trong thẻ `<untrusted_...>` và làm sạch văn bản thuần.
- **`[done in code]`** **Quét khóa bí mật trong Client Bundle & Fail-Fast Startup**: Đã có bài kiểm thử tự động quét toàn bộ `/src` và `/app` đảm bảo không lộ `GEMINI_API_KEY`, không dùng `dangerouslySetInnerHTML`, và hàm `assertProductionStartupEnv()` từ chối khởi động ở `NODE_ENV=production` (`MOCK_MODE=false`) nếu thiếu `GEMINI_API_KEY`.
- **`[done in code]`** **Cấu hình `/.well-known/security.txt` (RFC 9116)**: Đã phục vụ tại `/app/.well-known/security.txt/route.ts`.
- **`[needs me]`** **Điền khóa bí mật thật vào Secrets**: Thêm `GEMINI_API_KEY`, `GOOGLE_BOOKS_API_KEY`, `OPENLIBRARY_CONTACT_EMAIL` và đặt `MOCK_MODE="false"`, `EVAL_ENABLED="false"` trong bảng Secrets trước khi Publish.
- **`[needs me]`** **Quét Security Headers trực tuyến (Headers Scan)**: Sau khi gắn tên miền thật và bật `ENFORCE_PRODUCTION_CSP_FRAME_ANCESTORS="true"`, chạy kiểm tra tại https://securityheaders.com để xác nhận điểm **A / A+**.
- **`[needs me]`** **Kiểm tra chứng chỉ SSL/TLS (SSL Test)**: Chạy kiểm tra tên miền trên https://www.ssllabs.com/ssltest/ để xác nhận chứng chỉ Google-managed TLS đạt chuẩn **A / A+** và chuyển hướng HTTP $\rightarrow$ HTTPS hoạt động đúng.

---

## 2. Tối Ưu Hóa Công Cụ Tìm Kiếm (SEO)

- **`[done in code]`** **SSR HTML ngữ nghĩa & Metadata riêng cho cả 16 trang song ngữ (`/vi/*`, `/en/*`)**: Mọi trang công khai đều kết xuất HTML thật từ máy chủ kèm `<title>` (< 60 ký tự), `<meta name="description">` (< 160 ký tự), `<link rel="canonical">`, `hreflang` (`vi`, `en`, `x-default`), Open Graph và Twitter Card lấy từ `SITE_URL`.
- **`[done in code]`** **Quy tắc Indexing (`robots.txt`, `sitemap.xml`, `noindex`, `301` Redirects)**: Tự động sinh `/robots.txt` và `/sitemap.xml` từ `SITE_URL`; chặn lập chỉ mục (`X-Robots-Tag: noindex, nofollow`) cho `/eval`, `/api/*` và các URL có tham số cá nhân hóa; chuyển hướng `301` cho URL có dấu `/` thừa hoặc chữ hoa.
- **`[done in code]`** **Dữ liệu có cấu trúc JSON-LD trung thực**: Đã nhúng `WebApplication`, `Organization`, `FAQPage`, `BreadcrumbList` khớp 100% với nội dung hiển thị trên trang.
- **`[needs me]`** **Cập nhật `SITE_URL` sang tên miền sản xuất chính thức**: Đặt `SITE_URL="https://..."` trên Cloud Run sau khi hoàn tất gắn tên miền.
- **`[needs me]`** **Chạy Lighthouse & PageSpeed Insights trên URL sản xuất**: Kiểm tra tại https://pagespeed.web.dev cho cả `/vi` và `/en` trên Mobile và Desktop (mục tiêu SEO $\ge 95$, Performance $\ge 90$).
- **`[needs me]`** **Kiểm tra Google Rich Results Test**: Dán URL `/vi/faq` và `/en` vào https://search.google.com/test/rich-results để xác nhận `FAQPage`, `WebApplication` và `BreadcrumbList` hợp lệ 0 lỗi.
- **`[needs me]`** **Gửi Sitemap lên Google Search Console**: Xác minh tên miền trên https://search.google.com/search-console và gửi đường dẫn `https://<domain>/sitemap.xml`.
- **`[needs me]`** **Gửi Sitemap lên Bing Webmaster Tools**: Đăng ký trang web trên https://www.bing.com/webmasters và gửi `https://<domain>/sitemap.xml`.

---

## 3. Khả Năng Tiếp Cận (Accessibility — WCAG 2.2 AA)

- **`[done in code]`** **Skip Link, Landmark ngữ nghĩa, Tương phản $\ge 4.5:1$ & Vùng chạm $\ge 44\text{px}$**: Đã triển khai liên kết bỏ qua điều hướng (`Skip to main content`), thẻ `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`, `aria-live="polite"` cho luồng SSE, bẫy tiêu điểm (Focus Trap) trong `TrustDrawer` và đóng bằng phím `Escape`.
- **`[done in code]`** **Chế độ danh sách 2D tương đương 100% cho không gian 3D & Tôn trọng `prefers-reduced-motion`**: Mọi thông tin trên kệ 3D và lộ trình 3D đều có bản danh sách 2D đầy đủ và tự động chuyển sang 2D khi người dùng bật giảm chuyển động.
- **`[needs me]`** **Kiểm tra điều hướng bàn phím thực tế (Manual Keyboard Pass)**: Dùng phím `Tab`, `Shift+Tab`, `Enter`, `Space`, `Escape` đi hết luồng từ chọn chủ đề $\rightarrow$ lọc nhanh $\rightarrow$ mở hồ sơ kiểm chứng (`How we checked`) $\rightarrow$ lưu sách vào kệ $\rightarrow$ xuất Markdown/CSV mà không dùng chuột.
- **`[needs me]`** **Kiểm tra trình đọc màn hình (Screen-Reader Pass)**: Bật **VoiceOver** (macOS / iOS) hoặc **NVDA** (Windows) kiểm tra thông báo tiến trình kiểm chứng (`aria-live`) và thứ tự đọc tiêu đề `h1` $\rightarrow$ `h2` $\rightarrow$ `h3`.

---

## 4. Thiết Bị & Trình Duyệt Thực Tế (Devices & Browsers)

- **`[done in code]`** **Thiết kế Mobile-First Responsive (375px, 768px, 1280px+)**: Thanh điều hướng dưới cùng trên di động, không cuộn ngang, tự động dùng chế độ 2D nhẹ trên màn hình nhỏ hoặc GPU yếu.
- **`[needs me]`** **Kiểm thử trên iPhone thật (iOS Safari)**: Mở URL sản xuất trên iPhone Safari, kiểm tra thanh điều hướng đáy với vùng an toàn (`safe-area-inset-bottom`), mở `TrustDrawer` và tải tệp xuất `.md` / `.csv`.
- **`[needs me]`** **Kiểm thử trên điện thoại Android thật (Android Chrome)**: Kiểm tra tốc độ tải lần đầu trên mạng 4G/5G, thao tác kéo thanh trượt MMR và chuyển đổi ngôn ngữ Việt/Anh.
- **`[needs me]`** **Kiểm thử trên trình duyệt Cốc Cốc (Desktop & Mobile tại Việt Nam)**: Kiểm tra hiển thị tiếng Việt có dấu (font *Fraunces* & *Plus Jakarta Sans*), tính năng dịch trang tích hợp của Cốc Cốc không làm vỡ bố cục và tải tệp CSV UTF-8 BOM mở đúng tiếng Việt trong Excel.

---

## 5. Kiểm Soát Chi Phí (Cost Protection)

- **`[done in code]`** **Ngắt mạch ngân sách Gemini hàng ngày (`DAILY_GEMINI_CALL_BUDGET`) & Giới hạn tốc độ kép**: Đã khóa trần tối đa 250 lệnh gọi Gemini/ngày, tối đa 20 ứng viên/yêu cầu, bộ nhớ đệm TTL 24 giờ cho sách đã kiểm chứng và giới hạn 10 yêu cầu/phút/IP.
- **`[done in code]`** **Điều tiết tốc độ gọi Open Library & Google Books (Token-Bucket Pacer)**: Đã khóa tốc độ gọi ra ngoài (`1–3 req/s`) để không bao giờ bị khóa IP.
- **`[needs me]`** **Tạo Cảnh báo Ngân sách (Budget Alert) trong Google Cloud Billing**: Vào **Google Cloud Console** $\rightarrow$ **Billing** $\rightarrow$ **Budgets & alerts**, đặt ngưỡng cảnh báo hàng tháng (ví dụ `$10/tháng`) gửi email ở các mức 50%, 80%, 100%.
- **`[needs me]`** **Đặt trần Hạn mức API (Quota Caps) trong Google Cloud Console**: Vào **IAM & Admin** $\rightarrow$ **Quotas**, giới hạn `GenerateContent requests per day` của Generative Language API và đặt `--max-instances=3` trên Cloud Run.

---

## 6. Độ Tin Cậy & Khởi Động Lạnh (Reliability & Cold Start)

- **`[done in code]`** **Trải nghiệm Khởi động Lạnh mượt mà (Cold-Start Resilience)**:
  - Khung xương tải trang (`cold-start-loading-skeleton`) hiển thị tức thì.
  - Không chặn luồng chính bởi 3D (chế độ 2D và các nút điều khiển sẵn sàng ngay lập tức).
  - Tự động phát hiện nếu lệnh gọi API đầu tiên chậm quá 2.5 giây (`cold-start-slow-banner`) và hiển thị thông báo thân thiện kèm nút **"Thử lại ngay / Retry"** và **"Dùng thử với dữ liệu mẫu"**.
- **`[done in code]`** **Endpoint `/healthz` & Đóng kết nối êm ái (Graceful Shutdown)**: Đã triển khai `/healthz` trả về trạng thái máy chủ và bộ điều khiển `SIGTERM`/`SIGINT` (`/server/startup/productionServer.ts`) chờ các luồng đang chạy hoàn tất trước khi tắt container.
- **`[done in code]`** **Chế độ dự phòng bộ nhớ RAM khi Firestore gián đoạn**: Tự động chuyển sang `InMemoryTTLCache` nếu Firestore gặp sự cố mà không làm gián đoạn người dùng.
- **`[needs me]`** **Tạo Uptime Check trên Google Cloud Monitoring**: Vào **Cloud Console** $\rightarrow$ **Monitoring** $\rightarrow$ **Uptime checks**, tạo kiểm tra định kỳ mỗi 5 phút tới `GET https://<domain>/healthz` và gửi cảnh báo nếu thất bại 2 lần liên tiếp.
- **`[needs me]`** **Thiết lập Log-Based Alerts theo `/docs/OBSERVABILITY.md`**: Tạo 5 bộ lọc cảnh báo (`EXTERNAL_SOURCE_OUTAGE`, `BUDGET_CIRCUIT_BREAKER_TRIP`, `RATE_LIMIT_429`, `LLM_CALL_LATENCY`, `BOOK_VERIFICATION_FAILURE`) trong Cloud Logging.

---

## 7. Quy Trình Quay Lui Khẩn Cấp (Rollback)

- **`[done in code]`** **Công tắc `MOCK_MODE="true"` & Kiểm chứng Fail-Closed**: Có thể chuyển `MOCK_MODE="true"` bất kỳ lúc nào qua biến môi trường để phục vụ dữ liệu mẫu đã kiểm chứng với chi phí API bằng 0; khi cả 2 nguồn danh mục sập, hệ thống tự động trả về `503 SOURCE_OUTAGE_FAIL_CLOSED`.
- **`[done in code]`** **Sổ tay vận hành chi tiết (`/docs/RUNBOOK.md`)**: Đã cung cấp đầy đủ lệnh CLI cho 6 tình huống sự cố sản xuất.
- **`[needs me]`** **Kiểm tra danh sách Revision trên Cloud Run và diễn tập Rollback 1 lần**: Mở **Cloud Run** $\rightarrow$ **Revisions**, xác nhận có ít nhất 1 bản phát hành ổn định trước đó để có thể chuyển `100%` lưu lượng về bản cũ trong 10 giây khi cần:
  ```bash
  gcloud run services update-traffic shelfpath-prod \
    --to-revisions=<PREVIOUS_HEALTHY_REVISION>=100 \
    --region=asia-east1
  ```
