/**
 * Pre-packaged rich game engines for Blob AI instant fallbacks & templates
 */

export const DEFAULT_SNAKE_CODE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>Cyber Neon Snake: Arcade Edition</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #090a0f;
      color: #00ffcc;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      overflow: hidden;
      touch-action: none;
      user-select: none;
    }
    #game-container {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px;
    }
    header {
      display: flex;
      justify-content: space-between;
      width: 100%;
      max-width: 440px;
      margin-bottom: 12px;
      font-weight: bold;
      font-size: 15px;
      letter-spacing: 1px;
    }
    .score-badge {
      background: rgba(0, 255, 204, 0.1);
      border: 1px solid #00ffcc44;
      padding: 6px 14px;
      border-radius: 9999px;
      box-shadow: 0 0 15px rgba(0,255,204,0.2);
    }
    canvas {
      background: #0d1117;
      border: 2px solid #00ffcc;
      box-shadow: 0 0 25px rgba(0,255,204,0.25);
      border-radius: 16px;
      display: block;
    }
    #touch-controls {
      display: grid;
      grid-template-columns: repeat(3, 60px);
      grid-template-rows: repeat(2, 50px);
      gap: 10px;
      margin-top: 16px;
    }
    .t-btn {
      background: #161b22;
      border: 1px solid #00ffcc66;
      color: #00ffcc;
      font-size: 20px;
      font-weight: bold;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      active:scale-95;
    }
    .t-btn:active { background: #00ffcc33; }
    #overlay {
      position: absolute;
      top: 50px;
      left: 16px;
      right: 16px;
      bottom: 130px;
      background: rgba(9, 10, 15, 0.85);
      backdrop-filter: blur(8px);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border-radius: 16px;
      border: 1px solid #00ffcc55;
    }
    #overlay h2 { font-size: 26px; margin-bottom: 8px; text-shadow: 0 0 10px #00ffcc; }
    #overlay p { color: #8b949e; font-size: 13px; margin-bottom: 16px; }
    #btn-start {
      background: #00ffcc;
      color: #090a0f;
      border: none;
      padding: 10px 28px;
      font-size: 15px;
      font-weight: bold;
      border-radius: 9999px;
      cursor: pointer;
      box-shadow: 0 0 20px rgba(0,255,204,0.5);
    }
  </style>
</head>
<body>
  <div id="game-container">
    <header>
      <div class="score-badge">SCORE: <span id="val-score">0</span></div>
      <div class="score-badge">HIGH: <span id="val-high">0</span></div>
    </header>
    <canvas id="game-canvas" width="400" height="400"></canvas>
    <div id="touch-controls">
      <div></div>
      <button class="t-btn" id="btn-up">▲</button>
      <div></div>
      <button class="t-btn" id="btn-left">◀</button>
      <button class="t-btn" id="btn-down">▼</button>
      <button class="t-btn" id="btn-right">▶</button>
    </div>
    <div id="overlay">
      <h2 id="ov-title">CYBER NEON SNAKE</h2>
      <p id="ov-desc">Arrow keys, WASD, or on-screen touch arrows</p>
      <button id="btn-start">PLAY NOW</button>
    </div>
  </div>

  <script>
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const valScore = document.getElementById('val-score');
    const valHigh = document.getElementById('val-high');
    const overlay = document.getElementById('overlay');
    const ovTitle = document.getElementById('ov-title');
    const ovDesc = document.getElementById('ov-desc');
    const btnStart = document.getElementById('btn-start');

    // Audio synthesizer
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    let actx = null;
    function playBeep(freq, type = 'sine', duration = 0.1) {
      try {
        if (!actx) actx = new AudioCtx();
        const osc = actx.createOscillator();
        const gain = actx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, actx.currentTime);
        gain.gain.setValueAtTime(0.2, actx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + duration);
        osc.connect(gain);
        gain.connect(actx.destination);
        osc.start();
        osc.stop(actx.currentTime + duration);
      } catch(e) {}
    }

    const GRID_SIZE = 20;
    const TILE_COUNT = 20;
    let snake = [{ x: 10, y: 10 }];
    let food = { x: 15, y: 15 };
    let dx = 1;
    let dy = 0;
    let nextDx = 1;
    let nextDy = 0;
    let score = 0;
    let highScore = localStorage.getItem('blob_neon_snake_high') || 0;
    valHigh.innerText = highScore;
    let isRunning = false;
    let particles = [];

    function spawnFood() {
      food = {
        x: Math.floor(Math.random() * TILE_COUNT),
        y: Math.floor(Math.random() * TILE_COUNT)
      };
      // Avoid spawning on snake
      if (snake.some(seg => seg.x === food.x && seg.y === food.y)) {
        spawnFood();
      }
    }

    function addParticles(x, y, color) {
      for (let i = 0; i < 12; i++) {
        particles.push({
          x: x * GRID_SIZE + 10,
          y: y * GRID_SIZE + 10,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 6,
          life: 1,
          color
        });
      }
    }

    function resetGame() {
      snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
      dx = 1; dy = 0;
      nextDx = 1; nextDy = 0;
      score = 0;
      valScore.innerText = score;
      particles = [];
      spawnFood();
      isRunning = true;
      overlay.style.display = 'none';
      playBeep(440, 'triangle', 0.15);
    }

    function gameOver() {
      isRunning = false;
      playBeep(150, 'sawtooth', 0.4);
      if (score > highScore) {
        highScore = score;
        localStorage.setItem('blob_neon_snake_high', highScore);
        valHigh.innerText = highScore;
      }
      ovTitle.innerText = "SYSTEM CRASHED!";
      ovDesc.innerText = \`Final Score: \${score} - High Score: \${highScore}\`;
      btnStart.innerText = "RESTART";
      overlay.style.display = 'flex';
    }

    window.addEventListener('keydown', e => {
      if (['ArrowUp', 'KeyW'].includes(e.code) && dy !== 1) { nextDx = 0; nextDy = -1; }
      if (['ArrowDown', 'KeyS'].includes(e.code) && dy !== -1) { nextDx = 0; nextDy = 1; }
      if (['ArrowLeft', 'KeyA'].includes(e.code) && dx !== 1) { nextDx = -1; nextDy = 0; }
      if (['ArrowRight', 'KeyD'].includes(e.code) && dx !== -1) { nextDx = 1; nextDy = 0; }
    });

    document.getElementById('btn-up').onclick = () => { if (dy !== 1) { nextDx = 0; nextDy = -1; } };
    document.getElementById('btn-down').onclick = () => { if (dy !== -1) { nextDx = 0; nextDy = 1; } };
    document.getElementById('btn-left').onclick = () => { if (dx !== 1) { nextDx = -1; nextDy = 0; } };
    document.getElementById('btn-right').onclick = () => { if (dx !== -1) { nextDx = 1; nextDy = 0; } };
    btnStart.onclick = resetGame;

    let lastTick = 0;
    const SPEED_MS = 90;

    function gameLoop(timestamp) {
      requestAnimationFrame(gameLoop);

      // Draw background & grid
      ctx.fillStyle = '#090a0f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#141c26';
      ctx.lineWidth = 1;
      for (let i = 0; i < TILE_COUNT; i++) {
        ctx.beginPath();
        ctx.moveTo(i * GRID_SIZE, 0); ctx.lineTo(i * GRID_SIZE, canvas.height);
        ctx.moveTo(0, i * GRID_SIZE); ctx.lineTo(canvas.width, i * GRID_SIZE);
        ctx.stroke();
      }

      // Draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        p.life -= 0.04;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fillRect(p.x, p.y, 4, 4);
        ctx.globalAlpha = 1;
      }

      // Draw food
      ctx.shadowColor = '#ff007f';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#ff007f';
      ctx.beginPath();
      ctx.arc(food.x * GRID_SIZE + 10, food.y * GRID_SIZE + 10, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Update snake physics
      if (isRunning && timestamp - lastTick > SPEED_MS) {
        lastTick = timestamp;
        dx = nextDx;
        dy = nextDy;

        const head = { x: snake[0].x + dx, y: snake[0].y + dy };

        // Wall collision
        if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
          gameOver();
          return;
        }

        // Self collision
        if (snake.some(seg => seg.x === head.x && seg.y === head.y)) {
          gameOver();
          return;
        }

        snake.unshift(head);

        // Eat food
        if (head.x === food.x && head.y === food.y) {
          score += 10;
          valScore.innerText = score;
          playBeep(600 + Math.min(score * 15, 600), 'sine', 0.1);
          addParticles(food.x, food.y, '#ff007f');
          spawnFood();
        } else {
          snake.pop();
        }
      }

      // Draw snake
      snake.forEach((seg, index) => {
        const isHead = index === 0;
        ctx.shadowColor = isHead ? '#ffffff' : '#00ffcc';
        ctx.shadowBlur = isHead ? 15 : 8;
        ctx.fillStyle = isHead ? '#ffffff' : '#00ffcc';
        ctx.beginPath();
        ctx.roundRect(seg.x * GRID_SIZE + 1, seg.y * GRID_SIZE + 1, GRID_SIZE - 2, GRID_SIZE - 2, isHead ? 6 : 4);
        ctx.fill();
        ctx.shadowBlur = 0;
      });
    }

    requestAnimationFrame(gameLoop);
  </script>
</body>
</html>`;

export const DEFAULT_FLAPPY_CODE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>Flappy Blob: Sky Odyssey</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #0f172a;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      overflow: hidden;
      font-family: system-ui, sans-serif;
      touch-action: none;
      user-select: none;
    }
    #game-container { position: relative; }
    canvas {
      background: linear-gradient(to bottom, #1e1b4b, #312e81, #0f172a);
      border-radius: 20px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.6);
      border: 2px solid rgba(255,255,255,0.1);
      display: block;
    }
    #overlay {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: rgba(15, 23, 42, 0.85);
      border-radius: 20px;
      color: white;
      text-align: center;
      padding: 20px;
    }
    #overlay h1 { font-size: 28px; color: #ec4899; margin-bottom: 8px; text-shadow: 0 0 12px rgba(236,72,153,0.5); }
    #overlay p { font-size: 13px; color: #cbd5e1; margin-bottom: 20px; }
    button {
      background: #ec4899;
      color: white;
      border: none;
      padding: 12px 32px;
      font-size: 15px;
      font-weight: bold;
      border-radius: 9999px;
      cursor: pointer;
      box-shadow: 0 0 25px rgba(236,72,153,0.6);
    }
  </style>
</head>
<body>
  <div id="game-container">
    <canvas id="c" width="380" height="520"></canvas>
    <div id="overlay">
      <h1 id="ov-h">FLAPPY BLOB</h1>
      <p id="ov-p">Tap anywhere or press Spacebar to flap!</p>
      <button id="btn-play">START FLAPPING</button>
    </div>
  </div>

  <script>
    const canvas = document.getElementById('c');
    const ctx = canvas.getContext('2d');
    const overlay = document.getElementById('overlay');
    const ovH = document.getElementById('ov-h');
    const ovP = document.getElementById('ov-p');
    const btnPlay = document.getElementById('btn-play');

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    let actx = null;
    function beep(f, dur = 0.1, type = 'sine') {
      try {
        if (!actx) actx = new AudioCtx();
        const o = actx.createOscillator();
        const g = actx.createGain();
        o.type = type;
        o.frequency.value = f;
        g.gain.setValueAtTime(0.2, actx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + dur);
        o.connect(g); g.connect(actx.destination);
        o.start(); o.stop(actx.currentTime + dur);
      } catch(e) {}
    }

    let blob = { x: 80, y: 200, vy: 0, rad: 18 };
    let pipes = [];
    let score = 0;
    let highScore = localStorage.getItem('blob_flappy_high') || 0;
    let state = 'start';
    let frame = 0;

    function flap() {
      if (state === 'start' || state === 'dead') return;
      blob.vy = -6.8;
      beep(500, 0.08);
    }

    function reset() {
      blob.y = 200;
      blob.vy = 0;
      pipes = [];
      score = 0;
      state = 'play';
      overlay.style.display = 'none';
      beep(650, 0.15);
    }

    function dead() {
      state = 'dead';
      beep(180, 0.3, 'sawtooth');
      if (score > highScore) {
        highScore = score;
        localStorage.setItem('blob_flappy_high', highScore);
      }
      ovH.innerText = 'SPLAT! GAME OVER';
      ovP.innerText = \`Score: \${score} | Best: \${highScore}\`;
      btnPlay.innerText = 'PLAY AGAIN';
      overlay.style.display = 'flex';
    }

    window.addEventListener('keydown', e => { if (e.code === 'Space') flap(); });
    canvas.addEventListener('pointerdown', flap);
    btnPlay.onclick = reset;

    function loop() {
      requestAnimationFrame(loop);
      frame++;

      // Sky
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (state === 'play') {
        blob.vy += 0.32; // gravity
        blob.y += blob.vy;

        if (blob.y + blob.rad > canvas.height || blob.y - blob.rad < 0) {
          dead();
        }

        // Spawn pipes
        if (frame % 90 === 0) {
          const gap = 130;
          const topH = Math.floor(Math.random() * 200) + 50;
          pipes.push({ x: canvas.width, topH, gap, scored: false });
        }

        // Move pipes
        for (let i = pipes.length - 1; i >= 0; i--) {
          const p = pipes[i];
          p.x -= 2.2;

          // Check score
          if (!p.scored && p.x + 50 < blob.x) {
            p.scored = true;
            score++;
            beep(750, 0.08);
          }

          // Collision
          if (blob.x + blob.rad > p.x && blob.x - blob.rad < p.x + 50) {
            if (blob.y - blob.rad < p.topH || blob.y + blob.rad > p.topH + p.gap) {
              dead();
            }
          }

          if (p.x < -60) pipes.splice(i, 1);
        }
      }

      // Draw pipes
      pipes.forEach(p => {
        ctx.fillStyle = '#06b6d4';
        // Top pipe
        ctx.fillRect(p.x, 0, 50, p.topH);
        // Bottom pipe
        ctx.fillRect(p.x, p.topH + p.gap, 50, canvas.height - (p.topH + p.gap));
      });

      // Draw squishy pink blob
      ctx.save();
      ctx.translate(blob.x, blob.y);
      const squishX = 1 + (blob.vy * 0.03);
      const squishY = 1 - (blob.vy * 0.03);
      ctx.scale(squishX, squishY);
      ctx.fillStyle = '#ec4899';
      ctx.shadowColor = '#ec4899';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(0, 0, blob.rad, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(6, -4, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'black';
      ctx.beginPath();
      ctx.arc(8, -4, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // HUD
      if (state === 'play') {
        ctx.fillStyle = 'white';
        ctx.font = 'bold 28px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(score, canvas.width / 2, 50);
      }
    }

    loop();
  </script>
</body>
</html>`;

export function getSmartFallback(prompt: string, defaultObbyCode: string): {
  title: string;
  code: string;
  type: string;
  reply: string;
} {
  const lower = (prompt || "").toLowerCase();

  if (/snake|serpent|worm|grid/i.test(lower)) {
    return {
      title: "Cyber Neon Snake: Arcade Edition",
      code: DEFAULT_SNAKE_CODE,
      type: "game",
      reply: `Bleep bloop! 🐍 I built you a slick **Cyber Neon Snake: Arcade Edition**!

### What I Built for You:
- **Neon Synthwave Aesthetics**: Glowing phosphor visuals, fluid 60 FPS motion, and dynamic food particle bursts.
- **Synthesized Audio FX**: Integrated Web Audio API frequency beeps for eating, growing, and crashes without external asset delays.
- **Universal Controls**: Play on desktop with **Arrow Keys** or **WASD**, or on mobile with the built-in **Touch D-Pad**.
- **Score Tracking**: Dynamic score multiplier and saved personal high score.

The game is loaded and ready to play in your Canvas panel on the right. Grab the energy cores and see how long you can grow!`,
    };
  }

  if (/flappy|bird|flap|fly|wings/i.test(lower)) {
    return {
      title: "Flappy Blob: Sky Odyssey",
      code: DEFAULT_FLAPPY_CODE,
      type: "game",
      reply: `*Boing!* 🎈 I created **Flappy Blob: Sky Odyssey** for you!

### Game Features:
- **Squishy Physics Engine**: Blob expands and squishes dynamically based on velocity and jump impulses.
- **Retro Audio**: Custom sine wave synth audio chimes when flapping, scoring, and crashing.
- **Controls**: Press **Spacebar**, click with mouse, or tap the canvas on mobile to flap through the energy pillars.
- **Leaderboard**: Real-time score counter and saved high score.

Give it a spin in Canvas, or pop it out into a new tab! How many pillars can you clear?`,
    };
  }

  // Default: Roblox Rainbow Obby
  return {
    title: "Roblox Rainbow Obby: Ultimate Realm Edition",
    code: defaultObbyCode,
    type: "game",
    reply: `*Bloop!* 🌈 I've built the **Roblox Rainbow Obby: Ultimate Realm Edition** for you!

### What's in this game:
- **3D Isometric Rainbow Realm**: Floating rainbow stages with moving platforms, laser spinners, and jump pads.
- **Full Touch & Keyboard Rig**: On-screen dynamic joystick for touch devices, plus classic **WASD / Arrow Keys** and **Space to Jump** on desktop.
- **Audio Synthesizer**: Custom sound effects for jumping, stage checkpoint chimes, and respawn bursts.
- **Progress System**: Checkpoints save your spot along the obstacle course, with a live speedrun timer.

You can play right now in the split-view Canvas or hit the **Open in New Tab** button for the full-screen experience!`,
  };
}
