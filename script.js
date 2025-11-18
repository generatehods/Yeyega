/* script.js - Yeye Runner (English comments) */

/* Simple endless runner:
   - Player is a square that can jump
   - Obstacles spawn and move left
   - Score increases with time
   - Use Space or ArrowUp to jump, R to restart
*/

/* ======= Setup ======= */
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

let W = canvas.width;
let H = canvas.height;

const scoreEl = document.getElementById('score');

/* ======= Game State ======= */
let gameRunning = true;
let score = 0;
let speed = 4; // world speed
let spawnTimer = 0;
let obstacles = [];

/* Player */
const player = {
  x: 80,
  y: H - 60,
  w: 36,
  h: 36,
  vy: 0,
  gravity: 0.9,
  jumpForce: -14,
  grounded: true,
  color: '#ffd86b'
};

/* Controls */
const keys = {};

/* ======= Audio (WebAudio simple beep) ======= */
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function beep(freq = 440, duration = 0.06, volume = 0.06){
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'sine';
  o.frequency.value = freq;
  g.gain.value = volume;
  o.connect(g);
  g.connect(audioCtx.destination);
  o.start();
  o.stop(audioCtx.currentTime + duration);
}

/* ======= Helpers ======= */
function rand(min, max){ return Math.random()*(max-min)+min; }

function spawnObstacle(){
  const h = Math.floor(rand(20, 70));
  const gap = rand(0, 1) > 0.6 ? 50 + rand(0, 80) : 0; // sometimes tall obstacle
  const obs = {
    x: W + 20,
    y: H - h - 20,
    w: 18 + Math.floor(rand(10, 36)),
    h: h,
    color: '#ff6b6b',
    passed: false
  };
  obstacles.push(obs);
}

/* ======= Input ======= */
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    keys.jump = true;
    // resume audio context on first user gesture (mobile)
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }
  if (e.key === 'r' || e.key === 'R') restartGame();
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'Space' || e.code === 'ArrowUp') keys.jump = false;
});

/* ======= Collision ======= */
function rectsOverlap(a, b){
  return a.x < b.x + b.w &&
         a.x + a.w > b.x &&
         a.y < b.y + b.h &&
         a.y + a.h > b.y;
}

/* ======= Game Loop ======= */
let lastTime = 0;
function update(ts){
  const dt = Math.min(32, ts - lastTime);
  lastTime = ts;

  if (gameRunning){
    // update player
    if (keys.jump && player.grounded){
      player.vy = player.jumpForce;
      player.grounded = false;
      beep(520, 0.07, 0.08);
    }

    player.vy += player.gravity * (dt/16);
    player.y += player.vy * (dt/16);

    // floor
    const floorY = H - 20 - player.h;
    if (player.y >= floorY){
      player.y = floorY;
      player.vy = 0;
      player.grounded = true;
    }

    // spawn obstacles
    spawnTimer += dt;
    if (spawnTimer > 900 - Math.min(600, score * 8)) {
      spawnObstacle();
      spawnTimer = 0;
    }

    // update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--){
      const o = obstacles[i];
      o.x -= speed * (dt/16);
      // scored
      if (!o.passed && o.x + o.w < player.x){
        o.passed = true;
        score += 10;
        beep(880, 0.03, 0.04);
        // gradually increase difficulty
        if (score % 100 === 0) speed += 0.6;
      }
      // remove off-screen
      if (o.x + o.w < -50) obstacles.splice(i,1);
      // collision
      const pbox = {x:player.x, y:player.y, w:player.w, h:player.h};
      if (rectsOverlap(pbox, o)){
        gameOver();
      }
    }

    // increase score slowly
    score += 0.02 * (dt/16);

    // update UI
    scoreEl.textContent = 'Score: ' + Math.floor(score);
  }

  render();
  requestAnimationFrame(update);
}

/* ======= Render ======= */
function render(){
  // background
  ctx.clearRect(0,0,W,H);

  // sky gradient
  const g = ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0, '#052033');
  g.addColorStop(1, '#01101a');
  ctx.fillStyle = g;
  ctx.fillRect(0,0,W,H);

  // ground
  ctx.fillStyle = '#071722';
  ctx.fillRect(0, H - 20, W, 20);

  // player
  ctx.fillStyle = player.color;
  roundRect(ctx, player.x, player.y, player.w, player.h, 6, true, false);

  // obstacles
  obstacles.forEach(o => {
    ctx.fillStyle = o.color;
    roundRect(ctx, o.x, o.y, o.w, o.h, 4, true, false);
  });

  // HUD small hint
  if (!gameRunning){
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(W/2 - 150, H/2 - 48, 300, 96);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = '20px sans-serif';
    ctx.fillText('GAME OVER', W/2, H/2 - 6);
    ctx.font = '14px sans-serif';
    ctx.fillText('Press R to restart', W/2, H/2 + 18);
  }
}

/* Rounded rect helper */
function roundRect(ctx, x, y, w, h, r, fill, stroke) {
  if (typeof r === 'undefined') r = 5;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

/* ======= Game Over & Restart ======= */
function gameOver(){
  gameRunning = false;
  beep(120, 0.18, 0.12);
}

function restartGame(){
  // reset state
  obstacles = [];
  score = 0;
  speed = 4;
  player.y = H - 60;
  player.vy = 0;
  player.grounded = true;
  spawnTimer = 0;
  gameRunning = true;
  lastTime = performance.now();
}

/* ======= Resize Handling ======= */
function resizeCanvas(){
  // keep internal resolution fixed but scale via CSS for responsiveness
  const containerWidth = Math.min(window.innerWidth - 40, 900);
  const scale = containerWidth / canvas.width;
  canvas.style.width = (canvas.width * scale) + 'px';
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

/* ======= Start ======= */
lastTime = performance.now();
requestAnimationFrame(update);
