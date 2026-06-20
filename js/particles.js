// particles.js
class Particle {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.life = 20;
    this.size = 4;
    this.dx = (Math.random() - 0.5) * 3;
    this.dy = (Math.random() - 0.5) * 3;
    const colors = {
      explosion: "#f80",
      slash: "#0ff",
      dash: "#ff0",
      hack: "#0f0",
      power: "#f0f",
      gun: "#fa0",
      blood: "#a00"
    };
    this.color = colors[type] || "#fff";
  }
  update() {
    this.x += this.dx;
    this.y += this.dy;
    this.life--;
    this.size *= 0.9;
  }
  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.life / 20;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.size, this.size);
    ctx.restore();
  }
}

const PARTICLE_CAP = 120; // hard cap — không bao giờ vượt qua
let particles = [];

function spawnParticles(x, y, type, count = 8) {
  const room = PARTICLE_CAP - particles.length;
  if (room <= 0) return; // đã đầy, bỏ qua
  const actual = Math.min(count, room);
  for (let i = 0; i < actual; i++) {
    particles.push(new Particle(x, y, type));
  }
}

function updateParticles() {
  // Duyệt xuôi, đánh dấu dead thay splice (tránh O(n²))
  let alive = 0;
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    p.update();
    if (p.life > 0 && p.size >= 0.2) {
      particles[alive++] = p;
    }
  }
  particles.length = alive;
}

function drawParticles(ctx) {
  for (let i = 0; i < particles.length; i++) {
    particles[i].draw(ctx);
  }
}