"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Loader2 } from "lucide-react";

interface AIQuizGeneratorProps {
  lessonId?: string;
  onQuizGenerated?: (quiz: any) => void;
}

export default function AIQuizGenerator({
  lessonId,
  onQuizGenerated,
}: AIQuizGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError("Vui lòng nhập chủ đề");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/generate-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          numQuestions,
          level: "intermediate",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Không thể tạo quiz");
      }

      if (data.success && data.data.quiz) {
        onQuizGenerated?.(data.data.quiz);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          Tạo Quiz Với AI
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Chủ đề</Label>
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="VD: JavaScript ES6"
          />
        </div>

        <div className="space-y-2">
          <Label>Số câu hỏi</Label>
          <Input
            type="number"
            min="3"
            max="15"
            value={numQuestions}
            onChange={(e) => setNumQuestions(parseInt(e.target.value))}
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang tạo...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Tạo Quiz
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
