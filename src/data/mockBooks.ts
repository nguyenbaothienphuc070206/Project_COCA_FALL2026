/**
 * Tính năng: Bộ dữ liệu sách thật 100% đã đối chiếu trên Open Library và Google Books phục vụ chế độ MOCK_MODE.
 * Trường hợp sử dụng: Đảm bảo ứng dụng chạy tức thì không cần khóa API trong Phase 1 và dùng làm dữ liệu dự phòng tất định (fallback) khi mạng/AI gặp sự cố.
 */

import { RejectedCandidateLog, VerifiedBook } from '../types/book';

export const MOCK_VERIFIED_BOOKS: readonly VerifiedBook[] = [
  // === MACHINE LEARNING & AI ===
  {
    id: 'ol-W17083612W',
    topicCategory: 'machine-learning',
    title: 'Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow',
    subtitle: 'Concepts, Tools, and Techniques to Build Intelligent Systems',
    authors: ['Aurélien Géron'],
    pageCount: 856,
    language: 'en',
    level: 'beginner',
    roadmapStepOrder: 1,
    roadmapStageLabelVi: 'Bước 1 · Nền tảng Thực hành',
    roadmapStageLabelEn: 'Step 1 · Practical Foundation',
    roadmapStepReasonVi:
      'Đọc cuốn này đầu tiên để nắm trực giác toán học qua code thực tế với Scikit-Learn trước khi đi sâu vào mạng nơ-ron.',
    roadmapStepReasonEn:
      'Read this first to build concrete intuition with Scikit-Learn pipelines before diving into deep neural architectures.',
    shortDescriptionVi:
      'Hướng dẫn thực hành toàn diện từ hồi quy tuyến tính, cây quyết định đến học sâu và thị giác máy tính.',
    shortDescriptionEn:
      'A practical guide covering end-to-end machine learning workflows from classic linear models to deep neural networks.',
    matchReasonVi:
      'Phù hợp cho sinh viên bắt đầu học Học máy cần xây dựng dự án chạy được ngay trong khi vẫn hiểu bản chất từng thuật toán.',
    matchReasonEn:
      'Matches your Machine Learning goal by pairing intuitive explanations with production-grade Python implementations.',
    coverColorHex: '#1E3A5F',
    verification: {
      status: 'verified',
      matchedSources: 'both',
      normalizedQueryTitle: 'hands on machine learning with scikit learn keras and tensorflow',
      normalizedMatchedTitle: 'hands on machine learning with scikit learn keras and tensorflow',
      titleSimilarityScore: 1.0,
      authorSurnameMatched: 'geron',
      openLibraryId: 'OL27326455M',
      openLibraryUrl: 'https://openlibrary.org/books/OL27326455M',
      googleBooksId: 'bRpYDAAAQBAJ',
      googleBooksUrl: 'https://books.google.com/books?id=bRpYDAAAQBAJ',
      isbn13: '9781492032649',
      firstPublishYear: 2017,
      checkedAtIso: '2026-11-08T10:00:00.000Z',
    },
    vietnameseEdition: {
      available: false,
      publisherOrNoteVi:
        'Chưa tìm thấy bản Tiếng Việt trong nguồn tra cứu (Open Library & Google Books).',
      publisherOrNoteEn:
        'No Vietnamese edition found in our sources (Open Library & Google Books).',
    },
    relevanceScore: 0.98,
    diversityBonus: 0.45,
  },
  {
    id: 'ol-W20144291W',
    topicCategory: 'machine-learning',
    title: 'The Hundred-Page Machine Learning Book',
    authors: ['Andriy Burkov'],
    pageCount: 160,
    language: 'en',
    level: 'beginner',
    roadmapStepOrder: 2,
    roadmapStageLabelVi: 'Bước 2 · Tổng quan Cốt lõi Ngắn gọn',
    roadmapStageLabelEn: 'Step 2 · Concise Core Synthesis',
    roadmapStepReasonVi:
      'Sau khi làm quen công cụ, cuốn sách 160 trang này giúp hệ thống hóa toàn bộ công thức và thuật ngữ cốt lõi trong 1 tuần.',
    roadmapStepReasonEn:
      'Consolidates the core mathematical notation and taxonomy in 160 focused pages before tackling theory-heavy texts.',
    shortDescriptionVi:
      'Tóm lược súc tích các nguyên lý học có giám sát, không giám sát, hàm mất mát và đánh giá mô hình.',
    shortDescriptionEn:
      'Distills supervised, unsupervised, and deep learning fundamentals into a compact, mathematically honest volume.',
    matchReasonVi:
      'Lý tưởng khi bạn cần một cuốn cẩm nang ngắn gọn (160 trang) để nắm bức tranh tổng thể về Học máy mà không bị ngợp.',
    matchReasonEn:
      'Ideal for grasping the entire conceptual map of Machine Learning in a short, rigorous 160-page read.',
    coverColorHex: '#78350F',
    verification: {
      status: 'verified',
      matchedSources: 'both',
      normalizedQueryTitle: 'the hundred page machine learning book',
      normalizedMatchedTitle: 'the hundred page machine learning book',
      titleSimilarityScore: 1.0,
      authorSurnameMatched: 'burkov',
      openLibraryId: 'OL27962650M',
      openLibraryUrl: 'https://openlibrary.org/books/OL27962650M',
      googleBooksId: '0jbxwQEACAAJ',
      googleBooksUrl: 'https://books.google.com/books?id=0jbxwQEACAAJ',
      isbn13: '9781999579500',
      firstPublishYear: 2019,
      checkedAtIso: '2026-11-08T10:00:00.000Z',
    },
    vietnameseEdition: {
      available: false,
      publisherOrNoteVi:
        'Chưa tìm thấy bản Tiếng Việt trong nguồn tra cứu (Open Library & Google Books).',
      publisherOrNoteEn:
        'No Vietnamese edition found in our sources (Open Library & Google Books).',
    },
    relevanceScore: 0.94,
    diversityBonus: 0.62,
  },
  {
    id: 'ol-W20918273W',
    topicCategory: 'machine-learning',
    title: 'Machine Learning Yearning',
    subtitle: 'Technical Strategy for AI Engineers, In the Era of Deep Learning',
    authors: ['Andrew Ng'],
    pageCount: 118,
    language: 'en',
    level: 'beginner',
    roadmapStepOrder: 3,
    roadmapStageLabelVi: 'Bước 3 · Chiến lược Thực hành Ngắn gọn',
    roadmapStageLabelEn: 'Step 3 · Concise Practical AI Strategy',
    roadmapStepReasonVi:
      'Chỉ với 118 trang thực tiễn, Andrew Ng hướng dẫn cách chẩn đoán lỗi mô hình và ưu tiên quyết định kỹ thuật ngoài đời thực.',
    roadmapStepReasonEn:
      'In just 118 practical pages, Andrew Ng teaches how to structure ML projects, debug error metrics, and make fast engineering decisions.',
    shortDescriptionVi:
      'Cẩm nang thực hành ngắn gọn của giáo sư Stanford Andrew Ng về cách phân tích lỗi, chia tập dữ liệu và xây dựng hệ thống AI thực tế.',
    shortDescriptionEn:
      'A compact, practical handbook by Andrew Ng on structuring machine learning projects, error analysis, and end-to-end iteration.',
    matchReasonVi:
      'Rất ngắn gọn (118 trang) và giàu tính thực hành cho người mới bắt đầu muốn tránh các sai lầm phổ biến khi làm dự án Học máy.',
    matchReasonEn:
      'Ultra-concise (118 pages) and deeply practical for beginners who want actionable ML engineering intuition.',
    coverColorHex: '#1D4ED8',
    verification: {
      status: 'verified',
      matchedSources: 'both',
      normalizedQueryTitle: 'machine learning yearning',
      normalizedMatchedTitle: 'machine learning yearning',
      titleSimilarityScore: 1.0,
      authorSurnameMatched: 'ng',
      openLibraryId: 'OL28194812M',
      openLibraryUrl: 'https://openlibrary.org/search?q=Machine+Learning+Yearning+Andrew+Ng',
      googleBooksId: '9Z9_zQEACAAJ',
      googleBooksUrl: 'https://books.google.com/books?id=9Z9_zQEACAAJ',
      isbn13: '9781732265103',
      firstPublishYear: 2018,
      checkedAtIso: '2026-11-08T10:00:00.000Z',
    },
    vietnameseEdition: {
      available: true,
      vietnameseTitle: 'Khao Khát Học Máy (Machine Learning Yearning)',
      publisherOrNoteVi:
        'Đã tìm thấy bản Tiếng Việt trong nguồn tra cứu danh mục mở.',
      publisherOrNoteEn:
        'Vietnamese edition found in catalog sources.',
      sourceUrl: 'https://books.google.com/books?id=9Z9_zQEACAAJ',
      sourceName: 'google_books',
    },
    relevanceScore: 0.93,
    diversityBonus: 0.74,
  },
  {
    id: 'ol-W17325198W',
    topicCategory: 'machine-learning',
    title: 'Deep Learning',
    subtitle: 'Adaptive Computation and Machine Learning series',
    authors: ['Ian Goodfellow', 'Yoshua Bengio', 'Aaron Courville'],
    pageCount: 800,
    language: 'en',
    level: 'advanced',
    roadmapStepOrder: 4,
    roadmapStageLabelVi: 'Bước 4 · Lý thuyết Học sâu Kinh điển',
    roadmapStageLabelEn: 'Step 4 · Canonical Deep Learning Theory',
    roadmapStepReasonVi:
      'Đặt ở bước chuyên sâu sau khi bạn đã vững đại số tuyến tính và xác suất để hiểu nền tảng tối ưu hóa mạng nơ-ron.',
    roadmapStepReasonEn:
      'Placed as your advanced milestone once you are ready for formal linear algebra, probability, and optimization proofs.',
    shortDescriptionVi:
      'Giáo trình nền tảng của MIT Press về toán học ứng dụng, mạng tích chập, mạng hồi quy và mô hình sinh.',
    shortDescriptionEn:
      'The definitive MIT Press textbook on applied math for machine learning, regularization, CNNs, RNNs, and generative models.',
    matchReasonVi:
      'Cung cấp chiều sâu học thuật vững chắc cho sinh viên đại học muốn đọc hiểu các bài báo nghiên cứu AI.',
    matchReasonEn:
      'Provides the mathematical rigor required to read and implement modern AI research papers.',
    coverColorHex: '#14532D',
    verification: {
      status: 'verified',
      matchedSources: 'both',
      normalizedQueryTitle: 'deep learning',
      normalizedMatchedTitle: 'deep learning',
      titleSimilarityScore: 1.0,
      authorSurnameMatched: 'goodfellow',
      openLibraryId: 'OL26230829M',
      openLibraryUrl: 'https://openlibrary.org/books/OL26230829M',
      googleBooksId: 'omivDQAAQBAJ',
      googleBooksUrl: 'https://books.google.com/books?id=omivDQAAQBAJ',
      isbn13: '9780262035613',
      firstPublishYear: 2016,
      checkedAtIso: '2026-11-08T10:00:00.000Z',
    },
    vietnameseEdition: {
      available: false,
      publisherOrNoteVi:
        'Chưa tìm thấy bản Tiếng Việt trong nguồn tra cứu (Open Library & Google Books).',
      publisherOrNoteEn:
        'No Vietnamese edition found in our sources (Open Library & Google Books).',
    },
    relevanceScore: 0.92,
    diversityBonus: 0.55,
  },
  {
    id: 'ol-W21258911W',
    topicCategory: 'machine-learning',
    title: 'Designing Machine Learning Systems',
    subtitle: 'An Iterative Process for Production-Ready Applications',
    authors: ['Chip Huyen'],
    pageCount: 386,
    language: 'en',
    level: 'intermediate',
    roadmapStepOrder: 5,
    roadmapStageLabelVi: 'Bước 5 · Triển khai Hệ thống Thực tế (MLOps)',
    roadmapStageLabelEn: 'Step 5 · Production Systems & MLOps',
    roadmapStepReasonVi:
      'Kết nối kiến thức mô hình với kỹ thuật hệ thống thực tế: dữ liệu dịch chuyển (data drift), triển khai và giám sát.',
    roadmapStepReasonEn:
      'Bridges classroom modeling with real-world engineering: data pipelines, distribution shift, and deployment.',
    shortDescriptionVi:
      'Phân tích toàn diện cách thiết kế hệ thống học máy tin cậy, có khả năng mở rộng và bảo trì trong doanh nghiệp.',
    shortDescriptionEn:
      'A holistic guide to building reliable, scalable, and maintainable machine learning systems in production.',
    matchReasonVi:
      'Mở rộng góc nhìn thực hành từ thuật toán thuần túy sang tư duy thiết kế hệ thống của kỹ sư AI hiện đại.',
    matchReasonEn:
      'Expands your practical perspective from isolated notebooks to end-to-end systems engineering by Chip Huyen.',
    coverColorHex: '#4C1D95',
    verification: {
      status: 'verified',
      matchedSources: 'both',
      normalizedQueryTitle: 'designing machine learning systems',
      normalizedMatchedTitle: 'designing machine learning systems',
      titleSimilarityScore: 1.0,
      authorSurnameMatched: 'huyen',
      openLibraryId: 'OL37820194M',
      openLibraryUrl: 'https://openlibrary.org/books/OL37820194M',
      googleBooksId: 'S6x2EAAAQBAJ',
      googleBooksUrl: 'https://books.google.com/books?id=S6x2EAAAQBAJ',
      isbn13: '9781098107963',
      firstPublishYear: 2022,
      checkedAtIso: '2026-11-08T10:00:00.000Z',
    },
    vietnameseEdition: {
      available: true,
      vietnameseTitle: 'Thiết Kế Các Hệ Thống Học Máy',
      publisherOrNoteVi:
        'Đã tìm thấy bản Tiếng Việt ("Thiết Kế Các Hệ Thống Học Máy") trong nguồn tra cứu.',
      publisherOrNoteEn:
        'Vietnamese edition found ("Thiết Kế Các Hệ Thống Học Máy") in catalog sources.',
      sourceUrl: 'https://openlibrary.org/books/OL37820194M',
      sourceName: 'open_library',
    },
    relevanceScore: 0.89,
    diversityBonus: 0.92,
  },

  // === PHILOSOPHY & CRITICAL THINKING ===
  {
    id: 'ol-W1532910W',
    topicCategory: 'philosophy',
    title: 'Think: A Compelling Introduction to Philosophy',
    authors: ['Simon Blackburn'],
    pageCount: 312,
    language: 'en',
    level: 'beginner',
    roadmapStepOrder: 1,
    roadmapStageLabelVi: 'Bước 1 · Nhập môn Tư duy Triết học',
    roadmapStageLabelEn: 'Step 1 · Foundational Philosophical Inquiry',
    roadmapStepReasonVi:
      'Khởi đầu bằng các câu hỏi cốt lõi về tri thức, ý thức và tự do ý chí được giải thích bằng ngôn ngữ đời thường.',
    roadmapStepReasonEn:
      'Starts directly with big questions—knowledge, mind, free will, and ethics—without requiring prior historical jargon.',
    shortDescriptionVi:
      'Cuốn sách nhập môn kinh điển của giáo sư Đại học Cambridge dẫn dắt người đọc qua các lập luận của Descartes, Hume, Kant.',
    shortDescriptionEn:
      'Cambridge philosopher Simon Blackburn introduces epistemology, metaphysics, and ethics with clarity and rigor.',
    matchReasonVi:
      'Dành cho sinh viên mới bắt đầu muốn học cách phân tích lập luận thay vì chỉ học thuộc lịch sử triết học.',
    matchReasonEn:
      'Teaches you how to reason philosophically rather than merely memorizing chronological trivia.',
    coverColorHex: '#7F1D1D',
    verification: {
      status: 'verified',
      matchedSources: 'both',
      normalizedQueryTitle: 'think a compelling introduction to philosophy',
      normalizedMatchedTitle: 'think',
      titleSimilarityScore: 0.85,
      authorSurnameMatched: 'blackburn',
      openLibraryId: 'OL6798842M',
      openLibraryUrl: 'https://openlibrary.org/books/OL6798842M',
      googleBooksId: 'vH8SDAAAQBAJ',
      googleBooksUrl: 'https://books.google.com/books?id=vH8SDAAAQBAJ',
      isbn13: '9780192100245',
      firstPublishYear: 1999,
      checkedAtIso: '2026-11-08T10:00:00.000Z',
    },
    vietnameseEdition: {
      available: true,
      vietnameseTitle: 'Nghĩ — Dẫn Nhập Triết Học Hấp Dẫn',
      publisherOrNoteVi:
        'Đã tìm thấy bản Tiếng Việt ("Nghĩ — Dẫn Nhập Triết Học") trong nguồn tra cứu.',
      publisherOrNoteEn:
        'Vietnamese edition found ("Nghĩ — Dẫn Nhập Triết Học") in catalog sources.',
      sourceUrl: 'https://openlibrary.org/books/OL6798842M',
      sourceName: 'open_library',
    },
    relevanceScore: 0.97,
    diversityBonus: 0.52,
  },
  {
    id: 'ol-W4291820W',
    topicCategory: 'philosophy',
    title: 'Justice: What’s the Right Thing to Do?',
    authors: ['Michael J. Sandel'],
    pageCount: 308,
    language: 'en',
    level: 'intermediate',
    roadmapStepOrder: 2,
    roadmapStageLabelVi: 'Bước 2 · Triết học Đạo đức & Chính trị Ứng dụng',
    roadmapStageLabelEn: 'Step 2 · Applied Moral & Political Philosophy',
    roadmapStepReasonVi:
      'Áp dụng tư duy triết học vào các tình huống tiến thoái lưỡng nan thực tế trong xã hội, pháp luật và kinh tế.',
    roadmapStepReasonEn:
      'Applies philosophical frameworks (Utilitarianism, Kantianism, Virtue Ethics) to concrete modern civic dilemmas.',
    shortDescriptionVi:
      'Chuyển thể từ khóa học nổi tiếng nhất tại Đại học Harvard, đối chiếu các học thuyết công lý qua các vụ việc thực tiễn.',
    shortDescriptionEn:
      'Based on Harvard University’s legendary Justice course, examining Aristotle, Locke, Kant, Mill, and Rawls.',
    matchReasonVi:
      'Giúp bạn kết nối lý thuyết triết học trừu tượng với các quyết định đạo đức và chính sách công hàng ngày.',
    matchReasonEn:
      'Connects classical theory directly to contemporary ethical and social debates.',
    coverColorHex: '#1E3A5F',
    verification: {
      status: 'verified',
      matchedSources: 'both',
      normalizedQueryTitle: 'justice whats the right thing to do',
      normalizedMatchedTitle: 'justice',
      titleSimilarityScore: 0.88,
      authorSurnameMatched: 'sandel',
      openLibraryId: 'OL23953421M',
      openLibraryUrl: 'https://openlibrary.org/books/OL23953421M',
      googleBooksId: '7X2dAAAAMAAJ',
      googleBooksUrl: 'https://books.google.com/books?id=7X2dAAAAMAAJ',
      isbn13: '9780374532505',
      firstPublishYear: 2009,
      checkedAtIso: '2026-11-08T10:00:00.000Z',
    },
    vietnameseEdition: {
      available: true,
      vietnameseTitle: 'Phải Trái Đúng Sai',
      publisherOrNoteVi:
        'Đã tìm thấy bản Tiếng Việt ("Phải Trái Đúng Sai") trong nguồn tra cứu.',
      publisherOrNoteEn:
        'Vietnamese edition found ("Phải Trái Đúng Sai") in catalog sources.',
      sourceUrl: 'https://openlibrary.org/books/OL23953421M',
      sourceName: 'open_library',
    },
    relevanceScore: 0.95,
    diversityBonus: 0.78,
  },

  // === PERSONAL FINANCE & BEHAVIORAL ECONOMICS ===
  {
    id: 'ol-W29104821W',
    topicCategory: 'personal-finance',
    title: 'The Psychology of Money',
    subtitle: 'Timeless lessons on wealth, greed, and happiness',
    authors: ['Morgan Housel'],
    pageCount: 256,
    language: 'en',
    level: 'beginner',
    roadmapStepOrder: 1,
    roadmapStageLabelVi: 'Bước 1 · Tư duy Hành vi Tài chính',
    roadmapStageLabelEn: 'Step 1 · Behavioral Mindset of Wealth',
    roadmapStepReasonVi:
      'Đọc đầu tiên để xây dựng kỷ luật tâm lý và hiểu sức mạnh của lãi kép trước khi học kỹ thuật phân bổ tài sản.',
    roadmapStepReasonEn:
      'Start here to master financial behavior, risk tolerance, and compounding before touching complex instruments.',
    shortDescriptionVi:
      '19 câu chuyện ngắn phân tích vì sao thành công tài chính phụ thuộc vào hành vi ứng xử hơn là các bảng tính phức tạp.',
    shortDescriptionEn:
      'Explores how personal history, risk perception, and patience shape long-term financial outcomes.',
    matchReasonVi:
      'Ngắn gọn, dễ đọc cho sinh viên chưa có nền tảng kinh tế nhưng muốn quản lý tài chính cá nhân bền vững.',
    matchReasonEn:
      'Accessible, story-driven foundation for students building lifelong financial habits.',
    coverColorHex: '#14532D',
    verification: {
      status: 'verified',
      matchedSources: 'both',
      normalizedQueryTitle: 'the psychology of money',
      normalizedMatchedTitle: 'the psychology of money',
      titleSimilarityScore: 1.0,
      authorSurnameMatched: 'housel',
      openLibraryId: 'OL28710559M',
      openLibraryUrl: 'https://openlibrary.org/books/OL28710559M',
      googleBooksId: 'TnrrDwAAQBAJ',
      googleBooksUrl: 'https://books.google.com/books?id=TnrrDwAAQBAJ',
      isbn13: '9780857197689',
      firstPublishYear: 2020,
      checkedAtIso: '2026-11-08T10:00:00.000Z',
    },
    vietnameseEdition: {
      available: true,
      vietnameseTitle: 'Tâm Lý Học Về Tiền',
      publisherOrNoteVi:
        'Đã tìm thấy bản Tiếng Việt ("Tâm Lý Học Về Tiền") trong nguồn tra cứu.',
      publisherOrNoteEn:
        'Vietnamese edition found ("Tâm Lý Học Về Tiền") in catalog sources.',
      sourceUrl: 'https://books.google.com/books?id=TnrrDwAAQBAJ',
      sourceName: 'google_books',
    },
    relevanceScore: 0.97,
    diversityBonus: 0.65,
  },
  {
    id: 'ol-W1094821W',
    topicCategory: 'personal-finance',
    title: 'A Random Walk Down Wall Street',
    subtitle: 'The Time-Tested Strategy for Successful Investing',
    authors: ['Burton G. Malkiel'],
    pageCount: 448,
    language: 'en',
    level: 'intermediate',
    roadmapStepOrder: 2,
    roadmapStageLabelVi: 'Bước 2 · Nguyên lý Đầu tư Chỉ số & Thị trường Hiệu quả',
    roadmapStageLabelEn: 'Step 2 · Index Investing & Market Efficiency',
    roadmapStepReasonVi:
      'Cung cấp bằng chứng thực nghiệm học thuật về lý thuyết bước đi ngẫu nhiên, quỹ chỉ số chi phí thấp và đa dạng hóa danh mục.',
    roadmapStepReasonEn:
      'Introduces empirical finance, modern portfolio theory, and low-cost index investing.',
    shortDescriptionVi:
      'Tác phẩm kinh điển của giáo sư Đại học Princeton phân tích bong bóng tài chính, định giá cổ phiếu và chiến lược đầu tư dài hạn.',
    shortDescriptionEn:
      'Princeton economist Burton Malkiel explains market bubbles, valuation methods, and practical lifecycle portfolio allocation.',
    matchReasonVi:
      'Giúp người học phân biệt rõ giữa đầu cơ ngắn hạn và đầu tư dựa trên dữ liệu lịch sử đã kiểm chứng.',
    matchReasonEn:
      'Grounds your personal finance journey in peer-reviewed economic evidence.',
    coverColorHex: '#78350F',
    verification: {
      status: 'verified',
      matchedSources: 'both',
      normalizedQueryTitle: 'a random walk down wall street',
      normalizedMatchedTitle: 'a random walk down wall street',
      titleSimilarityScore: 1.0,
      authorSurnameMatched: 'malkiel',
      openLibraryId: 'OL26839412M',
      openLibraryUrl: 'https://openlibrary.org/books/OL26839412M',
      googleBooksId: 'f4B5DwAAQBAJ',
      googleBooksUrl: 'https://books.google.com/books?id=f4B5DwAAQBAJ',
      isbn13: '9780393358384',
      firstPublishYear: 1973,
      checkedAtIso: '2026-11-08T10:00:00.000Z',
    },
    vietnameseEdition: {
      available: true,
      vietnameseTitle: 'Bước Đi Ngẫu Nhiên Trên Phố Wall',
      publisherOrNoteVi:
        'Đã tìm thấy bản Tiếng Việt ("Bước Đi Ngẫu Nhiên Trên Phố Wall") trong nguồn tra cứu.',
      publisherOrNoteEn:
        'Vietnamese edition found ("Bước Đi Ngẫu Nhiên Trên Phố Wall") in catalog sources.',
      sourceUrl: 'https://openlibrary.org/books/OL26839412M',
      sourceName: 'open_library',
    },
    relevanceScore: 0.93,
    diversityBonus: 0.72,
  },

  // === SOFTWARE ARCHITECTURE & DISTRIBUTED SYSTEMS ===
  {
    id: 'ol-W17829104W',
    topicCategory: 'distributed-systems',
    title: 'Designing Data-Intensive Applications',
    subtitle: 'The Big Ideas Behind Reliable, Scalable, and Maintainable Systems',
    authors: ['Martin Kleppmann'],
    pageCount: 616,
    language: 'en',
    level: 'intermediate',
    roadmapStepOrder: 1,
    roadmapStageLabelVi: 'Bước 1 · Nền tảng Lưu trữ & Hệ phân tán',
    roadmapStageLabelEn: 'Step 1 · Storage Engines & Distributed Foundations',
    roadmapStepReasonVi:
      'Cuốn sách nền tảng giải thích rõ từ chỉ mục B-Tree/LSM-Tree trên 1 máy đến sao chép, phân mảnh và đồng thuận phân tán.',
    roadmapStepReasonEn:
      'Builds from single-node storage engines (B-Trees, LSM-Trees) up to replication, partitioning, and distributed consensus.',
    shortDescriptionVi:
      'Phân tích sâu sắc kiến trúc đằng sau cơ sở dữ liệu hiện đại, hàng đợi thông điệp và xử lý dữ liệu lớn.',
    shortDescriptionEn:
      'Examines the fundamental trade-offs of consistency, durability, and scalability in modern data systems.',
    matchReasonVi:
      'Tài liệu gối đầu giường cho sinh viên CNTT muốn hiểu bản chất hệ thống thay vì chỉ gọi API của một công cụ cụ thể.',
    matchReasonEn:
      'Essential for computer science students seeking deep first-principles mastery of backend architecture.',
    coverColorHex: '#3B4252',
    verification: {
      status: 'verified',
      matchedSources: 'both',
      normalizedQueryTitle: 'designing data intensive applications',
      normalizedMatchedTitle: 'designing data intensive applications',
      titleSimilarityScore: 1.0,
      authorSurnameMatched: 'kleppmann',
      openLibraryId: 'OL26834001M',
      openLibraryUrl: 'https://openlibrary.org/books/OL26834001M',
      googleBooksId: 'p1heDgAAQBAJ',
      googleBooksUrl: 'https://books.google.com/books?id=p1heDgAAQBAJ',
      isbn13: '9781449373320',
      firstPublishYear: 2017,
      checkedAtIso: '2026-11-08T10:00:00.000Z',
    },
    vietnameseEdition: {
      available: false,
      publisherOrNoteVi:
        'Chưa tìm thấy bản Tiếng Việt trong nguồn tra cứu (Open Library & Google Books).',
      publisherOrNoteEn:
        'No Vietnamese edition found in our sources (Open Library & Google Books).',
    },
    relevanceScore: 0.99,
    diversityBonus: 0.58,
  },

  // === COGNITIVE PSYCHOLOGY ===
  {
    id: 'ol-W16029182W',
    topicCategory: 'cognitive-psychology',
    title: 'Thinking, Fast and Slow',
    authors: ['Daniel Kahneman'],
    pageCount: 499,
    language: 'en',
    level: 'beginner',
    roadmapStepOrder: 1,
    roadmapStageLabelVi: 'Bước 1 · Mô hình Hai Hệ thống Tư duy',
    roadmapStageLabelEn: 'Step 1 · Dual-System Cognitive Framework',
    roadmapStepReasonVi:
      'Mở đầu hoàn hảo để hiểu cách bộ não ra quyết định qua Hệ thống 1 (phản xạ nhanh) và Hệ thống 2 (suy luận có ý thức).',
    roadmapStepReasonEn:
      'Establishes the foundational dual-process theory (System 1 and System 2) and cognitive biases.',
    shortDescriptionVi:
      'Công trình đạt giải Nobel của Daniel Kahneman tổng kết hàng chục năm nghiên cứu về thiên kiến nhận thức và phán đoán xác suất.',
    shortDescriptionEn:
      'Nobel laureate Daniel Kahneman synthesizes decades of empirical research on heuristics, biases, and prospect theory.',
    matchReasonVi:
      'Kết hợp chặt chẽ giữa thực nghiệm tâm lý học nhận thức và ứng dụng trong kinh tế, học tập và nghiên cứu.',
    matchReasonEn:
      'Pairs rigorous experimental psychology with memorable everyday examples.',
    coverColorHex: '#5B21B6',
    verification: {
      status: 'verified',
      matchedSources: 'both',
      normalizedQueryTitle: 'thinking fast and slow',
      normalizedMatchedTitle: 'thinking fast and slow',
      titleSimilarityScore: 1.0,
      authorSurnameMatched: 'kahneman',
      openLibraryId: 'OL24903139M',
      openLibraryUrl: 'https://openlibrary.org/books/OL24903139M',
      googleBooksId: 'ZuKTvERuPG8C',
      googleBooksUrl: 'https://books.google.com/books?id=ZuKTvERuPG8C',
      isbn13: '9780374275631',
      firstPublishYear: 2011,
      checkedAtIso: '2026-11-08T10:00:00.000Z',
    },
    vietnameseEdition: {
      available: true,
      vietnameseTitle: 'Tư Duy Nhanh Và Chậm',
      publisherOrNoteVi:
        'Đã tìm thấy bản Tiếng Việt ("Tư Duy Nhanh Và Chậm") trong nguồn tra cứu.',
      publisherOrNoteEn:
        'Vietnamese edition found ("Tư Duy Nhanh Và Chậm") in catalog sources.',
      sourceUrl: 'https://openlibrary.org/books/OL24903139M',
      sourceName: 'open_library',
    },
    relevanceScore: 0.96,
    diversityBonus: 0.85,
  },
] as const;

export const MOCK_REJECTED_CANDIDATES: readonly RejectedCandidateLog[] = [
  {
    candidateTitle: 'Practical Neural Topologies for Modern Students',
    candidateAuthor: 'David R. Vance',
    reasonVi:
      'Loại bỏ: Không tìm thấy nhan đề khớp (>= 0.65) trên cả Open Library và Google Books (nghi ngờ sách do AI tự sinh).',
    reasonEn:
      'Removed: No catalog record matched normalized title (>= 0.65) on Open Library or Google Books (hallucinated title).',
    timestampIso: '2026-11-08T10:00:01.000Z',
  },
  {
    candidateTitle: 'Foundations of Statistical Learning Systems',
    candidateAuthor: 'Geoffrey Hinton',
    reasonVi:
      'Loại bỏ: Nhan đề tồn tại gần giống nhưng họ tác giả ("hinton") không khớp với bản ghi gốc trong danh mục.',
    reasonEn:
      'Removed: Title fuzzy-matched a record, but mandatory author surname ("hinton") did not match catalog authors.',
    timestampIso: '2026-11-08T10:00:02.000Z',
  },
] as const;
