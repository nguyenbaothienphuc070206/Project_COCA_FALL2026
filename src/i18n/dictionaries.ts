/**
 * Tính năng: Bộ từ điển song ngữ Tiếng Việt & Tiếng Anh hoàn chỉnh cho ShelfPath (Phase 1, 2, 3A, 3B & 4).
 * Trường hợp sử dụng: Cung cấp toàn bộ chuỗi văn bản trên giao diện, không ghi cứng chuỗi trong các component.
 */

export type Locale = 'vi' | 'en';

export interface Dictionary {
  brand: {
    name: string;
    subtitle: string;
  };
  nav: {
    discover: string;
    roadmap: string;
    myShelf: string;
    vision: string;
    trySampleCta: string;
    languageToggleLabel: string;
    themeToggleLight: string;
    themeToggleDark: string;
  };
  hero: {
    kicker: string;
    headline: string;
    subheadline: string;
    topicInputLabel: string;
    topicPlaceholder: string;
    primarySearchCta: string;
    secondarySampleCta: string;
    cancelSearchBtn: string;
    suggestedTopicsLabel: string;
    customizeToggleShow: string;
    customizeToggleHide: string;
    sampleDataBadge: string;
    livePipelineBadge: string;
    sampleDataNotice: string;
    livePipelineNotice: string;
    secretsWarningTitle: string;
    view3dToggle: string;
    view2dToggle: string;
    webglFallbackNotice: string;
    shelfCaptionVerified: string;
    shelfCaptionRemoved: string;
    modeSwitchLive: string;
    modeSwitchSample: string;
    spotlightHeader: string;
    sessionTimelineTitle: string;
    sessionTimelineEmpty: string;
  };
  preferences: {
    sectionTitle: string;
    levelLabel: string;
    levels: {
      beginner: string;
      intermediate: string;
      advanced: string;
    };
    lengthLabel: string;
    lengths: {
      any: string;
      short: string;
      medium: string;
      deep: string;
    };
    languageLabel: string;
    languages: {
      any: string;
      en: string;
      vi: string;
    };
    adventurousnessLabel: string;
    adventurousnessLow: string;
    adventurousnessHigh: string;
    adventurousnessExplanations: {
      focused: string;
      balanced: string;
      exploratory: string;
    };
  };
  pipeline: {
    title: string;
    stages: {
      searching: string;
      extracting: string;
      verifying: string;
      ranking: string;
      building_path: string;
      completed: string;
    };
    liveCounterTemplate: string;
    removedLogTitle: string;
    groundingSourcesTitle: string;
    queriesTitle: string;
    simulateOutageBtn: string;
    restoreServiceBtn: string;
    cancelStreamBtn: string;
  };
  cards: {
    sectionTitle: string;
    sectionSubtitle: string;
    roadmapToggleGrid: string;
    roadmapTogglePath: string;
    verifiedOpenLibrary: string;
    verifiedGoogleBooks: string;
    verifiedBoth: string;
    pagesUnit: string;
    levelBeginner: string;
    levelIntermediate: string;
    levelAdvanced: string;
    whyMatchLabel: string;
    roadmapOrderReasonLabel: string;
    vietnameseEditionAvailable: string;
    vietnameseEditionNotKnown: string;
    vietnameseEditionSourceLink: string;
    howWeCheckedBtn: string;
    sourceLinkOpenLibrary: string;
    sourceLinkGoogleBooks: string;
    saveToShelfBtn: string;
    savedInShelfBtn: string;
    notInterestedBtn: string;
    stepPrefix: string;
    relevanceBadge: string;
    diversityBadge: string;
    diffMovedUp: string;
    diffMovedDown: string;
    diffNewReplacement: string;
  };
  refinement: {
    title: string;
    placeholder: string;
    applyBtn: string;
    applyingBtn: string;
    presetShorter: string;
    presetPractical: string;
    presetTheoretical: string;
    presetEasier: string;
    understoodLabel: string;
    clearAllChipsBtn: string;
    removeChipAria: string;
    keptPreviousNotice: string;
    truncatedNotice: string;
    dataOnlySecurityNote: string;
  };
  quickFilters: {
    title: string;
    allLengths: string;
    allLevels: string;
    allLanguages: string;
    langViAvailable: string;
    langEnOriginal: string;
    resetBtn: string;
    noFilterMatchTitle: string;
    noFilterMatchDesc: string;
  };
  dismissBanner: {
    dismissedPrefix: string;
    replacementAddedPrefix: string;
    noReplacementAvailable: string;
    undoBtnTemplate: string;
  };
  roadmapView: {
    title: string;
    subtitle: string;
    mode3dBtn: string;
    mode2dBtn: string;
    stepLabel: string;
    whyThisStepOrderLabel: string;
    totalPagesLabel: string;
    inspectStepBtn: string;
    keyboardHint: string;
    openInDiscoverBtn: string;
  };
  trustDrawer: {
    title: string;
    subtitle: string;
    closeBtn: string;
    verificationStatusLabel: string;
    verifiedStatusText: string;
    matchedSourcesLabel: string;
    normalizedTitleLabel: string;
    matchedRecordTitleLabel: string;
    titleSimilarityLabel: string;
    authorSurnameLabel: string;
    isbnLabel: string;
    firstPublishedLabel: string;
    externalLinksTitle: string;
    openInOpenLibrary: string;
    openInGoogleBooks: string;
    failClosedNote: string;
    descriptionHeader: string;
    editionMetadataHeader: string;
    checkingEditionText: string;
  };
  myShelf: {
    title: string;
    subtitle: string;
    emptyStateTitle: string;
    emptyStateGuide: string;
    statusToRead: string;
    statusReading: string;
    statusDone: string;
    removeBookBtn: string;
    clearShelfBtn: string;
    moveUpBtn: string;
    moveDownBtn: string;
    exportMarkdownBtn: string;
    exportCsvBtn: string;
    printPdfBtn: string;
    exportDisclaimer: string;
    statsSummaryTemplate: string;
    privacyNotice: string;
  };
  states: {
    emptyTitle: string;
    emptyDescription: string;
    emptyActionBtn: string;
    loadingTitle: string;
    loadingSubtitle: string;
    errorTitle: string;
    errorOutageMessage: string;
    rateLimitTitle: string;
    rateLimitMessage: string;
    cancelledTitle: string;
    cancelledMessage: string;
    retryBtn: string;
    validationEmptyTopic: string;
    offlineBanner: string;
    oneSourceDownBanner: string;
  };
  vision: {
    title: string;
    subtitle: string;
    problemTitle: string;
    problemBody: string;
    roadmapTitle: string;
    phase1Title: string;
    phase1Desc: string;
    phase2Title: string;
    phase2Desc: string;
    phase3Title: string;
    phase3Desc: string;
    architectureTitle: string;
    sustainabilityTitle: string;
    sustainabilityBody: string;
  };
  footer: {
    tagline: string;
    privacyGuarantee: string;
  };
}

export const DICTIONARIES: Record<Locale, Dictionary> = {
  vi: {
    brand: {
      name: 'ShelfPath',
      subtitle: 'Thư viện lộ trình tự học đã kiểm chứng',
    },
    nav: {
      discover: 'Khám phá',
      roadmap: 'Lộ trình (The Path)',
      myShelf: 'Kệ sách của tôi',
      vision: 'Tầm nhìn',
      trySampleCta: 'Dữ liệu mẫu',
      languageToggleLabel: 'Chuyển sang Tiếng Anh (EN)',
      themeToggleLight: 'Giao diện Sáng',
      themeToggleDark: 'Giao diện Tối',
    },
    hero: {
      kicker: 'BẮT ĐẦU LỘ TRÌNH · KIỂM CHỨNG 100% DỮ LIỆU THẬT',
      headline: 'Đọc cuốn nào đầu tiên, và đọc gì tiếp theo?',
      subheadline:
        'Dành cho sinh viên tự học một lĩnh vực mới từ con số 0. Mọi cuốn sách đều được đối chiếu trực tiếp với Open Library & Google Books, xếp hạng MMR và sắp xếp theo trình tự đọc hợp lý.',
      topicInputLabel: 'Chủ đề hoặc lĩnh vực bạn muốn tự học',
      topicPlaceholder:
        'Tìm chủ đề, lĩnh vực hoặc kỹ năng (VD: Học máy, Triết học, Tài chính)...',
      primarySearchCta: 'Bắt đầu lộ trình đọc',
      secondarySampleCta: 'Dùng thử với dữ liệu mẫu',
      cancelSearchBtn: 'Hủy tìm kiếm',
      suggestedTopicsLabel: 'Chủ đề tự học tiêu biểu:',
      customizeToggleShow: 'Tùy chỉnh trình độ, độ dài & thanh trượt khám phá',
      customizeToggleHide: 'Thu gọn bảng tùy chỉnh',
      sampleDataBadge: 'Dữ liệu minh họa (Sample data)',
      livePipelineBadge: 'Kiểm chứng trực tiếp (Live Verified)',
      sampleDataNotice:
        'Đang hiển thị Dữ liệu minh họa (MOCK_MODE) — mọi cuốn sách đều có bản ghi thật trên Open Library & Google Books.',
      livePipelineNotice:
        'Đang chạy Pipeline Kiểm chứng Trực tiếp (Gemini Grounding + Open Library + Embeddings MMR qua SSE).',
      secretsWarningTitle: 'Ghi chú cấu hình Secrets máy chủ:',
      view3dToggle: 'Kệ 3D',
      view2dToggle: 'Sơ đồ 2D',
      webglFallbackNotice:
        'Đang dùng chế độ hiển thị tiết kiệm tài nguyên (2D/Lite) tương thích mọi thiết bị.',
      shelfCaptionVerified: 'Sách đã xác thực',
      shelfCaptionRemoved: 'Ứng viên bị loại',
      modeSwitchLive: 'Chuyển sang Kiểm chứng trực tiếp',
      modeSwitchSample: 'Chuyển sang Dữ liệu mẫu',
      spotlightHeader: 'Không gian Kiểm chứng & Tiến độ Đọc',
      sessionTimelineTitle: 'Tiến độ Lộ trình trong phiên',
      sessionTimelineEmpty:
        'Lưu sách từ danh sách bên trái để theo dõi tiến độ Sắp đọc · Đang đọc · Đã xong.',
    },
    preferences: {
      sectionTitle: 'Cá nhân hóa lộ trình đọc của bạn',
      levelLabel: 'Trình độ hiện tại',
      levels: {
        beginner: 'Nhập môn (Từ đầu)',
        intermediate: 'Trung cấp',
        advanced: 'Chuyên sâu',
      },
      lengthLabel: 'Độ dài sách ưu tiên',
      lengths: {
        any: 'Mọi độ dài',
        short: 'Ngắn gọn (<250 trang)',
        medium: 'Vừa phải (250–450 trang)',
        deep: 'Toàn diện (>450 trang)',
      },
      languageLabel: 'Ngôn ngữ ấn bản',
      languages: {
        any: 'Tất cả ngôn ngữ',
        en: 'Tiếng Anh (Gốc)',
        vi: 'Ưu tiên có bản Tiếng Việt',
      },
      adventurousnessLabel: 'Mức độ khám phá (MMR Diversity)',
      adventurousnessLow: 'Sát giáo trình chuẩn',
      adventurousnessHigh: 'Khám phá liên ngành',
      adventurousnessExplanations: {
        focused:
          'Đang ưu tiên các sách nền tảng kinh điển, bám sát trực tiếp chủ đề bạn chọn.',
        balanced:
          'Cân bằng giữa sách giáo trình cốt lõi và các góc nhìn thực hành bổ trợ (MMR cân bằng).',
        exploratory:
          'Mở rộng tối đa sang các tác phẩm giao thoa liên ngành đã được kiểm chứng để tạo đột phá tư duy.',
      },
    },
    pipeline: {
      title: 'Tiến trình Kiểm chứng & Xếp hạng (SSE)',
      stages: {
        searching: 'Tìm kiếm ứng viên',
        extracting: 'Trích xuất cấu trúc',
        verifying: 'Đối chiếu danh mục',
        ranking: 'Xếp hạng MMR',
        building_path: 'Dựng lộ trình đọc',
        completed: 'Hoàn tất lộ trình',
      },
      liveCounterTemplate:
        '{found} tìm thấy · {verified} đã xác thực · {removed} bị loại',
      removedLogTitle: 'Nhật ký loại bỏ ứng viên không đạt chuẩn',
      groundingSourcesTitle: 'Nguồn Google Search Grounding:',
      queriesTitle: 'Truy vấn tìm kiếm đã chạy:',
      simulateOutageBtn: 'Mô phỏng lỗi nguồn (Fail-Closed)',
      restoreServiceBtn: 'Khôi phục kết nối nguồn',
      cancelStreamBtn: 'Dừng tiến trình',
    },
    cards: {
      sectionTitle: 'Tác phẩm Đã Kiểm chứng & Xếp hạng',
      sectionSubtitle:
        'Mỗi cuốn sách đều khớp nhan đề và họ tác giả trên Open Library hoặc Google Books trước khi xếp hạng.',
      roadmapToggleGrid: 'Dạng Thẻ Sách',
      roadmapTogglePath: 'Xem Lộ Trình 3D (The Path)',
      verifiedOpenLibrary: 'Đã xác thực · Open Library',
      verifiedGoogleBooks: 'Đã xác thực · Google Books',
      verifiedBoth: 'Đã xác thực · Open Library & Google Books',
      pagesUnit: 'trang',
      levelBeginner: 'Nhập môn',
      levelIntermediate: 'Trung cấp',
      levelAdvanced: 'Nâng cao',
      whyMatchLabel: 'Vì sao phù hợp với bạn:',
      roadmapOrderReasonLabel: 'Lý do xếp ở bước này:',
      vietnameseEditionAvailable: 'Đã tìm thấy bản Tiếng Việt',
      vietnameseEditionNotKnown:
        'Chưa tìm thấy bản Tiếng Việt trong nguồn tra cứu',
      vietnameseEditionSourceLink: 'Xem bản ghi bản dịch',
      howWeCheckedBtn: 'Hồ sơ kiểm chứng',
      sourceLinkOpenLibrary: 'Open Library',
      sourceLinkGoogleBooks: 'Google Books',
      saveToShelfBtn: 'Lưu vào kệ',
      savedInShelfBtn: 'Đã lưu trên kệ',
      notInterestedBtn: 'Không quan tâm',
      stepPrefix: 'Bước',
      relevanceBadge: 'Độ khớp',
      diversityBadge: 'Đa dạng MMR',
      diffMovedUp: '↑ Tăng bậc',
      diffMovedDown: '↓ Hạ bậc',
      diffNewReplacement: '✦ Sách mới thay thế',
    },
    refinement: {
      title: 'Tinh chỉnh lộ trình bằng ngôn ngữ tự nhiên',
      placeholder:
        'Nhập yêu cầu tinh chỉnh (VD: "ngắn gọn hơn", "thực hành nhiều hơn", "dễ tiếp cận hơn")...',
      applyBtn: 'Áp dụng tinh chỉnh',
      applyingBtn: 'Đang tái xếp hạng...',
      presetShorter: 'Ngắn gọn hơn',
      presetPractical: 'Thực hành nhiều hơn',
      presetTheoretical: 'Thiên về lý thuyết',
      presetEasier: 'Dễ đọc hơn',
      understoodLabel: 'Hệ thống đã hiểu (bấm × để gỡ):',
      clearAllChipsBtn: 'Xóa mọi tinh chỉnh',
      removeChipAria: 'Gỡ bỏ điều kiện tinh chỉnh',
      keptPreviousNotice:
        'Tinh chỉnh quá hẹp không khớp thêm sách mới — đang giữ danh sách đã xác thực hiện tại.',
      truncatedNotice:
        'Yêu cầu quá dài đã được rút gọn về 260 ký tự đầu tiên để xử lý an toàn.',
      dataOnlySecurityNote:
        'Văn bản tinh chỉnh chỉ được xử lý như dữ liệu lọc/xếp hạng, không bao giờ tắt kiểm chứng nguồn.',
    },
    quickFilters: {
      title: 'Bộ lọc nhanh trên kết quả hiện tại:',
      allLengths: 'Mọi độ dài',
      allLevels: 'Mọi trình độ',
      allLanguages: 'Mọi ấn bản',
      langViAvailable: 'Có bản Tiếng Việt',
      langEnOriginal: 'Bản gốc Tiếng Anh',
      resetBtn: 'Đặt lại bộ lọc',
      noFilterMatchTitle: 'Không có cuốn sách nào khớp bộ lọc nhanh đang chọn',
      noFilterMatchDesc:
        'Hãy đặt lại bộ lọc nhanh bên trên để xem lại toàn bộ sách đã kiểm chứng trong phiên.',
    },
    dismissBanner: {
      dismissedPrefix: 'Đã ẩn',
      replacementAddedPrefix: 'Đã thay thế bằng sách xác thực:',
      noReplacementAvailable:
        'Hiện không còn ứng viên thay thế mới đạt chuẩn xác thực trong bể dự phòng.',
      undoBtnTemplate: 'Hoàn tác ({sec}s)',
    },
    roadmapView: {
      title: 'Con Đường Tri Thức (The Path — 3D & 2D)',
      subtitle:
        'Hành trình tự học từ nền tảng nhập môn đến tư duy hệ thống chuyên sâu. Bấm vào từng bậc đá hoặc bìa sách để xem lý do chuyển tiếp.',
      mode3dBtn: 'Không gian Lộ trình 3D',
      mode2dBtn: 'Danh sách Lộ trình 2D',
      stepLabel: 'Chặng',
      whyThisStepOrderLabel: 'Vì sao đọc cuốn này ở bước này:',
      totalPagesLabel: 'Tổng khối lượng lộ trình:',
      inspectStepBtn: 'Xem hồ sơ kiểm chứng & chi tiết',
      keyboardHint:
        'Dùng phím Tab hoặc mũi tên Trái/Phải để di chuyển qua từng bước đọc.',
      openInDiscoverBtn: 'Mở toàn màn hình Lộ trình 3D',
    },
    trustDrawer: {
      title: 'Hồ sơ Kiểm chứng & Chi tiết Tác phẩm',
      subtitle:
        'ShelfPath chỉ hiển thị sách sau khi đối chiếu thành công nhan đề chuẩn hóa và họ tác giả với cơ sở dữ liệu thư viện mở.',
      closeBtn: 'Đóng hồ sơ',
      verificationStatusLabel: 'Trạng thái kiểm chứng',
      verifiedStatusText: 'ĐÃ XÁC THỰC BẢN GHI THẬT (FAIL-CLOSED PASSED)',
      matchedSourcesLabel: 'Nguồn danh mục đối chiếu',
      normalizedTitleLabel: 'Nhan đề truy vấn (đã chuẩn hóa)',
      matchedRecordTitleLabel: 'Nhan đề bản ghi gốc',
      titleSimilarityLabel: 'Độ tương đồng nhan đề (Fuzzy Match)',
      authorSurnameLabel: 'Họ tác giả đối khớp bắt buộc',
      isbnLabel: 'Mã định danh ISBN-13',
      firstPublishedLabel: 'Năm xuất bản lần đầu',
      externalLinksTitle: 'Kiểm tra trực tiếp trên danh mục gốc:',
      openInOpenLibrary: 'Xem trên Open Library',
      openInGoogleBooks: 'Xem trên Google Books',
      failClosedNote:
        'Cam kết Fail-Closed: Mọi ứng viên thiếu tác giả hoặc độ khớp nhan đề dưới ngưỡng an toàn đều bị hủy bỏ hoàn toàn.',
      descriptionHeader: 'Tổng quan & Lý do Gợi ý',
      editionMetadataHeader: 'Thông số Ấn bản & Ngôn ngữ',
      checkingEditionText: 'Đang kiểm tra danh mục ấn bản Tiếng Việt...',
    },
    myShelf: {
      title: 'Kệ sách Cá nhân (Lưu trên Trình duyệt)',
      subtitle:
        'Danh sách đọc của bạn được lưu cục bộ ngay trên trình duyệt này. Không cần đăng ký tài khoản, không thu thập dữ liệu.',
      emptyStateTitle: 'Kệ sách của bạn đang trống',
      emptyStateGuide:
        'Hãy quay lại mục Khám phá và bấm "Lưu vào kệ" ở những cuốn sách bạn muốn đọc theo lộ trình.',
      statusToRead: 'Sắp đọc',
      statusReading: 'Đang đọc',
      statusDone: 'Đã đọc xong',
      removeBookBtn: 'Xóa khỏi kệ',
      clearShelfBtn: 'Xóa toàn bộ kệ sách',
      moveUpBtn: 'Chuyển lên',
      moveDownBtn: 'Chuyển xuống',
      exportMarkdownBtn: 'Xuất Markdown (.md)',
      exportCsvBtn: 'Xuất CSV (Excel UTF-8)',
      printPdfBtn: 'Bản in / Lưu PDF',
      exportDisclaimer:
        'Chỉ xuất siêu dữ liệu và liên kết nguồn xác thực (Open Library / Google Books). Không bao giờ chứa nội dung sách.',
      statsSummaryTemplate:
        '{total} sách · {toRead} sắp đọc · {reading} đang đọc · {done} đã xong · {pages} trang',
      privacyNotice:
        'Dữ liệu chỉ tồn tại trên thiết bị của bạn (localStorage kèm bộ nhớ dự phòng an toàn).',
    },
    states: {
      emptyTitle: 'Chưa có sách nào trong lộ trình hiện tại',
      emptyDescription:
        'Bạn đã ẩn hết các gợi ý hoặc chủ đề quá hẹp. Hãy thử một chủ đề rộng hơn hoặc nạp lại lộ trình mẫu.',
      emptyActionBtn: 'Nạp lộ trình mẫu đã kiểm chứng',
      loadingTitle: 'Đang truy vấn và đối chiếu danh mục sách quốc tế...',
      loadingSubtitle:
        'Từng cuốn sách vượt qua bước kiểm tra Open Library & Google Books sẽ xuất hiện ngay bên dưới.',
      errorTitle:
        'Tạm dừng hiển thị do nguồn kiểm chứng không phản hồi (Fail-Closed)',
      errorOutageMessage:
        'Open Library và Google Books hiện không phản hồi hoặc thiếu khóa cấu hình. Theo nguyên tắc Fail-Closed, ShelfPath tuyệt đối không hiển thị sách chưa được xác thực.',
      rateLimitTitle: 'Bạn đang thao tác quá nhanh (Giới hạn tần suất)',
      rateLimitMessage:
        'Để bảo vệ hạn mức truy vấn miễn phí của Open Library và Google Books, vui lòng đợi vài giây trước khi tạo lộ trình mới.',
      cancelledTitle: 'Đã dừng tiến trình tìm kiếm',
      cancelledMessage:
        'Bạn đã hủy lượt tìm kiếm hiện tại. Bạn có thể giữ lại các sách đã xác thực hoặc thử chủ đề mới.',
      retryBtn: 'Thử lại với dữ liệu mẫu an toàn',
      validationEmptyTopic:
        'Vui lòng nhập chủ đề hoặc chọn một gợi ý bên dưới.',
      offlineBanner:
        'Bạn đang ngoại tuyến (Offline). Bạn vẫn có thể xem, lọc, sắp xếp và xuất Kệ sách cá nhân hoặc duyệt dữ liệu đã lưu trong phiên.',
      oneSourceDownBanner:
        'Một nguồn danh mục đang phản hồi chậm — hệ thống đang kiểm chứng bằng nguồn danh mục còn lại.',
    },
    vision: {
      title: 'Tầm nhìn Sản phẩm & Kiến trúc Kiểm chứng',
      subtitle:
        'Giải quyết triệt để vấn đề AI bịa đặt sách tham khảo (hallucination) trong giáo dục đại học và tự học.',
      problemTitle:
        '1. Bài toán cốt lõi: AI truyền thống bịa sách và thiếu trình tự sư phạm',
      problemBody:
        'Khi sinh viên hỏi các chatbot AI thông thường "Đọc sách gì để học một ngành mới?", tới 20–35% nhan đề hoặc ISBN có nguy cơ bị pha trộn giữa sách có thật và sách không tồn tại. Hơn nữa, việc đọc sai thứ tự (đọc sách chuyên sâu trước sách nhập môn) khiến người tự học dễ bỏ cuộc.',
      roadmapTitle: '2. Lộ trình Phát triển 3 Giai đoạn',
      phase1Title: 'Giai đoạn 1: Kiểm chứng Kép & Lộ trình Cá nhân hóa',
      phase1Desc:
        'Xác thực 100% ứng viên qua Open Library + Google Books, xếp hạng đa dạng hóa MMR và giải thích lý do từng chặng đọc.',
      phase2Title: 'Giai đoạn 2: Liên thông Thư viện Đại học tại Việt Nam',
      phase2Desc:
        'Tích hợp tra cứu mục lục OPAC của các thư viện đại học lớn để sinh viên biết sách nào có sẵn bản in tiếng Việt.',
      phase3Title: 'Giai đoạn 3: Bản đồ Tri thức Mở Liên ngành',
      phase3Desc:
        'Xây dựng đồ thị lộ trình đọc cộng đồng đã xác thực cho hơn 200 chuyên ngành đại học mà vẫn giữ nguyên triết lý không theo dõi cá nhân.',
      architectureTitle:
        '3. Sơ đồ Kiến trúc Pipeline Kiểm chứng 6 Bước (Fail-Closed)',
      sustainabilityTitle: '4. Mô hình Bền vững & Cam kết Quyền riêng tư',
      sustainabilityBody:
        'Sử dụng bộ nhớ đệm (TTL Caching) cho kết quả kiểm chứng danh mục để giảm 80% tải API, kết hợp dữ liệu mở phi lợi nhuận từ Open Library (Internet Archive).',
    },
    footer: {
      tagline:
        'ShelfPath — Xây dựng lộ trình tự học minh bạch cho sinh viên đại học.',
      privacyGuarantee:
        'Không tài khoản · Không theo dõi · Chỉ hiển thị sách đã xác thực nguồn.',
    },
  },
  en: {
    brand: {
      name: 'ShelfPath',
      subtitle: 'Verified Self-Learning Book Roadmaps',
    },
    nav: {
      discover: 'Discover',
      roadmap: 'My Roadmap',
      myShelf: 'My Shelf',
      vision: 'Architecture',
      trySampleCta: 'Sample Data',
      languageToggleLabel: 'Chuyển sang Tiếng Việt (VI)',
      themeToggleLight: 'Light Mode',
      themeToggleDark: 'Dark Mode',
    },
    hero: {
      kicker: 'START YOUR PATH · 100% CATALOG-VERIFIED BOOKS',
      headline: 'What should I read first, and what comes next?',
      subheadline:
        'Designed for university students teaching themselves a new field from scratch. Every book is verified against Open Library & Google Books, ranked with MMR, and ordered into a clear sequence.',
      topicInputLabel: 'Topic or field you want to learn',
      topicPlaceholder:
        'Search topic, field, or skill (e.g., Machine Learning, Stoic Philosophy)...',
      primarySearchCta: 'Start reading path',
      secondarySampleCta: 'Try with sample data',
      cancelSearchBtn: 'Cancel search',
      suggestedTopicsLabel: 'Starter topics for self-learners:',
      customizeToggleShow:
        'Customize level, book length & adventurousness slider',
      customizeToggleHide: 'Hide customization panel',
      sampleDataBadge: 'Sample data',
      livePipelineBadge: 'Live Verified Pipeline',
      sampleDataNotice:
        'Showing pre-verified Sample data (MOCK_MODE) — every book links to a real Open Library & Google Books record.',
      livePipelineNotice:
        'Running Live Verification Pipeline (Gemini Grounding + Open Library + Embeddings MMR over SSE).',
      secretsWarningTitle: 'Server Secrets Configuration Notice:',
      view3dToggle: '3D Shelf',
      view2dToggle: '2D Map',
      webglFallbackNotice:
        'Using resource-friendly 2D/Lite rendering mode for maximum device compatibility.',
      shelfCaptionVerified: 'Verified on shelf',
      shelfCaptionRemoved: 'Removed candidates',
      modeSwitchLive: 'Switch to Live Pipeline',
      modeSwitchSample: 'Switch to Sample Mode',
      spotlightHeader: 'Verification Stage & Reading Progress',
      sessionTimelineTitle: 'Session Roadmap Progress',
      sessionTimelineEmpty:
        'Save books from the verified list to track To Read · Reading · Done progress here.',
    },
    preferences: {
      sectionTitle: 'Tailor your reading roadmap',
      levelLabel: 'Starting level',
      levels: {
        beginner: 'Beginner (From scratch)',
        intermediate: 'Intermediate',
        advanced: 'Advanced',
      },
      lengthLabel: 'Preferred book length',
      lengths: {
        any: 'Any length',
        short: 'Short (<250 pages)',
        medium: 'Medium (250–450 pages)',
        deep: 'Deep (>450 pages)',
      },
      languageLabel: 'Book edition language',
      languages: {
        any: 'Any language',
        en: 'English editions',
        vi: 'Prefer Vietnamese edition available',
      },
      adventurousnessLabel: 'Adventurousness (MMR Diversity)',
      adventurousnessLow: 'Core canon',
      adventurousnessHigh: 'Verified surprises',
      adventurousnessExplanations: {
        focused:
          'Prioritizing foundational, widely cited canonical textbooks directly tied to your topic.',
        balanced:
          'Balancing core foundational texts with practical, complementary perspectives (Balanced MMR).',
        exploratory:
          'Maximizing cross-disciplinary verified surprises that broaden how you think about this field.',
      },
    },
    pipeline: {
      title: 'Transparent Verification & Ranking Pipeline (SSE)',
      stages: {
        searching: 'Searching web',
        extracting: 'Extracting schema',
        verifying: 'Verifying catalogs',
        ranking: 'Ranking (MMR)',
        building_path: 'Building path',
        completed: 'Path complete',
      },
      liveCounterTemplate:
        '{found} found · {verified} verified · {removed} removed',
      removedLogTitle: 'Removed unverified candidates log',
      groundingSourcesTitle: 'Google Search Grounding Sources:',
      queriesTitle: 'Executed search queries:',
      simulateOutageBtn: 'Simulate Source Outage (Fail-Closed)',
      restoreServiceBtn: 'Restore Catalog Connection',
      cancelStreamBtn: 'Cancel stream',
    },
    cards: {
      sectionTitle: 'Verified & Ranked Reading List',
      sectionSubtitle:
        'Every book matched title and author surname in Open Library or Google Books before ranking.',
      roadmapToggleGrid: 'Book Cards',
      roadmapTogglePath: 'Explore 3D Path (The Path)',
      verifiedOpenLibrary: 'Verified · Open Library',
      verifiedGoogleBooks: 'Verified · Google Books',
      verifiedBoth: 'Verified · Open Library & Google Books',
      pagesUnit: 'pages',
      levelBeginner: 'Beginner',
      levelIntermediate: 'Intermediate',
      levelAdvanced: 'Advanced',
      whyMatchLabel: 'Why this matches your goal:',
      roadmapOrderReasonLabel: 'Why read at this step:',
      vietnameseEditionAvailable: 'Vietnamese edition found',
      vietnameseEditionNotKnown:
        'No Vietnamese edition found in our sources',
      vietnameseEditionSourceLink: 'View edition record',
      howWeCheckedBtn: 'How we checked',
      sourceLinkOpenLibrary: 'Open Library',
      sourceLinkGoogleBooks: 'Google Books',
      saveToShelfBtn: 'Save to shelf',
      savedInShelfBtn: 'Saved in shelf',
      notInterestedBtn: 'Not interested',
      stepPrefix: 'Step',
      relevanceBadge: 'Match',
      diversityBadge: 'MMR Diversity',
      diffMovedUp: '↑ Moved up',
      diffMovedDown: '↓ Moved down',
      diffNewReplacement: '✦ New verified match',
    },
    refinement: {
      title: 'Refine results in plain language',
      placeholder:
        'Type how to adjust (e.g., "shorter", "more practical", "more accessible")...',
      applyBtn: 'Apply refinement',
      applyingBtn: 'Re-ranking pool...',
      presetShorter: 'Shorter',
      presetPractical: 'More practical',
      presetTheoretical: 'More theoretical',
      presetEasier: 'More accessible',
      understoodLabel: 'Interpreted adjustments (click × to remove):',
      clearAllChipsBtn: 'Clear all refinements',
      removeChipAria: 'Remove refinement chip',
      keptPreviousNotice:
        'Refinement was too narrow to match additional books — keeping your current verified list.',
      truncatedNotice:
        'Long input was safely trimmed to 260 characters for processing.',
      dataOnlySecurityNote:
        'User text is treated strictly as ranking data and can never bypass catalog verification.',
    },
    quickFilters: {
      title: 'Quick client filters on current results:',
      allLengths: 'All lengths',
      allLevels: 'All levels',
      allLanguages: 'All editions',
      langViAvailable: 'Vietnamese edition found',
      langEnOriginal: 'English original',
      resetBtn: 'Reset filters',
      noFilterMatchTitle: 'No books match the active quick filters',
      noFilterMatchDesc:
        'Reset the quick filters above to view all verified books in your current session.',
    },
    dismissBanner: {
      dismissedPrefix: 'Dismissed',
      replacementAddedPrefix: 'Replaced with verified match:',
      noReplacementAvailable:
        'No additional verified replacements remain in the current pool.',
      undoBtnTemplate: 'Undo ({sec}s)',
    },
    roadmapView: {
      title: 'The Learning Path (3D Spatial & 2D Roadmap)',
      subtitle:
        'A structured beginner-to-advanced reading sequence. Select any stepping stone or book to inspect why it belongs at that stage.',
      mode3dBtn: '3D Spatial Path',
      mode2dBtn: '2D Roadmap List',
      stepLabel: 'Milestone',
      whyThisStepOrderLabel: 'Why read this book at this step:',
      totalPagesLabel: 'Total roadmap volume:',
      inspectStepBtn: 'Inspect verification & book details',
      keyboardHint:
        'Use Tab or Left/Right arrow keys to step through the reading roadmap.',
      openInDiscoverBtn: 'Open Full-Width 3D Path View',
    },
    trustDrawer: {
      title: 'Verification Record & Book Details',
      subtitle:
        'ShelfPath shows a book only after its normalized title and author surname match a real record in Open Library or Google Books.',
      closeBtn: 'Close record',
      verificationStatusLabel: 'Verification status',
      verifiedStatusText: 'REAL RECORD VERIFIED (FAIL-CLOSED PASSED)',
      matchedSourcesLabel: 'Matched catalog sources',
      normalizedTitleLabel: 'Normalized query title',
      matchedRecordTitleLabel: 'Matched catalog title',
      titleSimilarityLabel: 'Title similarity score',
      authorSurnameLabel: 'Mandatory author surname matched',
      isbnLabel: 'ISBN-13 identifier',
      firstPublishedLabel: 'First published year',
      externalLinksTitle: 'Inspect live catalog records:',
      openInOpenLibrary: 'Open in Open Library',
      openInGoogleBooks: 'Open in Google Books',
      failClosedNote:
        'Fail-Closed Policy: Any candidate failing author surname matching or falling below the title similarity threshold is discarded.',
      descriptionHeader: 'Overview & Match Rationale',
      editionMetadataHeader: 'Edition & Catalog Metadata',
      checkingEditionText: 'Checking Vietnamese edition catalog records...',
    },
    myShelf: {
      title: 'My Session Shelf (Browser-Only Storage)',
      subtitle:
        'Your saved books live strictly in this browser. No account, no login, and no personal tracking.',
      emptyStateTitle: 'Your reading shelf is empty',
      emptyStateGuide:
        'Return to Discover and click "Save to shelf" on any verified book you want to read.',
      statusToRead: 'To read',
      statusReading: 'Reading',
      statusDone: 'Done',
      removeBookBtn: 'Remove',
      clearShelfBtn: 'Clear all',
      moveUpBtn: 'Move up',
      moveDownBtn: 'Move down',
      exportMarkdownBtn: 'Export Markdown (.md)',
      exportCsvBtn: 'Export CSV (UTF-8 BOM)',
      printPdfBtn: 'Print / Save PDF',
      exportDisclaimer:
        'Exports verified metadata and source links only (Open Library / Google Books). Never includes book content.',
      statsSummaryTemplate:
        '{total} books · {toRead} to read · {reading} reading · {done} done · {pages} pages',
      privacyNotice:
        'Stored locally on your device (localStorage with safe in-memory fallback).',
    },
    states: {
      emptyTitle: 'No verified books remain in this view',
      emptyDescription:
        'You dismissed all current recommendations or the filter was too narrow. Try reloading the verified sample roadmap.',
      emptyActionBtn: 'Load verified sample roadmap',
      loadingTitle:
        'Querying and verifying against international book catalogs...',
      loadingSubtitle:
        'Each book that passes Open Library & Google Books verification will appear below.',
      errorTitle:
        'Results withheld: Verification sources unreachable (Fail-Closed)',
      errorOutageMessage:
        'Open Library and Google Books did not respond in time or required secrets are missing. Per our Fail-Closed rule, ShelfPath never displays unverified books.',
      rateLimitTitle: 'Too many requests (Rate limit active)',
      rateLimitMessage:
        'To protect Open Library and Google Books public quotas, please wait a few seconds before starting another search.',
      cancelledTitle: 'Search stream cancelled',
      cancelledMessage:
        'You stopped the active search stream. You can explore the books verified so far or start a new topic.',
      retryBtn: 'Retry with verified sample data',
      validationEmptyTopic:
        'Please enter a topic or pick a starter chip below.',
      offlineBanner:
        'You are currently offline. Your Session Shelf, quick filters, exports, and verified session books remain available.',
      oneSourceDownBanner:
        'One catalog source is slow to respond — verifying candidates against the remaining live catalog.',
    },
    vision: {
      title: 'Product Vision & Fail-Closed Verification Architecture',
      subtitle:
        'Eliminating hallucinated citations in student self-learning through deterministic catalog verification.',
      problemTitle:
        '1. Core Problem: Free-form AI fabricates books and ignores learning sequence',
      problemBody:
        'When students ask generic AI chatbots for reading lists, 20–35% of suggested titles or ISBNs can be fabricated or conflated. Worse, reading advanced monographs before foundational introductions causes learners to quit.',
      roadmapTitle: '2. Three-Stage Product Roadmap',
      phase1Title: 'Phase 1: Dual-Catalog Verification & MMR Roadmaps',
      phase1Desc:
        '100% candidate verification against Open Library + Google Books, MMR diversity ranking, and step-by-step pedagogical ordering.',
      phase2Title: 'Phase 2: University Library OPAC Integration',
      phase2Desc:
        'Connect with university library catalogs so students can check local print availability and Vietnamese translations.',
      phase3Title: 'Phase 3: Open Verified Curriculum Graph',
      phase3Desc:
        'Build an open, privacy-preserving graph of verified reading roadmaps across 200+ academic disciplines.',
      architectureTitle:
        '3. Six-Stage Verification Pipeline Architecture (SVG)',
      sustainabilityTitle: '4. Sustainability & Privacy Model',
      sustainabilityBody:
        'TTL caching reduces external catalog lookups by 80%, pairing lightweight Gemini models with non-profit Open Library data.',
    },
    footer: {
      tagline:
        'ShelfPath — Calm, honest, verified reading roadmaps for students.',
      privacyGuarantee:
        'No accounts · No tracking · 100% catalog-verified books only.',
    },
  },
};
