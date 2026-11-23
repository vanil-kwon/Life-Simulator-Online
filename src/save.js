const KEY = 'life-simulator-save-v1';

const defaultSave = (name = 'Игрок') => ({
  version: 1,
  player: { name, x: 480, y: 420, direction: 'down' },
  economy: { money: 1000 },
  vehicle: { owned: true, model: 'City Compact', x: 650, y: 420 },
  world: { day: 1, lastPlayed: Date.now() },
  settings: { sound: true }
});

export function loadSave(name) {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultSave(name);
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1) return defaultSave(name);
    parsed.player.name = name || parsed.player.name || 'Игрок';
    return parsed;
  } catch (error) {
    console.warn('Не удалось прочитать сохранение:', error);
    return defaultSave(name);
  }
}

export function saveGame(data) {
  data.world.lastPlayed = Date.now();
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Не удалось сохранить игру:', error);
    return false;
  }
}

export function resetSave() {
  localStorage.removeItem(KEY);
}
