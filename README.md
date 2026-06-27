# AAKASHAYA — Infrared Satellite Intelligence System

> From Infrared Vision to Earth Intelligence.

A cinematic, futuristic Earth Observation Intelligence Platform demo. Premium mission control UI with cinematic splash, 3D rotating Earth, live telemetry, AI workflow visualization, semantic intelligence, downloadable reports, and a command console.

---

## Quick Start

### Option 1 — Just open `index.html`
The project is built with **zero build steps**. After cloning:
1. Open `index.html` directly in any modern browser (Chrome / Edge / Firefox recommended).
2. Done.

> **Note:** Some browsers restrict ES module loading from `file://`. If that happens, use Option 2.

### Option 2 — Serve locally (recommended)
From the project root:

```bash
# Python 3
python -m http.server 8000

# or Node (if installed)
npx serve .

# then open
http://localhost:8000/
```

---

## Browser Requirements

- Chrome / Edge 110+
- Firefox 110+
- Safari 16+

Requires WebGL support (graceful CSS fallback if unavailable).

---

## Features

| Module | What it does |
|---|---|
| **Splash Screen** | 12-phase cinematic intro: signal acquisition, Earth reveal, orbit lines, telemetry, holographic UI, neural network, system diagnostics, logo glitch reveal |
| **3D Earth Scene** | Three.js rotating Earth with shader atmosphere, 4 orbiting satellites with solar panels + trails, radar sweep, starfield, downlink signal beams |
| **Mission Control Header** | Mission ID, status, AI engine LEDs (SwinIR, Pix2Pix, SegFormer, YOLOv8, CLIP, Inference Core), live system health ring |
| **Real-Time Telemetry** | Satellite ID, orbit, coverage, data feed (with sparkline), signal strength (dBm + bar), processing queue, live mission uptime |
| **Command Console** | Terminal-style log feed with `[INFO]/[WARN]/[SUCCESS]/[ERROR]` levels, filter chips, typing animation, synthetic feed |
| **Earth Observation Workflow** | 8-stage vertical pipeline (Acquisition → Preprocessing → SwinIR Enhancement → Super Resolution → Pix2Pix Colorization → Semantic Segmentation → Object Detection → Report) with animated progress |
| **Upload Panel** | Drag-and-drop + click upload, validates PNG/JPG/WEBP ≤ 25 MB, generates synthetic IR sample, preview before processing |
| **Processing Monitor** | Live sub-progress, model name per stage, total percentage, animated ring |
| **Before/After Slider** | Accessible range slider (mouse + touch + keyboard) revealing IR input vs colorized output, ARIA slider role |
| **Semantic Earth Intelligence** | Top-4 land cover bars with animation, confidence ring (SVG), typed interpretation paragraph |
| **Earth Intelligence Report** | Premium report card: metadata, PSNR / SSIM / FID / Inference Time / Confidence, detected objects, semantic interpretation, **Download as PDF / PNG / CSV** |
| **Mission Timeline** | Horizontal 7-stage timeline with animated progression marker, keyboard navigation |
| **Technical Architecture** | Animated SVG diagram with traveling dots showing: IR → SwinIR → SR → Pix2Pix → Seg + YOLO → Earth Intelligence, with neural net background |

### WOW Factor Effects
- 3D Rotating Earth with shader atmosphere and city lights at night
- 4 orbiting satellites with solar panels, trails, and downlink beams
- Radar sweep, scanning grids, holographic shimmer
- AI neural network background canvas
- Glassmorphism + neumorphism panels
- Neon glow, animated borders, parallax motion
- Magnetic cursor buttons, 3D tilt cards
- Data stream matrix rain (decorative)
- Cinematic lighting, gradient mesh backgrounds

### Accessibility & UX
- Fully responsive (1440 / 1200 / 980 / 640 breakpoints)
- Keyboard navigation: `U` (upload), `P` (process), `R` (report), `T` (toggle console), `A` (architecture), `S` (semantic), `W` (workflow), `?` (help), `Esc` (close)
- `prefers-reduced-motion` honored (splash fast-forwards, animations collapse)
- Focus-visible outlines on all interactive controls
- ARIA roles on slider and live regions

---

## Architecture

```
E:\AAKASHAY\
├── index.html              ← shell, canvas, splash, dashboard container
├── README.md
├── css/                    ← 10 modular CSS files (cascade order matters)
│   ├── reset.css
│   ├── variables.css       ← design tokens
│   ├── base.css
│   ├── animations.css      ← all @keyframes
│   ├── components.css      ← buttons, panels, cards, console, slider, badges
│   ├── three-canvas.css
│   ├── splash.css
│   ├── dashboard.css       ← grid layout, panels
│   ├── layout.css
│   └── responsive.css
├── js/
│   ├── main.js             ← entry: fonts → splash → 3D → dashboard
│   ├── config.js           ← mission, satellites, pipeline stages
│   ├── state.js            ← reactive store (Proxy-based)
│   ├── eventBus.js         ← pub/sub
│   ├── utils/              ← dom, format, animation, id, prng, domCache
│   ├── splash/             ← 12-phase cinematic intro
│   ├── three/              ← Three.js Earth scene
│   ├── dashboard/          ← dashboard shell + nav
│   ├── components/         ← 15 dashboard components
│   ├── api/                ← mock backend (in-browser)
│   ├── upload/             ← drag-drop + validation
│   ├── effects/            ← typing, glitch, scan, neural net, etc.
│   └── export/             ← PNG / PDF / CSV exporters
└── assets/                 ← icons, samples
```

### How the "Backend API" Works

Since this is a static frontend (no Node/Python server), the backend is **simulated in-browser** via `js/api/mockApi.js`:

- `startProcessing(file, { onProgress })` → returns Promise<Report>
- Loops through 8 pipeline stages with realistic latency (700–1500ms each, with jitter)
- Emits `pipeline:stageStart` / `stageProgress` / `stageComplete` events on the bus
- Calls `reportGenerator.generateReport({ fileMeta, stageTimings })` → deterministic (seeded PRNG) but varied output
- All activity logged to the command console

The mock API has the **same async signatures as a real REST backend**, so swapping to `fetch()` calls against a real Python/Node service is a one-file change.

---

## Controls

| Key | Action |
|---|---|
| `U` | Scroll to upload zone |
| `P` | Initiate processing (after upload) |
| `R` | Scroll to report |
| `W` | Scroll to workflow |
| `S` | Scroll to semantic analysis |
| `A` | Scroll to architecture |
| `T` | Toggle command console |
| `?` | Toggle keyboard help overlay |
| `Esc` | Close overlays |

---

## Credits

- **Three.js** — 3D Earth scene
- **jsPDF** — PDF export
- **html2canvas** — PNG export
- **Google Fonts** — Orbitron, Inter, JetBrains Mono

---

## License

Demo / educational project. No external data — all AI outputs are deterministically simulated.