// ═══════════════════════════════════════════════════════════════════════════════
// AUDIO MODULE — HUYVERSE SOUND SYSTEM
// Files: music/boom.wav  music/chem.wav  music/end-game.wav  music/shot.mp3
// ═══════════════════════════════════════════════════════════════════════════════

const AudioManager = (() => {
    const cache = {};
    let muted = false;
    let masterVolume = 0.7;

    // ── Load âm thanh với cache ───────────────────────────────────────────────
    function _load(key, src, volume = 1.0, maxInstances = 4) {
        cache[key] = {
            src,
            volume: volume * masterVolume,
            instances: [],
            maxInstances,
            currentIdx: 0,
        };

        // Pre-create pool instances
        for (let i = 0; i < maxInstances; i++) {
            const audio = new Audio();
            audio.src = src;
            audio.volume = volume * masterVolume;
            audio.preload = "auto";
            cache[key].instances.push(audio);
        }
    }

    // ── Phát âm thanh (dùng pool để tránh cut-off) ───────────────────────────
    function play(key, volumeOverride) {
        if (muted) return;
        const entry = cache[key];
        if (!entry) return;

        const idx = entry.currentIdx % entry.instances.length;
        entry.currentIdx++;

        const audio = entry.instances[idx];
        audio.volume = (volumeOverride !== undefined ? volumeOverride : entry.volume);
        audio.currentTime = 0;

        const promise = audio.play();
        if (promise) promise.catch(() => { }); // bỏ qua lỗi autoplay
    }

    // ── Toggle mute ────────────────────────────────────────────────────────────
    function toggleMute() {
        muted = !muted;
        return muted;
    }

    function setMasterVolume(v) {
        masterVolume = Math.max(0, Math.min(1, v));
        for (const key in cache) {
            cache[key].instances.forEach(a => {
                a.volume = cache[key].volume * masterVolume;
            });
        }
    }

    function isMuted() { return muted; }

    // ── Khởi tạo tất cả âm thanh ─────────────────────────────────────────────
    function init() {
        _load("shot", "music/shot.mp3", 0.45, 6);  // bắn đạn thường
        _load("chem", "music/chem.wav", 0.65, 4);  // chém blade
        _load("boom", "music/boom.wav", 0.85, 3);  // nổ AOE
        _load("endGame", "music/end-game.wav", 0.9, 1);  // nhân vật chết
    }

    return { init, play, toggleMute, setMasterVolume, isMuted };
})();

window.AudioManager = AudioManager;

// ── Tiện ích gọi nhanh ────────────────────────────────────────────────────────
function playSound(key, vol) {
    AudioManager.play(key, vol);
}
window.playSound = playSound;