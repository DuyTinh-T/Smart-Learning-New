"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle2, XCircle, ArrowRight, ArrowLeft, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { quizAPI } from "@/lib/api/quiz-api"
import { IQuiz, IQuestion } from "@/models/Quiz"

interface QuizViewProps {
  courseId: string
  lessonId: string
  quizId?: string
  onComplete?: (score: number) => void
}

export function QuizView({ courseId, lessonId, quizId, onComplete }: QuizViewProps) {
  const { toast } = useToast()
  
  const [quiz, setQuiz] = useState<IQuiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number | string>>({})
  const [showResults, setShowResults] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Load quiz data
  useEffect(() => {
    const loadQuiz = async () => {
      if (!quizId) {
        // If no quizId provided, try to find quiz for this lesson
        try {
          console.log('Loading quizzes for lessonId:', lessonId)
          
          // First, try to get quizzes filtered by lessonId
          let response = await quizAPI.getQuizzes({ lessonId })
          console.log('Quiz API response with filter:', response)
          
          // If no results, try getting all quizzes
          if (!response.success || !response.data || response.data.length === 0) {
            console.log('No quizzes found with filter, trying to get all quizzes...')
            response = await quizAPI.getQuizzes()
            console.log('All quizzes response:', response)
          }
          
          if (response.success && response.data && response.data.length > 0) {
            console.log('Available quizzes:', response.data)
            
            // For now, just use the first available quiz for testing
            // Later we'll fix the lessonId matching
            let lessonQuiz = null
            
            if (response.data.length > 0) {
              console.log('Found quizzes, using first one for testing:', response.data[0])
              lessonQuiz = response.data[0]
            }
            
            // Try to match lesson if needed (commented out for now)
            /*
            lessonQuiz = response.data.find((q: any) => {
              console.log('Checking quiz:', q.title, 'lessonId:', q.lessonId)
              return q.lessonId === lessonId || 
                     q.lessonId?._id === lessonId ||
                     q.lessonId?.toString() === lessonId ||
                     q.lesson === lessonId ||
                     (q.lessonId && q.lessonId._id && q.lessonId._id.toString() === lessonId)
            })
            */
            
            if (lessonQuiz) {
              console.log('Found quiz:', lessonQuiz)
              setQuiz(lessonQuiz)
            } else {
              console.log('No matching quiz found for lesson:', lessonId)
              toast({
                title: "No Quiz Found", 
                description: `No quiz available for lesson ${lessonId}.`,
                variant: "destructive"
              })
            }
          } else {
            console.log('No quizzes returned from API at all')
            toast({
              title: "No Quiz Found",
              description: "No quiz available for this lesson yet.",
              variant: "destructive"
            })
          }
        } catch (error) {
          console.error('Error loading quiz:', error)
          toast({
            title: "Error",
            description: "Failed to load quiz data.",
            variant: "destructive"
          })
        }
      } else {
        // Load specific quiz by ID
        try {
          const response = await quizAPI.getQuizById(quizId)
          if (response.success && response.data) {
            setQuiz(response.data)
          } else {
            throw new Error("Quiz not found")
          }
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to load quiz.",
            variant: "destructive"
          })
        }
      }
      setLoading(false)
    }

    loadQuiz()
  }, [quizId, lessonId, toast])

  const handleAnswerSelect = (questionId: string, answer: number | string) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: answer }))
  }

  const handleNext = () => {
    if (quiz && currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1)
    }
  }

  const handleSubmit = async () => {
    if (!quiz) return
    
    setSubmitting(true)
    
    try {
      // Calculate score for multiple choice questions
      const score = calculateScore()
      
      // Here you can add API call to submit quiz attempt
      // const response = await quizApi.submitAttempt(quiz._id, selectedAnswers)
      
      setShowResults(true)
      
      // Call completion callback if provided
      if (onComplete) {
        onComplete(score.percentage)
      }
      
      toast({
        title: "Quiz Submitted",
        description: `You scored ${score.percentage}%`,
        variant: score.percentage >= 70 ? "default" : "destructive"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit quiz. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const calculateScore = () => {
    if (!quiz) return { correct: 0, total: 0, percentage: 0 }
    
    let correct = 0
    let total = 0
    
    quiz.questions.forEach((question: IQuestion) => {
      if (question.type === 'multiple-choice') {
        total++
        const userAnswer = selectedAnswers[question._id?.toString() || '']
        if (typeof userAnswer === 'number' && userAnswer === question.correctIndex) {
          correct++
        }
      }
      // Essay questions need manual grading, so we don't count them in auto-scoring
    })
    
    return {
      correct,
      total,
      percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="bg-muted/30 min-h-screen py-12 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading quiz...</p>
        </div>
      </div>
    )
  }

  // No quiz found state
  if (!quiz) {
    return (
      <div className="bg-muted/30 min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <Card className="text-center">
            <CardHeader>
              <CardTitle>No Quiz Available</CardTitle>
              <CardDescription>There is no quiz for this lesson yet.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild>
                <Link href={`/student/courses/${courseId}`}>Back to Course</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100
  const currentQ = quiz.questions[currentQuestion]
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
                <CardDescription>
                  {score.total > 0 ? `You scored ${score.percentage}%` : "Quiz completed - manual grading required for essay questions"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {score.total > 0 && (
                  <div className="text-center">
                    <p className="text-5xl font-bold mb-2">
                      {score.correct}/{score.total}
                    </p>
                    <p className="text-muted-foreground">Correct Multiple Choice Answers</p>
                  </div>
                )}

                <div className="space-y-3 pt-6">
                  {quiz.questions.map((question: IQuestion, index: number) => {
                    const questionId = question._id?.toString() || ''
                    if (question.type === 'multiple-choice') {
                      const isCorrect = selectedAnswers[questionId] === question.correctIndex
                      return (
                        <div
                          key={questionId}
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
                              <p className="font-medium mb-1">Question {index + 1} (Multiple Choice)</p>
                              <p className="text-sm text-muted-foreground">{question.text}</p>
                              {!isCorrect && question.options && question.correctIndex !== undefined && (
                                <p className="text-sm mt-2">
                                  <span className="font-medium">Correct answer: </span>
                                  {question.options[question.correctIndex]}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    } else {
                      // Essay question
                      return (
                        <div
                          key={questionId}
                          className="p-4 rounded-lg border bg-blue-50 border-blue-200"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center mt-0.5">
                              <span className="text-xs text-white">?</span>
                            </div>
                            <div className="flex-1 text-left">
                              <p className="font-medium mb-1">Question {index + 1} (Essay)</p>
                              <p className="text-sm text-muted-foreground mb-2">{question.text}</p>
                              <div className="bg-white p-3 rounded border">
                                <p className="text-sm font-medium mb-1">Your answer:</p>
                                <p className="text-sm">{selectedAnswers[questionId] || "No answer provided"}</p>
                              </div>
                              <p className="text-xs text-blue-600 mt-2">This question requires manual grading by your instructor.</p>
                            </div>
                          </div>
                        </div>
                      )
                    }
                  })}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-6">
                  <Button variant="outline" className="flex-1 bg-transparent" asChild>
                    <Link href={`#`}>Back to Lesson</Link>
                  </Button>
                  <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                    <Link href={`#`}>Continue Course</Link>
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
                  <CardTitle>{quiz.title}</CardTitle>
                  <CardDescription>Course Quiz</CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Question</p>
                  <p className="text-2xl font-bold">
                    {currentQuestion + 1}/{quiz.questions.length}
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
                  <CardTitle className="text-xl text-balance">{currentQ.text}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {currentQ.type === 'multiple-choice' && currentQ.options ? (
                    <RadioGroup
                      value={selectedAnswers[currentQ._id?.toString() || '']?.toString()}
                      onValueChange={(value) => handleAnswerSelect(currentQ._id?.toString() || '', Number.parseInt(value))}
                    >
                      <div className="space-y-3">
                        {currentQ.options.map((option: string, index: number) => (
                          <motion.div
                            key={index}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={() => handleAnswerSelect(currentQ._id?.toString() || '', index)}
                          >
                            <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                            <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                              {option}
                            </Label>
                          </motion.div>
                        ))}
                      </div>
                    </RadioGroup>
                  ) : (
                    <div className="space-y-4">
                      <Label htmlFor="essay-answer" className="text-base font-medium">
                        Your Answer:
                      </Label>
                      <Textarea
                        id="essay-answer"
                        placeholder="Write your answer here..."
                        value={selectedAnswers[currentQ._id?.toString() || ''] as string || ''}
                        onChange={(e) => handleAnswerSelect(currentQ._id?.toString() || '', e.target.value)}
                        className="min-h-[200px] resize-none"
                      />
                      <p className="text-sm text-muted-foreground">
                        This is an essay question. Your answer will be reviewed by your instructor.
                      </p>
                    </div>
                  )}

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

                    {currentQuestion === quiz.questions.length - 1 ? (
                      <Button
                        onClick={handleSubmit}
                        disabled={submitting || Object.keys(selectedAnswers).length !== quiz.questions.length}
                        className="bg-accent text-accent-foreground hover:bg-accent/90"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          "Submit Quiz"
                        )}
                      </Button>
                    ) : (
                      <Button
                        onClick={handleNext}
                        disabled={selectedAnswers[currentQ._id?.toString() || ''] === undefined}
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
