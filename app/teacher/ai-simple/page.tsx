"use client";

import AICourseCreator from "@/components/teacher/ai-course-creator";
import { Sparkles } from "lucide-react";

export default function SimpleAITestPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <Sparkles className="h-8 w-8 text-purple-600" />
            <h1 className="text-3xl font-bold">AI Course Creator</h1>
          </div>
          <p className="text-muted-foreground">
            Generate courses with AI - Edit before creating
          </p>
        </div>

        <AICourseCreator />
      </div>
    </div>
  );
}
