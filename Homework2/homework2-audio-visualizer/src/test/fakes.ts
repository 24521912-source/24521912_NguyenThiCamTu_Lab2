// Bản giả lập Web Audio / Canvas / requestAnimationFrame cho jsdom (jsdom không có các API này).
// Chỉ dùng trong test, nên ép kiểu sang kiểu DOM thật là chấp nhận được.
import { vi } from 'vitest';

export class FakeAudioNode {
  readonly connections = new Set<unknown>();
  disconnectCalls = 0;

  connect<T>(destination: T): T {
    this.connections.add(destination);
    return destination;
  }

  disconnect(): void {
    this.disconnectCalls++;
    this.connections.clear();
  }
}

export class FakeAnalyserNode extends FakeAudioNode {
  fftSize = 2048;
  readonly reads: Uint8Array[] = [];

  get frequencyBinCount(): number {
    return this.fftSize / 2;
  }

  getByteFrequencyData(array: Uint8Array): void {
    this.reads.push(array);
    array.fill(200);
  }
}

export class FakeBufferSourceNode extends FakeAudioNode {
  buffer: AudioBuffer | null = null;
  onended: (() => void) | null = null;
  started = false;
  stopCalls = 0;

  start(): void {
    if (this.started) throw new DOMException('start() gọi hai lần', 'InvalidStateError');
    this.started = true;
  }

  stop(): void {
    if (!this.started) throw new DOMException('stop() trước start()', 'InvalidStateError');
    this.stopCalls++;
  }

  /** Giả lập bài phát hết tự nhiên. */
  finish(): void {
    this.onended?.();
  }
}

export class FakeAudioContext {
  static instances: FakeAudioContext[] = [];
  state: AudioContextState = 'suspended';
  readonly destination = new FakeAudioNode();
  readonly analysers: FakeAnalyserNode[] = [];
  readonly sources: FakeBufferSourceNode[] = [];
  readonly resume = vi.fn(async () => {
    this.state = 'running';
  });
  readonly close = vi.fn(async () => {
    this.state = 'closed';
  });
  readonly decodeAudioData = vi.fn(async (data: ArrayBuffer) => fakeAudioBuffer(data.byteLength));

  constructor() {
    FakeAudioContext.instances.push(this);
  }

  createAnalyser(): FakeAnalyserNode {
    const analyser = new FakeAnalyserNode();
    this.analysers.push(analyser);
    return analyser;
  }

  createBufferSource(): FakeBufferSourceNode {
    const source = new FakeBufferSourceNode();
    this.sources.push(source);
    return source;
  }
}

export const fakeAudioBuffer = (duration = 1) => ({ duration }) as AudioBuffer;

export const latestContext = (): FakeAudioContext => {
  const context = FakeAudioContext.instances.at(-1);
  if (!context) throw new Error('Chưa có AudioContext nào được tạo');
  return context;
};

/** requestAnimationFrame điều khiển bằng tay: frame chỉ chạy khi test gọi flushFrame(). */
export const animationFrames = {
  pending: new Map<number, FrameRequestCallback>(),
  nextId: 1,
  requested: 0,
  reset() {
    this.pending.clear();
    this.nextId = 1;
    this.requested = 0;
  },
  flushFrame(time = 16) {
    const callbacks = [...this.pending.values()];
    this.pending.clear();
    callbacks.forEach((callback) => callback(time));
  },
};

export class FakeResizeObserver {
  static instances: FakeResizeObserver[] = [];
  readonly callback: ResizeObserverCallback;
  readonly targets = new Set<Element>();
  disconnected = false;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    FakeResizeObserver.instances.push(this);
  }

  observe(target: Element) {
    this.targets.add(target);
  }

  unobserve(target: Element) {
    this.targets.delete(target);
  }

  disconnect() {
    this.disconnected = true;
    this.targets.clear();
  }

  trigger() {
    this.callback([], this as unknown as ResizeObserver);
  }
}

export interface FakeCanvasContext {
  fillStyle: string;
  rects: [number, number, number, number][];
  fillRect(x: number, y: number, width: number, height: number): void;
}

export function createFakeCanvasContext(): FakeCanvasContext {
  return {
    fillStyle: '',
    rects: [],
    fillRect(x, y, width, height) {
      this.rects.push([x, y, width, height]);
    },
  };
}
