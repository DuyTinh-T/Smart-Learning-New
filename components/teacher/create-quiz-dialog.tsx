"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import { FileText, Plus, X, CheckCircle2, Circle, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { quizAPI, type CreateQuizData, type QuizQuestion } from "@/lib/api/quiz-api"
import { courseApi, moduleApi, lessonApi } from "@/lib/api/course-api"
import { useToast } from "@/hooks/use-toast"

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

interface Course {
  _id: string;
  title: string;
  modules?: Module[];
}

interface Module {
  _id: string;
  title: string;
  lessons?: Lesson[];
}

interface Lesson {
  _id: string;
  title: string;
}

export function CreateQuizDialog() {
  const [open, setOpen] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [activeTab, setActiveTab] = useState<QuestionType>("multiple-choice")
  const [loading, setLoading] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState("")
  const [selectedLesson, setSelectedLesson] = useState("")
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loadingLessons, setLoadingLessons] = useState(false)
  const [quizForm, setQuizForm] = useState({
    title: "",
    timeLimit: "",
    passingScore: "",
    maxAttempts: ""
  })
  
  const { toast } = useToast()

  // Load courses when dialog opens
  useEffect(() => {
    if (open) {
      loadCourses()
    } else {
      // Reset form when dialog closes
      resetForm()
    }
  }, [open])

  const resetForm = () => {
    setQuestions([])
    setSelectedCourse("")
    setSelectedLesson("")
    setLessons([])
    setQuizForm({
      title: "",
      timeLimit: "",
      passingScore: "",
      maxAttempts: ""
    })
    setActiveTab("multiple-choice")
  }

  const loadCourses = async () => {
    try {
      const response = await courseApi.getAll({ limit: 100, visibility: 'public' })
      if (response.success && response.data) {
        console.log('Loaded courses:', response.data) // Debug log
        setCourses(response.data)
      }
    } catch (error) {
      console.error('Failed to load courses:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load courses. Please try again."
      })
    }
  }

  const loadLessons = async (courseId: string) => {
    if (!courseId) return
    
    setLoadingLessons(true)
    try {
      // First get modules for the course (which includes lesson IDs)
      const modulesResponse = await courseApi.getModules(courseId)
      console.log('Modules response:', modulesResponse) // Debug log
      
      if (modulesResponse.success && modulesResponse.data && modulesResponse.data.modules) {
        const allLessons: Lesson[] = []
        
        // Collect lesson IDs from all modules
        for (const module of modulesResponse.data.modules) {
          if (module.lessons && module.lessons.length > 0) {
            // Each lesson is just an ID string, we need to fetch lesson details
            for (const lessonId of module.lessons) {
              try {
                const lessonResponse = await lessonApi.getById(lessonId)
                console.log(`Lesson details for ${lessonId}:`, lessonResponse) // Debug log
                
                if (lessonResponse.success && lessonResponse.data) {
                  allLessons.push({
                    _id: lessonResponse.data._id,
                    title: lessonResponse.data.title
                  })
                }
              } catch (lessonError) {
                console.error(`Failed to load lesson ${lessonId}:`, lessonError)
              }
            }
          }
        }
        
        console.log('All lessons loaded:', allLessons) // Debug log
        setLessons(allLessons)
      }
    } catch (error) {
      console.error('Failed to load lessons:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load lessons. Please try again."
      })
    } finally {
      setLoadingLessons(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedLesson) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a lesson for this quiz."
      })
      return
    }

    if (questions.length === 0) {
      toast({
        variant: "destructive",
        title: "Error", 
        description: "Please add at least one question to the quiz."
      })
      return
    }

    if (!quizForm.title.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a quiz title."
      })
      return
    }

    setLoading(true)

    try {
      // Validate and convert UI questions to API format
      const apiQuestions: QuizQuestion[] = [];
      
      for (const [index, question] of questions.entries()) {
        // Check if question text is empty
        if (!question.question || question.question.trim() === '') {
          toast({
            variant: "destructive",
            title: "Error",
            description: `Question ${index + 1} cannot be empty. Please enter a question.`
          })
          setLoading(false)
          return
        }

        const baseQuestion: QuizQuestion = {
          text: question.question.trim(),
          type: question.type,
          points: 1,
          difficulty: 'medium'
        }

        if (question.type === 'multiple-choice') {
          // Validate multiple choice options
          const options = question.options && Array.isArray(question.options) ? question.options : [];
          const validOptions = options.filter(opt => opt && opt.trim() !== '');
          
          if (validOptions.length < 2) {
            toast({
              variant: "destructive",
              title: "Error",
              description: `Multiple choice question ${index + 1} must have at least 2 valid options.`
            })
            setLoading(false)
            return
          }
          
          // Ensure correctIndex is valid
          if (question.correctAnswer < 0 || question.correctAnswer >= validOptions.length) {
            toast({
              variant: "destructive",
              title: "Error",
              description: `Please select a correct answer for multiple choice question ${index + 1}.`
            })
            setLoading(false)
            return
          }
          
          apiQuestions.push({
            ...baseQuestion,
            options: validOptions,
            correctIndex: question.correctAnswer
          })
        } else {
          // Validate essay question
          const maxWords = question.maxWords && question.maxWords > 0 ? question.maxWords : 500;
          apiQuestions.push({
            ...baseQuestion,
            maxWords: maxWords
          })
        }
      }

      const quizData: CreateQuizData = {
        lessonId: selectedLesson,
        title: quizForm.title,
        questions: apiQuestions,
        timeLimit: quizForm.timeLimit ? parseInt(quizForm.timeLimit) * 60 : undefined, // convert minutes to seconds
        passingScore: quizForm.passingScore ? parseInt(quizForm.passingScore) : undefined,
        maxAttempts: quizForm.maxAttempts ? parseInt(quizForm.maxAttempts) : undefined,
        allowMultipleAttempts: true,
        showCorrectAnswers: true,
        shuffleQuestions: false,
        shuffleOptions: false
      }

      console.log('Quiz data being sent:', quizData) // Debug log
      console.log('API questions:', apiQuestions) // Debug log

      const response = await quizAPI.createQuiz(quizData)
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Quiz created successfully!"
        })
        
        // Reset form and close dialog
        setOpen(false)
      }
    } catch (error) {
      console.error('Failed to create quiz:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create quiz. Please try again."
      })
    } finally {
      setLoading(false)
    }
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
                    <Input 
                      id="quiz-title" 
                      value={quizForm.title}
                      onChange={(e) => setQuizForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Module 1 Assessment" 
                      required 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="course-select">Select Course</Label>
                    <select
                      id="course-select"
                      value={selectedCourse}
                      onChange={(e) => {
                        const courseId = e.target.value
                        setSelectedCourse(courseId)
                        setSelectedLesson("")
                        setLessons([])
                        if (courseId) {
                          loadLessons(courseId)
                        }
                      }}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    >
                      <option value="">Choose a course</option>
                      {courses.map((course) => (
                        <option key={course._id} value={course._id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedCourse && (
                    <div className="grid gap-2">
                      <Label htmlFor="lesson-select">Select Lesson</Label>
                      <select
                        id="lesson-select"
                        value={selectedLesson}
                        onChange={(e) => setSelectedLesson(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        required
                        disabled={loadingLessons}
                      >
                        <option value="">
                          {loadingLessons ? "Loading lessons..." : "Choose a lesson"}
                        </option>
                        {lessons.map((lesson) => (
                          <option key={lesson._id} value={lesson._id}>
                            {lesson.title}
                          </option>
                        ))}
                      </select>
                      {lessons.length === 0 && !loadingLessons && selectedCourse && (
                        <p className="text-xs text-muted-foreground text-orange-600">
                          No lessons found for this course. Please add lessons first.
                        </p>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="time-limit">Time Limit (min)</Label>
                      <Input 
                        id="time-limit" 
                        type="number" 
                        value={quizForm.timeLimit}
                        onChange={(e) => setQuizForm(prev => ({ ...prev, timeLimit: e.target.value }))}
                        placeholder="30" 
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="passing-score">Passing Score (%)</Label>
                      <Input 
                        id="passing-score" 
                        type="number" 
                        value={quizForm.passingScore}
                        onChange={(e) => setQuizForm(prev => ({ ...prev, passingScore: e.target.value }))}
                        placeholder="70" 
                        required 
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="attempts">Max Attempts</Label>
                      <Input 
                        id="attempts" 
                        type="number" 
                        value={quizForm.maxAttempts}
                        onChange={(e) => setQuizForm(prev => ({ ...prev, maxAttempts: e.target.value }))}
                        placeholder="3" 
                        required 
                      />
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={questions.length === 0 || loading || !selectedLesson || !quizForm.title.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>Create Quiz ({questions.length} {questions.length === 1 ? "question" : "questions"})</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
