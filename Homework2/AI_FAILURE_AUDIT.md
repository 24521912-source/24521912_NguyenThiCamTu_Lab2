# AI Failure Audit — Homework 2: Concurrent FIFO Audio Visualizer

File này ghi lại những lần AI viết sai (hoặc suýt sai) trong lúc làm Homework 2.

**Cách tìm lỗi:**
- Test nào xanh ngay lần đầu thì tôi cố ý sửa sai code rồi chạy lại. Nếu test vẫn xanh
  thì đó là test vô dụng và cũng được tính là lỗi. Ở Homework 1, 3 trong 5 mục của audit được tìm ra theo cách này.
- Phần queue và hủy tác vụ: thử các thứ tự bất thường, ví dụ hủy đúng lúc đang decode,
  hoặc dispose khi fetch chưa xong, rồi xem có promise nào bị treo không.
- Phần audio và canvas: mở Chrome DevTools xem tab Console, Network (request có bị hủy thật không),
  Performance (có bị chạy 2 vòng `requestAnimationFrame` không) và Memory.

Mỗi lỗi ghi theo đúng mẫu đề yêu cầu: mã lỗi, code/hành vi sai, nguyên nhân, cách tái hiện,
bằng chứng (test hoặc DevTools), cách sửa, kết quả kiểm tra lại.

---

## Nhật ký

| Task | Tình trạng |
|---|---|
| A01 — Khởi tạo project | Không có lỗi. AI không viết code nào ở task này, chỉ chạy kiểm tra scaffold có sẵn: `tsc`, `lint`, `build`, `dev` đều chạy được. |

*(Các task sau sẽ được ghi thêm vào bảng này, kể cả task không có lỗi, để thấy được là đã kiểm tra thật.)*

---

## Các lỗi đã ghi nhận

Chưa có. Hiện tại: **0/3**.

---

## AI-01: File không tồn tại bị báo là "file hỏng"

**Task:** B02, F02  
**File:** `src/audio/fetchAudio.ts`, `src/App.tsx`

**1. Code / hành vi sai**

AI viết `fetchAudio` với giả định file không tồn tại sẽ trả về 404:

```typescript
if (!response.ok) {
  throw new AudioTaskError('http', `Máy chủ trả về ${response.status} cho ${url.href}`);
}
return response.arrayBuffer();
```

Trong `App.tsx`, AI còn thêm `/audio/missing.wav` vào danh sách gợi ý, kèm comment *"để thử nhánh lỗi decode và lỗi HTTP 404"*.
Khi chạy thật và nhập `/audio/missing.wav`, giao diện báo:

```text
Lỗi: Không tải được missing.wav. Không giải mã được file audio (định dạng không hỗ trợ hoặc file hỏng)
```

Người dùng bị báo là file **hỏng**, trong khi thực ra file **không tồn tại**.

**2. Nguyên nhân**

`vite preview` (và cả Vercel, Netlify...) là server kiểu SPA: đường dẫn nào không có file thì trả **200 kèm `index.html`** chứ không trả 404.
`response.ok` vẫn là `true`, trang HTML bị đem đi `decodeAudioData` rồi thất bại. Nhánh lỗi HTTP mà AI viết không bao giờ chạy được với các server này.

**3. Cách tái hiện**

```powershell
npm run build
npx vite preview --port 4300
curl.exe -s -o NUL -w "status=%{http_code} type=%{content_type}\n" http://localhost:4300/audio/missing.wav
```

Sau đó mở trang, nhập `/audio/missing.wav` rồi bấm "Thêm vào hàng đợi".

**4. Bằng chứng**

```text
status=200 type=text/html size=634
```

Tôi phát hiện lỗi khi chạy app thật trong Chrome, không phải nhờ unit test. Unit test dùng `fetch` giả trả về 404 thì vẫn pass,
vì nó kiểm tra đúng cái giả định sai.

**5. Cách sửa**

```typescript
// Server SPA (vite preview, Vercel...) trả 200 + index.html cho file không tồn tại thay vì 404
if (response.headers.get('content-type')?.includes('text/html')) {
  throw new AudioTaskError('http', `Máy chủ trả về trang HTML thay vì audio cho ${url.href} (file có thể không tồn tại)`);
}
```

Thêm test `server SPA trả 200 + HTML cho file không tồn tại → kind http, không đẩy sang decode` và sửa lại comment trong `App.tsx`.

**6. Kết quả kiểm tra lại**

- Chrome báo: `Lỗi: Không tải được missing.wav. Máy chủ trả về trang HTML thay vì audio cho http://localhost:4300/audio/missing.wav (file có thể không tồn tại)`.
- Xoá đoạn kiểm tra HTML thì test mới **fail** (`1 failed | 10 passed`).

---

## AI-02: Không có test cho trường hợp hủy đúng lúc tải xong

**Task:** C01, G02  
**File:** `src/queue/AudioTaskQueue.ts`, `src/queue/AudioTaskQueue.test.ts`

**1. Code / hành vi sai**

Trong worker của hàng đợi có một dòng kiểm tra hủy ngay sau khi fetch xong:

```typescript
const data = await this.fetchAudio(task.trackUrl, signal);
signal.throwIfAborted();   // ← dòng này
task.status = 'decoding';
const buffer = await this.decodeAudio(data);
```

AI viết 13 test cho queue (FIFO, lỗi, hủy lúc chờ, hủy lúc fetch, hủy lúc decode, dispose...), và tất cả xanh ngay lần đầu.
Nhưng không test nào bảo vệ dòng trên: xoá nó đi thì cả 13 test vẫn xanh.

**2. Nguyên nhân**

Test "hủy lúc đang fetch" dùng `fetch` giả tự reject ngay khi bị abort, giống fetch thật lúc request còn đang chạy.
Ngoài đời còn có trường hợp người dùng bấm Hủy **đúng lúc response vừa về**: fetch đã resolve rồi nên không reject nữa.
Nếu thiếu dòng kiểm tra, worker sẽ đem dữ liệu của task **đã hủy** đi decode. Việc này vừa tốn công giải mã vô ích,
vừa bắt task kế tiếp phải chờ thêm (vì chỉ có 1 worker). Không test nào thử thời điểm đó.

**3. Cách tái hiện**

Xoá dòng `signal.throwIfAborted();` ngay sau `await this.fetchAudio(...)`, rồi chạy `npx vitest run src/queue`.

**4. Bằng chứng**

```text
không kiểm tra hủy sau fetch => Tests  13 passed (13)
```

**5. Cách sửa**

Thêm test `hủy đúng lúc fetch vừa trả dữ liệu: không đem dữ liệu đi decode, task sau chạy ngay`:
fetch của task `a` resolve trước, sau đó mới gọi `cancel()`, rồi kiểm tra chỉ có task `b` được decode.

**6. Kết quả kiểm tra lại**

- Code đúng: 14/14 pass.
- Xoá dòng `signal.throwIfAborted()`: `Tests 1 failed | 13 passed (14)`.

---

## AI-03: `vitest.config.ts` chạy test được nhưng làm hỏng `tsc` và `npm run build`

**Task:** G01  
**File:** `vitest.config.ts`

**1. Code / hành vi sai**

```typescript
import viteConfig from './vite.config';
```

`npx vitest run` vẫn xanh (`1 passed`), nhìn qua tưởng là xong.

**2. Nguyên nhân**

`tsconfig.node.json` của project dùng `"module": "nodenext"`, chế độ bắt buộc import tương đối phải có đuôi file.
Vitest tự resolve được đường dẫn không có đuôi nên không báo gì; chỉ TypeScript mới bắt lỗi này.
Vì `npm run build` chạy `tsc -b` trước `vite build`, lỗi này làm **hỏng luôn production build**, dù toàn bộ test đều xanh.

**3. Cách tái hiện**

Đổi lại thành `from './vite.config'` rồi chạy `npx tsc -b --noEmit` (hoặc `npm run build`).

**4. Bằng chứng**

```text
vitest.config.ts(2,24): error TS2307: Cannot find module './vite.config' or its corresponding type declarations.
```

Tôi phát hiện lỗi nhờ chạy `tsc` riêng sau khi test đã xanh, thay vì chỉ tin vào kết quả test.

**5. Cách sửa**

`import viteConfig from './vite.config.ts';` (project đã bật `allowImportingTsExtensions`), và thêm `vitest.config.ts`
vào `include` của `tsconfig.node.json` để file này luôn được kiểm tra kiểu.

**6. Kết quả kiểm tra lại**

`npx tsc -b --noEmit` exit 0, `npm run build` thành công, test vẫn pass.

---

## Những chỗ đã kiểm tra nhưng KHÔNG tính là lỗi

| Hiện tượng | Vì sao không tính |
|---|---|
| Test trong jsdom không tìm thấy nút tên "Hủy sweep.wav" (tên nằm trong `span` ẩn) | Tôi kiểm tra trong Chrome thật: accessible name vẫn đúng là `"Hủy sweep.wav"`. Đây là khác biệt của thư viện `dom-accessibility-api` trong jsdom. Tôi vẫn đổi sang `aria-label` cho chắc với mọi trình đọc màn hình. |
| Smoke test lần đầu chạy nhầm sang trang Homework 1 | Cổng 4174 đang bị một server Homework 1 chiếm. Script báo lỗi ngay (không tìm thấy nút) nên không ra số liệu sai. Từ đó tôi kiểm tra `<title>` trước khi đo. Đây là lỗi thao tác, không phải lỗi code. |
| Xoá cờ `settled`, xoá kiểm tra hủy **sau decode**, xoá chặn cập nhật state sau unmount: test vẫn xanh | Không quan sát được, vì `cancel()` đã reject promise ngay, Promise gốc tự bỏ qua lần settle thứ hai, còn `queue.dispose()` reject mọi task trước khi chúng kịp resolve. Tôi giữ chúng như lớp phòng thủ thêm. |
| Xoá `disposed` trong điều kiện sau `resume()` của AudioEngine: test vẫn xanh | `dispose()` đã gán `context = null`, nên điều kiện `!this.context` vẫn chặn được. |
| Xoá dòng `if (this.disposed) return` ở đầu `AudioEngine.dispose()`: test vẫn xanh | Lần dispose đầu đã gán mọi field về `null`, nên lần gọi thứ hai không còn gì để dọn và không đóng context lần nữa. |

---

## Tổng kết

| Mã | Lỗi | Phát hiện bằng | Trạng thái |
|---|---|---|---|
| AI-01 | File không tồn tại bị báo là file hỏng | Chạy app thật trong Chrome + `curl` | Đã sửa, PASS |
| AI-02 | Test queue không bảo vệ kiểm tra hủy sau fetch | Xoá code, chạy lại test | Đã sửa, PASS |
| AI-03 | Import thiếu đuôi `.ts` làm hỏng `tsc` và build | Chạy `tsc` riêng | Đã sửa, PASS |

**3/3 lỗi thật**, không có lỗi nào được bịa thêm cho đủ số.
