// ═══════════════════════════════════════════════════════════════════════════════
// MAP MODULE — 3 MAPS + CV PORTAL AFTER MAP 3
// ═══════════════════════════════════════════════════════════════════════════════

const MAP_WIDTH = 1024;
const MAP_HEIGHT = 768;
const TILE = 32;

// ZONE_TRIGGERS (toàn màn hình mỗi map)
const ZONE_TRIGGERS = [
  { id: 0, x: 30, y: 30, w: MAP_WIDTH - 60, h: MAP_HEIGHT - 60, label: "👨 ABOUT ME & SKILLS", color: "#00f0ff" },
  { id: 1, x: 30, y: 30, w: MAP_WIDTH - 60, h: MAP_HEIGHT - 60, label: "🗂️ PROJECTS",           color: "#ffaa00" },
  { id: 2, x: 30, y: 30, w: MAP_WIDTH - 60, h: MAP_HEIGHT - 60, label: "📡 CONTACT",            color: "#00ff88" },
];

// ── Warp Portal ────────────────────────────────────────────────────────────────
let warpPortal = null;
let cvPortal = null;

function spawnWarpPortal(nextMapIndex) {
  if (warpPortal) return;
  if (nextMapIndex === undefined) nextMapIndex = currentMapIndex + 1;
  if (nextMapIndex >= MAP_DEFS.length) nextMapIndex = 0;
  warpPortal = {
    x: MAP_WIDTH - 90, y: MAP_HEIGHT / 2 - 32,
    w: 64, h: 64,
    toMap: nextMapIndex,
    pulse: 0,
    active: true,
    type: "warp"
  };
}

// CV Portal — xuất hiện sau khi clear zone 3, dẫn đến PDF
function spawnCVPortal() {
  cvPortal = {
    x: MAP_WIDTH / 2 - 40, y: MAP_HEIGHT / 2 + 80,
    w: 80, h: 80,
    pulse: 0,
    active: true
  };
  window.cvPortal = cvPortal;
}
window.spawnCVPortal = spawnCVPortal;

function drawWarpPortal(ctx) {
  // Vẽ warp portal thường
  if (warpPortal && warpPortal.active) {
    _drawPortalGfx(ctx, warpPortal, false);
  }
  // Vẽ CV portal
  if (cvPortal && cvPortal.active) {
    _drawCVPortal(ctx, cvPortal);
  }
}

function _drawPortalGfx(ctx, portal, isCV) {
  portal.pulse += 0.05;
  const p = Math.sin(portal.pulse);
  const cx = portal.x + portal.w / 2;
  const cy = portal.y + portal.h / 2;
  const nextZone = isCV ? null : ZONE_DATA[portal.toMap];
  const c = isCV ? "#ffdd00" : (nextZone ? nextZone.color : "#ffffff");

  ctx.save();
  ctx.shadowBlur = 20 + p * 8;
  ctx.shadowColor = c;

  for (let i = 0; i < 3; i++) {
    const r = 32 + i * 6 + p * 5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = c + (i === 0 ? "44" : "22");
    ctx.globalAlpha = 0.4 + p * 0.1;
    ctx.fill();
  }
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.arc(cx, cy, 30, 0, Math.PI * 2);
  ctx.strokeStyle = c;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.font = "bold 24px monospace";
  ctx.fillStyle = c;
  ctx.shadowBlur = 12;
  ctx.textAlign = "center";
  ctx.fillText("🌀", cx - 12, cy + 8);

  ctx.font = "bold 9px 'Segoe UI', monospace";
  ctx.fillStyle = "#ffffffcc";
  if (isCV) {
    ctx.fillText("📄 CV PDF", cx, cy - 42);
    ctx.fillText("[ ĐẾN GẦN ]", cx, cy + 52);
  } else {
    ctx.fillText("WARP → MAP " + (portal.toMap + 1), cx, cy - 42);
    if (nextZone) {
      ctx.font = "8px monospace";
      ctx.fillStyle = c;
      ctx.fillText(nextZone.icon + " " + nextZone.name, cx, cy - 28);
    }
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function _drawCVPortal(ctx, portal) {
  portal.pulse += 0.06;
  const p = Math.sin(portal.pulse);
  const cx = portal.x + portal.w / 2;
  const cy = portal.y + portal.h / 2;
  const c = "#ffdd00";

  ctx.save();
  ctx.shadowBlur = 30 + p * 12;
  ctx.shadowColor = c;

  for (let i = 0; i < 4; i++) {
    const r = 36 + i * 8 + p * 6;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = c + (i === 0 ? "55" : "22");
    ctx.globalAlpha = 0.35 + p * 0.1;
    ctx.fill();
  }
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.arc(cx, cy, 36, 0, Math.PI * 2);
  ctx.strokeStyle = c;
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.font = "bold 28px monospace";
  ctx.fillStyle = c;
  ctx.textAlign = "center";
  ctx.fillText("📄", cx - 14, cy + 10);

  ctx.globalAlpha = 0.85 + p * 0.15;
  ctx.font = "bold 10px monospace";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("XEM CV PDF", cx, cy - 48);
  ctx.font = "9px monospace";
  ctx.fillStyle = c;
  ctx.fillText("[ ĐẾN GẦN ĐỂ TẢI ]", cx, cy + 60);
  ctx.globalAlpha = 1;
  ctx.restore();
}

function checkWarpPortal(player) {
  if (warpPortal && warpPortal.active) {
    const cx = warpPortal.x + warpPortal.w / 2;
    const cy = warpPortal.y + warpPortal.h / 2;
    const dist = Math.hypot(player.x + player.w / 2 - cx, player.y + player.h / 2 - cy);
    if (dist < 52) {
      warpPortal.active = false;
      travelToMap(warpPortal.toMap);
    }
  }
  // CV portal
  if (cvPortal && cvPortal.active) {
    const cx = cvPortal.x + cvPortal.w / 2;
    const cy = cvPortal.y + cvPortal.h / 2;
    const dist = Math.hypot(player.x + player.w / 2 - cx, player.y + player.h / 2 - cy);
    if (dist < 60) {
      cvPortal.active = false;
      window.open("assets/cv/HoHoangDucHuy.pdf", "_blank");
      if (typeof showPopup === 'function')
        showPopup("📄 CV PDF", "Đang mở CV của Hồ Hoàng Đức Huy...");
    }
  }
}

function travelToMap(mapIndex) {
  currentMapIndex = mapIndex;
  window.currentMapIndex = mapIndex;
  const sp = findSafeSpawn(mapIndex);
  if (window.player) {
    window.player.x = sp.x;
    window.player.y = sp.y;
    window.player.vx = 0;
    window.player.vy = 0;
  }
  if (window.enemies) window.enemies.length = 0;
  if (window.bullets) window.bullets.length = 0;
  if (window.boss) { window.boss = null; }
  warpPortal = null;
  cvPortal = null;
  window.cvPortal = null;
  gameState.currentZone = -1;
  gameState.zoneActive = false;
  gameState.zoneGuardiansLeft = 0;
  gameState.bossActive = false;
  gameState.bossName = "";
  gameState.zoneBossSpawned = false;

  if (typeof resetWaveSystem === 'function') resetWaveSystem();
  if (typeof screenShake === 'function') screenShake(12);
  if (typeof showPopup === 'function') {
    const z = ZONE_DATA[mapIndex];
    showPopup(`MAP ${mapIndex + 1}: ${z.icon} ${z.name}`, "Khu vực mới! Hãy khám phá và chiến đấu!");
  }

  // Spawn HP items trên map mới
  if (typeof spawnMapHpItems === 'function') {
    if (typeof gameState !== 'undefined') gameState.items = [];
    spawnMapHpItems(mapIndex, 3);
  }
}

// ── Obstacle ───────────────────────────────────────────────────────────────────
class Obstacle {
  constructor(x, y, w, h, type) {
    this.x = x; this.y = y;
    this.w = w; this.h = h;
    this.type = type;
    this.hp = type === "core" ? 300 : 999;
    this.breakable = type === "debris" || type === "core";
    this.destroyed = false;
    this.radius = 4;
  }

  takeDamage(dmg) {
    if (!this.breakable) return;
    this.hp -= dmg;
    if (this.hp <= 0 && !this.destroyed) {
      this.destroyed = true;
      if (typeof spawnParticles === 'function')
        spawnParticles(this.x + this.w / 2, this.y + this.h / 2, "explosion", 15);
      if (typeof rebuildSpatialGrid === 'function') rebuildSpatialGrid(currentMapIndex);
    }
  }

  draw(ctx) {
    if (this.destroyed) return;
    ctx.save();

    let bgColor, borderColor, glowColor, label = "";
    switch (this.type) {
      case "wall":
        bgColor = "#1a2535"; borderColor = "#2a4060"; glowColor = "#1a3050";
        ctx.shadowBlur = 4; ctx.shadowColor = glowColor;
        break;
      case "neon":
        bgColor = "#1a0830"; borderColor = "#cc44ff"; glowColor = "#cc44ff";
        ctx.shadowBlur = 14; ctx.shadowColor = glowColor;
        break;
      case "server":
        bgColor = "#061a1a"; borderColor = "#00cc88"; glowColor = "#00aa66";
        ctx.shadowBlur = 10; ctx.shadowColor = glowColor;
        label = "▣";
        break;
      case "tree": {
        // Cây pixel-art: thân + 3 lớp tán lá
        const tx = this.x + this.w / 2, ty = this.y + this.h / 2;
        // Bóng
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.ellipse(tx, this.y + this.h - 4, this.w * 0.4, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        // Thân
        ctx.fillStyle = "#4a2c0a";
        ctx.fillRect(tx - 4, ty + 2, 8, this.h / 2 - 2);
        // Tán lá 3 lớp
        const lc = ["#0d5c12", "#117a18", "#16a020"];
        const lr = [this.w * 0.48, this.w * 0.38, this.w * 0.26];
        const lo = [4, -4, -12];
        for (let i = 0; i < 3; i++) {
          ctx.shadowBlur = 6; ctx.shadowColor = "#00ff44";
          ctx.fillStyle = lc[i];
          ctx.beginPath();
          ctx.ellipse(tx, ty + lo[i], lr[i], lr[i] * 0.82, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        // Highlight
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = "#88ffaa";
        ctx.beginPath();
        ctx.ellipse(tx - 4, ty - 14, 5, 4, -0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();
        return;
      }
      case "debris":
        bgColor = "#2a1a0a"; borderColor = "#886644"; glowColor = "#664422";
        ctx.shadowBlur = 4; ctx.shadowColor = glowColor;
        break;
      case "core":
        bgColor = "#220010"; borderColor = "#ff4488"; glowColor = "#ff2266";
        ctx.shadowBlur = 18; ctx.shadowColor = glowColor;
        break;
    }

    ctx.beginPath();
    const r = Math.min(4, this.w / 4, this.h / 4);
    ctx.moveTo(this.x + r, this.y);
    ctx.lineTo(this.x + this.w - r, this.y);
    ctx.quadraticCurveTo(this.x + this.w, this.y, this.x + this.w, this.y + r);
    ctx.lineTo(this.x + this.w, this.y + this.h - r);
    ctx.quadraticCurveTo(this.x + this.w, this.y + this.h, this.x + this.w - r, this.y + this.h);
    ctx.lineTo(this.x + r, this.y + this.h);
    ctx.quadraticCurveTo(this.x, this.y + this.h, this.x, this.y + this.h - r);
    ctx.lineTo(this.x, this.y + r);
    ctx.quadraticCurveTo(this.x, this.y, this.x + r, this.y);
    ctx.closePath();

    ctx.fillStyle = bgColor;
    ctx.fill();
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    if (this.type === "wall" && this.w >= 24 && this.h >= 24) {
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = "#4080aa";
      ctx.fillRect(this.x + 3, this.y + 3, this.w - 6, 4);
      ctx.fillRect(this.x + 3, this.y + 3, 4, this.h - 6);
      ctx.globalAlpha = 1;
    }

    if (this.type === "neon" || this.type === "core") {
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = borderColor;
      ctx.beginPath();
      ctx.arc(this.x + this.w / 2, this.y + this.h / 2, Math.min(this.w, this.h) / 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    if (label) {
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = borderColor;
      ctx.fillText(label, this.x + this.w / 2, this.y + this.h / 2 + 4);
    }

    ctx.restore();
  }
}

// ── Spawn points ───────────────────────────────────────────────────────────────
const MAP_SPAWN_POINTS = [
  { x: 488, y: 356 },  // Map 0
  { x: 488, y: 356 },  // Map 1
  { x: 488, y: 356 },  // Map 2
];

const PLAYER_W = 48, PLAYER_H = 56;
const SPAWN_MARGIN = 90;

function _addObstacle(arr, x, y, w, h, type, mapIdx) {
  if (x < 10 || y < 10 || x + w > MAP_WIDTH - 10 || y + h > MAP_HEIGHT - 10) return;
  const checkPoints = mapIdx !== undefined ? [MAP_SPAWN_POINTS[mapIdx]] : MAP_SPAWN_POINTS;
  for (const sp of checkPoints) {
    const sx = sp.x - SPAWN_MARGIN, sy = sp.y - SPAWN_MARGIN;
    const sw = PLAYER_W + SPAWN_MARGIN * 2, sh = PLAYER_H + SPAWN_MARGIN * 2;
    if (x < sx + sw && x + w > sx && y < sy + sh && y + h > sy) return;
  }
  arr.push(new Obstacle(x, y, w, h, type));
}

function findSafeSpawn(mapIdx) {
  const sp = MAP_SPAWN_POINTS[mapIdx] || MAP_SPAWN_POINTS[0];
  const map = maps[mapIdx];
  if (!map) return sp;
  let ok = true;
  for (const o of map.objects) {
    if (o.destroyed) continue;
    if (sp.x < o.x + o.w && sp.x + PLAYER_W > o.x &&
      sp.y < o.y + o.h && sp.y + PLAYER_H > o.y) { ok = false; break; }
  }
  if (ok) return sp;
  for (let r = 20; r <= 200; r += 20) {
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
      const tx = Math.round(sp.x + Math.cos(a) * r);
      const ty = Math.round(sp.y + Math.sin(a) * r);
      if (tx < 20 || ty < 20 || tx + PLAYER_W > MAP_WIDTH - 20 || ty + PLAYER_H > MAP_HEIGHT - 20) continue;
      let clear = true;
      for (const o of map.objects) {
        if (o.destroyed) continue;
        if (tx < o.x + o.w && tx + PLAYER_W > o.x && ty < o.y + o.h && ty + PLAYER_H > o.y) { clear = false; break; }
      }
      if (clear) return { x: tx, y: ty };
    }
  }
  return sp;
}

// ══════════════════════════════════════════════════════════════════════════════
// BUILD MAPS — Layout gọn, thoáng, có cover chiến thuật
// Spawn điểm giữa bản đồ (488, 356) luôn thoáng
// ══════════════════════════════════════════════════════════════════════════════

// ── MAP 0: ABOUT ME & SKILLS ──────────────────────────────────────────────────
// Chủ đề "Cyber Lab": 4 nhóm server/cây ở góc + cover thập tự giữa sân
function buildMap0() {
  const o = [];
  const a = (x, y, w, h, t) => _addObstacle(o, x, y, w, h, t, 0);

  // ── Viền đơn giản (16px, khe mở 4 góc để enemy chạy thoát) ──────────────
  a(30,  30, 440, 14, "wall");  a(554, 30, 440, 14, "wall");   // top
  a(30, 724, 440, 14, "wall");  a(554,724, 440, 14, "wall");   // bottom
  a(30,  30,  14, 330, "wall"); a(30, 408, 14, 330, "wall");   // left
  a(980, 30,  14, 330, "wall"); a(980,408, 14, 330, "wall");   // right

  // ── Góc TL: cụm server + cây ─────────────────────────────────────────────
  a( 60,  60, 52, 32, "server");
  a(125,  60, 52, 32, "neon");
  a( 60, 108, 28, 28, "tree");
  a(108, 108, 28, 28, "tree");

  // ── Góc TR ────────────────────────────────────────────────────────────────
  a(920,  60, 52, 32, "server");
  a(858,  60, 52, 32, "neon");
  a(920, 108, 28, 28, "tree");
  a(872, 108, 28, 28, "tree");

  // ── Góc BL ────────────────────────────────────────────────────────────────
  a( 60, 640, 52, 32, "server");
  a(125, 640, 52, 32, "neon");
  a( 60, 590, 28, 28, "tree");
  a(108, 590, 28, 28, "tree");

  // ── Góc BR ────────────────────────────────────────────────────────────────
  a(920, 640, 52, 32, "server");
  a(858, 640, 52, 32, "neon");
  a(920, 590, 28, 28, "tree");
  a(872, 590, 28, 28, "tree");

  // ── Cover thập tự trung tâm (4 khối tường nhỏ, xa spawn) ─────────────────
  a(350, 270, 60, 14, "wall");   // trên-trái
  a(614, 270, 60, 14, "wall");   // trên-phải
  a(350, 484, 60, 14, "wall");   // dưới-trái
  a(614, 484, 60, 14, "wall");   // dưới-phải
  a(270, 340, 14, 88, "wall");   // dọc trái
  a(740, 340, 14, 88, "wall");   // dọc phải

  // ── Pillar neon nhỏ trang trí giữa ───────────────────────────────────────
  a(320, 240, 18, 18, "neon");
  a(686, 240, 18, 18, "neon");
  a(320, 510, 18, 18, "neon");
  a(686, 510, 18, 18, "neon");

  // ── Cây rải rác tạo cảnh ──────────────────────────────────────────────────
  a(220, 200, 28, 28, "tree");
  a(790, 200, 28, 28, "tree");
  a(220, 540, 28, 28, "tree");
  a(790, 540, 28, 28, "tree");
  a(200, 370, 24, 24, "tree");
  a(810, 370, 24, 24, "tree");

  return o;
}

// ── MAP 1: PROJECTS ────────────────────────────────────────────────────────────
// Chủ đề "Kho Dự Án": hành lang L-shape 2 bên + cây xen kẽ + cover ngang
function buildMap1() {
  const o = [];
  const a = (x, y, w, h, t) => _addObstacle(o, x, y, w, h, t, 1);

  // ── Viền (kín 4 cạnh, khe giữa trên/dưới cho warp portal) ───────────────
  a(30,  30, 440, 14, "wall");  a(554, 30, 440, 14, "wall");
  a(30, 724, 440, 14, "wall");  a(554,724, 440, 14, "wall");
  a(30,  30,  14, 738, "wall"); // left kín
  a(980, 30,  14, 738, "wall"); // right kín

  // ── Hành lang L-shape TRÁI: tường dọc + ngang tạo shelter ────────────────
  a( 60, 100, 14, 180, "wall");  // dọc
  a( 60, 100, 130, 14, "wall");  // ngang trên
  a( 60, 278, 130, 14, "wall");  // ngang dưới
  a( 60, 480, 14, 180, "wall");  // dọc 2
  a( 60, 480, 130, 14, "wall");  // ngang trên 2
  a( 60, 644, 130, 14, "wall");  // ngang dưới 2
  // Đồ đạc bên trong shelter
  a( 84, 125, 46, 28, "server");
  a(145, 125, 28, 28, "tree");
  a( 84, 505, 46, 28, "server");
  a(145, 505, 28, 28, "tree");

  // ── Hành lang L-shape PHẢI (đối xứng) ────────────────────────────────────
  a(910, 100, 14, 180, "wall");
  a(810, 100, 114, 14, "wall");
  a(810, 278, 114, 14, "wall");
  a(910, 480, 14, 180, "wall");
  a(810, 480, 114, 14, "wall");
  a(810, 644, 114, 14, "wall");
  a(834, 125, 46, 28, "server");
  a(796, 125, 28, 28, "tree");
  a(834, 505, 46, 28, "server");
  a(796, 505, 28, 28, "tree");

  // ── Cover ngang trung tâm ─────────────────────────────────────────────────
  a(330, 230, 80, 14, "wall");
  a(614, 230, 80, 14, "wall");
  a(330, 524, 80, 14, "wall");
  a(614, 524, 80, 14, "wall");

  // ── Cover dọc ─────────────────────────────────────────────────────────────
  a(248, 310, 14, 148, "wall");
  a(762, 310, 14, 148, "wall");

  // ── Pillar nhỏ ────────────────────────────────────────────────────────────
  a(400, 286, 18, 18, "neon");
  a(606, 286, 18, 18, "neon");
  a(400, 464, 18, 18, "neon");
  a(606, 464, 18, 18, "neon");

  // ── Cây rải rác ───────────────────────────────────────────────────────────
  a(200, 350, 26, 26, "tree");
  a(810, 350, 26, 26, "tree");
  a(340, 350, 26, 26, "tree");
  a(658, 350, 26, 26, "tree");
  a(450, 160, 26, 26, "tree");
  a(548, 160, 26, 26, "tree");
  a(450, 580, 26, 26, "tree");
  a(548, 580, 26, 26, "tree");

  return o;
}

// ── MAP 2: CONTACT ────────────────────────────────────────────────────────────
// Chủ đề "Transmission Hub": vành neon ngoài + 4 antenna nhỏ + vườn cây trung tâm
function buildMap2() {
  const o = [];
  const a = (x, y, w, h, t) => _addObstacle(o, x, y, w, h, t, 2);

  // ── Viền neon (khe mở 4 cạnh) ────────────────────────────────────────────
  a( 30,  30, 420, 14, "neon"); a(574,  30, 420, 14, "neon");
  a( 30, 724, 420, 14, "neon"); a(574, 724, 420, 14, "neon");
  a( 30,  30,  14, 320, "neon"); a( 30, 418, 14, 320, "neon");
  a(980,  30,  14, 320, "neon"); a(980, 418, 14, 320, "neon");

  // ── Antenna góc TL ───────────────────────────────────────────────────────
  a( 60,  60,  14, 120, "wall");
  a( 60,  60, 120,  14, "wall");
  a( 74,  74,  44,  28, "server");
  a(130,  74,  28,  28, "tree");

  // ── Antenna góc TR ───────────────────────────────────────────────────────
  a(910,  60,  14, 120, "wall");
  a(810,  60, 120,  14, "wall");
  a(866,  74,  44,  28, "server");
  a(826,  74,  28,  28, "tree");

  // ── Antenna góc BL ───────────────────────────────────────────────────────
  a( 60, 558,  14, 120, "wall");
  a( 60, 664, 120,  14, "wall");
  a( 74, 618,  44,  28, "server");
  a(130, 630,  28,  28, "tree");

  // ── Antenna góc BR ───────────────────────────────────────────────────────
  a(910, 558,  14, 120, "wall");
  a(810, 664, 120,  14, "wall");
  a(866, 618,  44,  28, "server");
  a(826, 630,  28,  28, "tree");

  // ── Tường hướng tâm (8 đoạn, tạo hình sóng phát) ────────────────────────
  a(200, 200, 14, 100, "wall");   // TL dọc
  a(200, 200, 100, 14, "wall");   // TL ngang
  a(810, 200, 14, 100, "wall");   // TR dọc
  a(710, 200, 100, 14, "wall");   // TR ngang
  a(200, 468, 14, 100, "wall");   // BL dọc
  a(200, 554, 100, 14, "wall");   // BL ngang
  a(810, 468, 14, 100, "wall");   // BR dọc
  a(710, 554, 100, 14, "wall");   // BR ngang

  // ── Vườn cây trung tâm (thay cho pillar to) ───────────────────────────────
  a(370, 290, 26, 26, "tree");
  a(414, 290, 26, 26, "tree");
  a(584, 290, 26, 26, "tree");
  a(628, 290, 26, 26, "tree");
  a(370, 452, 26, 26, "tree");
  a(414, 452, 26, 26, "tree");
  a(584, 452, 26, 26, "tree");
  a(628, 452, 26, 26, "tree");

  // ── Cover ngang/dọc nhỏ ───────────────────────────────────────────────────
  a(440, 260, 144, 12, "wall");   // ngang trên
  a(440, 496, 144, 12, "wall");   // ngang dưới
  a(260, 344, 12, 80, "wall");    // dọc trái
  a(752, 344, 12, 80, "wall");    // dọc phải

  // ── Pillar neon nhỏ ───────────────────────────────────────────────────────
  a(330, 330, 16, 16, "neon");
  a(678, 330, 16, 16, "neon");
  a(330, 422, 16, 16, "neon");
  a(678, 422, 16, 16, "neon");

  return o;
}

// ── Map registry ───────────────────────────────────────────────────────────────
const MAP_DEFS = [
  {
    id: 0, zoneId: 0, name: "MAP 1 — ABOUT ME & SKILLS",
    tileA: "#0a1520", tileB: "#0d1a28",
    tileAccent: "rgba(0,200,255,0.07)",
    borderColor: "#00ccff",
    build: buildMap0
  },
  {
    id: 1, zoneId: 1, name: "MAP 2 — PROJECTS",
    tileA: "#1a0e04", tileB: "#1f1106",
    tileAccent: "rgba(255,160,40,0.07)",
    borderColor: "#ffaa00",
    build: buildMap1
  },
  {
    id: 2, zoneId: 2, name: "MAP 3 — CONTACT",
    tileA: "#041510", tileB: "#061a14",
    tileAccent: "rgba(0,255,140,0.07)",
    borderColor: "#00ff88",
    build: buildMap2
  },
];

let maps = [];
let currentMapIndex = 0;

// ── Spatial Grid ───────────────────────────────────────────────────────────────
const CELL_SIZE = 64;
const GRID_COLS = Math.ceil(MAP_WIDTH / CELL_SIZE) + 1;
const GRID_ROWS = Math.ceil(MAP_HEIGHT / CELL_SIZE) + 1;
const spatialGrids = [];

function _buildSpatialGrid(mapIdx) {
  const map = maps[mapIdx];
  if (!map) return;
  const grid = new Map();
  for (const o of map.objects) {
    const c0 = Math.max(0, Math.floor(o.x / CELL_SIZE));
    const c1 = Math.min(GRID_COLS - 1, Math.floor((o.x + o.w) / CELL_SIZE));
    const r0 = Math.max(0, Math.floor(o.y / CELL_SIZE));
    const r1 = Math.min(GRID_ROWS - 1, Math.floor((o.y + o.h) / CELL_SIZE));
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const key = r * GRID_COLS + c;
        if (!grid.has(key)) grid.set(key, []);
        grid.get(key).push(o);
      }
    }
  }
  spatialGrids[mapIdx] = grid;
}

function rebuildSpatialGrid(mapIdx) {
  _buildSpatialGrid(mapIdx);
}

function initMaps() {
  maps = MAP_DEFS.map(def => ({
    ...def,
    objects: def.build()
  }));
  currentMapIndex = 0;
  warpPortal = null;
  cvPortal = null;
  window.cvPortal = null;
  for (let i = 0; i < maps.length; i++) _buildSpatialGrid(i);
}

// ── checkObstacleCollision ─────────────────────────────────────────────────────
let _collisionFrame = 0;
function checkObstacleCollision(x, y, w, h) {
  const grid = spatialGrids[currentMapIndex];
  if (!grid) {
    const map = maps[currentMapIndex];
    if (!map || !map.objects) return false;
    for (const o of map.objects) {
      if (o.destroyed) continue;
      if (x < o.x + o.w && x + w > o.x && y < o.y + o.h && y + h > o.y) return true;
    }
    return false;
  }

  const token = ++_collisionFrame;
  const c0 = Math.max(0, Math.floor(x / CELL_SIZE));
  const c1 = Math.min(GRID_COLS - 1, Math.floor((x + w) / CELL_SIZE));
  const r0 = Math.max(0, Math.floor(y / CELL_SIZE));
  const r1 = Math.min(GRID_ROWS - 1, Math.floor((y + h) / CELL_SIZE));

  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      const cell = grid.get(r * GRID_COLS + c);
      if (!cell) continue;
      for (const o of cell) {
        if (o.destroyed) continue;
        if (o._visitedToken === token) continue;
        o._visitedToken = token;
        if (x < o.x + o.w && x + w > o.x && y < o.y + o.h && y + h > o.y) return true;
      }
    }
  }
  return false;
}

// ── Zone trigger ───────────────────────────────────────────────────────────────
function checkZoneTriggers(player) {
  if (!gameState || gameState.allZonesCleared) {
    // Vẫn check CV portal khi allZonesCleared
    if (cvPortal && cvPortal.active) checkWarpPortal(player);
    return;
  }
  const mapDef = MAP_DEFS[currentMapIndex];
  if (!mapDef) return;
  const zoneId = mapDef.zoneId;

  if (gameState.zonesCleared.includes(zoneId)) {
    if (!warpPortal && !cvPortal && zoneId < 2) spawnWarpPortal(currentMapIndex + 1);
    if (warpPortal || cvPortal) checkWarpPortal(player);
    return;
  }

  if (gameState.zoneActive) {
    if (warpPortal || cvPortal) checkWarpPortal(player);
    return;
  }

  const px = player.x + player.w / 2, py = player.y + player.h / 2;
  const inCenter = px > 280 && px < 744 && py > 180 && py < 588;
  if (inCenter) {
    if (typeof enterZone === 'function') enterZone(zoneId);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// VẼ MAP
// ══════════════════════════════════════════════════════════════════════════════
function drawMap(ctx) {
  const map = maps[currentMapIndex];
  if (!map) return;
  _drawTileFloor(ctx, map);
  drawZoneOverlay(ctx, map);
  map.objects.forEach(o => o.draw(ctx));
  drawWallShadows(ctx, map);
  drawZoneLabel(ctx, map);
  drawWarpPortal(ctx);
}

function _drawTileFloor(ctx, map) {
  const cols = Math.ceil(MAP_WIDTH / TILE) + 1;
  const rows = Math.ceil(MAP_HEIGHT / TILE) + 1;

  ctx.save();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * TILE, y = r * TILE;
      const isAlt = (r + c) % 2 === 0;
      ctx.fillStyle = isAlt ? map.tileA : map.tileB;
      ctx.fillRect(x, y, TILE, TILE);
      ctx.strokeStyle = "rgba(255,255,255,0.035)";
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x, y, TILE, TILE);
    }
  }

  const grad = ctx.createLinearGradient(MAP_WIDTH / 2, 0, MAP_WIDTH / 2, MAP_HEIGHT);
  grad.addColorStop(0, map.tileAccent.replace("0.07", "0.06"));
  grad.addColorStop(0.5, map.tileAccent);
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

  ctx.shadowBlur = 24;
  ctx.shadowColor = map.borderColor;
  ctx.strokeStyle = map.borderColor + "88";
  ctx.lineWidth = 3;
  ctx.strokeRect(8, 8, MAP_WIDTH - 16, MAP_HEIGHT - 16);
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawZoneOverlay(ctx, map) {
  const zoneData = ZONE_DATA[map.zoneId];
  const cleared = gameState && gameState.zonesCleared.includes(map.zoneId);
  const active = gameState && gameState.currentZone === map.zoneId && gameState.zoneActive;
  const t = Date.now() / 2000;

  ctx.save();
  if (active) {
    ctx.globalAlpha = 0.06 + Math.sin(t * 3) * 0.02;
    ctx.fillStyle = zoneData.color;
    ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
    ctx.globalAlpha = 0.3 + Math.sin(t * 3) * 0.1;
    ctx.strokeStyle = zoneData.color;
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 6]);
    ctx.strokeRect(20, 20, MAP_WIDTH - 40, MAP_HEIGHT - 40);
    ctx.setLineDash([]);
  } else if (cleared) {
    ctx.globalAlpha = 0.02;
    ctx.fillStyle = zoneData.color;
    ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawWallShadows(ctx, map) {
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "#000000";
  for (const o of map.objects) {
    if (o.destroyed) continue;
    ctx.fillRect(o.x + 3, o.y + o.h, o.w - 3, 6);
    ctx.fillRect(o.x + o.w, o.y + 3, 6, o.h - 3);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawZoneLabel(ctx, map) {
  const zone = ZONE_DATA[map.zoneId];
  const cleared = gameState && gameState.zonesCleared.includes(map.zoneId);
  const active = gameState && gameState.currentZone === map.zoneId && gameState.zoneActive;

  ctx.save();
  ctx.font = "bold 14px 'Share Tech Mono', monospace";
  ctx.textAlign = "center";

  if (cleared) {
    ctx.shadowBlur = 6; ctx.shadowColor = zone.color + "66";
    ctx.fillStyle = zone.color + "88";
    ctx.fillText("✓ " + zone.icon + " " + zone.name + " — CLEARED", MAP_WIDTH / 2, 46);
  } else if (active) {
    ctx.shadowBlur = 14; ctx.shadowColor = zone.color;
    ctx.fillStyle = zone.color;
    ctx.fillText("⚡ " + zone.icon + " " + zone.name + " ⚡", MAP_WIDTH / 2, 46);
    ctx.font = "11px 'Share Tech Mono', monospace";
    ctx.fillStyle = "#ffffffcc";
    ctx.shadowBlur = 0;
    const waveInfo = typeof currentWave !== 'undefined'
      ? `WAVE ${currentWave}/${totalWaves}  —  Còn lại: ${gameState.zoneGuardiansLeft} quái`
      : `Còn lại: ${gameState.zoneGuardiansLeft} quái`;
    ctx.fillText(waveInfo, MAP_WIDTH / 2, 64);
  } else {
    ctx.shadowBlur = 4; ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.fillStyle = zone.color + "99";
    ctx.fillText(zone.icon + " " + zone.name, MAP_WIDTH / 2, 46);
    ctx.font = "10px monospace";
    ctx.fillStyle = "#ffffff55";
    ctx.fillText("★ Di chuyển vào giữa map để bắt đầu ★", MAP_WIDTH / 2, 64);
  }
  ctx.restore();
}

function drawMapNameHUD(ctx) {
  const map = maps[currentMapIndex];
  if (!map) return;
  ctx.save();
  ctx.font = "italic 10px monospace";
  ctx.fillStyle = ZONE_DATA[map.zoneId].color + "cc";
  ctx.shadowBlur = 4;
  ctx.textAlign = "left";
  ctx.fillText("◈ " + map.name + " ◈", 28, MAP_HEIGHT - 18);
  ctx.restore();
}

// Exports
window.MAP_WIDTH = MAP_WIDTH;
window.MAP_HEIGHT = MAP_HEIGHT;
window.ZONE_TRIGGERS = ZONE_TRIGGERS;
window.initMaps = initMaps;
window.checkObstacleCollision = checkObstacleCollision;
window.checkZoneTriggers = checkZoneTriggers;
window.drawMap = drawMap;
window.maps = maps;
window.currentMapIndex = currentMapIndex;
window.travelToMap = travelToMap;
window.spawnWarpPortal = spawnWarpPortal;
window.drawMapNameHUD = drawMapNameHUD;
window.TILE = TILE;

if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.moveTo(x + r, y);
    this.lineTo(x + w - r, y);
    this.quadraticCurveTo(x + w, y, x + w, y + r);
    this.lineTo(x + w, y + h - r);
    this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.lineTo(x + r, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r);
    this.lineTo(x, y + r);
    this.quadraticCurveTo(x, y, x + r, y);
    return this;
  };
}