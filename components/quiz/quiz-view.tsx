"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { CheckCircle2, XCircle, ArrowRight, ArrowLeft } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"

const quizData = {
  id: 1,
  title: "CSS Grid Fundamentals Quiz",
  courseId: 1,
  lessonId: 6,
  courseTitle: "Introduction to Web Development",
  questions: [
    {
      id: 1,
      question: "What is the main difference between CSS Grid and Flexbox?",
      options: [
        "Grid is one-dimensional, Flexbox is two-dimensional",
        "Grid is two-dimensional, Flexbox is one-dimensional",
        "They are exactly the same",
        "Grid only works with columns",
      ],
      correctAnswer: 1,
    },
    {
      id: 2,
      question: "Which property is used to create a grid container?",
      options: ["display: flex", "display: grid", "grid-container: true", "layout: grid"],
      correctAnswer: 1,
    },
    {
      id: 3,
      question: "What does 'fr' stand for in CSS Grid?",
      options: ["Frame", "Fraction", "Free", "Fixed ratio"],
      correctAnswer: 1,
    },
    {
      id: 4,
      question: "How do you create three equal columns in CSS Grid?",
      options: [
        "grid-columns: 3",
        "grid-template-columns: 1fr 1fr 1fr",
        "columns: repeat(3)",
        "grid-layout: three-columns",
      ],
      correctAnswer: 1,
    },
    {
      id: 5,
      question: "What property controls the spacing between grid items?",
      options: ["margin", "padding", "gap", "spacing"],
      correctAnswer: 2,
    },
  ],
}

export function QuizView({ courseId, lessonId }: { courseId: string; lessonId: string }) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({})
  const [showResults, setShowResults] = useState(false)

  const handleAnswerSelect = (questionId: number, answerIndex: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: answerIndex }))
  }

  const handleNext = () => {
    if (currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1)
    }
  }

  const handleSubmit = () => {
    setShowResults(true)
  }

  const calculateScore = () => {
    let correct = 0
    quizData.questions.forEach((question) => {
      if (selectedAnswers[question.id] === question.correctAnswer) {
        correct++
      }
    })
    return {
      correct,
      total: quizData.questions.length,
      percentage: Math.round((correct / quizData.questions.length) * 100),
    }
  }

  const progress = ((currentQuestion + 1) / quizData.questions.length) * 100
  const currentQ = quizData.questions[currentQuestion]
  const score = showResults ? calculateScore() : null

  if (showResults && score) {
    return (
      <div className="bg-muted/30 min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="text-center">
              <CardHeader>
                <div
                  className={`w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center ${
                    score.percentage >= 70 ? "bg-primary/20" : "bg-destructive/20"
                  }`}
                >
                  {score.percentage >= 70 ? (
                    <CheckCircle2 className="h-12 w-12 text-primary" />
                  ) : (
                    <XCircle className="h-12 w-12 text-destructive" />
                  )}
                </div>
                <CardTitle className="text-3xl mb-2">
                  {score.percentage >= 70 ? "Great Job!" : "Keep Practicing!"}
                </CardTitle>
                <CardDescription>You scored {score.percentage}%</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <p className="text-5xl font-bold mb-2">
                    {score.correct}/{score.total}
                  </p>
                  <p className="text-muted-foreground">Correct Answers</p>
                </div>

                <div className="space-y-3 pt-6">
                  {quizData.questions.map((question, index) => {
                    const isCorrect = selectedAnswers[question.id] === question.correctAnswer
                    return (
                      <div
                        key={question.id}
                        className={`p-4 rounded-lg border ${
                          isCorrect ? "bg-primary/5 border-primary/20" : "bg-destructive/5 border-destructive/20"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {isCorrect ? (
                            <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                          ) : (
                            <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                          )}
                          <div className="flex-1 text-left">
                            <p className="font-medium mb-1">Question {index + 1}</p>
                            <p className="text-sm text-muted-foreground">{question.question}</p>
                            {!isCorrect && (
                              <p className="text-sm mt-2">
                                <span className="font-medium">Correct answer: </span>
                                {question.options[question.correctAnswer]}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-6">
                  <Button variant="outline" className="flex-1 bg-transparent" asChild>
                    <Link href={`/student/courses/${courseId}/lessons/${lessonId}`}>Back to Lesson</Link>
                  </Button>
                  <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                    <Link href={`/student/courses/${courseId}`}>Continue Course</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-muted/30 min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <CardTitle>{quizData.title}</CardTitle>
                  <CardDescription>{quizData.courseTitle}</CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Question</p>
                  <p className="text-2xl font-bold">
                    {currentQuestion + 1}/{quizData.questions.length}
                  </p>
                </div>
              </div>
              <Progress value={progress} className="h-2" />
            </CardHeader>
          </Card>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl text-balance">{currentQ.question}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <RadioGroup
                    value={selectedAnswers[currentQ.id]?.toString()}
                    onValueChange={(value) => handleAnswerSelect(currentQ.id, Number.parseInt(value))}
                  >
                    <div className="space-y-3">
                      {currentQ.options.map((option, index) => (
                        <motion.div
                          key={index}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => handleAnswerSelect(currentQ.id, index)}
                        >
                          <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                          <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                            {option}
                          </Label>
                        </motion.div>
                      ))}
                    </div>
                  </RadioGroup>

                  <div className="flex items-center justify-between pt-6">
                    <Button
                      variant="outline"
                      onClick={handlePrevious}
                      disabled={currentQuestion === 0}
                      className="bg-transparent"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>

                    {currentQuestion === quizData.questions.length - 1 ? (
                      <Button
                        onClick={handleSubmit}
                        disabled={Object.keys(selectedAnswers).length !== quizData.questions.length}
                        className="bg-accent text-accent-foreground hover:bg-accent/90"
                      >
                        Submit Quiz
                      </Button>
                    ) : (
                      <Button
                        onClick={handleNext}
                        disabled={selectedAnswers[currentQ.id] === undefined}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        Next
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
