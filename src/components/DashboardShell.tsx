'use client';

/**
 * Tính năng: Khung ứng dụng E-Book Dashboard (DashboardShell) theo thiết kế tham chiếu MindInventory.
 * Trường hợp sử dụng:
 * - >= 1024px: Thanh bên đầy đủ (Full Sidebar) bên trái với biểu tượng tròn màu đỏ san hô (#C8433C) khi đang chọn.
 * - 768px – 1023px: Thanh đường ray chỉ hiển thị biểu tượng (Icon-only Rail).
 * - < 768px: Thanh điều hướng viên thuốc nổi ở đáy màn hình (Floating Bottom Pill Tab Bar).
 * - Thanh tìm kiếm trên cùng (Top Search Bar) là nơi nhập chủ đề chính ở mọi màn hình.
 */

import React from 'react';
import {
  Bookmark,
  Compass,
  Globe,
  Layers,
  Moon,
  Radio,
  Route,
  Search,
  Sparkles,
  Sun,
} from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';

export type ActiveTab = 'discover' | 'roadmap' | 'shelf' | 'vision';

interface DashboardShellProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  savedCount: number;
  topicQuery: string;
  onChangeTopicQuery: (val: string) => void;
  onSubmitTopicSearch: () => void;
  useMockMode: boolean;
  onTogglePipelineMode: () => void;
  onLoadSampleData: () => void;
  isLoading: boolean;
  children: React.ReactNode;
}

export function DashboardShell({
  activeTab,
  onSelectTab,
  savedCount,
  topicQuery,
  onChangeTopicQuery,
  onSubmitTopicSearch,
  useMockMode,
  onTogglePipelineMode,
  onLoadSampleData,
  isLoading,
  children,
}: DashboardShellProps) {
  const { locale, setLocale, t, isDark, toggleTheme } = useTranslation();
  const toggleLocale = () => setLocale(locale === 'vi' ? 'en' : 'vi');
  const theme = isDark ? 'dark' : 'light';

  const navItems: Array<{
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badgeCount?: number;
  }> = [
    { id: 'discover', label: t.nav.discover, icon: Compass },
    { id: 'roadmap', label: t.nav.roadmap, icon: Route },
    {
      id: 'shelf',
      label: t.nav.myShelf,
      icon: Bookmark,
      badgeCount: savedCount,
    },
    { id: 'vision', label: t.nav.vision, icon: Layers },
  ];

  const handleTopBarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicQuery.trim()) return;
    onSelectTab('discover');
    onSubmitTopicSearch();
  };

  return (
    <div className="min-h-screen w-full bg-[#DCD9CE] dark:bg-[#090B10] text-[#1A1D24] dark:text-[#F5F2EB] lg:p-4 xl:p-6 transition-colors">
      {/* WCAG 2.2 AA Skip Link for Keyboard Users */}
      <a
        href="#main-workspace-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:rounded-full focus:bg-[#C8433C] focus:text-white focus:text-xs focus:font-bold focus:shadow-lg"
      >
        {locale === 'vi'
          ? 'Bỏ qua thanh điều hướng để tới nội dung chính'
          : 'Skip to main content'}
      </a>
      <div className="max-w-[1440px] mx-auto min-h-screen lg:min-h-[calc(100vh-3rem)] lg:rounded-[28px] bg-[#F7F5EE] dark:bg-[#11141C] border border-[#E2DDD0] dark:border-[#282E3E] shadow-[0_24px_60px_-15px_rgba(24,22,20,0.18)] flex flex-col md:flex-row overflow-hidden">
        {/* LEFT SIDEBAR (>= 1024px Full Sidebar | 768px-1023px Icon-Only Rail) */}
        <aside
          aria-label="Primary Sidebar Navigation"
          className="hidden md:flex flex-col justify-between shrink-0 md:w-20 lg:w-60 border-r border-[#E2DDD0] dark:border-[#282E3E] bg-[#F7F5EE] dark:bg-[#11141C] py-6 px-3 lg:px-5 select-none"
        >
          {/* Brand Logo Mark */}
          <div className="space-y-8">
            <button
              type="button"
              onClick={() => onSelectTab('discover')}
              className="min-h-[44px] w-full flex items-center justify-center lg:justify-start gap-3 text-left group rounded-xl px-1"
            >
              <span className="w-11 h-11 rounded-full border-2 border-[#1A1D24] dark:border-[#F5F2EB] flex items-center justify-center font-serif-display font-bold text-lg tracking-tighter bg-[#FDFCF9] dark:bg-[#1E2330] shrink-0 group-hover:border-[#C8433C] dark:group-hover:border-[#DF5A53] transition-colors">
                SP
              </span>
              <div className="hidden lg:block overflow-hidden">
                <span className="block font-serif-display text-xl font-bold tracking-tight text-[#1A1D24] dark:text-[#F5F2EB] leading-none">
                  {t.brand.name}
                </span>
                <span className="block text-[11px] text-[#6E6A61] dark:text-[#8E887C] truncate mt-1">
                  {t.brand.subtitle}
                </span>
              </div>
            </button>

            {/* Primary Navigation Items */}
            <nav aria-label="Main Menu" className="space-y-2.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectTab(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    title={item.label}
                    className={`min-h-[48px] w-full rounded-full flex items-center justify-center lg:justify-start gap-3.5 px-1.5 lg:px-2.5 py-1.5 text-sm font-medium transition-all ${
                      isActive
                        ? 'text-[#1A1D24] dark:text-[#F5F2EB] font-semibold lg:bg-[#EFECE3] lg:dark:bg-[#171B26]'
                        : 'text-[#524F49] dark:text-[#B8B2A6] hover:text-[#1A1D24] dark:hover:text-[#F5F2EB]'
                    }`}
                  >
                    <span
                      className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-transform ${
                        isActive
                          ? 'bg-[#C8433C] dark:bg-[#DF5A53] text-white shadow-[0_8px_18px_-4px_rgba(200,67,60,0.55)] scale-105'
                          : 'bg-transparent text-[#1A1D24] dark:text-[#F5F2EB] hover:bg-[#EFECE3] dark:hover:bg-[#171B26]'
                      }`}
                    >
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </span>
                    <span className="hidden lg:inline truncate">{item.label}</span>
                    {typeof item.badgeCount === 'number' && (
                      <span
                        className={`hidden lg:inline-flex ml-auto px-2 py-0.5 rounded-full text-xs font-mono ${
                          isActive
                            ? 'bg-[#C8433C] text-white'
                            : 'bg-[#EFECE3] dark:bg-[#1E2330] text-[#524F49] dark:text-[#B8B2A6]'
                        }`}
                      >
                        {item.badgeCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Sidebar Controls: Language & Theme Switches */}
          <div className="pt-6 border-t border-[#E2DDD0] dark:border-[#282E3E] space-y-2">
            <button
              type="button"
              onClick={toggleLocale}
              aria-label={t.nav.languageToggleLabel}
              title={t.nav.languageToggleLabel}
              className="min-h-[44px] w-full rounded-full flex items-center justify-center lg:justify-start gap-3 px-2 py-1.5 text-xs font-semibold text-[#524F49] dark:text-[#B8B2A6] hover:bg-[#EFECE3] dark:hover:bg-[#171B26] transition-colors"
            >
              <span className="w-9 h-9 rounded-full border border-[#E2DDD0] dark:border-[#282E3E] bg-[#FDFCF9] dark:bg-[#1E2330] flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4 text-[#1A1D24] dark:text-[#F5F2EB]" aria-hidden="true" />
              </span>
              <span className="hidden lg:inline">
                {locale === 'vi' ? 'Tiếng Việt · EN' : 'English · VI'}
              </span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                theme === 'light' ? t.nav.themeToggleDark : t.nav.themeToggleLight
              }
              title={
                theme === 'light' ? t.nav.themeToggleDark : t.nav.themeToggleLight
              }
              className="min-h-[44px] w-full rounded-full flex items-center justify-center lg:justify-start gap-3 px-2 py-1.5 text-xs font-semibold text-[#524F49] dark:text-[#B8B2A6] hover:bg-[#EFECE3] dark:hover:bg-[#171B26] transition-colors"
            >
              <span className="w-9 h-9 rounded-full border border-[#E2DDD0] dark:border-[#282E3E] bg-[#FDFCF9] dark:bg-[#1E2330] flex items-center justify-center shrink-0">
                {theme === 'light' ? (
                  <Moon className="w-4 h-4 text-[#1A1D24]" aria-hidden="true" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-400" aria-hidden="true" />
                )}
              </span>
              <span className="hidden lg:inline">
                {theme === 'light' ? t.nav.themeToggleLight : t.nav.themeToggleDark}
              </span>
            </button>
          </div>
        </aside>

        {/* MAIN COLUMN: TOP SEARCH BAR + CONTENT AREA */}
        <div className="flex-1 flex flex-col min-w-0 pb-24 md:pb-0">
          {/* TOP BAR (Primary Topic Input + Mode & Sample Controls) */}
          <header className="min-h-[72px] px-4 sm:px-6 lg:px-8 py-3 border-b border-[#E2DDD0] dark:border-[#282E3E] bg-[#F7F5EE]/95 dark:bg-[#11141C]/95 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 sticky top-0 z-30">
            {/* Mobile Brand + Top Search Form */}
            <div className="flex items-center gap-3 flex-1 min-w-[220px] max-w-xl">
              <button
                type="button"
                onClick={() => onSelectTab('discover')}
                className="md:hidden w-10 h-10 rounded-full border-2 border-[#1A1D24] dark:border-[#F5F2EB] flex items-center justify-center font-serif-display font-bold text-sm shrink-0 bg-[#FDFCF9] dark:bg-[#1E2330]"
                aria-label={t.brand.name}
              >
                SP
              </button>

              <form onSubmit={handleTopBarSubmit} className="relative flex-1">
                <label htmlFor="top-bar-topic-search" className="sr-only">
                  {t.hero.topicInputLabel}
                </label>
                <Search
                  className="w-4 h-4 text-[#6E6A61] dark:text-[#8E887C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="top-bar-topic-search"
                  type="text"
                  value={topicQuery}
                  onChange={(e) => onChangeTopicQuery(e.target.value)}
                  placeholder={t.hero.topicPlaceholder}
                  disabled={isLoading}
                  className="min-h-[44px] w-full pl-10 pr-4 py-2 rounded-full bg-[#EFECE3]/80 dark:bg-[#171B26] border border-transparent focus:border-[#C8433C] focus:bg-[#FDFCF9] dark:focus:bg-[#1E2330] text-sm text-[#1A1D24] dark:text-[#F5F2EB] placeholder:text-[#6E6A61] dark:placeholder:text-[#8E887C] transition-colors"
                />
              </form>
            </div>

            {/* Right Status & Action Pills */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onTogglePipelineMode}
                className="min-h-[44px] px-3.5 py-1.5 rounded-full border border-[#E2DDD0] dark:border-[#282E3E] bg-[#FDFCF9] dark:bg-[#1E2330] text-xs font-semibold text-[#1A1D24] dark:text-[#F5F2EB] inline-flex items-center gap-2 hover:border-[#C8433C] transition-colors whitespace-nowrap shrink-0"
              >
                <Radio
                  className={`w-3.5 h-3.5 shrink-0 ${
                    useMockMode
                      ? 'text-[#C8433C] dark:text-[#DF5A53]'
                      : 'text-[#146C43] dark:text-[#4ADE80]'
                  }`}
                  aria-hidden="true"
                />
                <span className="hidden sm:inline">
                  {useMockMode ? t.hero.sampleDataBadge : t.hero.livePipelineBadge}
                </span>
              </button>

              <button
                type="button"
                onClick={onLoadSampleData}
                className="min-h-[44px] px-4 py-1.5 rounded-full bg-[#1D212A] dark:bg-[#F5F2EB] text-[#FFFFFF] dark:text-[#11141C] text-xs font-semibold inline-flex items-center gap-1.5 hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{t.nav.trySampleCta}</span>
              </button>

              {/* Mobile-only Language & Theme buttons in top bar */}
              <button
                type="button"
                onClick={toggleLocale}
                aria-label={t.nav.languageToggleLabel}
                className="md:hidden min-h-[44px] min-w-[44px] px-2.5 rounded-full border border-[#E2DDD0] dark:border-[#282E3E] bg-[#FDFCF9] dark:bg-[#1E2330] text-xs font-semibold flex items-center justify-center"
              >
                {locale.toUpperCase()}
              </button>

              <button
                type="button"
                onClick={toggleTheme}
                aria-label={
                  theme === 'light' ? t.nav.themeToggleDark : t.nav.themeToggleLight
                }
                className="md:hidden min-h-[44px] min-w-[44px] rounded-full border border-[#E2DDD0] dark:border-[#282E3E] bg-[#FDFCF9] dark:bg-[#1E2330] flex items-center justify-center"
              >
                {theme === 'light' ? (
                  <Moon className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-400" aria-hidden="true" />
                )}
              </button>
            </div>
          </header>

          {/* SHELL MAIN CONTENT */}
          <main id="main-workspace-content" tabIndex={-1} className="flex-1 flex flex-col focus:outline-none">
            {children}
          </main>
        </div>
      </div>

      {/* MOBILE FLOATING BOTTOM PILL TAB BAR (< 768px — Inspired by Reference Screen 6) */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-4 inset-x-4 z-40 flex justify-center pointer-events-none"
      >
        <div className="pointer-events-auto px-3 py-1.5 rounded-full bg-[#FDFCF9]/95 dark:bg-[#1E2330]/95 backdrop-blur-md border border-[#E2DDD0] dark:border-[#282E3E] shadow-[0_16px_40px_-10px_rgba(24,22,20,0.28)] flex items-center gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                className={`min-h-[44px] px-3 rounded-full flex items-center gap-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#C8433C] dark:bg-[#DF5A53] text-white shadow-sm'
                    : 'text-[#524F49] dark:text-[#B8B2A6]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                {isActive && <span className="truncate max-w-[90px]">{item.label}</span>}
                {typeof item.badgeCount === 'number' && item.badgeCount > 0 && !isActive && (
                  <span className="text-[10px] font-mono">{item.badgeCount}</span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
