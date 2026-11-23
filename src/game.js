import Phaser from 'phaser';
import { drawCity } from './world.js';
import { saveGame } from './save.js';

export class CityScene extends Phaser.Scene {
  constructor() { super('City'); }

  init(data) { this.saveData = data?.saveData || window.__CITYLIFE_SAVE; }

  create() {
    this.physics.world.setBounds(0, 0, 1600, 1200);
    drawCity(this);

    if (!this.textures.exists('player-pixel')) {
      const canvasTexture = this.textures.createCanvas('player-pixel', 24, 28);
      const ctx = canvasTexture.getContext();
      ctx.fillStyle = '#243747'; ctx.fillRect(3, 11, 18, 16);
      ctx.fillStyle = '#f0c49b'; ctx.fillRect(6, 1, 12, 12);
      ctx.fillStyle = '#49352f'; ctx.fillRect(6, 0, 12, 5);
      ctx.fillStyle = '#eff5ed'; ctx.fillRect(7, 15, 4, 8); ctx.fillRect(14, 15, 4, 8);
      canvasTexture.refresh();
    }
    this.player = this.physics.add.sprite(
      this.saveData.player.x, this.saveData.player.y, 'player-pixel'
    );
    this.player.setSize(14, 18);
    this.player.setOffset(5, 7);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);

    this.car = this.add.container(this.saveData.vehicle.x, this.saveData.vehicle.y);
    const carG = this.add.graphics();
    carG.fillStyle(0x1c2932); carG.fillRoundedRect(-17, -29, 34, 58, 7);
    carG.fillStyle(0x4a9db5); carG.fillRoundedRect(-13, -22, 26, 44, 5);
    carG.fillStyle(0xb8dce1); carG.fillRect(-10, -17, 20, 10);
    carG.fillStyle(0x20343d); carG.fillRect(-10, 3, 20, 10);
    carG.fillStyle(0xf4e7a4); carG.fillRect(-13, -27, 7, 3); carG.fillRect(6, -27, 7, 3);
    carG.fillStyle(0xb54b45); carG.fillRect(-13, 24, 7, 3); carG.fillRect(6, 24, 7, 3);
    this.car.add(carG);
    this.car.setDepth(8);
    this.car.setSize(34, 58);
    this.physics.add.existing(this.car);
    this.car.body.setSize(30, 50);
    this.car.body.setImmovable(true);

    this.npcs = [];
    for (const [x, y, color, name] of [
      [510, 310, 0xe2ad62, 'Сосед'], [930, 780, 0xb4a0dc, 'Пешеход'],
      [300, 760, 0x77b6a1, 'Работник']
    ]) {
      const npc = this.add.rectangle(x, y, 17, 23, color).setStrokeStyle(2, 0x28343b);
      npc.setDepth(9);
      npc.npcName = name;
      this.npcs.push(npc);
    }

    this.cameras.main.setBounds(0, 0, 1600, 1200);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(Math.min(1.25, Math.max(0.85, window.innerWidth / 520)));

    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,SPACE,ESC');
    this.input.keyboard.on('keydown-E', () => this.interact());
    this.input.keyboard.on('keydown-SPACE', () => this.interact());
    this.input.keyboard.on('keydown-ESC', () => this.events.emit('pause-request'));

    this.inCar = false;
    this.carSpeed = 0;
    this.joystick = { x: 0, y: 0 };
    this.money = this.saveData.economy.money;
    this.lastSave = 0;
    this.toast('Добро пожаловать в Pixel City!');
    this.setupTouchControls();
    this.refreshHud();
  }

  setupTouchControls() {
    const joy = document.getElementById('joystick');
    const stick = document.getElementById('stick');
    if (!joy) return;
    if (joy._cityLifeCleanup) joy._cityLifeCleanup();
    let pointer = null;
    const update = (event) => {
      const r = joy.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      let dx = event.clientX - cx, dy = event.clientY - cy;
      const max = r.width * 0.32;
      const len = Math.hypot(dx, dy);
      if (len > max) { dx = dx / len * max; dy = dy / len * max; }
      this.joystick.x = dx / max;
      this.joystick.y = dy / max;
      stick.style.transform = `translate(${dx}px, ${dy}px)`;
    };
    const end = e => {
      if (e.pointerId !== pointer) return;
      pointer = null; this.joystick.x = 0; this.joystick.y = 0;
      stick.style.transform = 'translate(0,0)';
    };
    const interactButton = document.getElementById('interact-btn');
    const carButton = document.getElementById('car-btn');
    const onInteract = () => this.interact();
    const onCar = () => this.toggleCar();
    joy.addEventListener('pointerup', end);
    joy.addEventListener('pointercancel', end);
    interactButton?.addEventListener('click', onInteract);
    carButton?.addEventListener('click', onCar);
    joy._cityLifeCleanup = () => {
      joy.removeEventListener('pointerdown', startPointer);
      joy.removeEventListener('pointermove', movePointer);
      joy.removeEventListener('pointerup', end);
      joy.removeEventListener('pointercancel', end);
      interactButton?.removeEventListener('click', onInteract);
      carButton?.removeEventListener('click', onCar);
    };
    function startPointer(e) { pointer = e.pointerId; joy.setPointerCapture(pointer); update(e); }
    function movePointer(e) { if (e.pointerId === pointer) update(e); }
    joy.addEventListener('pointerdown', startPointer);
    joy.addEventListener('pointermove', movePointer);
  }

  update(time, delta) {
    if (!this.player || this.scene.isPaused()) return;
    const speed = this.inCar ? 220 : 145;
    let x = this.joystick.x, y = this.joystick.y;
    if (this.keys.A.isDown || this.keys.LEFT.isDown) x -= 1;
    if (this.keys.D.isDown || this.keys.RIGHT.isDown) x += 1;
    if (this.keys.W.isDown || this.keys.UP.isDown) y -= 1;
    if (this.keys.S.isDown || this.keys.DOWN.isDown) y += 1;
    const length = Math.hypot(x, y);
    if (length > 1) { x /= length; y /= length; }

    if (this.inCar) {
      this.carSpeed = Phaser.Math.Linear(this.carSpeed, (y < 0 ? 1 : y > 0 ? -0.45 : 0) * speed, 0.045);
      this.car.x += x * this.carSpeed * delta / 1000;
      this.car.y -= this.carSpeed * delta / 1000;
      this.car.x = Phaser.Math.Clamp(this.car.x, 25, 1575);
      this.car.y = Phaser.Math.Clamp(this.car.y, 25, 1175);
      this.player.setPosition(this.car.x, this.car.y);
    } else {
      this.player.setVelocity(x * speed, y * speed);
      if (Math.abs(x) + Math.abs(y) > 0.05) {
        this.saveData.player.direction = Math.abs(x) > Math.abs(y) ? (x > 0 ? 'right' : 'left') : (y > 0 ? 'down' : 'up');
      }
    }

    if (time - this.lastSave > 12000) {
      this.persist();
      this.lastSave = time;
    }
  }

  interact() {
    if (this.inCar) { this.toggleCar(); return; }
    const px = this.player.x, py = this.player.y;
    const building = this.cityBuildings.find(b => {
      const cx = Phaser.Math.Clamp(px, b.x, b.x + b.w);
      const cy = Phaser.Math.Clamp(py, b.y, b.y + b.h);
      return Phaser.Math.Distance.Between(px, py, cx, cy) < 52;
    });
    if (building) {
      const actions = {
        shop: () => this.toast('Магазин скоро откроется.'),
        dealer: () => this.toast('Автосалон: новые автомобили скоро!'),
        cafe: () => this.toast('Кафе: кофе и отдых — скоро.'),
        home: () => this.toast('Это ваш будущий дом.'),
        work: () => this.work(),
        garage: () => this.toast('Гараж: ваш City Compact ждёт!')
      };
      actions[building.type]?.();
      return;
    }
    const npc = this.npcs.find(n => Phaser.Math.Distance.Between(px, py, n.x, n.y) < 45);
    if (npc) { this.toast(`${npc.npcName}: Привет! Хорошего дня.`); return; }
    if (Phaser.Math.Distance.Between(px, py, this.car.x, this.car.y) < 65) {
      this.toggleCar(); return;
    }
    this.toast('Поблизости нечего использовать.');
  }

  work() {
    this.money += 150;
    this.saveData.economy.money = this.money;
    this.refreshHud();
    this.toast('Смена завершена! Вы заработали $150.');
    this.persist();
  }

  toggleCar() {
    if (!this.inCar && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.car.x, this.car.y) > 90) {
      this.toast('Подойдите ближе к автомобилю.'); return;
    }
    this.inCar = !this.inCar;
    if (this.inCar) {
      this.player.setVisible(false);
      this.toast('Вы сели в City Compact. Джойстик управляет машиной.');
    } else {
      this.player.setVisible(true);
      this.player.setPosition(this.car.x + 42, this.car.y);
      this.toast('Вы вышли из автомобиля.');
    }
    this.persist();
  }

  refreshHud() {
    document.getElementById('hud-name').textContent = this.saveData.player.name;
    document.getElementById('hud-money').textContent = '$' + this.money.toLocaleString('ru-RU');
    document.getElementById('hud-day').textContent = this.saveData.world.day;
  }

  toast(message) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
  }

  persist() {
    if (this.inCar) {
      this.saveData.player.x = this.car.x;
      this.saveData.player.y = this.car.y;
    } else {
      this.saveData.player.x = this.player.x;
      this.saveData.player.y = this.player.y;
    }
    this.saveData.vehicle.x = this.car.x;
    this.saveData.vehicle.y = this.car.y;
    this.saveData.economy.money = this.money;
    saveGame(this.saveData);
  }
}
