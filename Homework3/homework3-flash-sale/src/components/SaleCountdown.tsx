import type { SalePhase } from '../contracts/timer';
import { formatSeconds } from '../hooks/useCountdown';

const PHASE_TEXT: Record<SalePhase, { label: string; title: string }> = {
  PENDING: { label: 'Sắp mở bán', title: 'Flash sale mở sau' },
  ACTIVE: { label: 'Đang mở bán', title: 'Kết thúc sau' },
  ENDED: { label: 'Đã kết thúc', title: 'Flash sale đã kết thúc' },
};

interface SaleCountdownProps {
  phase: SalePhase;
  secondsLeft: number;
}

/**
 * Đồng hồ đếm ngược. role="timer" mặc định không đọc liên tục (aria-live off),
 * nên trình đọc màn hình không bị spam mỗi giây. Thông báo đổi giai đoạn nằm ở vùng role="status" riêng.
 */
export function SaleCountdown({ phase, secondsLeft }: SaleCountdownProps) {
  const text = PHASE_TEXT[phase];
  return (
    <section className={`countdown countdown-${phase.toLowerCase()}`} aria-labelledby="countdown-title">
      <p className="phase-badge">{text.label}</p>
      <h2 id="countdown-title">{text.title}</h2>
      {phase !== 'ENDED' && (
        <p className="countdown-clock" role="timer" aria-label={`${text.title} ${formatSeconds(secondsLeft)}`}>
          {formatSeconds(secondsLeft)}
        </p>
      )}
    </section>
  );
}
