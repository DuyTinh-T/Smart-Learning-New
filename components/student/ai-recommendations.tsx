"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, BookOpen, Target, TrendingUp } from "lucide-react";
import Link from "next/link";

interface CourseRecommendation {
  title: string;
  reason: string;
  difficulty: string;
  matchScore: number;
  tags: string[];
  benefits: string[];
}

interface RecommendationData {
  recommendations: CourseRecommendation[];
  learningPath: string;
  focusAreas: string[];
}

interface AIRecommendationsProps {
  userId: string;
  studentProfile?: any;
  learningHistory?: any;
}

export default function AIRecommendations({
  userId,
  studentProfile,
  learningHistory,
}: AIRecommendationsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Use mock API if you don't have OpenAI key
      // Change to "/api/ai/recommend-mock" for testing
      const response = await fetch("/api/ai/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          studentProfile: studentProfile || {
            interests: ["programming", "web development"],
            currentLevel: "intermediate",
            goals: ["Learn full-stack development"],
          },
          learningHistory: learningHistory || {
            completedCourses: [],
            inProgressCourses: [],
            averageScore: 0,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Không thể tải gợi ý");
      }

      if (data.success) {
        setRecommendations(data.data);
      }
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi tải gợi ý");
    } finally {
      setIsLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "beginner":
        return "bg-green-100 text-green-800";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800";
      case "advanced":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "beginner":
        return "Cơ bản";
      case "intermediate":
        return "Trung bình";
      case "advanced":
        return "Nâng cao";
      default:
        return difficulty;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Gợi Ý Khóa Học Từ AI
          </CardTitle>
          <CardDescription>
            Khám phá các khóa học phù hợp với bạn dựa trên phân tích AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!recommendations && !isLoading && (
            <Button
              onClick={fetchRecommendations}
              className="w-full"
              size="lg"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Nhận Gợi Ý Từ AI
            </Button>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500 mb-4" />
              <p className="text-gray-600">
                Đang phân tích hồ sơ và tạo gợi ý cho bạn...
              </p>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {recommendations && (
        <>
          {/* Learning Path Overview */}
          {recommendations.learningPath && (
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-900">
                  <Target className="h-5 w-5" />
                  Lộ Trình Học Tập Của Bạn
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-purple-800">{recommendations.learningPath}</p>
              </CardContent>
            </Card>
          )}

          {/* Focus Areas */}
          {recommendations.focusAreas && recommendations.focusAreas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  Kỹ Năng Cần Tập Trung
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {recommendations.focusAreas.map((area, idx) => (
                    <Badge key={idx} variant="secondary" className="text-sm py-1 px-3">
                      {area}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Course Recommendations */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Khóa Học Được Gợi Ý ({recommendations.recommendations?.length || 0})
            </h3>

            {recommendations.recommendations?.map((rec, idx) => (
              <Card
                key={idx}
                className="hover:shadow-lg transition-shadow border-l-4 border-l-purple-500"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{rec.title}</CardTitle>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className={getDifficultyColor(rec.difficulty)}>
                          {getDifficultyText(rec.difficulty)}
                        </Badge>
                        {rec.matchScore && (
                          <Badge variant="outline" className="bg-green-50">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Độ phù hợp: {rec.matchScore}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Reason */}
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-1">
                      Tại sao phù hợp với bạn:
                    </h4>
                    <p className="text-gray-600">{rec.reason}</p>
                  </div>

                  {/* Benefits */}
                  {rec.benefits && rec.benefits.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm text-gray-700 mb-2">
                        Lợi ích:
                      </h4>
                      <ul className="list-disc list-inside space-y-1">
                        {rec.benefits.map((benefit, bidx) => (
                          <li key={bidx} className="text-gray-600 text-sm">
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Tags */}
                  {rec.tags && rec.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {rec.tags.map((tag, tidx) => (
                        <Badge key={tidx} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="pt-2">
                    <Link href="/courses">
                      <Button className="w-full" variant="default">
                        Khám Phá Khóa Học
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Refresh Button */}
          <Card>
            <CardContent className="pt-6">
              <Button
                onClick={fetchRecommendations}
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang tải...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Làm Mới Gợi Ý
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
