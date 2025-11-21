"use client";

import { useState } from "react";
import AILessonGenerator from "@/components/teacher/ai-lesson-generator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, BookOpen, CheckCircle } from "lucide-react";

export default function TeacherAIToolsPage() {
  const [createdLessons, setCreatedLessons] = useState<any[]>([]);

  const handleLessonCreated = (lesson: any) => {
    setCreatedLessons([...createdLessons, lesson]);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3 flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-purple-500" />
            AI Teaching Assistant
          </h1>
          <p className="text-gray-600 text-lg">
            Create lessons and quiz questions automatically with AI
          </p>
        </div>

        {/* Info Card */}
        <Card className="mb-6 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-600" />
              How It Works
            </CardTitle>
            <CardDescription>
              AI-powered lesson creation in 3 easy steps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Enter Topic</h3>
                  <p className="text-sm text-gray-600">
                    Describe what you want to teach
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-1">AI Generates</h3>
                  <p className="text-sm text-gray-600">
                    Complete lesson with quiz questions
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Review & Edit</h3>
                  <p className="text-sm text-gray-600">
                    Customize before publishing
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Created Lessons Summary */}
        {createdLessons.length > 0 && (
          <Alert className="mb-6 border-green-500 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              You have created {createdLessons.length} lesson(s) with AI today!
            </AlertDescription>
          </Alert>
        )}

        {/* AI Lesson Generator */}
        <AILessonGenerator />

        {/* Recent Created Lessons */}
        {createdLessons.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recently Created Lessons</CardTitle>
              <CardDescription>
                Lessons created in this session
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {createdLessons.map((lesson, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <h3 className="font-semibold">{lesson.title}</h3>
                      <p className="text-sm text-gray-600">
                        Duration: {lesson.duration} minutes
                      </p>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer Note */}
        <Card className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 border-none">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Powered by <strong>Google Gemini AI</strong>
              </p>
              <p className="text-xs text-gray-500">
                All content is generated by AI and should be reviewed before publishing
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
