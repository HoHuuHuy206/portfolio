// ═══════════════════════════════════════════════════════════════════════════════
// BOSS MODULE — THEMED ZONE BOSSES
// ═══════════════════════════════════════════════════════════════════════════════

// Boss theo chủ đề từng Zone
class ZoneBoss {
  constructor(x, y, zoneId) {
    this.x = x; this.y = y;
    this.w = 72; this.h = 72;
    this.zoneId = zoneId;

    const zone = ZONE_DATA[zoneId];
    this.name = zone.bossName;
    this.color = zone.bossColor;

    // Mỗi boss có HP khác nhau
    const hpTable = [400, 500, 600, 700];
    this.maxHp = hpTable[zoneId] || 500;
    this.hp = this.maxHp;

    this.dead = false;
    this.phase = 1;
    this.dir = "down";
    this.vx = 0; this.vy = 0;
    this.cooldowns = { shoot: 0, slash: 0, special: 0 };
    this._winShown = false;
    this.frame = 0;

    // Pattern riêng từng boss
    this.pattern = zoneId; // 0=ghost, 1=compiler, 2=deadline, 3=encryption
  }

  update(player) {
    if (this.dead || !player || window._gameOverActive) return;
    this.frame += 0.1;

    const cx = this.x + this.w / 2, cy = this.y + this.h / 2;
    const px = player.x + player.w / 2, py = player.y + player.h / 2;
    let dx = px - cx, dy = py - cy;
    const len = Math.hypot(dx, dy);
    if (len > 0.1) { dx /= len; dy /= len; }

    const spd = this.phase === 2 ? 2.0 : 1.4;

    // PERF FIX: Boss dùng 8 hướng là đủ (boss to, chậm, ít bị kẹt tường hơn enemy)
    let bestScore = -Infinity;
    let bestDx = dx, bestDy = dy;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const pdx = Math.cos(angle), pdy = Math.sin(angle);
      const nx = this.x + pdx * spd * 8, ny = this.y + pdy * spd * 8;
      const blocked = checkObstacleCollision(nx, ny, this.w, this.h)
        || nx < 20 || ny < 20
        || nx + this.w > MAP_WIDTH - 20
        || ny + this.h > MAP_HEIGHT - 20;
      const score = blocked ? (pdx * dx + pdy * dy) - 10 : (pdx * dx + pdy * dy);
      if (score > bestScore) { bestScore = score; bestDx = pdx; bestDy = pdy; }
    }

    const accel = 0.12;
    this.vx = this.vx * (1 - accel) + bestDx * spd * accel;
    this.vy = this.vy * (1 - accel) + bestDy * spd * accel;
    const mv = Math.hypot(this.vx, this.vy);
    if (mv > spd) { this.vx = this.vx / mv * spd; this.vy = this.vy / mv * spd; }

    const nx = this.x + this.vx;
    if (!checkObstacleCollision(nx, this.y, this.w, this.h) && nx >= 20 && nx + this.w <= MAP_WIDTH - 20)
      this.x = nx; else this.vx *= -0.4;
    const ny2 = this.y + this.vy;
    if (!checkObstacleCollision(this.x, ny2, this.w, this.h) && ny2 >= 20 && ny2 + this.h <= MAP_HEIGHT - 20)
      this.y = ny2; else this.vy *= -0.4;

    if (Math.abs(this.vx) > Math.abs(this.vy))
      this.dir = this.vx > 0 ? "right" : "left";
    else
      this.dir = this.vy > 0 ? "down" : "up";

    for (let k in this.cooldowns) if (this.cooldowns[k] > 0) this.cooldowns[k]--;

    if (this.hp < this.maxHp * 0.5 && this.phase === 1) {
      this.phase = 2;
      if (typeof showPopup === 'function')
        showPopup("⚠ PHASE 2", `${this.name} — OVERLOAD MODE!`);
      if (typeof screenShake === 'function') screenShake(20);
    }

    this._runPattern(player, px, py);

    if (this.hp <= 0 && !this._winShown) {
      this._winShown = true;
      this.dead = true;
      gameState.bossActive = false;
      if (typeof showPopup === 'function')
        showPopup("⚡ BOSS TIÊU DIỆT", `${this.name} đã bị đánh bại!`);
      if (typeof screenShake === 'function') screenShake(30);
      if (typeof spawnParticles === 'function')
        spawnParticles(this.x + this.w / 2, this.y + this.h / 2, "explosion", 20);
      // Boss chết -> clear zone
      if (gameState.zoneActive) {
        // BUG FIX: guard chống gọi clearCurrentZone nhiều lần
        window._zoneClearCalled = true;
        // Kill all remaining enemies in zone
        (window.enemies || []).forEach(e => {
          if (e.zoneId === gameState.currentZone) e.dead = true;
        });
        clearCurrentZone();
      }
    }
  }

  _runPattern(player, px, py) {
    switch (this.pattern) {
      case 0: this._patternGhost(px, py); break;
      case 1: this._patternCompiler(px, py); break;
      case 2: this._patternDeadline(player, px, py); break;
      case 3: this._patternEncryption(px, py); break;
    }
  }

  // Zone 0: IDENTITY.VIRUS — tele-dash ngẫu nhiên + shoot thẳng
  _patternGhost(px, py) {
    if (this.cooldowns.shoot <= 0) {
      if (typeof spawnEnemyBullet === 'function')
        spawnEnemyBullet(this.x + this.w / 2, this.y + this.h / 2, px, py);
      if (this.phase === 2) {
        spawnEnemyBullet(this.x + this.w / 2, this.y + this.h / 2, px + 50, py - 30);
        spawnEnemyBullet(this.x + this.w / 2, this.y + this.h / 2, px - 50, py + 30);
      }
      this.cooldowns.shoot = this.phase === 2 ? 22 : 38;
    }
    if (this.cooldowns.special <= 0 && this.phase === 2) {
      // Tele-blink — toàn bộ màn hình
      for (let i = 0; i < 15; i++) {
        const tx = 80 + Math.random() * (MAP_WIDTH - 160);
        const ty = 80 + Math.random() * (MAP_HEIGHT - 160);
        if (!checkObstacleCollision(tx, ty, this.w, this.h)) {
          if (typeof spawnParticles === 'function')
            spawnParticles(this.x + this.w / 2, this.y + this.h / 2, "dash", 20);
          this.x = tx; this.y = ty;
          break;
        }
      }
      this.cooldowns.special = 90;
    }
  }

  // Zone 1: COMPILER.WRAITH — burst 3 đạn + AoE pulse
  _patternCompiler(px, py) {
    if (this.cooldowns.shoot <= 0) {
      const angles = this.phase === 2 ? [-0.3, 0, 0.3, 0.6, -0.6] : [-0.25, 0, 0.25];
      const base = Math.atan2(py - (this.y + this.h / 2), px - (this.x + this.w / 2));
      angles.forEach(off => {
        const a = base + off;
        if (typeof spawnEnemyBullet === 'function')
          spawnEnemyBullet(
            this.x + this.w / 2, this.y + this.h / 2,
            this.x + this.w / 2 + Math.cos(a) * 100,
            this.y + this.h / 2 + Math.sin(a) * 100
          );
      });
      this.cooldowns.shoot = this.phase === 2 ? 18 : 30;
    }
  }

  // Zone 2: DEADLINE.DEMON — charge rush + AOE slam
  _patternDeadline(player, px, py) {
    if (this.cooldowns.shoot <= 0) {
      if (typeof spawnEnemyBullet === 'function')
        spawnEnemyBullet(this.x + this.w / 2, this.y + this.h / 2, px, py);
      this.cooldowns.shoot = this.phase === 2 ? 16 : 28;
    }
    if (this.cooldowns.special <= 0) {
      // BUG FIX: luôn reset cooldown trước, chỉ damage nếu đủ gần
      // Trước đây else branch = 10 frame → AOE spam khi xa player
      const dist = Math.hypot(this.x + this.w / 2 - px, this.y + this.h / 2 - py);
      if (dist < 120) {
        const p = window.player;
        // FIX: không gây damage khi player đang i-frames
        if (!p || p.iframes <= 0) {
          if (typeof takeDamage === 'function') takeDamage(18);
          if (p) p.iframes = 30;
        }
        if (typeof spawnParticles === 'function')
          spawnParticles(this.x + this.w / 2, this.y + this.h / 2, "explosion", 10);
        if (typeof screenShake === 'function') screenShake(10);
      }
      this.cooldowns.special = this.phase === 2 ? 50 : 80;
    }
  }

  // Zone 3: ENCRYPTION.GOD — xoay 8 đạn + barrier
  _patternEncryption(px, py) {
    if (this.cooldowns.shoot <= 0) {
      const count = this.phase === 2 ? 8 : 4;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + this.frame;
        if (typeof spawnEnemyBullet === 'function')
          spawnEnemyBullet(
            this.x + this.w / 2, this.y + this.h / 2,
            this.x + this.w / 2 + Math.cos(angle) * 100,
            this.y + this.h / 2 + Math.sin(angle) * 100
          );
      }
      this.cooldowns.shoot = this.phase === 2 ? 20 : 35;
    }
  }

  draw(ctx) {
    if (this.dead) return;
    ctx.save();
    const cx = this.x + this.w / 2, cy = this.y + this.h / 2;
    const pulse = Math.sin(this.frame * 2) * 0.5 + 0.5;
    const c = this.color;

    // Glow nền
    ctx.shadowBlur = 20 + pulse * 15;
    ctx.shadowColor = c;

    // Thân boss theo zone
    switch (this.zoneId) {
      case 0: this._drawGhost(ctx, cx, cy, c, pulse); break;
      case 1: this._drawCompiler(ctx, cx, cy, c, pulse); break;
      case 2: this._drawDeadline(ctx, cx, cy, c, pulse); break;
      case 3: this._drawEncryption(ctx, cx, cy, c, pulse); break;
    }

    // Phase 2 aura
    if (this.phase === 2) {
      ctx.globalAlpha = 0.2 + pulse * 0.2;
      ctx.strokeStyle = c;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, this.w * 0.8 + pulse * 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Tên boss
    ctx.shadowBlur = 0;
    ctx.fillStyle = c;
    ctx.font = "bold 11px 'Share Tech Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText(this.name, cx, this.y - 12);

    // HP bar
    const hpPct = Math.max(0, this.hp / this.maxHp);
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(this.x, this.y - 8, this.w, 6);
    ctx.fillStyle = hpPct > 0.5 ? c : "#ff0000";
    ctx.fillRect(this.x, this.y - 8, this.w * hpPct, 6);
    ctx.strokeStyle = c;
    ctx.lineWidth = 1;
    ctx.strokeRect(this.x, this.y - 8, this.w, 6);

    ctx.restore();
  }

  _drawGhost(ctx, cx, cy, c, pulse) {
    // Dạng hình bóng mờ floating
    ctx.globalAlpha = 0.6 + pulse * 0.3;
    ctx.fillStyle = c + "44";
    ctx.beginPath();
    ctx.ellipse(cx, cy, 32, 36, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = c;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.globalAlpha = 1;
    // Mắt phát sáng
    ctx.fillStyle = "#ffffff";
    ctx.shadowBlur = 12; ctx.shadowColor = c;
    ctx.fillRect(cx - 12, cy - 8, 8, 8);
    ctx.fillRect(cx + 4, cy - 8, 8, 8);
    ctx.fillStyle = c;
    ctx.fillRect(cx - 10, cy - 6, 4, 4);
    ctx.fillRect(cx + 6, cy - 6, 4, 4);
  }

  _drawCompiler(ctx, cx, cy, c, pulse) {
    // Hình lục giác phức tạp = CPU chip
    ctx.strokeStyle = c;
    ctx.fillStyle = "#220033";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
      const r = 32 + pulse * 4;
      if (i === 0) ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      else ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // Ký hiệu {} bên trong
    ctx.fillStyle = c;
    ctx.font = "bold 20px monospace";
    ctx.textAlign = "center";
    ctx.fillText("{}", cx, cy + 7);
    // Circuit lines
    ctx.strokeStyle = c + "88";
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * 24, cy + Math.sin(a) * 24);
      ctx.lineTo(cx + Math.cos(a) * 40, cy + Math.sin(a) * 40);
      ctx.stroke();
    }
  }

  _drawDeadline(ctx, cx, cy, c, pulse) {
    // Đồng hồ đếm ngược = DEADLINE
    ctx.fillStyle = "#221100";
    ctx.strokeStyle = c;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, 32, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    // Mặt đồng hồ
    ctx.strokeStyle = c + "cc";
    ctx.lineWidth = 2;
    const t = Date.now() / 1000;
    // Kim giờ
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(t * 0.1) * 16, cy + Math.sin(t * 0.1) * 16);
    ctx.stroke();
    // Kim phút
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(t * 0.8) * 22, cy + Math.sin(t * 0.8) * 22);
    ctx.stroke();
    // Tâm
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();
    // 12 vạch chia
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.fillStyle = c;
      ctx.fillRect(cx + Math.cos(a) * 26 - 1, cy + Math.sin(a) * 26 - 1, 2, 2);
    }
  }

  _drawEncryption(ctx, cx, cy, c, pulse) {
    // Ổ khóa + xoay = encryption
    // Xoay toàn bộ
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.frame * 0.5);
    // Vành xoay
    ctx.strokeStyle = c;
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 20, Math.sin(a) * 20);
      ctx.lineTo(Math.cos(a) * 32, Math.sin(a) * 32);
      ctx.stroke();
    }
    ctx.restore();
    // Ổ khóa trung tâm
    ctx.fillStyle = "#001122";
    ctx.strokeStyle = c;
    ctx.lineWidth = 2;
    ctx.fillRect(cx - 12, cy - 4, 24, 20);
    ctx.strokeRect(cx - 12, cy - 4, 24, 20);
    ctx.beginPath();
    ctx.arc(cx, cy - 4, 10, Math.PI, 0);
    ctx.stroke();
    // Lỗ khóa
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.arc(cx, cy + 5, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(cx - 2, cy + 5, 4, 6);
  }
}

// ── Chest (rương portfolio) ────────────────────────────────────────────────────
let chest = null;

function resetChest() {
  chest = null;
}

function spawnChest() {
  chest = {
    x: MAP_WIDTH / 2 - 24, y: MAP_HEIGHT / 2 - 24,
    w: 48, h: 48, opened: false,
    pulse: 0
  };
}

function checkChestPickup(player) {
  if (!chest || chest.opened) return;
  const dist = Math.hypot(player.x + player.w / 2 - (chest.x + chest.w / 2),
    player.y + player.h / 2 - (chest.y + chest.h / 2));
  if (dist < 55) {
    chest.opened = true;
    openPortfolio();
  }
}

function openPortfolio() {
  if (typeof showPopup === 'function')
    showPopup("🏆 RƯƠNG MỞ RA", "Đang tải Portfolio Report...");
  setTimeout(() => {
    if (typeof showPortfolioReport === 'function') showPortfolioReport();
  }, 800);
}

function drawChest(ctx) {
  if (!chest || chest.opened) return;
  chest.pulse = (chest.pulse || 0) + 0.06;
  const p = Math.sin(chest.pulse);
  ctx.save();
  ctx.shadowBlur = 20 + p * 10;
  ctx.shadowColor = "#ffdd00";
  ctx.fillStyle = "#332200";
  ctx.strokeStyle = "#ffdd00";
  ctx.lineWidth = 3;
  ctx.fillRect(chest.x, chest.y, chest.w, chest.h);
  ctx.strokeRect(chest.x, chest.y, chest.w, chest.h);

  ctx.fillStyle = "#ffdd00";
  ctx.fillRect(chest.x + chest.w / 2 - 6, chest.y + chest.h / 2 - 8, 12, 14);
  ctx.fillStyle = "#332200";
  ctx.beginPath();
  ctx.arc(chest.x + chest.w / 2, chest.y + chest.h / 2 - 8, 5, Math.PI, 0);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = "#ffdd00";
  ctx.font = "bold 9px monospace";
  ctx.textAlign = "center";
  ctx.fillText("PORTFOLIO", chest.x + chest.w / 2, chest.y - 6);
  ctx.fillText("[ đến gần ]", chest.x + chest.w / 2, chest.y + chest.h + 14);
  ctx.restore();
}

// ── Boss management ───────────────────────────────────────────────────────────
let boss = null;

// RESET HOÀN TOÀN — phải gọi khi startGame/resetGame để boss cũ không tồn tại
function resetBoss() {
  boss = null;
  window.boss = null;
  chest = null;
  if (typeof __shakeFramesReset === 'function') __shakeFramesReset();
  window._shakeFrames = 0;
  shakeX = 0; shakeY = 0;
}
window.resetBoss = resetBoss;

// Spawn boss theo zone (được gọi khi zone còn 30% quái)
function spawnZoneBoss(zoneId) {
  if (gameState.zoneBossSpawned) return;
  gameState.zoneBossSpawned = true;

  // FIX: Tìm vị trí spawn xa player, không spawn đè lên player
  const px = window.player ? window.player.x + window.player.w / 2 : MAP_WIDTH / 2;
  const py = window.player ? window.player.y + window.player.h / 2 : MAP_HEIGHT / 2;

  // Thử spawn ở các góc map, chọn góc xa player nhất
  const candidates = [
    { x: 120, y: 120 },
    { x: MAP_WIDTH - 120 - 72, y: 120 },
    { x: 120, y: MAP_HEIGHT - 120 - 72 },
    { x: MAP_WIDTH - 120 - 72, y: MAP_HEIGHT - 120 - 72 },
    { x: MAP_WIDTH / 2 - 36, y: 80 },
    { x: MAP_WIDTH / 2 - 36, y: MAP_HEIGHT - 80 - 72 },
  ];
  let bestPos = candidates[0];
  let bestDist = 0;
  for (const c of candidates) {
    const d = Math.hypot(c.x + 36 - px, c.y + 36 - py);
    if (d > bestDist && !checkObstacleCollision(c.x, c.y, 72, 72)) {
      bestDist = d; bestPos = c;
    }
  }

  boss = new ZoneBoss(bestPos.x, bestPos.y, zoneId);
  window.boss = boss;
  gameState.bossActive = true;
  gameState.bossHp = boss.hp;
  gameState.bossMaxHp = boss.maxHp;
  gameState.bossName = boss.name;

  // FIX: Grace period 120 frame (~2s) trước khi boss bắt đầu tấn công
  boss.cooldowns.shoot = 120;
  boss.cooldowns.special = 120;

  if (window.bullets) window.bullets.length = 0;
  if (typeof showPopup === 'function') showPopup("⚠ BOSS XUẤT HIỆN!", boss.name + " — Hãy chiến đấu!");
  if (typeof screenShake === 'function') screenShake(25);
}

function spawnBoss() {
  // Legacy fallback — spawn boss Zone 0 nếu không có zone nào
  boss = new ZoneBoss(MAP_WIDTH / 2 - 36, 100, 0);
  window.boss = boss;
  gameState.bossActive = true;
  gameState.bossHp = boss.hp;
  gameState.bossMaxHp = boss.maxHp;
  gameState.bossName = boss.name;
}

function updateBoss(player) {
  // Boss được spawn bởi updateEnemies() sau khi hết tất cả wave
  // updateBoss chỉ cần update boss đang sống và dọn dẹp khi boss chết
  if (boss && !boss.dead) {
    boss.update(player);
    gameState.bossHp = Math.max(0, boss.hp);
  } else if (boss && boss.dead) {
    boss = null;
    window.boss = null;
    gameState.bossActive = false;
  }
}

function drawBoss(ctx) {
  if (boss && !boss.dead) boss.draw(ctx);
}

// ── Screen shake ──────────────────────────────────────────────────────────────
let shakeX = 0, shakeY = 0;
let _shakeFrames = 0;
window.__shakeFramesReset = () => { _shakeFrames = 0; shakeX = 0; shakeY = 0; };
function screenShake(time = 15) {
  if (window._gameOverActive) return; // không shake khi game over
  _shakeFrames = Math.max(_shakeFrames, time);
}
function updateScreenShake() {
  if (_shakeFrames > 0) {
    shakeX = (Math.random() - 0.5) * 7;
    shakeY = (Math.random() - 0.5) * 7;
    _shakeFrames--;
  } else {
    shakeX = 0; shakeY = 0;
    _shakeFrames = 0;
  }
}
window.updateScreenShake = updateScreenShake;