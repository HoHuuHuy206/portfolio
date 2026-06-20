// ═══════════════════════════════════════════════════════════════════════════════
// PLAYER MODULE — FIX WALL STUCK BUG + GIÁP CYBER
// ═══════════════════════════════════════════════════════════════════════════════

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 48;
    this.h = 56;
    this.speed = 5.2;
    this.dir = "down";

    this.frame = 0;
    this.animSpeed = 0.18;
    this.state = "idle";

    this.cooldowns = { blade: 0, gun: 0, dash: 0, hack: 0, explosive: 0 };

    this.attackTime = 0;
    this.isDashing = false;
    this.glowPulse = 0;
    this.trailX = x;
    this.trailY = y;

    // Anti-stuck
    this._stuckTimer = 0;
    this._lastX = x;
    this._lastY = y;
  }

  update(input) {
    for (let k in this.cooldowns) {
      if (this.cooldowns[k] > 0) this.cooldowns[k]--;
    }
    if (this.attackTime > 0) this.attackTime--;
    this.glowPulse += 0.08;

    let dx = 0, dy = 0, moving = false;
    if (input.up) { dy -= this.speed; this.dir = "up"; moving = true; }
    if (input.down) { dy += this.speed; this.dir = "down"; moving = true; }
    if (input.left) { dx -= this.speed; this.dir = "left"; moving = true; }
    if (input.right) { dx += this.speed; this.dir = "right"; moving = true; }
    if (dx !== 0 && dy !== 0) { dx *= 0.7071; dy *= 0.7071; }

    this.trailX = this.x;
    this.trailY = this.y;

    if (moving) {
      this._moveWithSlide(dx, dy);
    }

    // Anti-stuck: nếu bị kẹt quá lâu, đẩy ra ngoài
    if (moving) {
      const moved = Math.hypot(this.x - this._lastX, this.y - this._lastY);
      if (moved < 0.3) {
        this._stuckTimer++;
        if (this._stuckTimer > 8) {
          this._unstuck();
          this._stuckTimer = 0;
        }
      } else {
        this._stuckTimer = 0;
      }
    } else {
      this._stuckTimer = 0;
    }
    this._lastX = this.x;
    this._lastY = this.y;

    this.state = moving ? "run" : "idle";
    if (this.attackTime > 0) this.state = "attack";
    if (this.isDashing) this.state = "dash";
    if (moving || this.state === "attack") this.frame += this.animSpeed;

    // ── Luôn resolve overlap mỗi frame (phòng khi bị teleport vào tường) ──
    this._resolveOverlap();
  }

  // ── Đẩy ra khỏi obstacle nếu đang overlap (chạy mỗi frame) ────────────────
  _resolveOverlap() {
    if (!checkObstacleCollision(this.x, this.y, this.w, this.h)) return;
    // PERF FIX: giới hạn r <= 80 (đủ thoát mọi obstacle bình thường)
    // và bước tăng 8 thay vì 4 để giảm iterations ~4×
    for (let r = 8; r <= 80; r += 8) {
      const steps = Math.max(8, Math.floor(r * 0.6));
      for (let i = 0; i < steps; i++) {
        const angle = (i / steps) * Math.PI * 2;
        const tx = Math.round(this.x + Math.cos(angle) * r);
        const ty = Math.round(this.y + Math.sin(angle) * r);
        if (tx < 2 || ty < 2 || tx + this.w > MAP_WIDTH - 2 || ty + this.h > MAP_HEIGHT - 2) continue;
        if (!checkObstacleCollision(tx, ty, this.w, this.h)) {
          this.x = tx; this.y = ty;
          return;
        }
      }
    }
  }

  // ── Slide-along-wall movement (fix kẹt tường) ──────────────────────────────
  _moveWithSlide(dx, dy) {
    const MARGIN = 2;
    const minX = MARGIN, maxX = MAP_WIDTH - this.w - MARGIN;
    const minY = MARGIN, maxY = MAP_HEIGHT - this.h - MARGIN;

    // Thử full vector trước
    let nx = Math.min(Math.max(this.x + dx, minX), maxX);
    let ny = Math.min(Math.max(this.y + dy, minY), maxY);

    if (!checkObstacleCollision(nx, ny, this.w, this.h)) {
      this.x = nx; this.y = ny;
      return;
    }

    // Thử chỉ X
    let tx = Math.min(Math.max(this.x + dx, minX), maxX);
    if (!checkObstacleCollision(tx, this.y, this.w, this.h)) {
      this.x = tx;
      return;
    }

    // Thử chỉ Y
    let ty = Math.min(Math.max(this.y + dy, minY), maxY);
    if (!checkObstacleCollision(this.x, ty, this.w, this.h)) {
      this.y = ty;
      return;
    }

    // Kẹt hoàn toàn — không di chuyển
  }

  // ── Đẩy khỏi tường khi bị kẹt (dự phòng, _resolveOverlap xử lý chính) ──────
  _unstuck() {
    for (let r = 6; r <= 80; r += 6) {
      const dirs = [
        { x: r, y: 0 }, { x: -r, y: 0 },
        { x: 0, y: r }, { x: 0, y: -r },
        { x: r, y: r }, { x: -r, y: -r },
        { x: r, y: -r }, { x: -r, y: r },
      ];
      for (const d of dirs) {
        const nx = this.x + d.x;
        const ny = this.y + d.y;
        if (!checkObstacleCollision(nx, ny, this.w, this.h) &&
          nx >= 2 && ny >= 2 && nx + this.w <= MAP_WIDTH - 2 && ny + this.h <= MAP_HEIGHT - 2) {
          this.x = nx; this.y = ny;
          return;
        }
      }
    }
  }

  // ====================== KỸ NĂNG ======================

  bladeAttack() {
    if (this.cooldowns.blade > 0) return;
    this.cooldowns.blade = 18;
    this.attackTime = 14;
    if (typeof playSound === 'function') playSound("chem");
    if (typeof spawnParticles === 'function') spawnParticles(this.x + this.w / 2, this.y + this.h / 2, "slash", 22);
    const range = 80;
    (window.enemies || []).forEach(e => {
      if (!e.dead && Math.hypot(this.x + this.w / 2 - (e.x + e.w / 2), this.y + this.h / 2 - (e.y + e.h / 2)) < range)
        e.takeDamage(35);
    });
    if (window.boss && !window.boss.dead) {
      if (Math.hypot(this.x + this.w / 2 - (window.boss.x + window.boss.w / 2),
        this.y + this.h / 2 - (window.boss.y + window.boss.h / 2)) < range + 25)
        window.boss.hp -= 35;
    }
  }

  gunAttack() {
    if (this.cooldowns.gun > 0) return;
    this.cooldowns.gun = 10;
    if (typeof playSound === 'function') playSound("shot", 0.35);

    let gdx = 0, gdy = 0;
    if (this.dir === "up") gdy = -1;
    else if (this.dir === "down") gdy = 1;
    else if (this.dir === "left") gdx = -1;
    else if (this.dir === "right") gdx = 1;

    if (typeof spawnPlayerBullet === 'function')
      spawnPlayerBullet(this.x + this.w / 2, this.y + this.h / 2 - 5, gdx, gdy, 13, "normal");
    if (typeof spawnParticles === 'function')
      spawnParticles(this.x + this.w / 2, this.y + this.h / 2, "gun", 6);
  }

  dash() {
    if (this.cooldowns.dash > 0) return;
    this.cooldowns.dash = 50;
    this.isDashing = true;
    let dX = 0, dY = 0;
    const dashPower = 85;
    if (this.dir === "up") dY = -dashPower;
    if (this.dir === "down") dY = dashPower;
    if (this.dir === "left") dX = -dashPower;
    if (this.dir === "right") dX = dashPower;

    // Dash từng bước nhỏ để không xuyên tường
    const steps = 10;
    const sx = dX / steps, sy = dY / steps;
    for (let i = 0; i < steps; i++) {
      const tx = Math.min(Math.max(this.x + sx, 2), MAP_WIDTH - this.w - 2);
      const ty = Math.min(Math.max(this.y + sy, 2), MAP_HEIGHT - this.h - 2);
      if (!checkObstacleCollision(tx, ty, this.w, this.h)) {
        this.x = tx; this.y = ty;
      } else if (!checkObstacleCollision(tx, this.y, this.w, this.h)) {
        this.x = tx;
      } else if (!checkObstacleCollision(this.x, ty, this.w, this.h)) {
        this.y = ty;
      } else {
        break; // chặn lại khi đâm tường
      }
    }

    if (typeof spawnParticles === 'function') spawnParticles(this.x + this.w / 2, this.y + this.h / 2, "dash", 28);
    setTimeout(() => this.isDashing = false, 180);
  }

  hack() {
    if (this.cooldowns.hack > 0) return;
    this.cooldowns.hack = 130;
    if (typeof spawnParticles === 'function') spawnParticles(this.x + this.w / 2, this.y + this.h / 2, "hack", 35);
    (window.enemies || []).forEach(e => {
      if (!e.dead && Math.hypot(this.x - e.x, this.y - e.y) < 220) {
        const orig = e.speed;
        e.speed *= 0.35;
        setTimeout(() => { if (!e.dead) e.speed = orig; }, 3500);
      }
    });
    if (typeof showPopup === 'function') showPopup("HACK THÀNH CÔNG", "Tất cả quái bị làm chậm 3.5 giây!");
  }

  fireExplosive() {
    if (this.cooldowns.explosive > 0 || gameState.explosiveStock <= 0) return;
    this.cooldowns.explosive = 35;
    if (typeof playSound === 'function') playSound("boom");
    let bdx = 0, bdy = 0;
    if (this.dir === "up") bdy = -1;
    if (this.dir === "down") bdy = 1;
    if (this.dir === "left") bdx = -1;
    if (this.dir === "right") bdx = 1;
    if (typeof spawnPlayerBullet === 'function')
      spawnPlayerBullet(this.x + this.w / 2, this.y + this.h / 2, bdx, bdy, 9, "explosive");
    gameState.explosiveStock--;
    if (typeof updateExplosiveDisplay === 'function') updateExplosiveDisplay();
    if (typeof spawnParticles === 'function') spawnParticles(this.x + this.w / 2, this.y + this.h / 2, "power", 18);
  }

  // ====================== DRAW ======================
  draw(ctx) {
    ctx.save();
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    const pulse = Math.sin(this.glowPulse) * 0.5 + 0.5;

    if (this.isDashing) {
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = "#00ffff";
      ctx.fillRect(this.trailX + 6, this.trailY + 8, this.w - 12, this.h - 12);
      ctx.globalAlpha = 1;
    }

    const legBob = this.state === "run" ? Math.sin(this.frame * 3) * 3 : 0;
    ctx.fillStyle = "#0a1a2e";
    ctx.fillRect(cx - 13, this.y + this.h - 16 + legBob, 10, 14);
    ctx.fillRect(cx + 3, this.y + this.h - 16 - legBob, 10, 14);
    ctx.fillStyle = "#00aacc";
    ctx.fillRect(cx - 14, this.y + this.h - 4 + legBob, 12, 4);
    ctx.fillRect(cx + 2, this.y + this.h - 4 - legBob, 12, 4);

    const bodyColor = this.isDashing ? "#aaffff" : "#0d2a3e";
    ctx.shadowBlur = this.isDashing ? 30 : 12 + pulse * 8;
    ctx.shadowColor = this.isDashing ? "#ffffff" : "#00e5ff";
    ctx.fillStyle = bodyColor;
    ctx.fillRect(cx - 16, this.y + 24, 32, 22);
    ctx.fillStyle = "#1a4a6a";
    ctx.fillRect(cx - 14, this.y + 26, 28, 4);

    const coreGlow = 0.6 + pulse * 0.4;
    ctx.shadowBlur = 18;
    ctx.shadowColor = `rgba(0, 230, 255, ${coreGlow})`;
    ctx.fillStyle = `rgba(0, 200, 255, ${coreGlow})`;
    ctx.beginPath();
    ctx.arc(cx, this.y + 34, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(0, 255, 255, ${coreGlow * 0.7})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, this.y + 34, 8, 0, Math.PI * 2);
    ctx.stroke();

    const armSwing = this.state === "run" ? Math.sin(this.frame * 3) * 5 : 0;
    ctx.shadowBlur = 8; ctx.shadowColor = "#00aaff";
    ctx.fillStyle = "#0d2a3e";
    ctx.fillRect(cx - 22, this.y + 24, 8, 12);
    ctx.fillRect(cx + 14, this.y + 24, 8, 12);
    ctx.fillStyle = "#082030";
    ctx.fillRect(cx - 22, this.y + 30 + armSwing, 6, 14);
    ctx.fillRect(cx + 16, this.y + 30 - armSwing, 6, 14);
    ctx.strokeStyle = "#00ccff"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - 19, this.y + 32 + armSwing); ctx.lineTo(cx - 19, this.y + 42 + armSwing); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 19, this.y + 32 - armSwing); ctx.lineTo(cx + 19, this.y + 42 - armSwing); ctx.stroke();

    ctx.shadowBlur = 14 + pulse * 6; ctx.shadowColor = "#00e5ff";
    ctx.fillStyle = "#0a1e30";
    ctx.beginPath();
    ctx.moveTo(cx - 14, this.y + 22); ctx.lineTo(cx + 14, this.y + 22);
    ctx.lineTo(cx + 12, this.y + 6); ctx.lineTo(cx - 12, this.y + 6);
    ctx.closePath(); ctx.fill();

    ctx.fillStyle = "#001830";
    ctx.fillRect(cx - 11, this.y + 10, 22, 12);
    const visorColor = this.state === "attack" ? "#ff4400" : (this.isDashing ? "#ffffff" : "#00ffff");
    ctx.shadowBlur = 20; ctx.shadowColor = visorColor;
    ctx.fillStyle = visorColor; ctx.globalAlpha = 0.85;
    if (this.dir === "left") ctx.fillRect(cx - 11, this.y + 13, 16, 6);
    else if (this.dir === "right") ctx.fillRect(cx - 5, this.y + 13, 16, 6);
    else if (this.dir === "up") ctx.fillRect(cx - 8, this.y + 13, 16, 4);
    else ctx.fillRect(cx - 10, this.y + 13, 20, 6);
    ctx.globalAlpha = 1;

    ctx.shadowBlur = 12; ctx.shadowColor = visorColor; ctx.fillStyle = visorColor;
    ctx.fillRect(cx - 8, this.y + 14, 5, 4);
    ctx.fillRect(cx + 3, this.y + 14, 5, 4);

    ctx.shadowBlur = 0; ctx.strokeStyle = "#00aacc"; ctx.lineWidth = 1.5;
    ctx.strokeRect(cx - 11, this.y + 10, 22, 12);
    ctx.shadowBlur = 8; ctx.shadowColor = "#00ffff"; ctx.strokeStyle = "#00ffff"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - 4, this.y + 6); ctx.lineTo(cx - 6, this.y - 2);
    ctx.moveTo(cx + 4, this.y + 6); ctx.lineTo(cx + 6, this.y - 2); ctx.stroke();
    ctx.fillStyle = "#00ffff";
    ctx.beginPath(); ctx.arc(cx - 6, this.y - 2, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 6, this.y - 2, 2, 0, Math.PI * 2); ctx.fill();

    if (this.attackTime > 0) {
      const t = this.attackTime / 14;
      ctx.save();

      // Hướng chém → góc arc
      const dirAngles = {
        right: { start: -Math.PI * 0.55, end: Math.PI * 0.25, ox: 1,  oy: 0  },
        left:  { start: Math.PI * 0.75,  end: Math.PI * 1.55, ox: -1, oy: 0  },
        down:  { start: Math.PI * 0.05,  end: Math.PI * 0.95, ox: 0,  oy: 1  },
        up:    { start: -Math.PI * 0.95, end: -Math.PI * 0.05,ox: 0,  oy: -1 },
      };
      const da = dirAngles[this.dir] || dirAngles.down;

      // Tâm slash lệch về phía chém
      const slashDist = 28;
      const scx = cx + da.ox * slashDist;
      const scy = cy + da.oy * slashDist;
      const slashR = 52 + (1 - t) * 18; // bán kính lớn dần khi bay ra

      // Layer 1: vệt sáng rộng (nền mờ)
      ctx.globalAlpha = t * 0.25;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 22;
      ctx.lineCap = "round";
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(scx, scy, slashR, da.start, da.end);
      ctx.stroke();

      // Layer 2: vệt cam-vàng chính
      ctx.globalAlpha = t * 0.75;
      const grad2 = ctx.createLinearGradient(
        scx + Math.cos(da.start) * slashR, scy + Math.sin(da.start) * slashR,
        scx + Math.cos(da.end)   * slashR, scy + Math.sin(da.end)   * slashR
      );
      grad2.addColorStop(0,   "rgba(255,120,0,0)");
      grad2.addColorStop(0.4, "rgba(255,220,0,1)");
      grad2.addColorStop(0.7, "rgba(255,80,0,1)");
      grad2.addColorStop(1,   "rgba(255,0,80,0)");
      ctx.strokeStyle = grad2;
      ctx.lineWidth = 8;
      ctx.shadowBlur = 20;
      ctx.shadowColor = "#ff8800";
      ctx.beginPath();
      ctx.arc(scx, scy, slashR, da.start, da.end);
      ctx.stroke();

      // Layer 3: lõi trắng sắc nét
      ctx.globalAlpha = t * 0.9;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 12;
      ctx.shadowColor = "#ffffaa";
      ctx.beginPath();
      ctx.arc(scx, scy, slashR, da.start + 0.08, da.end - 0.08);
      ctx.stroke();

      // Layer 4: tia spark ở đầu lưỡi
      if (t > 0.55) {
        const sparkA = da.end - 0.08;
        const spX = scx + Math.cos(sparkA) * slashR;
        const spY = scy + Math.sin(sparkA) * slashR;
        ctx.globalAlpha = t * 0.9;
        ctx.strokeStyle = "#ffff88";
        ctx.lineWidth = 2;
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#ffaa00";
        for (let s = 0; s < 5; s++) {
          const sAngle = sparkA + (s - 2) * 0.28;
          const sLen = 8 + s * 3;
          ctx.beginPath();
          ctx.moveTo(spX, spY);
          ctx.lineTo(spX + Math.cos(sAngle) * sLen, spY + Math.sin(sAngle) * sLen);
          ctx.stroke();
        }
      }

      // Layer 5: flash trắng ngắn ngay lúc chém (t cao)
      if (t > 0.78) {
        ctx.globalAlpha = (t - 0.78) * 1.2;
        ctx.fillStyle = "rgba(255,220,150,0.35)";
        ctx.shadowBlur = 40;
        ctx.shadowColor = "#ffcc44";
        ctx.beginPath();
        ctx.arc(scx, scy, slashR * 0.55, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    if (this.isDashing) {
      ctx.globalAlpha = 0.6;
      ctx.shadowBlur = 25; ctx.shadowColor = "#00ffff";
      ctx.strokeStyle = "#00ffff"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, 28, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }
}

window.Player = Player;