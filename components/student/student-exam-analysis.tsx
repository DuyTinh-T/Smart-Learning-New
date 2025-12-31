'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Award,
  Loader2,
  ArrowLeft,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

interface Answer {
  questionId: string;
  answer: any;
  isCorrect: boolean;
  points: number;
  timeTaken: number;
}

interface Submission {
  _id: string;
  score: number;
  totalPoints: number;
  percentage: number;
  status: string;
  submittedAt: string;
  timeSpent: number;
  answers: Answer[];
  violations?: {type: string, count: number}[];
}

interface Room {
  _id: string;
  title: string;
  description?: string;
  roomCode: string;
  status: string;
  duration: number;
  publishAnalysis: boolean;
  examQuizId: {
    _id: string;
    title: string;
    questions: any[];
  };
  teacherId: {
    name: string;
    email: string;
  };
  startTime?: string;
  endTime?: string;
}

interface ExamAnalysisProps {
  roomCode: string;
}

export function StudentExamAnalysis({ roomCode }: ExamAnalysisProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const { user: authUser, token } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchAnalysis();
  }, [roomCode]);

  const fetchAnalysis = async () => {
    try {
      if (!token) {
        throw new Error('Please login to view analysis');
      }

      const response = await fetch(`/api/student/exam-analysis/${roomCode}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch analysis');
      }

      const data = await response.json();
      setRoom(data.room);
      setSubmission(data.submission);

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load analysis',
        variant: 'destructive',
      });
      router.push('/student/exam-results');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!room || !submission) {
    return (
      <div className="text-center p-8">
        <h2 className="text-xl font-semibold mb-2">Analysis not available</h2>
        <p className="text-muted-foreground mb-4">
          Unable to load exam analysis.
        </p>
        <Button onClick={() => router.push('/student/exam-results')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Results
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{room.title}</h1>
          <p className="text-muted-foreground">
            {room.examQuizId.title} • Teacher: {room.teacherId.name}
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/student/exam-results')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Your Score Card */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Award className="h-6 w-6" />
            Your Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Score</p>
              <p className="text-3xl font-bold">
                {submission.score}/{submission.totalPoints}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Percentage</p>
              <p className={`text-3xl font-bold ${getGradeColor(submission.percentage)}`}>
                {submission.percentage}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Grade</p>
              <Badge className={`text-2xl px-4 py-2 ${getGradeColor(submission.percentage)}`}>
                {getGrade(submission.percentage)}
              </Badge>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Time Spent</p>
              <p className="text-3xl font-bold flex items-center justify-center gap-2">
                <Clock className="h-6 w-6" />
                {formatTime(submission.timeSpent)}
              </p>
            </div>
          </div>

          {submission.violations && submission.violations.length > 0 && (
            <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <p className="font-semibold text-orange-800 dark:text-orange-400">
                  Violations Detected
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {submission.violations.map((violation, index) => {
                  const violationLabels: {[key: string]: string} = {
                    'tab-switch': 'Tab Switch',
                    'window-blur': 'Window Change',
                    'copy-attempt': 'Copy Attempt',
                    'paste-attempt': 'Paste Attempt',
                    'cut-attempt': 'Cut Attempt',
                    'devtools-attempt': 'DevTools Attempt',
                    'alt-tab': 'Alt+Tab',
                  };

                  return (
                    <Badge key={index} variant="destructive">
                      {violationLabels[violation.type] || violation.type}: {violation.count}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Question Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Question Analysis</CardTitle>
          <CardDescription>
            Detailed breakdown of your answers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {room.examQuizId.questions.map((question: any, index: number) => {
            const answer = submission.answers[index];
            
            return (
              <div key={question._id || index} className={`border rounded-lg p-4 ${
                answer?.isCorrect ? 'bg-green-50 dark:bg-green-950/20 border-green-200' : 'bg-red-50 dark:bg-red-950/20 border-red-200'
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-semibold">Question {index + 1}</p>
                      <Badge variant={answer?.isCorrect ? 'default' : 'destructive'}>
                        {answer?.isCorrect ? (
                          <><CheckCircle className="h-3 w-3 mr-1" /> Correct</>
                        ) : (
                          <><XCircle className="h-3 w-3 mr-1" /> Incorrect</>
                        )}
                      </Badge>
                      <Badge variant="outline">
                        {answer?.points || 0}/{question.points} points
                      </Badge>
                    </div>
                    <p className="text-sm mb-3">{question.text}</p>
                  </div>
                </div>

                {/* Display question options and answers */}
                {question.type === 'multiple-choice' && (
                  <div className="space-y-2 mt-3">
                    {question.options.map((option: string, optIndex: number) => {
                      const isCorrect = question.correctAnswer === optIndex;
                      const isSelected = answer?.answer === optIndex;
                      
                      return (
                        <div 
                          key={optIndex}
                          className={`p-3 rounded border ${
                            isCorrect 
                              ? 'bg-green-100 dark:bg-green-900/30 border-green-300' 
                              : isSelected 
                                ? 'bg-red-100 dark:bg-red-900/30 border-red-300'
                                : 'bg-white dark:bg-gray-800 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {isCorrect && <CheckCircle className="h-4 w-4 text-green-600" />}
                            {isSelected && !isCorrect && <XCircle className="h-4 w-4 text-red-600" />}
                            <span className={`${
                              isCorrect ? 'font-semibold text-green-700 dark:text-green-400' : 
                              isSelected ? 'font-semibold text-red-700 dark:text-red-400' : ''
                            }`}>
                              {option}
                              {isCorrect && ' ✓ (Correct Answer)'}
                              {isSelected && !isCorrect && ' (Your Answer)'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {question.type === 'true-false' && (
                  <div className="space-y-2 mt-3">
                    {['True', 'False'].map((option, optIndex) => {
                      const isCorrect = question.correctAnswer === (optIndex === 0);
                      const isSelected = answer?.answer === (optIndex === 0);
                      
                      return (
                        <div 
                          key={optIndex}
                          className={`p-3 rounded border ${
                            isCorrect 
                              ? 'bg-green-100 dark:bg-green-900/30 border-green-300' 
                              : isSelected 
                                ? 'bg-red-100 dark:bg-red-900/30 border-red-300'
                                : 'bg-white dark:bg-gray-800 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {isCorrect && <CheckCircle className="h-4 w-4 text-green-600" />}
                            {isSelected && !isCorrect && <XCircle className="h-4 w-4 text-red-600" />}
                            <span className={`${
                              isCorrect ? 'font-semibold text-green-700 dark:text-green-400' : 
                              isSelected ? 'font-semibold text-red-700 dark:text-red-400' : ''
                            }`}>
                              {option}
                              {isCorrect && ' ✓ (Correct Answer)'}
                              {isSelected && !isCorrect && ' (Your Answer)'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {question.type === 'short-answer' && (
                  <div className="mt-3 space-y-2">
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 rounded">
                      <p className="text-sm font-semibold text-green-700 dark:text-green-400 mb-1">
                        <CheckCircle className="h-4 w-4 inline mr-1" />
                        Correct Answer:
                      </p>
                      <p className="text-sm">{question.correctAnswer}</p>
                    </div>
                    <div className={`p-3 border rounded ${
                      answer?.isCorrect 
                        ? 'bg-green-100 dark:bg-green-900/30 border-green-300' 
                        : 'bg-red-100 dark:bg-red-900/30 border-red-300'
                    }`}>
                      <p className={`text-sm font-semibold mb-1 ${
                        answer?.isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                      }`}>
                        {answer?.isCorrect ? <CheckCircle className="h-4 w-4 inline mr-1" /> : <XCircle className="h-4 w-4 inline mr-1" />}
                        Your Answer:
                      </p>
                      <p className="text-sm">{answer?.answer || '(No answer)'}</p>
                    </div>
                  </div>
                )}

                <div className="mt-3 text-xs text-muted-foreground flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  Time taken: {formatTime(answer?.timeTaken || 0)}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
