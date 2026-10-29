import { describe, expect, it } from 'vitest';
import { FakeAudioContext, animationFrames } from './fakes';

describe('G01: hạ tầng test', () => {
  it('cài các bản giả lập Web Audio, rAF và canvas', () => {
    const context = new AudioContext();
    expect(context).toBeInstanceOf(FakeAudioContext);

    let ran = false;
    requestAnimationFrame(() => (ran = true));
    expect(ran).toBe(false);
    animationFrames.flushFrame();
    expect(ran).toBe(true);

    expect(document.createElement('canvas').getContext('2d')).not.toBeNull();
  });
});
