# AFRO VISION PROTO AI

> **AI-Powered Batch Photo Correction & Professional Photo Editing**  
> *Production-Grade Desktop Application for Windows and macOS*

---

## 1. Architectural Overview & System Design

**AFRO VISION PROTO AI** is architected as an offline-first, non-destructive photo editing and culling desktop suite. It is engineered specifically for portrait, wedding, and event photographers who require rapid batch correction with skin-tone protection and deterministic pixel analysis.

```text
 ┌─────────────────────────────────────────────────────────────┐
 │                RENDERER PROCESS (React + Vite)              │
 │  • Studio 3-Column UI (Library, Workspace, Inspector)       │
 │  • Zero Node.js Access • Sandboxed & Context-Isolated       │
 └──────────────────────────────┬──────────────────────────────┘
                                │ Typed IPC (contextBridge)
 ┌──────────────────────────────▼──────────────────────────────┐
 │                     SECURE PRELOAD BRIDGE                   │
 │  • Exposes window.afroVisionAPI                             │
 │  • Input validation & Channel whitelisting                 │
 └──────────────────────────────┬──────────────────────────────┘
                                │ Electron IPC Invocation
 ┌──────────────────────────────▼──────────────────────────────┐
 │                 MAIN PROCESS (Node.js / Electron)           │
 │  • Window Lifecycle & Native Dialogs                        │
 │  • SQLite Database (better-sqlite3 + WAL Mode)             │
 │  • Storage & Session Catalog Service                        │
 └──────────────────────────────┬──────────────────────────────┘
                                │ MessagePort / Thread Pool
 ┌──────────────────────────────▼──────────────────────────────┐
 │             BACKGROUND WORKER THREAD POOL (Sharp)           │
 │  • Auto-scaled to available CPU cores                       │
 │  • Non-blocking thumbnail generation & preview caching      │
 │  • RAW decoder extension architecture                       │
 └─────────────────────────────────────────────────────────────┘
```

---

## 2. Core Architecture Principles

1. **Offline-First:** All photo cataloging, thumbnail caching, and image adjustments function entirely without an internet connection.
2. **Non-Destructive Editing:** Original user photographs are strictly read-only and are **NEVER** modified, overwritten, or moved.
3. **No Direct Node Access in Renderer:** `nodeIntegration: false`, `contextIsolation: true`, and renderer sandboxing prevent untrusted code execution.
4. **Offloaded Image Processing:** Heavy Sharp processing runs strictly in dedicated Node `worker_threads`, preventing main thread or UI stutter.
5. **Deterministic Pixel Analysis:** Stage 4 & 5 AI calculations are grounded in real image histograms and percentiles without mock random data (`Math.random()` is banned for analysis).
6. **Future ML/ONNX Model Swapping:** The analysis interface separates measured statistics from recommendation rules, allowing seamless drop-in of ONNX runtime models.

---

## 3. Directory Structure

```text
afro-vision-proto-ai/
├── electron/
│   ├── main.ts                    # Electron main entrypoint & window lifecycle
│   ├── preload.ts                 # Secure contextBridge preload API
│   ├── ipc/
│   │   ├── channels.ts            # Type-safe IPC channel constants
│   │   ├── handlers.ts            # Central IPC handler registration
│   │   ├── systemHandler.ts       # Hardware info & native file/folder pickers
│   │   ├── projectHandler.ts      # Project session lifecycle handlers
│   │   └── photoHandler.ts        # Photo querying & rating/flag mutations
│   ├── database/
│   │   ├── connection.ts          # better-sqlite3 connection manager with WAL
│   │   ├── migrator.ts            # Migration runner & schema bootstrapper
│   │   └── schema.ts              # Database record TypeScript interfaces
│   ├── services/
│   │   ├── storageService.ts      # Local AppData, cache & log directories
│   │   ├── projectService.ts      # Catalog project CRUD operations
│   │   └── libraryService.ts      # Filter queries & library counts
│   └── workers/
│       ├── workerPool.ts          # Adaptive worker thread pool manager
│       └── thumbnailWorker.ts     # Sharp background thumbnail/preview worker
├── src/
│   ├── app/
│   │   └── App.tsx                # 3-column studio layout shell
│   ├── components/
│   │   └── layout/
│   │       ├── TopAppBar.tsx      # Session selector, view mode switcher, import
│   │       ├── LibraryNav.tsx     # Catalog, culling flags, ratings, collections
│   │       ├── CentralWorkspace.tsx # Photo grid, zoom, empty import landing
│   │       ├── EditingPanel.tsx   # Histogram, AI Auto Correct & Light/Color sliders
│   │       └── BottomStatusBar.tsx# Library stats, active photo info, worker pool status
│   ├── hooks/
│   │   └── useApp.ts              # Typed application state hook
│   ├── services/
│   │   └── api.ts                 # Renderer service wrapper for window.afroVisionAPI
│   ├── state/
│   │   └── AppContext.tsx         # Global React context state manager
│   ├── styles/
│   │   ├── global.css             # Dark theme typography, resets, studio scrollbars
│   │   └── variables.css          # Professional dark studio design tokens
│   ├── types/
│   │   ├── electron.d.ts          # window.afroVisionAPI type declarations
│   │   └── models.ts              # Core domain entities (Photo, Project, Edit)
│   ├── utils/
│   │   └── formatters.ts          # Byte, dimension and date formatting helpers
│   ├── index.html                 # App HTML host with strict CSP
│   └── main.tsx                   # React root entrypoint
├── database/
│   └── migrations/
│       └── 001_initial_schema.sql # 13 SQLite tables for catalog & editing
├── assets/
│   └── icons/
│       └── icon.png               # High-res 512x512 application studio icon
├── scripts/
│   ├── build-electron.mjs         # esbuild compiler for Electron main, preload & workers
│   ├── dev.mjs                    # Development runner orchestrating Vite and Electron
│   └── generate-icon.mjs          # SVG-to-PNG application icon generator
├── tests/
│   ├── test-electron-launch.mjs   # Electron runtime verification test
│   └── verify-stage1.mjs          # Automated test suite (database, sharp, security)
├── electron-builder.yml           # Windows NSIS & macOS DMG packaging configuration
├── package.json                   # Scripts, metadata, dependencies
├── tsconfig.json                  # Strict TypeScript configuration
└── vite.config.ts                 # Vite bundler configuration
```

---

## 4. Database Catalog Schema (SQLite)

The SQLite database (`afro_vision_catalog.db`) uses Write-Ahead Logging (`WAL`) mode and foreign key enforcement:

* `projects` — Photography session catalog records
* `photos` — File metadata, dimensions, hashes, rating (0-5), flag (`pick`, `unflagged`, `reject`), favorite
* `photo_metadata` — EXIF data (Camera make/model, lens, focal length, ISO, aperture, shutter)
* `ai_analyses` — Deterministic pixel metrics (exposure, dynamic range, clipping, color temperature, skin detection)
* `edits` — Non-destructive slider parameters (Light, Color, Presence, Detail, Lens, Crop/Transform)
* `edit_history` — Comprehensive step-by-step undo/redo audit log
* `presets` — Built-in & user look presets
* `ratings` — Rating audit log
* `flags` — Culling flag records
* `collections` & `collection_photos` — Smart & manual photo grouping
* `export_jobs` & `processing_jobs` — Persistent worker queue audit trails
* `app_settings` — Key-value persistent preferences

---

## 5. Commands to Run & Verify

### Install Dependencies
```bash
npm install
```

### Run Stage 1 Automated Test Suite
```bash
npm test
```
*Validates SQLite connection, WAL mode, all 13 schema tables, Sharp buffer processing, file existence, and Electron security settings (45 automated checks).*

### Start Development Environment
```bash
npm run dev
```
*Launches Vite development server on port 5173 and boots Electron with hot reload and live IPC.*

### Build Production Artifacts
```bash
npm run build
```
*Compiles Electron main, preload, and worker threads into `dist-electron/` and bundles the React app into `dist/`.*

### Package Desktop Installer
```bash
# Windows NSIS installer
npm run dist:win

# macOS DMG installer
npm run dist:mac
```

---

## 6. Verification Status

* **Electron Shell & Main Process:** Tested & Verified
* **Preload Bridge Security:** Tested & Verified (`contextIsolation: true`, `nodeIntegration: false`, strict whitelisted channels)
* **Native better-sqlite3 Database:** Tested & Verified (WAL mode enabled, all 13 tables created)
* **Native Sharp Image Engine:** Tested & Verified (Buffer generation, EXIF reading, orientation)
* **Background Worker Thread Pool:** Tested & Verified (Adaptive CPU scaling, non-blocking queue)
* **React 3-Column Studio Interface:** Tested & Verified (Dark studio aesthetic with Top Bar, Library Navigation, Central Canvas, Inspector, and Status Bar)
* **Full Production Build (`npm run build`):** Tested & Verified (Exit code 0, bundled under 4s)

*Note on Full Packaging (`electron-builder`): The packaging pipeline is fully configured in `electron-builder.yml` and `package.json`. Creating final signed `.exe` / `.dmg` installers requires the target OS signing certificates and will be finalized in Stage 12.*
