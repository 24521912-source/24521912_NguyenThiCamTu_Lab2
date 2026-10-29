import type {
  CancelTimer,
  Clock,
  DeadlineTimerOptions,
  DurationMs,
  EpochMs,
  FrameScheduler,
  SalePhase,
  SaleWindow,
} from '../contracts/timer';

const browserScheduler: FrameScheduler = {
  request: (callback) => requestAnimationFrame(callback),
  cancel: (id) => cancelAnimationFrame(id),
};

/** Thời gian còn lại tính từ mốc tuyệt đối, không bao giờ âm. */
export const remainingUntil = (targetTime: EpochMs, now: EpochMs): DurationMs => Math.max(0, targetTime - now);

/**
 * Countdown chống trôi tới một mốc TUYỆT ĐỐI.
 * Mỗi frame tính lại remaining = targetTime - now(), KHÔNG trừ dần một khoảng cố định,
 * nên frame bị trễ (tab ẩn, máy bận) không làm sai số cộng dồn: frame kế tiếp tự đúng lại.
 */
export function createDeadlineTimer({
  targetTime,
  onTick,
  onComplete,
  now = Date.now,
  scheduler = browserScheduler,
}: DeadlineTimerOptions): CancelTimer {
  let frameId: number | null = null;
  let stopped = false;

  function tick() {
    frameId = null;
    if (stopped) return;
    const remaining = remainingUntil(targetTime, now());
    onTick(remaining);
    // onTick có thể tự hủy timer → kiểm tra lại trước khi lên lịch frame mới
    if (stopped) return;
    if (remaining > 0) {
      frameId = scheduler.request(tick);
    } else {
      stopped = true;
      onComplete?.();
    }
  }

  frameId = scheduler.request(tick);

  return () => {
    if (stopped) return;
    stopped = true;
    if (frameId !== null) scheduler.cancel(frameId);
    frameId = null;
  };
}

/** Phiên bản giống ví dụ của giảng viên: mốc = thời điểm gọi + durationMs. */
export function createAntiDriftTimer(
  durationMs: DurationMs,
  onTick: (remainingMs: DurationMs) => void,
  deps: { now?: Clock; scheduler?: FrameScheduler; onComplete?: () => void } = {},
): CancelTimer {
  const now = deps.now ?? Date.now;
  return createDeadlineTimer({ ...deps, now, targetTime: now() + durationMs, onTick });
}

/** Giai đoạn sale tại thời điểm `now`: mở trong [startsAt, endsAt). */
export function getSalePhase({ startsAt, endsAt }: SaleWindow, now: EpochMs): SalePhase {
  if (now < startsAt) return 'PENDING';
  return now < endsAt ? 'ACTIVE' : 'ENDED';
}
