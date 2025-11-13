"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CheckCircle, Clock, XCircle, Eye, Award } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

interface ProjectSubmission {
  _id: string
  lessonId: {
    _id: string
    title: string
  }
  studentId: {
    _id: string
    name: string
    email: string
  }
  code: string
  explanation?: string
  status: 'submitted' | 'graded' | 'pending'
  score?: number
  feedback?: string
  submittedAt: string
  gradedAt?: string
}

interface TeacherProjectSubmissionsProps {
  courseId: string
  lessonId?: string
}

export function TeacherProjectSubmissions({ courseId, lessonId }: TeacherProjectSubmissionsProps) {
  const { toast } = useToast()
  
  const [submissions, setSubmissions] = useState<ProjectSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubmission, setSelectedSubmission] = useState<ProjectSubmission | null>(null)
  const [gradeScore, setGradeScore] = useState<string>("")
  const [gradeFeedback, setGradeFeedback] = useState<string>("")
  const [grading, setGrading] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false)

  useEffect(() => {
    loadSubmissions()
  }, [courseId, filterStatus])

  const loadSubmissions = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams()
      params.append('courseId', courseId)
      if (lessonId) {
        params.append('lessonId', lessonId)
      }
      if (filterStatus !== 'all') {
        params.append('status', filterStatus)
      }

      const response = await fetch(`/api/submissions?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to load submissions')
      }

      const data = await response.json()
      setSubmissions(data.submissions || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load submissions",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGradeSubmit = async () => {
    if (!selectedSubmission) return

    if (gradeScore === "") {
      toast({
        title: "Validation Error",
        description: "Please enter a score",
        variant: "destructive"
      })
      return
    }

    const score = parseInt(gradeScore)
    if (isNaN(score) || score < 0 || score > 100) {
      toast({
        title: "Validation Error",
        description: "Score must be a number between 0 and 100",
        variant: "destructive"
      })
      return
    }

    setGrading(true)

    try {
      const response = await fetch(`/api/submissions/${selectedSubmission._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          score,
          feedback: gradeFeedback
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to grade submission')
      }

      toast({
        title: "Success!",
        description: "Submission graded successfully"
      })

      setGradeDialogOpen(false)
      setGradeScore("")
      setGradeFeedback("")
      setSelectedSubmission(null)
      
      // Reload submissions
      loadSubmissions()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to grade submission",
        variant: "destructive"
      })
    } finally {
      setGrading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'graded':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Graded</Badge>
      case 'submitted':
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" />Submitted</Badge>
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Project Submissions</CardTitle>
          <CardDescription>
            View and grade student project submissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter */}
          <div className="flex gap-4">
            <div>
              <Label htmlFor="status-filter">Filter by Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="graded">Graded</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Submissions Table */}
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading submissions...</p>
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No submissions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Lesson</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow key={submission._id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{submission.studentId.name}</p>
                          <p className="text-sm text-muted-foreground">{submission.studentId.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{submission.lessonId.title}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">
                          {format(new Date(submission.submittedAt), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(submission.status)}
                      </TableCell>
                      <TableCell>
                        {submission.score !== undefined ? (
                          <div className="flex items-center gap-2">
                            <Award className="h-4 w-4 text-yellow-600" />
                            <span className="font-semibold">{submission.score}%</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedSubmission(submission)
                              setViewDialogOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {submission.status !== 'graded' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedSubmission(submission)
                                if (submission.score !== undefined) {
                                  setGradeScore(submission.score.toString())
                                }
                                if (submission.feedback) {
                                  setGradeFeedback(submission.feedback)
                                }
                                setGradeDialogOpen(true)
                              }}
                            >
                              <Award className="h-4 w-4 mr-1" />
                              Grade
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Submission Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View Submission</DialogTitle>
            <DialogDescription>
              {selectedSubmission && (
                <>
                  {selectedSubmission.studentId.name} - {selectedSubmission.lessonId.title}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-6">
              {/* Code/Solution */}
              <div>
                <Label className="font-semibold mb-2 block">Code/Solution:</Label>
                <div className="bg-gray-50 p-4 rounded border font-mono text-sm max-h-96 overflow-y-auto whitespace-pre-wrap break-words">
                  {selectedSubmission.code}
                </div>
              </div>

              {/* Explanation */}
              {selectedSubmission.explanation && (
                <div>
                  <Label className="font-semibold mb-2 block">Explanation:</Label>
                  <div className="bg-gray-50 p-4 rounded border text-sm whitespace-pre-wrap">
                    {selectedSubmission.explanation}
                  </div>
                </div>
              )}

              {/* Grade Info */}
              {selectedSubmission.score !== undefined && (
                <div className="bg-blue-50 p-4 rounded border border-blue-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-blue-600 font-semibold">Score</p>
                      <p className="text-2xl font-bold text-blue-900">{selectedSubmission.score}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-600 font-semibold">Graded</p>
                      <p className="text-sm text-blue-900">
                        {selectedSubmission.gradedAt
                          ? format(new Date(selectedSubmission.gradedAt), 'MMM dd, yyyy HH:mm')
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Feedback */}
              {selectedSubmission.feedback && (
                <div>
                  <Label className="font-semibold mb-2 block">Feedback:</Label>
                  <div className="bg-amber-50 p-4 rounded border border-amber-200 text-sm whitespace-pre-wrap">
                    {selectedSubmission.feedback}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Grade Submission Dialog */}
      <Dialog open={gradeDialogOpen} onOpenChange={setGradeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Grade Submission</DialogTitle>
            <DialogDescription>
              {selectedSubmission && (
                <>
                  {selectedSubmission.studentId.name} - {selectedSubmission.lessonId.title}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Score Input */}
            <div>
              <Label htmlFor="grade-score">Score (0-100) *</Label>
              <Input
                id="grade-score"
                type="number"
                min="0"
                max="100"
                value={gradeScore}
                onChange={(e) => setGradeScore(e.target.value)}
                placeholder="Enter score"
              />
            </div>

            {/* Feedback */}
            <div>
              <Label htmlFor="grade-feedback">Feedback (Optional)</Label>
              <Textarea
                id="grade-feedback"
                value={gradeFeedback}
                onChange={(e) => setGradeFeedback(e.target.value)}
                placeholder="Provide feedback for the student..."
                className="min-h-[120px] resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Max 5000 characters
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setGradeDialogOpen(false)}
                disabled={grading}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleGradeSubmit}
                disabled={grading || gradeScore === ""}
              >
                {grading ? "Grading..." : "Save Grade"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
