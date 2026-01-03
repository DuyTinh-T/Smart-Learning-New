/**
 * Content Moderation Filter
 * Filters inappropriate content in Vietnamese and English
 */

// Từ khóa tiếng Việt không phù hợp (có thể mở rộng)
const vietnameseBadWords = [
    'ngu',
    'dm',
  'đm',
  'cc',
  'cặc',
  'lồn',
  'buồi',
  'đĩ',
  'đéo',
  'địt',
  'vcl',
  'vl',
  'đồ ngu',
  'ngu ngốc',
  'khốn nạn',
  'đồ khốn',
  'đồ chó',
  'chó má',
  'súc vật',
  'đồ súc sinh',
  'thằng ngu',
  'con ngu',
  'đồ điên',
  'đồ ngốc',
  'đồ ngu si',
  'vô học',
  'đồ vô dụng',
  'phản động',
  'phá hoại',
  // Thêm các từ khóa khác theo nhu cầu
];

// Từ khóa tiếng Anh không phù hợp
const englishBadWords = [
  'stupid',
  'fuck',
  'idiot',
  'dumb',
  'moron',
  'fool',
  'trash',
  'garbage',
  'useless',
  'hate',
  'kill',
  'damn',
  'hell',
  // Thêm các từ khóa khác theo nhu cầu
];

// Các pattern đáng ngờ
const suspiciousPatterns = [
  /\b(hack|cheat|gian lận|lừa đảo)\b/i,
  /\b(spam|quảng cáo|bán hàng)\b/i,
  /([A-Z])\1{4,}/g, // SPAM viết hoa liên tiếp
  /(.)\1{10,}/g, // Ký tự lặp lại quá nhiều
  /(\d{10,})/g, // Số điện thoại hoặc số dài
];

interface FilterResult {
  isClean: boolean;
  reason?: string;
  detectedWord?: string;
}

/**
 * Chuẩn hóa văn bản để so sánh
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu tiếng Việt
    .replace(/[^\w\s]/g, '') // Loại bỏ ký tự đặc biệt
    .replace(/\s+/g, ' ') // Chuẩn hóa khoảng trắng
    .trim();
}

/**
 * Kiểm tra văn bản có chứa từ khóa không phù hợp
 */
export function filterContent(content: string): FilterResult {
  if (!content || content.trim().length === 0) {
    return { isClean: false, reason: 'Nội dung không được để trống' };
  }

  // Kiểm tra độ dài tối đa
  if (content.length > 2000) {
    return { isClean: false, reason: 'Nội dung quá dài (tối đa 2000 ký tự)' };
  }

  const contentLower = content.toLowerCase();

  // Chỉ kiểm tra từ khóa tiếng Việt trong danh sách
  for (const badWord of vietnameseBadWords) {
    const badWordLower = badWord.toLowerCase();
    
    // Kiểm tra từ độc lập (có khoảng trắng hoặc ở đầu/cuối câu)
    const regex = new RegExp(`(^|\\s)${badWordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$|[.,!?;:])`, 'i');
    
    if (regex.test(contentLower)) {
      return {
        isClean: false,
        reason: 'Phát hiện nội dung không phù hợp',
        detectedWord: badWord,
      };
    }
  }

  return { isClean: true };
}

/**
 * Làm sạch nội dung bằng cách thay thế từ khóa không phù hợp
 */
export function sanitizeContent(content: string): string {
  let sanitized = content;
  const allBadWords = [...vietnameseBadWords, ...englishBadWords];

  for (const badWord of allBadWords) {
    const regex = new RegExp(badWord, 'gi');
    sanitized = sanitized.replace(regex, '***');
  }

  return sanitized;
}

/**
 * Đếm số lần vi phạm của một user
 */
export class ViolationTracker {
  private violations = new Map<string, number>();
  private readonly maxViolations = 3;
  private readonly resetTime = 5 * 60 * 1000; // 5 phút

  recordViolation(userId: string): number {
    const current = this.violations.get(userId) || 0;
    const newCount = current + 1;
    this.violations.set(userId, newCount);

    // Tự động reset sau 5 phút
    setTimeout(() => {
      this.violations.delete(userId);
    }, this.resetTime);

    return newCount;
  }

  isBlocked(userId: string): boolean {
    const count = this.violations.get(userId) || 0;
    return count >= this.maxViolations;
  }

  getViolationCount(userId: string): number {
    return this.violations.get(userId) || 0;
  }

  reset(userId: string): void {
    this.violations.delete(userId);
  }
}

export const violationTracker = new ViolationTracker();
