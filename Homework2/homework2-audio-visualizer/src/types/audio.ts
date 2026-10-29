/** FFT size đề bài cho phép. frequencyBinCount = fftSize / 2 → 128 hoặc 256 bin. */
export type FftSize = 256 | 512;

export const FFT_SIZES: readonly FftSize[] = [256, 512];

/**
 * Trạng thái phát của AudioEngine.
 * - idle: chưa phát lần nào
 * - playing: đang phát
 * - stopped: người dùng bấm dừng
 * - ended: phát hết bài một cách tự nhiên
 */
export type PlaybackState = 'idle' | 'playing' | 'stopped' | 'ended';

export type Unsubscribe = () => void;

/** Tải dữ liệu thô của một bài. Phải tôn trọng signal để hủy được request. */
export type FetchAudio = (trackUrl: string, signal: AbortSignal) => Promise<ArrayBuffer>;

/** Giải mã dữ liệu thô thành AudioBuffer. Không hủy được giữa chừng (decodeAudioData không nhận AbortSignal). */
export type DecodeAudio = (data: ArrayBuffer) => Promise<AudioBuffer>;
