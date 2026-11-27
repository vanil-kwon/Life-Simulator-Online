import Phaser from 'phaser';
import { drawCity } from './world.js';
import { drawInterior } from './interior.js';
import { saveGame } from './save.js';
import {
  WORLD_W, WORLD_H, INTERIOR_W, INTERIOR_H, SAVE_INTERVAL,
  CAR_MAX_FORWARD, CAR_MAX_REVERSE, CAR_ACCEL, CAR_STEER_RATE,
} from './constants.js';

export class CityScene extends Phaser.Scene {
  constructor() { super('City'); }

  init(data) { this.saveData = data?.saveData || window.__CITYLIFE_SAVE; }

  create() {
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    drawCity(this);

    // ---- PLAYER ----
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

    // ---- CAR (Arcade.Sprite) ----
    this.createCarSprite();

    // ---- COLLIDERS ----
    if (this.worldWalls) {
      this.worldPlayerCollider = this.physics.add.collider(this.player, this.worldWalls);
      this.worldCarCollider = this.physics.add.collider(this.car, this.worldWalls);
    }
    this.playerCarCollider = this.physics.add.collider(this.player, this.car);

    // ---- NPC ----
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

    // ---- CAMERA ----
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(Math.min(1.25, Math.max(0.85, window.innerWidth / 520)));

    // ---- KEYBOARD ----
    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,SPACE,ESC');
    this._onInteract = () => this.interact();
    this._onPause = () => this.events.emit('pause-request');
    this.input.keyboard.on('keydown-E', this._onInteract);
    this.input.keyboard.on('keydown-SPACE', this._onInteract);
    this.input.keyboard.on('keydown-ESC', this._onPause);

    // ---- STATE ----
    this.inCar = Boolean(this.saveData.vehicle.inUse);
    if (this.inCar) {
      this.player.body.enable = false;
      this.player.setVisible(false);
      this.player.setPosition(this.car.x, this.car.y);
      this.cameras.main.startFollow(this.car, true, 0.08, 0.08);
    }
    this.carSpeed = 0;
    this.joystick = { x: 0, y: 0 };
    this.driveInput = { gas: false, brake: false };
    this.updateControlsMode();
    this.money = this.saveData.economy.money;
    this.lastSave = 0;
    this.toastTimer = null;
    this.toast('Добро пожаловать в Pixel City!');
    this.setupTouchControls();
    this.refreshHud();
    this.updateHint();
    this.updateControlsMode();
    this.restoreSavedInterior();

    this.events.once('shutdown', this.cleanup, this);
  }

  createCarSprite() {
    if (!this.textures.exists('car-pixel')) {
      const tex = this.textures.createCanvas('car-pixel', 48, 32);
      const ctx = tex.getContext();
      // Outline
      ctx.fillStyle = '#0d1a22';
      ctx.fillRect(1, 2, 46, 28);
      // Body
      ctx.fillStyle = '#4a9db5';
      ctx.fillRect(3, 4, 42, 24);
      // Rear window (left)
      ctx.fillStyle = '#1c2932';
      ctx.fillRect(6, 6, 8, 20);
      // Cabin window
      ctx.fillStyle = '#b8dce1';
      ctx.fillRect(16, 7, 14, 18);
      // Hood (right, darker)
      ctx.fillStyle = '#3a8299';
      ctx.fillRect(32, 6, 10, 20);
      // Headlights (right)
      ctx.fillStyle = '#f4e7a4';
      ctx.fillRect(43, 7, 3, 5);
      ctx.fillRect(43, 20, 3, 5);
      // Taillights (left)
      ctx.fillStyle = '#b54b45';
      ctx.fillRect(2, 7, 3, 5);
      ctx.fillRect(2, 20, 3, 5);
      tex.refresh();
    }

    this.car = this.physics.add.sprite(
      this.saveData.vehicle.x, this.saveData.vehicle.y, 'car-pixel'
    );
    this.car.rotation = this.saveData.vehicle.rotation || 0;
    this.car.setDepth(8);
    this.car.setCollideWorldBounds(true);
    this.car.body.setCircle(14, 10, 2);
    this.car.body.pushable = false;
  }

  cleanup() {
    if (this.toastTimer) { clearTimeout(this.toastTimer); this.toastTimer = null; }
    if (this.input && this.input.keyboard) {
      this.input.keyboard.off('keydown-E', this._onInteract);
      this.input.keyboard.off('keydown-SPACE', this._onInteract);
      this.input.keyboard.off('keydown-ESC', this._onPause);
    }
    const joy = document.getElementById('joystick');
    if (joy && joy._cityLifeCleanup) {
      joy._cityLifeCleanup();
      joy._cityLifeCleanup = null;
    }
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
    const gasButton = document.getElementById('gas-btn');
    const brakeButton = document.getElementById('brake-btn');
    const onInteract = () => this.interact();
    const onCar = () => this.toggleCar();
    const bindPedal = (button, inputName) => {
      if (!button) return () => {};
      const press = event => {
        event.preventDefault();
        button.setPointerCapture?.(event.pointerId);
        this.driveInput[inputName] = true;
        button.classList.add('pressed');
      };
      const release = () => {
        this.driveInput[inputName] = false;
        button.classList.remove('pressed');
      };
      button.addEventListener('pointerdown', press);
      button.addEventListener('pointerup', release);
      button.addEventListener('pointercancel', release);
      button.addEventListener('lostpointercapture', release);
      return () => {
        button.removeEventListener('pointerdown', press);
        button.removeEventListener('pointerup', release);
        button.removeEventListener('pointercancel', release);
        button.removeEventListener('lostpointercapture', release);
      };
    };
    const cleanupGas = bindPedal(gasButton, 'gas');
    const cleanupBrake = bindPedal(brakeButton, 'brake');
    const startPointer = e => { pointer = e.pointerId; joy.setPointerCapture(pointer); update(e); };
    const movePointer = e => { if (e.pointerId === pointer) update(e); };
    joy.addEventListener('pointerdown', startPointer);
    joy.addEventListener('pointermove', movePointer);
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
      cleanupGas();
      cleanupBrake();
    };
  }

  update(time, delta) {
    if (!this.player || this.scene.isPaused()) return;
    const dt = delta / 1000;

    if (this.inCar) {
      this.updateCar(dt);
    } else {
      const speed = 145;
      let x = this.joystick.x, y = this.joystick.y;
      if (this.keys.A.isDown || this.keys.LEFT.isDown) x -= 1;
      if (this.keys.D.isDown || this.keys.RIGHT.isDown) x += 1;
      if (this.keys.W.isDown || this.keys.UP.isDown) y -= 1;
      if (this.keys.S.isDown || this.keys.DOWN.isDown) y += 1;
      const length = Math.hypot(x, y);
      if (length > 1) { x /= length; y /= length; }
      this.player.setVelocity(x * speed, y * speed);
      if (Math.abs(x) + Math.abs(y) > 0.05) {
        this.saveData.player.direction = Math.abs(x) > Math.abs(y)
          ? (x > 0 ? 'right' : 'left')
          : (y > 0 ? 'down' : 'up');
      }
    }

    // Y-sort (только в городе)
    if (!this.insideBuilding) {
      this.player.setDepth(this.player.y);
      if (this.car) this.car.setDepth(this.car.y);
      for (const npc of this.npcs) npc.setDepth(npc.y);
    }

    if (time - this.lastSave > SAVE_INTERVAL) {
      this.persist();
      this.lastSave = time;
    }
  }

  updateCar(dt) {
    // Отдельные педали на экране + привычное управление клавиатурой.
    const keyGas = this.keys.W.isDown || this.keys.UP.isDown;
    const keyBrake = this.keys.S.isDown || this.keys.DOWN.isDown;
    let keySteer = 0;
    if (this.keys.D.isDown || this.keys.RIGHT.isDown) keySteer += 1;
    if (this.keys.A.isDown || this.keys.LEFT.isDown) keySteer -= 1;

    const gas = this.driveInput.gas || keyGas;
    const brake = this.driveInput.brake || keyBrake;
    const steer = Phaser.Math.Clamp(keySteer + this.joystick.x, -1, 1);

    if (gas && !brake) {
      this.carSpeed += CAR_ACCEL * dt;
    } else if (brake) {
      // Педаль тормоза гасит скорость, не переключая машину резко на задний ход.
      this.carSpeed = Phaser.Math.Linear(this.carSpeed, 0, Math.min(1, 8 * dt));
    } else {
      this.carSpeed *= Math.pow(0.42, dt);
    }
    this.carSpeed = Phaser.Math.Clamp(this.carSpeed, 0, CAR_MAX_FORWARD);

    // Руль: пропорционален скорости, инвертируется при движении назад
    const speedFactor = Phaser.Math.Clamp(Math.abs(this.carSpeed) / 80, 0, 1);
    if (Math.abs(this.carSpeed) > 5 && Math.abs(steer) > 0.1) {
      const sign = this.carSpeed >= 0 ? 1 : -1;
      this.car.rotation += steer * CAR_STEER_RATE * speedFactor * sign * dt;
    }

    // Едем в направлении носа
    this.car.body.setVelocity(
      Math.cos(this.car.rotation) * this.carSpeed,
      Math.sin(this.car.rotation) * this.carSpeed
    );

    // Синхронизация игрока (для сейва и будущих проверок)
    this.player.setPosition(this.car.x, this.car.y);
  }

  interact() {
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
    if (building) { this.enterBuilding(building); return; }

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

    // Город скрывается, но его тела остаются в Arcade Physics.
    // Отключаем все внешние столкновения и сам автомобиль на время интерьера.
    if (this.worldPlayerCollider) this.worldPlayerCollider.active = false;
    if (this.worldCarCollider) this.worldCarCollider.active = false;
    if (this.playerCarCollider) this.playerCarCollider.active = false;
    this.car.body.setVelocity(0, 0);
    this.car.body.enable = false;

    this.insideBuilding = true;
    this.insideBuildingType = building.type;
    this.exteriorPosition = { x: this.player.x, y: this.player.y };

    this.exteriorObjects = this.children.list.map(object => ({
      object,
      visible: object.visible
    }));
    for (const item of this.exteriorObjects) item.object.setVisible(false);

    this.interiorObjects = drawInterior(this, building.type);

    this.interiorWalls = this.physics.add.staticGroup();
    const addBlock = (x, y, w, h) => {
      const block = this.add.rectangle(x, y, w, h, 0x000000, 0);
      this.interiorWalls.add(block);
      block.body.updateFromGameObject();
    };
    addBlock(320, 8, 640, 16);
    addBlock(8, 240, 16, 480);
    addBlock(632, 240, 16, 480);
    addBlock(151, 466, 266, 16);
    addBlock(489, 466, 266, 16);

    const furnitureBlocks = {
      shop: [[320, 102, 510, 35], [320, 184, 500, 18], [320, 279, 500, 18]],
      cafe: [[165, 107, 190, 45], [162, 252, 35, 35], [512, 252, 35, 35], [162, 362, 35, 35], [512, 362, 35, 35]],
      dealer: [[320, 192, 170, 95], [320, 310, 490, 20]],
      home: [[180, 142, 210, 95], [470, 135, 160, 100]],
      work: [[137, 132, 145, 55], [322, 132, 145, 55], [507, 132, 145, 55], [495, 307, 130, 45]],
      garage: [[320, 80, 500, 20], [320, 317, 430, 35]]
    };
    for (const [x, y, w, h] of furnitureBlocks[building.type] || []) {
      addBlock(x, y, w, h);
    }

    this.interiorCollider = this.physics.add.collider(this.player, this.interiorWalls);

    this.physics.world.setBounds(0, 0, INTERIOR_W, INTERIOR_H);
    this.cameras.main.stopFollow();
    this.cameras.main.setBounds(0, 0, INTERIOR_W, INTERIOR_H);
    this.cameras.main.centerOn(INTERIOR_W / 2, INTERIOR_H / 2);

    this.player.setPosition(320, 375);
    this.player.setVelocity(0, 0);
    this.player.setVisible(true);
    this.player.setDepth(10);

    this.toast('Вы вошли: ' + building.type);
    this.persist({ force: true });
  }

  restoreSavedInterior() {
    const saved = this.saveData?.inside;
    if (!saved || typeof saved !== 'object') return;

    const building = this.cityBuildings.find(item => item.type === saved.type);
    if (!building) {
      this.saveData.inside = null;
      return;
    }

    const exteriorX = Number.isFinite(saved.exteriorX) ? saved.exteriorX : this.player.x;
    const exteriorY = Number.isFinite(saved.exteriorY) ? saved.exteriorY : this.player.y;
    this.player.setPosition(exteriorX, exteriorY);
    this.enterBuilding(building);

    const interiorX = Number.isFinite(saved.interiorX) ? saved.interiorX : 320;
    const interiorY = Number.isFinite(saved.interiorY) ? saved.interiorY : 375;
    this.player.setPosition(
      Phaser.Math.Clamp(interiorX, 24, INTERIOR_W - 24),
      Phaser.Math.Clamp(interiorY, 40, INTERIOR_H - 36)
    );

    // Защита старых/повреждённых сохранений с координатами внутри мебели.
    if (this.physics.overlap(this.player, this.interiorWalls)) {
      this.player.setPosition(320, 375);
    }
    this.persist({ force: true });
  }

  exitBuilding() {
    if (!this.insideBuilding) return;

    this.insideBuilding = false;
    this.insideBuildingType = null;

    for (const object of this.interiorObjects || []) object.destroy();
    this.interiorObjects = [];

    for (const item of this.exteriorObjects || []) {
      if (item.object && item.object.active) item.object.setVisible(item.visible);
    }
    this.exteriorObjects = [];

    if (this.interiorCollider) { this.interiorCollider.destroy(); this.interiorCollider = null; }
    if (this.interiorWalls) { this.interiorWalls.clear(true, true); this.interiorWalls = null; }

    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

    // Сначала возвращаем городские границы, затем включаем тела автомобиля.
    this.car.body.enable = true;
    if (this.worldPlayerCollider) this.worldPlayerCollider.active = true;
    if (this.worldCarCollider) this.worldCarCollider.active = true;
    if (this.playerCarCollider) this.playerCarCollider.active = true;

    this.player.setPosition(this.exteriorPosition.x, this.exteriorPosition.y);
    this.player.setVelocity(0, 0);
    this.player.setVisible(true);

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    this.persist();
    this.toast('Вы вышли на улицу.');
  }

  work() {
    this.money += 150;
    this.saveData.economy.money = this.money;
    this.refreshHud();
    this.toast('Смена завершена! Вы заработали $150.');
    this.persist({ force: true });
  }

  toggleCar() {
    if (!this.inCar && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.car.x, this.car.y) > 90) {
      this.toast('Подойдите ближе к автомобилю.'); return;
    }
    this.inCar = !this.inCar;

    if (this.inCar) {
      this.player.body.enable = false;
      this.player.setVisible(false);
      this.player.setPosition(this.car.x, this.car.y);
      this.carSpeed = 0;
      this.car.body.setVelocity(0, 0);
      this.cameras.main.startFollow(this.car, true, 0.08, 0.08);
      this.toast('Вы сели в City Compact. W/S — газ, A/D — руль.');
    } else {
      this.carSpeed = 0;
      this.car.body.setVelocity(0, 0);

      const candidates = [
        { x: this.car.x + 46, y: this.car.y },
        { x: this.car.x - 46, y: this.car.y },
        { x: this.car.x,      y: this.car.y + 46 },
        { x: this.car.x,      y: this.car.y - 46 },
      ];
      let spawn = candidates[0];
      for (const c of candidates) {
        const hits = this.physics.overlapRect(c.x - 7, c.y - 9, 14, 18);
        if (!hits.length) { spawn = c; break; }
      }
      this.player.body.enable = true;
      this.player.setVisible(true);
      this.player.setPosition(spawn.x, spawn.y);
      this.player.setVelocity(0, 0);
      this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
      this.toast('Вы вышли из автомобиля.');
    }
    this.updateHint();
    this.updateControlsMode();
    this.driveInput.gas = false;
    this.driveInput.brake = false;
    this.persist();
  }

  updateControlsMode() {
    const hud = document.getElementById('hud');
    const carButton = document.getElementById('car-btn');
    if (hud) hud.classList.toggle('driving', Boolean(this.inCar));
    if (carButton) {
      carButton.innerHTML = this.inCar
        ? 'EXIT<br><small>ВЫЙТИ</small>'
        : 'CAR<br><small>МАШИНА</small>';
    }
  }

  updateHint() {
    const hint = document.getElementById('control-hint');
    if (!hint) return;
    hint.textContent = this.inCar
      ? '◀ ▶ / джойстик — руль · педали — газ и тормоз · E — выйти'
      : 'WASD / стрелки — движение · E — действие';
  }

  refreshHud() {
    const nameEl = document.getElementById('hud-name');
    const moneyEl = document.getElementById('hud-money');
    const dayEl = document.getElementById('hud-day');
    if (nameEl) nameEl.textContent = this.saveData.player.name;
    if (moneyEl) moneyEl.textContent = '$' + this.money.toLocaleString('ru-RU');
    if (dayEl) dayEl.textContent = this.saveData.world.day;
  }

  toast(message) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
  }

  persist(options = {}) {
    if (this.insideBuilding) {
      this.saveData.inside = {
        type: this.insideBuildingType,
        exteriorX: this.exteriorPosition?.x ?? this.saveData.player.x,
        exteriorY: this.exteriorPosition?.y ?? this.saveData.player.y,
        interiorX: this.player.x,
        interiorY: this.player.y,
      };
    } else {
      this.saveData.inside = null;
      if (this.inCar) {
        this.saveData.player.x = this.car.x;
        this.saveData.player.y = this.car.y;
      } else {
        this.saveData.player.x = this.player.x;
        this.saveData.player.y = this.player.y;
      }
    }

    this.saveData.vehicle.x = this.car.x;
    this.saveData.vehicle.y = this.car.y;
    this.saveData.vehicle.rotation = this.car.rotation;
    this.saveData.vehicle.inUse = this.inCar;
    this.saveData.economy.money = this.money;
    saveGame(this.saveData);
  }
}
