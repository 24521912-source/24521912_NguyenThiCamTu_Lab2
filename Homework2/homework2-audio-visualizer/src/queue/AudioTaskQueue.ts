import type { DecodeAudio, FetchAudio, Unsubscribe } from '../types/audio';
import {
  AudioTaskError,
  createAbortError,
  type AudioTask,
  type AudioTaskQueueOptions,
  type QueueSnapshot,
} from '../types/queue';

/**
 * Hàng đợi FIFO tải + giải mã audio với đúng MỘT worker.
 * Nhiều enqueue() cùng lúc vẫn được xử lý lần lượt theo thứ tự gửi.
 * Không phụ thuộc React: UI theo dõi qua subscribe() / getSnapshot().
 */
export class AudioTaskQueue {
  private queue: AudioTask[] = [];
  private isProcessing = false;
  /** Task đang chạy (thay cho activeController của ví dụ gốc: task đã chứa controller của nó). */
  private activeTask: AudioTask | null = null;
  private disposed = false;
  private nextId = 1;
  private snapshot: QueueSnapshot = [];
  private readonly listeners = new Set<(snapshot: QueueSnapshot) => void>();
  private readonly fetchAudio: FetchAudio;
  private readonly decodeAudio: DecodeAudio;

  constructor({ fetchAudio, decodeAudio }: AudioTaskQueueOptions) {
    this.fetchAudio = fetchAudio;
    this.decodeAudio = decodeAudio;
  }

  async enqueue(trackUrl: string): Promise<AudioBuffer> {
    if (this.disposed) {
      throw new AudioTaskError('disposed', 'Hàng đợi đã bị hủy, không nhận thêm task');
    }
    const controller = new AbortController();

    return new Promise<AudioBuffer>((resolve, reject) => {
      this.queue.push({ id: this.nextId++, trackUrl, controller, resolve, reject, status: 'queued', settled: false });
      this.notify();
      void this.processNext();
    });
  }

  /**
   * Hủy một task theo id.
   * - Còn chờ: xóa khỏi hàng, không bao giờ fetch.
   * - Đang fetch: abort signal, fetch tự dừng.
   * - Đang decode: decodeAudioData không hủy được → reject ngay, worker bỏ kết quả khi decode xong.
   * Trả về false nếu task không còn (đã xong hoặc id sai). Gọi lặp lại là an toàn.
   */
  cancel(id: number): boolean {
    const index = this.queue.findIndex((task) => task.id === id);
    if (index !== -1) {
      const [task] = this.queue.splice(index, 1);
      this.abort(task);
      this.notify();
      return true;
    }
    if (this.activeTask?.id === id) {
      this.abort(this.activeTask);
      return true;
    }
    return false;
  }

  /** Hủy mọi task còn lại và từ chối enqueue mới. Idempotent. */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    const pending = this.queue;
    this.queue = [];
    pending.forEach((task) => this.abort(task, 'Hàng đợi đã bị hủy'));
    if (this.activeTask) this.abort(this.activeTask, 'Hàng đợi đã bị hủy');
    this.notify();
    this.listeners.clear();
  }

  getSnapshot = (): QueueSnapshot => this.snapshot;

  subscribe = (listener: (snapshot: QueueSnapshot) => void): Unsubscribe => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private async processNext(): Promise<void> {
    // Cờ isProcessing chặn worker thứ hai: enqueue() gọi processNext() mỗi lần nhưng chỉ một lần được chạy
    if (this.isProcessing || this.disposed) return;
    const task = this.queue.shift();
    if (!task) return; // hết việc → về trạng thái rảnh

    this.isProcessing = true;
    this.activeTask = task;
    const { signal } = task.controller;

    try {
      task.status = 'fetching';
      this.notify();
      const data = await this.fetchAudio(task.trackUrl, signal);
      signal.throwIfAborted();

      task.status = 'decoding';
      this.notify();
      const buffer = await this.decodeAudio(data);
      // Bị hủy trong lúc decode: bỏ kết quả, không bao giờ resolve thành công
      signal.throwIfAborted();

      this.settle(task, () => task.resolve(buffer));
    } catch (error) {
      this.settle(task, () => task.reject(error));
    } finally {
      // finally luôn chạy dù thành công, lỗi hay hủy → lỗi một task không chặn task sau
      this.isProcessing = false;
      this.activeTask = null;
      this.notify();
      void this.processNext();
    }
  }

  private abort(task: AudioTask, message?: string) {
    const reason = createAbortError(message);
    task.controller.abort(reason);
    this.settle(task, () => task.reject(reason));
  }

  /** Mỗi promise chỉ settle đúng một lần. */
  private settle(task: AudioTask, action: () => void) {
    if (task.settled) return;
    task.settled = true;
    action();
  }

  private notify() {
    const items = this.activeTask ? [this.activeTask, ...this.queue] : this.queue;
    this.snapshot = items.map(({ id, trackUrl, status }) => ({ id, trackUrl, status }));
    this.listeners.forEach((listener) => listener(this.snapshot));
  }
}
