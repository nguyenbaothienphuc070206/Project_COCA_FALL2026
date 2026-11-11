/**
 * Tính năng: Kho nội dung song ngữ (Tiếng Việt & Tiếng Anh) cho toàn bộ các trang công khai, hướng dẫn người dùng mới (Onboarding 3 bước) và trang lỗi hệ thống (404 / 500) ở Giai đoạn 8.
 * Trường hợp sử dụng:
 * - Cung cấp nội dung rõ ràng, không dùng thuật ngữ rườm rà (plain language, no jargon).
 * - Tuyệt đối không bịa đặt số liệu, lượng người dùng, lời chứng thực (testimonials), giải thưởng hay quan hệ đối tác.
 * - Mọi thông tin cần chủ dự án điền thực tế đều được đánh dấu bằng chuỗi `[FILL IN: ...]` và liệt kê đồng bộ trong `/docs/PLACEHOLDERS.md`.
 * - Các trang pháp lý (Quyền riêng tư, Điều khoản & Miễn trừ) luôn kèm thông báo cần người có chuyên môn pháp lý rà soát trước khi vận hành chính thức.
 */

import type { Locale } from '../i18n/dictionaries';
import type { PublicPageSlug } from '../lib/navigation';

export interface ContentSectionBlock {
  id: string;
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface FaqQuestionItem {
  id: string;
  question: string;
  answer: string;
  category: 'pipeline' | 'verification' | 'features' | 'privacy';
}

export interface SixStageComparisonGuarantee {
  whatVerificationGuaranteesTitle: string;
  whatVerificationGuarantees: string[];
  whatVerificationDoesNotGuaranteeTitle: string;
  whatVerificationDoesNotGuarantee: string[];
}

export interface PublicPageContent {
  slug: PublicPageSlug;
  breadcrumbCategory: string;
  title: string;
  kicker: string;
  subtitle: string;
  lastUpdated: string;
  requiresLegalReviewBanner?: boolean;
  legalReviewBannerText?: string;
  sixStagesGuarantees?: SixStageComparisonGuarantee;
  sections: ContentSectionBlock[];
  faqItems?: FaqQuestionItem[];
  contactMailtoHref: string;
  contactPlaceholderLabel: string;
}

export interface OnboardingStepContent {
  stepNumber: 1 | 2 | 3;
  title: string;
  description: string;
  highlightNote: string;
}

export interface OnboardingDictionary {
  badgeLabel: string;
  heading: string;
  skipBtn: string;
  prevBtn: string;
  nextBtn: string;
  finishBtn: string;
  tryExampleHeading: string;
  reopenGuideBtn: string;
  steps: readonly [
    OnboardingStepContent,
    OnboardingStepContent,
    OnboardingStepContent,
  ];
}

export interface SystemPagesDictionary {
  notFound: {
    codeLabel: string;
    title: string;
    description: string;
    backHomeCta: string;
    trySampleCta: string;
    helpfulLinksTitle: string;
  };
  serverError: {
    codeLabel: string;
    title: string;
    description: string;
    retryCta: string;
    backHomeCta: string;
  };
  footer: {
    productHeading: string;
    trustHeading: string;
    legalHeading: string;
    contactLabel: string;
    contactEmailPlaceholder: string;
    languageSwitchLabel: string;
    openOnboardingLabel: string;
    noEndorsementNotice: string;
  };
  breadcrumbs: {
    homeLabel: string;
    ariaLabel: string;
  };
}

export const PLACEHOLDER_INVENTORY = [
  {
    id: 'PH-01',
    token: '[FILL IN: Project Lead / Team Member Names & Roles]',
    pageSlug: 'about' as const,
    description:
      'Full name(s) and role(s) of the creator(s) or student team behind ShelfPath.',
  },
  {
    id: 'PH-02',
    token: '[FILL IN: University, Department, or Independent Lab Name]',
    pageSlug: 'about' as const,
    description:
      'Academic institution, department, course, or independent research group where ShelfPath was developed.',
  },
  {
    id: 'PH-03',
    token: '[FILL IN: Project Origin Story & Founding Date]',
    pageSlug: 'about' as const,
    description:
      'Brief background on when the project started and the specific student coursework or personal learning challenge that inspired it.',
  },
  {
    id: 'PH-04',
    token: '[FILL IN: Source Repository URL]',
    pageSlug: 'about' as const,
    description:
      'Public GitHub or GitLab repository URL if the source code is published.',
  },
  {
    id: 'PH-05',
    token: '[FILL IN: contact@yourdomain.edu]',
    pageSlug: 'about' as const,
    description:
      'Primary contact email address used in the mailto: link on the About page and site footer.',
  },
  {
    id: 'PH-06',
    token: '[FILL IN: Data Controller / Operator Full Legal Name]',
    pageSlug: 'privacy' as const,
    description:
      'Full legal name of the individual or organization operating the ShelfPath deployment.',
  },
  {
    id: 'PH-07',
    token: '[FILL IN: privacy@yourdomain.edu]',
    pageSlug: 'privacy' as const,
    description:
      'Contact email address for privacy questions or data deletion requests.',
  },
  {
    id: 'PH-08',
    token: '[FILL IN: Postal Address or Country of Operation]',
    pageSlug: 'privacy' as const,
    description:
      'Physical or registered jurisdiction address required by local privacy regulations.',
  },
  {
    id: 'PH-09',
    token: '[FILL IN: Governing Law Country / State & Competent Court]',
    pageSlug: 'terms' as const,
    description:
      'Applicable governing law and court jurisdiction for the Terms of Use.',
  },
  {
    id: 'PH-10',
    token: '[FILL IN: legal@yourdomain.edu]',
    pageSlug: 'terms' as const,
    description:
      'Contact email address for legal notices and terms inquiries.',
  },
  {
    id: 'PH-11',
    token: '[FILL IN: accessibility@yourdomain.edu]',
    pageSlug: 'accessibility' as const,
    description:
      'Contact email address for reporting accessibility barriers or requesting assistive accommodations.',
  },
] as const;

export const ONBOARDING_CONTENT: Record<Locale, OnboardingDictionary> = {
  vi: {
    badgeLabel: 'Hướng dẫn nhanh 3 bước (Có thể bỏ qua)',
    heading: 'Tự học một lĩnh vực mới từ con số 0 với sách thật 100%',
    skipBtn: 'Bỏ qua hướng dẫn',
    prevBtn: 'Bước trước',
    nextBtn: 'Bước tiếp theo',
    finishBtn: 'Bắt đầu khám phá',
    tryExampleHeading: 'Hoặc thử ngay một chủ đề mẫu:',
    reopenGuideBtn: 'Hướng dẫn 3 bước',
    steps: [
      {
        stepNumber: 1,
        title: '01. Chọn chủ đề, trình độ và độ dài sách mong muốn',
        description:
          'Thay vì hỏi bạn đã đọc cuốn sách nào, ShelfPath bắt đầu từ lĩnh vực bạn muốn tự học (bằng tiếng Việt hoặc tiếng Anh). Bạn chỉ cần chọn trình độ hiện tại (Nhập môn, Trung cấp, Nâng cao) và độ dài sách phù hợp.',
        highlightNote:
          'Mẹo: Thanh trượt "Độ phiêu lưu" giúp bạn chọn giữa các giáo trình kinh điển hoặc các góc nhìn liên ngành mới mẻ.',
      },
      {
        stepNumber: 2,
        title: '02. Đối chiếu danh mục kép: Không bao giờ bịa sách',
        description:
          'Mọi cuốn sách ứng viên đều phải vượt qua bước kiểm tra tự động trên Open Library và Google Books. Những cuốn sách không khớp tên, sai tác giả hoặc không có hồ sơ xuất bản thật sẽ bị loại bỏ hoàn toàn.',
        highlightNote:
          'Cam kết Fail-Closed: Nếu cả hai thư mục sách ngừng phản hồi, hệ thống sẽ dừng và thông báo rõ ràng thay vì trả về sách chưa kiểm chứng.',
      },
      {
        stepNumber: 3,
        title: '03. Đọc theo lộ trình từng bước & tinh chỉnh tự nhiên',
        description:
          'Sách đã xác thực được sắp xếp theo thứ tự nên đọc cuốn nào trước, cuốn nào sau kèm giải thích dễ hiểu. Bạn có thể gõ yêu cầu tinh chỉnh như "ngắn hơn", "thực hành nhiều hơn" hoặc lưu vào Kệ sách cá nhân.',
        highlightNote:
          'Bấm vào "Bằng chứng xác thực" trên bất kỳ thẻ sách nào để kiểm tra trực tiếp ISBN và liên kết danh mục gốc.',
      },
    ],
  },
  en: {
    badgeLabel: 'Quick 3-Step Guide (Skippable)',
    heading: 'Teach yourself a new field with 100% catalog-verified books',
    skipBtn: 'Skip guide',
    prevBtn: 'Previous step',
    nextBtn: 'Next step',
    finishBtn: 'Start exploring',
    tryExampleHeading: 'Or try an example topic right away:',
    reopenGuideBtn: '3-Step Guide',
    steps: [
      {
        stepNumber: 1,
        title: '01. Pick a topic, starting level, and preferred book length',
        description:
          'Instead of asking which books you already read, ShelfPath starts from the subject you want to learn (in English or Vietnamese). Set your current level (Beginner, Intermediate, Advanced) and preferred page length.',
        highlightNote:
          'Tip: The "Adventurousness" slider lets you balance canonical textbooks with cross-disciplinary perspectives.',
      },
      {
        stepNumber: 2,
        title: '02. Dual-catalog verification: Zero fabricated books',
        description:
          'Every candidate book must pass automated verification against Open Library and Google Books. Titles that fail title, author, or catalog record checks are discarded before you ever see them.',
        highlightNote:
          'Fail-Closed Trust: If both public book catalogs are unreachable, ShelfPath stops and shows a clear message rather than displaying unverified titles.',
      },
      {
        stepNumber: 3,
        title: '03. Follow the step-by-step roadmap & refine in plain language',
        description:
          'Verified books are arranged into a beginner-to-advanced reading sequence with a clear reason for each step. Refine results naturally ("shorter", "more practical") or save titles to My Shelf.',
        highlightNote:
          'Click "Verification Proof" on any book card to inspect the exact ISBN and source catalog links.',
      },
    ],
  },
};

export const SYSTEM_PAGES_CONTENT: Record<Locale, SystemPagesDictionary> = {
  vi: {
    notFound: {
      codeLabel: 'Lỗi 404 · Không tìm thấy trang',
      title: 'Trang bạn đang tìm không tồn tại trên kệ sách này',
      description:
        'Đường dẫn có thể đã thay đổi hoặc bị nhập sai. Bạn có thể quay về không gian lộ trình đọc sách chính hoặc xem các trang thông tin bên dưới.',
      backHomeCta: 'Về Trang chủ ShelfPath',
      trySampleCta: 'Thử lộ trình mẫu: Học máy',
      helpfulLinksTitle: 'Các trang công khai hữu ích:',
    },
    serverError: {
      codeLabel: 'Lỗi 500 · Sự cố hệ thống tạm thời',
      title: 'Đã xảy ra lỗi ngoài ý muốn khi xử lý yêu cầu',
      description:
        'Hệ thống đã ghi nhận sự cố và ẩn toàn bộ chi tiết kỹ thuật nội bộ để bảo mật. Dữ liệu Kệ sách cá nhân trên trình duyệt của bạn vẫn an toàn. Vui lòng thử tải lại trang hoặc quay về trang chủ.',
      retryCta: 'Thử lại ngay',
      backHomeCta: 'Về Trang chủ ShelfPath',
    },
    footer: {
      productHeading: 'Sản phẩm & Lộ trình',
      trustHeading: 'Phương pháp & Minh bạch',
      legalHeading: 'Pháp lý & Tiếp cận',
      contactLabel: 'Liên hệ (Email):',
      contactEmailPlaceholder: '[FILL IN: contact@yourdomain.edu]',
      languageSwitchLabel: 'Ngôn ngữ đường dẫn:',
      openOnboardingLabel: 'Mở hướng dẫn 3 bước',
      noEndorsementNotice:
        'Dữ liệu thư mục được đối chiếu từ Open Library và Google Books. Dự án độc lập, không có sự bảo trợ hay liên kết thương mại với Open Library, Internet Archive hoặc Google.',
    },
    breadcrumbs: {
      homeLabel: 'Trang chủ',
      ariaLabel: 'Đường dẫn phân cấp (Breadcrumb)',
    },
  },
  en: {
    notFound: {
      codeLabel: 'Error 404 · Page Not Found',
      title: 'The page you are looking for is not on this shelf',
      description:
        'The URL may have changed or been mistyped. Return to the main reading roadmap workspace or explore one of our public documentation pages below.',
      backHomeCta: 'Back to ShelfPath Home',
      trySampleCta: 'Try sample roadmap: Machine Learning',
      helpfulLinksTitle: 'Helpful public pages:',
    },
    serverError: {
      codeLabel: 'Error 500 · Temporary System Error',
      title: 'Something went wrong while processing your request',
      description:
        'Internal stack traces and server details have been hidden for security. Your local My Shelf reading list remains intact in your browser. Please retry or return to the home workspace.',
      retryCta: 'Try again',
      backHomeCta: 'Back to ShelfPath Home',
    },
    footer: {
      productHeading: 'Product & Roadmaps',
      trustHeading: 'Methodology & Trust',
      legalHeading: 'Legal & Accessibility',
      contactLabel: 'Contact (Email):',
      contactEmailPlaceholder: '[FILL IN: contact@yourdomain.edu]',
      languageSwitchLabel: 'Path language:',
      openOnboardingLabel: 'Open 3-step guide',
      noEndorsementNotice:
        'Bibliographic metadata is verified against Open Library and Google Books. ShelfPath is an independent project and implies no endorsement or partnership with Open Library, Internet Archive, or Google.',
    },
    breadcrumbs: {
      homeLabel: 'Home',
      ariaLabel: 'Breadcrumb navigation',
    },
  },
};

export const PUBLIC_PAGES_BY_LOCALE: Record<
  Locale,
  Record<PublicPageSlug, PublicPageContent>
> = {
  vi: {
    'how-it-works': {
      slug: 'how-it-works',
      breadcrumbCategory: 'Sản phẩm',
      kicker: 'Quy trình 6 bước minh bạch',
      title: 'Cách ShelfPath Hoạt Động',
      subtitle:
        'Giải thích chi tiết bằng ngôn ngữ dễ hiểu về 6 bước tìm kiếm, đối chiếu danh mục và sắp xếp lộ trình đọc sách — cùng những điều cơ chế kiểm chứng đảm bảo và không đảm bảo.',
      lastUpdated: 'Cập nhật cho phiên bản cấu trúc API v1',
      contactMailtoHref:
        'mailto:contact@example.com?subject=ShelfPath%20-%20How%20It%20Works',
      contactPlaceholderLabel: '[FILL IN: contact@yourdomain.edu]',
      sixStagesGuarantees: {
        whatVerificationGuaranteesTitle: 'Những gì bước Kiểm chứng ĐẢM BẢO',
        whatVerificationGuarantees: [
          'Tác phẩm và tác giả có hồ sơ thư mục thật trên Open Library và/hoặc Google Books tại thời điểm truy vấn.',
          'Mã ISBN-13 / ISBN-10, năm xuất bản đầu tiên và số trang hiển thị được lấy trực tiếp từ dữ liệu thư mục, không bao giờ do mô hình AI tự sinh ra.',
          'Mọi liên kết kiểm chứng đều trỏ về đúng hồ sơ gốc trên Open Library hoặc Google Books qua giao thức HTTPS an toàn.',
          'Nếu cả hai nguồn dữ liệu sách công khai đều lỗi hoặc không phản hồi, hệ thống ngừng trả kết quả (Fail-Closed) thay vì hiển thị sách chưa được kiểm chứng.',
        ],
        whatVerificationDoesNotGuaranteeTitle:
          'Những gì bước Kiểm chứng KHÔNG ĐẢM BẢO',
        whatVerificationDoesNotGuarantee: [
          'Không đảm bảo nội dung bên trong cuốn sách hoàn toàn không có sai sót học thuật hoặc phù hợp với mọi phong cách học cá nhân.',
          'Không đảm bảo sách hiện còn hàng tại các nhà sách hay thư viện địa phương của bạn.',
          'Thông tin về "Ấn bản Tiếng Việt" là nỗ lực tra cứu tốt nhất (best-effort) dựa trên dữ liệu thư mục hiện có; một số bản dịch xuất bản nội địa có thể chưa được số hóa trên Open Library hoặc Google Books.',
          'Gợi ý lộ trình là tài liệu tham khảo hỗ trợ tự học, không thay thế chương trình đào tạo chính quy hay tư vấn chuyên môn.',
        ],
      },
      sections: [
        {
          id: 'stage-1',
          heading: 'Bước 1: Hiểu chủ đề và chuẩn hóa hồ sơ học tập',
          paragraphs: [
            'Khi bạn nhập một chủ đề (bằng tiếng Việt hoặc tiếng Anh) cùng trình độ hiện tại, độ dài sách ưu tiên, ngôn ngữ ấn bản và mức độ phiêu lưu, máy chủ chuẩn hóa đầu vào và kiểm tra tính hợp lệ nghiêm ngặt bằng lược đồ dữ liệu.',
            'Hệ thống sau đó chuyển chủ đề của bạn thành từ 3 đến 5 truy vấn tìm kiếm chuyên biệt (bao gồm cả biến thể tiếng Việt và tiếng Anh khi cần thiết) để tìm các giáo trình nền tảng, sách thực hành và sách mở rộng.',
          ],
        },
        {
          id: 'stage-2',
          heading: 'Bước 2: Tìm kiếm nối đất trên web (Grounded Web Search)',
          paragraphs: [
            'Thay vì dựa vào trí nhớ tĩnh của mô hình AI — vốn dễ ghép nhầm tên sách với tác giả khác — ShelfPath thực hiện tìm kiếm web thực tế để thu thập danh sách ứng viên từ các đề cương đại học, danh mục thư viện và bài tổng hợp chuyên ngành.',
            'Mọi đoạn trích và đường dẫn nguồn từ kết quả tìm kiếm đều được bọc trong thẻ phân cách dữ liệu không tin cậy để ngăn chặn tấn công chèn lệnh (Prompt Injection) từ nội dung web.',
          ],
        },
        {
          id: 'stage-3',
          heading: 'Bước 3: Trích xuất ứng viên và khử trùng lặp',
          paragraphs: [
            'Hệ thống trích xuất danh sách tối đa 20 ứng viên sách tiềm năng (gồm tên sách, tác giả và mã ISBN nếu có) từ kết quả tìm kiếm.',
            'Các bản ghi trùng lặp hoặc các tài liệu không phải là sách (như bài báo lẻ hay trang blog) được lọc bỏ trước khi chuyển sang cổng kiểm chứng.',
          ],
        },
        {
          id: 'stage-4',
          heading: 'Bước 4: Cổng kiểm chứng thư mục kép (Open Library & Google Books)',
          paragraphs: [
            'Đây là bước quan trọng nhất của ShelfPath. Máy chủ tra cứu từng cuốn sách ứng viên trên Open Library API và Google Books API với bộ điều tiết tần suất tự động.',
            'Một cuốn sách chỉ được thông qua nếu khớp mã ISBN hợp lệ hoặc đạt điểm tương đồng tên sách và tác giả từ 0.62 trở lên. Bất kỳ ứng viên nào không tìm thấy hồ sơ thật sẽ bị loại bỏ và ghi rõ lý do vào nhật ký "Ứng viên đã loại bỏ".',
          ],
        },
        {
          id: 'stage-5',
          heading: 'Bước 5: Đa dạng hóa ngữ nghĩa (MMR) và giải thích dễ hiểu',
          paragraphs: [
            'Để tránh việc gợi ý 4 cuốn sách có nội dung giống hệt nhau, ShelfPath tính toán độ tương đồng ngữ nghĩa (Embeddings) và áp dụng thuật toán Maximal Marginal Relevance (MMR).',
            'Nhờ đó, danh sách cuối cùng vừa bám sát chủ đề bạn chọn, vừa bao phủ nhiều góc tiếp cận (nhập môn trực quan, nền tảng lý thuyết, ứng dụng thực tế). Mỗi cuốn sách đều kèm lời giải thích cụ thể vì sao sách phù hợp với bạn.',
          ],
        },
        {
          id: 'stage-6',
          heading: 'Bước 6: Sắp xếp lộ trình đọc từ cơ bản đến nâng cao & tra cứu ấn bản tiếng Việt',
          paragraphs: [
            'Cuối cùng, các cuốn sách đã kiểm chứng được sắp xếp thành một lộ trình tuần tự (Bước 1, Bước 2, Bước 3...) kèm lý do vì sao bạn nên đọc cuốn này ở bước đó và những kiến thức tiên quyết cần có.',
            'Song song đó, hệ thống kiểm tra xem cuốn sách đã có bản dịch hoặc ấn bản tiếng Việt trên thư mục hay chưa để sinh viên Việt Nam dễ dàng tìm đọc.',
          ],
        },
      ],
    },
    methodology: {
      slug: 'methodology',
      breadcrumbCategory: 'Minh bạch',
      kicker: 'Phương pháp luận & Nguồn dữ liệu',
      title: 'Phương Pháp Kiểm Chứng & Ghi Nhận Nguồn Dữ Liệu',
      subtitle:
        'Cách chúng tôi kết hợp dữ liệu thư mục mở từ Open Library và Google Books với thuật toán xếp hạng đa dạng hóa — hoàn toàn độc lập và minh bạch.',
      lastUpdated: 'Tài liệu phương pháp luận công khai',
      contactMailtoHref:
        'mailto:contact@example.com?subject=ShelfPath%20-%20Methodology',
      contactPlaceholderLabel: '[FILL IN: contact@yourdomain.edu]',
      sections: [
        {
          id: 'data-sources-credit',
          heading: '1. Ghi nhận nguồn dữ liệu: Open Library và Google Books',
          paragraphs: [
            'ShelfPath sử dụng dữ liệu thư mục công khai từ hai nguồn chính để xác thực sự tồn tại của sách: Open Library (một sáng kiến mở của tổ chức phi lợi nhuận Internet Archive) và Google Books API.',
            'Tuyên bố độc lập: ShelfPath là một dự án phần mềm độc lập. Việc sử dụng API công khai của Open Library và Google Books chỉ nhằm mục đích tra cứu thư mục; không hàm ý bất kỳ sự bảo trợ, hợp tác chính thức hay chứng nhận nào từ Open Library, Internet Archive hay Google.',
          ],
          bullets: [
            'Open Library (openlibrary.org): Cung cấp mã định danh tác phẩm (Work ID / Edition ID), năm xuất bản đầu tiên, mã ISBN, ảnh bìa và thông tin ngôn ngữ ấn bản.',
            'Google Books (books.google.com): Cung cấp mã Volume ID, số trang, danh mục chủ đề, tóm tắt xuất bản và đối chiếu chéo khi một cuốn sách chuyên ngành chưa kịp cập nhật trên Open Library.',
          ],
        },
        {
          id: 'matching-rules',
          heading: '2. Quy tắc đối chiếu danh mục và ngưỡng điểm tin cậy',
          paragraphs: [
            'Mỗi ứng viên sách đi qua bộ chuẩn hóa chuỗi (bỏ dấu câu thừa, chuẩn hóa chữ hoa/thường và phụ đề) trước khi so sánh với bản ghi trả về từ Open Library và Google Books.',
          ],
          bullets: [
            'Khớp mức độ cao (Verified High Confidence): Khớp chính xác mã ISBN-13 / ISBN-10 hoặc điểm tương đồng tổng hợp (70% tiêu đề + 30% tác giả) đạt từ 0.85 trở lên trên cả hai nguồn hoặc nguồn chính.',
            'Khớp một nguồn (Verified Single Source): Điểm tương đồng đạt từ 0.62 trở lên với đầy đủ thông tin tác giả hợp lệ trên ít nhất một trong hai danh mục.',
            'Loại bỏ bắt buộc (Rejected Candidate): Điểm tương đồng dưới 0.62, thiếu tác giả khớp, hoặc không tìm thấy bản ghi thư mục. Sách bị loại không bao giờ xuất hiện trong lộ trình.',
          ],
        },
        {
          id: 'ranking-and-mmr',
          heading: '3. Xếp hạng đa dạng hóa với Maximal Marginal Relevance (MMR)',
          paragraphs: [
            'Sau khi lọc ra tập sách đã kiểm chứng, hệ thống kết hợp điểm phù hợp hồ sơ người học (trình độ, độ dài trang, ngôn ngữ ưu tiên) với thuật toán MMR để chọn ra danh sách sách đa dạng, tránh trùng lặp một tác giả hoặc một khía cạnh hẹp.',
            'Khi người dùng bấm "Chưa phù hợp" (Not interested) vào một cuốn sách, vector đặc trưng của cuốn sách đó được lưu tạm trong phiên làm việc để giảm điểm các sách quá giống nó khi tìm sách thay thế.',
          ],
        },
        {
          id: 'respectful-api-usage',
          heading: '4. Tuân thủ giới hạn tần suất với các thư mục mở',
          paragraphs: [
            'Để bảo vệ hạ tầng chung của Open Library và Google Books, máy chủ ShelfPath áp dụng bộ nhớ đệm (TTL 30 phút cho mỗi sách đã xác thực) và hàng đợi điều tiết tần suất nghiêm ngặt (tối đa 3 yêu cầu/giây tới Open Library khi có email định danh, 1 yêu cầu/giây khi ẩn danh, và tối đa 2 yêu cầu/giây tới Google Books).',
          ],
        },
      ],
    },
    about: {
      slug: 'about',
      breadcrumbCategory: 'Dự án',
      kicker: 'Về ShelfPath & Đội ngũ',
      title: 'Về Dự Án ShelfPath',
      subtitle:
        'Xây dựng công cụ lập lộ trình đọc sách tự học trung thực, bình tĩnh và kiểm chứng được cho sinh viên đại học.',
      lastUpdated: 'Thông tin dự án & liên hệ',
      contactMailtoHref:
        'mailto:contact@example.com?subject=ShelfPath%20Inquiry',
      contactPlaceholderLabel: '[FILL IN: contact@yourdomain.edu]',
      sections: [
        {
          id: 'mission',
          heading: '1. Bài toán chúng tôi giải quyết',
          paragraphs: [
            'ShelfPath giúp sinh viên đại học tự học một lĩnh vực mới. Hầu hết các hệ thống gợi ý sách truyền thống đều bắt đầu từ những cuốn sách bạn đã đọc trước đó. Nhưng khi bước vào một ngành học hoàn toàn mới, câu hỏi thực sự của người học là: "Tôi nên đọc cuốn nào đầu tiên, và đọc cuốn nào tiếp theo?"',
            'Các công cụ trò chuyện AI thông thường có thể gợi ý lộ trình rất nhanh nhưng thường xuyên tự bịa tên sách, ghép nhầm tác giả hoặc đưa ra mã ISBN không tồn tại. ShelfPath kết hợp khả năng lập luận lộ trình của AI với cổng kiểm chứng thư mục bắt buộc qua Open Library và Google Books.',
          ],
        },
        {
          id: 'team-and-origin',
          heading: '2. Đội ngũ phát triển và xuất xứ dự án',
          paragraphs: [
            'Thông tin thành viên và đơn vị thực hiện (điền trước khi phát hành chính thức):',
          ],
          bullets: [
            'Thành viên & Vai trò: [FILL IN: Project Lead / Team Member Names & Roles]',
            'Trường / Khoa / Nhóm nghiên cứu: [FILL IN: University, Department, or Independent Lab Name]',
            'Bối cảnh ra đời dự án: [FILL IN: Project Origin Story & Founding Date]',
            'Mã nguồn mở / Kho lưu trữ: [FILL IN: Source Repository URL]',
          ],
        },
        {
          id: 'principles',
          heading: '3. Nguyên tắc thiết kế cốt lõi',
          paragraphs: [
            'Chúng tôi ưu tiên làm ít tính năng nhưng chỉn chu, minh bạch và đáng tin cậy:',
          ],
          bullets: [
            'Không bao giờ bịa đặt: Không bịa tên sách, tác giả, ISBN, số liệu thống kê, số lượng người dùng hay lời khen giả tạo.',
            'Dữ liệu mẫu có nhãn rõ ràng: Mọi dữ liệu minh họa khi chạy chế độ thử nghiệm đều mang nhãn "Dữ liệu mẫu" (Sample data).',
            'Quyền riêng tư ngay từ thiết kế: Không yêu cầu tạo tài khoản, không dùng cookie theo dõi, không thu thập lịch sử đọc cá nhân.',
          ],
        },
        {
          id: 'contact',
          heading: '4. Liên hệ với chúng tôi',
          paragraphs: [
            'Chúng tôi không sử dụng biểu mẫu thu thập dữ liệu trên web. Để gửi góp ý, báo lỗi sách hoặc trao đổi học thuật, vui lòng gửi thư điện tử trực tiếp qua liên kết mailto bên dưới (thay địa chỉ email thật trước khi vận hành):',
            'Địa chỉ liên hệ: [FILL IN: contact@yourdomain.edu]',
          ],
        },
      ],
    },
    faq: {
      slug: 'faq',
      breadcrumbCategory: 'Hỗ trợ',
      kicker: 'Giải đáp thắc mắc thực tế',
      title: 'Câu Hỏi Thường Gặp (FAQ)',
      subtitle:
        '9 câu hỏi thực tế về cách ShelfPath tìm sách, kiểm chứng danh mục, bảo vệ quyền riêng tư và hỗ trợ việc tự học của bạn.',
      lastUpdated: '9 câu hỏi & trả lời chi tiết',
      contactMailtoHref:
        'mailto:contact@example.com?subject=ShelfPath%20FAQ%20Question',
      contactPlaceholderLabel: '[FILL IN: contact@yourdomain.edu]',
      sections: [],
      faqItems: [
        {
          id: 'faq-1',
          category: 'pipeline',
          question:
            '1. Vì sao ShelfPath bắt đầu từ một chủ đề thay vì những cuốn sách tôi đã đọc?',
          answer:
            'Khi bạn bắt đầu tự học một lĩnh vực hoàn toàn mới (ví dụ: Hệ phân tán, Kinh tế học hành vi hay Triết học), bạn chưa có danh sách sách đã đọc trong ngành đó để làm mốc gợi ý. ShelfPath được thiết kế chuyên biệt để trả lời câu hỏi: "Với trình độ hiện tại của tôi, cuốn nào nên đọc đầu tiên để xây nền tảng, và cuốn nào nên đọc tiếp theo?"',
        },
        {
          id: 'faq-2',
          category: 'verification',
          question:
            '2. Làm thế nào ShelfPath ngăn chặn việc AI tự bịa tên sách hoặc mã ISBN giả?',
          answer:
            'AI chỉ đóng vai trò đề xuất ứng viên và giải thích lộ trình, không bao giờ là nguồn xác nhận sách có thật. Mọi ứng viên đều phải đi qua Bước 4 (BookVerifier) để đối chiếu trực tiếp với cơ sở dữ liệu của Open Library và Google Books. Nếu một cuốn sách không khớp hồ sơ thư mục thật, nó sẽ bị loại bỏ tự động và ghi vào danh sách "Ứng viên đã loại bỏ".',
        },
        {
          id: 'faq-3',
          category: 'verification',
          question:
            '3. Điều gì xảy ra nếu cả Open Library và Google Books đều ngừng hoạt động?',
          answer:
            'ShelfPath áp dụng nguyên tắc Fail-Closed (Đóng an toàn khi lỗi). Nếu cả hai danh mục sách công khai đều không thể truy cập hoặc hết thời gian chờ, hệ thống sẽ từ chối trả về kết quả và hiển thị thông báo lỗi rõ ràng kèm nút thử lại — tuyệt đối không bao giờ lén hiển thị sách do AI tự sinh mà chưa qua kiểm chứng.',
        },
        {
          id: 'faq-4',
          category: 'features',
          question:
            '4. Thanh trượt "Độ phiêu lưu" (Adventurousness) thay đổi kết quả như thế nào?',
          answer:
            'Ở mức thấp (0% – 30%), hệ thống ưu tiên các giáo trình nhập môn kinh điển, có cấu trúc bài bản và được trích dẫn rộng rãi. Ở mức cao (70% – 100%), thuật toán xếp hạng MMR tăng trọng số đa dạng hóa để đưa vào các cuốn sách liên ngành, góc nhìn thực nghiệm hoặc các tác phẩm chuyên sâu ít trùng lặp hơn — nhưng 100% vẫn phải qua kiểm chứng danh mục.',
        },
        {
          id: 'faq-5',
          category: 'features',
          question:
            '5. Tính năng Tinh chỉnh bằng ngôn ngữ tự nhiên ("ngắn hơn", "thực hành nhiều hơn") hoạt động ra sao?',
          answer:
            'Khi bạn gõ yêu cầu như "ngắn hơn", "thiên về thực hành" hoặc "cho người mới bắt đầu", hệ thống chuyển văn bản của bạn thành các bộ lọc có cấu trúc (hiển thị dưới dạng thẻ chip có thể bấm xóa). Đầu tiên, hệ thống tái xếp hạng ngay lập tức trên bể sách đã kiểm chứng của phiên hiện tại để bạn thấy kết quả tức thì mà không phải chờ tìm kiếm lại từ đầu.',
        },
        {
          id: 'faq-6',
          category: 'verification',
          question:
            '6. Tôi có thể tìm các cuốn sách đã có bản dịch Tiếng Việt không?',
          answer:
            'Có. Bạn có thể chọn bộ lọc ngôn ngữ "Ưu tiên bản Tiếng Việt" hoặc bấm vào nút "Kiểm tra bản dịch" trên từng thẻ sách. Hệ thống sẽ tra cứu các ấn bản tiếng Việt trên Open Library và Google Books. Lưu ý rằng đây là thông tin nỗ lực tốt nhất (best-effort) dựa trên dữ liệu thư mục quốc tế; một số sách dịch trong nước có thể chưa được cập nhật mã ngôn ngữ trên hai danh mục này.',
        },
        {
          id: 'faq-7',
          category: 'privacy',
          question:
            '7. Danh sách "Kệ sách của tôi" (My Shelf) được lưu ở đâu? Tôi có cần đăng ký tài khoản không?',
          answer:
            'Bạn không cần tạo tài khoản hay đăng nhập. Toàn bộ Kệ sách của tôi (cùng trạng thái Muốn đọc / Đang đọc / Đã xong và thứ tự ưu tiên) được lưu cục bộ ngay trên trình duyệt của bạn (localStorage) kèm bộ nhớ dự phòng trong phiên làm việc.',
        },
        {
          id: 'faq-8',
          category: 'privacy',
          question:
            '8. ShelfPath có sử dụng cookie theo dõi hay lưu lịch sử tìm kiếm cá nhân của tôi không?',
          answer:
            'Không. ShelfPath không sử dụng cookie quảng cáo, không gắn mã theo dõi của bên thứ ba và không lưu nội dung chủ đề hay văn bản tinh chỉnh của bạn vào nhật ký máy chủ. Địa chỉ IP chỉ được băm ẩn danh kèm muối xoay vòng hàng ngày (daily rotating salted hash) để giới hạn tần suất chống lạm dụng API.',
        },
        {
          id: 'faq-9',
          category: 'features',
          question:
            '9. Làm sao để xuất hoặc lưu trữ lộ trình đọc sách của tôi lâu dài?',
          answer:
            'Trong tab "Kệ sách của tôi", bạn có thể sao chép toàn bộ lộ trình sang định dạng Markdown (phù hợp với Notion, Obsidian, GitHub), tải xuống tệp JSON có cấu trúc, hoặc bấm "In / Lưu PDF" để xuất bản in sạch đẹp kèm đầy đủ mã ISBN và liên kết kiểm chứng.',
        },
      ],
    },
    privacy: {
      slug: 'privacy',
      breadcrumbCategory: 'Pháp lý',
      kicker: 'Quyền riêng tư ngay từ thiết kế (Privacy by Design)',
      title: 'Chính Sách Quyền Riêng Tư',
      subtitle:
        'Cam kết bảo vệ quyền riêng tư bằng ngôn ngữ rõ ràng: không cookie, không trình theo dõi, không thu thập dữ liệu cá nhân.',
      lastUpdated: 'Bản dự thảo cần rà soát pháp lý trước khi vận hành chính thức',
      requiresLegalReviewBanner: true,
      legalReviewBannerText:
        'Lưu ý quan trọng: Trang pháp lý này là bản mẫu minh bạch kỹ thuật và cần được rà soát bởi chuyên gia pháp lý có thẩm quyền trước khi phát hành thương mại hoặc công cộng rộng rãi.',
      contactMailtoHref:
        'mailto:privacy@example.com?subject=ShelfPath%20Privacy%20Inquiry',
      contactPlaceholderLabel: '[FILL IN: privacy@yourdomain.edu]',
      sections: [
        {
          id: 'controller-info',
          heading: '1. Đơn vị vận hành và thông tin liên hệ về quyền riêng tư',
          paragraphs: [
            'Thông tin đơn vị quản lý dữ liệu (cần điền đầy đủ trước khi phát hành):',
          ],
          bullets: [
            'Tên pháp nhân / Cá nhân vận hành: [FILL IN: Data Controller / Operator Full Legal Name]',
            'Địa chỉ / Quốc gia hoạt động: [FILL IN: Postal Address or Country of Operation]',
            'Email liên hệ về quyền riêng tư: [FILL IN: privacy@yourdomain.edu]',
          ],
        },
        {
          id: 'what-we-do-not-collect',
          heading: '2. Những dữ liệu chúng tôi KHÔNG thu thập',
          paragraphs: [
            'ShelfPath được thiết kế theo nguyên tắc tối thiểu hóa dữ liệu tuyệt đối:',
          ],
          bullets: [
            'Không yêu cầu tài khoản, tên, email, số điện thoại hay thông tin định danh cá nhân.',
            'Không đặt bất kỳ cookie theo dõi, cookie phiên hay tập lệnh phân tích hành vi (analytics/pixels) nào của bên thứ ba.',
            'Không ghi lại nội dung chủ đề tìm kiếm hoặc văn bản tinh chỉnh của bạn vào nhật ký máy chủ (server logs).',
          ],
        },
        {
          id: 'transient-processing',
          heading: '3. Xử lý dữ liệu tạm thời để tạo lộ trình và chống lạm dụng',
          paragraphs: [
            'Khi bạn bấm tạo lộ trình hoặc tinh chỉnh kết quả, chủ đề bạn nhập được gửi tới máy chủ để thực hiện truy vấn tìm kiếm qua Google Gemini API và đối chiếu danh mục sách trên Open Library / Google Books.',
            'Để bảo vệ hệ thống khỏi các cuộc tấn công làm cạn kiệt ngân sách API, địa chỉ IP của kết nối chỉ được băm một chiều (SHA-256) kèm chuỗi muối tự động xoay vòng mỗi ngày (daily rotating salt). Chúng tôi không lưu địa chỉ IP thô.',
          ],
        },
        {
          id: 'local-browser-storage',
          heading: '4. Dữ liệu lưu cục bộ trên trình duyệt của bạn',
          paragraphs: [
            'Các tùy chọn giao diện (Sáng/Tối, ngôn ngữ Tiếng Việt/Tiếng Anh), trạng thái đã xem hướng dẫn 3 bước và danh sách "Kệ sách của tôi" được lưu trực tiếp trong bộ nhớ cục bộ (localStorage) trên thiết bị của bạn. Bạn có thể xóa toàn bộ dữ liệu này bất cứ lúc nào bằng nút "Xóa toàn bộ kệ" hoặc xóa dữ liệu trang web trên trình duyệt.',
          ],
        },
      ],
    },
    terms: {
      slug: 'terms',
      breadcrumbCategory: 'Pháp lý',
      kicker: 'Điều khoản sử dụng & Tuyên bố miễn trừ',
      title: 'Điều Khoản Sử Dụng & Miễn Trừ Trách Nhiệm',
      subtitle:
        'Quy định sử dụng công bằng hệ thống ShelfPath và giới hạn trách nhiệm đối với các gợi ý sách tự học.',
      lastUpdated: 'Bản dự thảo cần rà soát pháp lý trước khi vận hành chính thức',
      requiresLegalReviewBanner: true,
      legalReviewBannerText:
        'Lưu ý quan trọng: Trang Điều khoản và Miễn trừ trách nhiệm này cần được rà soát và phê duyệt bởi luật sư hoặc người có chuyên môn pháp lý phù hợp với quốc gia sở tại trước khi ra mắt chính thức.',
      contactMailtoHref:
        'mailto:legal@example.com?subject=ShelfPath%20Legal%20Inquiry',
      contactPlaceholderLabel: '[FILL IN: legal@yourdomain.edu]',
      sections: [
        {
          id: 'educational-disclaimer',
          heading: '1. Miễn trừ trách nhiệm: Gợi ý mang tính tham khảo học tập',
          paragraphs: [
            'Mọi lộ trình đọc sách, lời giải thích độ phù hợp và thứ tự bước đọc trên ShelfPath đều là gợi ý tham khảo nhằm hỗ trợ việc tự học, không phải là lời khuyên học thuật bắt buộc, tư vấn tài chính, y tế, pháp lý hay bảo đảm kết quả đầu ra.',
            'Mặc dù hệ thống kiểm chứng sự tồn tại của từng cuốn sách trên Open Library và Google Books, chúng tôi không chịu trách nhiệm về nội dung chi tiết bên trong sách của các tác giả và nhà xuất bản bên thứ ba.',
          ],
        },
        {
          id: 'best-effort-availability',
          heading: '2. Thông tin ấn bản và tính sẵn có là nỗ lực tốt nhất (Best Effort)',
          paragraphs: [
            'Thông tin về số trang, năm xuất bản, mã ISBN và đặc biệt là trạng thái "Ấn bản Tiếng Việt" được tổng hợp tự động theo nỗ lực tốt nhất (best-effort) từ dữ liệu công khai của Open Library và Google Books tại thời điểm truy vấn.',
            'Dữ liệu thư mục có thể thay đổi hoặc chưa đầy đủ; người học nên kiểm tra lại mã ISBN trước khi mua hoặc mượn sách.',
          ],
        },
        {
          id: 'acceptable-use',
          heading: '3. Quy tắc sử dụng công bằng và bảo vệ hệ thống',
          paragraphs: [
            'Khi sử dụng ShelfPath, bạn đồng ý không thực hiện các hành vi tự động hóa thu thập dữ liệu (scraping) hàng loạt, không tìm cách vượt qua giới hạn tần suất (rate limits) và không gửi các chuỗi tấn công nhằm khai thác máy chủ hoặc làm ảnh hưởng tới dịch vụ của Open Library và Google Books.',
          ],
        },
        {
          id: 'governing-law',
          heading: '4. Luật điều chỉnh và thông tin pháp lý',
          paragraphs: [
            'Thông tin pháp nhân và luật điều chỉnh (cần điền trước khi vận hành):',
          ],
          bullets: [
            'Đơn vị chủ quản: [FILL IN: Data Controller / Operator Full Legal Name]',
            'Luật điều chỉnh & Tòa án có thẩm quyền: [FILL IN: Governing Law Country / State & Competent Court]',
            'Email liên hệ pháp lý: [FILL IN: legal@yourdomain.edu]',
          ],
        },
      ],
    },
    accessibility: {
      slug: 'accessibility',
      breadcrumbCategory: 'Tiếp cận',
      kicker: 'Thiết kế tiếp cận cho mọi người học',
      title: 'Tuyên Bố Về Khả Năng Tiếp Cận (Accessibility)',
      subtitle:
        'Cam kết tuân thủ chuẩn WCAG 2.2 AA về điều hướng bàn phím, trình đọc màn hình, độ tương phản và chế độ thay thế 2D cho không gian 3D.',
      lastUpdated: 'Chuẩn mục tiêu: WCAG 2.2 Mức AA',
      contactMailtoHref:
        'mailto:accessibility@example.com?subject=ShelfPath%20Accessibility%20Feedback',
      contactPlaceholderLabel: '[FILL IN: accessibility@yourdomain.edu]',
      sections: [
        {
          id: 'commitment',
          heading: '1. Cam kết tiếp cận của ShelfPath',
          paragraphs: [
            'ShelfPath hướng tới việc mọi sinh viên và người tự học — bao gồm người sử dụng trình đọc màn hình, người chỉ điều hướng bằng bàn phím và người nhạy cảm với chuyển động — đều có thể tra cứu và xây dựng lộ trình đọc sách một cách trọn vẹn.',
          ],
        },
        {
          id: 'implemented-features',
          heading: '2. Các tính năng hỗ trợ tiếp cận đã triển khai',
          paragraphs: [
            'Giao diện của chúng tôi tích hợp sẵn các cơ chế tiếp cận sau ở cả hai ngôn ngữ (Tiếng Việt & Tiếng Anh) và hai giao diện (Giấy ấm & Mực tối):',
          ],
          bullets: [
            'Liên kết bỏ qua điều hướng (Skip to main content) xuất hiện ngay khi nhấn phím Tab đầu tiên.',
            'Tương đương 2D đầy đủ cho không gian 3D: Mọi thông tin trên kệ sách 3D và đường dẫn 3D "The Path" đều có danh sách lộ trình 2D chuẩn ngữ nghĩa HTML (<ol>, <li>) hiển thị song song hoặc chuyển đổi một chạm.',
            'Tôn trọng tùy chọn giảm chuyển động (prefers-reduced-motion: reduce): Tự động tắt hiệu ứng xoay 3D liên tục và chuyển sang chế độ danh sách 2D tĩnh khi hệ điều hành bật giảm chuyển động.',
            'Thông báo trực tiếp cho trình đọc màn hình (aria-live="polite") khi luồng kiểm chứng sách cập nhật từng bước hoặc khi lọc kết quả.',
            'Vùng chạm tối thiểu 44×44 px cho các nút tương tác trên thiết bị di động và vòng lấy nét (focus-visible) rõ ràng.',
          ],
        },
        {
          id: 'known-limitations',
          heading: '3. Giới hạn đã biết và hướng khắc phục',
          paragraphs: [
            'Trên các thiết bị không có bộ xử lý đồ họa (GPU) hoặc trình duyệt tắt WebGL, khung cảnh 3D có thể hiển thị ở tốc độ khung hình thấp hơn. Người dùng luôn có thể bấm nút "Danh sách Lộ trình 2D" để làm việc với tốc độ phản hồi tức thì.',
          ],
        },
        {
          id: 'feedback-contact',
          heading: '4. Phản hồi và yêu cầu hỗ trợ tiếp cận',
          paragraphs: [
            'Nếu bạn gặp bất kỳ rào cản nào khi sử dụng ShelfPath bằng công nghệ hỗ trợ, vui lòng liên hệ với chúng tôi qua email bên dưới:',
            'Email hỗ trợ tiếp cận: [FILL IN: accessibility@yourdomain.edu]',
          ],
        },
      ],
    },
  },
  en: {
    'how-it-works': {
      slug: 'how-it-works',
      breadcrumbCategory: 'Product',
      kicker: 'Transparent 6-Stage Pipeline',
      title: 'How ShelfPath Works',
      subtitle:
        'A plain-language walkthrough of our six-stage search, catalog verification, and roadmap sequencing pipeline — plus what verification does and does not guarantee.',
      lastUpdated: 'Updated for API Contract v1',
      contactMailtoHref:
        'mailto:contact@example.com?subject=ShelfPath%20-%20How%20It%20Works',
      contactPlaceholderLabel: '[FILL IN: contact@yourdomain.edu]',
      sixStagesGuarantees: {
        whatVerificationGuaranteesTitle: 'What Verification GUARANTEES',
        whatVerificationGuarantees: [
          'The book title and author correspond to a real bibliographic record in Open Library and/or Google Books at the time of query.',
          'Displayed ISBN-13 / ISBN-10 identifiers, first publish year, and page counts come from catalog metadata — never invented by the AI model.',
          'Every verification link points directly to the official Open Library or Google Books record over HTTPS.',
          'If both public book catalogs fail or time out, the system fails closed and shows a clear status message rather than returning unverified books.',
        ],
        whatVerificationDoesNotGuaranteeTitle:
          'What Verification DOES NOT Guarantee',
        whatVerificationDoesNotGuarantee: [
          'It does not guarantee that the internal text of a book is free of academic errors or suited to every individual learning style.',
          'It does not guarantee local bookstore stock, library lending availability, or pricing.',
          'Vietnamese edition information is provided on a best-effort basis from catalog records; some locally published translations may not yet be indexed in Open Library or Google Books.',
          'Reading roadmaps are educational suggestions for self-learners, not accredited academic curricula or professional advice.',
        ],
      },
      sections: [
        {
          id: 'stage-1',
          heading: 'Stage 1: Query Understanding & Profile Normalization',
          paragraphs: [
            'When you enter a topic (in English or Vietnamese) along with your starting level, preferred book length, language preference, and adventurousness level, the server validates and normalizes your profile using strict schemas.',
            'It then expands your topic into 3 to 5 focused web search queries (including English and Vietnamese variants when relevant) to surface foundational textbooks, practical guides, and broader perspectives.',
          ],
        },
        {
          id: 'stage-2',
          heading: 'Stage 2: Grounded Web Search',
          paragraphs: [
            'Instead of relying solely on an AI model’s static memory — which frequently conflates book titles and authors — ShelfPath uses Google Search grounding to gather candidate titles mentioned in university syllabi, reading lists, and domain bibliographies.',
            'All search snippets and URLs are isolated inside untrusted data delimiters so external web text can never override system rules.',
          ],
        },
        {
          id: 'stage-3',
          heading: 'Stage 3: Candidate Extraction & Deduplication',
          paragraphs: [
            'The system extracts up to 20 candidate books (title, author, and optional ISBN) from the grounded search evidence.',
            'Duplicate editions and non-book web pages are filtered out before candidates reach the verification gate.',
          ],
        },
        {
          id: 'stage-4',
          heading: 'Stage 4: Dual-Catalog Verification Gate (Open Library & Google Books)',
          paragraphs: [
            'Every candidate book is checked against the Open Library API and the Google Books API using rate-limited requests.',
            'A candidate passes only if it matches a valid ISBN record or achieves a normalized title-and-author similarity score of at least 0.62. Any candidate that fails is discarded and logged transparently under "Rejected Candidates" with its exact failure reason.',
          ],
        },
        {
          id: 'stage-5',
          heading: 'Stage 5: Semantic Diversity (MMR) & Plain-Language Explanations',
          paragraphs: [
            'To prevent recommending four nearly identical textbooks, ShelfPath computes semantic embeddings for the verified books and applies Maximal Marginal Relevance (MMR).',
            'This balances topic relevance with diversity across subtopics and authors. Each selected book receives a plain-language explanation of why it matches your level and goals.',
          ],
        },
        {
          id: 'stage-6',
          heading: 'Stage 6: Beginner-to-Advanced Reading Roadmap & Vietnamese Edition Lookup',
          paragraphs: [
            'Finally, verified books are arranged into a logical reading sequence (Step 1, Step 2, Step 3...) with a clear explanation of why each book belongs at that step and what prerequisites it assumes.',
            'In parallel, the catalog checker looks up whether a Vietnamese edition or translation is recorded in Open Library or Google Books.',
          ],
        },
      ],
    },
    methodology: {
      slug: 'methodology',
      breadcrumbCategory: 'Transparency',
      kicker: 'Methodology & Data Sources',
      title: 'Verification Methodology & Data Source Attribution',
      subtitle:
        'How we combine public bibliographic records from Open Library and Google Books with diversity-aware ranking — accurately credited and independent.',
      lastUpdated: 'Public Methodology Documentation',
      contactMailtoHref:
        'mailto:contact@example.com?subject=ShelfPath%20-%20Methodology',
      contactPlaceholderLabel: '[FILL IN: contact@yourdomain.edu]',
      sections: [
        {
          id: 'data-sources-credit',
          heading: '1. Data Sources: Open Library and Google Books Attribution',
          paragraphs: [
            'ShelfPath verifies book existence and bibliographic metadata using two public catalog APIs: Open Library (an open project of the non-profit Internet Archive) and the Google Books API.',
            'No Endorsement or Partnership: ShelfPath is an independent project. Our use of the Open Library and Google Books APIs is strictly for bibliographic verification and implies no endorsement, sponsorship, or partnership by Open Library, the Internet Archive, or Google.',
          ],
          bullets: [
            'Open Library (openlibrary.org): Provides Work IDs, Edition IDs, first publication years, ISBNs, cover images, and edition language records.',
            'Google Books (books.google.com): Provides Volume IDs, page counts, subject categories, publisher descriptions, and secondary verification when a specialized title is not yet indexed in Open Library.',
          ],
        },
        {
          id: 'matching-rules',
          heading: '2. Matching Rules & Confidence Thresholds',
          paragraphs: [
            'Each candidate title and author string is normalized (stripping subtitles, punctuation, and case differences) before comparing against catalog responses.',
          ],
          bullets: [
            'Verified High Confidence: Exact ISBN-13 / ISBN-10 match or a combined similarity score (70% title similarity + 30% author similarity) of 0.85 or higher across catalog records.',
            'Verified Single Source: Combined similarity score of 0.62 or higher with a verified author match in either Open Library or Google Books.',
            'Rejected Candidate: Similarity below 0.62, mismatched author, or zero catalog hits. Rejected candidates are never shown as recommendations.',
          ],
        },
        {
          id: 'ranking-and-mmr',
          heading: '3. Diversity-Aware Ranking via Maximal Marginal Relevance (MMR)',
          paragraphs: [
            'Once candidates pass verification, ShelfPath combines learner profile fit (level alignment, page length preference, language availability) with MMR to penalize near-duplicate books and single-author dominance.',
            'When you click "Not interested" on a book, its embedding acts as a session-only avoid signal so replacement books steer away from similar angles.',
          ],
        },
        {
          id: 'respectful-api-usage',
          heading: '4. Respectful Rate Pacing & Caching',
          paragraphs: [
            'To be a responsible consumer of public library infrastructure, ShelfPath caches verified book records (30-minute TTL) and paces outgoing requests (at most 3 req/s to Open Library when a contact email header is configured, 1 req/s when anonymous, and at most 2 req/s to Google Books).',
          ],
        },
      ],
    },
    about: {
      slug: 'about',
      breadcrumbCategory: 'Project',
      kicker: 'About ShelfPath & The Team',
      title: 'About ShelfPath',
      subtitle:
        'Building a calm, honest, and catalog-verified reading roadmap tool for university students teaching themselves a new field.',
      lastUpdated: 'Project & Contact Information',
      contactMailtoHref:
        'mailto:contact@example.com?subject=ShelfPath%20Inquiry',
      contactPlaceholderLabel: '[FILL IN: contact@yourdomain.edu]',
      sections: [
        {
          id: 'mission',
          heading: '1. The Problem We Solve',
          paragraphs: [
            'ShelfPath helps university students teach themselves a new field. Most book recommenders start from books you have already read. When you are entering an unfamiliar subject from scratch, the real question is: "What should I read first, and what comes next?"',
            'General-purpose AI chat tools can suggest reading lists quickly, but they frequently fabricate book titles, mix up authors, or invent ISBNs. ShelfPath pairs topic-first roadmap reasoning with mandatory dual-catalog verification against Open Library and Google Books.',
          ],
        },
        {
          id: 'team-and-origin',
          heading: '2. Project Team & Institutional Context',
          paragraphs: [
            'Project team and institutional facts (fill in before public launch):',
          ],
          bullets: [
            'Team Members & Roles: [FILL IN: Project Lead / Team Member Names & Roles]',
            'Institution / Department / Lab: [FILL IN: University, Department, or Independent Lab Name]',
            'Project Origin & Date: [FILL IN: Project Origin Story & Founding Date]',
            'Source Code Repository: [FILL IN: Source Repository URL]',
          ],
        },
        {
          id: 'principles',
          heading: '3. Core Product Principles',
          paragraphs: [
            'We prefer fewer features built with honesty and precision over many features built loosely:',
          ],
          bullets: [
            'Zero fabrication: We never invent books, authors, ISBNs, user counts, statistics, testimonials, or awards.',
            'Explicit sample labels: Whenever sample or offline demo data is displayed, it is clearly labelled "Sample data".',
            'Privacy by design: No user accounts, no tracking cookies, and no logging of personal reading queries.',
          ],
        },
        {
          id: 'contact',
          heading: '4. Contact Us',
          paragraphs: [
            'We do not use web contact forms that store personal messages on a server. To send feedback, report a catalog discrepancy, or get in touch, please email us directly via the mailto link below (replace placeholder before launch):',
            'Contact email: [FILL IN: contact@yourdomain.edu]',
          ],
        },
      ],
    },
    faq: {
      slug: 'faq',
      breadcrumbCategory: 'Support',
      kicker: 'Plain-Language Answers',
      title: 'Frequently Asked Questions (FAQ)',
      subtitle:
        '9 real questions and plain-language answers about how ShelfPath searches, verifies books, protects privacy, and builds reading roadmaps.',
      lastUpdated: '9 Real Questions & Answers',
      contactMailtoHref:
        'mailto:contact@example.com?subject=ShelfPath%20FAQ%20Question',
      contactPlaceholderLabel: '[FILL IN: contact@yourdomain.edu]',
      sections: [],
      faqItems: [
        {
          id: 'faq-1',
          category: 'pipeline',
          question:
            '1. Why does ShelfPath start from a topic instead of books I have already read?',
          answer:
            'When you are teaching yourself a brand-new subject (such as Distributed Systems, Behavioral Economics, or Philosophy), you rarely have a list of prior books in that field to seed a recommender. ShelfPath starts directly from your topic and current level to answer: "What should I read first to build a foundation, and what comes next?"',
        },
        {
          id: 'faq-2',
          category: 'verification',
          question:
            '2. How does ShelfPath prevent AI-hallucinated books and fake ISBNs?',
          answer:
            'The AI model is never trusted as a source of bibliographic truth. Every candidate book must pass Stage 4 (BookVerifier), which checks the title, author, and ISBN directly against the Open Library and Google Books APIs. Any candidate that fails verification is discarded before ranking and listed transparently in the "Rejected Candidates" drawer.',
        },
        {
          id: 'faq-3',
          category: 'verification',
          question:
            '3. What happens if both Open Library and Google Books are unreachable?',
          answer:
            'ShelfPath enforces a strict fail-closed policy. If both external book catalogs time out or return errors, the server stops and displays a clear service outage message with a retry button — it never falls back to showing unverified AI-generated book titles.',
        },
        {
          id: 'faq-4',
          category: 'features',
          question:
            '4. What does the "Adventurousness" slider actually change?',
          answer:
            'At lower settings (0% – 30%), ranking favors foundational, widely cited textbooks that match your exact topic closely. At higher settings (70% – 100%), our Maximal Marginal Relevance (MMR) ranker increases diversity weight to include cross-disciplinary or practical companion titles — while still requiring 100% catalog verification.',
        },
        {
          id: 'faq-5',
          category: 'features',
          question:
            '5. How does Natural-Language Refinement ("shorter", "more practical") work?',
          answer:
            'When you type a refinement phrase like "shorter", "more practical", or "beginner friendly", ShelfPath converts your text into structured adjustment chips that you can inspect or remove. It first re-ranks the already verified book pool instantaneously, and only runs an extra search if the verified pool is too small.',
        },
        {
          id: 'faq-6',
          category: 'verification',
          question:
            '6. Can I find books that have a Vietnamese edition or translation?',
          answer:
            'Yes. You can set the book language filter to "Prefer Vietnamese" or click "Check Vietnamese Edition" on any book card. ShelfPath queries Open Library and Google Books for Vietnamese-language editions. Note that availability is best-effort based on international catalog metadata; some local translations may not yet be indexed.',
        },
        {
          id: 'faq-7',
          category: 'privacy',
          question:
            '7. Where is my "My Shelf" reading list stored, and do I need an account?',
          answer:
            'No account or sign-in is required. Your saved books, reading status (To Read, Reading, Done), and custom order are stored locally in your browser’s localStorage with an in-memory fallback if browser storage is disabled.',
        },
        {
          id: 'faq-8',
          category: 'privacy',
          question:
            '8. Does ShelfPath track my personal data, search history, or use cookies?',
          answer:
            'No. ShelfPath sets zero cookies, uses zero third-party analytics or tracking scripts, and never logs your topic text or refinement inputs on the server. Client IP addresses are processed only as a transient daily-rotating salted hash for rate limiting.',
        },
        {
          id: 'faq-9',
          category: 'features',
          question:
            '9. How can I export or share my reading roadmap?',
          answer:
            'Open the "My Shelf" tab to copy your roadmap as clean Markdown (ready for Notion, Obsidian, or GitHub), download a structured JSON file, or click "Print / Save PDF" for a clean print-formatted reading sheet with full ISBNs and catalog proof links.',
        },
      ],
    },
    privacy: {
      slug: 'privacy',
      breadcrumbCategory: 'Legal',
      kicker: 'Privacy by Design',
      title: 'Privacy Policy',
      subtitle:
        'Plain-language privacy commitments: zero cookies, zero tracking scripts, zero personal data collection.',
      lastUpdated: 'Draft template — requires qualified legal review before launch',
      requiresLegalReviewBanner: true,
      legalReviewBannerText:
        'Important Notice: This legal page is a draft technical disclosure and must be reviewed by a qualified legal professional before public or commercial launch.',
      contactMailtoHref:
        'mailto:privacy@example.com?subject=ShelfPath%20Privacy%20Inquiry',
      contactPlaceholderLabel: '[FILL IN: privacy@yourdomain.edu]',
      sections: [
        {
          id: 'controller-info',
          heading: '1. Data Controller & Privacy Contact Information',
          paragraphs: [
            'Operator details (must be completed before public launch):',
          ],
          bullets: [
            'Operator / Legal Entity Name: [FILL IN: Data Controller / Operator Full Legal Name]',
            'Registered Address / Country: [FILL IN: Postal Address or Country of Operation]',
            'Privacy Contact Email: [FILL IN: privacy@yourdomain.edu]',
          ],
        },
        {
          id: 'what-we-do-not-collect',
          heading: '2. Information We Do NOT Collect',
          paragraphs: [
            'ShelfPath is engineered around strict data minimization:',
          ],
          bullets: [
            'We do not offer user accounts or collect names, email addresses, phone numbers, or personal identifiers.',
            'We do not set tracking cookies, session cookies, or third-party analytics/advertising pixels.',
            'We do not log your raw topic queries or refinement text in server logs.',
          ],
        },
        {
          id: 'transient-processing',
          heading: '3. Transient Processing for Roadmaps & Abuse Protection',
          paragraphs: [
            'When you request a reading roadmap or refine results, your topic preferences are sent to our server to query the Google Gemini API and verify candidate books against the Open Library and Google Books APIs.',
            'To protect public endpoints from automated abuse, the client IP address is converted into a transient SHA-256 hash using a daily-rotating server salt for rate-limit counters. Raw IP addresses are never stored.',
          ],
        },
        {
          id: 'local-browser-storage',
          heading: '4. Local Browser Storage',
          paragraphs: [
            'Your display preferences (Light/Dark theme, English/Vietnamese language), 3-step onboarding completion flag, and "My Shelf" reading list are saved locally in your browser’s localStorage. You can clear them at any time using the "Clear Shelf" button or your browser settings.',
          ],
        },
      ],
    },
    terms: {
      slug: 'terms',
      breadcrumbCategory: 'Legal',
      kicker: 'Terms of Use & Disclaimer',
      title: 'Terms of Use & Disclaimer',
      subtitle:
        'Plain-language terms for using ShelfPath, including our educational disclaimer and best-effort catalog availability notice.',
      lastUpdated: 'Draft template — requires qualified legal review before launch',
      requiresLegalReviewBanner: true,
      legalReviewBannerText:
        'Important Notice: These Terms of Use and Disclaimers must be reviewed by a qualified legal professional in your jurisdiction before public launch.',
      contactMailtoHref:
        'mailto:legal@example.com?subject=ShelfPath%20Legal%20Inquiry',
      contactPlaceholderLabel: '[FILL IN: legal@yourdomain.edu]',
      sections: [
        {
          id: 'educational-disclaimer',
          heading: '1. Disclaimer: Recommendations Are Suggestions, Not Guarantees',
          paragraphs: [
            'All reading roadmaps, book rankings, level labels, and explanations provided by ShelfPath are educational suggestions intended to help self-learners explore a topic. They are not academic, financial, medical, legal, or professional guarantees.',
            'While ShelfPath verifies that every recommended book exists in Open Library and/or Google Books, we do not control or guarantee the accuracy, completeness, or suitability of third-party books written by external authors and publishers.',
          ],
        },
        {
          id: 'best-effort-availability',
          heading: '2. Best-Effort Catalog & Edition Availability',
          paragraphs: [
            'Bibliographic metadata (page counts, publication years, ISBNs, cover images) and Vietnamese edition availability are provided on a best-effort basis using live data from Open Library and Google Books.',
            'Catalog records may contain publisher omissions or updates; please verify the ISBN before purchasing or borrowing a physical copy.',
          ],
        },
        {
          id: 'acceptable-use',
          heading: '3. Acceptable Use & Rate Limits',
          paragraphs: [
            'You agree not to scrape ShelfPath endpoints, bypass rate limits, or submit automated requests designed to exhaust API budgets or disrupt Open Library and Google Books services.',
          ],
        },
        {
          id: 'governing-law',
          heading: '4. Operator Identity & Governing Law',
          paragraphs: [
            'Legal entity and jurisdiction details (fill in before launch):',
          ],
          bullets: [
            'Operator / Legal Entity: [FILL IN: Data Controller / Operator Full Legal Name]',
            'Governing Law & Jurisdiction: [FILL IN: Governing Law Country / State & Competent Court]',
            'Legal Contact Email: [FILL IN: legal@yourdomain.edu]',
          ],
        },
      ],
    },
    accessibility: {
      slug: 'accessibility',
      breadcrumbCategory: 'Accessibility',
      kicker: 'Inclusive Self-Learning Design',
      title: 'Accessibility Statement',
      subtitle:
        'Our commitment to WCAG 2.2 AA accessibility across keyboard navigation, screen readers, visual contrast, and 2D equivalents for 3D views.',
      lastUpdated: 'Target Conformance: WCAG 2.2 Level AA',
      contactMailtoHref:
        'mailto:accessibility@example.com?subject=ShelfPath%20Accessibility%20Feedback',
      contactPlaceholderLabel: '[FILL IN: accessibility@yourdomain.edu]',
      sections: [
        {
          id: 'commitment',
          heading: '1. Our Commitment to Accessibility',
          paragraphs: [
            'ShelfPath is built so that university students and self-learners — including keyboard-only users, screen-reader users, and learners sensitive to visual motion — can discover and verify reading roadmaps without barriers.',
          ],
        },
        {
          id: 'implemented-features',
          heading: '2. Accessibility Features Implemented',
          paragraphs: [
            'Every screen in both English and Vietnamese and both Warm Paper and Dark Ink themes includes:',
          ],
          bullets: [
            'A keyboard "Skip to main content" link revealed on initial Tab focus.',
            'Full 2D semantic HTML equivalents for all 3D views: Both the 3D Hero Shelf and the 3D "The Path" roadmap have an identical 2D ordered list (<ol>, <li>) carrying the exact same step order, reasons, and actions.',
            'Automatic support for prefers-reduced-motion: Continuous 3D animations pause and the roadmap view defaults to the static 2D list when reduced motion is enabled in your operating system.',
            'Polite screen-reader live regions (aria-live="polite") announcing pipeline verification progress and filter changes.',
            'Minimum 44×44 px touch targets on mobile controls and high-contrast focus rings.',
          ],
        },
        {
          id: 'known-limitations',
          heading: '3. Known Limitations',
          paragraphs: [
            'On devices without hardware WebGL acceleration, the 3D canvas may render at a reduced frame rate. Users can switch to the "2D Roadmap List" at any time with a single click or keyboard press.',
          ],
        },
        {
          id: 'feedback-contact',
          heading: '4. Accessibility Feedback & Contact',
          paragraphs: [
            'If you encounter an accessibility barrier on ShelfPath or need assistance, please contact us via email:',
            'Accessibility Contact Email: [FILL IN: accessibility@yourdomain.edu]',
          ],
        },
      ],
    },
  },
};
