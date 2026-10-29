import { useEffect, useRef, useState } from 'react';
import type { EpochMs, SalePhase, SaleWindow } from '../contracts/timer';
import { createDeadlineTimer, getSalePhase, remainingUntil } from '../engines/timerEngine';

const toSeconds = (ms: number) => Math.ceil(ms / 1000);

/**
 * Số giây còn lại tới mốc tuyệt đối targetTime.
 * Timer engine chạy theo frame (~60 lần/giây) nhưng hook CHỈ setState khi số giây hiển thị đổi,
 * nên component render lại khoảng 1 lần/giây chứ không phải 60 lần/giây.
 */
export function useCountdown(targetTime: EpochMs, onComplete?: () => void): number {
  const [seconds, setSeconds] = useState(() => toSeconds(remainingUntil(targetTime, Date.now())));
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  useEffect(() => {
    let lastShown = Number.NaN;
    // Trả về hàm hủy của timer làm cleanup → unmount hoặc đổi targetTime đều hủy vòng cũ, không bao giờ có 2 vòng
    return createDeadlineTimer({
      targetTime,
      onTick: (remainingMs) => {
        const next = toSeconds(remainingMs);
        if (next === lastShown) return;
        lastShown = next;
        setSeconds(next);
      },
      onComplete: () => onCompleteRef.current?.(),
    });
  }, [targetTime]);

  return seconds;
}

/** Giai đoạn sale + số giây tới mốc kế tiếp (mở sale hoặc đóng sale). */
export function useSalePhase(window: SaleWindow): { phase: SalePhase; secondsLeft: number } {
  const [phase, setPhase] = useState<SalePhase>(() => getSalePhase(window, Date.now()));
  const target = phase === 'PENDING' ? window.startsAt : window.endsAt;
  const secondsLeft = useCountdown(target, () => setPhase(getSalePhase(window, Date.now())));
  return { phase, secondsLeft: phase === 'ENDED' ? 0 : secondsLeft };
}

/** "125" giây → "02:05" */
export function formatSeconds(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
