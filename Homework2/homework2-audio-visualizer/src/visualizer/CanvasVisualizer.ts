export interface BarStyle {
  barColor: string;
  backgroundColor: string;
}

/**
 * Vẽ một khung hình: mỗi bin tần số là một cột, cao tỉ lệ với giá trị 0–255.
 * Hàm thuần (không lên lịch, không đọc analyser) để test được với dữ liệu cố định.
 * Toạ độ tính bằng pixel thật của canvas (đã nhân devicePixelRatio).
 */
export function drawFrequencyBars(
  ctx: CanvasRenderingContext2D,
  data: Uint8Array,
  width: number,
  height: number,
  style: BarStyle,
): void {
  ctx.fillStyle = style.backgroundColor;
  ctx.fillRect(0, 0, width, height);
  if (data.length === 0 || width === 0 || height === 0) return;

  const slot = width / data.length;
  // Chừa khe 1px giữa các cột khi đủ rộng; FFT 512 trên màn hẹp thì cột liền nhau
  const barWidth = slot > 2 ? slot - 1 : slot;
  ctx.fillStyle = style.barColor;
  for (let i = 0; i < data.length; i++) {
    const barHeight = (data[i] / 255) * height;
    ctx.fillRect(i * slot, height - barHeight, barWidth, barHeight);
  }
}

/**
 * Sở hữu đúng MỘT vòng requestAnimationFrame và một ResizeObserver cho một canvas.
 * Dữ liệu FFT đi thẳng analyser → Uint8Array → canvas, không qua React state.
 */
export class CanvasVisualizer {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D | null;
  private readonly getAnalyser: () => AnalyserNode | null;
  private readonly style: BarStyle;
  private readonly resizeObserver: ResizeObserver;
  private frameId: number | null = null;
  /** Dùng lại giữa các frame; chỉ cấp phát mới khi số bin đổi (đổi FFT 256 ↔ 512). */
  private data = new Uint8Array(0);
  private disposed = false;

  constructor(canvas: HTMLCanvasElement, getAnalyser: () => AnalyserNode | null, style: BarStyle) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.getAnalyser = getAnalyser;
    this.style = style;
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();
  }

  /** Gọi nhiều lần vẫn chỉ có một vòng lặp. */
  start(): void {
    if (this.frameId !== null || this.disposed) return;
    const loop = () => {
      this.renderFrame();
      this.frameId = requestAnimationFrame(loop);
    };
    this.frameId = requestAnimationFrame(loop);
  }

  stop(): void {
    if (this.frameId === null) return;
    cancelAnimationFrame(this.frameId);
    this.frameId = null;
    this.clear();
  }

  isRunning = (): boolean => this.frameId !== null;

  /** Dừng vòng lặp, bỏ theo dõi kích thước. Idempotent. */
  dispose(): void {
    if (this.disposed) return;
    this.stop();
    this.disposed = true;
    this.resizeObserver.disconnect();
  }

  renderFrame(): void {
    const analyser = this.getAnalyser();
    if (!this.ctx || !analyser) return;
    if (this.data.length !== analyser.frequencyBinCount) {
      this.data = new Uint8Array(analyser.frequencyBinCount);
    }
    analyser.getByteFrequencyData(this.data);
    drawFrequencyBars(this.ctx, this.data, this.canvas.width, this.canvas.height, this.style);
  }

  /** Kích thước bộ đệm canvas = kích thước CSS × devicePixelRatio để cột không bị mờ trên màn hình HiDPI. */
  resize(): void {
    const ratio = globalThis.devicePixelRatio || 1;
    const width = Math.round(this.canvas.clientWidth * ratio);
    const height = Math.round(this.canvas.clientHeight * ratio);
    if (this.canvas.width !== width || this.canvas.height !== height) {
      // Gán width/height sẽ xóa trắng canvas, nên chỉ gán khi thật sự đổi
      this.canvas.width = width;
      this.canvas.height = height;
      if (this.frameId === null) this.clear();
    }
  }

  private clear() {
    if (this.ctx) drawFrequencyBars(this.ctx, new Uint8Array(0), this.canvas.width, this.canvas.height, this.style);
  }
}
