"use client";

import { CreateCourseDialog } from "@/components/teacher/create-course-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export default function TestAICoursePage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Sparkles className="h-12 w-12 text-purple-600" />
            <h1 className="text-4xl font-bold">Test AI Course Creator</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Test the AI-powered course creation with edit capabilities
          </p>
        </div>

        <Card className="border-2 border-purple-200">
          <CardHeader>
            <CardTitle>✨ AI-Enhanced Course Dialog</CardTitle>
            <CardDescription>
              Click the button below to open the course creation dialog with AI generation tab
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <CreateCourseDialog />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📋 Test Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex gap-3">
              <span className="font-semibold text-purple-600">1.</span>
              <span>Click "Create Course" button above</span>
            </div>
            <div className="flex gap-3">
              <span className="font-semibold text-purple-600">2.</span>
              <span>Switch to "AI Generate" tab</span>
            </div>
            <div className="flex gap-3">
              <span className="font-semibold text-purple-600">3.</span>
              <span>Enter a topic like "React Hooks" or "Python Basics"</span>
            </div>
            <div className="flex gap-3">
              <span className="font-semibold text-purple-600">4.</span>
              <span>Click "Generate Course Outline"</span>
            </div>
            <div className="flex gap-3">
              <span className="font-semibold text-purple-600">5.</span>
              <span>Switch back to "Manual Entry" tab to see generated content</span>
            </div>
            <div className="flex gap-3">
              <span className="font-semibold text-purple-600">6.</span>
              <span>Edit any fields you want to change</span>
            </div>
            <div className="flex gap-3">
              <span className="font-semibold text-purple-600">7.</span>
              <span>Click "Create Course" to save</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>💡 Features:</strong>
              <ul className="mt-2 ml-6 space-y-1 list-disc">
                <li>AI generates course title, description, category, tags, and modules</li>
                <li>All AI-generated content is editable before creation</li>
                <li>Automatic category detection based on topic keywords</li>
                <li>Smart tag extraction from AI key points</li>
                <li>Seamless integration with existing course creation workflow</li>
              </ul>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
