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
  Home
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
}

interface StudentExamResultsProps {
  roomCode: string;
}

export function StudentExamResults({ roomCode }: StudentExamResultsProps) {
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const { user: authUser, token } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchResults();
  }, [roomCode]);

  const fetchResults = async () => {
    try {
      if (!token) {
        throw new Error('Please login to view results');
      }

      const response = await fetch(`/api/rooms/${roomCode}/submission`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch results');
      }

      setSubmission(data.submission);

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load results',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="text-center p-8">
        <h2 className="text-xl font-semibold mb-2">No Results Found</h2>
        <p className="text-muted-foreground mb-4">
          You haven't submitted this exam yet.
        </p>
        <Button onClick={() => router.push('/student/dashboard')}>
          <Home className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Award className={`h-16 w-16 ${getGradeColor(submission.percentage)}`} />
          </div>
          <CardTitle className="text-3xl">Exam Completed!</CardTitle>
          <CardDescription>
            Here are your results
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Score</p>
              <p className="text-2xl font-bold">
                {submission.score}/{submission.totalPoints}
              </p>
            </div>

            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Percentage</p>
              <p className={`text-2xl font-bold ${getGradeColor(submission.percentage)}`}>
                {submission.percentage}%
              </p>
            </div>

            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Grade</p>
              <p className={`text-2xl font-bold ${getGradeColor(submission.percentage)}`}>
                {getGrade(submission.percentage)}
              </p>
            </div>

            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Time Spent</p>
              <p className="text-2xl font-bold">
                {formatTime(submission.timeSpent)}
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Submitted on {new Date(submission.submittedAt).toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Answer Review */}
      <Card>
        <CardHeader>
          <CardTitle>Answer Review</CardTitle>
          <CardDescription>
            {submission.answers.filter(a => a.isCorrect).length} out of {submission.answers.length} correct
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {submission.answers.map((answer, index) => (
            <div 
              key={answer.questionId} 
              className={`p-4 rounded-lg border ${
                answer.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {answer.isCorrect ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className="font-medium">Question {index + 1}</span>
                </div>
                <Badge variant={answer.isCorrect ? 'default' : 'destructive'}>
                  {answer.points} / {answer.points} points
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Time taken: {formatTime(answer.timeTaken)}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-center gap-4">
        <Button onClick={() => router.push('/student/dashboard')}>
          <Home className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
