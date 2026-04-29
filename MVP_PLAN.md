# MVP Implementation Plan

## Goal

Create a playable browser MVP of the ad-style runner battle using only HTML, CSS, JavaScript, Three.js, and browser `localStorage`.

## MVP Scope

- 3D running lane rendered with Three.js.
- Player squad that moves left and right with drag, keyboard, or on-screen buttons.
- Positive and negative gates that change squad size.
- Enemies and a simple boss encounter.
- Automatic squad shooting.
- Clear/fail result screen.
- Persistent stage and resource rewards saved to `localStorage`.

## Out of Scope for MVP

- Full base-building simulation.
- Gacha and hero collection.
- PvP.
- External backend, database, authentication, or server-side save data.

## Implementation Order

1. Add static app shell: `index.html`, `styles/main.css`, and `src/main.js`.
2. Vendor Three.js locally under `vendor/three/`.
3. Build the 3D scene: camera, lights, road, lane markers, squad, gates, enemies, and boss.
4. Implement the game loop with movement, collision, shooting, and win/fail conditions.
5. Add `src/game/Storage.js` for save/load/reset using `koukokuGame.saveData`.
6. Verify desktop and smartphone-sized viewports.

## Next Phase

After the MVP feels playable, add a simple base screen with facility upgrades, then connect upgrades to battle stats such as starting squad size, damage, and reward multipliers.
