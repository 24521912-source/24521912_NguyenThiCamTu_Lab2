/** Mọi giá trị thời gian trong project đều là mili giây (ms). Không dùng giây trong logic. */
export type EpochMs = number;
export type DurationMs = number;

/** Nguồn thời gian. Mặc định là Date.now; test truyền đồng hồ giả. */
export type Clock = () => EpochMs;

/** Bộ lên lịch frame. Mặc định là requestAnimationFrame / cancelAnimationFrame. */
export interface FrameScheduler {
  request(callback: () => void): number;
  cancel(id: number): void;
}

export interface DeadlineTimerOptions {
  /** Mốc kết thúc TUYỆT ĐỐI (epoch ms), không phải khoảng thời gian. */
  targetTime: EpochMs;
  /** Gọi mỗi frame với số ms còn lại, luôn >= 0. */
  onTick: (remainingMs: DurationMs) => void;
  /** Gọi đúng một lần khi còn lại 0 ms. */
  onComplete?: () => void;
  now?: Clock;
  scheduler?: FrameScheduler;
}

/** Hàm hủy timer. Gọi nhiều lần vẫn an toàn; sau khi hủy không còn onTick nào. */
export type CancelTimer = () => void;

/** Giai đoạn của đợt sale, suy ra từ thời điểm hiện tại so với mốc mở/đóng. */
export type SalePhase = 'PENDING' | 'ACTIVE' | 'ENDED';

export interface SaleWindow {
  startsAt: EpochMs;
  /** Sale mở trong khoảng [startsAt, endsAt): đúng endsAt là đã đóng. */
  endsAt: EpochMs;
}
