# DEPRECATED. Одноразовая миграция, уже применена.
# НЕ ЗАПУСКАТЬ: перезапишет ручные правки enterBuilding/exitBuilding в src/game.js.


from pathlib import Path

root = Path.cwd()
game_path = root / "src/game.js"
game = game_path.read_text()

interior = r"""
const ROOMS = {
  shop: ['МИНИ-МАРКЕТ', 0xb9a77e, 0x668b70],
  dealer: ['АВТОСАЛОН', 0x929da3, 0x4a9db5],
  cafe: ['ГОРОДСКОЕ КАФЕ', 0xb78e69, 0xc87951],
  home: ['МОЙ ДОМ', 0x987c69, 0x668b70],
  work: ['ОФИС', 0x9b9b88, 0x6684a1],
  garage: ['ГАРАЖ', 0x777f84, 0xd3a34d]
};

export function drawInterior(scene, type) {
  const room = ROOMS[type] || ROOMS.home;
  const objects = [];
  const g = scene.add.graphics().setDepth(1);
  objects.push(g);

  g.fillStyle(room[1]);
  g.fillRect(0, 0, 640, 480);

  g.lineStyle(1, 0x000000, 0.09);
  for (let x = 0; x <= 640; x += 32) g.lineBetween(x, 0, x, 480);
  for (let y = 0; y <= 480; y += 32) g.lineBetween(0, y, 640, y);

  g.fillStyle(0x39434a);
  g.fillRect(0, 0, 640, 24);
  g.fillRect(0, 0, 18, 480);
  g.fillRect(622, 0, 18, 480);

  g.fillStyle(room[2], 0.8);
  g.fillRoundedRect(190, 145, 260, 170, 12);
  g.lineStyle(3, 0xf0dfb4, 0.65);
  g.strokeRoundedRect(198, 153, 244, 154, 8);

  if (type === 'shop') {
    g.fillStyle(0x70543a);
    g.fillRect(65, 85, 510, 35);
    g.fillRect(70, 175, 500, 18);
    g.fillRect(70, 270, 500, 18);
    for (let i = 0; i < 5; i++) {
      g.fillStyle([0xd5a34e, 0x6e9fc0, 0xb86c63][i % 3]);
      g.fillRect(85 + i * 95, 145, 24, 25);
      g.fillRect(85 + i * 95, 240, 24, 25);
    }
  } else if (type === 'cafe') {
    g.fillStyle(0x654832);
    g.fillRoundedRect(70, 85, 190, 45, 6);
    for (const [x, y] of [[145,235],[495,235],[145,345],[495,345]]) {
      g.fillStyle(0x6d4936);
      g.fillRoundedRect(x, y, 35, 35, 5);
    }
  } else if (type === 'dealer') {
    g.fillStyle(0x4a9db5);
    g.fillRoundedRect(235, 145, 170, 95, 18);
    g.fillStyle(0x1c2932);
    g.fillRoundedRect(250, 158, 140, 68, 12);
    g.fillStyle(0xb8dce1);
    g.fillRect(270, 165, 100, 18);
  } else if (type === 'home') {
    g.fillStyle(0x79543d);
    g.fillRoundedRect(75, 95, 210, 95, 8);
    g.fillStyle(0x526f8b);
    g.fillRect(95, 130, 170, 48);
    g.fillStyle(0x6b4936);
    g.fillRect(390, 85, 160, 100);
    g.fillStyle(0xddd0ad);
    g.fillRect(405, 98, 130, 70);
  } else if (type === 'work') {
    for (let i = 0; i < 3; i++) {
      g.fillStyle(0x66503e);
      g.fillRect(65 + i * 185, 105, 145, 55);
      g.fillStyle(0x526f8b);
      g.fillRect(75 + i * 185, 112, 125, 32);
    }
    g.fillStyle(0x6d4936);
    g.fillRect(430, 285, 130, 45);
    g.fillStyle(0x526f8b);
    g.fillRect(445, 270, 100, 15);
  } else if (type === 'garage') {
    g.fillStyle(0x4c555b);
    g.fillRect(70, 70, 500, 20);
    g.fillStyle(0x8d969b);
    g.fillRect(105, 300, 430, 35);
    g.fillStyle(0xd3a34d);
    g.fillRect(120, 280, 70, 20);
    g.fillRect(450, 280, 70, 20);
  }

  g.fillStyle(0x26343c);
  g.fillRect(285, 410, 70, 46);
  g.fillStyle(0x9b7655);
  g.fillRect(291, 414, 58, 42);
  g.fillStyle(0xe5c477);
  g.fillCircle(340, 436, 3);

  objects.push(scene.add.text(320, 55, room[0], {
    fontFamily: 'Arial',
    fontSize: '20px',
    fontStyle: 'bold',
    color: '#ffffff',
    backgroundColor: '#26333ddd',
    padding: { x: 12, y: 8 }
  }).setOrigin(0.5).setDepth(5));

  objects.push(scene.add.text(320, 465, 'E — ВЫЙТИ НА УЛИЦУ', {
    fontFamily: 'Arial',
    fontSize: '12px',
    fontStyle: 'bold',
    color: '#ffffff',
    backgroundColor: '#26333ddd',
    padding: { x: 9, y: 6 }
  }).setOrigin(0.5).setDepth(5));

  return objects;
}
"""

interior_path = root / "src/interior.js"
interior_path.write_text(interior)

if "import { drawInterior } from './interior.js';" not in game:
    game = game.replace(
        "import { drawCity } from './world.js';",
        "import { drawCity } from './world.js';\nimport { drawInterior } from './interior.js';"
    )

start = game.index("  interact() {")
end = game.index("\n  work() {", start)

replacement = """  interact() {
    if (this.inCar) { this.toggleCar(); return; }

    const px = this.player.x, py = this.player.y;

    if (this.insideBuilding) {
      if (this.insideBuildingType === 'work' &&
          Phaser.Math.Distance.Between(px, py, 500, 300) < 85) {
        this.work();
        return;
      }

      if (Phaser.Math.Distance.Between(px, py, 320, 420) < 65) {
        this.exitBuilding();
      } else {
        this.toast('Подойдите к двери или рабочему месту.');
      }
      return;
    }

    const building = this.cityBuildings.find(b => {
      const cx = Phaser.Math.Clamp(px, b.x, b.x + b.w);
      const cy = Phaser.Math.Clamp(py, b.y, b.y + b.h);
      return Phaser.Math.Distance.Between(px, py, cx, cy) < 52;
    });

    if (building) {
      this.enterBuilding(building);
      return;
    }

    const npc = this.npcs.find(n => Phaser.Math.Distance.Between(px, py, n.x, n.y) < 45);
    if (npc) { this.toast(`${npc.npcName}: Привет! Хорошего дня.`); return; }

    if (Phaser.Math.Distance.Between(px, py, this.car.x, this.car.y) < 65) {
      this.toggleCar();
      return;
    }

    this.toast('Поблизости нечего использовать.');
  }

  enterBuilding(building) {
    if (this.inCar || this.insideBuilding) return;

    this.insideBuilding = true;
    this.insideBuildingType = building.type;
    this.exteriorPosition = { x: this.player.x, y: this.player.y };

    this.exteriorObjects = this.children.list.map(object => ({
      object,
      visible: object.visible
    }));

    for (const item of this.exteriorObjects) {
      item.object.setVisible(false);
    }

    this.interiorObjects = drawInterior(this, building.type);

    this.physics.world.setBounds(0, 0, 640, 480);
    this.cameras.main.stopFollow();
    this.cameras.main.setBounds(0, 0, 640, 480);
    this.cameras.main.centerOn(320, 240);

    this.player.setPosition(320, 375);
    this.player.setVelocity(0, 0);
    this.player.setVisible(true);
    this.player.setDepth(10);

    this.toast('Вы вошли: ' + building.type);
  }

  exitBuilding() {
    if (!this.insideBuilding) return;

    this.insideBuilding = false;
    this.insideBuildingType = null;

    for (const object of this.interiorObjects || []) object.destroy();
    this.interiorObjects = [];

    for (const item of this.exteriorObjects || []) {
      if (item.object && item.object.active) {
        item.object.setVisible(item.visible);
      }
    }
    this.exteriorObjects = [];

    this.physics.world.setBounds(0, 0, 1600, 1200);
    this.cameras.main.setBounds(0, 0, 1600, 1200);

    this.player.setPosition(this.exteriorPosition.x, this.exteriorPosition.y);
    this.player.setVelocity(0, 0);
    this.player.setVisible(true);

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    this.persist();
    this.toast('Вы вышли на улицу.');
  }
"""

game = game[:start] + replacement + game[end:]

if "if (this.insideBuilding) return;" not in game:
    game = game.replace(
        "  persist() {",
        "  persist() {\n    if (this.insideBuilding) return;"
    )

game_path.write_text(game)

print("Интерьеры установлены.")
print("Создан src/interior.js")
print("Обновлён src/game.js")

