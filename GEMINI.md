# Project Overview: 広告でよく見るゲーム MVP

A 3D runner battle game MVP inspired by hyper-casual game advertisements ("Last Run Survival"). Players control a squad moving down a lane, passing through gates to increase or decrease their squad size, and battling enemies and bosses.

- **Primary Technologies:** HTML5, CSS3, JavaScript (ES Modules), Three.js (v160+).
- **Architecture:** Static web application with a single-file game loop (`src/main.js`) and a dedicated storage module (`src/game/Storage.js`).
- **Persistence:** Game progress (stage, coins, resources) is saved locally via `localStorage`.

## Project Structure

- `index.html`: Main application shell and UI overlays (HUD, menu, result screens).
- `src/main.js`: Core game logic, Three.js scene management, entity systems (bullets, enemies, gates), and input handling.
- `src/game/Storage.js`: Module for saving, loading, and sanitizing game data.
- `styles/main.css`: Modern, responsive CSS for game UI and layout.
- `vendor/three/`: Locally vendored Three.js core and module files.
- `images/`: Directory for game assets and icons.
- `MVP_PLAN.md`: Detailed implementation plan and roadmap for the MVP.

## Building and Running

This is a static web project utilizing ES modules. No build step is required.

### Local Development
To run the project locally, use a static file server to ensure ES modules load correctly:

```bash
# Using Node.js (npx)
npx serve .

# Using Python
python -m http.server 8000
```

Open your browser to the local address (e.g., `http://localhost:3000` or `http://localhost:8000`).

## Development Conventions

- **Module System:** Use ES modules (`import`/`export`).
- **3D Graphics:** All 3D rendering is handled by Three.js. Standard materials and geometries are defined in `src/main.js`.
- **Game Loop:** Managed via `requestAnimationFrame` with delta time (`dt`) for frame-independent movement.
- **UI:** HUD and menus are built with standard HTML/CSS, overlaying the Three.js canvas.
- **Responsive Design:** Supports both desktop (keyboard/pointer) and mobile (touch/on-screen buttons) viewports.
- **Code Style:** Prefers clean, functional updates within the main loop; uses a `saveData` object for global state synchronization.

## Key Game Systems (in `src/main.js`)

- `buildWorld()` / `buildPlayer()`: Scene initialization.
- `startRun()`: Resets the session and generates entities based on the current stage.
- `updateRun(dt)`: Main logic for movement, collisions, and boss encounters.
- `autoShoot(dt)`: Logic for squad-based automatic firing.
- `handleGateCollisions()` / `handleEnemyCollisions()`: Collision detection and resolution.
- `finishRun(success, message)`: Handles win/loss states and reward calculation.
