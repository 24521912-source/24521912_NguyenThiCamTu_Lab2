import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { Profiler, StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { FakeAudioContext, animationFrames, latestContext } from './test/fakes';

type FetchHandler = (url: string, init: RequestInit) => Promise<Response>;

const audioResponse = () => new Response(new Uint8Array(4), { status: 200, headers: { 'content-type': 'audio/wav' } });
let fetchHandler: FetchHandler;
const fetchedUrls: string[] = [];

beforeEach(() => {
  fetchedUrls.length = 0;
  fetchHandler = async () => audioResponse();
  vi.stubGlobal('fetch', (url: URL, init: RequestInit) => {
    fetchedUrls.push(url.pathname);
    return fetchHandler(url.pathname, init);
  });
});

afterEach(() => vi.unstubAllGlobals());

const section = (name: RegExp) => screen.getByRole('region', { name });
const readyTracks = () => within(section(/Sẵn sàng phát/)).queryAllByRole('listitem');
const status = () => screen.getAllByRole('status').at(-1)!.textContent;

async function addDemoTracks() {
  fireEvent.click(screen.getByRole('button', { name: 'Thêm cùng lúc 3 bài demo' }));
  await waitFor(() => expect(readyTracks()).toHaveLength(3));
}

async function playFirstTrack() {
  await act(async () => {
    fireEvent.click(within(section(/Sẵn sàng phát/)).getAllByRole('button', { name: /^Phát/ })[0]);
  });
}

describe('F01/G04: luồng queue → decode → phát → analyser → visualizer', () => {
  it('3 yêu cầu gửi cùng lúc được tải theo đúng thứ tự FIFO rồi hiện trong danh sách', async () => {
    render(<App />);
    await addDemoTracks();
    expect(fetchedUrls).toEqual(['/audio/chord.wav', '/audio/sweep.wav', '/audio/beat.wav']);
    expect(readyTracks().map((li) => li.textContent?.split('.wav')[0])).toEqual(['beat', 'sweep', 'chord']);
    expect(FakeAudioContext.instances).toHaveLength(1);
  });

  it('phát: source nối vào analyser, vòng vẽ chạy; dừng: vòng vẽ dừng', async () => {
    render(<App />);
    await addDemoTracks();
    await playFirstTrack();

    const context = latestContext();
    expect(context.sources[0].started).toBe(true);
    expect([...context.sources[0].connections]).toEqual([context.analysers[0]]);
    expect(animationFrames.pending.size).toBe(1);
    expect(screen.getByText('Đang phát', { selector: 'strong' })).toBeTruthy();

    animationFrames.flushFrame();
    expect(context.analysers[0].reads).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Dừng phát' }));
    expect(animationFrames.pending.size).toBe(0);
    expect(screen.getByRole('button', { name: 'Dừng phát' }).getAttribute('aria-disabled')).toBe('true');
  });

  it('phát hết tự nhiên: dừng vòng vẽ và báo trạng thái', async () => {
    render(<App />);
    await addDemoTracks();
    await playFirstTrack();
    act(() => latestContext().sources[0].finish());
    expect(animationFrames.pending.size).toBe(0);
    expect(status()).toBe('Đã phát hết bài.');
  });

  it('React không render lại theo từng frame của visualizer', async () => {
    let renders = 0;
    render(
      <Profiler id="app" onRender={() => renders++}>
        <App />
      </Profiler>,
    );
    await addDemoTracks();
    await playFirstTrack();

    const before = renders;
    for (let i = 0; i < 30; i++) animationFrames.flushFrame();
    expect(latestContext().analysers[0].reads).toHaveLength(30);
    expect(renders).toBe(before);
  });
});

describe('F03: chọn FFT', () => {
  it('đổi 256 → 512 cập nhật analyser và số cột hiển thị', async () => {
    render(<App />);
    await addDemoTracks();
    expect(screen.getByText('128', { selector: 'output' })).toBeTruthy();

    fireEvent.change(screen.getByLabelText('FFT size'), { target: { value: '512' } });

    expect(latestContext().analysers[0].fftSize).toBe(512);
    expect(latestContext().analysers[0].frequencyBinCount).toBe(256);
    expect(screen.getByText('256', { selector: 'output' })).toBeTruthy();
  });
});

describe('F02: lỗi và hủy', () => {
  it('yêu cầu lỗi rồi yêu cầu hợp lệ: lỗi được báo, yêu cầu sau vẫn chạy', async () => {
    fetchHandler = async (url) =>
      url.includes('missing') ? new Response('', { status: 404 }) : audioResponse();
    render(<App />);
    const input = screen.getByLabelText('URL bài nhạc');

    fireEvent.change(input, { target: { value: '/audio/missing.wav' } });
    fireEvent.submit(input.closest('form')!);
    await waitFor(() => expect(status()).toContain('Không tải được missing.wav'));
    expect(screen.getAllByRole('status').at(-1)!.className).toContain('notice-error');

    fireEvent.change(input, { target: { value: '/audio/chord.wav' } });
    fireEvent.submit(input.closest('form')!);
    await waitFor(() => expect(readyTracks()).toHaveLength(1));
  });

  it('URL javascript: bị chặn, không gọi fetch', async () => {
    render(<App />);
    const input = screen.getByLabelText('URL bài nhạc');
    fireEvent.change(input, { target: { value: 'javascript:alert(1)' } });
    fireEvent.submit(input.closest('form')!);
    await waitFor(() => expect(status()).toContain('Chỉ hỗ trợ http/https'));
    expect(fetchedUrls).toEqual([]);
  });

  it('bấm Hủy bài đang chờ: báo đã hủy, bài đó không bao giờ được tải', async () => {
    let releaseFirst!: () => void;
    fetchHandler = (url) =>
      url.includes('chord')
        ? new Promise((resolve) => (releaseFirst = () => resolve(audioResponse())))
        : Promise.resolve(audioResponse());
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Thêm cùng lúc 3 bài demo' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Hủy sweep.wav' })).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: 'Hủy sweep.wav' }));
    await waitFor(() => expect(status()).toBe('Đã hủy: sweep.wav'));

    await act(async () => releaseFirst());
    await waitFor(() => expect(readyTracks()).toHaveLength(2));
    expect(fetchedUrls).toEqual(['/audio/chord.wav', '/audio/beat.wav']);
  });
});

describe('F01: unmount và StrictMode', () => {
  it('unmount khi đang phát và đang tải: dừng vòng vẽ, hủy request, đóng context, không lỗi', async () => {
    const consoleError = vi.spyOn(console, 'error');
    let pendingSignal: AbortSignal | undefined;
    const { unmount } = render(<App />);
    await addDemoTracks();
    await playFirstTrack();

    fetchHandler = (_url, init) =>
      new Promise((_resolve, reject) => {
        pendingSignal = init.signal ?? undefined;
        init.signal?.addEventListener('abort', () => reject(init.signal?.reason));
      });
    fireEvent.click(screen.getByRole('button', { name: 'Thêm vào hàng đợi' }));
    await waitFor(() => expect(pendingSignal).toBeDefined());

    const context = latestContext();
    unmount();
    await act(async () => {});

    expect(pendingSignal?.aborted).toBe(true);
    expect(animationFrames.pending.size).toBe(0);
    expect(context.sources[0].stopCalls).toBe(1);
    expect(context.close).toHaveBeenCalledTimes(1);
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('StrictMode (mount → unmount → mount) vẫn chỉ có một context đang mở và một vòng vẽ', async () => {
    render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    await addDemoTracks();
    await playFirstTrack();

    const open = FakeAudioContext.instances.filter((context) => context.state !== 'closed');
    expect(open).toHaveLength(1);
    expect(animationFrames.pending.size).toBe(1);
  });
});
