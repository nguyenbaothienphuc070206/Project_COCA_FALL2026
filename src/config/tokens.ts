/**
 * Tính năng: Hệ thống Design Tokens tập trung cho ShelfPath (Phase 3A & 3B — "E-Book Dashboard" Editorial Split Palette).
 * Trường hợp sử dụng: Quản lý nhất quán bảng màu 60-30-10, ánh sáng không gian 3D (Hero Shelf & The Path), chữ, bo góc và đổ bóng.
 */

export const DESIGN_TOKENS = {
  colors: {
    light: {
      backdrop: '#DCD9CE', // Nền đá ấm bao quanh khung ứng dụng
      bgPrimary: '#F7F5EE', // 60% Nền giấy Alabaster ấm bên trái
      bgSecondary: '#EFECE3', // 30% Nền kem ấm bên phải (Split Panel)
      bgSurface: '#FDFCF9', // Thẻ nổi / Tờ chi tiết sách
      textPrimary: '#1A1D24', // Mực than đậm (WCAG AAA 15.8:1)
      textSecondary: '#524F49', // Chữ phụ (WCAG AA 7.1:1)
      textMuted: '#6E6A61', // Chú thích (Điều chỉnh từ #8C887F để đạt WCAG AA 4.85:1)
      borderSubtle: '#E2DDD0', // Đường kẻ chia cột tinh tế
      ctaBg: '#1D212A', // Nút viên thuốc màu than đậm ("Start reading ↗")
      ctaText: '#FFFFFF',
      accentCoral: '#C8433C', // 10% Đỏ san hô đất nung (WCAG AA 4.92:1 với chữ trắng)
      accentCoralSoft: '#F9E2DF',
      verifiedGreen: '#146C43', // Huy hiệu Đã kiểm chứng Open Library / Google Books
      verifiedGreenSoft: '#DCFCE7',
      dangerRose: '#BE123C',
    },
    dark: {
      backdrop: '#090B10',
      bgPrimary: '#11141C',
      bgSecondary: '#171B26',
      bgSurface: '#1E2330',
      textPrimary: '#F5F2EB',
      textSecondary: '#B8B2A6',
      textMuted: '#8E887C',
      borderSubtle: '#282E3E',
      ctaBg: '#F5F2EB',
      ctaText: '#11141C',
      accentCoral: '#DF5A53',
      accentCoralSoft: '#2D1819',
      verifiedGreen: '#4ADE80',
      verifiedGreenSoft: '#0D2818',
      dangerRose: '#FB7185',
    },
  },
  scene3D: {
    light: {
      surfaceHex: 0xefece3,
      ambientColor: 0xf7f5ee,
      keyLightColor: 0xfff8eb,
      rimLightColor: 0xc8433c,
      shelfWoodColor: 0x7c5332,
      bookendColor: 0xc8433c,
      pathGlowColor: 0xc8433c,
      pathStoneColor: 0xe2ddd0,
      pathActiveStoneColor: 0xc8433c,
      pageBlockColor: 0xfdfcf9,
    },
    dark: {
      surfaceHex: 0x171b26,
      ambientColor: 0xd8d4cb,
      keyLightColor: 0xffeacc,
      rimLightColor: 0xdf5a53,
      shelfWoodColor: 0x5c3a21,
      bookendColor: 0xdf5a53,
      pathGlowColor: 0xdf5a53,
      pathStoneColor: 0x262c3d,
      pathActiveStoneColor: 0xdf5a53,
      pageBlockColor: 0xf3efe6,
    },
  },
  bookCoverPalette: [
    '#1D2D44', // Deep Midnight Navy (inspired by Beauty & the Beast cover)
    '#7F1D1D', // Targaryen Crimson (inspired by Fire & Blood cover)
    '#1B263B', // Narnia Indigo Slate
    '#1E3F2B', // Forest Emerald (inspired by The Wise Man's Fear cover)
    '#3D2645', // Royal Plum
    '#5C3A21', // Warm Leather Bronze
    '#1F4E5B', // Deep Teal
  ] as const,
  spacing: {
    gridUnitPx: 8,
    minTouchTargetPx: 44,
  },
  radii: {
    shell: 'rounded-[28px]',
    panel: 'rounded-[20px]',
    card: 'rounded-[18px]',
    pill: 'rounded-full',
  },
} as const;

/**
 * Trả về bộ token màu và ánh sáng 3D tương ứng với chế độ Sáng / Tối.
 */
export function getThemePalette(isDark: boolean) {
  return isDark ? DESIGN_TOKENS.scene3D.dark : DESIGN_TOKENS.scene3D.light;
}
