import Phaser from 'phaser';
import { CityScene } from './game.js';
import { loadSave, saveGame } from './save.js';
import './style.css';

const menu = document.getElementById('menu');
const hud = document.getElementById('hud');
const pausePanel = document.getElementById('pause-panel');
const nameInput = document.getElementById('player-name');
const message = document.getElementById('menu-message');
let game = null;
let currentScene = null;
let currentSave = null;

const savedName = localStorage.getItem('life-simulator-name');
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
  scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH }
};

function startOffline() {
  const name = nameInput.value.trim().slice(0, 16) || 'Игрок';
  localStorage.setItem('life-simulator-name', name);
  currentSave = loadSave(name);
  saveGame(currentSave);
  menu.classList.add('hidden');
  hud.classList.remove('hidden');
  pausePanel.classList.add('hidden');

  window.__CITYLIFE_SAVE = currentSave;
  if (!game) {
    // Phaser automatically starts the configured CityScene. The save is
    // supplied through the global before Phaser boots to avoid a race.
    game = new Phaser.Game(config);
    setTimeout(bindScene, 150);
  } else {
    game.scene.start('City', { saveData: currentSave });
    setTimeout(bindScene, 50);
  }
}

function bindScene() {
  currentScene = game?.scene.getScene('City');
  if (!currentScene) return;
  currentScene.events.off('pause-request');
  currentScene.events.on('pause-request', pauseGame);
}

function pauseGame() {
  if (!game || !currentScene) return;
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
  currentScene?.persist();
  message.textContent = 'Игра сохранена.';
  currentScene?.toast('Прогресс сохранён!');
});
document.getElementById('exit-btn').addEventListener('click', () => {
  currentScene?.persist();
  game?.destroy(true);
  game = null;
  currentScene = null;
  pausePanel.classList.add('hidden');
  hud.classList.add('hidden');
  menu.classList.remove('hidden');
});

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => console.warn('SW:', err));
  });
}
