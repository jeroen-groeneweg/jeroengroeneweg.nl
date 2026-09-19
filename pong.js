"use strict";
var PortfolioPong = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/pong.ts
  var pong_exports = {};
  __export(pong_exports, {
    mount: () => mount
  });

  // src/pong-engine.ts
  var WIDTH = 720;
  var HEIGHT = 440;
  var PADDLE = 82;
  var RADIUS = 7;
  var clamp = (n, low, high) => Math.max(low, Math.min(high, n));
  function createGame() {
    return {
      phase: "ready",
      player: 0,
      computer: 0,
      left: 179,
      right: 179,
      x: 360,
      y: 220,
      vx: 0,
      vy: 0,
      delay: 0,
      aiTimer: 0,
      aiTarget: 220
    };
  }
  function serve(game, direction, random = Math.random) {
    game.x = WIDTH / 2;
    game.y = HEIGHT / 2;
    const angle = (random() - 0.5) * 0.9;
    game.vx = direction * 310 * Math.cos(angle);
    game.vy = 310 * Math.sin(angle);
    game.delay = 0.7;
  }
  function start(game, random = Math.random) {
    Object.assign(game, createGame());
    game.phase = "playing";
    serve(game, random() < 0.5 ? -1 : 1, random);
  }
  function step(game, seconds, input, random = Math.random) {
    if (game.phase !== "playing") return;
    let remaining = clamp(seconds, 0, 0.05);
    while (remaining > 0 && game.phase === "playing") {
      const dt = Math.min(remaining, 1 / 240);
      remaining -= dt;
      game.left = clamp(game.left + input * 400 * dt, 8, HEIGHT - PADDLE - 8);
      game.aiTimer -= dt;
      if (game.aiTimer <= 0) {
        game.aiTimer = 0.16;
        game.aiTarget = game.vx > 0 ? game.y + (random() - 0.5) * 90 : HEIGHT / 2;
      }
      const distance = game.aiTarget - (game.right + PADDLE / 2);
      game.right = clamp(game.right + clamp(distance, -255 * dt, 255 * dt), 8, HEIGHT - PADDLE - 8);
      if (game.delay > 0) {
        game.delay -= dt;
        continue;
      }
      game.x += game.vx * dt;
      game.y += game.vy * dt;
      if (game.y < 8 + RADIUS) {
        game.y = 8 + RADIUS;
        game.vy = Math.abs(game.vy);
      }
      if (game.y > HEIGHT - 8 - RADIUS) {
        game.y = HEIGHT - 8 - RADIUS;
        game.vy = -Math.abs(game.vy);
      }
      const leftHit = game.vx < 0 && game.x - RADIUS <= 40 && game.x + RADIUS >= 28 && game.y + RADIUS >= game.left && game.y - RADIUS <= game.left + PADDLE;
      const rightHit = game.vx > 0 && game.x + RADIUS >= WIDTH - 40 && game.x - RADIUS <= WIDTH - 28 && game.y + RADIUS >= game.right && game.y - RADIUS <= game.right + PADDLE;
      if (leftHit || rightHit) {
        const paddleY = leftHit ? game.left : game.right;
        const angle = clamp((game.y - paddleY - PADDLE / 2) / (PADDLE / 2), -1, 1) * 1.05;
        const speed = Math.min(610, Math.hypot(game.vx, game.vy) * 1.07);
        game.vx = (leftHit ? 1 : -1) * speed * Math.cos(angle);
        game.vy = speed * Math.sin(angle);
        game.x = leftHit ? 40 + RADIUS : WIDTH - 40 - RADIUS;
      }
      if (game.x <= RADIUS || game.x >= WIDTH - RADIUS) {
        const playerScored = game.x >= WIDTH - RADIUS;
        if (playerScored) game.player++;
        else game.computer++;
        serve(game, playerScored ? -1 : 1, random);
        if (game.player === 5 || game.computer === 5) game.phase = "finished";
        break;
      }
    }
  }

  // src/pong.ts
  function mount(host) {
    host.innerHTML = `<section class="pong" aria-label="Playable Pong game">
    <header class="pong-heading"><h3>Pong</h3><p>You vs computer \xB7 First to 5</p></header>
    <div class="pong-score" aria-live="polite" aria-atomic="true">You 0 \u2014 0 Computer</div>
    <canvas width="720" height="440" tabindex="0" aria-label="Pong playfield" aria-describedby="pong-help">Pong requires canvas support.</canvas>
    <p class="pong-status" role="status">Press Enter to start</p>
    <div class="pong-controls"><button type="button" class="pong-start">Start \xB7 Enter</button><button type="button" data-move="-1" aria-label="Move paddle up">\u2191</button><button type="button" data-move="1" aria-label="Move paddle down">\u2193</button></div>
    <p id="pong-help">\u2191 \u2193 to move \xB7 Enter to start or resume \xB7 Escape to pause.<br>On touch screens, hold the arrow buttons. Leaving the game pauses play.</p>
  </section>`;
    const canvas = host.querySelector("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      host.textContent = "Your browser does not support this game.";
      return () => {
      };
    }
    const status = host.querySelector(".pong-status");
    const score = host.querySelector(".pong-score");
    const button = host.querySelector(".pong-start");
    const game = createGame();
    const keys = /* @__PURE__ */ new Set();
    let touch = 0;
    let frame = 0;
    let previous = 0;
    const events = new AbortController();
    const options = { signal: events.signal };
    function draw() {
      if (!ctx) return;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 8, WIDTH - 2, HEIGHT - 16);
      ctx.setLineDash([9, 12]);
      ctx.beginPath();
      ctx.moveTo(WIDTH / 2, 8);
      ctx.lineTo(WIDTH / 2, HEIGHT - 8);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#fff";
      ctx.fillRect(28, game.left, 12, PADDLE);
      ctx.fillRect(WIDTH - 40, game.right, 12, PADDLE);
      ctx.beginPath();
      ctx.arc(game.x, game.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = "bold 36px monospace";
      ctx.textAlign = "center";
      ctx.fillText(String(game.player), WIDTH * 0.35, 57);
      ctx.fillText(String(game.computer), WIDTH * 0.65, 57);
      const message = game.phase === "ready" ? "PRESS ENTER TO START" : game.phase === "paused" ? "PAUSED \xB7 ENTER TO RESUME" : game.phase === "finished" ? game.player === 5 ? "YOU WIN!" : "COMPUTER WINS" : "";
      if (message) {
        ctx.fillStyle = "rgba(0,0,0,0.88)";
        ctx.fillRect(50, 155, WIDTH - 100, 130);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 26px monospace";
        ctx.fillText(message, WIDTH / 2, HEIGHT / 2);
        if (game.phase === "finished") {
          ctx.font = "18px monospace";
          ctx.fillText("PRESS ENTER TO PLAY AGAIN", WIDTH / 2, 254);
        }
      }
      const scoreText = `You ${game.player} \u2014 ${game.computer} Computer`;
      if (score.textContent !== scoreText) score.textContent = scoreText;
      const statusText = game.phase === "playing" ? "Game on" : game.phase === "ready" ? "Press Enter to start" : game.phase === "paused" ? "Paused \u2014 press Enter to resume" : `${game.player === 5 ? "You win!" : "Computer wins."} Press Enter to play again.`;
      if (status.textContent !== statusText) status.textContent = statusText;
      button.textContent = game.phase === "playing" ? "Pause" : game.phase === "paused" ? "Resume \xB7 Enter" : game.phase === "finished" ? "Play again \xB7 Enter" : "Start \xB7 Enter";
    }
    function loop(now) {
      step(game, previous ? (now - previous) / 1e3 : 0, touch || Number(keys.has("ArrowDown")) - Number(keys.has("ArrowUp")));
      previous = now;
      draw();
      frame = game.phase === "playing" ? requestAnimationFrame(loop) : 0;
    }
    function pause() {
      keys.clear();
      touch = 0;
      if (game.phase === "playing") game.phase = "paused";
      cancelAnimationFrame(frame);
      frame = 0;
      previous = 0;
      draw();
    }
    function play() {
      if (game.phase === "playing") return;
      if (game.phase === "paused") game.phase = "playing";
      else start(game);
      canvas.focus({ preventScroll: true });
      previous = 0;
      draw();
      frame = requestAnimationFrame(loop);
    }
    button.addEventListener("click", () => game.phase === "playing" ? pause() : play(), options);
    host.addEventListener("keydown", (event) => {
      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
        keys.add(event.key);
      }
      if (event.key === "Enter" && event.target === canvas) {
        event.preventDefault();
        if (!event.repeat) play();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        pause();
      }
    }, options);
    host.addEventListener("keyup", (event) => {
      keys.delete(event.key);
    }, options);
    host.addEventListener("focusout", (event) => {
      if (!(event.relatedTarget instanceof Node) || !host.contains(event.relatedTarget)) pause();
    }, options);
    window.addEventListener("blur", pause, options);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) pause();
    }, options);
    host.querySelectorAll("[data-move]").forEach((control) => {
      control.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        control.setPointerCapture(event.pointerId);
        touch = Number(control.dataset.move);
      }, options);
      for (const name of ["pointerup", "pointercancel", "lostpointercapture"]) control.addEventListener(name, () => {
        touch = 0;
      }, options);
    });
    const observer = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) pause();
    });
    observer.observe(canvas);
    draw();
    canvas.focus({ preventScroll: true });
    return () => {
      cancelAnimationFrame(frame);
      events.abort();
      observer.disconnect();
    };
  }
  return __toCommonJS(pong_exports);
})();
