const SAVE_KEY = "koukokuGame.saveData";

export const defaultSave = {
  stage: 1,
  coins: 0,
  food: 0,
  iron: 0,
  baseLevel: 1,
  heroLevel: 1,
  clearedRuns: 0
};

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      return { ...defaultSave };
    }

    const parsed = JSON.parse(raw);
    return sanitizeSave(parsed);
  } catch {
    return { ...defaultSave };
  }
}

export function saveGame(saveData) {
  const safeData = sanitizeSave(saveData);
  localStorage.setItem(SAVE_KEY, JSON.stringify(safeData));
  return safeData;
}

export function resetSave() {
  localStorage.removeItem(SAVE_KEY);
  return { ...defaultSave };
}

function sanitizeSave(value) {
  const next = { ...defaultSave, ...(value && typeof value === "object" ? value : {}) };

  for (const key of Object.keys(defaultSave)) {
    const fallback = defaultSave[key];
    if (typeof fallback === "number") {
      const numberValue = Number(next[key]);
      next[key] = Number.isFinite(numberValue) ? Math.max(0, Math.floor(numberValue)) : fallback;
    }
  }

  next.stage = Math.max(1, next.stage);
  next.baseLevel = Math.max(1, next.baseLevel);
  next.heroLevel = Math.max(1, next.heroLevel);
  return next;
}
