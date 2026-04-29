import * as THREE from "../vendor/three/three.module.js";
import { loadSave, resetSave, saveGame } from "./game/Storage.js";
import * as Audio from "./game/Audio.js";

const canvas = document.querySelector("#gameCanvas");
const ui = {
  overlay: document.querySelector("#overlay"),
  overlayTitle: document.querySelector("#overlayTitle"),
  overlayBody: document.querySelector("#overlayBody"),
  resultKicker: document.querySelector("#resultKicker"),
  startButton: document.querySelector("#startButton"),
  resetButton: document.querySelector("#resetButton"),
  stageLabel: document.querySelector("#stageLabel"),
  squadLabel: document.querySelector("#squadLabel"),
  coinsLabel: document.querySelector("#coinsLabel"),
  weaponLabel: document.querySelector("#weaponLabel"),
  foodLabel: document.querySelector("#foodLabel"),
  ironLabel: document.querySelector("#ironLabel"),
  savedStageLabel: document.querySelector("#savedStageLabel"),
  savedCoinsLabel: document.querySelector("#savedCoinsLabel"),
  baseLevelLabel: document.querySelector("#baseLevelLabel"),
  statusText: document.querySelector("#statusText"),
  progressMeter: document.querySelector("#progressMeter"),
  leftButton: document.querySelector("#leftButton"),
  rightButton: document.querySelector("#rightButton"),
  damageFlash: document.querySelector("#damageFlash"),
  bossHud: document.querySelector("#bossHud"),
  bossHpFill: document.querySelector("#bossHpFill"),
  confirmModal: document.querySelector("#confirmModal"),
  confirmOkBtn: document.querySelector("#confirmOkBtn"),
  confirmCancelBtn: document.querySelector("#confirmCancelBtn")
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x060913);
scene.fog = new THREE.FogExp2(0x060913, 0.015);

const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 160);
camera.position.set(0, 7.2, 12.5);
camera.lookAt(0, 0.85, -15);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

const laneLimit = 2.55;
const playerZ = 2.2;
let lastFrameTime = performance.now();
let saveData = loadSave();
let phase = "menu";
let entities = [];
let bullets = [];
let laneMarkers = [];
let squadSlots = [];
let activeBoss = null;
let dyingEntities = [];
let enemyBullets = [];
const cameraShake = { intensity: 0 };

const input = {
  left: false,
  right: false,
  pointerActive: false,
  pointerTargetX: 0
};

const run = {
  stage: saveData.stage,
  squad: 0,
  reward: 0,
  progress: 0,
  speed: 10,
  distance: 92,
  shotCooldown: 0,
  bossAttackCooldown: 1,
  bossEncounter: false,
  firePower: 1,
  shotIndex: 0,
  enemiesDefeated: 0,
  playerX: 0,
  playerVelocityX: 0,
  playerTargetX: 0,
  flashTime: 0
};

const materials = {
  water: new THREE.MeshStandardMaterial({ color: 0x03060a, roughness: 0.1, metalness: 0.8 }),
  road: new THREE.MeshStandardMaterial({ color: 0x111822, roughness: 0.8 }),
  roadEdge: new THREE.MeshStandardMaterial({ color: 0x00f0ff, roughness: 0.4, emissive: 0x0055aa, emissiveIntensity: 0.5 }),
  lane: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x00aaff, emissiveIntensity: 1.5, roughness: 0.2 }),
  soldierBody: new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.48 }),
  soldierVest: new THREE.MeshStandardMaterial({ color: 0x00aaff, roughness: 0.3, emissive: 0x002255, emissiveIntensity: 0.5 }),
  soldierHead: new THREE.MeshStandardMaterial({ color: 0x00e5ff, roughness: 0.38 }),
  gun: new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.48 }),
  enemy: new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.66 }),
  enemyHead: new THREE.MeshStandardMaterial({ color: 0xff3333, emissive: 0xaa0000, emissiveIntensity: 0.8, roughness: 0.3 }),
  boss: new THREE.MeshStandardMaterial({ color: 0x221111, emissive: 0x330000, emissiveIntensity: 0.5, roughness: 0.62 }),
  bullet: new THREE.MeshBasicMaterial({
    color: 0xffaa00,
    depthWrite: false
  }),
  bulletTrail: new THREE.MeshBasicMaterial({
    color: 0xff5500,
    transparent: true,
    opacity: 0.6,
    depthWrite: false
  }),
  crate: new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0xaa5500, emissiveIntensity: 0.5, roughness: 0.58 }),
  gatePositive: new THREE.MeshStandardMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.4,
    emissive: 0x00aaff,
    emissiveIntensity: 0.8,
    roughness: 0.1
  }),
  gateNegative: new THREE.MeshStandardMaterial({
    color: 0xff0044,
    transparent: true,
    opacity: 0.4,
    emissive: 0xaa0000,
    emissiveIntensity: 0.8,
    roughness: 0.1
  }),
  finish: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xaaaaaa, emissiveIntensity: 0.5 })
};

const geometries = {
  soldierBody: new THREE.CylinderGeometry(0.12, 0.15, 0.48, 10),
  soldierVest: new THREE.BoxGeometry(0.2, 0.26, 0.16),
  soldierHead: new THREE.SphereGeometry(0.14, 12, 10),
  gun: new THREE.BoxGeometry(0.06, 0.08, 0.32),
  enemyBody: new THREE.CylinderGeometry(0.12, 0.16, 0.46, 9),
  enemyHead: new THREE.SphereGeometry(0.13, 10, 8),
  bullet: new THREE.SphereGeometry(0.12, 12, 10)
};

const worldGroup = new THREE.Group();
const entityGroup = new THREE.Group();
const bulletGroup = new THREE.Group();
const playerGroup = new THREE.Group();
scene.add(worldGroup, entityGroup, bulletGroup, playerGroup);

buildWorld();
buildPlayer();
bindEvents();
resize();
renderSaveState();
showMenu();
requestAnimationFrame(tick);

function buildWorld() {
  const hemi = new THREE.HemisphereLight(0xddeeff, 0x495c45, 2.1);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffffff, 2.4);
  sun.position.set(5, 12, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 42;
  scene.add(sun);

  for (const x of [-21, 21]) {
    const water = new THREE.Mesh(new THREE.PlaneGeometry(34, 150), materials.water);
    water.rotation.x = -Math.PI / 2;
    water.position.set(x, -0.09, -48);
    water.receiveShadow = true;
    worldGroup.add(water);
  }

  const grid = new THREE.GridHelper(100, 50, 0x0088ff, 0x002255);
  grid.position.set(0, -0.08, -30);
  worldGroup.add(grid);

  const road = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 150), materials.road);
  road.rotation.x = -Math.PI / 2;
  road.position.z = -48;
  road.receiveShadow = true;
  worldGroup.add(road);

  for (const x of [-3.72, 3.72]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.28, 150), materials.roadEdge);
    rail.position.set(x, 0.14, -48);
    rail.receiveShadow = true;
    worldGroup.add(rail);
  }

  for (let i = 0; i < 24; i += 1) {
    for (const x of [-3.72, 3.72]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.6, 0.38), materials.roadEdge);
      post.position.set(x, 0.32, 2 - i * 6.2);
      post.castShadow = true;
      post.receiveShadow = true;
      worldGroup.add(post);
    }
  }

  for (let i = 0; i < 26; i += 1) {
    for (const x of [-1.22, 1.22]) {
      const marker = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.035, 1.55), materials.lane);
      marker.position.set(x, 0.035, -i * 5);
      marker.userData.baseZ = -i * 5;
      marker.receiveShadow = true;
      laneMarkers.push(marker);
      worldGroup.add(marker);
    }
  }

  for (let i = 0; i < 18; i += 1) {
    const side = i % 2 === 0 ? -1 : 1;
    const height = 0.8 + (i % 4) * 0.32;
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, height, 0.9),
      new THREE.MeshStandardMaterial({ color: i % 3 === 0 ? 0x4a6c5b : 0x5f675e, roughness: 0.8 })
    );
    box.position.set(side * (4.8 + (i % 3) * 0.58), height / 2, -8 - i * 6.4);
    box.castShadow = true;
    box.receiveShadow = true;
    worldGroup.add(box);
  }
}

function buildPlayer() {
  playerGroup.position.set(0, 0, playerZ);
  rebuildSquadVisual(1);
}

function rebuildSquadVisual(count) {
  clearGroup(playerGroup);
  squadSlots = [];
  const visibleCount = Math.max(1, Math.min(count, 350));
  const columns = visibleCount <= 4 ? visibleCount : Math.min(18, Math.ceil(Math.sqrt(visibleCount) + 1));
  const spacing = visibleCount > 150 ? 0.20 : visibleCount > 80 ? 0.23 : visibleCount > 45 ? 0.26 : visibleCount > 24 ? 0.30 : 0.34;

  for (let i = 0; i < visibleCount; i += 1) {
    const column = i % columns;
    const row = Math.floor(i / columns);
    const soldier = new THREE.Group();
    const body = new THREE.Mesh(geometries.soldierBody, materials.soldierBody);
    const vest = new THREE.Mesh(geometries.soldierVest, materials.soldierVest);
    const head = new THREE.Mesh(geometries.soldierHead, materials.soldierHead);
    const gun = new THREE.Mesh(geometries.gun, materials.gun);

    const useShadow = visibleCount <= 60;
    body.castShadow = useShadow;
    vest.castShadow = useShadow;
    head.castShadow = useShadow;
    gun.castShadow = true;
    body.position.y = 0.32;
    vest.position.set(0, 0.4, -0.05);
    head.position.y = 0.68;
    gun.position.set(0, 0.43, -0.22);

    const slot = {
      x: (column - (columns - 1) / 2) * spacing,
      z: -row * spacing * 0.9
    };
    soldier.add(body, vest, head, gun);
    soldier.position.set(slot.x, 0, slot.z);
    playerGroup.add(soldier);
    squadSlots.push(slot);
  }
}

function startRun() {
  Audio.playClick();
  Audio.initAudio();
  clearEntities();
  phase = "running";
  run.stage = saveData.stage;
  run.squad = 3;
  run.reward = 0;
  run.progress = 0;
  run.speed = 5.0 + Math.min(5.0, run.stage * 0.4);
  run.shotCooldown = 0.12;
  run.bossAttackCooldown = 1.2;
  run.bossEncounter = false;
  run.firePower = 1 + Math.floor(Math.max(0, saveData.heroLevel - 1) / 3);
  run.shotIndex = 0;
  run.playerX = 0;
  run.playerVelocityX = 0;
  run.playerTargetX = 0;
  run.flashTime = 0;
  run.enemiesDefeated = 0;
  playerGroup.position.x = 0;
  rebuildSquadVisual(run.squad);

  const s = run.stage;
  const distScale = 1 + Math.min(s * 0.07, 0.85);
  const d = (base) => Math.round(base * distScale);
  const hp1 = 2 + Math.floor(s * 0.8);
  const hp2 = 4 + Math.floor(s * 1.2);
  const hp3 = 6 + Math.floor(s * 1.6);
  const hp4 = 8 + Math.floor(s * 2.0);
  const cnt1 = 26 + s * 5;
  const cnt2 = 44 + s * 7;
  const cnt3 = 64 + s * 9;
  const cnt4 = 84 + s * 12;
  const spd1 = 0.8 + s * 0.20;
  const spd2 = 1.1 + s * 0.24;
  const spd3 = 1.5 + s * 0.28;
  const spd4 = 1.9 + s * 0.32;
  addRecruitLine(d(4), 5 + Math.floor(s * 0.6), 0.15, 0.86);
  addRecruitLine(d(5), 32 + s * 5, 1.92, 0.68);
  addGatePair(d(26), 6 + Math.floor(s * 0.6), -4);
  addEnemySwarm(d(31), 0.1, cnt1, hp1, 1, 3.2, spd1, 0xb71e35);
  addRecruitLine(d(35), 28 + s * 5, 1.95, 0.68);
  addEnemySwarm(d(51), -0.3, cnt2, hp2, 1, 4.5, spd2, 0x8b1a8b);
  addGatePair(d(55), 10 + Math.floor(s * 0.7), -6);
  addRecruitLine(d(62), 30 + s * 5, 1.95, 0.62);
  addEnemySwarm(d(78), 0.15, cnt3, hp3, 1, 5.2, spd3, 0xc96020);
  addGatePair(d(82), 14 + Math.floor(s * 0.9), -9);
  addRecruitLine(d(89), 34 + s * 5, 1.95, 0.58);
  addEnemySwarm(d(101), 0, cnt4, hp4, 1, 5.6, spd4, 0x6b0808);
  addBoss(d(111), 3500 + s * 2500);
  addFinishLine(d(117));
  run.distance = d(118);

  ui.overlay.classList.remove("is-visible");
  setStatus("RUN");
  renderSaveState();
}

function addGatePair(distance, leftValue, rightValue) {
  addGate(distance, -1.45, leftValue);
  addGate(distance, 1.45, rightValue);
}

function addRecruitLine(startDistance, count, x, spacing) {
  for (let i = 0; i < count; i += 1) {
    const sway = Math.sin(i * 0.72) * 0.12;
    addRecruitGate(startDistance + i * spacing, x + sway, 1);
  }
}

function addRecruitGate(distance, x, value) {
  const group = new THREE.Group();
  const panel = new THREE.Mesh(new THREE.BoxGeometry(0.82, 1.36, 0.12), materials.gatePositive.clone());
  panel.position.y = 0.82;
  panel.castShadow = true;
  group.add(panel);

  const frameMaterial = new THREE.MeshStandardMaterial({ color: 0xaee7ff, roughness: 0.36 });
  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.52, 0.14), frameMaterial);
    post.position.set(side * 0.44, 0.76, 0);
    post.castShadow = true;
    group.add(post);
  }

  const label = createTextSprite(`+${value}`, "#ffffff", "#1f8fe8");
  label.position.set(0, 0.9, 0.08);
  label.scale.set(0.62, 0.32, 1);
  group.add(label);

  group.position.set(x, 0, -distance);
  entityGroup.add(group);
  entities.push({
    type: "gate",
    group,
    baseZ: -distance,
    x,
    value,
    width: 0.56,
    used: false
  });
}

function addGate(distance, x, value) {
  const group = new THREE.Group();
  const isPositive = value > 0;
  const panel = new THREE.Mesh(
    new THREE.BoxGeometry(1.35, 2.25, 0.14),
    isPositive ? materials.gatePositive.clone() : materials.gateNegative.clone()
  );
  panel.position.y = 1.16;
  panel.castShadow = true;
  group.add(panel);

  const frameMaterial = new THREE.MeshStandardMaterial({
    color: isPositive ? 0xb7ffd7 : 0xffc1c1,
    roughness: 0.45
  });

  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.09, 2.5, 0.16), frameMaterial);
    post.position.set(side * 0.72, 1.25, 0);
    post.castShadow = true;
    group.add(post);
  }

  const textColor = isPositive ? "#c8ffd8" : "#ffc8c8";
  const label = createTextSprite(`${value > 0 ? "+" : ""}${value}`, textColor, "transparent", 140, 256, 0.9);
  label.position.set(0, 1.16, 0.35);
  label.scale.set(1.34, 1.34, 1);
  group.add(label);

  group.position.set(x, 0, -distance);
  entityGroup.add(group);
  entities.push({
    type: "gate",
    group,
    baseZ: -distance,
    x,
    value,
    width: 0.86,
    used: false
  });
}

function addEnemy(distance, x, hp, damage) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(geometries.enemyBody, materials.enemy);
  const head = new THREE.Mesh(geometries.enemyHead, materials.enemyHead);
  body.castShadow = true;
  head.castShadow = true;
  body.position.y = 0.46;
  head.position.set(0, 1.02, -0.06);
  group.add(body, head);

  const hpBar = makeHpBar(1.2, 0.14);
  hpBar.position.y = 1.45;
  group.add(hpBar);

  group.position.set(x, 0, -distance);
  entityGroup.add(group);
  entities.push({
    type: "enemy",
    group,
    baseZ: -distance,
    x,
    hp,
    maxHp: hp,
    damage,
    alive: true,
    hpBar,
    hitRecover: 0,
    advanceZ: 0,
    advanceSpeed: 2
  });
}

function addEnemySwarm(distance, centerX, count, hp, damage, spreadX, advanceSpeed = 2, bodyColor = 0xb71e35) {
  const actualCount = Math.min(count, 220);
  count = actualCount;
  const columns = Math.max(5, Math.ceil(Math.sqrt(count) * 1.35));
  const spacingX = spreadX / columns;
  const spacingZ = 0.38;

  for (let i = 0; i < count; i += 1) {
    const column = i % columns;
    const row = Math.floor(i / columns);
    const wobble = Math.sin(i * 1.7) * 0.08;
    const x = THREE.MathUtils.clamp(
      centerX + (column - (columns - 1) / 2) * spacingX + wobble,
      -2.65,
      2.65
    );
    const zDistance = distance + row * spacingZ + (i % 3) * 0.08;
    addSwarmEnemy(zDistance, x, hp, damage, advanceSpeed, bodyColor);
  }
}

function addSwarmEnemy(distance, x, hp, damage, advanceSpeed, bodyColor = 0xb71e35) {
  const group = new THREE.Group();
  const headColor = new THREE.Color(bodyColor).lerp(new THREE.Color(1, 1, 1), 0.32).getHex();
  const body = new THREE.Mesh(geometries.enemyBody, new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.66 }));
  const head = new THREE.Mesh(geometries.enemyHead, new THREE.MeshStandardMaterial({ color: headColor, roughness: 0.52 }));
  body.position.y = 0.25;
  head.position.y = 0.57;
  body.castShadow = true;
  head.castShadow = true;
  group.add(body, head);

  group.position.set(x, 0, -distance);
  entityGroup.add(group);
  entities.push({
    type: "enemy",
    group,
    baseZ: -distance,
    x,
    hp,
    maxHp: hp,
    damage,
    alive: true,
    hitRecover: 0,
    advanceZ: 0,
    advanceSpeed
  });
}

function addPowerCrate(distance, x, power, hp, labelText) {
  const group = new THREE.Group();
  const crate = new THREE.Mesh(new THREE.BoxGeometry(1.55, 1.2, 1.35), materials.crate);
  crate.position.y = 0.6;
  crate.castShadow = true;
  crate.receiveShadow = true;
  group.add(crate);

  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.56, 0.2, 18), materials.soldierVest);
  top.position.y = 1.32;
  top.castShadow = true;
  group.add(top);

  const button = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.34, 0.12, 18),
    new THREE.MeshBasicMaterial({ color: 0x4be3ff, transparent: true, opacity: 0.86 })
  );
  button.position.y = 1.52;
  group.add(button);

  const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.95), materials.roadEdge);
  barrel.position.set(0, 1.38, -0.52);
  barrel.castShadow = true;
  group.add(barrel);

  const label = createTextSprite(labelText, "#ffffff", "#9a621e");
  label.position.set(0, 0.66, -0.72);
  label.scale.set(0.86, 0.44, 1);
  group.add(label);

  const hpBar = makeHpBar(1.36, 0.12);
  hpBar.position.y = 1.66;
  group.add(hpBar);

  group.position.set(x, 0, -distance);
  entityGroup.add(group);
  entities.push({
    type: "crate",
    group,
    baseZ: -distance,
    x,
    hp,
    maxHp: hp,
    power,
    labelText,
    alive: true,
    hpBar,
    hitRecover: 0
  });
}

function addBoss(distance, hp) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.75, 1.8, 1.45), materials.boss);
  const head = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.72, 1.08), materials.enemyHead);
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 18, 14),
    new THREE.MeshBasicMaterial({ color: 0xffd166 })
  );
  body.castShadow = true;
  head.castShadow = true;
  body.position.y = 0.9;
  head.position.set(0, 2.0, -0.08);
  core.position.set(0, 1.15, -0.78);
  group.add(body, head, core);
  group.scale.setScalar(1.45);

  const hpBar = makeHpBar(2.2, 0.18);
  hpBar.position.y = 2.55;
  group.add(hpBar);

  group.position.set(0, 0, -distance);
  entityGroup.add(group);
  activeBoss = {
    type: "boss",
    group,
    baseZ: -distance,
    x: 0,
    hp,
    maxHp: hp,
    damage: 6 + Math.floor(run.stage * 2.5),
    alive: true,
    hpBar,
    coreMesh: core,
    hitRecover: 0
  };
  entities.push(activeBoss);
}

function addFinishLine(distance) {
  const group = new THREE.Group();
  for (let i = 0; i < 6; i += 1) {
    const block = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.9), materials.finish);
    block.position.set(-3 + i * 1.2, 0.06, 0);
    block.receiveShadow = true;
    group.add(block);
  }
  group.position.set(0, 0, -distance);
  entityGroup.add(group);
  entities.push({ type: "finish", group, baseZ: -distance });
}

const particles = [];
const particleGeo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
const particleMats = {
  enemy: new THREE.MeshBasicMaterial({ color: 0xff3333 }),
  boss: new THREE.MeshBasicMaterial({ color: 0xffaa00 }),
  spark: new THREE.MeshBasicMaterial({ color: 0x00ffff })
};

function spawnParticles(x, y, z, type, count = 8, speed = 4) {
  const mat = particleMats[type] || particleMats.spark;
  for (let i = 0; i < count; i++) {
    const mesh = new THREE.Mesh(particleGeo, mat);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    particles.push({
      mesh,
      life: 0.4 + Math.random() * 0.4,
      age: 0,
      vx: (Math.random() - 0.5) * speed,
      vy: (Math.random() * 0.5 + 0.2) * speed,
      vz: (Math.random() - 0.5) * speed
    });
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.age += dt;
    if (p.age >= p.life) {
      scene.remove(p.mesh);
      particles.splice(i, 1);
    } else {
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      p.vy -= 15 * dt;
      const scale = 1 - (p.age / p.life);
      p.mesh.scale.setScalar(Math.max(0.01, scale));
    }
  }
}

function tick(time = performance.now()) {
  const dt = Math.min((time - lastFrameTime) / 1000, 0.033);
  lastFrameTime = time;
  update(dt);
  updateParticles(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

function update(dt) {
  if (phase === "running") {
    updateInput(dt);
    updateRun(dt);
    updateBullets(dt);
    updateEnemyBullets(dt);
    updateDying(dt);
    updateCamera(dt);
    updateUi();
  } else {
    updateIdleWorld(dt);
  }
}

function updateInput(dt) {
  const previousX = run.playerX;
  let direction = 0;
  if (input.left) {
    direction -= 1;
  }
  if (input.right) {
    direction += 1;
  }

  if (input.pointerActive) {
    run.playerTargetX = input.pointerTargetX;
  } else if (direction !== 0) {
    run.playerTargetX = THREE.MathUtils.clamp(run.playerTargetX + direction * dt * 5.1, -laneLimit, laneLimit);
  }

  run.playerX += (run.playerTargetX - run.playerX) * Math.min(1, dt * 12);
  run.playerX = THREE.MathUtils.clamp(run.playerX, -laneLimit, laneLimit);
  run.playerVelocityX = dt > 0 ? (run.playerX - previousX) / dt : 0;
  playerGroup.position.x = run.playerX;
}

function updateRun(dt) {
  const bossReady = activeBoss && activeBoss.alive && entityZ(activeBoss) >= -7;

  if (bossReady) {
    run.bossEncounter = true;
    activeBoss.group.position.z = -7;
    run.speed = 0;
    updateBoss(dt);
  } else {
    run.speed = 5.0 + Math.min(5.0, run.stage * 0.4);
    run.progress += run.speed * dt;
  }

  for (const entity of entities) {
    if (entity === activeBoss && run.bossEncounter) {
      continue;
    }
    if (entity.type === "enemy" && entity.alive && entity.advanceSpeed > 0) {
      entity.advanceZ += entity.advanceSpeed * dt;
      entity.group.position.z = entity.baseZ + run.progress + entity.advanceZ;
      // Walking bob animation
      const phase = performance.now() * 0.009 + entity.baseZ * 0.4;
      entity.group.position.y = Math.abs(Math.sin(phase)) * 0.14;
      entity.group.rotation.x = Math.sin(phase) * 0.14;
    } else {
      entity.group.position.z = entity.baseZ + run.progress;
    }
  }

  updateLaneMarkers();
  handleGateCollisions();
  handleEnemyCollisions();
  autoShoot(dt);

  // Hit-squish recovery
  for (const entity of entities) {
    if (entity.hitRecover > 0) {
      entity.hitRecover = Math.max(0, entity.hitRecover - dt);
      if (entity.alive) {
        const t = entity.hitRecover / 0.07;
        entity.group.scale.setScalar(1 + Math.sin(t * Math.PI) * 0.22);
      }
      if (entity.hitRecover <= 0 && entity.alive) {
        entity.group.scale.setScalar(1);
      }
    }
  }

  if (run.squad <= 0) {
    finishRun(false, "部隊が壊滅しました。");
  }
}

function updateBoss(dt) {
  run.bossAttackCooldown -= dt;
  const t = performance.now() * 0.005;
  activeBoss.group.rotation.y = Math.sin(t * 0.6) * 0.12;

  const raging = activeBoss.hp < activeBoss.maxHp * 0.75;
  const frenzy = activeBoss.hp < activeBoss.maxHp * 0.3;
  const cooldownBase = Math.max(0.13, 0.68 - run.stage * 0.06);
  const effectiveCooldown = frenzy ? cooldownBase * 0.35 : raging ? cooldownBase * 0.52 : cooldownBase;

  if (activeBoss.coreMesh) {
    const pulse = 0.5 + Math.sin(t * (frenzy ? 9 : raging ? 5 : 2.2)) * 0.5;
    const hue = frenzy ? 0.0 : raging ? 0.02 : 0.13;
    activeBoss.coreMesh.material.color.setHSL(hue, 1, 0.48 + pulse * 0.22);
    const scaleBase = frenzy ? 1.45 : 1.45;
    activeBoss.group.scale.setScalar(scaleBase + Math.sin(t * (frenzy ? 5 : 3.5)) * (frenzy ? 0.06 : 0.03));
  }

  if (run.bossAttackCooldown <= 0) {
    run.bossAttackCooldown = effectiveCooldown;
    const shotCount = 2 + Math.floor(run.stage / 2) + (frenzy ? 4 : raging ? 2 : 0);
    const bx = activeBoss.group.position.x;
    const bz = activeBoss.group.position.z;
    for (let i = 0; i < shotCount; i += 1) {
      const spread = shotCount > 1 ? (i / (shotCount - 1) - 0.5) * 3.8 : 0;
      createEnemyBullet(bx + spread, bz);
    }
    Audio.playBossAlert();
    setStatus(frenzy ? "BOSS FRENZY!!" : raging ? "BOSS RAGE!" : "BOSS FIRE!");
  }
}

function autoShoot(dt) {
  run.shotCooldown -= dt;
  if (run.shotCooldown > 0 || run.squad <= 0) {
    return;
  }

  const target = findTargets(1)[0];
  if (!target) {
    return;
  }

  const interval = Math.max(0.16, 0.3 - run.firePower * 0.025);
  run.shotCooldown = interval;
  const availableBulletSlots = Math.max(0, 560 - bullets.length);
  const firingSlots = squadSlots.slice(0, availableBulletSlots);

  for (let i = 0; i < firingSlots.length; i += 1) {
    createBullet(firingSlots[i], i);
  }
  if (firingSlots.length > 0) {
    Audio.playShoot();
  }
}

function findTargets(limit) {
  return entities
    .filter((entity) => {
      if ((entity.type !== "enemy" && entity.type !== "boss" && entity.type !== "crate") || !entity.alive) {
        return false;
      }

      const z = entityZ(entity);
      return z < playerZ + 0.9 && z > -38;
    })
    .sort((a, b) => entityZ(b) - entityZ(a))
    .slice(0, limit);
}

function createBullet(slot, index) {
  run.shotIndex += 1;
  const group = new THREE.Group();
  const start = new THREE.Vector3(
    THREE.MathUtils.clamp(run.playerX + slot.x, -2.95, 2.95),
    0.5,
    playerZ + slot.z - 0.34
  );
  const inheritedVelocity = new THREE.Vector3(run.playerVelocityX * 0.38, 0, 0);
  const speed = 27 + Math.min(14, run.firePower * 1.9);
  const velocity = new THREE.Vector3(0, 0, -speed).add(inheritedVelocity);
  const velocityDirection = velocity.clone().normalize();

  const coreMaterial = materials.bullet.clone();
  const trailMaterial = materials.bulletTrail.clone();
  const radius = 0.09 + Math.min(0.06, run.squad * 0.0007 + run.firePower * 0.003);
  const core = new THREE.Mesh(new THREE.SphereGeometry(radius, 8, 6), coreMaterial);
  const trailLength = 0.36 + Math.min(0.28, velocity.length() * 0.005);
  const trail = new THREE.Mesh(new THREE.CylinderGeometry(0, radius * 0.65, trailLength, 6), trailMaterial);

  trail.position.copy(velocityDirection.clone().multiplyScalar(-trailLength * 0.55));
  trail.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), velocityDirection.clone().multiplyScalar(-1));
  group.position.copy(start);
  group.add(trail, core);
  bulletGroup.add(group);

  bullets.push({
    mesh: group,
    velocity,
    damage: Math.max(1, Math.round(run.firePower * 1.25 + run.squad / 28)),
    materials: [coreMaterial, trailMaterial],
    age: 0,
    life: 1.45
  });
}

function updateBullets(dt) {
  for (let i = bullets.length - 1; i >= 0; i -= 1) {
    const bullet = bullets[i];
    bullet.age += dt;
    const previousPosition = bullet.mesh.position.clone();
    bullet.mesh.position.addScaledVector(bullet.velocity, dt);
    const hit = findBulletHit(bullet, previousPosition);

    if (hit) {
      applyBulletHit(hit, bullet.damage);
      removeBullet(i);
      continue;
    }

    const t = Math.min(1, bullet.age / bullet.life);
    bullet.materials[1].opacity = 0.55 * (1 - t);

    if (bullet.age >= bullet.life || bullet.mesh.position.z < -32 || bullet.mesh.position.z > playerZ + 4) {
      removeBullet(i);
    }
  }
}

function findBulletHit(bullet, previousPosition) {
  let nearest = null;
  let nearestDistance = Infinity;
  const currentPosition = bullet.mesh.position;

  for (const entity of entities) {
    if ((entity.type !== "enemy" && entity.type !== "boss" && entity.type !== "crate") || !entity.alive) {
      continue;
    }

    const center = new THREE.Vector3(
      entity.group.position.x,
      entity.type === "boss" ? 1.18 : entity.type === "crate" ? 0.74 : 0.5,
      entityZ(entity)
    );
    const radius = entity.type === "boss" ? 1.22 : entity.type === "crate" ? 0.82 : 0.52;
    const distance = distancePointToSegment(center, previousPosition, currentPosition);

    if (distance < radius && distance < nearestDistance) {
      nearest = entity;
      nearestDistance = distance;
    }
  }

  return nearest;
}

function distancePointToSegment(point, start, end) {
  const segment = new THREE.Vector3().subVectors(end, start);
  const lengthSq = segment.lengthSq();

  if (lengthSq === 0) {
    return point.distanceTo(start);
  }

  const t = THREE.MathUtils.clamp(new THREE.Vector3().subVectors(point, start).dot(segment) / lengthSq, 0, 1);
  const closest = start.clone().addScaledVector(segment, t);
  return point.distanceTo(closest);
}

function applyBulletHit(target, damage) {
  if (!target.alive) {
    return;
  }

  target.hp -= damage;
  updateHpBar(target);

  if (target.hp > 0) {
    // Hit squish: peaks mid-animation via updateRun's sin curve
    target.hitRecover = 0.07;
    spawnParticles(target.group.position.x, 1.0, entityZ(target), 'spark', 3, 2);
    Audio.playHit();
  }

  if (target.hp <= 0) {
    defeatTarget(target);
  }
}

function removeBullet(index) {
  const bullet = bullets[index];
  bulletGroup.remove(bullet.mesh);
  disposeObject(bullet.mesh);
  bullets.splice(index, 1);
}

function createEnemyBullet(sourceX, sourceZ) {
  const group = new THREE.Group();
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xff3322, transparent: true, opacity: 0.92, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.38, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  group.add(glow, core);

  const accuracy = Math.max(0.06, 0.70 - run.stage * 0.06);
  const targetX = run.playerX + (Math.random() - 0.5) * accuracy * 2;
  const dx = targetX - sourceX;
  const dz = playerZ - sourceZ;
  const len = Math.sqrt(dx * dx + dz * dz);
  const speed = 17 + Math.min(18, run.stage * 1.4);

  group.position.set(sourceX, 0.65, sourceZ);
  bulletGroup.add(group);
  enemyBullets.push({
    mesh: group,
    velocity: new THREE.Vector3((dx / len) * speed, 0, (dz / len) * speed),
    damage: activeBoss ? activeBoss.damage : 2,
    age: 0
  });
}

function updateEnemyBullets(dt) {
  for (let i = enemyBullets.length - 1; i >= 0; i -= 1) {
    const b = enemyBullets[i];
    b.age += dt;
    b.mesh.position.addScaledVector(b.velocity, dt);

    const bz = b.mesh.position.z;
    const bx = b.mesh.position.x;
    if (bz >= playerZ - 0.9 && bz <= playerZ + 1.4) {
      const halfWidth = Math.min(2.75, 0.32 + Math.sqrt(Math.max(1, run.squad)) * 0.18);
      if (Math.abs(bx - run.playerX) < halfWidth + 0.22) {
        changeSquad(-b.damage);
        Audio.playPlayerDamage();
        triggerDamageFlash();
        triggerShake(0.18 + b.damage * 0.03);
        spawnFloatNumber(`-${b.damage}`, "#ff5d5d");
        setStatus(`HIT -${b.damage}`);
        removeEnemyBullet(i);
        continue;
      }
    }

    if (b.age > 5 || bz > playerZ + 2) {
      removeEnemyBullet(i);
    }
  }
}

function removeEnemyBullet(index) {
  const b = enemyBullets[index];
  bulletGroup.remove(b.mesh);
  disposeObject(b.mesh);
  enemyBullets.splice(index, 1);
}

function disposeObject(object) {
  object.traverse((child) => {
    if (child.geometry) {
      child.geometry.dispose();
    }

    if (Array.isArray(child.material)) {
      child.material.forEach((material) => material.dispose());
    } else if (child.material) {
      child.material.dispose();
    }
  });
}

function handleGateCollisions() {
  for (const gate of entities) {
    if (gate.type !== "gate" || gate.used) {
      continue;
    }

    const z = entityZ(gate);
    if (Math.abs(z - playerZ) < 0.72 && Math.abs(run.playerX - gate.x) < gate.width) {
      gate.used = true;
      changeSquad(gate.value);
      Audio.playGate(gate.value > 0);
      dyingEntities.push({ group: gate.group, timer: 0, duration: 0.28, scaleOut: true });
      const color = gate.value > 0 ? "#39d98a" : "#ff5d5d";
      spawnFloatNumber(`${gate.value > 0 ? "+" : ""}${gate.value}`, color);
      setStatus(gate.value > 0 ? `SQUAD +${gate.value}` : `SQUAD ${gate.value}`);
    }

    if (z > playerZ + 2.2) {
      gate.used = true;
    }
  }
}

function handleEnemyCollisions() {
  for (const entity of entities) {
    if (entity.type !== "enemy" || !entity.alive) {
      continue;
    }

    const z = entityZ(entity);
    if (z > playerZ - 0.55) {
      const formationHalfWidth = Math.min(2.75, 0.32 + Math.sqrt(Math.max(1, run.squad)) * 0.18);
      const enemyRadius = 0.28;
      const touchesSquad = Math.abs(entity.group.position.x - run.playerX) < formationHalfWidth + enemyRadius;

      if (touchesSquad) {
        const loss = Math.min(run.squad, entity.damage);
        changeSquad(-loss);
        Audio.playPlayerDamage();
        entity.alive = false;
        dyingEntities.push({ group: entity.group, timer: 0, duration: 0.2 });
        triggerShake(0.14 + loss * 0.04);
        triggerDamageFlash();
        setStatus(`DAMAGE -${loss}`);
        continue;
      }
    }

    if (z > playerZ + 0.6) {
      triggerShake(0.4);
      triggerDamageFlash();
      setStatus("BREAKTHROUGH!");
      finishRun(false, "敵を倒し損ね、突破されました。");
      return;
    }
  }
}

function defeatTarget(target) {
  target.alive = false;
  target.hitRecover = 0;
  dyingEntities.push({ group: target.group, timer: 0, duration: 0.22 });
  spawnParticles(target.group.position.x, 1.0, entityZ(target), target.type === "boss" ? 'boss' : 'enemy', 15, 6);

  if (target.type === "boss") {
    Audio.playBossDie();
    finishRun(true, "ボス撃破。ステージクリア。");
  } else if (target.type === "crate") {
    Audio.playPowerUp();
    run.firePower += target.power;
    run.reward += target.power * 18;
    spawnFloatNumber(`WEAPON +${target.power}`, "#38a7ff");
    setStatus(`WEAPON UP +${target.power}`);
  } else {
    Audio.playEnemyDie();
    run.reward += 1;
    run.enemiesDefeated += 1;
    if (run.enemiesDefeated % 15 === 0) {
      run.firePower += 1;
      spawnFloatNumber(`POWER UP!`, "#ffd166");
      setStatus(`POWER x${run.firePower}`);
    } else {
      setStatus("ENEMY DOWN");
    }
  }
}

function changeSquad(amount) {
  run.squad = Math.max(0, run.squad + amount);
  rebuildSquadVisual(run.squad);
}

function finishRun(success, message) {
  if (phase !== "running") {
    return;
  }

  phase = success ? "clear" : "failed";
  const stageReward = success ? 80 + run.stage * 24 + run.squad * 4 + run.reward : 18 + run.reward;
  const foodReward = success ? 24 + run.stage * 3 : 6;
  const ironReward = success ? 14 + run.stage * 2 : 3;

  saveData.coins += stageReward;
  saveData.food += foodReward;
  saveData.iron += ironReward;

  if (success) {
    saveData.stage += 1;
    saveData.clearedRuns += 1;
    if (saveData.clearedRuns % 2 === 0) {
      saveData.baseLevel += 1;
    }
  }

  saveData = saveGame(saveData);
  renderSaveState();

  ui.resultKicker.textContent = success ? "CLEAR" : "FAILED";
  ui.overlayTitle.textContent = success ? "ステージクリア" : "再出撃";
  ui.overlayBody.textContent = `${message} 報酬: ${stageReward} coins / ${foodReward} food / ${ironReward} iron`;
  ui.startButton.textContent = success ? "次へ" : "再挑戦";
  ui.overlay.classList.add("is-visible");
}

function showMenu() {
  phase = "menu";
  ui.resultKicker.textContent = "THREE.JS MVP";
  ui.overlayTitle.textContent = "ラストラン・サバイバル";
  ui.overlayBody.textContent = "青い+1ゲートで部隊を増員、迫る赤い大群を一兵残さず殲滅せよ。一体でも突破されたら敗北。";
  ui.startButton.textContent = "出撃";
  ui.overlay.classList.add("is-visible");
  setStatus("READY");
  updateUi();
}

function updateUi() {
  ui.stageLabel.textContent = String(saveData.stage);
  ui.squadLabel.textContent = phase === "running" ? String(run.squad) : "-";
  ui.coinsLabel.textContent = String(saveData.coins);
  ui.weaponLabel.textContent = phase === "running" ? `x${run.firePower}` : "-";
  ui.foodLabel.textContent = String(saveData.food);
  ui.ironLabel.textContent = String(saveData.iron);
  ui.progressMeter.value = phase === "running" ? Math.min(100, (run.progress / run.distance) * 100) : 0;

  if (activeBoss && run.bossEncounter && activeBoss.alive) {
    ui.bossHud.style.display = "flex";
    const ratio = Math.max(0, activeBoss.hp / activeBoss.maxHp);
    ui.bossHpFill.style.width = `${ratio * 100}%`;
  } else {
    ui.bossHud.style.display = "none";
  }
}

function renderSaveState() {
  updateUi();
  ui.savedStageLabel.textContent = String(saveData.stage);
  ui.savedCoinsLabel.textContent = String(saveData.coins);
  ui.baseLevelLabel.textContent = String(saveData.baseLevel);
}

function updateCamera(dt) {
  const targetX = run.playerX * 0.22;
  camera.position.x += (targetX - camera.position.x) * Math.min(1, dt * 3.5);

  if (cameraShake.intensity > 0) {
    const sx = (Math.random() - 0.5) * cameraShake.intensity;
    const sy = (Math.random() - 0.5) * cameraShake.intensity * 0.5;
    cameraShake.intensity = Math.max(0, cameraShake.intensity - dt * 5.5);
    camera.lookAt(run.playerX * 0.12 + sx, 0.9 + sy, -15);
  } else {
    camera.lookAt(run.playerX * 0.12, 0.9, -15);
  }
}

function updateIdleWorld(dt) {
  const drift = dt * 1.6;
  run.progress = (run.progress + drift) % 5;
  updateLaneMarkers();
  playerGroup.rotation.y = Math.sin(performance.now() * 0.0012) * 0.04;
}

function updateLaneMarkers() {
  for (const marker of laneMarkers) {
    let z = marker.userData.baseZ + (run.progress % 130);
    while (z > 5) {
      z -= 130;
    }
    marker.position.z = z;
  }
}

function updateHpBar(entity) {
  if (!entity.hpBar) {
    return;
  }

  const fill = entity.hpBar.userData.fill;
  const ratio = Math.max(0, entity.hp / entity.maxHp);
  fill.scale.x = ratio;
  fill.position.x = -entity.hpBar.userData.width * (1 - ratio) * 0.5;
}

function makeHpBar(width, height) {
  const group = new THREE.Group();
  const back = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, 0.04),
    new THREE.MeshBasicMaterial({ color: 0x171717 })
  );
  const fill = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, 0.05),
    new THREE.MeshBasicMaterial({ color: 0x39d98a })
  );
  fill.position.z = 0.02;
  group.add(back, fill);
  group.userData = { fill, width };
  return group;
}

function createTextSprite(text, color, background, fontSize = 62, canvasHeight = 128, opacity = 1) {
  const labelCanvas = document.createElement("canvas");
  labelCanvas.width = 256;
  labelCanvas.height = canvasHeight;
  const context = labelCanvas.getContext("2d");
  if (background !== "transparent") {
    context.fillStyle = background;
    context.fillRect(0, 0, labelCanvas.width, labelCanvas.height);
  }
  context.font = `900 ${fontSize}px Segoe UI, sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  const cx = 128;
  const cy = canvasHeight / 2 + 4;
  if (background === "transparent") {
    context.strokeStyle = "rgba(0,0,0,0.82)";
    context.lineWidth = Math.max(5, Math.round(fontSize * 0.13));
    context.lineJoin = "round";
    context.strokeText(text, cx, cy);
  }
  context.fillStyle = color;
  context.fillText(text, cx, cy);

  const texture = new THREE.CanvasTexture(labelCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity });
  return new THREE.Sprite(material);
}

function entityZ(entity) {
  return entity.group.position.z;
}

function setStatus(text) {
  ui.statusText.textContent = text;
  ui.statusText.style.animation = "none";
  ui.statusText.offsetHeight; // force reflow to restart animation
  ui.statusText.style.animation = "status-pop 0.25s ease forwards";
}

function triggerShake(intensity) {
  cameraShake.intensity = Math.max(cameraShake.intensity, intensity);
}

function triggerDamageFlash() {
  ui.damageFlash.classList.add("active");
  requestAnimationFrame(() => ui.damageFlash.classList.remove("active"));
}

function spawnFloatNumber(text, color) {
  const el = document.createElement("div");
  el.className = "float-num";
  el.textContent = text;
  el.style.color = color;
  el.style.left = `${42 + Math.random() * 16}%`;
  el.style.bottom = `${26 + Math.random() * 8}%`;
  document.getElementById("app").appendChild(el);
  setTimeout(() => el.remove(), 1200);
}

function updateDying(dt) {
  for (let i = dyingEntities.length - 1; i >= 0; i -= 1) {
    const d = dyingEntities[i];
    d.timer += dt;
    const t = Math.min(1, d.timer / d.duration);

    if (d.scaleOut) {
      // Gate burst: scales up then collapses
      const s = t < 0.4 ? 1 + t * 1.25 : 1.5 - (t - 0.4) * 2.5;
      d.group.scale.setScalar(Math.max(0.01, s));
    } else {
      d.group.scale.setScalar(1 - t);
    }

    if (t >= 1) {
      d.group.visible = false;
      d.group.scale.setScalar(1);
      dyingEntities.splice(i, 1);
    }
  }
}

function bindEvents() {
  window.addEventListener("resize", resize);

  ui.startButton.addEventListener("click", startRun);

  ui.resetButton.addEventListener("click", () => {
    ui.confirmModal.style.display = "flex";
  });

  ui.confirmOkBtn.addEventListener("click", () => {
    ui.confirmModal.style.display = "none";
    saveData = resetSave();
    renderSaveState();
    showMenu();
  });

  ui.confirmCancelBtn.addEventListener("click", () => {
    ui.confirmModal.style.display = "none";
  });

  canvas.addEventListener("pointerdown", (event) => {
    input.pointerActive = true;
    updatePointerTarget(event.clientX);
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener("pointermove", (event) => {
    if (input.pointerActive) {
      updatePointerTarget(event.clientX);
    }
  });

  canvas.addEventListener("pointerup", () => {
    input.pointerActive = false;
  });

  canvas.addEventListener("pointercancel", () => {
    input.pointerActive = false;
  });

  bindMoveButton(ui.leftButton, "left");
  bindMoveButton(ui.rightButton, "right");

  window.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
      input.left = true;
    }
    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
      input.right = true;
    }
  });

  window.addEventListener("keyup", (event) => {
    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
      input.left = false;
    }
    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
      input.right = false;
    }
  });
}

function bindMoveButton(button, key) {
  const setActive = (active) => {
    input[key] = active;
  };

  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    setActive(true);
  });
  button.addEventListener("pointerup", () => setActive(false));
  button.addEventListener("pointercancel", () => setActive(false));
  button.addEventListener("pointerleave", () => setActive(false));
}

function updatePointerTarget(clientX) {
  const rect = canvas.getBoundingClientRect();
  const ratio = (clientX - rect.left) / Math.max(1, rect.width);
  input.pointerTargetX = THREE.MathUtils.clamp((ratio - 0.5) * 6.4, -laneLimit, laneLimit);
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.fov = width < 520 ? 58 : 52;
  camera.position.y = width < 520 ? 7.5 : 6.7;
  camera.position.z = width < 520 ? 12.6 : 11.4;
  camera.updateProjectionMatrix();
}

function clearEntities() {
  entities = [];
  bullets = [];
  dyingEntities = [];
  enemyBullets = [];
  activeBoss = null;
  clearGroup(entityGroup);
  clearGroup(bulletGroup);
}

function clearGroup(group) {
  while (group.children.length > 0) {
    const child = group.children.pop();
    group.remove(child);
  }
}
