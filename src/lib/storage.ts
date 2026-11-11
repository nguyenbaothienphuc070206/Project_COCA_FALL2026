/**
 * Tính năng: Bộ lưu trữ trình duyệt an toàn (try/catch localStorage với bộ nhớ RAM dự phòng).
 * Trường hợp sử dụng: Lưu tùy chọn người dùng, ngôn ngữ, chế độ sáng/tối và kệ sách cá nhân mà không bao giờ gây lỗi khi trình duyệt chặn cookie/storage.
 */

const memoryFallbackStore = new Map<string, string>();

/**
 * Đọc giá trị JSON từ localStorage, tự động chuyển sang bộ nhớ RAM nếu trình duyệt chặn quyền truy cập.
 * @param key - Khóa lưu trữ
 * @param fallbackValue - Giá trị mặc định nếu chưa tồn tại hoặc dữ liệu lỗi
 * @returns Giá trị đã giải mã hoặc fallbackValue
 */
export function safeGetStorage<T>(key: string, fallbackValue: T): T {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) {
        return JSON.parse(raw) as T;
      }
    }
  } catch {
    // Fallback to in-memory map if localStorage is blocked (e.g., strict iframe privacy mode)
  }

  try {
    const memRaw = memoryFallbackStore.get(key);
    if (memRaw !== undefined) {
      return JSON.parse(memRaw) as T;
    }
  } catch {
    // Return fallbackValue
  }

  return fallbackValue;
}

/**
 * Ghi giá trị JSON vào localStorage kèm bộ nhớ RAM dự phòng.
 * @param key - Khóa lưu trữ
 * @param value - Giá trị cần lưu
 */
export function safeSetStorage<T>(key: string, value: T): void {
  const serialized = JSON.stringify(value);
  memoryFallbackStore.set(key, serialized);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, serialized);
    }
  } catch {
    // Silently rely on memoryFallbackStore
  }
}
