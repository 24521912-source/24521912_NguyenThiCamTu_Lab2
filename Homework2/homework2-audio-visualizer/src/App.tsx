import { useId, useRef, useState, type FormEvent } from 'react';
import { trackLabel, useAudioController } from './hooks/useAudioController';
import { FFT_SIZES, type PlaybackState } from './types/audio';
import type { TaskStatus } from './types/queue';

const DEMO_TRACKS = ['/audio/chord.wav', '/audio/sweep.wav', '/audio/beat.wav'];
// Gợi ý thêm 2 URL lỗi: file hỏng (lỗi decode) và file không tồn tại (server SPA trả 200 + HTML, không phải 404)
const SUGGESTED_URLS = [...DEMO_TRACKS, '/audio/broken.wav', '/audio/missing.wav'];

const TASK_STATUS_TEXT: Record<TaskStatus, string> = {
  queued: 'Đang chờ',
  fetching: 'Đang tải',
  decoding: 'Đang giải mã',
};

const PLAYBACK_TEXT: Record<PlaybackState, string> = {
  idle: 'Chưa phát',
  playing: 'Đang phát',
  stopped: 'Đã dừng',
  ended: 'Đã phát hết',
};

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audio = useAudioController(canvasRef);
  const [url, setUrl] = useState(DEMO_TRACKS[0]);
  const urlId = useId();
  const listId = useId();
  const fftId = useId();
  const isPlaying = audio.playback === 'playing';

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (url.trim()) void audio.enqueue(url.trim());
  }

  return (
    <>
      <a className="skip-link" href="#main">
        Bỏ qua đến nội dung chính
      </a>
      <header className="app-header">
        <h1>FIFO Audio Visualizer</h1>
        <p>Tải nhiều bài cùng lúc, hàng đợi xử lý lần lượt từng bài, rồi phát và xem phổ tần số.</p>
      </header>

      <main id="main" className="app-main" tabIndex={-1}>
        <section className="panel" aria-labelledby="add-heading">
          <h2 id="add-heading">Thêm bài vào hàng đợi</h2>
          <form className="add-form" onSubmit={handleSubmit}>
            <label htmlFor={urlId}>URL bài nhạc</label>
            <input
              id={urlId}
              type="text"
              inputMode="url"
              list={listId}
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
            <datalist id={listId}>
              {SUGGESTED_URLS.map((suggestion) => (
                <option key={suggestion} value={suggestion} />
              ))}
            </datalist>
            <button type="submit">Thêm vào hàng đợi</button>
          </form>
          <button type="button" className="secondary" onClick={() => DEMO_TRACKS.forEach((track) => void audio.enqueue(track))}>
            Thêm cùng lúc 3 bài demo
          </button>
        </section>

        <section className="panel" aria-labelledby="queue-heading">
          <h2 id="queue-heading">Hàng đợi ({audio.queueItems.length})</h2>
          {audio.queueItems.length === 0 ? (
            <p className="muted">Hàng đợi trống.</p>
          ) : (
            <ol className="item-list">
              {audio.queueItems.map((item) => (
                <li key={item.id}>
                  <span className="item-name">{trackLabel(item.trackUrl)}</span>
                  <span className={`badge badge-${item.status}`}>{TASK_STATUS_TEXT[item.status]}</span>
                  <button
                    type="button"
                    className="secondary"
                    aria-label={`Hủy ${trackLabel(item.trackUrl)}`}
                    onClick={() => audio.cancel(item.id)}
                  >
                    Hủy
                  </button>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="panel" aria-labelledby="tracks-heading">
          <h2 id="tracks-heading">Sẵn sàng phát</h2>
          {audio.tracks.length === 0 ? (
            <p className="muted">Chưa có bài nào được giải mã.</p>
          ) : (
            <ul className="item-list">
              {audio.tracks.map((track) => (
                <li key={track.id}>
                  <span className="item-name">{track.label}</span>
                  <span className="muted">{track.buffer.duration.toFixed(1)} giây</span>
                  <button type="button" aria-label={`Phát ${track.label}`} onClick={() => void audio.play(track)}>
                    Phát
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            className="secondary"
            // aria-disabled thay cho disabled: nút disabled làm focus rơi về body ngay sau khi bấm Dừng
            aria-disabled={!isPlaying}
            onClick={() => isPlaying && audio.stop()}
          >
            Dừng phát
          </button>
        </section>

        <section className="panel visualizer-panel" aria-labelledby="viz-heading">
          <h2 id="viz-heading">Phổ tần số</h2>
          <div className="viz-controls">
            <label htmlFor={fftId}>FFT size</label>
            <select
              id={fftId}
              value={audio.fftSize}
              onChange={(event) => {
                const size = FFT_SIZES.find((option) => option === Number(event.target.value));
                if (size) audio.changeFftSize(size);
              }}
            >
              {FFT_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <p>
              Số cột tần số: <output htmlFor={fftId}>{audio.binCount}</output>
            </p>
          </div>
          <canvas
            ref={canvasRef}
            className="visualizer"
            role="img"
            aria-label={`Biểu đồ cột tần số, ${audio.binCount} cột. Trạng thái: ${PLAYBACK_TEXT[audio.playback]}.`}
          />
          <p>
            Trạng thái phát: <strong>{PLAYBACK_TEXT[audio.playback]}</strong>
            {audio.nowPlaying && ` — ${audio.nowPlaying.label}`}
          </p>
        </section>

        <p role="status" className={`notice notice-${audio.notice.kind}`}>
          {audio.notice.kind === 'error' && <strong>Lỗi: </strong>}
          {audio.notice.text}
        </p>
      </main>

      <footer className="app-footer">
        <p>Homework 2 — Web Application Development 2026, UIT. Âm thanh demo được tổng hợp, không có bản quyền.</p>
      </footer>
    </>
  );
}

export default App;
