import { describe, expect, it, vi } from 'vitest';
import { createAntiDriftTimer, createDeadlineTimer, getSalePhase, remainingUntil } from '../engines/timerEngine';
import type { FrameScheduler } from '../contracts/timer';

/** Đồng hồ + bộ lên lịch frame do test điều khiển: frame chỉ chạy khi gọi frame(). */
function harness(start = 1_000_000) {
  let time = start;
  const pending = new Map<number, () => void>();
  let nextId = 1;
  const scheduler: FrameScheduler = {
    request: (callback) => {
      pending.set(nextId, callback);
      return nextId++;
    },
    cancel: (id) => pending.delete(id),
  };
  return {
    now: () => time,
    scheduler,
    pending,
    advance: (ms: number) => (time += ms),
    setTime: (ms: number) => (time = ms),
    /** Chạy các frame đang chờ (giống trình duyệt vẽ một frame). */
    frame() {
      const callbacks = [...pending.values()];
      pending.clear();
      callbacks.forEach((callback) => callback());
    },
  };
}

describe('H3-B02: remainingUntil / getSalePhase', () => {
  it('tính từ mốc tuyệt đối và không bao giờ âm', () => {
    expect(remainingUntil(5_000, 1_000)).toBe(4_000);
    expect(remainingUntil(5_000, 5_000)).toBe(0);
    expect(remainingUntil(5_000, 9_999)).toBe(0);
  });

  it('sale mở trong [startsAt, endsAt): đúng startsAt là mở, đúng endsAt là đóng', () => {
    const window = { startsAt: 100, endsAt: 200 };
    expect(getSalePhase(window, 99)).toBe('PENDING');
    expect(getSalePhase(window, 100)).toBe('ACTIVE');
    expect(getSalePhase(window, 199)).toBe('ACTIVE');
    expect(getSalePhase(window, 200)).toBe('ENDED');
  });
});

describe('H3-B02: createDeadlineTimer', () => {
  it('frame đầu báo đúng thời gian còn lại', () => {
    const h = harness();
    const ticks: number[] = [];
    createDeadlineTimer({ targetTime: h.now() + 10_000, onTick: (ms) => ticks.push(ms), now: h.now, scheduler: h.scheduler });
    h.advance(16);
    h.frame();
    expect(ticks).toEqual([9_984]);
  });

  it('frame bị trễ (tab ẩn 5 giây) không làm trôi: giá trị luôn khớp đồng hồ thật', () => {
    const h = harness();
    const ticks: number[] = [];
    const target = h.now() + 10_000;
    createDeadlineTimer({ targetTime: target, onTick: (ms) => ticks.push(ms), now: h.now, scheduler: h.scheduler });

    h.advance(16);
    h.frame();
    h.advance(5_000); // tab bị ẩn: không có frame nào trong 5 giây
    h.frame();
    h.advance(33); // máy bận: frame trễ gấp đôi
    h.frame();

    expect(ticks).toEqual([target - (1_000_000 + 16), target - (1_000_000 + 5_016), target - (1_000_000 + 5_049)]);
    // Nếu trừ cố định 16ms mỗi frame thì sẽ chỉ còn 10_000 - 48, sai lệch gần 5 giây
    expect(ticks.at(-1)).toBe(10_000 - 5_049);
  });

  it('chạm 0 thì dừng: báo 0 đúng một lần, gọi onComplete một lần, không lên lịch frame mới', () => {
    const h = harness();
    const ticks: number[] = [];
    const onComplete = vi.fn();
    createDeadlineTimer({ targetTime: h.now() + 50, onTick: (ms) => ticks.push(ms), onComplete, now: h.now, scheduler: h.scheduler });

    h.advance(30);
    h.frame();
    h.advance(200); // quá hạn nhiều: vẫn không âm
    h.frame();
    h.frame();

    expect(ticks).toEqual([20, 0]);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(h.pending.size).toBe(0);
  });

  it('hủy: không còn tick nào, hủy nhiều lần an toàn', () => {
    const h = harness();
    const onTick = vi.fn();
    const cancel = createDeadlineTimer({ targetTime: h.now() + 1_000, onTick, now: h.now, scheduler: h.scheduler });
    h.frame();
    cancel();
    cancel();
    h.advance(100);
    h.frame();
    expect(onTick).toHaveBeenCalledTimes(1);
    expect(h.pending.size).toBe(0);
  });

  it('hủy ngay trong onTick thì không lên lịch frame tiếp theo', () => {
    const h = harness();
    const onTick = vi.fn(() => cancel());
    const cancel = createDeadlineTimer({ targetTime: h.now() + 1_000, onTick, now: h.now, scheduler: h.scheduler });
    h.frame();
    // Kiểm tra NGAY sau frame đó: không được còn frame nào trong hàng chờ
    expect(h.pending.size).toBe(0);
    h.frame();
    expect(onTick).toHaveBeenCalledTimes(1);
  });

  it('mỗi timer chỉ có một vòng frame (không nhân đôi)', () => {
    const h = harness();
    createDeadlineTimer({ targetTime: h.now() + 1_000, onTick: () => {}, now: h.now, scheduler: h.scheduler });
    for (let i = 0; i < 5; i++) {
      h.advance(16);
      h.frame();
      expect(h.pending.size).toBe(1);
    }
  });

  it('đồng hồ máy bị chỉnh: countdown đi theo Date.now (giới hạn đã ghi trong ENGINE_CONTRACTS §6)', () => {
    const h = harness();
    const ticks: number[] = [];
    createDeadlineTimer({ targetTime: h.now() + 10_000, onTick: (ms) => ticks.push(ms), now: h.now, scheduler: h.scheduler });
    h.frame();
    h.advance(-3_000); // chỉnh lùi 3 giây
    h.frame();
    h.advance(60_000); // chỉnh tới 1 phút
    h.frame();
    expect(ticks).toEqual([10_000, 13_000, 0]);
  });

  it('mốc đã qua ngay từ đầu: báo 0 và hoàn thành ở frame đầu', () => {
    const h = harness();
    const onComplete = vi.fn();
    const ticks: number[] = [];
    createDeadlineTimer({ targetTime: h.now() - 500, onTick: (ms) => ticks.push(ms), onComplete, now: h.now, scheduler: h.scheduler });
    h.frame();
    expect(ticks).toEqual([0]);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});

describe('H3-B02: createAntiDriftTimer (dạng của giảng viên)', () => {
  it('mốc = lúc tạo + durationMs, frame trễ không cộng dồn sai số', () => {
    const h = harness();
    const ticks: number[] = [];
    createAntiDriftTimer(3_000, (ms) => ticks.push(ms), { now: h.now, scheduler: h.scheduler });
    h.advance(1_234);
    h.frame();
    h.advance(2_000);
    h.frame();
    expect(ticks).toEqual([1_766, 0]);
  });
});
