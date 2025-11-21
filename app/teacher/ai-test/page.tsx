"use client";

import AILessonGenerator from "@/components/teacher/ai-lesson-generator";
import AIQuizGenerator from "@/components/teacher/ai-quiz-generator";
import AICourseCreator from "@/components/teacher/ai-course-creator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, FileText, HelpCircle, BookOpen, GraduationCap } from "lucide-react";

export default function AITestPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Sparkles className="h-10 w-10 text-purple-600 animate-pulse" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              AI Teaching Assistant
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Generate lessons and quizzes with AI - powered by Google Gemini 2.0
          </p>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="course" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-12">
            <TabsTrigger value="course" className="gap-2 text-base">
              <GraduationCap className="h-5 w-5" />
              Course Creator
            </TabsTrigger>
            <TabsTrigger value="lesson" className="gap-2 text-base">
              <FileText className="h-5 w-5" />
              Lesson Generator
            </TabsTrigger>
            <TabsTrigger value="quiz" className="gap-2 text-base">
              <HelpCircle className="h-5 w-5" />
              Quiz Generator
            </TabsTrigger>
          </TabsList>

          <TabsContent value="course" className="mt-6 space-y-6">
            <AICourseCreator />
          </TabsContent>

          <TabsContent value="lesson" className="mt-6 space-y-6">
            <AILessonGenerator />
          </TabsContent>

          <TabsContent value="quiz" className="mt-6 space-y-6">
            <AIQuizGenerator />
          </TabsContent>
        </Tabs>

        {/* Instructions */}
        <Card className="border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-600" />
              How to Use AI Tools
            </CardTitle>
            <CardDescription>
              Follow these steps to generate educational content with AI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              <div className="flex gap-3 items-start">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 font-semibold text-xs">
                  1
                </div>
                <div>
                  <p className="font-medium">Enter Your Topic</p>
                  <p className="text-muted-foreground">Type any subject you want to teach (e.g., "React Hooks", "Python Loops", "Machine Learning Basics")</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 font-semibold text-xs">
                  2
                </div>
                <div>
                  <p className="font-medium">Generate with AI</p>
                  <p className="text-muted-foreground">Click the button and wait a few seconds while Gemini creates your content ✨</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 font-semibold text-xs">
                  3
                </div>
                <div>
                  <p className="font-medium">Review & Preview</p>
                  <p className="text-muted-foreground">Check the generated content in the preview section. Content is in Vietnamese by default.</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 font-semibold text-xs">
                  4
                </div>
                <div>
                  <p className="font-medium">Edit & Save</p>
                  <p className="text-muted-foreground">Edit any generated content in the "Manual Entry" tab, then save to create your course/lesson/quiz</p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex gap-3">
                <Sparkles className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-purple-700 dark:text-purple-300 mb-1">AI-Powered by Google Gemini 2.0 Flash</p>
                  <p className="text-purple-600 dark:text-purple-400">
                    Fast, free, and intelligent content generation. All generated content is in Vietnamese and can be edited to match your teaching style.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
