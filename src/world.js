import Phaser from 'phaser';

const TILE = 32;
const COLORS = {
  grass: 0x527b55, grass2: 0x5b875d, road: 0x414a50,
  roadLine: 0xd9c98b, sidewalk: 0x9b9d91, building: 0x9a7660
};

export function drawCity(scene) {
  const g = scene.add.graphics();
  const width = 1600, height = 1200;
  g.fillStyle(COLORS.grass);
  g.fillRect(0, 0, width, height);

  // Текстура травы
  for (let y = 0; y < height; y += TILE) {
    for (let x = 0; x < width; x += TILE) {
      if (((x / TILE) * 7 + (y / TILE) * 11) % 5 === 0) {
        g.fillStyle(COLORS.grass2, 0.45);
        g.fillRect(x + 5, y + 7, 5, 4);
      }
    }
  }

  // Две пересекающиеся улицы
  g.fillStyle(COLORS.sidewalk);
  g.fillRect(0, 360, width, 112);
  g.fillRect(650, 0, 112, height);
  g.fillStyle(COLORS.road);
  g.fillRect(0, 376, width, 80);
  g.fillRect(666, 0, 80, height);

  // Дорожная разметка
  g.lineStyle(2, COLORS.roadLine, 0.85);
  for (let x = 20; x < width; x += 48) {
    g.beginPath(); g.moveTo(x, 416); g.lineTo(x + 23, 416); g.strokePath();
  }
  for (let y = 20; y < height; y += 48) {
    g.beginPath(); g.moveTo(706, y); g.lineTo(706, y + 23); g.strokePath();
  }

  // Пешеходные переходы
  g.fillStyle(0xe6e2d5, 0.9);
  for (let i = 0; i < 6; i++) {
    g.fillRect(630 + i * 18, 364, 9, 12);
    g.fillRect(630 + i * 18, 460, 9, 12);
  }

  // Парки
  drawPark(g, 80, 80, 380, 220);
  drawPark(g, 920, 80, 300, 220);
  drawPark(g, 900, 760, 400, 300);

  // Здания и интерактивные зоны
  const buildings = [
    { x: 80, y: 540, w: 220, h: 160, color: 0x9b7660, name: 'МАГАЗИН', type: 'shop' },
    { x: 360, y: 540, w: 210, h: 190, color: 0x788d9b, name: 'АВТОСАЛОН', type: 'dealer' },
    { x: 830, y: 530, w: 240, h: 180, color: 0xb28b65, name: 'КАФЕ', type: 'cafe' },
    { x: 1120, y: 530, w: 250, h: 180, color: 0x887c9f, name: 'ДОМ', type: 'home' },
    { x: 100, y: 850, w: 260, h: 180, color: 0x8d9b78, name: 'РАБОТА', type: 'work' },
    { x: 430, y: 850, w: 250, h: 180, color: 0x9b9b9b, name: 'ГАРАЖ', type: 'garage' }
  ];

  for (const b of buildings) {
    g.fillStyle(0x28313a, 0.35);
    g.fillRect(b.x + 8, b.y + 10, b.w, b.h);
    g.fillStyle(b.color);
    g.fillRect(b.x, b.y, b.w, b.h);
    g.fillStyle(0xffffff, 0.12);
    g.fillRect(b.x + 8, b.y + 8, b.w - 16, 12);
    g.fillStyle(0x39434b);
    g.fillRect(b.x + b.w / 2 - 20, b.y + b.h - 36, 40, 36);
    g.lineStyle(3, 0x303a42);
    g.strokeRect(b.x, b.y, b.w, b.h);
    scene.add.text(b.x + b.w / 2, b.y + 22, b.name, {
      fontFamily: 'Arial', fontSize: '13px', fontStyle: 'bold',
      color: '#ffffff', backgroundColor: '#26333dcc', padding: {x: 5, y: 4}
    }).setOrigin(0.5);
  }

  // Декоративные фонари
  for (const [x, y] of [[590,340],[790,340],[590,490],[790,490],[310,340],[1030,490]]) {
    g.fillStyle(0x26313a); g.fillCircle(x, y, 5);
    g.fillStyle(0xf5df9b, 0.8); g.fillCircle(x, y, 2);
  }

  scene.cityBuildings = buildings;
  scene.add.text(800, 22, 'PIXEL CITY • ЦЕНТРАЛЬНЫЙ РАЙОН', {
    fontSize: '13px', color: '#e8f0d8', backgroundColor: '#263b2dcc',
    padding: {x: 8, y: 5}
  }).setOrigin(0.5, 0);
}

function drawPark(g, x, y, w, h) {
  g.fillStyle(0x47734d);
  g.fillRoundedRect(x, y, w, h, 12);
  for (let i = 0; i < 12; i++) {
    const tx = x + 25 + (i * 71) % Math.max(50, w - 50);
    const ty = y + 25 + (i * 43) % Math.max(50, h - 50);
    g.fillStyle(0x31563b); g.fillCircle(tx + 3, ty + 5, 15);
    g.fillStyle(i % 2 ? 0x6b9a5b : 0x78a864); g.fillCircle(tx, ty, 14);
    g.fillStyle(0x9dbb77); g.fillRect(tx - 3, ty - 4, 6, 3);
  }
}
