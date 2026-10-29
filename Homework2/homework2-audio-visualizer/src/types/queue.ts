import type { DecodeAudio, FetchAudio } from './audio';

/** Vòng đời của một task: queued → fetching → decoding → (kết thúc và bị xóa khỏi queue). */
export type TaskStatus = 'queued' | 'fetching' | 'decoding';

/**
 * Một yêu cầu tải + giải mã audio trong hàng đợi.
 * Mở rộng từ ví dụ của giảng viên ({ trackUrl, controller, resolve, reject }) thêm id, status và cờ settled.
 */
export interface AudioTask {
  readonly id: number;
  readonly trackUrl: string;
  /** Mỗi task một controller riêng: hủy task này không ảnh hưởng task khác. */
  readonly controller: AbortController;
  readonly resolve: (buffer: AudioBuffer) => void;
  readonly reject: (reason: unknown) => void;
  status: TaskStatus;
  /** true sau lần settle đầu tiên: chặn resolve/reject lần hai (hủy và decode xong cùng lúc). */
  settled: boolean;
}

/** Thông tin chỉ-đọc cho UI, không lộ controller hay resolve/reject ra ngoài. */
export interface QueueItem {
  readonly id: number;
  readonly trackUrl: string;
  readonly status: TaskStatus;
}

/** Ảnh chụp hàng đợi theo thứ tự FIFO (task đang chạy đứng đầu). Giữ nguyên tham chiếu nếu không có gì đổi. */
export type QueueSnapshot = readonly QueueItem[];

export interface AudioTaskQueueOptions {
  fetchAudio: FetchAudio;
  decodeAudio: DecodeAudio;
}

export type AudioTaskErrorKind = 'invalid-url' | 'http' | 'network' | 'decode' | 'disposed';

/** Lỗi thật của task. Hủy thì KHÔNG dùng lớp này mà dùng DOMException 'AbortError' như fetch. */
export class AudioTaskError extends Error {
  readonly kind: AudioTaskErrorKind;

  constructor(kind: AudioTaskErrorKind, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'AudioTaskError';
    this.kind = kind;
  }
}

export const createAbortError = (message = 'Task đã bị hủy') => new DOMException(message, 'AbortError');

export const isAbortError = (error: unknown): boolean => error instanceof DOMException && error.name === 'AbortError';
