import { afterEach, beforeEach } from 'vitest';
import {
  FakeAudioContext,
  FakeResizeObserver,
  animationFrames,
  createFakeCanvasContext,
  type FakeCanvasContext,
} from './fakes';

const canvasContexts = new WeakMap<HTMLCanvasElement, FakeCanvasContext>();

beforeEach(() => {
  FakeAudioContext.instances = [];
  FakeResizeObserver.instances = [];
  animationFrames.reset();

  Object.assign(globalThis, {
    AudioContext: FakeAudioContext,
    ResizeObserver: FakeResizeObserver,
    requestAnimationFrame: (callback: FrameRequestCallback) => {
      const id = animationFrames.nextId++;
      animationFrames.requested++;
      animationFrames.pending.set(id, callback);
      return id;
    },
    cancelAnimationFrame: (id: number) => animationFrames.pending.delete(id),
  });

  // jsdom không vẽ canvas: trả về context giả ghi lại các lệnh fillRect
  HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement) {
    if (!canvasContexts.has(this)) canvasContexts.set(this, createFakeCanvasContext());
    return canvasContexts.get(this);
  } as unknown as HTMLCanvasElement['getContext'];
});

afterEach(() => {
  animationFrames.reset();
});
