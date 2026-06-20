// main.js - HUYVERSE ARENA — 3 Maps, No Terminal

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let running = false;
let animFrameId = null;
window.animFrameId = null;

const camX = 0, camY = 0;

function toggleMuteGame() {
  if (typeof AudioManager === 'undefined') return;
  const muted = AudioManager.toggleMute();
  const btn = document.getElementById("muteBtn");
  if (btn) btn.textContent = muted ? "🔇" : "🔊";
}
window.toggleMuteGame = toggleMuteGame;

function startGame() {
  const goScreen = document.getElementById("gameOverScreen");
  if (goScreen) {
    goScreen.classList.remove("visible");
    goScreen.style.display = "none";
  }

  running = false;
  window.running = false;
  window._gameOverActive = false;
  if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; window.animFrameId = null; }

  if (typeof AudioManager !== 'undefined') AudioManager.init();

  // initMaps TRƯỚC để currentMapIndex local = 0 trước khi resetGame chạy
  if (typeof initMaps === 'function') initMaps();
  resetGame();

  // Đảm bảo enemies/boss sạch hoàn toàn (double-check sau resetGame)
  if (window.enemies) window.enemies.length = 0;
  if (typeof resetBoss === 'function') resetBoss();
  else window.boss = null;

  const sp0 = (typeof MAP_SPAWN_POINTS !== 'undefined') ? MAP_SPAWN_POINTS[0] : { x: 488, y: 356 };
  window.player = new Player(sp0.x, sp0.y);

  window._reportOpen = false;
  if (typeof closePortfolioReport === 'function') closePortfolioReport();

  document.getElementById("screen").style.display = "none";
  running = true;
  window.running = true;

  // Spawn HP items trên map đầu tiên
  if (typeof spawnMapHpItems === 'function') spawnMapHpItems(0, 3);

  loop();
}

function loop() {
  if (!running || window._gameOverActive) {
    if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; window.animFrameId = null; }
    return;
  }
  animFrameId = requestAnimationFrame(loop);
  window.animFrameId = animFrameId;
  update();
  if (!window._gameOverActive) render();
}

function update() {
  if (window._gameOverActive) return;
  const zonePanelOpen = document.getElementById("zonePanel")?.style.display === "flex";
  if (window._reportOpen || zonePanelOpen) return;

  if (window.player && !window._gameOverActive) {
    window.player.update(input);
    if (input.blade) window.player.bladeAttack();
    if (input.gun) window.player.gunAttack(input);
    if (input.dash) window.player.dash();
    if (input.hack) window.player.hack();
    if (input.power) { window.player.fireExplosive(); input.power = false; }

    updateItems(window.player);
    checkChestPickup(window.player);

    if (typeof checkZoneTriggers === 'function') checkZoneTriggers(window.player);
  }

  if (typeof updateScreenShake === 'function') updateScreenShake();
  if (typeof updateEnemies === 'function') updateEnemies(window.player);
  if (typeof updateBoss === 'function') updateBoss(window.player);

  const currentEnemies = window.enemies || [];
  const currentBoss = window.boss || null;
  if (typeof updateBullets === 'function') updateBullets(currentEnemies, currentBoss);
  if (typeof updateParticles === 'function') updateParticles();
}

function render() {
  if (window._gameOverActive) return;
  let sX = typeof shakeX !== 'undefined' ? shakeX : 0;
  let sY = typeof shakeY !== 'undefined' ? shakeY : 0;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(sX, sY);

  if (typeof drawMap === 'function') drawMap(ctx);
  if (gameState.items) gameState.items.forEach(item => drawHpItem(ctx, item));
  drawChest(ctx);
  if (window.player) window.player.draw(ctx);
  if (typeof drawEnemies === 'function') drawEnemies(ctx);
  if (typeof drawBoss === 'function') drawBoss(ctx);
  if (typeof drawBullets === 'function') drawBullets(ctx);
  if (typeof drawParticles === 'function') drawParticles(ctx);

  ctx.restore();

  if (typeof drawHUD === 'function') drawHUD(ctx, gameState);
  if (typeof drawMapNameHUD === 'function') drawMapNameHUD(ctx);
  if (typeof updateWaveDisplay === 'function') updateWaveDisplay();
}