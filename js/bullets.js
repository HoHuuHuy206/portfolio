// bullets.js - ĐÃ SỬA TOÀN BỘ LỖI ĐẠN

class Bullet {
  constructor(x, y, dx, dy, speed, type) {
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.speed = speed || 10;
    this.type = type || "normal"; // normal | explosive | enemy
    this.active = true;

    // Bán kính hitbox & hiển thị theo loại
    if (this.type === "explosive") this.radius = 9;
    else if (this.type === "enemy") this.radius = 6;
    else this.radius = 5;
  }

  update() {
    this.x += this.dx * this.speed;
    this.y += this.dy * this.speed;
    if (this.x < -200 || this.x > MAP_WIDTH + 200 ||
      this.y < -200 || this.y > MAP_HEIGHT + 200) {
      this.active = false;
    }
  }

  draw(ctx) {
    if (!this.active) return;
    ctx.save();

    const angle = Math.atan2(this.dy, this.dx);

    if (this.type === "enemy") {
      // Đạn quái: hình thoi đỏ nhỏ
      ctx.translate(this.x, this.y);
      ctx.rotate(angle);
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#ff2200";
      // Trail mờ
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = "#ff4400";
      ctx.beginPath();
      ctx.ellipse(-this.radius * 2, 0, this.radius * 2.5, this.radius * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
      // Lõi chính
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#ff3333";
      ctx.shadowBlur = 12;
      ctx.shadowColor = "#ff0000";
      ctx.beginPath();
      ctx.ellipse(0, 0, this.radius * 1.6, this.radius * 0.9, 0, 0, Math.PI * 2);
      ctx.fill();
      // Điểm sáng
      ctx.fillStyle = "#ffaaaa";
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.ellipse(this.radius * 0.3, 0, this.radius * 0.5, this.radius * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();

    } else if (this.type === "explosive") {
      // Đạn nổ: hình cầu lửa xoay
      ctx.translate(this.x, this.y);
      // Hào quang ngoài
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = "#ff4400";
      ctx.shadowBlur = 20;
      ctx.shadowColor = "#ff6600";
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * 2.2, 0, Math.PI * 2);
      ctx.fill();
      // Viền lửa
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = "#ff8800";
      ctx.shadowBlur = 16;
      ctx.shadowColor = "#ffaa00";
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * 1.5, 0, Math.PI * 2);
      ctx.fill();
      // Lõi cam
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#ffcc00";
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#ffff00";
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
      // Tâm trắng
      ctx.fillStyle = "#ffffff";
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * 0.4, 0, Math.PI * 2);
      ctx.fill();

    } else {
      // Đạn player normal: elongated cyan laser
      ctx.translate(this.x, this.y);
      ctx.rotate(angle);
      // Trail dài phía sau
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = "#00ffff";
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.ellipse(-this.radius * 4, 0, this.radius * 5, this.radius * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      // Hào quang xanh
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = "#00ccff";
      ctx.shadowBlur = 14;
      ctx.shadowColor = "#00ffff";
      ctx.beginPath();
      ctx.ellipse(0, 0, this.radius * 2.8, this.radius * 1.1, 0, 0, Math.PI * 2);
      ctx.fill();
      // Thân chính
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = "#00eeff";
      ctx.shadowBlur = 16;
      ctx.shadowColor = "#00ffff";
      ctx.beginPath();
      ctx.ellipse(0, 0, this.radius * 2.2, this.radius * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();
      // Lõi trắng sáng
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#ccffff";
      ctx.shadowBlur = 6;
      ctx.shadowColor = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(this.radius * 0.4, 0, this.radius * 0.9, this.radius * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Khi đạn nổ: trả về true nếu là explosive để trigger AOE
  explode() {
    this.active = false;
  }
}

// ── Mảng đạn toàn cục ──────────────────────────────────────────────────────
let bullets = [];
window.bullets = bullets;

function resetBullets() {
  bullets.length = 0;
  explosionRings.length = 0;
  window.bullets = bullets;
}
window.resetBullets = resetBullets;

// ── Spawn đạn player ────────────────────────────────────────────────────────
// BUG FIX: tham số đúng thứ tự (x, y, dx, dy, speed, type)
function spawnPlayerBullet(x, y, dx, dy, speed, type) {
  if (window._gameOverActive) return; // không spawn đạn sau khi chết
  speed = speed || 10;
  type = type || "normal";
  bullets.push(new Bullet(x, y, dx, dy, speed, type));
  window.bullets = bullets; // đảm bảo sync
}

// ── Spawn đạn quái ──────────────────────────────────────────────────────────
function spawnEnemyBullet(x, y, targetX, targetY) {
  let dx = targetX - x;
  let dy = targetY - y;
  let len = Math.hypot(dx, dy);
  if (len === 0) return;
  dx /= len;
  dy /= len;
  bullets.push(new Bullet(x, y, dx, dy, 5, "enemy"));
}

// ── Hàm vẽ vòng nổ AOE lên canvas ──────────────────────────────────────────
function drawExplosionRing(ctx, x, y, radius, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = "#ff8800";
  ctx.lineWidth = 4;
  ctx.shadowBlur = 20;
  ctx.shadowColor = "#ffaa00";
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = alpha * 0.3;
  ctx.fillStyle = "#ff6600";
  ctx.fill();
  ctx.restore();
}

// Danh sách vòng nổ đang hiển thị
let explosionRings = [];

// ── Update tất cả đạn ───────────────────────────────────────────────────────
function updateBullets(enemyList, bossInstance) {
  if (window._gameOverActive) return; // player đã chết, dừng xử lý đạn
  const p = window.player;

  for (let b of bullets) {
    if (!b.active) continue;
    b.update();
    if (!b.active) continue;

    // ── Đạn của player ──────────────────────────────────────────────────────
    if (b.type !== "enemy") {

      let hit = false;

      // Va chạm với quái thường
      // BUG FIX: phép tính hitbox đúng: (e.x + e.w/2) thay vì e.x - e.w/2
      if (enemyList && enemyList.length > 0) {
        for (let e of enemyList) {
          if (e.dead) continue;
          const dist = Math.hypot(b.x - (e.x + e.w / 2), b.y - (e.y + e.h / 2));
          const hitRadius = b.radius + 18; // bán kính va chạm rộng hơn cho dễ trúng

          if (dist < hitRadius) {
            if (b.type === "explosive") {
              // ── NỔ AOE ──────────────────────────────────────────────────
              doExplosion(b.x, b.y, enemyList, bossInstance);
            } else {
              e.takeDamage(b.type === "normal" ? 20 : 40);
            }
            b.explode();
            hit = true;
            break;
          }
        }
      }

      // Va chạm với boss
      if (!hit && b.active && bossInstance && !bossInstance.dead) {
        const dist = Math.hypot(
          b.x - (bossInstance.x + bossInstance.w / 2),
          b.y - (bossInstance.y + bossInstance.h / 2)
        );
        if (dist < b.radius + 35) {
          if (b.type === "explosive") {
            // FIX: guard — chỉ gọi doExplosion khi bossInstance không null
            doExplosion(b.x, b.y, enemyList, bossInstance);
          } else {
            bossInstance.hp -= (b.type === "normal" ? 20 : 40);
          }
          b.explode();
        }
      }

      // ── Đạn của quái ────────────────────────────────────────────────────────
    } else {
      if (p) {
        const dist = Math.hypot(b.x - (p.x + p.w / 2), b.y - (p.y + p.h / 2));
        if (dist < b.radius + 20) {
          if (typeof takeDamage === 'function') takeDamage(8);
          b.explode();
        }
      }
    }
  }

  // Lọc đạn in-place (không reassign) để tránh desync với spawnPlayerBullet
  let wi = 0;
  for (let i = 0; i < bullets.length; i++) {
    if (bullets[i].active) bullets[wi++] = bullets[i];
  }
  bullets.length = wi;
  if (bullets.length > 150) bullets.splice(0, bullets.length - 120);
  window.bullets = bullets;

  // Cập nhật vòng nổ
  for (let r of explosionRings) r.life--;
  explosionRings = explosionRings.filter(r => r.life > 0);
}

// ── Hàm nổ AOE thực sự ──────────────────────────────────────────────────────
function doExplosion(bx, by, enemyList, bossInstance) {
  const AOE_RADIUS = 110;
  const AOE_DMG_ENEMY = 80;
  const AOE_DMG_BOSS = 60;

  if (typeof playSound === 'function') playSound("boom");
  if (typeof spawnParticles === 'function') {
    spawnParticles(bx, by, "explosion", 15);
  }

  // Thêm vòng nổ hiển thị
  explosionRings.push({ x: bx, y: by, life: 20, maxLife: 20 });

  // Gây damage toàn bộ quái trong vùng AOE
  if (enemyList) {
    for (let e of enemyList) {
      if (e.dead) continue;
      const dist = Math.hypot((e.x + e.w / 2) - bx, (e.y + e.h / 2) - by);
      if (dist < AOE_RADIUS) {
        e.takeDamage(AOE_DMG_ENEMY);
      }
    }
  }

  // Gây damage boss trong vùng AOE
  if (bossInstance && !bossInstance.dead) {
    const dist = Math.hypot(
      (bossInstance.x + bossInstance.w / 2) - bx,
      (bossInstance.y + bossInstance.h / 2) - by
    );
    if (dist < AOE_RADIUS + 20) {
      bossInstance.hp -= AOE_DMG_BOSS;
    }
  }

  // Rung màn hình
  if (typeof screenShake === 'function') screenShake(12);
}

// ── Vẽ đạn + vòng nổ ────────────────────────────────────────────────────────
function drawBullets(ctx) {
  // Vẽ vòng nổ AOE trước (dưới đạn)
  for (let r of explosionRings) {
    const t = r.life / r.maxLife;             // 1 → 0
    const radius = (1 - t) * 110 + 10;        // nổ to dần
    drawExplosionRing(ctx, r.x, r.y, radius, t);
  }

  for (let b of bullets) {
    if (b.active) b.draw(ctx);
  }
}