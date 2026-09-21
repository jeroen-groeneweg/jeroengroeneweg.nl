export { mountImages } from './project-photos';
import { createGame, start, step, WIDTH, HEIGHT, PADDLE } from './pong-engine';
export function mount(host: HTMLElement, focus = true): () => void {
  host.innerHTML = `<section class="pong" aria-label="Playable Pong game">
    <header class="pong-heading"><h3>Pong</h3><p>You vs computer · First to 5</p></header>
    <div class="pong-score" aria-live="polite" aria-atomic="true">You 0 — 0 Computer</div>
    <canvas width="720" height="440" tabindex="0" aria-label="Pong playfield" aria-describedby="pong-help">Pong requires canvas support.</canvas>
    <p class="pong-status" role="status">Press Enter to start</p>
    <div class="pong-controls"><button type="button" class="pong-start">Start · Enter</button><button type="button" data-move="-1" aria-label="Move paddle up">↑</button><button type="button" data-move="1" aria-label="Move paddle down">↓</button></div>
    <p id="pong-help">↑ ↓ to move · Enter to start or resume · Escape to pause.<br>On touch screens, hold the arrow buttons. Leaving the game pauses play.</p>
  </section>`;
  const canvas = host.querySelector<HTMLCanvasElement>('canvas')!;
  const ctx = canvas.getContext('2d');
  if (!ctx) { host.textContent = 'Your browser does not support this game.'; return () => {}; }
  const status = host.querySelector<HTMLElement>('.pong-status')!;
  const score = host.querySelector<HTMLElement>('.pong-score')!;
  const button = host.querySelector<HTMLButtonElement>('.pong-start')!;
  const game = createGame();
  const keys = new Set<string>();
  let touch = 0; let frame = 0; let previous = 0;
  const events = new AbortController();
  const options = { signal: events.signal };
  function draw() {
    if (!ctx) return;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(1, 8, WIDTH - 2, HEIGHT - 16);
    ctx.setLineDash([9, 12]); ctx.beginPath(); ctx.moveTo(WIDTH / 2, 8); ctx.lineTo(WIDTH / 2, HEIGHT - 8); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#fff'; ctx.fillRect(28, game.left, 12, PADDLE); ctx.fillRect(WIDTH - 40, game.right, 12, PADDLE);
    ctx.beginPath(); ctx.arc(game.x, game.y, 7, 0, Math.PI * 2); ctx.fill();
    ctx.font = 'bold 36px monospace'; ctx.textAlign = 'center';
    ctx.fillText(String(game.player), WIDTH * 0.35, 57); ctx.fillText(String(game.computer), WIDTH * 0.65, 57);
    const message = game.phase === 'ready' ? 'PRESS ENTER TO START' : game.phase === 'paused' ? 'PAUSED · ENTER TO RESUME' : game.phase === 'finished' ? (game.player === 5 ? 'YOU WIN!' : 'COMPUTER WINS') : '';
    if (message) {
      ctx.fillStyle = 'rgba(0,0,0,0.88)'; ctx.fillRect(50, 155, WIDTH - 100, 130);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 26px monospace'; ctx.fillText(message, WIDTH / 2, HEIGHT / 2);
      if (game.phase === 'finished') { ctx.font = '18px monospace'; ctx.fillText('PRESS ENTER TO PLAY AGAIN', WIDTH / 2, 254); }
    }
    const scoreText = `You ${game.player} — ${game.computer} Computer`;
    if (score.textContent !== scoreText) score.textContent = scoreText;
    const statusText = game.phase === 'playing' ? 'Game on' : game.phase === 'ready' ? 'Press Enter to start' : game.phase === 'paused' ? 'Paused — press Enter to resume' : `${game.player === 5 ? 'You win!' : 'Computer wins.'} Press Enter to play again.`;
    if (status.textContent !== statusText) status.textContent = statusText;
    button.textContent = game.phase === 'playing' ? 'Pause' : game.phase === 'paused' ? 'Resume · Enter' : game.phase === 'finished' ? 'Play again · Enter' : 'Start · Enter';
  }
  function loop(now: number) {
    step(game, previous ? (now - previous) / 1000 : 0, touch || Number(keys.has('ArrowDown')) - Number(keys.has('ArrowUp')));
    previous = now; draw();
    frame = game.phase === 'playing' ? requestAnimationFrame(loop) : 0;
  }
  function pause() {
    keys.clear(); touch = 0;
    if (game.phase === 'playing') game.phase = 'paused';
    cancelAnimationFrame(frame); frame = 0; previous = 0; draw();
  }
  function play() {
    if (game.phase === 'playing') return;
    if (game.phase === 'paused') game.phase = 'playing'; else start(game);
    canvas.focus({ preventScroll: true }); previous = 0; draw();
    frame = requestAnimationFrame(loop);
  }
  button.addEventListener('click', () => game.phase === 'playing' ? pause() : play(), options);
  host.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') { event.preventDefault(); keys.add(event.key); }
    if (event.key === 'Enter' && event.target === canvas) { event.preventDefault(); if (!event.repeat) play(); }
    if (event.key === 'Escape') { event.preventDefault(); pause(); }
  }, options);
  host.addEventListener('keyup', (event: KeyboardEvent) => { keys.delete(event.key); }, options);
  host.addEventListener('focusout', (event: FocusEvent) => { if (!(event.relatedTarget instanceof Node) || !host.contains(event.relatedTarget)) pause(); }, options);
  window.addEventListener('blur', pause, options);
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); }, options);
  host.querySelectorAll<HTMLButtonElement>('[data-move]').forEach(control => {
    control.addEventListener('pointerdown', event => { event.preventDefault(); control.setPointerCapture(event.pointerId); touch = Number(control.dataset.move); }, options);
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) control.addEventListener(name, () => { touch = 0; }, options);
  });
  const observer = new IntersectionObserver(entries => { if (!entries[0].isIntersecting) pause(); });
  observer.observe(canvas); draw(); if (focus) canvas.focus({ preventScroll: true });
  return () => { cancelAnimationFrame(frame); events.abort(); observer.disconnect(); };
}
