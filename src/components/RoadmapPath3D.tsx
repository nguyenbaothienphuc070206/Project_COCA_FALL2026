'use client';

/**
 * Tính năng: Không gian Lộ trình đọc "The Path" (RoadmapPath3D) — Chế độ 3D Stepping-Stone Path toàn chiều rộng & Danh sách Lộ trình 2D tương đương 100% thông tin (Phase 3B).
 * Trường hợp sử dụng: Trực quan hóa trình tự đọc sách từ Nhập môn đến Chuyên sâu với đường dẫn phát sáng (Path Glow), bục đá cột mốc và sách 3D lấy màu từ Design Tokens ở cả chế độ Sáng/Tối.
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Box,
  ExternalLink,
  Info,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { VerifiedBook } from '../types/book';
import { useTranslation } from '../i18n/useTranslation';
import { getThemePalette } from '../config/tokens';
import { ProceduralBookCover } from './ProceduralBookCover';

interface RoadmapPath3DProps {
  books: VerifiedBook[];
  savedBookIds: Set<string>;
  onToggleSave: (book: VerifiedBook) => void;
  onOpenTrustDrawer: (book: VerifiedBook) => void;
}

function probeWebGL(): { supported: boolean; isSoftwareGl: boolean } {
  if (typeof document === 'undefined') {
    return { supported: false, isSoftwareGl: true };
  }
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return { supported: false, isSoftwareGl: true };
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    const isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    return { supported: true, isSoftwareGl };
  } catch {
    return { supported: false, isSoftwareGl: true };
  }
}

export function RoadmapPath3D({
  books,
  savedBookIds,
  onToggleSave,
  onOpenTrustDrawer,
}: RoadmapPath3DProps) {
  const { locale, t, isDark } = useTranslation();
  const mountRef = useRef<HTMLDivElement | null>(null);

  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [webglInfo] = useState(() => probeWebGL());
  const [viewMode, setViewMode] = useState<'3d' | '2d'>(() => {
    if (typeof window === 'undefined') return '3d';
    const isMobile = window.innerWidth < 768;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!probeWebGL().supported || isMobile || reduced) return '2d';
    return '3d';
  });

  const safeActiveIdx =
    books.length > 0 ? Math.min(activeStepIndex, books.length - 1) : 0;
  const activeBook = books[safeActiveIdx] ?? null;

  const booksRef = useRef<VerifiedBook[]>(books);
  const activeIdxRef = useRef<number>(safeActiveIdx);
  const rebuildRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    booksRef.current = books;
    activeIdxRef.current = safeActiveIdx;
    rebuildRef.current?.();
  }, [books, safeActiveIdx, isDark]);

  useEffect(() => {
    if (viewMode !== '3d' || !webglInfo.supported) return;
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = webglInfo.isSoftwareGl;
    const width = Math.max(container.clientWidth, 320);
    const height = Math.max(container.clientHeight, 300);

    const scene = new THREE.Scene();
    const initialPal = getThemePalette(
      document.documentElement.classList.contains('dark'),
    );
    scene.background = new THREE.Color(initialPal.surfaceHex);
    scene.fog = new THREE.Fog(initialPal.surfaceHex, 9, 22);

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 50);
    camera.position.set(0, 3.1, 7.2);
    camera.lookAt(0, 0.7, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2),
    );
    renderer.setSize(width, height);

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const hemiLight = new THREE.HemisphereLight(
      initialPal.ambientColor,
      0x1e293b,
      0.95,
    );
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(initialPal.keyLightColor, 1.7);
    keyLight.position.set(4, 7, 5);
    scene.add(keyLight);

    const pathGlowLight = new THREE.PointLight(
      initialPal.pathGlowColor,
      2.2,
      8,
    );
    pathGlowLight.position.set(0, 1.5, 1);
    scene.add(pathGlowLight);

    const pathGroup = new THREE.Group();
    scene.add(pathGroup);
    const interactables: THREE.Object3D[] = [];

    function rebuildPathScene() {
      const darkNow = document.documentElement.classList.contains('dark');
      const pal = getThemePalette(darkNow);
      scene.background = new THREE.Color(pal.surfaceHex);
      scene.fog = new THREE.Fog(pal.surfaceHex, 9, 22);
      pathGlowLight.color.setHex(pal.pathGlowColor);

      while (pathGroup.children.length > 0) {
        const child = pathGroup.children[0];
        pathGroup.remove(child);
      }
      interactables.length = 0;

      const list = booksRef.current;
      if (list.length === 0) {
        renderer.render(scene, camera);
        return;
      }

      const count = list.length;
      const points: THREE.Vector3[] = [];
      const spanX = Math.min(6.4, Math.max(3.2, (count - 1) * 1.65));
      const startX = -spanX / 2;

      for (let i = 0; i < count; i++) {
        const tRatio = count === 1 ? 0.5 : i / (count - 1);
        const x = startX + tRatio * spanX;
        const y = i * 0.24;
        const z = Math.sin(tRatio * Math.PI) * -0.95;
        points.push(new THREE.Vector3(x, y, z));
      }

      // Đường dẫn phát sáng (Glowing Path Ribbon) nối giữa các cột mốc
      if (points.length >= 2) {
        const curve = new THREE.CatmullRomCurve3(points);
        const tubeGeo = new THREE.TubeGeometry(curve, 36, 0.055, 8, false);
        const tubeMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(pal.pathGlowColor),
          emissive: new THREE.Color(pal.pathGlowColor),
          emissiveIntensity: 0.45,
          roughness: 0.3,
          metalness: 0.4,
        });
        const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
        pathGroup.add(tubeMesh);
      }

      // Tạo từng bục đá cột mốc (Stepping Stone) + Sách 3D đứng trên bục
      points.forEach((pt, idx) => {
        const book = list[idx];
        if (!book) return;
        const isCurrent = idx === activeIdxRef.current;

        const milestoneGroup = new THREE.Group();
        milestoneGroup.position.copy(pt);

        // Bục đá tròn (Stepping Stone Pedestal)
        const stoneGeo = new THREE.CylinderGeometry(0.55, 0.64, 0.18, 24);
        const stoneMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(
            isCurrent ? pal.pathActiveStoneColor : pal.pathStoneColor,
          ),
          roughness: 0.55,
          metalness: 0.15,
        });
        const stoneMesh = new THREE.Mesh(stoneGeo, stoneMat);
        stoneMesh.userData = { stepIdx: idx };
        milestoneGroup.add(stoneMesh);
        interactables.push(stoneMesh);

        // Vòng phát sáng quanh cột mốc đang chọn
        if (isCurrent) {
          const ringGeo = new THREE.TorusGeometry(0.68, 0.03, 12, 32);
          const ringMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(pal.pathGlowColor),
            emissive: new THREE.Color(pal.pathGlowColor),
            emissiveIntensity: 0.7,
          });
          const ringMesh = new THREE.Mesh(ringGeo, ringMat);
          ringMesh.rotation.x = Math.PI / 2;
          ringMesh.position.y = 0.05;
          milestoneGroup.add(ringMesh);
          pathGlowLight.position.set(pt.x, pt.y + 1.8, pt.z + 1.2);
        }

        // Khối sách 3D đứng trên bục cột mốc
        const bookH = isCurrent ? 1.42 : 1.22;
        const bookW = 0.82;
        const bookD = THREE.MathUtils.clamp(book.pageCount / 1600, 0.18, 0.34);

        const coverMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(book.coverColorHex || '#1D2D44'),
          roughness: 0.48,
          metalness: 0.18,
        });
        const bookMesh = new THREE.Mesh(
          new THREE.BoxGeometry(bookW, bookH, bookD),
          coverMat,
        );
        bookMesh.position.set(0, 0.09 + bookH / 2, 0);
        bookMesh.rotation.y = isCurrent ? 0.16 : -0.18;
        bookMesh.userData = { stepIdx: idx };
        milestoneGroup.add(bookMesh);
        interactables.push(bookMesh);

        // Dải nhũ vàng (Foil Band) trên mặt trước bìa sách 3D
        const bandMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(isCurrent ? '#F59E0B' : '#FDE68A'),
          roughness: 0.25,
          metalness: 0.85,
        });
        const bandMesh = new THREE.Mesh(
          new THREE.BoxGeometry(bookW * 0.78, 0.08, bookD * 1.03),
          bandMat,
        );
        bandMesh.position.set(0, 0.09 + bookH * 0.72, 0);
        bandMesh.rotation.y = bookMesh.rotation.y;
        bandMesh.userData = { stepIdx: idx };
        milestoneGroup.add(bandMesh);

        // Khối giấy bên trong cạnh phải của sách
        const pageMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(pal.pageBlockColor),
          roughness: 0.85,
        });
        const pageMesh = new THREE.Mesh(
          new THREE.BoxGeometry(bookW * 0.92, bookH * 0.94, bookD * 0.84),
          pageMat,
        );
        pageMesh.position.set(0.04, 0.09 + bookH / 2, 0);
        pageMesh.rotation.y = bookMesh.rotation.y;
        pageMesh.userData = { stepIdx: idx };
        milestoneGroup.add(pageMesh);

        pathGroup.add(milestoneGroup);
      });

      renderer.render(scene, camera);
    }

    rebuildRef.current = rebuildPathScene;
    rebuildPathScene();

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const handlePointerDown = (ev: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(interactables, false);
      if (hits.length > 0) {
        const idx = hits[0].object.userData?.stepIdx;
        if (typeof idx === 'number') {
          setActiveStepIndex(idx);
        }
      }
    };

    const handleResize = () => {
      if (!container) return;
      const w = Math.max(container.clientWidth, 320);
      const h = Math.max(container.clientHeight, 300);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.render(scene, camera);
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('resize', handleResize);

    return () => {
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [viewMode, webglInfo]);

  const totalPages = books.reduce((sum, b) => sum + b.pageCount, 0);

  return (
    <section
      aria-label={t.roadmapView.title}
      className="w-full space-y-6"
    >
      {/* Top Stage Header + 3D / 2D Switch */}
      <div className="rounded-[24px] border border-[#E2DDD0] dark:border-[#282E3E] bg-[#EFECE3] dark:bg-[#171B26] overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[#E2DDD0] dark:border-[#282E3E] flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-serif-display text-xl sm:text-2xl font-bold text-[#1A1D24] dark:text-[#F5F2EB]">
              {t.roadmapView.title}
            </h1>
            <p className="text-xs sm:text-sm text-[#524F49] dark:text-[#B8B2A6]">
              {t.roadmapView.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3.5 py-1.5 rounded-full bg-[#FDFCF9] dark:bg-[#1E2330] border border-[#E2DDD0] dark:border-[#282E3E] text-xs font-mono">
              {t.roadmapView.totalPagesLabel}{' '}
              <strong className="text-[#C8433C] dark:text-[#DF5A53]">
                {totalPages}
              </strong>{' '}
              {t.cards.pagesUnit}
            </span>

            <div className="flex items-center gap-1 p-1 rounded-full bg-[#FDFCF9] dark:bg-[#1E2330] border border-[#E2DDD0] dark:border-[#282E3E]">
              <button
                type="button"
                onClick={() => setViewMode('3d')}
                disabled={!webglInfo.supported}
                className={`min-h-[36px] px-3.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === '3d' && webglInfo.supported
                    ? 'bg-[#C8433C] dark:bg-[#DF5A53] text-white'
                    : 'text-[#524F49] dark:text-[#B8B2A6]'
                }`}
              >
                <Box className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t.roadmapView.mode3dBtn}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('2d')}
                className={`min-h-[36px] px-3.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === '2d' || !webglInfo.supported
                    ? 'bg-[#C8433C] dark:bg-[#DF5A53] text-white'
                    : 'text-[#524F49] dark:text-[#B8B2A6]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t.roadmapView.mode2dBtn}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Full-Width 3D Path Canvas + Interactive Stepper Controls */}
        {viewMode === '3d' && webglInfo.supported && (
          <div>
            <div
              ref={mountRef}
              data-testid="roadmap-path-3d-canvas"
              className="w-full h-[300px] sm:h-[360px] cursor-pointer"
            />

            {/* Keyboard-accessible Milestone Stepper Bar */}
            <div className="p-4 sm:p-5 bg-[#FDFCF9] dark:bg-[#1E2330] border-t border-[#E2DDD0] dark:border-[#282E3E] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {books.map((b, idx) => {
                    const isSelected = idx === safeActiveIdx;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setActiveStepIndex(idx)}
                        className={`min-h-[40px] px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#C8433C] dark:bg-[#DF5A53] text-white shadow-xs'
                            : 'bg-[#EFECE3] dark:bg-[#171B26] text-[#1A1D24] dark:text-[#F5F2EB]'
                        }`}
                      >
                        {t.cards.stepPrefix} {idx + 1}: {b.title}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveStepIndex((prev) => Math.max(0, prev - 1))
                    }
                    disabled={safeActiveIdx === 0}
                    aria-label="Previous step"
                    className="w-10 h-10 rounded-full border border-[#E2DDD0] dark:border-[#282E3E] flex items-center justify-center disabled:opacity-40 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveStepIndex((prev) =>
                        Math.min(books.length - 1, prev + 1),
                      )
                    }
                    disabled={safeActiveIdx >= books.length - 1}
                    aria-label="Next step"
                    className="w-10 h-10 rounded-full border border-[#E2DDD0] dark:border-[#282E3E] flex items-center justify-center disabled:opacity-40 cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Active Milestone Detail Spotlight */}
              {activeBook && (
                <div className="p-4 sm:p-5 rounded-2xl bg-[#F7F5EE] dark:bg-[#11141C] border border-[#E2DDD0] dark:border-[#282E3E] flex flex-col sm:flex-row items-start gap-5">
                  <ProceduralBookCover book={activeBook} size="sm" />
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-[#C8433C] dark:text-[#DF5A53]">
                        {locale === 'vi'
                          ? activeBook.roadmapStageLabelVi
                          : activeBook.roadmapStageLabelEn}
                      </span>
                      <span className="text-xs text-[#6E6A61] dark:text-[#8E887C]">
                        · {activeBook.pageCount} {t.cards.pagesUnit}
                      </span>
                    </div>
                    <h3 className="font-serif-display text-lg font-bold text-[#1A1D24] dark:text-[#F5F2EB]">
                      {activeBook.title} — {activeBook.authors.join(', ')}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#524F49] dark:text-[#B8B2A6]">
                      <strong className="text-[#1A1D24] dark:text-[#F5F2EB]">
                        {t.roadmapView.whyThisStepOrderLabel}
                      </strong>{' '}
                      {locale === 'vi'
                        ? activeBook.roadmapStepReasonVi
                        : activeBook.roadmapStepReasonEn}
                    </p>
                    <div className="pt-1 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenTrustDrawer(activeBook)}
                        className="min-h-[38px] px-4 py-1.5 rounded-full bg-[#1D212A] dark:bg-[#F5F2EB] text-white dark:text-[#11141C] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Info className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{t.roadmapView.inspectStepBtn}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2D Editorial Roadmap Sequence List (Carrying 100% identical information with Phase 3A styling) */}
      <ol className="space-y-4">
        {books.map((book, idx) => {
          const isSaved = savedBookIds.has(book.id);
          const stageTitle =
            locale === 'vi'
              ? book.roadmapStageLabelVi
              : book.roadmapStageLabelEn;
          const stepWhy =
            locale === 'vi'
              ? book.roadmapStepReasonVi
              : book.roadmapStepReasonEn;
          const matchWhy =
            locale === 'vi' ? book.matchReasonVi : book.matchReasonEn;
          const sourceUrl =
            book.verification.openLibraryUrl ||
            book.verification.googleBooksUrl ||
            'https://openlibrary.org';

          return (
            <li
              key={book.id}
              className={`rounded-[22px] border p-5 transition-all bg-[#FDFCF9] dark:bg-[#1E2330] ${
                idx === safeActiveIdx
                  ? 'border-[#C8433C] dark:border-[#DF5A53] shadow-sm'
                  : 'border-[#E2DDD0] dark:border-[#282E3E]'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start gap-5">
                <div className="flex items-center gap-4 shrink-0">
                  <span className="w-10 h-10 rounded-full bg-[#C8433C] dark:bg-[#DF5A53] text-white font-mono font-bold text-sm flex items-center justify-center shrink-0">
                    0{idx + 1}
                  </span>
                  <ProceduralBookCover book={book} size="sm" showStepBadge={false} />
                </div>

                <div className="flex-1 min-w-0 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#C8433C] dark:text-[#DF5A53]">
                      {stageTitle}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#DCFCE7] dark:bg-[#0D2818] text-[#146C43] dark:text-[#4ADE80] text-xs font-semibold inline-flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>
                        {book.verification.matchedSources === 'both'
                          ? t.cards.verifiedBoth
                          : book.verification.matchedSources === 'open_library'
                            ? t.cards.verifiedOpenLibrary
                            : t.cards.verifiedGoogleBooks}
                      </span>
                    </span>
                  </div>

                  <h3 className="font-serif-display text-lg sm:text-xl font-bold text-[#1A1D24] dark:text-[#F5F2EB]">
                    {book.title}{' '}
                    <span className="text-sm font-sans font-normal text-[#524F49] dark:text-[#B8B2A6]">
                      — {book.authors.join(', ')} ({book.pageCount} {t.cards.pagesUnit})
                    </span>
                  </h3>

                  <p className="text-xs sm:text-sm text-[#1A1D24] dark:text-[#F5F2EB] bg-[#F7F5EE] dark:bg-[#11141C] p-3 rounded-xl border border-[#E2DDD0] dark:border-[#282E3E]">
                    <strong>{t.roadmapView.whyThisStepOrderLabel}</strong> {stepWhy}
                  </p>

                  <p className="text-xs italic text-[#524F49] dark:text-[#B8B2A6]">
                    &ldquo;{matchWhy}&rdquo;
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => onToggleSave(book)}
                      className={`min-h-[40px] px-4 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                        isSaved
                          ? 'bg-[#C8433C] text-white'
                          : 'bg-[#1D212A] dark:bg-[#F5F2EB] text-white dark:text-[#11141C]'
                      }`}
                    >
                      {isSaved ? (
                        <BookmarkCheck className="w-3.5 h-3.5" aria-hidden="true" />
                      ) : (
                        <Bookmark className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                      <span>
                        {isSaved ? t.cards.savedInShelfBtn : t.cards.saveToShelfBtn}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenTrustDrawer(book)}
                      className="min-h-[40px] px-3.5 py-1.5 rounded-full border border-[#E2DDD0] dark:border-[#282E3E] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Info className="w-3.5 h-3.5 text-[#C8433C]" aria-hidden="true" />
                      <span>{t.cards.howWeCheckedBtn}</span>
                    </button>

                    <a
                      href={sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[40px] px-3.5 py-1.5 rounded-full border border-[#E2DDD0] dark:border-[#282E3E] text-xs font-medium inline-flex items-center gap-1"
                    >
                      <span>
                        {book.verification.openLibraryUrl
                          ? t.cards.sourceLinkOpenLibrary
                          : t.cards.sourceLinkGoogleBooks}
                      </span>
                      <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    </a>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
