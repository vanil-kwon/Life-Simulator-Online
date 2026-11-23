import Phaser from 'phaser';
import { CityScene } from './game.js';
import { loadSave, saveGame, NAME_KEY } from './save.js';
import './style.css';

const menu = document.getElementById('menu');
const hud = document.getElementById('hud');
const pausePanel = document.getElementById('pause-panel');
const nameInput = document.getElementById('player-name');
const message = document.getElementById('menu-message');

let game = null;
let currentScene = null;
let currentSave = null;

const savedName = localStorage.getItem(NAME_KEY);
if (savedName) nameInput.value = savedName;

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#527b55',
  pixelArt: true,
  antialias: false,
  physics: { default: 'arcade', arcade: { debug: false } },
  scene: [CityScene],
  scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
};

function bindWhenReady(attempts = 0) {
  if (!game) return;
  const scene = game.scene.getScene('City');
  if (scene && scene.scene.isActive()) {
    bindScene(scene);
    return;
  }
  if (attempts > 100) {
    console.warn('[LifeSim] CityScene не готова за 3 секунды');
    return;
  }
  setTimeout(() => bindWhenReady(attempts + 1), 30);
}

function bindScene(scene) {
  currentScene = scene;
  currentScene.events.off('pause-request');
  currentScene.events.on('pause-request', pauseGame);
}

function startOffline() {
  const name = nameInput.value.trim().slice(0, 16) || 'Игрок';
  localStorage.setItem(NAME_KEY, name);
  currentSave = loadSave(name);
  saveGame(currentSave);

  menu.classList.add('hidden');
  hud.classList.remove('hidden');
  pausePanel.classList.add('hidden');
  window.__CITYLIFE_SAVE = currentSave;

  if (!game) {
    game = new Phaser.Game(config);
    bindWhenReady();
  } else {
    game.scene.start('City', { saveData: currentSave });
    bindWhenReady();
  }
}

function pauseGame() {
  if (!game || !currentScene) return;
  if (currentScene.scene.isPaused()) return;
  currentScene.scene.pause();
  pausePanel.classList.remove('hidden');
}

function resumeGame() {
  pausePanel.classList.add('hidden');
  currentScene?.scene.resume();
}

document.getElementById('offline-btn').addEventListener('click', startOffline);
document.getElementById('online-btn').addEventListener('click', () => {
  message.textContent = 'Онлайн-режим появится в следующих обновлениях. Офлайн уже доступен!';
});
document.getElementById('menu-btn').addEventListener('click', pauseGame);
document.getElementById('resume-btn').addEventListener('click', resumeGame);
document.getElementById('save-btn').addEventListener('click', () => {
  currentScene?.persist({ force: true });
  currentScene?.toast('Прогресс сохранён!');
});
document.getElementById('exit-btn').addEventListener('click', () => {
  currentScene?.persist({ force: true });
  game?.destroy(true);
  game = null;
  currentScene = null;
  pausePanel.classList.add('hidden');
  hud.classList.add('hidden');
  menu.classList.remove('hidden');
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && currentScene) {
    currentScene.persist({ force: true });
  }
});
window.addEventListener('pagehide', () => {
  currentScene?.persist({ force: true });
});

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  import('virtual:pwa-register')
    .then(({ registerSW }) => registerSW({ immediate: true }))
    .catch((err) => console.warn('[PWA]', err));
}
