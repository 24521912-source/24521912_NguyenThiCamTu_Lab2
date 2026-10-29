import type { FftSize, PlaybackState, Unsubscribe } from '../types/audio';

/**
 * Chủ sở hữu DUY NHẤT của AudioContext, AnalyserNode và AudioBufferSourceNode đang phát.
 * Đồ thị âm thanh: AudioBufferSourceNode → AnalyserNode → destination.
 */
export class AudioEngine {
  private context: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: AudioBufferSourceNode | null = null;
  /** Tăng mỗi lần play(): callback onended của lần phát cũ không thể sửa trạng thái của lần phát mới. */
  private playbackId = 0;
  private fftSize: FftSize = 256;
  private disposed = false;
  private state: PlaybackState = 'idle';
  private readonly listeners = new Set<(state: PlaybackState) => void>();

  /** Tạo context ở lần đầu cần dùng (lazy), các lần sau dùng lại. */
  getContext(): AudioContext {
    if (this.disposed) throw new Error('AudioEngine đã bị dispose');
    if (!this.context) {
      this.context = new AudioContext();
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = this.fftSize;
      // Nối analyser → loa đúng một lần; mỗi source mới chỉ nối vào analyser, nên không bị nhân đôi tín hiệu
      this.analyser.connect(this.context.destination);
    }
    return this.context;
  }

  /** Trình duyệt chặn autoplay: context có thể bắt đầu ở trạng thái suspended, phải resume sau thao tác người dùng. */
  async resume(): Promise<void> {
    const context = this.getContext();
    if (context.state === 'suspended') await context.resume();
  }

  async play(buffer: AudioBuffer): Promise<void> {
    await this.resume();
    // Có thể đã bị dispose trong lúc chờ resume
    if (this.disposed || !this.context || !this.analyser) return;

    this.releaseSource();
    // AudioBufferSourceNode chỉ start() được một lần → luôn tạo node mới cho mỗi lần phát
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.analyser);

    const id = ++this.playbackId;
    source.onended = () => {
      if (id !== this.playbackId) return; // callback cũ, bỏ qua
      this.releaseSource();
      this.setState('ended');
    };

    this.source = source;
    source.start();
    this.setState('playing');
  }

  /** Dừng bài đang phát. Gọi khi không có gì đang phát cũng an toàn. */
  stop(): void {
    if (!this.source) return;
    this.playbackId++;
    this.releaseSource();
    this.setState('stopped');
  }

  setFftSize(size: FftSize): void {
    this.fftSize = size;
    if (this.analyser) this.analyser.fftSize = size;
  }

  getFftSize = (): FftSize => this.fftSize;

  /** frequencyBinCount luôn bằng fftSize / 2. */
  getFrequencyBinCount = (): number => this.analyser?.frequencyBinCount ?? this.fftSize / 2;

  /** null khi chưa có context: visualizer khi đó không vẽ gì. */
  getAnalyser = (): AnalyserNode | null => this.analyser;

  getState = (): PlaybackState => this.state;

  subscribe = (listener: (state: PlaybackState) => void): Unsubscribe => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  /** Giải phóng mọi tài nguyên và đóng context. Idempotent. */
  async dispose(): Promise<void> {
    if (this.disposed) return;
    this.disposed = true;
    this.playbackId++;
    this.releaseSource();
    this.listeners.clear();
    this.analyser?.disconnect();
    this.analyser = null;
    const context = this.context;
    this.context = null;
    if (context && context.state !== 'closed') await context.close();
  }

  private releaseSource() {
    const source = this.source;
    if (!source) return;
    this.source = null;
    source.onended = null;
    try {
      source.stop();
    } catch {
      // Bỏ qua có chủ đích: source đã dừng hoặc chưa start sẽ ném InvalidStateError, cleanup vẫn phải tiếp tục
    }
    source.disconnect();
  }

  private setState(state: PlaybackState) {
    if (this.state === state) return;
    this.state = state;
    this.listeners.forEach((listener) => listener(state));
  }
}
