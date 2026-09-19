export const WIDTH = 720;
export const HEIGHT = 440;
export const PADDLE = 82;
const RADIUS = 7;
export type Phase = 'ready' | 'playing' | 'paused' | 'finished';
export interface Game {
  phase: Phase; player: number; computer: number; left: number; right: number;
  x: number; y: number; vx: number; vy: number; delay: number;
  aiTimer: number; aiTarget: number;
}
const clamp = (n: number, low: number, high: number) => Math.max(low, Math.min(high, n));
export function createGame(): Game {
  return { phase: 'ready', player: 0, computer: 0, left: 179, right: 179,
    x: 360, y: 220, vx: 0, vy: 0, delay: 0, aiTimer: 0, aiTarget: 220 };
}
export function serve(game: Game, direction: number, random = Math.random): void {
  game.x = WIDTH / 2; game.y = HEIGHT / 2;
  const angle = (random() - 0.5) * 0.9;
  game.vx = direction * 310 * Math.cos(angle); game.vy = 310 * Math.sin(angle);
  game.delay = 0.7;
}
export function start(game: Game, random = Math.random): void {
  Object.assign(game, createGame()); game.phase = 'playing';
  serve(game, random() < 0.5 ? -1 : 1, random);
}
export function step(game: Game, seconds: number, input: number, random = Math.random): void {
  if (game.phase !== 'playing') return;
  // Substeps prevent the ball from passing through a paddle after a slow frame.
  let remaining = clamp(seconds, 0, 0.05);
  while (remaining > 0 && game.phase === 'playing') {
    const dt = Math.min(remaining, 1 / 240); remaining -= dt;
    game.left = clamp(game.left + input * 400 * dt, 8, HEIGHT - PADDLE - 8);
    game.aiTimer -= dt;
    if (game.aiTimer <= 0) {
      game.aiTimer = 0.16;
      game.aiTarget = game.vx > 0 ? game.y + (random() - 0.5) * 90 : HEIGHT / 2;
    }
    const distance = game.aiTarget - (game.right + PADDLE / 2);
    game.right = clamp(game.right + clamp(distance, -255 * dt, 255 * dt), 8, HEIGHT - PADDLE - 8);
    if (game.delay > 0) { game.delay -= dt; continue; }
    game.x += game.vx * dt; game.y += game.vy * dt;
    if (game.y < 8 + RADIUS) { game.y = 8 + RADIUS; game.vy = Math.abs(game.vy); }
    if (game.y > HEIGHT - 8 - RADIUS) { game.y = HEIGHT - 8 - RADIUS; game.vy = -Math.abs(game.vy); }
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
      if (playerScored) game.player++; else game.computer++;
      serve(game, playerScored ? -1 : 1, random);
      if (game.player === 5 || game.computer === 5) game.phase = 'finished';
      break;
    }
  }
}
