// Đo bộ nhớ và hiệu năng trong Chrome thật (H01, H02).
// Cách chạy (puppeteer-core chỉ cài tạm, không ghi vào package.json):
//   npm install --no-save puppeteer-core@24
//   npm run build
//   npx vite preview --port 4300        (để chạy ở một terminal khác)
//   node scripts/browser-audit.cjs       (ROUNDS=8 để chạy 8 đợt lặp)
// Kết quả in ra dạng JSON để chép vào docs/MEMORY_AUDIT.md và docs/PERFORMANCE_AUDIT.md.
const puppeteerPath = process.argv[2] || 'puppeteer-core';
const puppeteer = require(puppeteerPath);

const URL = process.env.AUDIT_URL || 'http://localhost:4300/';
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Chạy trước mọi script của trang: bọc các API để đếm tài nguyên
function instrument() {
  const stats = { contexts: 0, closed: 0, sources: 0, disconnectedSources: 0, rafCalls: 0, analyserReads: 0, mutations: 0 };
  window.__audit = stats;
  const NativeContext = window.AudioContext;
  window.AudioContext = class extends NativeContext {
    constructor(...args) {
      super(...args);
      stats.contexts++;
      const close = this.close.bind(this);
      this.close = () => {
        stats.closed++;
        return close();
      };
      const createBufferSource = this.createBufferSource.bind(this);
      this.createBufferSource = () => {
        const source = createBufferSource();
        stats.sources++;
        const disconnect = source.disconnect.bind(source);
        source.disconnect = (...a) => {
          stats.disconnectedSources++;
          return disconnect(...a);
        };
        return source;
      };
    }
  };
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (callback) => {
    stats.rafCalls++;
    return raf(callback);
  };
  const read = AnalyserNode.prototype.getByteFrequencyData;
  AnalyserNode.prototype.getByteFrequencyData = function (array) {
    stats.analyserReads++;
    return read.call(this, array);
  };
  addEventListener('DOMContentLoaded', () => {
    new MutationObserver((records) => (stats.mutations += records.length)).observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
    });
  });
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--autoplay-policy=no-user-gesture-required'],
  });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  await page.setViewport({ width: 1280, height: 900 });
  await page.evaluateOnNewDocument(instrument);
  await page.goto(URL, { waitUntil: 'networkidle0' });
  const cdp = await page.createCDPSession();
  await cdp.send('Performance.enable');

  const stats = () => page.evaluate(() => ({ ...window.__audit }));
  // gc = true: dọn rác trước khi đo bộ nhớ; đo thời gian CPU thì không gc để khỏi tính nhầm thời gian dọn rác
  const metrics = async (gc = true) => {
    if (gc) await cdp.send('HeapProfiler.collectGarbage');
    const { metrics: list } = await cdp.send('Performance.getMetrics');
    const pick = (name) => list.find((m) => m.name === name).value;
    return {
      heapMB: +(pick('JSHeapUsedSize') / 1048576).toFixed(2),
      nodes: pick('Nodes'),
      listeners: pick('JSEventListeners'),
      scriptSeconds: pick('ScriptDuration'),
      taskSeconds: pick('TaskDuration'),
    };
  };
  const click = (label) =>
    page.evaluate((text) => {
      const button = [...document.querySelectorAll('button')].find(
        (b) => b.textContent.trim() === text || b.getAttribute('aria-label')?.startsWith(text),
      );
      button.click();
    }, label);
  const readyCount = () => page.$$eval('[aria-labelledby="tracks-heading"] li', (items) => items.length);

  // Chuẩn bị: tải 3 bài, phát thử một lần để engine tạo đủ context/analyser
  await click('Thêm cùng lúc 3 bài demo');
  await page.waitForFunction(() => document.querySelectorAll('[aria-labelledby="tracks-heading"] li').length === 3);
  await click('Phát');
  await sleep(300);
  await click('Dừng phát');
  await sleep(300);
  const baseline = await metrics();

  // H02: đếm vòng rAF và FPS khi đang phát với FFT 256 và 512
  const performance = {};
  for (const fft of ['256', '512']) {
    await page.select('select', fft);
    await click('Phát');
    await sleep(500);
    const before = await stats();
    const m0 = await metrics(false);
    const t0 = Date.now();
    await sleep(3000);
    const after = await stats();
    const m1 = await metrics(false);
    const seconds = (Date.now() - t0) / 1000;
    const frames = after.analyserReads - before.analyserReads;
    performance[`fft${fft}`] = {
      bins: await page.$eval('output', (o) => Number(o.textContent)),
      visualizerFps: +(frames / seconds).toFixed(1),
      rafCallsPerSecond: +((after.rafCalls - before.rafCalls) / seconds).toFixed(1),
      domMutationsWhilePlaying: after.mutations - before.mutations,
      mainThreadScriptMsPerFrame: +(((m1.scriptSeconds - m0.scriptSeconds) * 1000) / frames).toFixed(3),
      mainThreadTaskMsPerFrame: +(((m1.taskSeconds - m0.taskSeconds) * 1000) / frames).toFixed(3),
    };
    await click('Dừng phát');
    await sleep(300);
  }
  const idle0 = await stats();
  await sleep(1000);
  const idle1 = await stats();
  const rafWhenStopped = idle1.rafCalls - idle0.rafCalls;

  // H01: lặp phát/dừng và thêm/hủy nhiều đợt; rò rỉ thật sẽ làm heap/nodes/listeners tăng đều theo từng đợt
  const rounds = [];
  for (let round = 0; round < Number(process.env.ROUNDS || 3); round++) {
  for (let i = 0; i < 40; i++) {
    await click('Phát');
    await sleep(40);
    await click('Dừng phát');
  }
  for (let i = 0; i < 20; i++) {
    await click('Thêm cùng lúc 3 bài demo');
    // Hủy ngay các bài còn trong hàng đợi (bài đầu có thể đã kịp tải xong)
    await page.evaluate(() =>
      document.querySelectorAll('[aria-labelledby="queue-heading"] li button').forEach((b) => b.click()),
    );
    await sleep(30);
  }
  await page.waitForFunction(() => !document.querySelector('[aria-labelledby="queue-heading"] li'));
  await sleep(300);
  rounds.push(await metrics());
  }
  const final = rounds.at(-1);
  const counters = await stats();

  console.log(
    JSON.stringify(
      {
        url: URL,
        chrome: await browser.version(),
        performance,
        rafCallsInOneSecondWhileStopped: rafWhenStopped,
        memory: {
          baseline,
          afterEachRound: rounds.map(({ heapMB, nodes, listeners }) => ({ heapMB, nodes, listeners })),
          afterCycles: final,
          playStopCyclesPerRound: 40,
          enqueueCancelCyclesPerRound: 20,
          readyTracksKept: await readyCount(),
        },
        audioResources: {
          audioContextsCreated: counters.contexts,
          audioContextsClosed: counters.closed,
          sourcesCreated: counters.sources,
          sourcesDisconnected: counters.disconnectedSources,
        },
        pageErrors: errors,
      },
      null,
      2,
    ),
  );
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
