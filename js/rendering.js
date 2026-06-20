// rendering.js
function drawHUD(ctx, state) {
  const hpBar = document.getElementById("hpBar");
  if (hpBar) hpBar.style.width = Math.max(0, (state.hp / state.maxHp) * 100) + "%";

  const killSpan = document.getElementById("killCount");
  if (killSpan) killSpan.innerText = "KILLS: " + state.kills;

  // BUG FIX: sync explosive display mỗi frame tránh stale
  const stockDiv = document.getElementById("explosiveStockDisplay");
  if (stockDiv) stockDiv.innerText = "💥 Đạn nổ: " + state.explosiveStock + "/" + state.explosiveMax;

  const bossWrap = document.getElementById("bossHpWrap");
  if (bossWrap) {
    if (state.bossActive) {
      bossWrap.style.display = "block";
      const bossBar = document.getElementById("bossBar");
      const bossNameSpan = document.getElementById("bossName");
      if (bossBar) bossBar.style.width = Math.max(0, (state.bossHp / state.bossMaxHp) * 100) + "%";
      if (bossNameSpan) bossNameSpan.innerText = state.bossName;
    } else {
      bossWrap.style.display = "none";
    }
  }
}

function showPopup(title, text) {
  const pop = document.getElementById("popup");
  const titleSpan = document.getElementById("popTitle");
  const textSpan = document.getElementById("popText");
  if (pop && titleSpan && textSpan) {
    titleSpan.innerText = title;
    textSpan.innerText = text;
    pop.style.display = "block";
    // Clear old timer
    if (pop._hideTimer) clearTimeout(pop._hideTimer);
    pop._hideTimer = setTimeout(() => { pop.style.display = "none"; }, 2500);
  }
}

function showDialogue(speaker, text) {
  const dlg = document.getElementById("dialogue");
  const speakerSpan = document.getElementById("dlgSpeaker");
  const textSpan = document.getElementById("dlgText");
  if (dlg && speakerSpan && textSpan) {
    speakerSpan.innerText = speaker;
    textSpan.innerText = text;
    dlg.style.display = "block";
    setTimeout(() => { dlg.style.display = "none"; }, 3000);
  }
}