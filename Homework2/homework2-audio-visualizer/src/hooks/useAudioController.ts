import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { AudioEngine } from '../audio/AudioEngine';
import { decodeAudio } from '../audio/decodeAudio';
import { fetchAudio } from '../audio/fetchAudio';
import { AudioTaskQueue } from '../queue/AudioTaskQueue';
import type { FftSize, PlaybackState } from '../types/audio';
import { isAbortError, type QueueSnapshot } from '../types/queue';
import { CanvasVisualizer } from '../visualizer/CanvasVisualizer';

export interface LoadedTrack {
  id: number;
  label: string;
  buffer: AudioBuffer;
}

export interface Notice {
  kind: 'info' | 'error';
  text: string;
}

interface Engines {
  engine: AudioEngine;
  queue: AudioTaskQueue;
  visualizer: CanvasVisualizer;
}

// ponytail: chỉ giữ 5 bài đã giải mã gần nhất để không giữ AudioBuffer lớn mãi; tăng nếu cần playlist dài
const MAX_TRACKS = 5;

export const trackLabel = (url: string) => url.split(/[/?#]/).filter(Boolean).at(-1) ?? url;

const errorText = (error: unknown) => (error instanceof Error ? error.message : String(error));

/**
 * Nối AudioTaskQueue + AudioEngine + CanvasVisualizer vào React.
 * Chỉ các sự kiện có ý nghĩa (hàng đợi đổi, trạng thái phát đổi, tải xong/lỗi/hủy) mới thành state;
 * dữ liệu FFT đi thẳng analyser → canvas, không làm React render lại mỗi frame.
 */
export function useAudioController(canvasRef: RefObject<HTMLCanvasElement | null>) {
  const [queueItems, setQueueItems] = useState<QueueSnapshot>([]);
  const [playback, setPlayback] = useState<PlaybackState>('idle');
  const [fftSize, setFftSizeState] = useState<FftSize>(256);
  const [tracks, setTracks] = useState<LoadedTrack[]>([]);
  const [nowPlaying, setNowPlaying] = useState<LoadedTrack | null>(null);
  const [notice, setNotice] = useState<Notice>({ kind: 'info', text: 'Chưa có bài nào. Hãy thêm bài vào hàng đợi.' });
  const enginesRef = useRef<Engines | null>(null);
  const nextTrackId = useRef(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Tạo trong effect (không phải trong render): StrictMode mount → cleanup → mount sẽ có bộ engine mới, không dùng lại bộ đã dispose
    const engine = new AudioEngine();
    const queue = new AudioTaskQueue({
      fetchAudio,
      decodeAudio: (data) => decodeAudio(engine.getContext(), data),
    });
    const css = getComputedStyle(canvas);
    const visualizer = new CanvasVisualizer(canvas, engine.getAnalyser, {
      barColor: css.getPropertyValue('--viz-bar').trim() || '#22d3ee',
      backgroundColor: css.getPropertyValue('--viz-bg').trim() || '#0f172a',
    });

    const offQueue = queue.subscribe(setQueueItems);
    const offEngine = engine.subscribe((state) => {
      setPlayback(state);
      if (state === 'playing') {
        visualizer.start();
        return;
      }
      visualizer.stop();
      setNowPlaying(null);
      if (state === 'ended') setNotice({ kind: 'info', text: 'Đã phát hết bài.' });
    });

    enginesRef.current = { engine, queue, visualizer };

    return () => {
      enginesRef.current = null;
      offQueue();
      offEngine();
      queue.dispose();
      visualizer.dispose();
      void engine.dispose();
    };
  }, [canvasRef]);

  const enqueue = useCallback(async (url: string) => {
    const engines = enginesRef.current;
    if (!engines) return;
    const label = trackLabel(url);
    try {
      const buffer = await engines.queue.enqueue(url);
      // Component đã unmount (hoặc remount) trong lúc chờ → bỏ kết quả, không cập nhật UI cũ
      if (enginesRef.current !== engines) return;
      const track = { id: nextTrackId.current++, label, buffer };
      setTracks((previous) => [track, ...previous].slice(0, MAX_TRACKS));
      setNotice({ kind: 'info', text: `Đã tải xong: ${label}` });
    } catch (error) {
      if (enginesRef.current !== engines) return;
      setNotice(
        isAbortError(error)
          ? { kind: 'info', text: `Đã hủy: ${label}` }
          : { kind: 'error', text: `Không tải được ${label}. ${errorText(error)}` },
      );
    }
  }, []);

  const cancel = useCallback((id: number) => {
    enginesRef.current?.queue.cancel(id);
  }, []);

  const play = useCallback(async (track: LoadedTrack) => {
    const engines = enginesRef.current;
    if (!engines) return;
    try {
      await engines.engine.play(track.buffer);
      if (enginesRef.current !== engines) return;
      setNowPlaying(track);
      setNotice({ kind: 'info', text: `Đang phát: ${track.label}` });
    } catch (error) {
      if (enginesRef.current === engines) setNotice({ kind: 'error', text: `Không phát được: ${errorText(error)}` });
    }
  }, []);

  const stop = useCallback(() => {
    enginesRef.current?.engine.stop();
    setNotice({ kind: 'info', text: 'Đã dừng phát.' });
  }, []);

  const changeFftSize = useCallback((size: FftSize) => {
    enginesRef.current?.engine.setFftSize(size);
    setFftSizeState(size);
  }, []);

  return {
    queueItems,
    playback,
    fftSize,
    binCount: fftSize / 2,
    tracks,
    nowPlaying,
    notice,
    enqueue,
    cancel,
    play,
    stop,
    changeFftSize,
  };
}
