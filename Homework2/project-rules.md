# Project Rules — Homework 2: Concurrent FIFO Audio Visualizer

**Môn:** Web Application Development 2026 — UIT, ĐHQG-HCM  
**Bài:** Lab 02 — Homework 2  
**Stack:** React + TypeScript + Vite + Web Audio API

Đây là các quy tắc tôi đặt ra cho bài Homework 2 (và cho AI khi nhờ hỗ trợ).
Đừng nhầm với Homework 2 của Lab 1 (Drum Kit). Bài này là **hàng đợi FIFO tải audio kèm visualizer**.

---

## 1. Làm cái gì

Một engine tải và phát audio an toàn khi có nhiều yêu cầu cùng lúc, kèm biểu đồ tần số chạy theo thời gian thực:

- Web Audio API, `AnalyserNode` với FFT **256 hoặc 512**;
- hàng đợi **FIFO** cho việc tải và giải mã audio;
- hủy tác vụ bằng `AbortController`;
- dọn tài nguyên audio rõ ràng, không rò rỉ bộ nhớ;
- vẽ bằng Canvas (hoặc SVG) với `requestAnimationFrame`, mục tiêu **60 FPS**;
- không cập nhật React state theo từng frame.

### Nguồn yêu cầu

Thứ tự ưu tiên: yêu cầu của thầy → contract đã chốt → file này → `TASK_DECOMPOSITION.md` → kinh nghiệm chung.
Phân biệt rõ ba loại: **bắt buộc** (thầy yêu cầu), **thiết kế** (tôi chọn), **tùy chọn** (làm thêm).

---

## 2. Cách làm việc

1. **Chia nhỏ:** mỗi task có mã, mục tiêu, đầu vào, đầu ra, phụ thuộc, tiêu chí đạt, cách kiểm tra và tên commit.
2. **Contract trước:** kiểu dữ liệu, ai sở hữu state, cách xử lý lỗi, vòng đời, ý nghĩa của việc hủy, ai sở hữu tài nguyên.
3. **Mỗi lần một task:** không làm trước các task sau, không gộp các việc không liên quan.
4. **Tự kiểm tra:** `tsc`, build, test, xem lại diff. Chỉ khi chạy thật rồi mới ghi là PASS.

Code phải đầy đủ: không để `TODO`, không để kiểu "phần còn lại giữ nguyên", không dùng pseudocode thay cho code thật.

---

## 3. Công nghệ

Dùng: React, TypeScript, Vite, HTML5, CSS hiện đại, Web Audio API, Canvas 2D, `fetch`, `AbortController`, `requestAnimationFrame`, Git.

Không dùng: jQuery, Bootstrap, Tailwind, thư viện phát audio, thư viện hàng đợi hay visualizer làm sẵn, CDN ngoài.

Mặc định chọn **Canvas 2D**. SVG cũng được thầy chấp nhận nhưng không làm cả hai cùng lúc.

---

## 4. Kiến trúc

Tách thành: contract → hàng đợi → tải và giải mã → phát audio → phân tích FFT → vẽ canvas → giao diện React → test.

- Engine **không phụ thuộc React**; không nhét hàng đợi, audio và vòng animation vào cùng một component.
- Mỗi module làm một việc: hàng đợi lên lịch, audio service giữ tài nguyên Web Audio, visualizer đọc dữ liệu và vẽ, React lo tương tác.
- **Mỗi tài nguyên có đúng một chủ sở hữu** chịu trách nhiệm dọn dẹp. Không để hai nơi cùng giữ một `AudioContext` hay một vòng animation.

---

## 5. Hàng đợi `AudioTaskQueue`

Khung thầy cho:

```typescript
export class AudioTaskQueue {
  private queue: AudioTask[] = [];
  private isProcessing = false;
  private activeController: AbortController | null = null;

  async enqueue(trackUrl: string): Promise<AudioBuffer> {
    const controller = new AbortController();
    return new Promise((resolve, reject) => {
      this.queue.push({ trackUrl, controller, resolve, reject });
      this.processNext();
    });
  }
}
```

- **FIFO:** gửi trước thì xử lý trước, task sau không được chen lên.
- **Một worker:** gọi `processNext()` nhiều lần cũng không được chạy song song.
- **Promise nào cũng phải kết thúc:** resolve ra `AudioBuffer` hoặc reject có lý do; không có promise nào treo mãi.
- **Lỗi không chặn hàng đợi:** dùng `try` / `catch` / `finally`; không nuốt lỗi.

## 6. Hủy tác vụ

Phân biệt các thời điểm hủy: trước khi chạy, đang tải, đang giải mã, đã xong, đang phát.

- Task bị hủy khi còn chờ thì không bao giờ được tải.
- Đang tải thì `fetch` phải nhận được `AbortSignal`.
- Task đã hủy không bao giờ được resolve thành công sau đó.
- Hủy xong, hàng đợi phải chạy tiếp task kế theo đúng thứ tự.
- `decodeAudioData()` **không hủy được** bằng AbortSignal; nếu bị hủy giữa chừng thì chờ giải mã xong rồi bỏ kết quả. Không được ghi rằng nó hủy được.
- Hủy không được gây ra unhandled rejection, settle promise 2 lần, hay rò rỉ listener.

---

## 7. Web Audio

- Chỉ tạo `AudioContext` khi cần; không tạo mới sau mỗi lần render; `resume()` sau khi người dùng thao tác (vì trình duyệt chặn autoplay); `close()` khi dispose.
- Mỗi lần phát dùng một `AudioBufferSourceNode` **mới** (node cũ không `start` lại được). Dừng khi cần, xử lý khi phát hết tự nhiên, ngắt kết nối node sau khi dùng xong.
- Đồ thị âm thanh: `AudioBufferSourceNode → AnalyserNode → destination`. Không tạo đường đi trùng làm tiếng to gấp đôi.

## 8. FFT

- Hỗ trợ `fftSize` **256** và **512**. Nhớ rằng `frequencyBinCount = fftSize / 2`, tức là 128 và 256 bin.
- Dùng `getByteFrequencyData()` với một `Uint8Array` được **dùng lại**; chỉ cấp phát lại khi đổi FFT size. Không tạo mảng mới ở mỗi frame.
- Giao diện hiển thị đúng FFT size đang dùng.

## 9. Visualizer và hiệu năng

- Mỗi visualizer chỉ có **một** vòng `requestAnimationFrame`; giữ lại id để `cancelAnimationFrame`; dừng hẳn khi không phát.
- **Không đưa dữ liệu FFT vào React state.** State chỉ dùng cho các trạng thái có ý nghĩa: đang phát, đã dừng, đang tải, lỗi, FFT size, hàng đợi.
- Canvas theo kích thước CSS và nhân `devicePixelRatio`, tự cập nhật khi đổi kích thước.
- 60 FPS phải **đo bằng profiling thật**; dùng `requestAnimationFrame` không có nghĩa là chắc chắn đạt 60 FPS.

## 10. Bộ nhớ

Phải dọn: source node, các kết nối node, `AudioContext`, animation frame, `AbortController`, listener, và cả khi component unmount.
Hàm dọn dẹp gọi nhiều lần không được lỗi. Không giữ lại vô hạn các task đã xong hay các `AudioBuffer` lớn không còn dùng.

---

## 11. Giao diện

- `header`, `main`, `section`, `button`, `label`, `select`, `output`; đúng một `h1`.
- Điều khiển được hoàn toàn bằng bàn phím; dùng `event.key`, không dùng `keyCode` hay `keypress`.
- Có thông báo trạng thái dạng chữ cho: hàng đợi, đang tải, đang phát, đã xong, đã hủy, lỗi. Không chỉ dựa vào hình cột nhảy.
- WCAG 2.2 AA: contrast đủ, thấy rõ focus, form có label, thông báo lỗi rõ ràng.
- CSS: `box-sizing: border-box`, biến trong `:root`, thiết kế cho 375px trước, không tràn ngang, tôn trọng `prefers-reduced-motion`.

## 12. Bảo mật

URL bài nhạc là dữ liệu không tin được: chỉ cho phép `http`/`https`, không giả định server khác cho phép CORS, báo lỗi mạng rõ ràng.
Không dùng `innerHTML`; không vượt qua cơ chế chặn autoplay; không có secret trong code.

---

## 13. Test

- **Hàng đợi:** FIFO, nhiều `enqueue` cùng lúc, một worker, tải lỗi, giải mã lỗi, hủy khi đang chờ hoặc đang chạy, chạy tiếp sau lỗi, dispose.
- **Audio:** tạo và resume context, phát, dừng, phát hết tự nhiên, ngắt node, dispose.
- **Visualizer:** FFT 256/512, số bin, đổi kích thước buffer, bật/tắt vòng lặp, không có vòng trùng, đổi kích thước canvas.
- **Tích hợp:** hàng đợi → giải mã → phát → analyser → visualizer; phát/dừng nhiều lần; hủy rồi phát lại; unmount khi đang phát; lỗi rồi chạy tiếp.
- **Trên Chrome:** Console, Network (request có bị hủy thật không), Performance (FPS), Memory.

## 14. Git

Mỗi task một commit theo Conventional Commits, ví dụ `feat(queue): implement FIFO scheduling`, `feat(audio): configure FFT analyser`.
Commit chỉ chứa thay đổi của đúng task đó. Không dựng commit giả.

## 15. AI Failure Audit

Đề yêu cầu **3 lỗi thật**. Mỗi lỗi ghi: mã lỗi, code/hành vi sai, nguyên nhân, cách tái hiện, bằng chứng (test hoặc DevTools), cách sửa, kết quả kiểm tra lại.
Không cố ý cài lỗi để có cái mà ghi.

## 16. Chuẩn bị vấn đáp

Phải tự giải thích được: FIFO, Promise và async/await, event loop, race condition, `AbortController`, vòng đời của `fetch`, giải mã audio,
`AudioContext`, `AudioBufferSourceNode`, `AnalyserNode`, FFT và bin, Canvas, `requestAnimationFrame`, `useEffect` cleanup, rò rỉ bộ nhớ, atomic commit.

---

## 17. Definition of Done

- [ ] Contract `AudioTask` có kiểu; hàng đợi chạy đúng FIFO, chỉ một worker
- [ ] Tải bằng `fetch`, giải mã bằng Web Audio; hủy bằng `AbortController` chạy đúng
- [ ] Task đã hủy không resolve thành công; task lỗi không chặn hàng đợi
- [ ] Vòng đời source node và `AudioContext` đúng; node được dọn sạch
- [ ] `AnalyserNode` nối đúng; FFT 256 và 512 đúng số bin
- [ ] Visualizer chạy, chỉ một vòng rAF, không đưa FFT vào state
- [ ] Bàn phím dùng được; responsive dùng được
- [ ] Test hủy và test dọn dẹp pass; đã đo hiệu năng bằng trình duyệt; không còn rò rỉ đã biết
- [ ] Audit có 3 lỗi thật; commit nhỏ, rõ ràng; build thành công
- [ ] Tự giải thích và sửa được code

Chỉ đánh dấu khi đã có bằng chứng thật.

---

**Tóm lại:** mỗi lần một task, contract trước, đúng FIFO và hủy an toàn, dọn sạch tài nguyên Web Audio,
không update state theo từng frame, không bịa kết quả test. AI hỗ trợ viết code; tôi là người kiểm tra và chịu trách nhiệm.
