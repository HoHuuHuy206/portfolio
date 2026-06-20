// input.js
const input = {
  up: false,
  down: false,
  left: false,
  right: false,
  blade: false,
  gun: false,
  dash: false,
  hack: false,
  power: false
};

const keyMap = {
  "KeyW": "up",
  "ArrowUp": "up",
  "KeyS": "down",
  "ArrowDown": "down",
  "KeyA": "left",
  "ArrowLeft": "left",
  "KeyD": "right",
  "ArrowRight": "right",
  "KeyZ": "blade",
  "KeyX": "gun",
  "ShiftLeft": "dash",
  "ShiftRight": "dash",
  "KeyE": "hack",
  "KeyC": "power"
};

window.addEventListener("keydown", e => {
  let action = keyMap[e.code];
  if (action) {
    input[action] = true;
    e.preventDefault();
  }
});

window.addEventListener("keyup", e => {
  let action = keyMap[e.code];
  if (action) {
    input[action] = false;
    e.preventDefault();
  }
});

// Fix lỗi nhân vật tự di chuyển: reset tất cả phím khi mất focus
function resetAllKeys() {
  for (let k in input) input[k] = false;
}
window.addEventListener("blur", resetAllKeys);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) resetAllKeys();
});