import { describe, expect, it } from 'vitest';
import { fakeAudioBuffer } from '../test/fakes';
import { AudioTaskError, isAbortError } from '../types/queue';
import { AudioTaskQueue } from './AudioTaskQueue';

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** Chờ các microtask đang chờ chạy hết (để worker kịp chuyển bước). */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * fetch/decode giả do test điều khiển: mỗi lời gọi tạo một Deferred,
 * test tự quyết định khi nào xong, lỗi hay treo. Đồng thời đếm số task chạy song song.
 */
function createHarness() {
  const fetches = new Map<string, Deferred<ArrayBuffer> & { signal: AbortSignal }>();
  const decodes: Deferred<AudioBuffer>[] = [];
  const fetchOrder: string[] = [];
  let active = 0;
  let maxActive = 0;

  const queue = new AudioTaskQueue({
    fetchAudio: (url, signal) => {
      fetchOrder.push(url);
      active++;
      maxActive = Math.max(maxActive, active);
      const call = { ...deferred<ArrayBuffer>(), signal };
      // Giống fetch thật: abort() làm request reject ngay
      signal.addEventListener(
        'abort',
        () => {
          active--;
          call.reject(signal.reason);
        },
        { once: true },
      );
      fetches.set(url, call);
      return call.promise;
    },
    decodeAudio: () => {
      const call = deferred<AudioBuffer>();
      decodes.push(call);
      return call.promise.finally(() => active--);
    },
  });

  /** Cho task url tải xong rồi giải mã xong. */
  async function complete(url: string, buffer = fakeAudioBuffer()) {
    await flush();
    fetches.get(url)!.resolve(new ArrayBuffer(8));
    await flush();
    decodes.at(-1)!.resolve(buffer);
    await flush();
  }

  return {
    queue,
    fetches,
    decodes,
    fetchOrder,
    complete,
    get maxActive() {
      return maxActive;
    },
    endFetchWithError(url: string, error: unknown) {
      active--;
      fetches.get(url)!.reject(error);
    },
  };
}

/** Ghi lại cách promise settle để kiểm tra mà không gây unhandled rejection. */
function track<T>(promise: Promise<T>) {
  const result: { status: 'pending' | 'fulfilled' | 'rejected'; value?: T; reason?: unknown } = { status: 'pending' };
  promise.then(
    (value) => Object.assign(result, { status: 'fulfilled', value }),
    (reason) => Object.assign(result, { status: 'rejected', reason }),
  );
  return result;
}

describe('B01/B04: FIFO và một worker', () => {
  it('nhiều enqueue cùng lúc được xử lý tuần tự theo thứ tự gửi, tối đa 1 task chạy', async () => {
    const h = createHarness();
    const results = ['a', 'b', 'c'].map((url) => track(h.queue.enqueue(url)));

    // Lúc đầu chỉ task đầu tiên được fetch
    await flush();
    expect(h.fetchOrder).toEqual(['a']);
    expect(h.queue.getSnapshot().map((item) => [item.trackUrl, item.status])).toEqual([
      ['a', 'fetching'],
      ['b', 'queued'],
      ['c', 'queued'],
    ]);

    await h.complete('a');
    await h.complete('b');
    await h.complete('c');

    expect(h.fetchOrder).toEqual(['a', 'b', 'c']);
    expect(h.maxActive).toBe(1);
    expect(results.map((r) => r.status)).toEqual(['fulfilled', 'fulfilled', 'fulfilled']);
    expect(h.queue.getSnapshot()).toEqual([]); // hết việc → rảnh
  });

  it('resolve đúng AudioBuffer và báo trạng thái decoding', async () => {
    const h = createHarness();
    const buffer = fakeAudioBuffer(3);
    const result = track(h.queue.enqueue('a'));
    await flush();
    h.fetches.get('a')!.resolve(new ArrayBuffer(8));
    await flush();
    expect(h.queue.getSnapshot()[0].status).toBe('decoding');
    h.decodes[0].resolve(buffer);
    await flush();
    expect(result.value).toBe(buffer);
  });

  it('enqueue lúc queue đang rảnh sau khi xong việc vẫn chạy tiếp', async () => {
    const h = createHarness();
    track(h.queue.enqueue('a'));
    await h.complete('a');
    const second = track(h.queue.enqueue('b'));
    await h.complete('b');
    expect(second.status).toBe('fulfilled');
  });
});

describe('B04: lỗi không chặn hàng đợi', () => {
  it('fetch lỗi → task đó reject, task sau vẫn chạy', async () => {
    const h = createHarness();
    const failed = track(h.queue.enqueue('bad'));
    const next = track(h.queue.enqueue('good'));
    await flush();
    const error = new AudioTaskError('http', '404');
    h.endFetchWithError('bad', error);
    await h.complete('good');

    expect(failed).toMatchObject({ status: 'rejected', reason: error });
    expect(next.status).toBe('fulfilled');
  });

  it('decode lỗi → task đó reject, task sau vẫn chạy', async () => {
    const h = createHarness();
    const failed = track(h.queue.enqueue('broken'));
    const next = track(h.queue.enqueue('good'));
    await flush();
    h.fetches.get('broken')!.resolve(new ArrayBuffer(8));
    await flush();
    h.decodes[0].reject(new AudioTaskError('decode', 'hỏng'));
    await h.complete('good');

    expect(failed.status).toBe('rejected');
    expect(next.status).toBe('fulfilled');
  });

  it('fetch ném lỗi đồng bộ cũng không làm kẹt worker', async () => {
    let calls = 0;
    const queue = new AudioTaskQueue({
      fetchAudio: () => {
        calls++;
        if (calls === 1) throw new Error('lỗi đồng bộ');
        return Promise.resolve(new ArrayBuffer(8));
      },
      decodeAudio: () => Promise.resolve(fakeAudioBuffer()),
    });
    const first = track(queue.enqueue('a'));
    const second = track(queue.enqueue('b'));
    await flush();
    expect(first.status).toBe('rejected');
    expect(second.status).toBe('fulfilled');
  });
});

describe('C01: hủy task', () => {
  it('hủy task đang chờ: reject AbortError và không bao giờ fetch', async () => {
    const h = createHarness();
    track(h.queue.enqueue('a'));
    const canceled = track(h.queue.enqueue('b'));
    await flush();
    const id = h.queue.getSnapshot()[1].id;

    expect(h.queue.cancel(id)).toBe(true);
    await flush();
    expect(isAbortError(canceled.reason)).toBe(true);

    await h.complete('a');
    expect(h.fetchOrder).toEqual(['a']);
  });

  it('hủy lúc đang fetch: signal bị abort, task reject, task sau chạy tiếp', async () => {
    const h = createHarness();
    const canceled = track(h.queue.enqueue('a'));
    const next = track(h.queue.enqueue('b'));
    await flush();
    const { signal } = h.fetches.get('a')!;

    h.queue.cancel(h.queue.getSnapshot()[0].id);
    await flush();
    expect(signal.aborted).toBe(true);
    expect(isAbortError(canceled.reason)).toBe(true);

    await h.complete('b');
    expect(next.status).toBe('fulfilled');
  });

  it('hủy lúc đang decode: reject ngay, kết quả decode đến sau bị bỏ, worker chờ decode xong mới chạy tiếp', async () => {
    const h = createHarness();
    const canceled = track(h.queue.enqueue('a'));
    const next = track(h.queue.enqueue('b'));
    await flush();
    h.fetches.get('a')!.resolve(new ArrayBuffer(8));
    await flush();

    h.queue.cancel(h.queue.getSnapshot()[0].id);
    await flush();
    expect(isAbortError(canceled.reason)).toBe(true);
    // decodeAudioData không hủy được → task b chưa được bắt đầu (vẫn 1 worker)
    expect(h.fetchOrder).toEqual(['a']);

    h.decodes[0].resolve(fakeAudioBuffer());
    await flush();
    expect(canceled.status).toBe('rejected'); // không đổi thành fulfilled
    expect(h.fetchOrder).toEqual(['a', 'b']);
    await h.complete('b');
    expect(next.status).toBe('fulfilled');
    expect(h.maxActive).toBe(1);
  });

  it('hủy đúng lúc fetch vừa trả dữ liệu: không đem dữ liệu đi decode, task sau chạy ngay', async () => {
    // fetch đã nhận xong response nên không còn phản ứng với abort (tình huống xảy ra thật khi bấm hủy sát lúc tải xong)
    const decoded: string[] = [];
    const fetchGate = deferred<ArrayBuffer>();
    const queue = new AudioTaskQueue({
      fetchAudio: (url) => (url === 'a' ? fetchGate.promise : Promise.resolve(new ArrayBuffer(8))),
      decodeAudio: (data) => {
        decoded.push(data.byteLength === 1 ? 'a' : 'b');
        return Promise.resolve(fakeAudioBuffer());
      },
    });
    const canceled = track(queue.enqueue('a'));
    const next = track(queue.enqueue('b'));
    await flush();

    fetchGate.resolve(new ArrayBuffer(1));
    queue.cancel(queue.getSnapshot()[0].id);
    await flush();

    expect(isAbortError(canceled.reason)).toBe(true);
    expect(decoded).toEqual(['b']);
    expect(next.status).toBe('fulfilled');
  });

  it('hủy lặp lại hoặc hủy task đã xong là an toàn', async () => {
    const h = createHarness();
    const done = track(h.queue.enqueue('a'));
    await flush();
    const id = h.queue.getSnapshot()[0].id;
    await h.complete('a');

    expect(h.queue.cancel(id)).toBe(false);
    expect(h.queue.cancel(id)).toBe(false);
    expect(h.queue.cancel(999)).toBe(false);
    expect(done.status).toBe('fulfilled');
  });
});

describe('C02: dispose', () => {
  it('dispose hủy task đang chạy và đang chờ, từ chối enqueue mới, gọi lại an toàn', async () => {
    const h = createHarness();
    const active = track(h.queue.enqueue('a'));
    const pending = track(h.queue.enqueue('b'));
    await flush();

    h.queue.dispose();
    h.queue.dispose();
    await flush();

    expect(isAbortError(active.reason)).toBe(true);
    expect(isAbortError(pending.reason)).toBe(true);
    expect(h.fetches.get('a')!.signal.aborted).toBe(true);
    expect(h.fetchOrder).toEqual(['a']);
    expect(h.queue.getSnapshot()).toEqual([]);

    await expect(h.queue.enqueue('c')).rejects.toMatchObject({ kind: 'disposed' });
  });

  it('dispose lúc đang decode: kết quả đến muộn bị bỏ, không chạy task nào nữa', async () => {
    const h = createHarness();
    const active = track(h.queue.enqueue('a'));
    track(h.queue.enqueue('b'));
    await flush();
    h.fetches.get('a')!.resolve(new ArrayBuffer(8));
    await flush();

    h.queue.dispose();
    h.decodes[0].resolve(fakeAudioBuffer());
    await flush();

    expect(active.status).toBe('rejected');
    expect(h.fetchOrder).toEqual(['a']);
  });

  it('subscribe nhận snapshot mới và unsubscribe dừng nhận', async () => {
    const h = createHarness();
    const seen: number[] = [];
    const unsubscribe = h.queue.subscribe((snapshot) => seen.push(snapshot.length));
    track(h.queue.enqueue('a'));
    await flush();
    unsubscribe();
    const count = seen.length;
    await h.complete('a');
    expect(seen.slice(0, 2)).toEqual([1, 1]);
    expect(seen).toHaveLength(count);
  });
});
