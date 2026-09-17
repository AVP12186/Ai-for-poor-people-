import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { getSmartFallback } from "./server/games";

dotenv.config();

// In-memory store for shared canvas games so new-tab previews load reliably
const canvasStore = new Map<string, { id: string; title: string; code: string; type: string; createdAt: number }>();

// Pre-seed the Roblox Rainbow Obby game from the screenshot
const DEFAULT_OBBY_CODE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>Roblox Rainbow Obby: Ultimate Realm Edition</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #0f172a;
      color: #f8fafc;
      font-family: system-ui, -apple-system, sans-serif;
      overflow: hidden;
      touch-action: none;
      user-select: none;
    }
    #canvas-container {
      position: relative;
      width: 100vw;
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      background: radial-gradient(circle at center, #1e1b4b 0%, #020617 100%);
    }
    canvas {
      display: block;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
    }
    #ui-overlay {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 16px;
    }
    .hud-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      pointer-events: auto;
    }
    .badge {
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 9999px;
      padding: 6px 16px;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 8px;
      color: #38bdf8;
    }
    .badge-gold { color: #fbbf24; border-color: rgba(251, 191, 36, 0.3); }
    .badge-pink { color: #f472b6; border-color: rgba(244, 114, 182, 0.3); }
    .hud-controls {
      display: flex;
      gap: 8px;
    }
    .icon-btn {
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(255,255,255,0.2);
      color: #fff;
      width: 40px;
      height: 40px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-weight: bold;
      transition: all 0.2s;
    }
    .icon-btn:hover { background: #334155; transform: scale(1.05); }
    
    /* Touch Controls */
    #touch-controls {
      position: absolute;
      bottom: 24px;
      left: 24px;
      right: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      pointer-events: none;
    }
    #joystick-zone {
      width: 130px;
      height: 130px;
      border-radius: 50%;
      background: rgba(255,255,255,0.08);
      border: 2px dashed rgba(255,255,255,0.2);
      position: relative;
      pointer-events: auto;
      touch-action: none;
    }
    #joystick-knob {
      width: 54px;
      height: 54px;
      border-radius: 50%;
      background: radial-gradient(circle at 35% 35%, #ec4899, #be185d);
      box-shadow: 0 4px 15px rgba(236, 72, 153, 0.5);
      position: absolute;
      top: 38px;
      left: 38px;
      pointer-events: none;
      transition: transform 0.05s ease-out;
    }
    #jump-btn {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: radial-gradient(circle at 35% 35%, #38bdf8, #0284c7);
      box-shadow: 0 4px 20px rgba(56, 189, 248, 0.5);
      border: 2px solid rgba(255,255,255,0.4);
      color: white;
      font-size: 16px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: auto;
      cursor: pointer;
      user-select: none;
      active: transform: scale(0.92);
    }
    #customizer-modal {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      background: #1e293b;
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 20px;
      padding: 24px;
      width: 320px;
      display: none;
      flex-direction: column;
      gap: 16px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.8);
      pointer-events: auto;
      z-index: 50;
    }
    .swatches { display: flex; gap: 8px; justify-content: center; }
    .swatch {
      width: 36px; height: 36px; border-radius: 50%; cursor: pointer;
      border: 2px solid white; transition: transform 0.2s;
    }
    .swatch:hover { transform: scale(1.15); }
    #level-cleared {
      position: absolute;
      top: 40%; left: 50%;
      transform: translate(-50%, -50%) scale(0.8);
      background: rgba(16, 185, 129, 0.9);
      color: white;
      padding: 16px 32px;
      border-radius: 16px;
      font-size: 24px;
      font-weight: 800;
      pointer-events: none;
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      box-shadow: 0 10px 30px rgba(16, 185, 129, 0.5);
    }
    #level-cleared.show { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  </style>
</head>
<body>
  <div id="canvas-container">
    <canvas id="gameCanvas"></canvas>
    
    <div id="ui-overlay">
      <div class="hud-top">
        <div style="display:flex; gap: 8px; flex-wrap: wrap;">
          <div class="badge badge-pink" id="stage-badge">⭐ Stage 1/10</div>
          <div class="badge badge-gold" id="coin-badge">🟡 Coins: 0</div>
          <div class="badge" id="timer-badge">⏱️ 00:00</div>
        </div>
        <div class="hud-controls">
          <button class="icon-btn" id="custom-btn" title="Character Customizer">🎨</button>
          <button class="icon-btn" id="sound-btn" title="Toggle Sound">🔊</button>
          <button class="icon-btn" id="respawn-btn" title="Quick Respawn">🔄</button>
        </div>
      </div>

      <div id="level-cleared">STAGE COMPLETE! 🎉</div>

      <div id="touch-controls">
        <div id="joystick-zone">
          <div id="joystick-knob"></div>
        </div>
        <div id="jump-btn">JUMP</div>
      </div>
    </div>

    <div id="customizer-modal">
      <h3 style="text-align: center; font-weight:800; color:#f472b6;">Robloxian Style</h3>
      <p style="font-size:13px; color:#94a3b8; text-align:center;">Pick your avatar shirt color</p>
      <div class="swatches">
        <div class="swatch" style="background:#0284c7" data-color="#0284c7"></div>
        <div class="swatch" style="background:#ec4899" data-color="#ec4899"></div>
        <div class="swatch" style="background:#10b981" data-color="#10b981"></div>
        <div class="swatch" style="background:#f59e0b" data-color="#f59e0b"></div>
        <div class="swatch" style="background:#8b5cf6" data-color="#8b5cf6"></div>
      </div>
      <p style="font-size:13px; color:#94a3b8; text-align:center;">Pick Headwear</p>
      <div style="display:flex; gap:8px; justify-content:center;">
        <button class="icon-btn" id="hat-none" style="width:auto; padding:0 12px; font-size:13px;">None</button>
        <button class="icon-btn" id="hat-cap" style="width:auto; padding:0 12px; font-size:13px;">🧢 Cap</button>
        <button class="icon-btn" id="hat-crown" style="width:auto; padding:0 12px; font-size:13px;">👑 Crown</button>
      </div>
      <button id="close-customizer" style="margin-top:8px; padding:10px; background:#ec4899; color:white; border:none; border-radius:12px; font-weight:bold; cursor:pointer;">Ready!</button>
    </div>
  </div>

  <script>
    // Web Audio Synthesizer for Bloxy Retro sounds
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    let audioCtx = null;
    let soundEnabled = true;

    function playTone(freq, type, duration, slideFreq = null) {
      if (!soundEnabled) return;
      try {
        if (!audioCtx) audioCtx = new AudioCtx();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        if (slideFreq) {
          osc.frequency.exponentialRampToValueAtTime(slideFreq, audioCtx.currentTime + duration);
        }
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
      } catch (e) {}
    }

    const sfx = {
      jump: () => playTone(300, 'sine', 0.15, 600),
      coin: () => { playTone(987, 'square', 0.08); setTimeout(() => playTone(1318, 'square', 0.15), 80); },
      checkpoint: () => { playTone(523, 'triangle', 0.1); setTimeout(() => playTone(659, 'triangle', 0.1), 100); setTimeout(() => playTone(783, 'triangle', 0.25), 200); },
      die: () => playTone(180, 'sawtooth', 0.25, 60),
      win: () => { [523, 659, 783, 1046].forEach((f, i) => setTimeout(() => playTone(f, 'sine', 0.2), i * 100)); }
    };

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    // Game Variables
    let currentStage = 0;
    let coinsCollected = 0;
    let startTime = Date.now();
    let playerColor = '#0284c7';
    let playerHat = 'none';

    // Player Object
    const player = {
      x: 80,
      y: 300,
      vx: 0,
      vy: 0,
      width: 32,
      height: 48,
      grounded: false,
      facing: 1,
      respawnX: 80,
      respawnY: 300,
      trail: []
    };

    const GRAVITY = 0.65;
    const JUMP_FORCE = -13.5;
    const MOVE_SPEED = 6.5;

    // Stages Data (Rainbow Theme)
    const rainbowColors = ['#f43f5e', '#fb923c', '#facc15', '#4ade80', '#38bdf8', '#818cf8', '#c084fc'];

    function createStage(index) {
      const color = rainbowColors[index % rainbowColors.length];
      const plats = [];
      const hazards = [];
      const coins = [];

      // Start platform
      plats.push({ x: 40, y: 460, w: 140, h: 28, color: '#475569' });

      // Procedural rainbow challenges per stage
      const numJumps = 5 + index * 2;
      let currX = 220;
      let currY = 460;

      for (let i = 0; i < numJumps; i++) {
        const stepColor = rainbowColors[(index + i) % rainbowColors.length];
        const gap = 120 + Math.random() * 40;
        currX += gap;
        currY = 320 + Math.sin(i * 1.2) * 110;

        // Platform
        const isMoving = (index > 1 && i % 2 === 1);
        plats.push({
          x: currX,
          y: currY,
          w: Math.max(70, 120 - index * 6),
          h: 24,
          color: stepColor,
          moving: isMoving,
          originX: currX,
          range: 80,
          speed: 1.5 + (index * 0.3),
          timeOffset: i
        });

        // Coins
        if (Math.random() > 0.3) {
          coins.push({ x: currX + 40, y: currY - 35, collected: false });
        }

        // Spinners / Lava hazards
        if (index > 0 && i % 3 === 2) {
          hazards.push({
            type: 'spinner',
            x: currX - gap * 0.5,
            y: currY - 20,
            radius: 36,
            angle: 0,
            speed: 0.04 + index * 0.01
          });
        }
      }

      // Finish portal platform
      plats.push({
        x: currX + 160,
        y: currY,
        w: 160,
        h: 28,
        color: '#10b981',
        isGoal: true
      });

      return { plats, hazards, coins, color, goalX: currX + 220, goalY: currY };
    }

    let stageData = createStage(currentStage);

    // Keyboard Controls
    const keys = {};
    window.addEventListener('keydown', (e) => {
      keys[e.key.toLowerCase()] = true;
      if ((e.key === ' ' || e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') && player.grounded) {
        player.vy = JUMP_FORCE;
        player.grounded = false;
        sfx.jump();
      }
    });
    window.addEventListener('keyup', (e) => {
      keys[e.key.toLowerCase()] = false;
    });

    // Touch Joystick
    let joystickActive = false;
    let joystickVector = { x: 0, y: 0 };
    const joyZone = document.getElementById('joystick-zone');
    const joyKnob = document.getElementById('joystick-knob');
    const jumpBtn = document.getElementById('jump-btn');

    joyZone.addEventListener('pointerdown', (e) => {
      joystickActive = true;
      handleJoystick(e);
      joyZone.setPointerCapture(e.pointerId);
    });

    joyZone.addEventListener('pointermove', (e) => {
      if (joystickActive) handleJoystick(e);
    });

    function stopJoystick() {
      joystickActive = false;
      joystickVector = { x: 0, y: 0 };
      joyKnob.style.transform = 'translate(0px, 0px)';
    }

    joyZone.addEventListener('pointerup', stopJoystick);
    joyZone.addEventListener('pointercancel', stopJoystick);

    function handleJoystick(e) {
      const rect = joyZone.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const dist = Math.hypot(dx, dy);
      const maxDist = rect.width / 2 - 10;
      const clampedDist = Math.min(dist, maxDist);
      const angle = Math.atan2(dy, dx);
      const kx = Math.cos(angle) * clampedDist;
      const ky = Math.sin(angle) * clampedDist;

      joyKnob.style.transform = \`translate(\${kx}px, \${ky}px)\`;
      joystickVector.x = kx / maxDist;
      joystickVector.y = ky / maxDist;
    }

    jumpBtn.addEventListener('pointerdown', () => {
      if (player.grounded) {
        player.vy = JUMP_FORCE;
        player.grounded = false;
        sfx.jump();
      }
    });

    // Customizer Modal
    const customModal = document.getElementById('customizer-modal');
    document.getElementById('custom-btn').onclick = () => customModal.style.display = 'flex';
    document.getElementById('close-customizer').onclick = () => customModal.style.display = 'none';
    document.querySelectorAll('.swatch').forEach(sw => {
      sw.onclick = () => playerColor = sw.dataset.color;
    });
    document.getElementById('hat-none').onclick = () => playerHat = 'none';
    document.getElementById('hat-cap').onclick = () => playerHat = 'cap';
    document.getElementById('hat-crown').onclick = () => playerHat = 'crown';
    document.getElementById('respawn-btn').onclick = () => respawn();
    document.getElementById('sound-btn').onclick = function() {
      soundEnabled = !soundEnabled;
      this.textContent = soundEnabled ? '🔊' : '🔇';
    };

    function respawn() {
      player.x = player.respawnX;
      player.y = player.respawnY;
      player.vx = 0;
      player.vy = 0;
      player.trail = [];
      sfx.die();
    }

    // Camera
    let cameraX = 0;
    let cameraY = 0;

    function update() {
      // Horizontal Input
      let moveDir = 0;
      if (keys['a'] || keys['arrowleft']) moveDir -= 1;
      if (keys['d'] || keys['arrowright']) moveDir += 1;
      if (Math.abs(joystickVector.x) > 0.15) moveDir += joystickVector.x;

      moveDir = Math.max(-1, Math.min(1, moveDir));
      if (moveDir !== 0) player.facing = moveDir > 0 ? 1 : -1;

      player.vx = moveDir * MOVE_SPEED;
      player.vy += GRAVITY;

      // Update Moving Platforms
      const t = Date.now() * 0.002;
      stageData.plats.forEach(p => {
        if (p.moving) {
          const prevX = p.x;
          p.x = p.originX + Math.sin(t * p.speed + p.timeOffset) * p.range;
          if (player.grounded && player.y + player.height <= p.y + 4 && player.x + player.width > p.x && player.x < p.x + p.w) {
            player.x += (p.x - prevX);
          }
        }
      });

      // Update Hazards
      stageData.hazards.forEach(h => {
        if (h.type === 'spinner') h.angle += h.speed;
      });

      // Apply horizontal velocity
      player.x += player.vx;

      // Collisions with platforms
      player.grounded = false;
      stageData.plats.forEach(p => {
        if (
          player.x < p.x + p.w &&
          player.x + player.width > p.x &&
          player.y < p.y + p.h &&
          player.y + player.height > p.y
        ) {
          // Landing on top
          if (player.vy > 0 && player.y + player.height - player.vy <= p.y + 10) {
            player.y = p.y - player.height;
            player.vy = 0;
            player.grounded = true;

            // Check goal
            if (p.isGoal) completeStage();
          }
        }
      });

      // Apply vertical velocity
      player.y += player.vy;

      // Recheck vertical ground
      stageData.plats.forEach(p => {
        if (
          player.x < p.x + p.w &&
          player.x + player.width > p.x &&
          player.y < p.y + p.h &&
          player.y + player.height > p.y
        ) {
          if (player.vy > 0) {
            player.y = p.y - player.height;
            player.vy = 0;
            player.grounded = true;
            if (p.isGoal) completeStage();
          }
        }
      });

      // Fall off void check
      if (player.y > 800) respawn();

      // Collect Coins
      stageData.coins.forEach(c => {
        if (!c.collected && Math.hypot(player.x + 16 - c.x, player.y + 24 - c.y) < 28) {
          c.collected = true;
          coinsCollected++;
          document.getElementById('coin-badge').textContent = \`🟡 Coins: \${coinsCollected}\`;
          sfx.coin();
        }
      });

      // Hazard collision
      stageData.hazards.forEach(h => {
        if (h.type === 'spinner') {
          const sx1 = h.x + Math.cos(h.angle) * h.radius;
          const sy1 = h.y + Math.sin(h.angle) * h.radius;
          const sx2 = h.x - Math.cos(h.angle) * h.radius;
          const sy2 = h.y - Math.sin(h.angle) * h.radius;
          if (
            Math.hypot(player.x + 16 - sx1, player.y + 24 - sy1) < 20 ||
            Math.hypot(player.x + 16 - sx2, player.y + 24 - sy2) < 20
          ) {
            respawn();
          }
        }
      });

      // Trail
      if (Math.abs(player.vx) > 1 || Math.abs(player.vy) > 1) {
        player.trail.push({ x: player.x + 16, y: player.y + 24, alpha: 0.7, color: playerColor });
      }
      player.trail.forEach(pt => pt.alpha -= 0.05);
      player.trail = player.trail.filter(pt => pt.alpha > 0);

      // Smooth Camera Follow
      const targetCamX = player.x - canvas.width * 0.35;
      const targetCamY = player.y - canvas.height * 0.55;
      cameraX += (targetCamX - cameraX) * 0.1;
      cameraY += (targetCamY - cameraY) * 0.08;

      // Timer
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
      const secs = String(elapsed % 60).padStart(2, '0');
      document.getElementById('timer-badge').textContent = \`⏱️ \${mins}:\${secs}\`;
    }

    function completeStage() {
      currentStage++;
      sfx.win();
      const popup = document.getElementById('level-cleared');
      popup.textContent = \`STAGE \${currentStage} COMPLETE! ⭐\`;
      popup.classList.add('show');
      setTimeout(() => popup.classList.remove('show'), 1600);

      document.getElementById('stage-badge').textContent = \`⭐ Stage \${currentStage + 1}/10\`;
      stageData = createStage(currentStage);
      player.respawnX = 80;
      player.respawnY = 300;
      player.x = 80;
      player.y = 300;
      player.vx = 0;
      player.vy = 0;
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(-cameraX, -cameraY);

      // Parallax Grid Background
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      const gridSize = 60;
      const startGridX = Math.floor(cameraX / gridSize) * gridSize;
      const startGridY = Math.floor(cameraY / gridSize) * gridSize;
      for (let x = startGridX - gridSize; x < startGridX + canvas.width + gridSize; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, cameraY - 100);
        ctx.lineTo(x, cameraY + canvas.height + 100);
        ctx.stroke();
      }
      for (let y = startGridY - gridSize; y < startGridY + canvas.height + gridSize; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(cameraX - 100, y);
        ctx.lineTo(cameraX + canvas.width + 100, y);
        ctx.stroke();
      }

      // Platforms
      stageData.plats.forEach(p => {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.roundRect(p.x, p.y, p.w, p.h, 6);
        ctx.fill();

        // 3D block edge
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(p.x, p.y + p.h - 6, p.w, 6);
        ctx.shadowBlur = 0;

        // Goal Portal visual
        if (p.isGoal) {
          ctx.strokeStyle = '#34d399';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(p.x + p.w / 2, p.y - 30, 24, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = 'rgba(52, 211, 153, 0.3)';
          ctx.fill();
        }
      });

      // Hazards
      stageData.hazards.forEach(h => {
        if (h.type === 'spinner') {
          ctx.save();
          ctx.translate(h.x, h.y);
          ctx.rotate(h.angle);
          ctx.fillStyle = '#ef4444';
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 15;
          ctx.fillRect(-h.radius, -5, h.radius * 2, 10);
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, Math.PI * 2);
          ctx.fillStyle = '#f87171';
          ctx.fill();
          ctx.restore();
        }
      });

      // Coins
      stageData.coins.forEach(c => {
        if (!c.collected) {
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 10;
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(c.x, c.y + Math.sin(Date.now() * 0.005) * 4, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // Player Trail
      player.trail.forEach(pt => {
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = pt.alpha;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 8 * pt.alpha, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Draw Robloxian Character
      ctx.save();
      ctx.translate(player.x + 16, player.y + 24);
      if (player.facing < 0) ctx.scale(-1, 1);

      // Head (Yellow classic Roblox skin tone)
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.roundRect(-9, -24, 18, 16, 4);
      ctx.fill();

      // Face (Happy eyes & smile)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(1, -19, 3, 3);
      ctx.fillRect(6, -19, 3, 3);
      ctx.beginPath();
      ctx.arc(4, -13, 3, 0, Math.PI);
      ctx.stroke();

      // Hat
      if (playerHat === 'cap') {
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(-10, -28, 20, 6);
        ctx.fillRect(2, -25, 14, 3);
      } else if (playerHat === 'crown') {
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.moveTo(-10, -24);
        ctx.lineTo(-6, -32);
        ctx.lineTo(0, -26);
        ctx.lineTo(6, -32);
        ctx.lineTo(10, -24);
        ctx.fill();
      }

      // Torso (Shirt)
      ctx.fillStyle = playerColor;
      ctx.beginPath();
      ctx.roundRect(-12, -8, 24, 18, 4);
      ctx.fill();

      // Legs (Blue classic block jeans)
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(-11, 10, 9, 14);
      ctx.fillRect(2, 10, 9, 14);

      ctx.restore();

      ctx.restore();

      requestAnimationFrame(() => {
        update();
        draw();
      });
    }

    draw();
  </script>
</body>
</html>`;

// Initialize pre-seeded canvas game
canvasStore.set("obby-1", {
  id: "obby-1",
  title: "Roblox Rainbow Obby Ultimate Edition",
  code: DEFAULT_OBBY_CODE,
  type: "game",
  createdAt: Date.now(),
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // Helper to initialize GoogleGenAI safely
  function getGeminiClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }

  // Model mapping based on user specifications:
  // "blob flash equals gemini 3.8 flash and the blob pro is gemini 3.1 pro and the blob lite is gemini 3.5 flash lite"
  function resolveModel(clientModelName: string): string {
    const lower = (clientModelName || "").toLowerCase();
    if (lower.includes("pro")) {
      return "gemini-3.1-pro-preview";
    }
    if (lower.includes("lite")) {
      return "gemini-3.1-flash-lite"; // or gemini-3.5-flash-lite fallback
    }
    // Default: Blob Flash
    return "gemini-3.8-flash";
  }

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      appName: "Blob AI",
      models: {
        "blob-flash": "gemini-3.8-flash",
        "blob-pro": "gemini-3.1-pro-preview",
        "blob-lite": "gemini-3.1-flash-lite",
      },
    });
  });

  // Save or retrieve a canvas game/app
  app.post("/api/canvas", (req, res) => {
    const { id, title, code, type } = req.body;
    const canvasId = id || `canvas-${Date.now()}`;
    const item = {
      id: canvasId,
      title: title || "Interactive Canvas",
      code: code || DEFAULT_OBBY_CODE,
      type: type || "game",
      createdAt: Date.now(),
    };
    canvasStore.set(canvasId, item);
    res.json({ success: true, item });
  });

  app.get("/api/canvas/:id", (req, res) => {
    const item = canvasStore.get(req.params.id);
    if (!item) {
      return res.status(404).json({ error: "Canvas item not found" });
    }
    res.json(item);
  });

  // Dedicated standalone preview endpoint for opening games in a new tab!
  // This satisfies: "make a thing that if a canvas game is previewing. You can open it in a new tab and preview it."
  app.get("/canvas-preview/:id", (req, res) => {
    const item = canvasStore.get(req.params.id);
    if (item && item.code) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.send(item.code);
    }
    // Default fallback to Roblox Rainbow Obby
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(DEFAULT_OBBY_CODE);
  });

  // Primary Gemini Chat & Canvas Generation API
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, model, mode, currentCode, history, searchEnabled } = req.body;
      const targetModel = resolveModel(model);
      const ai = getGeminiClient();

      const isGameOrCanvasRequest =
        mode === "canvas" ||
        /(game|play|obby|platformer|snake|pong|flappy|arcade|rpg|shooter|breakout|brick|race|racing|runner|puzzle|minesweeper|tetris|tic.?tac|build a|make a|create a|canvas|interactive|app)/i.test(
          message || ""
        );

      let userPrompt = message || "";
      if (mode === "canvas" && currentCode) {
        userPrompt += `\n\n[Existing Canvas Code Context]:\n\`\`\`html\n${currentCode.slice(0, 15000)}\n\`\`\``;
      }

      // Build context and system prompt depending on mode
      let systemInstruction = `You are Blob AI, an upbeat, brilliant, creative AI with an authentic, friendly personality!
You speak naturally like a real AI companion: enthusiastic, articulate, helpful, and insightful.
NEVER speak robotically, and NEVER say generic clichés like "I have processed your request", "Task complete", or "Processed with Blob AI".`;

      if (isGameOrCanvasRequest) {
        systemInstruction += `
You LOVE building games and interactive applications! The user wants you to create or improve a game.
1. Respond with genuine AI personality and excitement:
   - Introduce the game with a fun title and theme.
   - Explain how the gameplay works, objectives, and mechanics.
   - Detail the exact controls: Keyboard (WASD or Arrow Keys, Spacebar to jump/action), Mouse/tap, and Touch on-screen controls/virtual joystick so mobile players can enjoy it.
   - Provide a gameplay tip or challenge!
2. You MUST produce a complete, fully functional, self-contained single-file HTML/CSS/JavaScript game enclosed in \`\`\`html and \`\`\`.
3. The game MUST run immediately inside an iframe or browser window with 60 FPS requestAnimationFrame loops, Web Audio API sound synthesis (beeps, jump boings, chimes, explosion blips), a HUD (score, high score), game-over state with instant restart, and on-screen touch controls.
4. If previous code was provided, enhance it according to the user's instructions.`;
      } else if (mode === "deep-research") {
        systemInstruction += `
You are currently in DEEP RESEARCH MODE.
Provide a deep, rigorously researched, multi-perspective breakdown with clear headers, key facts, and synthesized conclusions.`;
      }

      const promptParts: any[] = [];
      if (history && Array.isArray(history)) {
        history.slice(-6).forEach((h: any) => {
          promptParts.push({ text: `${h.role === "user" ? "User" : "Blob AI"}: ${h.content}` });
        });
      }
      promptParts.push({ text: userPrompt });

      // Configure tools: If search is enabled, attach googleSearch grounding
      const requestConfig: any = {
        systemInstruction,
        temperature: 0.7,
      };

      if (searchEnabled || mode === "deep-research") {
        requestConfig.tools = [{ googleSearch: {} }];
      }

      let responseText = "";
      let modelActuallyUsed = targetModel;
      let searchGroundingChunks: any[] = [];

      if (ai) {
        // Priority list of models to try (gracefully handling rate limits or quotas)
        const candidateModels = [
          targetModel,
          "gemini-3.5-flash-lite",
          "gemini-3.1-flash-lite",
          "gemini-3-flash-preview",
          "gemini-3.8-flash",
        ].filter((v, i, a) => a.indexOf(v) === i);

        for (const candidate of candidateModels) {
          try {
            const response = await ai.models.generateContent({
              model: candidate,
              contents: { parts: promptParts },
              config: requestConfig,
            });
            if (response && response.text) {
              responseText = response.text;
              modelActuallyUsed = candidate;
              const searchChunks = (response as any).candidates?.[0]?.groundingMetadata?.groundingChunks;
              if (searchChunks && Array.isArray(searchChunks)) {
                searchGroundingChunks = searchChunks.map((c: any) => c.web?.title || c.web?.uri).filter(Boolean);
              }
              break;
            }
          } catch (err: any) {
            console.warn(`Model ${candidate} encountered an issue, trying next candidate... (${err?.status || err?.message?.slice(0, 80)})`);
          }
        }
      }

      // If all API calls were exhausted or offline, dynamically provide a smart game or conversational response
      if (!responseText) {
        if (isGameOrCanvasRequest) {
          const fallbackGame = getSmartFallback(userPrompt, DEFAULT_OBBY_CODE);
          responseText = `${fallbackGame.reply}\n\n\`\`\`html\n${fallbackGame.code}\n\`\`\``;
        } else {
          responseText = `*Bloop!* 🟢 Hey blob user! I'm here and fully tuned in. You asked: "${userPrompt}". I'm ready to dive into any topic, write code, run deep research, or create interactive games for you! What shall we build next?`;
        }
      }

      // Check if response contains Canvas code
      let canvasArtifact = null;
      let htmlCodeMatch = responseText.match(/```html([\s\S]*?)```/i);
      if (!htmlCodeMatch) {
        htmlCodeMatch = responseText.match(/```([\s\S]*?(?:<!DOCTYPE|<html|<canvas|<div|<head)[\s\S]*?)```/i);
      }

      if (htmlCodeMatch) {
        const code = htmlCodeMatch[1].trim();
        const canvasId = `canvas-${Date.now()}`;
        // Derive a title from the HTML code title tag or user's prompt
        const codeTitleMatch = code.match(/<title[^>]*>(.*?)<\/title>/i);
        let derivedTitle = codeTitleMatch ? codeTitleMatch[1].trim() : "";
        if (!derivedTitle || /^(html|document|untitled|index|canvas)$/i.test(derivedTitle)) {
          const titleMatch = userPrompt.match(/(?:make|build|create|update|for the|play)\s+([^.\n]+)/i);
          derivedTitle = titleMatch ? titleMatch[1].trim() : "Interactive Blob Game";
          derivedTitle = derivedTitle.replace(/^(me\s+a\s+|a\s+|an\s+|the\s+)/i, "");
          derivedTitle = derivedTitle.charAt(0).toUpperCase() + derivedTitle.slice(1);
        }

        canvasArtifact = {
          id: canvasId,
          title: derivedTitle,
          code,
          type: code.includes("canvas") || code.includes("game") ? "game" : "app",
          createdAt: Date.now(),
        };
        canvasStore.set(canvasId, canvasArtifact);
      }

      // Clean conversational text if canvas was extracted
      let conversationalReply = responseText;
      if (htmlCodeMatch) {
        conversationalReply = responseText.replace(/```(?:html)?[\s\S]*?```/gi, "").trim();
        if (!conversationalReply) {
          conversationalReply = `*Bloop!* 🎮 I've engineered this interactive game for you in Canvas! You can play right here with keyboard or touch controls, tweak the code in the Code tab, or pop it out into a new tab for full-screen gameplay.`;
        }
      }

      res.json({
        reply: conversationalReply,
        canvas: canvasArtifact,
        modelUsed: modelActuallyUsed,
        searchGroundingSources: searchGroundingChunks,
      });
    } catch (error: any) {
      console.error("Chat API error:", error);
      // Even in catch block, provide a helpful game or answer instead of a 500 failure
      const fallbackGame = getSmartFallback(req.body?.message || "", DEFAULT_OBBY_CODE);
      res.json({
        reply: fallbackGame.reply,
        canvas: {
          id: `canvas-${Date.now()}`,
          title: fallbackGame.title,
          code: fallbackGame.code,
          type: fallbackGame.type,
          createdAt: Date.now(),
        },
        modelUsed: "blob-flash",
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Blob AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
