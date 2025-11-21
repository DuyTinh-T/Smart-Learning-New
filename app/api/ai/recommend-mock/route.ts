import { NextRequest, NextResponse } from "next/server";

/**
 * Mock AI Recommendations API - For testing without OpenAI key
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentProfile } = body;

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const interests = studentProfile?.interests || ["programming"];
    
    // Mock recommendations
    const mockData = {
      recommendations: [
        {
          title: "Full-Stack Web Development với MERN Stack",
          reason: "Khóa học này phù hợp với bạn vì bạn quan tâm đến web development. Nó bao gồm MongoDB, Express, React và Node.js - những công nghệ phổ biến nhất hiện nay.",
          difficulty: "intermediate",
          matchScore: 95,
          tags: ["javascript", "react", "nodejs", "mongodb"],
          benefits: [
            "Học được stack công nghệ đang hot nhất",
            "Xây dựng được dự án thực tế end-to-end",
            "Dễ dàng tìm việc với MERN stack"
          ]
        },
        {
          title: "React Advanced - Hooks & Performance",
          reason: "Dựa trên lịch sử học tập, bạn đã nắm cơ bản React. Đây là bước tiến xa hơn với các kỹ thuật nâng cao về Hooks, Context API và tối ưu performance.",
          difficulty: "advanced",
          matchScore: 92,
          tags: ["react", "hooks", "performance", "optimization"],
          benefits: [
            "Nắm vững React Hooks patterns",
            "Tối ưu hiệu suất ứng dụng React",
            "Code như senior developer"
          ]
        },
        {
          title: "TypeScript for JavaScript Developers",
          reason: "TypeScript đang trở thành standard trong các dự án lớn. Với nền tảng JavaScript của bạn, học TypeScript sẽ nâng cao giá trị bản thân rất nhiều.",
          difficulty: "intermediate",
          matchScore: 88,
          tags: ["typescript", "javascript", "typing"],
          benefits: [
            "Viết code an toàn hơn với type system",
            "Tăng tính maintainability của code",
            "Được ưu tiên trong các công ty lớn"
          ]
        },
        {
          title: "Git & GitHub Mastery",
          reason: "Version control là kỹ năng bắt buộc cho mọi developer. Khóa học này sẽ giúp bạn làm chủ Git từ cơ bản đến nâng cao.",
          difficulty: "beginner",
          matchScore: 85,
          tags: ["git", "github", "version-control"],
          benefits: [
            "Quản lý code hiệu quả",
            "Làm việc nhóm chuyên nghiệp",
            "Contribute vào open source"
          ]
        },
        {
          title: "RESTful API Design & Best Practices",
          reason: "Để trở thành full-stack developer, bạn cần hiểu sâu về API design. Khóa học này dạy cách thiết kế API chuẩn và scalable.",
          difficulty: "intermediate",
          matchScore: 82,
          tags: ["api", "rest", "backend", "design"],
          benefits: [
            "Thiết kế API chuẩn RESTful",
            "Hiểu rõ về authentication & security",
            "Xây dựng backend scalable"
          ]
        }
      ],
      learningPath: `Dựa trên profile của bạn với ${interests.join(", ")}, tôi đề xuất lộ trình: 
      1) Nắm vững cơ bản JavaScript/TypeScript 
      2) Học React và các patterns nâng cao 
      3) Làm chủ backend với Node.js 
      4) Tích hợp database và deploy production
      5) Học về testing và CI/CD để hoàn thiện kỹ năng full-stack`,
      focusAreas: [
        "Modern JavaScript/TypeScript",
        "React Hooks & State Management",
        "Node.js & Express Backend",
        "Database Design (MongoDB/SQL)",
        "Testing & Deployment",
        "Git & Collaboration"
      ]
    };

    return NextResponse.json({
      success: true,
      data: mockData,
      message: "⚠️ Đây là dữ liệu MOCK - Cần OpenAI API key thực để có gợi ý chính xác hơn"
    });

  } catch (error: any) {
    console.error("Mock AI Recommendation Error:", error);
    return NextResponse.json(
      { error: "Failed to generate mock recommendations", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Mock AI Recommendations - For testing only",
    warning: "This is a mock API. Please add real OpenAI API key for production."
  });
}
