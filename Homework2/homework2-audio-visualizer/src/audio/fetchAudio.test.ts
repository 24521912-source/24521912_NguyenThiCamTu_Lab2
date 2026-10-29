import { afterEach, describe, expect, it, vi } from 'vitest';
import { FakeAudioContext, fakeAudioBuffer } from '../test/fakes';
import { AudioTaskError, isAbortError } from '../types/queue';
import { decodeAudio } from './decodeAudio';
import { fetchAudio, resolveTrackUrl } from './fetchAudio';

const audioResponse = (status = 200, type = 'audio/wav') =>
  new Response(new Uint8Array([1, 2, 3]), { status, headers: { 'content-type': type } });

afterEach(() => vi.unstubAllGlobals());

describe('B02: resolveTrackUrl', () => {
  it('chấp nhận http/https và đường dẫn tương đối', () => {
    expect(resolveTrackUrl('/audio/a.wav', 'http://localhost/').href).toBe('http://localhost/audio/a.wav');
    expect(resolveTrackUrl('https://cdn.example.com/a.mp3').protocol).toBe('https:');
  });

  it('chặn javascript:, data:, file: và URL hỏng', () => {
    for (const bad of ['javascript:alert(1)', 'data:audio/wav;base64,AAAA', 'file:///C:/a.wav']) {
      expect(() => resolveTrackUrl(bad)).toThrow(AudioTaskError);
    }
    expect(() => resolveTrackUrl('http://', undefined)).toThrow(AudioTaskError);
  });
});

describe('B02: fetchAudio', () => {
  it('trả ArrayBuffer và truyền signal cho fetch', async () => {
    const fetchMock = vi.fn(async () => audioResponse());
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();

    const data = await fetchAudio('/audio/a.wav', controller.signal);

    expect(new Uint8Array(data)).toEqual(new Uint8Array([1, 2, 3]));
    expect(fetchMock).toHaveBeenCalledWith(expect.any(URL), { signal: controller.signal });
  });

  it('HTTP lỗi → AudioTaskError kind http', async () => {
    vi.stubGlobal('fetch', async () => audioResponse(404));
    await expect(fetchAudio('/audio/x.wav', new AbortController().signal)).rejects.toMatchObject({ kind: 'http' });
  });

  it('server SPA trả 200 + HTML cho file không tồn tại → kind http, không đẩy sang decode', async () => {
    vi.stubGlobal('fetch', async () => audioResponse(200, 'text/html; charset=utf-8'));
    await expect(fetchAudio('/audio/missing.wav', new AbortController().signal)).rejects.toMatchObject({
      kind: 'http',
    });
  });

  it('lỗi mạng / CORS (TypeError) → kind network', async () => {
    vi.stubGlobal('fetch', async () => {
      throw new TypeError('Failed to fetch');
    });
    await expect(fetchAudio('https://other.example/a.wav', new AbortController().signal)).rejects.toMatchObject({
      kind: 'network',
    });
  });

  it('bị hủy → ném lại AbortError, không bọc thành lỗi mạng', async () => {
    const controller = new AbortController();
    vi.stubGlobal('fetch', async (_url: URL, init: RequestInit) => {
      controller.abort(new DOMException('hủy', 'AbortError'));
      init.signal?.throwIfAborted();
      return audioResponse();
    });
    const error = await fetchAudio('/audio/a.wav', controller.signal).catch((reason: unknown) => reason);
    expect(isAbortError(error)).toBe(true);
  });

  it('URL không hợp lệ bị chặn trước khi gọi fetch', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(fetchAudio('javascript:alert(1)', new AbortController().signal)).rejects.toMatchObject({
      kind: 'invalid-url',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('B03: decodeAudio', () => {
  it('dùng decodeAudioData của context được truyền vào, không tạo context mới', async () => {
    const context = new FakeAudioContext();
    const buffer = await decodeAudio(context as unknown as BaseAudioContext, new ArrayBuffer(4));
    expect(buffer.duration).toBe(4);
    expect(FakeAudioContext.instances).toHaveLength(1);
  });

  it('decode lỗi → AudioTaskError kind decode, giữ lỗi gốc trong cause', async () => {
    const context = new FakeAudioContext();
    const original = new DOMException('Unable to decode', 'EncodingError');
    context.decodeAudioData.mockRejectedValueOnce(original);
    const error = await decodeAudio(context as unknown as BaseAudioContext, new ArrayBuffer(4)).catch(
      (reason: unknown) => reason,
    );
    expect(error).toMatchObject({ kind: 'decode', cause: original });
  });

  it('trả đúng buffer khi decode thành công', async () => {
    const context = new FakeAudioContext();
    const buffer = fakeAudioBuffer(9);
    context.decodeAudioData.mockResolvedValueOnce(buffer);
    expect(await decodeAudio(context as unknown as BaseAudioContext, new ArrayBuffer(1))).toBe(buffer);
  });
});
