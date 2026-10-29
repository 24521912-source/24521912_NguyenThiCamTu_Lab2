// Sinh file WAV demo bằng sóng tổng hợp (không có bản quyền). Chạy: node scripts/generate-demo-audio.mjs
import { writeFileSync } from 'node:fs';

const SAMPLE_RATE = 22050;
const SECONDS = 6;
const outDir = new URL('../public/audio/', import.meta.url);

function wav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((value, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, value)) * 32767), i * 2));
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16); // kích thước khối fmt
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

function render(fn) {
  return Array.from({ length: SAMPLE_RATE * SECONDS }, (_, i) => fn(i / SAMPLE_RATE));
}

// Fade 50ms đầu/cuối để không bị tiếng "tách"
const fade = (t) => Math.min(1, t / 0.05, (SECONDS - t) / 0.05);
const sine = (freq, t) => Math.sin(2 * Math.PI * freq * t);

// Pseudo-random cố định để file sinh ra lần nào cũng giống nhau
let seed = 1;
const noise = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;

const tracks = {
  'chord.wav': (t) => fade(t) * 0.25 * (sine(261.63, t) + sine(329.63, t) + sine(392, t)) * (0.6 + 0.4 * sine(0.5, t)),
  'sweep.wav': (t) => {
    // Quét 100 Hz → 5000 Hz theo hàm mũ: pha = tích phân của tần số
    const k = Math.log(50) / SECONDS;
    return fade(t) * 0.6 * Math.sin((2 * Math.PI * 100 * (Math.exp(k * t) - 1)) / k);
  },
  'beat.wav': (t) => {
    const beat = t % 0.5;
    const kick = Math.exp(-beat * 18) * sine(55 + 90 * Math.exp(-beat * 30), beat);
    const hat = (t + 0.25) % 0.5 < 0.04 ? noise() * 0.3 : 0;
    return fade(t) * (0.8 * kick + hat);
  },
};

for (const [name, fn] of Object.entries(tracks)) {
  writeFileSync(new URL(name, outDir), wav(render(fn)));
}
// File hỏng có chủ đích: đuôi .wav nhưng không phải audio → thử nhánh lỗi decode
writeFileSync(new URL('broken.wav', outDir), 'Day khong phai file audio.\n');
console.log('Đã tạo:', [...Object.keys(tracks), 'broken.wav'].join(', '));
