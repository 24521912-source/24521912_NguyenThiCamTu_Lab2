import { describe, expect, it } from 'vitest';
import {
  FakeAnalyserNode,
  FakeResizeObserver,
  animationFrames,
  createFakeCanvasContext,
  type FakeCanvasContext,
} from '../test/fakes';
import { CanvasVisualizer, drawFrequencyBars } from './CanvasVisualizer';

const style = { barColor: '#0ff', backgroundColor: '#000' };

function sizeCanvas(canvas: HTMLCanvasElement, width: number, height: number) {
  Object.defineProperty(canvas, 'clientWidth', { configurable: true, value: width });
  Object.defineProperty(canvas, 'clientHeight', { configurable: true, value: height });
}

function setup(fftSize = 256) {
  const canvas = document.createElement('canvas');
  sizeCanvas(canvas, 300, 100);
  const analyser = new FakeAnalyserNode();
  analyser.fftSize = fftSize;
  let current: FakeAnalyserNode | null = analyser;
  const visualizer = new CanvasVisualizer(canvas, () => current as unknown as AnalyserNode | null, style);
  const ctx = canvas.getContext('2d') as unknown as FakeCanvasContext;
  return {
    canvas,
    analyser,
    visualizer,
    ctx,
    setAnalyser: (next: FakeAnalyserNode | null) => (current = next),
  };
}

describe('E01: vẽ cột tần số', () => {
  it('xóa nền rồi vẽ đúng một cột cho mỗi bin, cột nằm trong canvas', () => {
    const ctx = createFakeCanvasContext();
    const data = new Uint8Array([0, 255, 128, 64]);
    drawFrequencyBars(ctx as unknown as CanvasRenderingContext2D, data, 400, 100, style);

    expect(ctx.rects[0]).toEqual([0, 0, 400, 100]); // nền
    const bars = ctx.rects.slice(1);
    expect(bars).toHaveLength(4);
    expect(bars[1]).toEqual([100, 0, 99, 100]); // 255 → cao bằng canvas
    expect(bars[0][3]).toBe(0);
    for (const [x, y, width, height] of bars) {
      expect(x + width).toBeLessThanOrEqual(400);
      expect(y + height).toBeLessThanOrEqual(100);
      expect(y).toBeGreaterThanOrEqual(0);
    }
  });

  it('FFT 512 (256 cột) trên canvas hẹp vẫn không vẽ ra ngoài', () => {
    const ctx = createFakeCanvasContext();
    drawFrequencyBars(ctx as unknown as CanvasRenderingContext2D, new Uint8Array(256).fill(255), 300, 80, style);
    const bars = ctx.rects.slice(1);
    expect(bars).toHaveLength(256);
    expect(Math.max(...bars.map(([x, , w]) => x + w))).toBeCloseTo(300);
  });

  it('dữ liệu rỗng hoặc canvas 0px chỉ vẽ nền', () => {
    const ctx = createFakeCanvasContext();
    drawFrequencyBars(ctx as unknown as CanvasRenderingContext2D, new Uint8Array(0), 100, 50, style);
    drawFrequencyBars(ctx as unknown as CanvasRenderingContext2D, new Uint8Array(4), 0, 0, style);
    expect(ctx.rects).toHaveLength(2);
  });
});

describe('E01: đọc analyser không cấp phát mỗi frame', () => {
  it('dùng lại cùng Uint8Array giữa các frame, cấp phát lại khi đổi FFT 256 → 512', () => {
    const { visualizer, analyser } = setup(256);
    visualizer.renderFrame();
    visualizer.renderFrame();
    expect(analyser.reads[0]).toHaveLength(128);
    expect(analyser.reads[1]).toBe(analyser.reads[0]);

    analyser.fftSize = 512;
    visualizer.renderFrame();
    expect(analyser.reads[2]).toHaveLength(256);
  });

  it('chưa có analyser (chưa phát) thì không vẽ, không lỗi', () => {
    const { visualizer, ctx, setAnalyser } = setup();
    setAnalyser(null);
    const before = ctx.rects.length;
    visualizer.renderFrame();
    expect(ctx.rects).toHaveLength(before);
  });
});

describe('E02: vòng requestAnimationFrame', () => {
  it('start nhiều lần vẫn chỉ có một vòng, mỗi frame lên lịch đúng một frame tiếp', () => {
    const { visualizer, analyser } = setup();
    visualizer.start();
    visualizer.start();
    expect(animationFrames.pending.size).toBe(1);

    animationFrames.flushFrame();
    animationFrames.flushFrame();
    expect(animationFrames.pending.size).toBe(1);
    expect(analyser.reads).toHaveLength(2);
  });

  it('stop hủy frame đã lên lịch và không vẽ thêm', () => {
    const { visualizer, analyser } = setup();
    visualizer.start();
    visualizer.stop();
    expect(animationFrames.pending.size).toBe(0);
    animationFrames.flushFrame();
    expect(analyser.reads).toHaveLength(0);
    expect(visualizer.isRunning()).toBe(false);
  });

  it('start lại sau stop chạy được', () => {
    const { visualizer, analyser } = setup();
    visualizer.start();
    visualizer.stop();
    visualizer.start();
    animationFrames.flushFrame();
    expect(analyser.reads).toHaveLength(1);
  });

  it('sau dispose: không còn frame, start không có tác dụng', () => {
    const { visualizer } = setup();
    visualizer.start();
    visualizer.dispose();
    visualizer.dispose();
    visualizer.start();
    expect(animationFrames.pending.size).toBe(0);
  });
});

describe('E03: kích thước canvas', () => {
  it('bộ đệm canvas = kích thước CSS × devicePixelRatio', () => {
    const original = globalThis.devicePixelRatio;
    globalThis.devicePixelRatio = 2;
    try {
      const { canvas } = setup();
      expect([canvas.width, canvas.height]).toEqual([600, 200]);
    } finally {
      globalThis.devicePixelRatio = original;
    }
  });

  it('cập nhật khi khung đổi kích thước (ResizeObserver), ví dụ màn 375px', () => {
    const { canvas } = setup();
    sizeCanvas(canvas, 343, 192);
    FakeResizeObserver.instances[0].trigger();
    expect([canvas.width, canvas.height]).toEqual([343, 192]);
  });

  it('dispose gỡ ResizeObserver', () => {
    const { visualizer } = setup();
    visualizer.dispose();
    expect(FakeResizeObserver.instances[0].disconnected).toBe(true);
  });
});
