// Chụp 2 heap snapshot (sau đợt 2 và đợt 8) rồi so số object theo loại. Chạy giống browser-audit.cjs: node scripts/heap-diff.cjs
const puppeteer = require(process.argv[2] || 'puppeteer-core');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function snapshot(cdp) {
  await cdp.send('HeapProfiler.collectGarbage');
  let chunks = '';
  const onChunk = ({ chunk }) => (chunks += chunk);
  cdp.on('HeapProfiler.addHeapSnapshotChunk', onChunk);
  await cdp.send('HeapProfiler.takeHeapSnapshot', { reportProgress: false });
  cdp.off('HeapProfiler.addHeapSnapshotChunk', onChunk);
  const snap = JSON.parse(chunks);
  const f = snap.snapshot.meta.node_fields, types = snap.snapshot.meta.node_types[0], n = f.length;
  const ti = f.indexOf('type'), ni = f.indexOf('name'), si = f.indexOf('self_size');
  const counts = new Map();
  for (let i = 0; i < snap.nodes.length; i += n) {
    const type = types[snap.nodes[i + ti]];
    if (type !== 'object' && type !== 'closure') continue;
    const key = `${type}:${snap.strings[snap.nodes[i + ni]]}`;
    const c = counts.get(key) || { count: 0, size: 0 };
    c.count++; c.size += snap.nodes[i + si]; counts.set(key, c);
  }
  return counts;
}
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage();
  await p.goto('http://localhost:4300/', { waitUntil: 'networkidle0' });
  const cdp = await p.createCDPSession();
  const click = (t) => p.evaluate((t) => [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === t || x.getAttribute('aria-label')?.startsWith(t)).click(), t);
  await click('Thêm cùng lúc 3 bài demo');
  await p.waitForFunction(() => document.querySelectorAll('[aria-labelledby="tracks-heading"] li').length === 3);
  const round = async () => {
    for (let i = 0; i < 40; i++) { await click('Phát'); await sleep(40); await click('Dừng phát'); }
    for (let i = 0; i < 20; i++) { await click('Thêm cùng lúc 3 bài demo'); await p.evaluate(() => document.querySelectorAll('[aria-labelledby="queue-heading"] li button').forEach((x) => x.click())); await sleep(30); }
    await p.waitForFunction(() => !document.querySelector('[aria-labelledby="queue-heading"] li')); await sleep(300);
  };
  await round(); await round();
  const a = await snapshot(cdp);
  for (let i = 0; i < 6; i++) await round();
  const z = await snapshot(cdp);
  const diff = [...z].map(([k, v]) => [k, v.count - (a.get(k)?.count || 0), v.size - (a.get(k)?.size || 0)]).filter(([, c]) => c !== 0).sort((x, y) => Math.abs(y[2]) - Math.abs(x[2])).slice(0, 15);
  console.log('Tăng/giảm số object sau thêm 6 đợt (240 lần phát/dừng, 360 yêu cầu bị hủy):');
  diff.forEach(([k, c, s]) => console.log(`  ${k.padEnd(45)} ${String(c).padStart(5)} obj  ${String(s).padStart(8)} B`));
  for (const name of ['object:AudioBufferSourceNode', 'object:AudioBuffer', 'object:DOMException', 'object:AbortController', 'object:AbortSignal', 'object:FiberNode', 'object:Promise']) console.log(`  ${name}: ${a.get(name)?.count || 0} → ${z.get(name)?.count || 0}`);
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
