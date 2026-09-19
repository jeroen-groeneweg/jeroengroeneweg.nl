import { describe, it, expect } from 'vitest';
import { createGame, start, step, WIDTH, HEIGHT, PADDLE } from '../src/pong-engine';
const fixed = () => 0.5;
function playing() { const g = createGame(); start(g, fixed); g.delay = 0; return g; }
describe('Pong rules', () => {
  it('waits for start and resets a new match', () => {
    const g = createGame(); step(g, 1, 1); expect(g.phase).toBe('ready'); expect(g.left).toBe(179);
    g.player = 5; start(g, fixed); expect(g.player).toBe(0); expect(g.phase).toBe('playing'); expect(g.x).toBe(WIDTH / 2);
  });
  it('keeps paddles in bounds and gives AI a finite speed', () => {
    const g = playing(); g.left = 8; step(g, 0.05, -1, fixed); expect(g.left).toBe(8);
    g.left = HEIGHT - PADDLE - 8; step(g, 0.05, 1, fixed); expect(g.left).toBe(HEIGHT - PADDLE - 8);
    g.y = 30; g.vx = 310; g.aiTimer = 0; const before = g.right; step(g, 0.05, 0, fixed); expect(Math.abs(g.right - before)).toBeLessThanOrEqual(12.76);
  });
  it('bounces off top, bottom and both paddles', () => {
    for (const bottom of [false, true]) {
      const g = playing(); g.y = bottom ? HEIGHT - 16 : 16; g.vy = bottom ? 300 : -300;
      step(g, 0.02, 0, fixed); expect(Math.sign(g.vy)).toBe(bottom ? -1 : 1);
    }
    for (const right of [false, true]) {
      const g = playing(); g.x = right ? WIDTH - 49 : 49; g.y = 220; g.vx = right ? 400 : -400;
      step(g, 0.02, 0, fixed); expect(Math.sign(g.vx)).toBe(right ? -1 : 1); expect(g.player + g.computer).toBe(0);
    }
  });
  it('awards either side a point, serves from centre and ends at five', () => {
    for (const playerScored of [false, true]) {
      const g = playing(); g.x = playerScored ? WIDTH - 8 : 8; g.y = 50; g.vx = playerScored ? 400 : -400;
      step(g, 0.02, 0, fixed); expect(playerScored ? g.player : g.computer).toBe(1); expect(g.x).toBe(WIDTH / 2); expect(g.delay).toBeGreaterThan(0);
      if (playerScored) g.player = 4; else g.computer = 4;
      g.delay = 0; g.x = playerScored ? WIDTH - 8 : 8; g.vx = playerScored ? 400 : -400;
      step(g, 0.02, 0, fixed); expect(g.phase).toBe('finished');
      const snapshot = { ...g }; step(g, 0.05, 1, fixed); expect(g).toEqual(snapshot);
    }
  });
  it('freezes paused matches and caps long frames', () => {
    const g = playing(); g.phase = 'paused'; const snapshot = { ...g }; step(g, 10, 1, fixed); expect(g).toEqual(snapshot);
    g.phase = 'playing'; step(g, 10, 1, fixed); expect(g.left).toBeCloseTo(199);
  });
});
