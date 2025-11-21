import { NextRequest, NextResponse } from "next/server";

/**
 * Mock AI API - For testing without OpenAI key
 * Remove this file when you have real OpenAI API key
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      topic, 
      level = "intermediate", 
      numQuestions = 5,
      duration = 30 
    } = body;

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock response
    const mockLesson = {
      lessonTitle: `${topic} - Bài Học Chi Tiết`,
      objective: `Sau khi hoàn thành bài học này, học viên sẽ hiểu rõ về ${topic} và có thể áp dụng vào thực tế.`,
      content: `# Giới thiệu về ${topic}

## Tổng quan
${topic} là một khái niệm quan trọng trong lập trình hiện đại. Bài học này sẽ giúp bạn nắm vững các kiến thức cơ bản và nâng cao.

## Nội dung chính

### 1. Khái niệm cơ bản
- Định nghĩa và mục đích
- Các thành phần chính
- Cách hoạt động

### 2. Ví dụ thực tế
\`\`\`javascript
// Code example
const example = "${topic}";
console.log(example);
\`\`\`

### 3. Best Practices
- Tip 1: Luôn kiểm tra kỹ trước khi sử dụng
- Tip 2: Tối ưu hóa performance
- Tip 3: Viết code dễ đọc và maintain

## Tóm tắt
${topic} là công cụ mạnh mẽ giúp bạn xây dựng ứng dụng tốt hơn. Hãy thực hành thường xuyên để thành thạo!`,
      duration: duration,
      keyPoints: [
        `Hiểu được khái niệm cơ bản về ${topic}`,
        "Biết cách áp dụng vào dự án thực tế",
        "Nắm vững các best practices"
      ],
      quiz: Array.from({ length: numQuestions }, (_, i) => ({
        question: `Câu hỏi ${i + 1} về ${topic}?`,
        options: [
          "Đáp án A - Đây là lựa chọn đúng",
          "Đáp án B - Không chính xác",
          "Đáp án C - Sai hoàn toàn",
          "Đáp án D - Chưa đúng lắm"
        ],
        correctAnswer: 0,
        explanation: `Đáp án A là đúng vì nó phù hợp với định nghĩa chuẩn của ${topic}. Các đáp án khác không đầy đủ hoặc có thông tin sai lệch.`,
        difficulty: i < 2 ? "easy" : i < 4 ? "medium" : "hard"
      })),
      resources: [
        {
          title: `${topic} Documentation`,
          url: "https://developer.mozilla.org/",
          type: "documentation"
        },
        {
          title: `${topic} Tutorial`,
          url: "https://www.youtube.com/",
          type: "video"
        }
      ],
      practiceExercises: [
        `Tạo một ví dụ đơn giản về ${topic}`,
        `Áp dụng ${topic} vào dự án cá nhân`,
        `So sánh ${topic} với các công nghệ tương tự`
      ]
    };

    return NextResponse.json({
      success: true,
      data: mockLesson,
      message: "⚠️ Đây là dữ liệu MOCK - Cần OpenAI API key thực để có kết quả chính xác"
    });

  } catch (error: any) {
    console.error("Mock AI Error:", error);
    return NextResponse.json(
      { error: "Failed to generate mock lesson", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Mock AI Lesson Generator - For testing only",
    warning: "This is a mock API. Please add real OpenAI API key for production.",
    usage: "POST with { topic, level, numQuestions, duration }"
  });
}
