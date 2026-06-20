// game-state.js — HUYVERSE 3-ZONE PORTFOLIO SYSTEM

// ── Zone Definitions (Portfolio Data) ─────────────────────────────────────────
const ZONE_DATA = [
  {
    id: 0,
    name: "ABOUT ME & SKILLS",
    icon: "👨",
    color: "#00f0ff",
    guardianName: "◈ IDENTITY.VIRUS ◈",
    guardianCount: 16,
    bossName: "◈ IDENTITY.VIRUS ◈",
    bossColor: "#00f0ff",
    content: [
      "Hồ Hoàng Đức Huy",
      "Sinh viên Công nghệ Thông tin",
      "Cao đẳng Công nghệ Thủ Đức",
      "Web Developer Intern  |  Khoá: 2024–2027",
      "─────────────────────",
      "Skills: JavaScript · PHP · C#",
      "Laravel · MySQL · HTML/CSS",
      "Canvas API · Phaser 3"
    ]
  },
  {
    id: 1,
    name: "PROJECTS",
    icon: "🗂️",
    color: "#ffaa00",
    guardianName: "◈ BUG.HUNTER ◈",
    guardianCount: 22,
    bossName: "◈ DEADLINE.DEMON ◈",
    bossColor: "#ffaa00",
    content: [
      "Tank Fighter: Swarm of Orbs (Phaser 3 + JS)",
      "Quản lý Homestay (PHP + Laravel + MySQL)",
      "THP Shop — E-commerce (PHP + MySQL)",
      "HUYVERSE: Lost Memory (JS + Canvas) — chính game này!"
    ]
  },
  {
    id: 2,
    name: "CONTACT",
    icon: "📡",
    color: "#00ff88",
    guardianName: "◈ FIREWALL.EX ◈",
    guardianCount: 28,
    bossName: "◈ ENCRYPTION.GOD ◈",
    bossColor: "#00ff88",
    content: [
      "📧 hohoangduchuy09@gmail.com",
      "📞 0866 734 669",
      "🐙 github.com/HoHuuHuy206",
      "📘 facebook.com/HoHuuHuy206",
      "📄 Đánh boss để mở Portfolio PDF!"
    ]
  }
];

const gameState = {
  hp: 500, maxHp: 500,
  energy: 100, maxEnergy: 100,
  kills: 0, wave: 1,
  bossActive: false, bossHp: 0, bossMaxHp: 0, bossName: "",
  items: [],
  explosiveStock: 0, explosiveMax: 3,

  // Zone system
  currentZone: -1,
  zonesCleared: [],
  zoneActive: false,
  zoneGuardiansLeft: 0,
  allZonesCleared: false,

  // Boss phase
  zoneBossSpawned: false,

  // Session
  startTime: 0,
  isDead: false
};

// ── Damage / Heal ──────────────────────────────────────────────────────────────
function takeDamage(amount) {
  if (gameState.isDead) return;
  gameState.hp = Math.max(0, gameState.hp - amount);
  updateHPBar();
  if (gameState.hp <= 0) {
    gameState.isDead = true;
    triggerGameOver();
  }
}

function triggerGameOver() {
  window._gameOverActive = true;
  window.running = false;

  // Hủy animation loop
  if (window.animFrameId) {
    cancelAnimationFrame(window.animFrameId);
    window.animFrameId = null;
  }

  // Âm thanh chết
  if (typeof playSound === 'function') playSound("endGame");

  // Flash đỏ màn hình
  const canvas = document.getElementById("gameCanvas");
  if (canvas) {
    canvas.style.transition = "box-shadow 0.1s";
    canvas.style.boxShadow = "inset 0 0 100px rgba(255,0,0,0.9)";
    setTimeout(() => { canvas.style.boxShadow = ""; }, 500);
  }

  // Cập nhật thống kê
  const goZones = document.getElementById("goZones");
  const goKills = document.getElementById("goKills");
  const goMsg   = document.getElementById("goMsg");
  if (goZones) goZones.innerText = `${gameState.zonesCleared.length} / 3`;
  if (goKills) goKills.innerText = gameState.kills;
  const msgs = [
    "Kẻ thù đã đánh bại bạn. Hãy thử lại!",
    "Ký ức chưa được phục hồi. Chiến đấu tiếp!",
    "Hệ thống sụp đổ. Khởi động lại...",
    "CONNECTION LOST. Reconnecting..."
  ];
  if (goMsg) goMsg.innerText = msgs[Math.floor(Math.random() * msgs.length)];

  // Hiện màn hình game over sau 800ms
  setTimeout(() => {
    const goScreen = document.getElementById("gameOverScreen");
    if (goScreen) {
      goScreen.style.display = "flex";
      requestAnimationFrame(() => {
        setTimeout(() => goScreen.classList.add("visible"), 20);
      });
    }
  }, 800);
}

// Quay về màn hình chính (title screen)
function goToTitle() {
  window._gameOverActive = true;
  window.running = false;

  if (window.animFrameId) {
    cancelAnimationFrame(window.animFrameId);
    window.animFrameId = null;
  }

  // Ẩn game over screen
  const goScreen = document.getElementById("gameOverScreen");
  if (goScreen) {
    goScreen.classList.remove("visible");
    setTimeout(() => { goScreen.style.display = "none"; }, 350);
  }

  // Đóng các màn hình phụ
  if (typeof closePortfolioReport === 'function') closePortfolioReport();
  const zonePanel = document.getElementById("zonePanel");
  if (zonePanel) zonePanel.style.display = "none";

  // Hiện title screen
  setTimeout(() => {
    const screen = document.getElementById("screen");
    if (screen) screen.style.display = "flex";
  }, 400);
}
window.goToTitle = goToTitle;

function updateHPBar() {
  const hpBar = document.getElementById("hpBar");
  if (hpBar) hpBar.style.width = Math.max(0, (gameState.hp / gameState.maxHp) * 100) + "%";
}

function heal(amount) {
  gameState.hp = Math.min(gameState.maxHp, gameState.hp + amount);
  updateHPBar();
}

// ── Kill tracking ──────────────────────────────────────────────────────────────
function addKill() {
  gameState.kills++;
  const killSpan = document.getElementById("killCount");
  if (killSpan) killSpan.innerText = "KILLS: " + gameState.kills;

  // Mỗi 4 kills: hồi phục 15HP
  if (gameState.kills % 4 === 0) {
    heal(15);
    if (typeof showPopup === 'function')
      showPopup("💊 +15 HP", `Hồi phục từ chiến đấu! (${Math.min(gameState.hp, gameState.maxHp)} / ${gameState.maxHp})`);
    if (typeof spawnParticles === 'function' && window.player)
      spawnParticles(window.player.x + window.player.w / 2, window.player.y + window.player.h / 2, "hack", 10);
  }

  // Mỗi 3 kills: nhận đạn nổ
  if (gameState.kills % 3 === 0 && gameState.explosiveStock < gameState.explosiveMax) {
    gameState.explosiveStock++;
    if (typeof showPopup === 'function')
      showPopup("⚡ Đạn nổ +1", `Nhấn C để bắn! (${gameState.explosiveStock}/${gameState.explosiveMax})`);
    updateExplosiveDisplay();
  }
}

// ── Zone System ────────────────────────────────────────────────────────────────
function enterZone(zoneId) {
  if (gameState.zonesCleared.includes(zoneId)) return;
  if (gameState.zoneActive) return;
  if (gameState.currentZone === zoneId) return;
  if (typeof window !== 'undefined') window._zoneClearCalled = false;

  const zone = ZONE_DATA[zoneId];
  gameState.currentZone = zoneId;
  gameState.zoneActive = true;
  gameState.zoneGuardiansLeft = zone.guardianCount;
  gameState.zoneBossSpawned = false;
  gameState.bossActive = true;
  gameState.bossName = zone.guardianName;
  gameState.bossHp = zone.guardianCount;
  gameState.bossMaxHp = zone.guardianCount;

  if (typeof showPopup === 'function')
    showPopup(`${zone.icon} ${zone.name}`, `Guardian: ${zone.guardianName} — Tiêu diệt ${zone.guardianCount} kẻ thù!`);
  if (typeof screenShake === 'function') screenShake(15);

  if (typeof initZoneWaves === 'function') initZoneWaves(zoneId);
  else if (typeof spawnZoneEnemies === 'function') spawnZoneEnemies(zoneId);

  updateZoneProgress();
  updateWaveDisplay();
}

function clearCurrentZone() {
  if (!gameState.zoneActive) return;
  const zoneId = gameState.currentZone;
  const zone = ZONE_DATA[zoneId];

  gameState.zoneActive = false;
  gameState.bossActive = false;
  gameState.zoneBossSpawned = false;
  gameState.zonesCleared.push(zoneId);

  const dot = document.getElementById(`zdot-${zoneId}`);
  if (dot) { dot.classList.add("cleared"); }

  showZonePanel(zone);

  if (typeof spawnHpItem === 'function') spawnHpItem();

  // ── 3 zones: mỗi zone clear xong spawn warp portal sang map tiếp ─────────
  if (gameState.zonesCleared.length >= 3) {
    // Tất cả zones cleared — map 3 boss chết → hiện portfolio report
    gameState.allZonesCleared = true;
    setTimeout(() => {
      // Spawn warp portal đặc biệt dẫn đến PDF
      if (typeof spawnCVPortal === 'function') spawnCVPortal();
      if (typeof showPortfolioReport === 'function') showPortfolioReport();
    }, 2000);
  } else {
    // Còn map tiếp theo
    const nextMapIndex = zoneId + 1;
    setTimeout(() => {
      if (typeof spawnWarpPortal === 'function') spawnWarpPortal(nextMapIndex);
      if (typeof showPopup === 'function')
        showPopup("🌀 WARP PORTAL MỞ", "Di chuyển đến cổng dịch chuyển để sang Map " + (nextMapIndex + 1) + "!");
    }, 1500);
  }

  updateZoneProgress();
  updateWaveDisplay();
}

function showZonePanel(zone) {
  const panel = document.getElementById("zonePanel");
  document.getElementById("zonePanelIcon").innerText = zone.icon;
  document.getElementById("zonePanelTitle").innerText = zone.name;
  document.getElementById("zonePanelContent").innerHTML =
    zone.content.map(line => `<div class="zpline">${line}</div>`).join("");
  panel.style.borderColor = zone.color;
  panel.style.boxShadow = `0 0 40px ${zone.color}44`;
  document.getElementById("zonePanelTitle").style.color = zone.color;
  panel.style.display = "flex";
}

function closeZonePanel() {
  document.getElementById("zonePanel").style.display = "none";
}

function updateZoneProgress() {
  ZONE_DATA.forEach(z => {
    const dot = document.getElementById(`zdot-${z.id}`);
    if (!dot) return;
    if (gameState.zonesCleared.includes(z.id)) {
      dot.classList.add("cleared");
      dot.classList.remove("active");
    } else if (gameState.currentZone === z.id && gameState.zoneActive) {
      dot.classList.add("active");
      dot.classList.remove("cleared");
    } else {
      dot.classList.remove("active", "cleared");
    }
  });
  const waveSpan = document.getElementById("waveInfo");
  if (waveSpan) waveSpan.innerText = `ZONE ${gameState.zonesCleared.length} / 3`;
}

function updateWaveDisplay() {
  updateZoneProgress();
}

// ── Explosive display ──────────────────────────────────────────────────────────
function updateExplosiveDisplay() {
  let stockDiv = document.getElementById("explosiveStockDisplay");
  if (stockDiv) {
    stockDiv.innerText = "💥 Đạn nổ: " + gameState.explosiveStock + "/" + gameState.explosiveMax;
  }
}

// ── Reset ──────────────────────────────────────────────────────────────────────
function resetGame() {
  gameState.hp = gameState.maxHp;
  gameState.energy = 100;
  gameState.kills = 0;
  gameState.wave = 1;
  gameState.bossActive = false;
  gameState.explosiveStock = 0;
  gameState.items = [];
  gameState.currentZone = -1;
  gameState.zonesCleared = [];
  gameState.zoneActive = false;
  gameState.zoneGuardiansLeft = 0;
  gameState.allZonesCleared = false;
  gameState.zoneBossSpawned = false;
  gameState.isDead = false;
  gameState.startTime = Date.now();
  window._gameOverActive = false;

  updateExplosiveDisplay();
  updateZoneProgress();
  updateHPBar();

  if (window.player) {
    window.player.x = 480; window.player.y = 350;
    window.player.cooldowns = { blade: 0, gun: 0, dash: 0, hack: 0, explosive: 0 };
    window.player.attackTime = 0;
    window.player.isDashing = false;
  }

  if (typeof resetBoss === 'function') resetBoss();
  else { window.boss = null; }
  if (typeof resetWaveSystem === 'function') resetWaveSystem();
  if (typeof resetBullets === 'function') resetBullets();
  if (typeof resetChest === 'function') resetChest();

  ZONE_DATA.forEach(z => {
    const dot = document.getElementById(`zdot-${z.id}`);
    if (dot) dot.classList.remove("cleared", "active");
  });

  closeZonePanel();
  if (typeof closePortfolioReport === 'function') closePortfolioReport();

  const goScreen = document.getElementById("gameOverScreen");
  if (goScreen) {
    goScreen.classList.remove("visible");
    goScreen.style.display = "none";
  }
}

// ── HP Items ──────────────────────────────────────────────────────────────────

// Vị trí cố định (an toàn, thoáng) cho mỗi map
const HP_ITEM_SPOTS = [
  // Map 0 — Cyber Lab
  [
    { x: 180, y: 360 }, { x: 830, y: 360 },
    { x: 488, y: 180 }, { x: 488, y: 580 },
    { x: 260, y: 220 }, { x: 720, y: 220 },
  ],
  // Map 1 — Projects
  [
    { x: 200, y: 360 }, { x: 800, y: 360 },
    { x: 488, y: 160 }, { x: 488, y: 590 },
    { x: 380, y: 290 }, { x: 620, y: 290 },
  ],
  // Map 2 — Contact
  [
    { x: 300, y: 360 }, { x: 720, y: 360 },
    { x: 488, y: 200 }, { x: 488, y: 560 },
    { x: 200, y: 490 }, { x: 800, y: 490 },
  ],
];

// Spawn 3 cục HP rải đều trên map hiện tại (gọi khi bắt đầu map hoặc sau zone clear)
function spawnMapHpItems(mapIndex, count) {
  const spots = HP_ITEM_SPOTS[mapIndex || 0] || HP_ITEM_SPOTS[0];
  count = count || 3;
  // Không spam nếu đã đủ
  if (gameState.items.length >= count) return;
  // Shuffle spots và lấy đủ count
  const shuffled = spots.slice().sort(() => Math.random() - 0.5);
  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    const s = shuffled[i];
    // Kiểm tra không trùng với item đang có
    const already = gameState.items.some(it => Math.hypot(it.x - s.x, it.y - s.y) < 60);
    if (!already) {
      gameState.items.push({
        x: s.x, y: s.y,
        w: 24, h: 24, type: "hp",
        pulse: Math.random() * Math.PI * 2  // phase lệch nhau
      });
    }
  }
}
window.spawnMapHpItems = spawnMapHpItems;

// Spawn 1 cục ngẫu nhiên (dùng khi zone clear)
function spawnHpItem() {
  const mapIdx = typeof currentMapIndex !== 'undefined' ? currentMapIndex : 0;
  const spots = HP_ITEM_SPOTS[mapIdx] || HP_ITEM_SPOTS[0];
  // Ưu tiên spot chưa có item
  const free = spots.filter(s =>
    !gameState.items.some(it => Math.hypot(it.x - s.x, it.y - s.y) < 80)
  );
  const chosen = free.length > 0
    ? free[Math.floor(Math.random() * free.length)]
    : { x: Math.random() * (MAP_WIDTH - 100) + 50, y: Math.random() * (MAP_HEIGHT - 100) + 50 };

  gameState.items.push({
    x: chosen.x, y: chosen.y,
    w: 24, h: 24, type: "hp",
    pulse: 0
  });
}

function drawHpItem(ctx, item) {
  item.pulse = (item.pulse || 0) + 0.07;
  const glow = 6 + Math.sin(item.pulse) * 4;
  const scale = 1 + Math.sin(item.pulse * 1.2) * 0.08;
  ctx.save();
  ctx.translate(item.x + 12, item.y + 12);
  ctx.scale(scale, scale);
  ctx.shadowBlur = glow;
  ctx.shadowColor = "#ff0055";
  // Nền tròn mờ
  ctx.globalAlpha = 0.25 + Math.sin(item.pulse) * 0.1;
  ctx.fillStyle = "#ff0055";
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.fill();
  // Hình chữ thập
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#ff2266";
  ctx.fillRect(-4, -12, 8, 24);  // dọc
  ctx.fillRect(-12, -4, 24, 8);  // ngang
  // Highlight trắng nhỏ
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(-2, -10, 4, 5);
  ctx.restore();
}

function updateItems(player) {
  for (let i = gameState.items.length - 1; i >= 0; i--) {
    let it = gameState.items[i];
    if (Math.hypot(player.x + player.w / 2 - (it.x + 12),
                   player.y + player.h / 2 - (it.y + 12)) < 38) {
      heal(50);
      if (typeof showPopup === 'function') showPopup("💊 HỒI PHỤC", "+50 HP phục hồi");
      if (typeof spawnParticles === 'function')
        spawnParticles(it.x + 12, it.y + 12, "hack", 12);
      gameState.items.splice(i, 1);
    }
  }
}