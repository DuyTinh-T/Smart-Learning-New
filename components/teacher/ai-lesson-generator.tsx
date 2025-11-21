"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Loader2, CheckCircle, XCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface AILessonGeneratorProps {
  moduleId?: string;
  order?: number;
  onLessonCreated?: (lesson: any) => void;
}

export default function AILessonGenerator({
  moduleId,
  order = 1,
  onLessonCreated,
}: AILessonGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLesson, setGeneratedLesson] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    topic: "",
    level: "intermediate",
    numQuestions: 5,
    objectives: "",
    duration: 30,
  });

  const handleGenerate = async () => {
    if (!formData.topic.trim()) {
      setError("Vui lòng nhập chủ đề bài học");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccess(false);
    setGeneratedLesson(null);

    try {
      // Use mock API if you don't have OpenAI key
      // Change to "/api/ai/generate-lesson-mock" for testing
      const response = await fetch("/api/ai/generate-lesson", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          moduleId,
          order,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Không thể tạo bài học");
      }

      if (data.success) {
        setGeneratedLesson(data.data || data.aiGenerated);
        setSuccess(true);
        
        if (data.lesson && onLessonCreated) {
          onLessonCreated(data.lesson);
        }
      }
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi tạo bài học");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Tạo Bài Học Với AI
          </CardTitle>
          <CardDescription>
            Sử dụng AI để tự động tạo nội dung bài học và câu hỏi kiểm tra
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="topic">Chủ đề bài học *</Label>
            <Input
              id="topic"
              placeholder="VD: Lập trình hướng đối tượng trong Python"
              value={formData.topic}
              onChange={(e) =>
                setFormData({ ...formData, topic: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="level">Cấp độ</Label>
              <Select
                value={formData.level}
                onValueChange={(value) =>
                  setFormData({ ...formData, level: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Cơ bản</SelectItem>
                  <SelectItem value="intermediate">Trung bình</SelectItem>
                  <SelectItem value="advanced">Nâng cao</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Thời lượng (phút)</Label>
              <Input
                id="duration"
                type="number"
                min="15"
                max="180"
                value={formData.duration}
                onChange={(e) =>
                  setFormData({ ...formData, duration: parseInt(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="numQuestions">Số câu hỏi kiểm tra</Label>
            <Input
              id="numQuestions"
              type="number"
              min="3"
              max="15"
              value={formData.numQuestions}
              onChange={(e) =>
                setFormData({ ...formData, numQuestions: parseInt(e.target.value) })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="objectives">Mục tiêu học tập (tùy chọn)</Label>
            <Textarea
              id="objectives"
              placeholder="VD: Học viên có thể hiểu và áp dụng các khái niệm OOP trong Python..."
              value={formData.objectives}
              onChange={(e) =>
                setFormData({ ...formData, objectives: e.target.value })
              }
              rows={3}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Bài học đã được tạo thành công!
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang tạo bài học...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Tạo Bài Học Với AI
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedLesson && (
        <Card>
          <CardHeader>
            <CardTitle>Kết Quả</CardTitle>
            <CardDescription>
              Nội dung bài học được AI tạo ra - Bạn có thể chỉnh sửa trước khi lưu
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Lesson Title */}
            <div>
              <Label className="text-lg font-semibold">Tiêu đề</Label>
              <p className="mt-1 text-xl font-bold text-gray-800">
                {generatedLesson.lessonTitle}
              </p>
            </div>

            {/* Objective */}
            <div>
              <Label className="text-lg font-semibold">Mục tiêu</Label>
              <p className="mt-1 text-gray-700">{generatedLesson.objective}</p>
            </div>

            {/* Key Points */}
            {generatedLesson.keyPoints && (
              <div>
                <Label className="text-lg font-semibold">Điểm chính</Label>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  {generatedLesson.keyPoints.map((point: string, idx: number) => (
                    <li key={idx} className="text-gray-700">
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Content */}
            <div>
              <Label className="text-lg font-semibold">Nội dung</Label>
              <div className="mt-2 prose prose-sm max-w-none bg-gray-50 p-4 rounded-lg">
                <ReactMarkdown>{generatedLesson.content}</ReactMarkdown>
              </div>
            </div>

            {/* Quiz Questions */}
            {generatedLesson.quiz && generatedLesson.quiz.length > 0 && (
              <div>
                <Label className="text-lg font-semibold">
                  Câu hỏi kiểm tra ({generatedLesson.quiz.length})
                </Label>
                <div className="mt-3 space-y-4">
                  {generatedLesson.quiz.map((q: any, idx: number) => (
                    <Card key={idx} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-4">
                        <p className="font-semibold mb-3">
                          {idx + 1}. {q.question}
                        </p>
                        <div className="space-y-2 mb-3">
                          {q.options.map((option: string, optIdx: number) => (
                            <div
                              key={optIdx}
                              className={`p-2 rounded ${
                                optIdx === q.correctAnswer
                                  ? "bg-green-100 border border-green-400"
                                  : "bg-gray-50"
                              }`}
                            >
                              {String.fromCharCode(65 + optIdx)}. {option}
                              {optIdx === q.correctAnswer && (
                                <span className="ml-2 text-green-600 font-semibold">
                                  ✓ Đúng
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                          <strong>Giải thích:</strong> {q.explanation}
                        </div>
                        {q.difficulty && (
                          <div className="mt-2 text-sm">
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                              {q.difficulty === "easy"
                                ? "Dễ"
                                : q.difficulty === "medium"
                                ? "Trung bình"
                                : "Khó"}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Practice Exercises */}
            {generatedLesson.practiceExercises && (
              <div>
                <Label className="text-lg font-semibold">Bài tập thực hành</Label>
                <ul className="mt-2 list-decimal list-inside space-y-2">
                  {generatedLesson.practiceExercises.map(
                    (exercise: string, idx: number) => (
                      <li key={idx} className="text-gray-700">
                        {exercise}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}

            {/* Resources */}
            {generatedLesson.resources && generatedLesson.resources.length > 0 && (
              <div>
                <Label className="text-lg font-semibold">Tài liệu tham khảo</Label>
                <ul className="mt-2 space-y-2">
                  {generatedLesson.resources.map((resource: any, idx: number) => (
                    <li key={idx}>
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {resource.title} ({resource.type})
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
