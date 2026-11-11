'use client';

/**
 * Tính năng: Kệ sách 3D (The 3D Signature Hero Shelf) kèm Sơ đồ 2D tương đương 100% thông tin.
 * Trường hợp sử dụng: Khi các sự kiện SSE `book_verified` và `book_removed` tới, sách đã xác thực đóng dấu lên kệ gỗ trong khi các ứng viên bị loại bỏ hiển thị dạng khung tan biến (dissolved wireframe).
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Box, CheckCircle2, Layers, ShieldAlert } from 'lucide-react';
import { PipelineStageKey, RejectedCandidateLog, VerifiedBook } from '../types/book';
import { useTranslation } from '../i18n/useTranslation';
import { getThemePalette } from '../config/tokens';

interface HeroShelf3DProps {
  books: VerifiedBook[];
  rejectedCandidates: RejectedCandidateLog[];
  pipelineStage: PipelineStageKey;
  selectedBookId: string | null;
  onSelectBook: (book: VerifiedBook) => void;
}

function detectSoftwareOrMissingWebGL(): { supported: boolean; isSoftwareGl: boolean } {
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

/**
 * Tạo mô hình 3D thủ tục 5 thành phần cho sách đã xác thực trên kệ.
 */
function createProceduralBookGroup(
  book: VerifiedBook,
  index: number,
  total: number,
  isSelected: boolean,
): THREE.Group {
  const group = new THREE.Group();
  group.name = `book-${book.id}`;
  group.userData = { bookId: book.id };

  const thickness = THREE.MathUtils.clamp(book.pageCount / 1600, 0.24, 0.54);
  const height = 1.65 + (index % 3) * 0.12;
  const depth = 1.18;

  const coverColor = new THREE.Color(book.coverColorHex || '#1E3A5F');

  const coverGeo = new THREE.BoxGeometry(thickness, height, depth);
  const coverMat = new THREE.MeshStandardMaterial({
    color: coverColor,
    roughness: 0.65,
    metalness: 0.12,
  });
  const coverMesh = new THREE.Mesh(coverGeo, coverMat);
  coverMesh.position.y = height / 2;
  coverMesh.userData = { bookId: book.id };
  group.add(coverMesh);

  const pagesGeo = new THREE.BoxGeometry(thickness * 0.84, height * 0.95, depth * 0.94);
  const pagesMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#F5EFE0'),
    roughness: 0.88,
    metalness: 0.02,
  });
  const pagesMesh = new THREE.Mesh(pagesGeo, pagesMat);
  pagesMesh.position.set(0, height / 2, 0.03);
  pagesMesh.userData = { bookId: book.id };
  group.add(pagesMesh);

  const spineGeo = new THREE.CylinderGeometry(
    thickness / 2,
    thickness / 2,
    height,
    12,
  );
  const spineMat = new THREE.MeshStandardMaterial({
    color: coverColor.clone().multiplyScalar(0.85),
    roughness: 0.4,
    metalness: 0.2,
  });
  const spineMesh = new THREE.Mesh(spineGeo, spineMat);
  spineMesh.position.set(0, height / 2, depth / 2);
  spineMesh.userData = { bookId: book.id };
  group.add(spineMesh);

  const bandGeo = new THREE.BoxGeometry(thickness * 1.05, 0.06, 0.14);
  const bandMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(isSelected ? '#F59E0B' : '#D97706'),
    roughness: 0.22,
    metalness: 0.85,
  });
  const topBand = new THREE.Mesh(bandGeo, bandMat);
  topBand.position.set(0, height * 0.82, depth / 2 + 0.02);
  group.add(topBand);

  const bottomBand = new THREE.Mesh(bandGeo, bandMat);
  bottomBand.position.set(0, height * 0.22, depth / 2 + 0.02);
  group.add(bottomBand);

  const sealGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.03, 16);
  const sealMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#22C55E'),
    roughness: 0.3,
    metalness: 0.5,
  });
  const sealMesh = new THREE.Mesh(sealGeo, sealMat);
  sealMesh.rotation.x = Math.PI / 2;
  sealMesh.position.set(0, height * 0.52, depth / 2 + thickness * 0.52);
  group.add(sealMesh);

  const spacing = 0.58;
  const startX = -((total - 1) * spacing) / 2 - 0.15;
  group.position.set(startX + index * spacing, 0.12, isSelected ? 0.28 : 0);

  return group;
}

/**
 * Tạo khối khung dây (dissolving wireframe) biểu diễn ứng viên không vượt qua kiểm chứng bị loại khỏi kệ.
 */
function createDissolvedRejectedGroup(index: number): THREE.Group {
  const group = new THREE.Group();
  const geo = new THREE.BoxGeometry(0.28, 1.35, 0.95);
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#F43F5E'),
    roughness: 0.5,
    metalness: 0.1,
    wireframe: true,
    transparent: true,
    opacity: 0.45,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = 0.68;
  group.add(mesh);

  group.position.set(1.45 + index * 0.34, 0.22 + index * 0.08, -0.15);
  group.rotation.z = -0.18 - index * 0.08;
  return group;
}

export function HeroShelf3D({
  books,
  rejectedCandidates,
  pipelineStage,
  selectedBookId,
  onSelectBook,
}: HeroShelf3DProps) {
  const { locale, t, isDark } = useTranslation();
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const [webglAvailable] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return detectSoftwareOrMissingWebGL().supported;
  });
  const [prefer2D, setPrefer2D] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const probe = detectSoftwareOrMissingWebGL();
    return !probe.supported || reducedMotion;
  });

  const booksRef = useRef<VerifiedBook[]>(books);
  const rejectedRef = useRef<RejectedCandidateLog[]>(rejectedCandidates);
  const selectedIdRef = useRef<string | null>(selectedBookId);
  const onSelectBookRef = useRef(onSelectBook);
  const requestRenderRef = useRef<(() => void) | null>(null);
  const rebuildBooksSceneRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    booksRef.current = books;
    rejectedRef.current = rejectedCandidates;
    selectedIdRef.current = selectedBookId;
    onSelectBookRef.current = onSelectBook;
    if (rebuildBooksSceneRef.current) {
      rebuildBooksSceneRef.current();
    }
    if (requestRenderRef.current) {
      requestRenderRef.current();
    }
  }, [books, rejectedCandidates, selectedBookId, onSelectBook, isDark]);

  useEffect(() => {
    if (prefer2D || !webglAvailable) return;
    const container = canvasMountRef.current;
    if (!container) return;

    const probe = detectSoftwareOrMissingWebGL();
    if (!probe.supported) {
      return;
    }

    const isSoftwareGl = probe.isSoftwareGl;
    const width = Math.max(container.clientWidth, 300);
    const height = Math.max(container.clientHeight, 240);

    const scene = new THREE.Scene();
    const palette = getThemePalette(document.documentElement.classList.contains('dark'));
    scene.background = new THREE.Color(palette.surfaceHex);
    scene.fog = new THREE.Fog(palette.surfaceHex, 7, 16);

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 40);
    camera.position.set(0, 1.45, 5.2);
    camera.lookAt(0, 0.85, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const hemiLight = new THREE.HemisphereLight(palette.ambientColor, 0x1e293b, 0.9);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(palette.keyLightColor, 1.65);
    keyLight.position.set(3.5, 5.5, 4.2);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(palette.rimLightColor, 0.6);
    rimLight.position.set(-4, 2.5, -3);
    scene.add(rimLight);

    const shelfGroup = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.shelfWoodColor),
      roughness: 0.72,
      metalness: 0.08,
    });
    const brassMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(palette.bookendColor),
      roughness: 0.28,
      metalness: 0.75,
    });

    const plankMesh = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.14, 1.65), woodMat);
    plankMesh.position.set(0, 0.05, 0);
    shelfGroup.add(plankMesh);

    const leftBookend = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.25, 1.2), brassMat);
    leftBookend.position.set(-2.15, 0.7, 0);
    shelfGroup.add(leftBookend);

    const rightBookend = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.25, 1.2), brassMat);
    rightBookend.position.set(2.15, 0.7, 0);
    shelfGroup.add(rightBookend);

    scene.add(shelfGroup);

    const dynamicBooksGroup = new THREE.Group();
    scene.add(dynamicBooksGroup);
    const interactables: THREE.Object3D[] = [];

    function rebuildBooks() {
      const darkNow = document.documentElement.classList.contains('dark');
      const nextPal = getThemePalette(darkNow);
      scene.background = new THREE.Color(nextPal.surfaceHex);
      scene.fog = new THREE.Fog(nextPal.surfaceHex, 7, 16);
      woodMat.color.setHex(nextPal.shelfWoodColor);
      brassMat.color.setHex(nextPal.bookendColor);

      while (dynamicBooksGroup.children.length > 0) {
        const child = dynamicBooksGroup.children[0];
        dynamicBooksGroup.remove(child);
      }
      interactables.length = 0;

      const visibleBooks = booksRef.current.slice(0, 8);
      visibleBooks.forEach((book, idx) => {
        const bGroup = createProceduralBookGroup(
          book,
          idx,
          visibleBooks.length,
          book.id === selectedIdRef.current,
        );
        dynamicBooksGroup.add(bGroup);
        interactables.push(...bGroup.children);
      });

      const rejectedSlice = rejectedRef.current.slice(0, 2);
      rejectedSlice.forEach((_rej, idx) => {
        dynamicBooksGroup.add(createDissolvedRejectedGroup(idx));
      });

      renderer.render(scene, camera);
    }

    rebuildBooksSceneRef.current = rebuildBooks;
    rebuildBooks();

    let frameId = 0;
    let renderBusy = false;
    let renderDirty = false;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function requestRender() {
      if (document.hidden) return;
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame(() => {
        renderDirty = false;
        renderer.render(scene, camera);
        const done = () => {
          renderBusy = false;
          if (renderDirty) requestRender();
        };
        if (isSoftwareGl) afterDraw(done);
        else done();
      });
    }

    requestRenderRef.current = requestRender;
    requestRender();

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const handlePointerDown = (ev: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(interactables, false);
      if (hits.length > 0) {
        const hitBookId = hits[0].object.userData?.bookId;
        if (hitBookId) {
          const found = booksRef.current.find((b) => b.id === hitBookId);
          if (found) onSelectBookRef.current(found);
        }
      }
    };

    const handleResize = () => {
      if (!container) return;
      const w = Math.max(container.clientWidth, 300);
      const h = Math.max(container.clientHeight, 240);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      requestRender();
    };

    const handleVisibility = () => {
      if (!document.hidden) requestRender();
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
      renderer.dispose();
    };
  }, [prefer2D, webglAvailable]);

  return (
    <section
      aria-label="Interactive Library Shelf"
      className="rounded-[22px] border border-[#E2DDD0] dark:border-[#282E3E] bg-[#EFECE3] dark:bg-[#171B26] overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-[#E2DDD0] dark:border-[#282E3E] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1.5 font-semibold text-[#146C43] dark:text-[#4ADE80]">
            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="font-mono font-bold text-[#C8433C] dark:text-[#DF5A53]">
              {String(books.length).padStart(2, '0')}
            </span>
            <span>{t.hero.shelfCaptionVerified}</span>
          </span>
          <span aria-hidden="true" className="text-[#6E6A61]">
            ·
          </span>
          <span className="inline-flex items-center gap-1 text-[#524F49] dark:text-[#B8B2A6]">
            <ShieldAlert className="w-3.5 h-3.5 text-[#BE123C] dark:text-[#FB7185] shrink-0" aria-hidden="true" />
            <span className="font-mono">{rejectedCandidates.length}</span>
            <span>{t.hero.shelfCaptionRemoved}</span>
          </span>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-full bg-[#FDFCF9] dark:bg-[#1E2330] border border-[#E2DDD0] dark:border-[#282E3E]">
          <button
            type="button"
            onClick={() => setPrefer2D(false)}
            disabled={!webglAvailable}
            className={`min-h-[34px] px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              !prefer2D && webglAvailable
                ? 'bg-[#C8433C] dark:bg-[#DF5A53] text-white'
                : 'text-[#524F49] dark:text-[#B8B2A6]'
            }`}
          >
            <Box className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t.hero.view3dToggle}</span>
          </button>
          <button
            type="button"
            onClick={() => setPrefer2D(true)}
            className={`min-h-[34px] px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              prefer2D || !webglAvailable
                ? 'bg-[#C8433C] dark:bg-[#DF5A53] text-white'
                : 'text-[#524F49] dark:text-[#B8B2A6]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t.hero.view2dToggle}</span>
          </button>
        </div>
      </div>

      {!prefer2D && webglAvailable ? (
        <div className="relative">
          <div
            ref={canvasMountRef}
            data-testid="hero-shelf-3d-canvas"
            data-stage={pipelineStage}
            className="w-full h-[250px] sm:h-[280px] cursor-pointer"
          />
          <div className="px-4 py-2.5 bg-[#FDFCF9]/95 dark:bg-[#1E2330]/95 border-t border-[#E2DDD0] dark:border-[#282E3E] flex items-center gap-2 overflow-x-auto">
            {books.map((book) => (
              <button
                key={book.id}
                type="button"
                onClick={() => onSelectBook(book)}
                className={`min-h-[38px] px-3.5 py-1 rounded-full text-xs font-medium whitespace-nowrap shrink-0 border transition-colors cursor-pointer ${
                  selectedBookId === book.id
                    ? 'border-[#C8433C] bg-[#F9E2DF] dark:bg-[#2D1819] text-[#1A1D24] dark:text-[#F5F2EB] font-semibold'
                    : 'border-[#E2DDD0] dark:border-[#282E3E] text-[#524F49] dark:text-[#B8B2A6] hover:text-[#1A1D24] dark:hover:text-[#F5F2EB]'
                }`}
              >
                <span className="tabular-nums font-bold text-[#C8433C] dark:text-[#DF5A53] mr-1.5">
                  {t.cards.stepPrefix} {book.roadmapStepOrder}:
                </span>
                <span>{book.title}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div
          data-testid="hero-shelf-2d-fallback"
          className="p-4 sm:p-5 bg-[#FDFCF9] dark:bg-[#1E2330]"
        >
          <p className="text-xs text-[#6E6A61] dark:text-[#8E887C] mb-3">
            {t.hero.webglFallbackNotice}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {books.map((book) => (
              <button
                key={book.id}
                type="button"
                onClick={() => onSelectBook(book)}
                className="text-left p-3.5 rounded-2xl border border-[#E2DDD0] dark:border-[#282E3E] bg-[#F7F5EE] dark:bg-[#11141C] hover:border-[#C8433C] transition-colors cursor-pointer"
              >
                <div className="text-xs text-[#C8433C] dark:text-[#DF5A53] font-semibold mb-1 tabular-nums">
                  {locale === 'vi' ? book.roadmapStageLabelVi : book.roadmapStageLabelEn}
                </div>
                <div className="font-serif-display font-semibold text-sm text-[#1A1D24] dark:text-[#F5F2EB] line-clamp-1">
                  {book.title}
                </div>
                <div className="text-xs text-[#524F49] dark:text-[#B8B2A6] mt-1">
                  {book.authors.join(', ')} · <span className="tabular-nums">{book.pageCount}</span> {t.cards.pagesUnit}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
