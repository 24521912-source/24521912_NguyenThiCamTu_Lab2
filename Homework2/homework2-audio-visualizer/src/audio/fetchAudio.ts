import { AudioTaskError, isAbortError } from '../types/queue';

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

/**
 * Chuyển URL người dùng nhập thành URL tuyệt đối an toàn.
 * Chỉ cho http/https (đường dẫn tương đối như /audio/a.wav được tính theo trang hiện tại).
 * Chặn javascript:, data:, file:...
 */
export function resolveTrackUrl(trackUrl: string, base = globalThis.location?.href): URL {
  let url: URL;
  try {
    url = new URL(trackUrl.trim(), base);
  } catch (error) {
    throw new AudioTaskError('invalid-url', `URL không hợp lệ: ${trackUrl}`, { cause: error });
  }
  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    throw new AudioTaskError('invalid-url', `Chỉ hỗ trợ http/https, nhận được ${url.protocol}`);
  }
  return url;
}

/**
 * Tải dữ liệu audio bằng fetch() gốc. signal được truyền cho cả request lẫn việc đọc body,
 * nên abort() dừng được cả hai giai đoạn. Hủy thì ném lại AbortError nguyên trạng.
 */
export async function fetchAudio(trackUrl: string, signal: AbortSignal): Promise<ArrayBuffer> {
  const url = resolveTrackUrl(trackUrl);

  let response: Response;
  try {
    response = await fetch(url, { signal });
  } catch (error) {
    if (isAbortError(error) || signal.aborted) throw signal.reason ?? error;
    // fetch chỉ báo TypeError cho cả lỗi mạng lẫn bị chặn CORS, trình duyệt không cho biết thêm
    throw new AudioTaskError('network', `Không tải được ${url.href} (lỗi mạng hoặc bị chặn CORS)`, { cause: error });
  }

  if (!response.ok) {
    throw new AudioTaskError('http', `Máy chủ trả về ${response.status} cho ${url.href}`);
  }
  // Server SPA (vite preview, Vercel...) trả 200 + index.html cho file không tồn tại thay vì 404
  if (response.headers.get('content-type')?.includes('text/html')) {
    throw new AudioTaskError('http', `Máy chủ trả về trang HTML thay vì audio cho ${url.href} (file có thể không tồn tại)`);
  }
  return response.arrayBuffer();
}
