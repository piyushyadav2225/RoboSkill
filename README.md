# ROBOSKILL
### The Ancient Engineering Marketplace for Robot Skills

> *"To forge autonomous intelligence is to inscribe geometry and clockwork reason onto inert steel and silicon."*

**RoboSkill** is a specialized, interactive marketplace and virtual workbench designed for robotics developers, researchers, and robot owners. It enables the creation, package distribution, hardware verification, and monetization of robot skills across DIY platforms, educational robots, research automata, and industrial manipulators.

The entire aesthetic is modeled on an **Ancient Engineering Laboratory**—merging the craftsmanship of Leonardo da Vinci, Archimedes, and Hephaestus with modern robotics architecture, Three.js kinematics, and sandboxed Python simulation.

---

## 🏛️ Platform Architecture

```
RoboSkill/
├── packages/
│   └── roboskill-obstacle-avoidance/      # The imported verified skill (unmodified from original project)
│       ├── manifest.json                  # Robot skill manifest v1.0
│       ├── pyproject.toml                 # Package definition & pytest config
│       ├── README.md                      # Developer documentation
│       ├── simulate.py                    # Original Tkinter reference simulator
│       ├── src/roboskill/                 # Core Python decision logic
│       │   ├── skill.py                   # ObstacleAvoidanceSkill class
│       │   ├── cli.py                     # roboskill-obstacle CLI
│       │   └── __init__.py                # Package exports
│       └── tests/
│           └── test_skill.py              # 7 Unit tests (100% passing)
├── backend/
│   ├── app/
│   │   ├── main.py                        # FastAPI entrypoint, unified router & SPA static server
│   │   ├── config.py                      # Storage, upload & database configuration
│   │   ├── database.py                    # SQLAlchemy ORM engine (SQLite/Postgres ready)
│   │   ├── models.py                      # 15 entities (Skills, Manifests, Robots, Sessions, Earnings...)
│   │   ├── schemas.py                     # Pydantic validation models
│   │   ├── seed.py                        # Seed database with imported skill & robot hardware profiles
│   │   ├── simulation/
│   │   │   └── adapter.py                 # Isolated runner for ObstacleAvoidanceSkill & live Pytest runner
│   │   └── routers/
│   │       ├── skills.py                  # Codex listing, detail, file inspector & dynamic ZIP downloads
│   │       ├── compatibility.py           # Compatibility engine with 4 verification states
│   │       ├── simulation.py              # Real-time simulation step execution & report persistence
│   │       ├── upload.py                  # Multi-step package inspection, structure validation & publish
│   │       └── user.py                    # Role switching, library management & creator earnings ledger
├── frontend/                              # React + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/
│   │   │   ├── HeroCanvas.tsx             # Interactive 3D mechanical automaton & armillary in Three.js
│   │   │   ├── Navbar.tsx                 # Ancient brass header with persona switcher
│   │   │   ├── Footer.tsx                 # Philosophical axioms & workbench telemetry
│   │   │   └── MechanicalGear.tsx         # SVG/CSS rotating brass gears
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx            # Hero, 3D visual, featured skill, categories, how it works
│   │   │   ├── MarketplacePage.tsx        # Search, filters, sort, honest empty states for unpopulated guilds
│   │   │   ├── SkillDetailPage.tsx        # Specification deep-dive, live Pytest runner, code browser
│   │   │   ├── VirtualLabPage.tsx         # 3-panel ancient engineering lab with interactive 2D arena
│   │   │   ├── DeveloperStudioPage.tsx    # 6-step package uploader, validator, earnings dashboard
│   │   │   ├── CompatibilityPage.tsx      # Hardware matrix & custom robot profile registration
│   │   │   └── LibraryPage.tsx            # Personal user library with direct ZIP downloads
├── run_roboskill.py                       # Single-command launcher with browser auto-open
├── start.bat                              # Windows batch launcher
└── start.ps1                              # PowerShell launcher
```

---

## ⚡ Quick Start

### 1. Launch Unified Application
Run the Python launcher in your terminal:
```bash
python run_roboskill.py
```
Or double-click `start.bat` on Windows.

The full-stack application will boot on **`http://127.0.0.1:8000`** with the built frontend and FastAPI backend serving simultaneously.

### 2. Frontend Development Mode (Vite HMR)
If you want to modify frontend components with hot module replacement:
```bash
# Terminal 1: Backend
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload

# Terminal 2: Frontend
cd frontend
npm run dev
```
Open **`http://localhost:5173`** (API requests are automatically proxied to port 8000).

---

## 🔍 Key Platform Features

### 1. The Imported Foundation Skill: Obstacle Avoidance
- **Source**: Imported from the local Windows folder `C:\Users\piyush\OneDrive\Desktop\LAB\Obstacle_Avoidance_Skill` into `packages/roboskill-obstacle-avoidance/`.
- **Integrity**: Original files, unit tests, pyproject configuration, and README are strictly preserved.
- **Unit Tests**: All 7 pytest cases pass deterministically in under 0.8s.
- **Hardware Truth**: Physical robot compatibility is strictly marked **`UNVERIFIED`** with clear safety advisories stating that hardware bench testing is required before physical deployment.

### 2. The 3D Mechanical Hero Visual (`HeroCanvas.tsx`)
- Articulated brass robotic arm with concentric armillary astrolabe rings rendered in Three.js.
- Interactive mouse tracking and camera parallax.
- Floating golden dust particles, warm point lighting, and mechanical gear rotation.

### 3. The Virtual Robot Testing Laboratory (`VirtualLabPage.tsx`)
- **Left Panel**: Robot selection (Archimedes Rover, DaVinci Hexapod, Vitruvian Drone), sensor distance threshold slider (10–60 cm), and arena selection (Workshop, Corridor, Scattered Monoliths, Custom).
- **Center Canvas**: Interactive 2D simulation canvas featuring real-time obstacle placement (click to spawn), robot heading pointer, sensor beam cone, collision boundaries, and breadcrumb path trail.
- **Real Decision Adapter**: The simulation calls the actual Python `ObstacleAvoidanceSkill.run()` method over REST API on every tick.
- **Right Panel**: Real-time action indicator (`FORWARD`, `TURN`, `STOP`), distance stream, step counter, avoidance counter, and live execution stream log.
- **Persistence**: Save simulation reports to the database ledger.

### 4. Developer Studio (`DeveloperStudioPage.tsx`)
- **Overview**: Real metrics (published skills, draft skills, downloads, transactions, and creator earnings).
- **Multi-Step Upload Workflow**:
  - *Step 1*: Upload ZIP package (enforces 25MB limit, blocks unauthorized binary executables).
  - *Step 2*: Extract metadata from `manifest.json`.
  - *Step 3*: Additional specifications & pricing (85% creator payout, 15% platform commission).
  - *Step 4*: Automated integrity & security validation.
  - *Step 5*: Isolated virtual sandbox test execution.
  - *Step 6*: Publish to Marketplace or Save as Private Draft.

### 5. Robot Compatibility Engine (`CompatibilityPage.tsx`)
- Evaluates skills against robot architectures.
- Assigns one of 4 strict states:
  - `COMPATIBLE`: All capabilities, runtime, and physical bench tests verified.
  - `PARTIALLY COMPATIBLE`: Minor adapter or bridge required.
  - `NOT COMPATIBLE`: Lacks critical sensors or mobility base.
  - `UNVERIFIED`: Software tests pass, but hardware-in-the-loop physical testing has not been performed.
- Allows users to register custom robot profiles.

### 6. Personal Library & Verified Downloads (`LibraryPage.tsx`)
- Users can inspect their acquired skills and download verified, clean `.zip` packages dynamically generated directly from the imported repository.

---

## 🧪 Running Unit Tests Manually

To execute the unit tests for the imported skill directly:
```powershell
$env:PYTHONPATH = "packages\roboskill-obstacle-avoidance\src"
python -m pytest packages\roboskill-obstacle-avoidance\tests -v
```
Expected output:
```
tests/test_skill.py::test_clear_path PASSED
tests/test_skill.py::test_obstacle PASSED
tests/test_skill.py::test_threshold PASSED
tests/test_skill.py::test_invalid_input PASSED
tests/test_skill.py::test_negative_distance PASSED
tests/test_skill.py::test_invalid_threshold PASSED
tests/test_skill.py::test_custom_threshold PASSED
7 passed in 0.10s
```

You can also run this test suite interactively with a single click in the **Skill Detail Page > Testing Results** tab!

