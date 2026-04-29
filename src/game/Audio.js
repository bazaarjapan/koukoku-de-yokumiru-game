let ctx = null;

export function initAudio() {
  if (!ctx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      ctx = new AudioContext();
    }
  }
  if (ctx && ctx.state === 'suspended') {
    ctx.resume();
  }
}

function playTone(freq, type, duration, vol = 0.1, slideFreq = null) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  if (slideFreq) {
    osc.frequency.exponentialRampToValueAtTime(slideFreq, ctx.currentTime + duration);
  }
  
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function playNoise(duration, vol = 0.1, lowpass = null) {
  if (!ctx) return;
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

  if (lowpass) {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    noise.connect(filter);
    filter.connect(gain);
  } else {
    noise.connect(gain);
  }
  
  gain.connect(ctx.destination);
  noise.start();
}

export function playShoot() {
  playTone(800, 'square', 0.12, 0.04, 300);
}

export function playHit() {
  playNoise(0.1, 0.08, 3000);
}

export function playEnemyDie() {
  playNoise(0.25, 0.12, 1200);
  playTone(200, 'sawtooth', 0.2, 0.05, 50);
}

export function playBossHit() {
  playNoise(0.15, 0.1, 800);
}

export function playBossDie() {
  playNoise(0.8, 0.2, 500);
  playTone(150, 'sawtooth', 0.8, 0.15, 20);
}

export function playPlayerDamage() {
  playNoise(0.3, 0.15, 800);
  playTone(150, 'square', 0.3, 0.1, 40);
}

export function playGate(positive) {
  if (positive) {
    playTone(400, 'sine', 0.1, 0.06);
    setTimeout(() => playTone(600, 'sine', 0.15, 0.06), 80);
    setTimeout(() => playTone(800, 'sine', 0.2, 0.06), 160);
  } else {
    playTone(300, 'sawtooth', 0.2, 0.08, 100);
  }
}

export function playPowerUp() {
  playTone(400, 'square', 0.1, 0.05, 600);
  setTimeout(() => playTone(600, 'square', 0.1, 0.05, 800), 100);
  setTimeout(() => playTone(800, 'square', 0.2, 0.05, 1200), 200);
}

export function playClick() {
  initAudio();
  playTone(600, 'sine', 0.05, 0.08);
}

export function playBossAlert() {
  playTone(200, 'sawtooth', 0.5, 0.1);
  setTimeout(() => playTone(200, 'sawtooth', 0.5, 0.1), 600);
}
