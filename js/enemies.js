// ═══════════════════════════════════════════════════════════════════════════════
// ENEMIES MODULE — WAVE SYSTEM + RETALIATION AI
// Quái chia đợt (wave), chỉ phản công khi bị player tấn công
// ═══════════════════════════════════════════════════════════════════════════════

const ZONE_ENEMY_STYLES = [
  { fill: "#0033aa", stroke: "#00f0ff", eye: "#ffffff", shadow: "#00f0ff" },
  { fill: "#660066", stroke: "#ff00ff", eye: "#ffff00", shadow: "#ff00ff" },
  { fill: "#884400", stroke: "#ffaa00", eye: "#ffffff", shadow: "#ffaa00" },
  { fill: "#004422", stroke: "#00ff88", eye: "#00ffff", shadow: "#00ff88" },
];

// ── Wave System ────────────────────────────────────────────────────────────────
let currentWave = 0;
let totalWaves = 0;
let waveEnemyCounts = []; // số quái mỗi wave
let waveSpawned = false;
let waveCleared = false;
let waveDelay = 0;    // countdown frames giữa 2 wave

window.currentWave = currentWave;
window.totalWaves = totalWaves;

// Dùng window để boss.js có thể reset cùng flag
if (typeof window._zoneClearCalled === 'undefined') window._zoneClearCalled = false;

function resetWaveSystem() {
  currentWave = 0;
  totalWaves = 0;
  waveEnemyCounts = [];
  waveSpawned = false;
  waveCleared = false;
  waveDelay = 0;
  window._zoneClearCalled = false;
  // in-place clear để không tạo array mới (giữ ref đồng nhất)
  enemies.length = 0;
  window.enemies = enemies;
  window.currentWave = currentWave;
  window.totalWaves = totalWaves;
  // FIX: reset boss spawn flag để không bị sót sang game mới
  if (typeof gameState !== 'undefined') {
    gameState.zoneBossSpawned = false;
    gameState.bossActive = false;
    gameState.bossHp = 0;
    gameState.bossMaxHp = 0;
  }
}

// Gọi từ game-state.js khi enterZone
function initZoneWaves(zoneId) {
  const zone = ZONE_DATA[zoneId];
  const total = zone.guardianCount;

  // Chia thành 4 wave: 25% / 25% / 25% / 25%
  const w1 = Math.ceil(total * 0.25);
  const w2 = Math.ceil(total * 0.25);
  const w3 = Math.ceil(total * 0.25);
  const w4 = Math.max(1, total - w1 - w2 - w3);

  waveEnemyCounts = [w1, w2, w3, w4];
  totalWaves = 4;
  currentWave = 0;
  waveSpawned = false;
  waveCleared = false;
  waveDelay = 0;
  window._zoneClearCalled = false;  // FIX: phải dùng window ref, không phải local var
  enemies.length = 0; // BUG FIX: dùng .length = 0 thay vì = [] để giữ ref đồng nhất
  window.enemies = enemies;
  window.currentWave = currentWave;
  window.totalWaves = totalWaves;

  // Spawn wave đầu tiên ngay
  _spawnWaveEnemies(zoneId, 0);
}

function _spawnWaveEnemies(zoneId, waveIdx) {
  const count = waveEnemyCounts[waveIdx];
  const px = window.player ? window.player.x : MAP_WIDTH / 2;
  const py = window.player ? window.player.y : MAP_HEIGHT / 2;
  const zone = ZONE_DATA[zoneId];

  for (let i = 0; i < count; i++) {
    const pos = _getSafeSpawnPos(px, py);
    // Wave sau → nhiều elite hơn
    const eliteThresh = waveIdx === 0 ? 1.0 : (waveIdx === 1 ? 0.6 : (waveIdx === 2 ? 0.4 : 0.0));
    const type = (Math.random() > eliteThresh) ? "elite" : "grunt";
    const e = new Enemy(pos.x, pos.y, type, zoneId);

    // Wave đầu: quái ở trạng thái idle, chưa aggro
    // Wave sau (khi player đã mở đầu): quái aggro ngay
    e.aggroed = (waveIdx > 0);
    e.waitTimer = waveIdx === 0 ? (60 + i * 15) : 0; // wave đầu trễ nhẹ mỗi con

    enemies.push(e);
  }
  window.enemies = enemies;
  currentWave = waveIdx + 1;
  window.currentWave = currentWave;

  if (typeof showPopup === 'function') {
    showPopup(
      `⚔ WAVE ${currentWave} / ${totalWaves}`,
      `${count} kẻ thù xuất hiện!`
    );
  }
  if (typeof screenShake === 'function') screenShake(8);
}

function _getSafeSpawnPos(px, py) {
  const fullZone = { x: 80, y: 80, w: MAP_WIDTH - 160, h: MAP_HEIGHT - 160 };
  for (let attempt = 0; attempt < 80; attempt++) {
    const x = fullZone.x + Math.random() * fullZone.w;
    const y = fullZone.y + Math.random() * fullZone.h;
    if (checkObstacleCollision(x, y, 44, 52)) continue;
    if (Math.hypot(x - px, y - py) < 150) continue;
    return { x, y };
  }
  // Fallback: góc xa nhất so với player
  const candidates = [
    { x: 120, y: 120 }, { x: MAP_WIDTH - 164, y: 120 },
    { x: 120, y: MAP_HEIGHT - 172 }, { x: MAP_WIDTH - 164, y: MAP_HEIGHT - 172 }
  ];
  let best = candidates[0], bestDist = 0;
  for (const c of candidates) {
    const d = Math.hypot(c.x - px, c.y - py);
    if (d > bestDist) { bestDist = d; best = c; }
  }
  return best;
}

// ── Enemy Class ────────────────────────────────────────────────────────────────
class Enemy {
  constructor(x, y, type = "grunt", zoneId = 0) {
    this.x = x; this.y = y;
    this.w = 44; this.h = 52;
    this.zoneId = zoneId;
    this.type = type;

    this.speed = type === "grunt" ? 2.5 : 3.2;
    this.hp = type === "grunt" ? 70 : 140;
    this.maxHp = this.hp;
    this.dead = false;
    this.frame = 0;
    this.vx = 0; this.vy = 0;

    // ── Trạng thái AI ────────────────────────────────────────────────────────
    // aggroed: đã bị player tấn công, chủ động đuổi & phản công
    // waitTimer: thời gian đứng yên ban đầu (wave 1)
    this.aggroed = false;
    this.waitTimer = 0;

    // Bộ đếm hồi chiêu
    this.shootCd = 0;
    this.meleeCd = 0;

    // Rage: bị tấn công nhiều → tăng speed
    this.rageStacks = 0;

    // Anti-stuck
    this._stuckTimer = 0;
    this._lastX = x;
    this._lastY = y;
    this._wanderAngle = Math.random() * Math.PI * 2;
    this._wanderTimer = 0;

    // Blink khi bị hit
    this._hitFlash = 0;
  }

  // ── Nhận sát thương ──────────────────────────────────────────────────────────
  takeDamage(amount) {
    this.hp -= amount;
    this._hitFlash = 8;

    if (amount >= 5 && typeof spawnParticles === 'function')
      spawnParticles(this.x + this.w / 2, this.y + this.h / 2, "blood", 4);

    // Quan trọng: bị hit → aggro ngay lập tức
    this.aggroed = true;
    this.waitTimer = 0;

    // Tích rage stack → tăng tốc độ nhẹ
    if (this.rageStacks < 3) {
      this.rageStacks++;
      this.speed = (this.type === "grunt" ? 2.5 : 3.2) + this.rageStacks * 0.3;
    }

    if (this.hp <= 0 && !this.dead) this.die();
  }

  die() {
    this.dead = true;
    if (typeof addKill === 'function') addKill();
    if (typeof spawnParticles === 'function')
      spawnParticles(this.x + this.w / 2, this.y + this.h / 2, "explosion", 10);
  }

  // ── Update AI ─────────────────────────────────────────────────────────────────
  update(player) {
    if (this.dead || !player || window._gameOverActive) return;

    // Countdown cooldowns
    if (this.shootCd > 0) this.shootCd--;
    if (this.meleeCd > 0) this.meleeCd--;
    if (this._hitFlash > 0) this._hitFlash--;

    // Chờ wave delay
    if (this.waitTimer > 0) {
      this.waitTimer--;
      this.frame += 0.05; // idle sway nhẹ
      return;
    }

    const cx = this.x + this.w / 2, cy = this.y + this.h / 2;
    const px = player.x + player.w / 2, py = player.y + player.h / 2;
    const distToPlayer = Math.hypot(cx - px, cy - py);

    // ── Nếu chưa aggro: đứng idle, patrol ngắn ───────────────────────────────
    if (!this.aggroed) {
      // Aggro tự động khi player đến rất gần (detection range nhỏ hơn)
      if (distToPlayer < 90) {
        this.aggroed = true;
      } else {
        // Patrol ngẫu nhiên nhẹ
        this._wanderTimer--;
        if (this._wanderTimer <= 0) {
          this._wanderAngle += (Math.random() - 0.5) * Math.PI;
          this._wanderTimer = 40 + Math.floor(Math.random() * 40);
        }
        const wx = Math.cos(this._wanderAngle) * 1.2;
        const wy = Math.sin(this._wanderAngle) * 1.2;
        this._tryMove(wx, wy);
        this.frame += 0.08;
        return;
      }
    }

    // ── Chế độ aggro: đuổi player + phản công ─────────────────────────────────
    let dx = px - cx, dy = py - cy;
    const len = Math.hypot(dx, dy);
    if (len > 0) { dx /= len; dy /= len; }

    // Anti-stuck wandering
    const moved = Math.hypot(this.x - this._lastX, this.y - this._lastY);
    if (moved < 0.4) {
      this._stuckTimer++;
    } else {
      this._stuckTimer = Math.max(0, this._stuckTimer - 2);
    }
    this._lastX = this.x; this._lastY = this.y;

    if (this._stuckTimer > 15) {
      this._wanderAngle += (Math.random() - 0.5) * 1.8;
      this._wanderTimer = 25;
      this._stuckTimer = 0;
    }
    if (this._wanderTimer > 0) {
      this._wanderTimer--;
      dx = Math.cos(this._wanderAngle) * 0.7 + dx * 0.3;
      dy = Math.sin(this._wanderAngle) * 0.7 + dy * 0.3;
      const wl = Math.hypot(dx, dy);
      if (wl > 0) { dx /= wl; dy /= wl; }
    }

    // PERF FIX: 8 hướng bình thường, 16 hướng chỉ khi bị stuck
    // Giảm 50% lần gọi checkObstacleCollision trong trường hợp thông thường
    const dirs = this._stuckTimer > 5 ? 16 : 8;
    let bestScore = -Infinity;
    let bestDx = dx, bestDy = dy;
    for (let i = 0; i < dirs; i++) {
      const angle = (i / dirs) * Math.PI * 2;
      const pdx = Math.cos(angle), pdy = Math.sin(angle);
      const probe = this.speed * 9;
      const nx = this.x + pdx * probe, ny = this.y + pdy * probe;
      const blocked = checkObstacleCollision(nx, ny, this.w, this.h)
        || nx < 20 || ny < 20
        || nx + this.w > MAP_WIDTH - 20
        || ny + this.h > MAP_HEIGHT - 20;
      let score = pdx * dx + pdy * dy;
      if (blocked) score -= 14;
      if (this._stuckTimer > 5) score += (Math.random() - 0.5) * 2;
      if (score > bestScore) { bestScore = score; bestDx = pdx; bestDy = pdy; }
    }

    const accel = 0.18;
    this.vx = this.vx * (1 - accel) + bestDx * this.speed * accel;
    this.vy = this.vy * (1 - accel) + bestDy * this.speed * accel;
    const spd = Math.hypot(this.vx, this.vy);
    if (spd > this.speed) { this.vx = this.vx / spd * this.speed; this.vy = this.vy / spd * this.speed; }

    this._tryMove(this.vx, this.vy);

    if (checkObstacleCollision(this.x, this.y, this.w, this.h)) this._forceUnstuck();

    this.frame += 0.12;

    // ── Phản công: chỉ khi đã aggro ───────────────────────────────────────────

    // Tấn công cận chiến (tiếp xúc)
    if (distToPlayer < 36 && this.meleeCd <= 0) {
      const p = window.player;
      // FIX: không gây damage khi player đang i-frames
      if (!p || p.iframes <= 0) {
        if (typeof takeDamage === 'function') takeDamage(10);
        if (p) p.iframes = 22; // i-frames dài hơn sau melee
      }
      this.meleeCd = 40;
      if (typeof spawnParticles === 'function')
        spawnParticles(px, py, "blood", 3);
    }

    // Bắn đạn từ xa (chỉ elite, và grunt ở wave cuối)
    const canShoot = this.type === "elite"
      || (this.type === "grunt" && this.rageStacks >= 2);

    if (canShoot && distToPlayer > 80 && distToPlayer < 380 && this.shootCd <= 0) {
      if (typeof spawnEnemyBullet === 'function')
        spawnEnemyBullet(cx, cy, px, py);
      this.shootCd = this.type === "elite" ? 55 : 90;
    }

    // Damage khi đụng chạm — dùng meleeCd để tránh gọi takeDamage mỗi frame
    // (takeDamage(0.3) mỗi frame = 18 damage/s nhưng gây updateHPBar liên tục → lag)
    // Đã được xử lý bởi melee attack ở trên (distToPlayer < 36), bỏ contact damage này
  }

  _tryMove(vx, vy) {
    const nx = this.x + vx;
    if (!checkObstacleCollision(nx, this.y, this.w, this.h) &&
      nx >= 20 && nx + this.w <= MAP_WIDTH - 20) {
      this.x = nx;
    } else {
      this.vx *= -0.4;
      const sy = this.y + vy * 0.5;
      if (!checkObstacleCollision(this.x, sy, this.w, this.h) &&
        sy >= 20 && sy + this.h <= MAP_HEIGHT - 20) {
        this.y = sy;
      }
    }
    const ny = this.y + vy;
    if (!checkObstacleCollision(this.x, ny, this.w, this.h) &&
      ny >= 20 && ny + this.h <= MAP_HEIGHT - 20) {
      this.y = ny;
    } else {
      this.vy *= -0.4;
      const sx = this.x + vx * 0.5;
      if (!checkObstacleCollision(sx, this.y, this.w, this.h) &&
        sx >= 20 && sx + this.w <= MAP_WIDTH - 20) {
        this.x = sx;
      }
    }
  }

  _forceUnstuck() {
    const dirs = [
      { x: 8, y: 0 }, { x: -8, y: 0 },
      { x: 0, y: 8 }, { x: 0, y: -8 },
      { x: 8, y: 8 }, { x: -8, y: -8 },
      { x: 8, y: -8 }, { x: -8, y: 8 },
    ];
    for (const d of dirs) {
      const nx = this.x + d.x, ny = this.y + d.y;
      if (!checkObstacleCollision(nx, ny, this.w, this.h) &&
        nx >= 20 && ny >= 20 && nx + this.w <= MAP_WIDTH - 20 && ny + this.h <= MAP_HEIGHT - 20) {
        this.x = nx; this.y = ny;
        return;
      }
    }
  }

  draw(ctx) {
    if (this.dead) return;
    const style = ZONE_ENEMY_STYLES[this.zoneId] || ZONE_ENEMY_STYLES[0];
    ctx.save();
    const cx = this.x + this.w / 2;

    // Hit flash
    const flash = this._hitFlash > 0;
    const drawColor = flash ? "#ffffff" : style.fill;
    const strokeColor = flash ? "#ffffff" : style.stroke;

    ctx.shadowBlur = flash ? 22 : 14;
    ctx.shadowColor = flash ? "#ffffff" : style.shadow;

    // Thân
    ctx.fillStyle = drawColor;
    ctx.fillRect(this.x + 6, this.y + 12, this.w - 12, this.h - 18);

    // Đầu
    ctx.fillStyle = "#111133";
    ctx.fillRect(this.x + 12, this.y + 8, this.w - 24, 22);

    // Mắt
    ctx.fillStyle = flash ? style.shadow : style.eye;
    const eyeOff = Math.sin(this.frame) * 1.5;
    ctx.fillRect(cx - 9, this.y + 14 + eyeOff, 6, 6);
    ctx.fillRect(cx + 4, this.y + 14 + eyeOff, 6, 6);

    // Anten
    ctx.strokeStyle = strokeColor; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, this.y + 8); ctx.lineTo(cx - 8, this.y - 6);
    ctx.moveTo(cx, this.y + 8); ctx.lineTo(cx + 8, this.y - 6);
    ctx.stroke();

    // Tay
    ctx.strokeStyle = strokeColor; ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(this.x + 10, this.y + this.h / 2);
    ctx.lineTo(this.x - 6, this.y + this.h / 2 + Math.sin(this.frame * 2) * 8);
    ctx.moveTo(this.x + this.w - 10, this.y + this.h / 2);
    ctx.lineTo(this.x + this.w + 6, this.y + this.h / 2 - Math.sin(this.frame * 2) * 8);
    ctx.stroke();

    // HP bar
    const hp = this.hp / this.maxHp;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(this.x + 4, this.y - 10, this.w - 8, 5);
    ctx.fillStyle = hp > 0.5 ? style.stroke : (hp > 0.25 ? "#ffaa00" : "#ff0000");
    ctx.fillRect(this.x + 4, this.y - 10, (this.w - 8) * hp, 5);

    // Icon aggro
    if (!this.aggroed && this.waitTimer <= 0) {
      ctx.font = "9px monospace"; ctx.textAlign = "center";
      ctx.fillStyle = "#888888";
      ctx.shadowBlur = 0;
      ctx.fillText("·idle·", cx, this.y - 14);
    } else if (this.aggroed) {
      if (this.type === "elite") {
        ctx.font = "11px monospace"; ctx.textAlign = "center";
        ctx.fillStyle = style.stroke; ctx.shadowBlur = 8;
        ctx.fillText("★", cx, this.y - 14);
      }
      // Biểu tượng "!" khi vừa aggro (rageStacks > 0)
      if (this.rageStacks > 0 && this._hitFlash > 0) {
        ctx.font = "bold 14px monospace"; ctx.textAlign = "center";
        ctx.fillStyle = "#ff4444"; ctx.shadowBlur = 12; ctx.shadowColor = "#ff0000";
        ctx.fillText("!", cx, this.y - 24);
      }
    }

    ctx.restore();
  }
}

// ── Enemy pool ────────────────────────────────────────────────────────────────
let enemies = [];
window.enemies = enemies;

// Legacy spawn (vẫn giữ để không break game-state.js)
function spawnZoneEnemies(zoneId) {
  initZoneWaves(zoneId);
}

function spawnWave(wave) {
  enemies = [];
  window.enemies = enemies;
}

function getSafeSpawnInZone(zt, playerX, playerY) {
  return _getSafeSpawnPos(playerX, playerY);
}

// ── Update loop ───────────────────────────────────────────────────────────────
function updateEnemies(player) {
  if (window._gameOverActive) return; // player đã chết, dừng xử lý
  // in-place filter tránh tạo array mới
  let wi = 0;
  for (let i = 0; i < enemies.length; i++) {
    if (!enemies[i].dead) enemies[wi++] = enemies[i];
  }
  enemies.length = wi;
  window.enemies = enemies;

  if (gameState.zoneActive) {
    const alive = enemies.filter(e => e.zoneId === gameState.currentZone && !e.dead).length;
    gameState.zoneGuardiansLeft = Math.max(0, alive);
    gameState.bossHp = alive;
    gameState.bossMaxHp = ZONE_DATA[gameState.currentZone].guardianCount;

    // ── Đếm ngược delay giữa các wave ─────────────────────────────────────────
    if (waveDelay > 0) {
      waveDelay--;
      if (waveDelay === 0 && currentWave < totalWaves) {
        _spawnWaveEnemies(gameState.currentZone, currentWave);
      }
    }

    // ── Khi wave hiện tại sạch và không đang delay ────────────────────────────
    if (alive === 0 && waveDelay <= 0) {
      if (currentWave < totalWaves) {
        // Còn wave chưa spawn → bật delay
        waveDelay = 90; // ~1.5s
      } else if (!gameState.zoneBossSpawned && !window.boss) {
        // Hết tất cả wave + chưa có boss → spawn boss ngay
        // BUG FIX: guard để chỉ gọi spawnZoneBoss 1 lần
        if (!window._zoneClearCalled) spawnZoneBoss(gameState.currentZone);
      }
      // Nếu boss đã spawn → chờ boss.js xử lý clearCurrentZone khi boss chết
    }
  }

  enemies.forEach(e => e.update(player));
}

function drawEnemies(ctx) {
  enemies.forEach(e => e.draw(ctx));
}

// Export wave vars cho drawZoneLabel trong map.js
window.currentWave = currentWave;
window.totalWaves = totalWaves;

// Patch: sync window vars mỗi frame
Object.defineProperty(window, 'currentWave', {
  get() { return currentWave; },
  set(v) { currentWave = v; },
  configurable: true
});
Object.defineProperty(window, 'totalWaves', {
  get() { return totalWaves; },
  set(v) { totalWaves = v; },
  configurable: true
});