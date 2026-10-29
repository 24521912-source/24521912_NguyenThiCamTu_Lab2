/**
 * Kết quả của mọi thao tác có thể thất bại theo nghiệp vụ (hết hàng, sai phiên bản...).
 * Engine KHÔNG ném lỗi cho các trường hợp này mà trả về { ok: false }, để UI và test kiểm tra tường minh.
 */
export type Result<T, E extends string> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E; readonly message: string };

export const success = <T>(value: T): { readonly ok: true; readonly value: T } => ({ ok: true, value });

export const failure = <E extends string>(error: E, message: string): { readonly ok: false; readonly error: E; readonly message: string } => ({
  ok: false,
  error,
  message,
});
