const KEY = 'life-simulator-save';
const OLD_KEY = 'life-simulator-save-v1';
const NAME_KEY = 'life-simulator-name';
const CURRENT_VERSION = 3;

export const defaultSave = (name = 'Игрок') => ({
  version: CURRENT_VERSION,
  player: { name, x: 480, y: 420, direction: 'down' },
  economy: { money: 1000 },
  vehicle: { owned: true, model: 'City Compact', x: 650, y: 420, rotation: 0, inUse: false },
  world: { day: 1, lastPlayed: Date.now() },
  settings: { sound: true },
  inside: null,
  stats: { health: 100, hunger: 100, energy: 100, hygiene: 100 },
  inventory: { items: [] },
  job: { profession: 'courier', lastShift: 0, shifts: 0 },
});

function deepMerge(target, source) {
  if (Array.isArray(target) && Array.isArray(source)) {
    return source.length ? source : target;
  }
  if (target && typeof target === 'object' && source && typeof source === 'object') {
    const out = { ...target };
    for (const key of Object.keys(source)) {
      out[key] = key in target ? deepMerge(target[key], source[key]) : source[key];
    }
    return out;
  }
  return source !== undefined ? source : target;
}

function migrate(raw) {
  if (!raw || typeof raw !== 'object') return null;
  let data = raw;
  if (!data.version || data.version < 1) data.version = 1;
  if (data.version === 1) {
    data = { ...data, version: 2 };
  }
  return data;
}

export function loadSave(name) {
  let raw = null;
  try {
    const text = localStorage.getItem(KEY) || localStorage.getItem(OLD_KEY);
    if (text) raw = JSON.parse(text);
  } catch (e) {
    console.warn('Не удалось прочитать сохранение:', e);
    raw = null;
  }
  const migrated = migrate(raw) || {};
  const merged = deepMerge(defaultSave(name), migrated);
  merged.player.name = name || merged.player.name || 'Игрок';
  return merged;
}

export function saveGame(data) {
  data.version = CURRENT_VERSION;
  data.world.lastPlayed = Date.now();
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    if (localStorage.getItem(OLD_KEY)) localStorage.removeItem(OLD_KEY);
    return true;
  } catch (e) {
    console.error('Не удалось сохранить игру:', e);
    return false;
  }
}

export function resetSave() {
  localStorage.removeItem(KEY);
  localStorage.removeItem(OLD_KEY);
}

export { NAME_KEY };
