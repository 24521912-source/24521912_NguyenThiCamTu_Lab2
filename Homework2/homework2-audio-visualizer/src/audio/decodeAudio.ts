import { AudioTaskError } from '../types/queue';

/**
 * Giải mã ArrayBuffer thành AudioBuffer bằng context do AudioEngine sở hữu (không tạo context mới).
 *
 * decodeAudioData() KHÔNG nhận AbortSignal nên không hủy được giữa chừng.
 * Việc bỏ kết quả của task đã hủy do AudioTaskQueue đảm nhận (kiểm tra signal sau khi decode xong).
 */
export async function decodeAudio(context: BaseAudioContext, data: ArrayBuffer): Promise<AudioBuffer> {
  try {
    return await context.decodeAudioData(data);
  } catch (error) {
    throw new AudioTaskError('decode', 'Không giải mã được file audio (định dạng không hỗ trợ hoặc file hỏng)', {
      cause: error,
    });
  }
}
