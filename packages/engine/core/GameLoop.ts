export type TickCallback = (dt: number) => void;

export class GameLoop {
  private running = false;
  private lastTime = 0;
  private accumulator = 0;
  private readonly tickRate: number;
  private readonly onTick: TickCallback;
  private rafId = 0;

  constructor(onTick: TickCallback, tickRate = 10) {
    this.onTick = onTick;
    this.tickRate = tickRate;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  private loop = (now: number): void => {
    if (!this.running) return;
    const dt = Math.min((now - this.lastTime) / 1000, 0.25);
    this.lastTime = now;
    this.accumulator += dt;
    const step = 1 / this.tickRate;
    while (this.accumulator >= step) {
      this.onTick(step);
      this.accumulator -= step;
    }
    this.rafId = requestAnimationFrame(this.loop);
  };
}