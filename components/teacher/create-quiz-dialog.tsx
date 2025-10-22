"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Plus, X, CheckCircle2, Circle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type QuestionType = "multiple-choice" | "essay"

interface MultipleChoiceQuestion {
  type: "multiple-choice"
  question: string
  options: string[]
  correctAnswer: number
}

interface EssayQuestion {
  type: "essay"
  question: string
  maxWords: number
}

type Question = MultipleChoiceQuestion | EssayQuestion

export function CreateQuizDialog() {
  const [open, setOpen] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [activeTab, setActiveTab] = useState<QuestionType>("multiple-choice")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] Quiz created with questions:", questions)
    setOpen(false)
    // Reset form
    setQuestions([])
  }

  const addQuestion = () => {
    if (activeTab === "multiple-choice") {
      setQuestions([
        ...questions,
        {
          type: "multiple-choice",
          question: "",
          options: ["", ""],
          correctAnswer: 0,
        },
      ])
    } else {
      setQuestions([
        ...questions,
        {
          type: "essay",
          question: "",
          maxWords: 500,
        },
      ])
    }
  }

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    const updated = [...questions]
    updated[index] = { ...updated[index], ...updates } as Question
    setQuestions(updated)
  }

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const question = questions[questionIndex]
    if (question.type === "multiple-choice") {
      const newOptions = [...question.options]
      newOptions[optionIndex] = value
      updateQuestion(questionIndex, { options: newOptions })
    }
  }

  const addOption = (questionIndex: number) => {
    const question = questions[questionIndex]
    if (question.type === "multiple-choice") {
      const newOptions = [...question.options, ""]
      updateQuestion(questionIndex, { options: newOptions })
    }
  }

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const question = questions[questionIndex]
    if (question.type === "multiple-choice" && question.options.length > 2) {
      const newOptions = question.options.filter((_, i) => i !== optionIndex)
      const newCorrectAnswer =
        question.correctAnswer >= optionIndex && question.correctAnswer > 0
          ? question.correctAnswer - 1
          : question.correctAnswer
      updateQuestion(questionIndex, { options: newOptions, correctAnswer: newCorrectAnswer })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileText className="h-4 w-4 mr-2" />
          Create Quiz
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Quiz</DialogTitle>
            <DialogDescription>Build a comprehensive quiz with multiple choice and essay questions</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <Card>
              <CardContent className="pt-6">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="quiz-title">Quiz Title</Label>
                    <Input id="quiz-title" placeholder="e.g., Module 1 Assessment" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="course-select">Select Course</Label>
                    <select
                      id="course-select"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    >
                      <option value="">Choose a course</option>
                      <option value="1">Introduction to Web Development</option>
                      <option value="2">Advanced React Patterns</option>
                      <option value="3">JavaScript Fundamentals</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="time-limit">Time Limit (min)</Label>
                      <Input id="time-limit" type="number" placeholder="30" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="passing-score">Passing Score (%)</Label>
                      <Input id="passing-score" type="number" placeholder="70" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="attempts">Max Attempts</Label>
                      <Input id="attempts" type="number" placeholder="3" required />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Quiz Questions</h3>
                  <p className="text-sm text-muted-foreground">
                    {questions.length} {questions.length === 1 ? "question" : "questions"} added
                  </p>
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as QuestionType)} className="w-full">
                <div className="flex items-center justify-between mb-4">
                  <TabsList className="grid w-[400px] grid-cols-2">
                    <TabsTrigger value="multiple-choice">Multiple Choice</TabsTrigger>
                    <TabsTrigger value="essay">Essay Question</TabsTrigger>
                  </TabsList>
                  <Button type="button" onClick={addQuestion} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add {activeTab === "multiple-choice" ? "Multiple Choice" : "Essay"} Question
                  </Button>
                </div>

                <TabsContent value="multiple-choice" className="space-y-4 mt-0">
                  {questions.filter((q) => q.type === "multiple-choice").length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground text-center">
                          No multiple choice questions yet.
                          <br />
                          Click "Add Multiple Choice Question" to create one.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    questions.map((question, qIndex) =>
                      question.type === "multiple-choice" ? (
                        <Card key={qIndex}>
                          <CardContent className="pt-6 space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                  {questions.filter((q, i) => q.type === "multiple-choice" && i <= qIndex).length}
                                </span>
                                <span className="text-sm font-medium">Multiple Choice Question</span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeQuestion(qIndex)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="grid gap-2">
                              <Label>Question</Label>
                              <Textarea
                                placeholder="Enter your question here..."
                                value={question.question}
                                onChange={(e) => updateQuestion(qIndex, { question: e.target.value })}
                                rows={2}
                                className="resize-none"
                              />
                            </div>

                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Label>Answer Options</Label>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addOption(qIndex)}
                                  className="h-8"
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add Option
                                </Button>
                              </div>
                              {question.options.map((option, oIndex) => (
                                <div key={oIndex} className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className={`h-8 w-8 p-0 ${
                                      question.correctAnswer === oIndex
                                        ? "text-green-600 hover:text-green-700"
                                        : "text-muted-foreground hover:text-foreground"
                                    }`}
                                    onClick={() => updateQuestion(qIndex, { correctAnswer: oIndex })}
                                  >
                                    {question.correctAnswer === oIndex ? (
                                      <CheckCircle2 className="h-5 w-5" />
                                    ) : (
                                      <Circle className="h-5 w-5" />
                                    )}
                                  </Button>
                                  <Input
                                    placeholder={`Option ${oIndex + 1}`}
                                    value={option}
                                    onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                    className="flex-1"
                                  />
                                  {question.options.length > 2 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeOption(qIndex, oIndex)}
                                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                              <p className="text-xs text-muted-foreground">
                                Click the circle icon to mark the correct answer
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ) : null,
                    )
                  )}
                </TabsContent>

                <TabsContent value="essay" className="space-y-4 mt-0">
                  {questions.filter((q) => q.type === "essay").length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground text-center">
                          No essay questions yet.
                          <br />
                          Click "Add Essay Question" to create one.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    questions.map((question, qIndex) =>
                      question.type === "essay" ? (
                        <Card key={qIndex}>
                          <CardContent className="pt-6 space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                  {questions.filter((q, i) => q.type === "essay" && i <= qIndex).length}
                                </span>
                                <span className="text-sm font-medium">Essay Question</span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeQuestion(qIndex)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="grid gap-2">
                              <Label>Question</Label>
                              <Textarea
                                placeholder="Enter your essay question here..."
                                value={question.question}
                                onChange={(e) => updateQuestion(qIndex, { question: e.target.value })}
                                rows={3}
                                className="resize-none"
                              />
                            </div>

                            <div className="grid gap-2">
                              <Label htmlFor={`max-words-${qIndex}`}>Maximum Word Count</Label>
                              <Input
                                id={`max-words-${qIndex}`}
                                type="number"
                                placeholder="500"
                                value={question.maxWords}
                                onChange={(e) =>
                                  updateQuestion(qIndex, { maxWords: Number.parseInt(e.target.value) || 500 })
                                }
                                className="w-32"
                              />
                              <p className="text-xs text-muted-foreground">
                                Students will be limited to this word count
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ) : null,
                    )
                  )}
                </TabsContent>
              </Tabs>

              {questions.length > 0 && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Quiz Summary</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {questions.filter((q) => q.type === "multiple-choice").length} multiple choice,{" "}
                          {questions.filter((q) => q.type === "essay").length} essay
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{questions.length}</p>
                        <p className="text-xs text-muted-foreground">Total Questions</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={questions.length === 0}
            >
              Create Quiz ({questions.length} {questions.length === 1 ? "question" : "questions"})
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
