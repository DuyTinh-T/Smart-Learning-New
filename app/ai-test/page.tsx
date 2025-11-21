"use client";

import { useState } from "react";
import AILessonGenerator from "@/components/teacher/ai-lesson-generator";
import AIRecommendations from "@/components/student/ai-recommendations";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Sparkles, BookOpen, Target } from "lucide-react";

export default function AITestPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-3 flex items-center justify-center gap-3">
            <Sparkles className="h-8 w-8 text-purple-500" />
            AI Learning Assistant
          </h1>
          <p className="text-gray-600 text-lg">
            Trải nghiệm các tính năng AI trong nền tảng học tập
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <BookOpen className="h-5 w-5" />
                AI Lesson Generator
              </CardTitle>
              <CardDescription>
                Tạo bài học tự động với nội dung chi tiết và câu hỏi kiểm tra
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Target className="h-5 w-5" />
                AI Course Recommendations
              </CardTitle>
              <CardDescription>
                Gợi ý khóa học thông minh dựa trên phân tích học tập của bạn
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Main Content with Tabs */}
        <Tabs defaultValue="generator" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="generator" className="text-lg">
              <BookOpen className="h-4 w-4 mr-2" />
              Tạo Bài Học (Teacher)
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="text-lg">
              <Target className="h-4 w-4 mr-2" />
              Gợi Ý Khóa Học (Student)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generator">
            <AILessonGenerator
              onLessonCreated={(lesson) => {
                console.log("Lesson created:", lesson);
              }}
            />
          </TabsContent>

          <TabsContent value="recommendations">
            <AIRecommendations
              userId="test-user-id"
              studentProfile={{
                interests: ["web development", "javascript", "react"],
                currentLevel: "intermediate",
                goals: ["Learn full-stack development", "Build real-world projects"],
              }}
              learningHistory={{
                completedCourses: ["HTML/CSS Basics", "JavaScript Fundamentals"],
                inProgressCourses: ["React Advanced"],
                averageScore: 85,
              }}
            />
          </TabsContent>
        </Tabs>

        {/* Footer Info */}
        <Card className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 border-none">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Powered by <strong>OpenAI GPT-3.5</strong>
              </p>
              <p className="text-xs text-gray-500">
                Các tính năng AI này sử dụng công nghệ học máy tiên tiến để cung cấp
                trải nghiệm học tập cá nhân hóa
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
