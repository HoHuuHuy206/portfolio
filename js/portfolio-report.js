// ═══════════════════════════════════════════════════════════════════════════════
// PORTFOLIO REPORT MODULE — Màn hình tổng kết cuối game
// ═══════════════════════════════════════════════════════════════════════════════

function buildPortfolioReport() {
  const el = document.getElementById("portfolioReport");
  if (!el) return;

  el.innerHTML = `
    <div class="pr-container">
      <div class="pr-header">
        <div class="pr-scan-line"></div>
        <div class="pr-title-wrap">
          <div class="pr-badge">◈ PORTFOLIO UNLOCKED ◈</div>
          <h1 class="pr-name">HỒ HOÀNG ĐỨC HUY</h1>
          <p class="pr-role">Web Developer Intern · Full Stack & Game Dev</p>
        </div>
        <div class="pr-stats-bar">
          <div class="pr-stat"><span class="ps-val" id="prKills">0</span><span class="ps-lbl">KILLS</span></div>
          <div class="pr-stat"><span class="ps-val">3/3</span><span class="ps-lbl">ZONES</span></div>
          <div class="pr-stat"><span class="ps-val">100%</span><span class="ps-lbl">MEMORY</span></div>
        </div>
      </div>

      <div class="pr-body">

        <!-- About -->
        <div class="pr-card" style="--cc:#00f0ff">
          <div class="pr-card-header">👨 ABOUT ME</div>
          <div class="pr-card-body">
            <div class="pr-row">📍 Trường Thọ, Thủ Đức, TP.HCM</div>
            <div class="pr-row">🎂 03/09/2006</div>
            <div class="pr-row">🏫 Cao đẳng Công nghệ Thủ Đức</div>
            <div class="pr-row">📚 CNTT — Web Development (2024–2027)</div>
            <div class="pr-row">🎯 Mục tiêu: Full-Stack Web Developer</div>
          </div>
        </div>

        <!-- Skills -->
        <div class="pr-card" style="--cc:#ff00ff">
          <div class="pr-card-header">⚙️ SKILLS</div>
          <div class="pr-card-body">
            <div class="pr-skill-grid">
              <div class="pr-skill-item">
                <span class="ski-name">JavaScript</span>
                <div class="ski-bar"><div class="ski-fill" style="width:85%;background:#ff00ff"></div></div>
              </div>
              <div class="pr-skill-item">
                <span class="ski-name">PHP</span>
                <div class="ski-bar"><div class="ski-fill" style="width:75%;background:#ff00ff"></div></div>
              </div>
              <div class="pr-skill-item">
                <span class="ski-name">Laravel</span>
                <div class="ski-bar"><div class="ski-fill" style="width:70%;background:#ff00ff"></div></div>
              </div>
              <div class="pr-skill-item">
                <span class="ski-name">MySQL</span>
                <div class="ski-bar"><div class="ski-fill" style="width:75%;background:#ff00ff"></div></div>
              </div>
              <div class="pr-skill-item">
                <span class="ski-name">HTML / CSS</span>
                <div class="ski-bar"><div class="ski-fill" style="width:80%;background:#ff00ff"></div></div>
              </div>
              <div class="pr-skill-item">
                <span class="ski-name">C#</span>
                <div class="ski-bar"><div class="ski-fill" style="width:55%;background:#ff00ff"></div></div>
              </div>
            </div>
            <div class="pr-tags">
              <span class="pr-tag">HTML5 Canvas</span>
              <span class="pr-tag">Phaser 3</span>
              <span class="pr-tag">Git / GitHub</span>
              <span class="pr-tag">MVC</span>
            </div>
          </div>
        </div>

        <!-- Projects -->
        <div class="pr-card" style="--cc:#ffaa00">
          <div class="pr-card-header">🗂️ PROJECTS</div>
          <div class="pr-card-body">
            <div class="pr-project">
              <div class="prp-name">🌀 HUYVERSE: LOST MEMORY</div>
              <div class="prp-desc">CV tương tác dạng game — chính là game bạn đang chơi! Vanilla JS, HTML5 Canvas</div>
            </div>
            <div class="pr-project">
              <div class="prp-name">🎮 Tank Fighter: Swarm of Orbs</div>
              <div class="prp-desc">Game bắn tăng top-down — Phaser 3, JavaScript</div>
            </div>
            <div class="pr-project">
              <div class="prp-name">🏠 Quản lý Homestay</div>
              <div class="prp-desc">Hệ thống đặt phòng & thanh toán — PHP, Laravel, MySQL</div>
            </div>
            <div class="pr-project">
              <div class="prp-name">🛒 THP Shop</div>
              <div class="prp-desc">Website thương mại điện tử — PHP, MySQL</div>
            </div>
          </div>
        </div>

        <!-- Contact -->
        <div class="pr-card" style="--cc:#00ff88">
          <div class="pr-card-header">📡 CONTACT</div>
          <div class="pr-card-body">
            <div class="pr-contact-item">
              <span class="pci-icon">📧</span>
              <a href="mailto:hohoangduchuy09@gmail.com" class="pci-link">hohoangduchuy09@gmail.com</a>
            </div>
            <div class="pr-contact-item">
              <span class="pci-icon">📞</span>
              <span class="pci-link">0866 734 669</span>
            </div>
            <div class="pr-contact-item">
              <span class="pci-icon">🐙</span>
              <a href="https://github.com/HoHuuHuy206" target="_blank" class="pci-link">github.com/HoHuuHuy206</a>
            </div>
            <div class="pr-contact-item">
              <span class="pci-icon">📘</span>
              <a href="https://www.facebook.com/HoHuuHuy206?locale=vi_VN" target="_blank" class="pci-link">facebook.com/HoHuuHuy206</a>
            </div>
          </div>
        </div>

      </div><!-- end pr-body -->

      <!-- Goals & Live demos -->
      <div class="pr-footer-cards">
        <div class="pr-mini-card">
          <div class="pmc-title">🎯 CAREER GOALS</div>
          <div class="pmc-list">
            <div>Trở thành Full-Stack Web Developer chuyên nghiệp</div>
            <div>Tích lũy kinh nghiệm thực chiến qua dự án thật</div>
            <div>Phát triển kỹ năng teamwork & problem-solving</div>
          </div>
        </div>
        <div class="pr-mini-card">
          <div class="pmc-title">💡 INTERESTS</div>
          <div class="pmc-list">
            <div>Web Development</div>
            <div>Game Development</div>
            <div>Database Management</div>
          </div>
        </div>
        <div class="pr-mini-card">
          <div class="pmc-title">🔗 LIVE DEMOS</div>
          <div class="pmc-list">
            <div><a href="https://homestay.gt.tc/" target="_blank" style="color:inherit;">homestay.gt.tc</a></div>
            <div><a href="https://thpshop.gt.tc/" target="_blank" style="color:inherit;">thpshop.gt.tc</a></div>
          </div>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="pr-actions">
        <a href="cv.html" target="_blank" class="pr-btn pr-btn-primary">
          📄 XEM CV ĐẦY ĐỦ
        </a>
        <a href="mailto:hohoangduchuy09@gmail.com" class="pr-btn pr-btn-secondary">
          📧 LIÊN HỆ NGAY
        </a>
        <button class="pr-btn pr-btn-ghost" onclick="closePortfolioReport()">
          ✕ ĐÓNG
        </button>
      </div>

    </div><!-- end pr-container -->
  `;

  // Update kills count
  const prk = document.getElementById("prKills");
  if (prk) prk.innerText = gameState.kills;
}

function showPortfolioReport() {
  buildPortfolioReport();
  const el = document.getElementById("portfolioReport");
  if (!el) return;
  el.style.display = "flex";
  requestAnimationFrame(() => {
    setTimeout(() => el.classList.add("visible"), 30);
  });
  // Disable game
  window._reportOpen = true;
}

function closePortfolioReport() {
  const el = document.getElementById("portfolioReport");
  if (!el) return;
  el.classList.remove("visible");
  setTimeout(() => { el.style.display = "none"; }, 400);
  window._reportOpen = false;
}