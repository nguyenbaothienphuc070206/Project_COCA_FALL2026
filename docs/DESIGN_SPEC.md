# ShelfPath — Visual & Interaction Design Specification (`docs/DESIGN_SPEC.md`)

**Visual Reference Analyzed**: *"E-Book Dashboard"* concept by MindInventory (Dribbble), analyzed across the 6 attached reference screens (`original-b4264907313d968a5f9236d2fcc33169_30c1fcb3.webp` through `original-7108fc1e290ef37a2934a1af199bd6db_cafd28bc.webp`).

---

## 1. What Is Visibly Present in the Reference Images

### 1.1 Layout Grid & Spatial Architecture
- **Outer Frame & App Container**:
  - The dashboard sits inside a rounded application frame (`border-radius: 28px`) against a muted warm stone backdrop (`#DCD9CE`).
  - Inside the app container, the layout uses an **asymmetric vertical split background**:
    - **Left Navigation Rail**: `88px` wide fixed vertical column on the far left, separated by a `1px solid #E5E1D6` hairline divider.
    - **Primary Center Canvas**: Occupies ~58% of the content width on a warm alabaster paper surface (`#F7F5EE`).
    - **Secondary Right Panel**: Occupies ~42% of the content width on a slightly deeper warm cream surface (`#EFECE3`), creating a subtle two-tone editorial split without harsh borders.
- **Top Bar (`72px` height)**:
  - Left side: Minimalist magnifying glass icon + borderless search input (`"Search book name, author, edition ..."`).
  - Right side (in reference): User avatar + name + notification bell icon (mapped in ShelfPath to Pipeline Mode status + Language/Theme & Sample Data controls; no accounts).
- **Content Columns & Card Proportions**:
  - **Hero Split Row**: Left column holds a large two-line editorial serif headline (`"Happy reading, Harvey"` / `"Keep the story going.."`), a 3-line body paragraph (`max-width: 40ch`), and a dark charcoal pill CTA button (`"Start reading ↗"`). Right column holds a featured 3D/tactile book showcase + metadata summary (`154 / 300 pages` with coral accent on the numerator).
  - **Book Cover Row ("Popular Now" / Carousel)**: 4 to 5 vertical standing book cards (`aspect-ratio: 2 / 3`, width `140px–190px`, gap `28px`). In the carousel view (Screen 5), the active/featured book cover scales up (`~1.22x`) while adjacent covers sit aligned along the baseline.
  - **Bottom Horizontal Strip ("New Series Collection" / Footer Notice)**: Compact horizontal card with thumbnail on the left, title + chapter count in the center, and a two-tone numeric counter (`04 / 60 books`) on the right.
  - **Book Detail View (Screen 3)**: Two-column editorial sheet where a large standing book cover (`260px × 390px`) overlaps the top cream band and white lower card (`#FDFCF9`), paired with serif title, bold author, italic hook, dark pill CTA + 3 circular icon buttons (`44px × 44px`), and a 2-column metadata grid (`Description`, `Editors`, `Language`, `Paperback` with page count and ISBN).
  - **Tablet/Mobile Floating Dock (Screen 6)**: A centered floating pill bar at the bottom of the viewport (`border-radius: 9999px`, `#F7F5EE` surface, soft shadow) containing 6 icon buttons with the active item highlighted in a solid coral-red circle (`44px × 44px`).

---

### 1.2 Sampled Colour Palette (Hex Values)

| Token Role | Sampled Hex (Reference) | ShelfPath Token (WCAG 2.2 AA Checked) | Notes & Deliberate Accessibility Adjustments |
| :--- | :--- | :--- | :--- |
| **Outer Backdrop** | `#DCD9CE` | `--sp-bg-backdrop: #DCD9CE` | Warm stone outer frame visible around desktop canvas |
| **Primary Canvas (Left)** | `#F7F5EE` | `--sp-bg-primary: #F7F5EE` | Warm alabaster paper background |
| **Secondary Split (Right)** | `#EFECE3` | `--sp-bg-secondary: #EFECE3` | Deeper warm cream right-hand column & shelf backdrop |
| **Elevated Sheet / Card** | `#FDFCF9` | `--sp-bg-surface: #FDFCF9` | Crisp warm white used on the lower detail card (Screen 3) |
| **Primary Ink** | `#1A1D24` | `--sp-text-primary: #1A1D24` | Contrast `15.8:1` on `#F7F5EE` (passes AAA) |
| **Secondary Body Ink** | `#5A5852` | `--sp-text-secondary: #524F49` | Adjusted slightly darker from `#68655E` to `#524F49` for `7.1:1` AA contrast on `#EFECE3` |
| **Muted Caption Ink** | `#8C887F` | `--sp-text-muted: #6E6A61` | Deliberate deviation from `#8C887F` (`3.3:1`) to `#6E6A61` (`4.85:1`) to pass WCAG 2.2 AA for small text |
| **Primary Pill CTA Fill** | `#1D212A` | `--sp-cta-bg: #1D212A` | Deep charcoal navy pill (`"Start reading ↗"`) with `#FFFFFF` text (`15.2:1`) |
| **Signature Coral Accent** | `#DF5A53` | `--sp-accent-coral: #C8433C` | Active nav circle, page counter numerator (`154`), calendar highlight. Adjusted to `#C8433C` (`4.92:1` with white icon/text) for WCAG AA |
| **Soft Coral Tint** | `#F6DBD8` | `--sp-accent-coral-tint: #F9E2DF` | Text highlight tint seen in Screen 6 |
| **Verified Trust Green** | *(Derived for ShelfPath)* | `--sp-verified-green: #146C43` | Semantic badge for Open Library / Google Books verification (`6.1:1` contrast) |
| **Hairline Divider** | `#E5E1D6` | `--sp-border-subtle: #E2DDD0` | Vertical sidebar divider and card separators |

---

### 1.3 Typography

- **Display & Section Headlines**:
  - Reference uses a high-contrast editorial serif with calligraphic terminals (`Playfair Display` / `Lora` aesthetic).
  - **ShelfPath Font Choice**: **`Lora`** (`--font-lora`, weights `500`, `600`, `700`, italic) — full Vietnamese diacritic support (`Đ, ă, â, ê, ô, ơ, ư` and all 5 tone marks).
  - Scale:
    - Hero Headline: `clamp(2rem, 3.4vw, 3.1rem)`, line-height `1.14`, letter-spacing `-0.02em`, weight `600`.
    - Section Heading (`"Popular Now"`, `"Schedule Reading"` style): `1.35rem` (`21.6px`), line-height `1.28`, weight `600`.
    - Book Detail Title: `clamp(1.75rem, 2.6vw, 2.5rem)`, line-height `1.18`, weight `600`.
- **UI, Body, Metadata & Search Input**:
  - Reference uses a clean, humanist geometric sans-serif (`Plus Jakarta Sans` / `Be Vietnam Pro` aesthetic) with generous line height and italic accents for book hooks/quotes.
  - **ShelfPath Font Choice**: **`Be Vietnam Pro`** (`--font-be-vietnam`, weights `400`, `500`, `600`, `700`) — engineered specifically for Vietnamese legibility.
  - Scale:
    - Body Lead: `0.9375rem` (`15px`), line-height `1.65`, colour `--sp-text-secondary`.
    - Card Title: `0.9375rem` (`15px`), weight `600`, line-height `1.35`.
    - Metadata / Badges: `0.75rem` (`12px`), weight `500`, line-height `1.4`.
- **Monospace / Numeric Counters**:
  - `tabular-nums` for `04 / 20 candidates` and `154 / 320 pages` counters.

---

### 1.4 Corner Radii, Shadows, Spacing & Icon Style
- **Corner Radii**:
  - Outer Dashboard Shell: `28px` (`rounded-[28px]`) on desktop (`>=1024px`).
  - Primary CTA Buttons & Action Chips: `9999px` (`rounded-full`, pill-shaped `"Start reading ↗"`).
  - Icon Buttons & Active Nav Indicator: `9999px` (`44px × 44px` circle).
  - Content Panels & Detail Sheets: `20px` (`rounded-[20px]`).
  - Standing Book Covers: `4px 10px 10px 4px` (sharp spine on the left, slightly rounded fore-edge on the right).
- **Shadows**:
  - **Standing Book Cover Shadow** (signature visual element in Screens 1–5): Multi-layered directional drop shadow cast downward and to the left/bottom (`0 22px 34px -10px rgba(24, 22, 20, 0.34), -6px 12px 18px -6px rgba(24, 22, 20, 0.18)`).
  - **Floating Pill Dock / Drawer Shadow**: `0 16px 40px -12px rgba(24, 22, 20, 0.16)`.
- **Spacing Scale**: `8pt` base grid (`8px`, `16px`, `24px`, `32px`, `40px`, `48px`).
- **Icon Style**: `lucide-react` outline icons with `1.75px` stroke width. Active navigation icon sits inside a `44px × 44px` solid coral circle (`#C8433C`) with white stroke (`#FFFFFF`); inactive icons use `#1A1D24` at `75%` opacity on a transparent `44px × 44px` hit target.
- **Imagery Treatment**:
  - No stock photos, no scraped book covers, and no reference artwork are copied.
  - Every book cover is **procedurally generated** from its title, author, and topic category with a realistic left spine crease, subtle paper grain gradient, geometric vector emblem, foil typography, and verification seal.

---

## 2. What Is Derived Consistently (Not Shown in Reference)

1. **Dark Mode Theme (`dark`)**:
   - Derived directly from the warm editorial split palette:
     - Primary Canvas (Left): `#11141C` (Deep Midnight Slate)
     - Secondary Split (Right): `#171B26` (Elevated Library Night)
     - Elevated Card / Sheet: `#1E2330`
     - Primary Ink: `#F5F2EB`
     - Secondary Ink: `#B8B2A6`
     - Primary Pill CTA: `#F5F2EB` background with `#11141C` text (or coral `#DF5A53` accent)
     - Active Nav Circle: `#DF5A53` with `#FFFFFF` icon
2. **Responsive Breakpoints (`1024px`, `768px`, `375px`)**:
   - `>= 1024px`: Full left sidebar (`220px` with labels or `88px` rail + labels), two-column asymmetric split canvas (`7 cols` left / `5 cols` right).
   - `768px – 1023px`: Icon-only left rail (`80px`), stacked main content with 2-column book grids.
   - `< 768px` (`375px` mobile): Single-column vertical flow + **floating bottom pill tab bar** derived directly from Screen 6's floating pill toolbar.
3. **Interactive States & Accessibility**:
   - Visible `2px solid #C8433C` (`offset: 2px`) focus ring on all interactive controls (`:focus-visible`).
   - Full `prefers-reduced-motion: reduce` support disabling 3D camera bobbing and cover hover elevation transitions.

---

## 3. Complete Reference-to-ShelfPath Module Inventory & Mapping

| Reference Module (MindInventory E-Book Dashboard) | ShelfPath Equivalent Module | Status |
| :--- | :--- | :--- |
| **Left Vertical Icon Rail** (Logo, Home, Book, Timer, Bookmark, Gear, Bottom Menu) | **ShelfPath Navigation Rail / Sidebar**: Brand Mark, **Discover**, **My Roadmap (The Path)**, **My Shelf**, **Vision & Architecture**, plus **VI/EN** & **Theme** toggles at bottom | **Mapped & Built** |
| **Top Search Bar** (`"Search book name, author, edition ..."`) | **Primary Topic Search Bar**: Instant topic input + Enter-to-search + Live/Sample Pipeline switch | **Mapped & Built** |
| **Top-Right User Profile & Bell** (`"Alexander Mark"` + Avatar + Notification Bell) | **Pipeline Mode & Trust Status Pill** (`Live Verified` / `Sample Data` + Quick Sample CTA). *No accounts or notifications.* | **Adapted (No Accounts)** |
| **Hero Greeting & CTA** (`"Happy reading, Harvey"` / `"Keep the story going.."` + `"Start reading ↗"`) | **"Start Your Path" Editorial Header**: Topic-aware serif headline, plain-language explanation, dark pill CTA (`"Build verified roadmap ↗"`), topic chips, and progressive-disclosure preferences (Level, Length, Language, Adventurousness slider) | **Mapped & Built** |
| **Featured Open Book / Spotlight Panel (Top Right)** (`"The Cambers of Secrets"`, `154 / 300 pages`) | **Interactive 3D Hero Shelf (`HeroShelf3D`) + Live Verification Counter** (`verified / found candidates`, `removed count`, 3D/2D switch, and active step preview) | **Mapped & Built** |
| **"Popular Now" / Standing Book Cover Carousel** (Screens 1, 2, 4, 5) | **Verified Book Cards Grid & Spotlight Row**: Standing procedural book cover with deep shadow, verification badge (Open Library / Google Books), match reason, roadmap step badge, Vietnamese edition indicator, Save, Not interested, and `"How we checked"` | **Mapped & Built** |
| **"Schedule Reading" Weekly Strip** (`Sun 11 .. Sat 17` pill strip) | **5-Stage Pipeline Tracker & Step Strip**: Styled after the reference's horizontal pill strip (`1. Search` -> `2. Extract` -> `3. Verify` -> `4. Rank MMR` -> `5. Path`) + Expandable Rejection Log & Grounding Links | **Mapped & Built** |
| **"Reader Friends" Timeline** (Vertical dashed timeline on right panel) | **Session Reading Roadmap Progress & Step Timeline**: Vertical dashed timeline showing the learner's beginner-to-advanced sequence (`To Read`, `Reading`, `Done` session progress) | **Mapped & Built** |
| **Book Detail Sheet (Screen 3)** (Large standing cover, serif title, italic quote, dark pill CTA, 2-col specs) | **Trust & Book Verification Drawer (`TrustDrawer`)**: Styled after Screen 3 with large procedural cover, verification badge, normalized title/author match confidence, ISBN-13, page count, Vietnamese edition note, and direct Open Library / Google Books links | **Mapped & Built** |
| **Full-Width Stage Panel (Phase 3B Override)** | **"The Path" (3D Reading Roadmap & 2D Stepper)**: Full-width interactive 3D stepping-stone path + identical 2D editorial roadmap list | **Mapped & Built** |
| **In-Book Text Reader & Audio/Highlight Toolbar (Screen 6)** | **DROPPED** (Out of scope: storing or showing book text, audiobook playback). *Note: Screen 6's floating bottom pill dock aesthetic is reused for the `<768px` mobile navigation bar.* | **DROPPED** |
| **Social Comments / Friend Reviews** (`"Roberto Jordan"`, `"Anna Henry"`) | **DROPPED** (Out of scope: accounts, public reviews, social feeds) | **DROPPED** |
| **Commerce / Buying / Multi-Volume Cart** | **DROPPED** (Out of scope: shopping, payments, affiliate links) | **DROPPED** |
