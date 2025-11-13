"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Upload, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ProjectSubmissionViewProps {
  courseId: string
  lessonId: string
  projectTitle: string
  projectDescription?: string
  onSubmit?: (submission: ProjectSubmission) => void
  isPreviewMode?: boolean
}

export interface ProjectSubmission {
  lessonId: string
  courseId: string
  code: string
  explanation: string
  submittedAt: Date
  status: 'submitted' | 'graded' | 'pending'
  score?: number
  feedback?: string
}

export function ProjectSubmissionView({
  courseId,
  lessonId,
  projectTitle,
  projectDescription,
  onSubmit,
  isPreviewMode = false
}: ProjectSubmissionViewProps) {
  const { toast } = useToast()
  
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [code, setCode] = useState('')
  const [explanation, setExplanation] = useState('')
  const [score, setScore] = useState<number | null>(null)
  const [feedback, setFeedback] = useState('')

  const handleSubmit = async () => {
    if (!code.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter your project code/solution",
        variant: "destructive"
      })
      return
    }

    setSubmitting(true)

    try {
      // Call API to submit project
      const response = await fetch(
        `/api/lessons/${lessonId}/submissions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            explanation,
            courseId
          })
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit project')
      }

      const data = await response.json()
      const submission: ProjectSubmission = {
        ...data.submission,
        submittedAt: new Date(data.submission.submittedAt),
        status: data.submission.status as 'submitted' | 'graded' | 'pending'
      }

      setSubmitted(true)

      if (onSubmit) {
        onSubmit(submission)
      }

      toast({
        title: "Success!",
        description: isPreviewMode 
          ? "Project preview submitted (test mode)" 
          : "Your project has been submitted for review",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit project. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    setCode('')
    setExplanation('')
    setSubmitted(false)
    setScore(null)
    setFeedback('')
  }

  if (submitted) {
    return (
      <div className="bg-muted/30 min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <Card className="text-center">
            <CardHeader>
              <div className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center bg-primary/20">
                <CheckCircle2 className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-3xl mb-2">Project Submitted!</CardTitle>
              <CardDescription>
                {isPreviewMode 
                  ? "Preview submission complete - This is test mode" 
                  : "Your project has been submitted for review. Your instructor will provide feedback soon."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {score !== null && (
                <div className="text-center">
                  <p className="text-5xl font-bold mb-2">{score}%</p>
                  <p className="text-muted-foreground">Score</p>
                </div>
              )}

              {feedback && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="font-medium mb-2 text-blue-900">Instructor Feedback:</p>
                  <p className="text-sm text-blue-800 whitespace-pre-wrap">{feedback}</p>
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-lg border">
                <p className="font-medium mb-2 text-gray-900">Your Submission:</p>
                <div className="bg-white p-3 rounded border font-mono text-sm max-h-64 overflow-y-auto">
                  {code}
                </div>
              </div>

              {explanation && (
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <p className="font-medium mb-2 text-gray-900">Your Explanation:</p>
                  <p className="text-sm whitespace-pre-wrap">{explanation}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                {isPreviewMode && (
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={handleReset}
                  >
                    Reset & Try Again
                  </Button>
                )}
                <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                  Back to Course
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Project Description */}
      {projectDescription && (
        <Card>
          <CardHeader>
            <CardTitle>Project Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none whitespace-pre-wrap text-sm">
              {projectDescription}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Code/Solution Input */}
      <Card>
        <CardHeader>
          <CardTitle>Your Project Code / Solution</CardTitle>
          <CardDescription>
            Write your code, solution, or implementation here
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="project-code">Code / Solution *</Label>
            <Textarea
              id="project-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste your code here or write your solution..."
              className="font-mono text-sm min-h-[300px] resize-none"
            />
            <p className="text-xs text-muted-foreground mt-2">
              You can paste code from your editor, write HTML/CSS/JavaScript directly, or describe your solution
            </p>
          </div>

          <div>
            <Label htmlFor="project-explanation">Explanation (Optional)</Label>
            <Textarea
              id="project-explanation"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Explain your approach, how you solved the problem, or any challenges you faced..."
              className="min-h-[150px] resize-none"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Help your instructor understand your thinking and approach
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Submission Button */}
      <div className="flex gap-3">
        <Button 
          variant="outline" 
          className="flex-1"
        >
          Save as Draft
        </Button>
        <Button 
          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={handleSubmit}
          disabled={submitting || !code.trim()}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Submit Project
            </>
          )}
        </Button>
      </div>

      {isPreviewMode && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <Badge className="mb-2">Preview Mode</Badge>
          <p className="text-sm text-blue-800">
            This is a preview of how students will see the project submission form. Submissions in preview mode are not saved.
          </p>
        </div>
      )}
    </div>
  )
}
