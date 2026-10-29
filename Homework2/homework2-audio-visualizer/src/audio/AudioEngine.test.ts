import { describe, expect, it } from 'vitest';
import { FakeAudioContext, fakeAudioBuffer, latestContext } from '../test/fakes';
import type { PlaybackState } from '../types/audio';
import { AudioEngine } from './AudioEngine';

function setup() {
  const engine = new AudioEngine();
  const states: PlaybackState[] = [];
  engine.subscribe((state) => states.push(state));
  return { engine, states };
}

describe('D01: vòng đời AudioContext', () => {
  it('chỉ tạo context khi cần và dùng lại đúng một context', async () => {
    const { engine } = setup();
    expect(FakeAudioContext.instances).toHaveLength(0);

    const context = engine.getContext();
    await engine.play(fakeAudioBuffer());
    await engine.play(fakeAudioBuffer());

    expect(engine.getContext()).toBe(context);
    expect(FakeAudioContext.instances).toHaveLength(1);
  });

  it('resume context đang suspended, không gọi lại khi đã running', async () => {
    const { engine } = setup();
    await engine.resume();
    await engine.resume();
    expect(latestContext().resume).toHaveBeenCalledTimes(1);
    expect(latestContext().state).toBe('running');
  });

  it('dispose đóng context, gọi lại an toàn, không tạo context mới sau đó', async () => {
    const { engine } = setup();
    engine.getContext();
    await engine.dispose();
    await engine.dispose();

    expect(latestContext().close).toHaveBeenCalledTimes(1);
    expect(() => engine.getContext()).toThrow();
    expect(FakeAudioContext.instances).toHaveLength(1);
  });

  it('dispose khi chưa từng tạo context không lỗi', async () => {
    const { engine } = setup();
    await engine.dispose();
    expect(FakeAudioContext.instances).toHaveLength(0);
  });
});

describe('D02: phát AudioBuffer', () => {
  it('mỗi lần phát dùng một source mới: source → analyser → destination', async () => {
    const { engine, states } = setup();
    const buffer = fakeAudioBuffer(2);
    await engine.play(buffer);

    const context = latestContext();
    const [source] = context.sources;
    const [analyser] = context.analysers;
    expect(source.buffer).toBe(buffer);
    expect(source.started).toBe(true);
    expect([...source.connections]).toEqual([analyser]);
    expect([...analyser.connections]).toEqual([context.destination]);
    expect(states).toEqual(['playing']);
  });

  it('phát bài khác khi đang phát: dừng + ngắt source cũ, không start lại source cũ', async () => {
    const { engine } = setup();
    await engine.play(fakeAudioBuffer());
    await engine.play(fakeAudioBuffer());

    const [first, second] = latestContext().sources;
    expect(first.stopCalls).toBe(1);
    expect(first.disconnectCalls).toBe(1);
    expect(first.onended).toBeNull();
    expect(second.started).toBe(true);
    expect(latestContext().sources).toHaveLength(2);
  });

  it('stop dừng source, gọi stop lặp lại hoặc khi chưa phát là an toàn', () => {
    const { engine, states } = setup();
    engine.stop();
    expect(states).toEqual([]);
    return engine.play(fakeAudioBuffer()).then(() => {
      engine.stop();
      engine.stop();
      const [source] = latestContext().sources;
      expect(source.stopCalls).toBe(1);
      expect(states).toEqual(['playing', 'stopped']);
    });
  });

  it('phát hết tự nhiên: chuyển sang ended và ngắt source', async () => {
    const { engine, states } = setup();
    await engine.play(fakeAudioBuffer());
    const [source] = latestContext().sources;
    source.finish();

    expect(states).toEqual(['playing', 'ended']);
    expect(source.disconnectCalls).toBe(1);
    engine.stop(); // không còn gì để dừng
    expect(states).toEqual(['playing', 'ended']);
  });
});

describe('D03: dọn dẹp tài nguyên', () => {
  it('callback onended của lần phát cũ không đổi trạng thái của lần phát mới', async () => {
    const { engine, states } = setup();
    await engine.play(fakeAudioBuffer());
    const [first] = latestContext().sources;
    const staleOnEnded = first.onended;

    await engine.play(fakeAudioBuffer());
    staleOnEnded?.();

    expect(engine.getState()).toBe('playing');
    expect(states).toEqual(['playing']);
    expect(latestContext().sources[1].disconnectCalls).toBe(0);
  });

  it('dispose khi đang phát: dừng source, ngắt analyser, đóng context', async () => {
    const { engine } = setup();
    await engine.play(fakeAudioBuffer());
    const context = latestContext();
    await engine.dispose();

    expect(context.sources[0].stopCalls).toBe(1);
    expect(context.sources[0].disconnectCalls).toBe(1);
    expect(context.analysers[0].disconnectCalls).toBe(1);
    expect(context.close).toHaveBeenCalledTimes(1);
    expect(engine.getAnalyser()).toBeNull();
  });

  it('dispose trong lúc play() đang chờ resume: không tạo source', async () => {
    const { engine } = setup();
    const playing = engine.play(fakeAudioBuffer());
    await engine.dispose();
    await playing;
    expect(latestContext().sources).toHaveLength(0);
  });

  it('source đã kết thúc rồi mới dispose không ném lỗi', async () => {
    const { engine } = setup();
    await engine.play(fakeAudioBuffer());
    latestContext().sources[0].finish();
    await expect(engine.dispose()).resolves.toBeUndefined();
  });
});

describe('D04: AnalyserNode và FFT', () => {
  it('FFT 256 → 128 bin, FFT 512 → 256 bin, áp dụng cả khi đổi trước lúc có context', () => {
    const { engine } = setup();
    engine.setFftSize(512);
    expect(engine.getFrequencyBinCount()).toBe(256);

    engine.getContext();
    const [analyser] = latestContext().analysers;
    expect(analyser.fftSize).toBe(512);
    expect(analyser.frequencyBinCount).toBe(256);

    engine.setFftSize(256);
    expect(analyser.fftSize).toBe(256);
    expect(engine.getFrequencyBinCount()).toBe(128);
  });

  it('analyser nối ra loa đúng một lần dù phát nhiều lần (không nhân đôi tín hiệu)', async () => {
    const { engine } = setup();
    await engine.play(fakeAudioBuffer());
    await engine.play(fakeAudioBuffer());
    expect(latestContext().analysers).toHaveLength(1);
    expect(latestContext().analysers[0].connections.size).toBe(1);
  });
});
