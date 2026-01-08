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
  violations?: {type: string, count: number}[];
  quizId?: {
    type: 'multiple-choice' | 'essay' | 'mixed';
    title: string;
  };
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

  // Check if essay exam and not yet graded
  const isEssayExam = submission.quizId?.type === 'essay' || submission.quizId?.type === 'mixed';
  const isGraded = submission.status === 'graded';

  if (isEssayExam && !isGraded) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Clock className="h-16 w-16 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Bài Thi Đã Nộp</CardTitle>
            <CardDescription>
              Đang chờ giáo viên chấm điểm
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="text-center p-6 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800 dark:text-blue-400 mb-2">
                Bài thi của bạn đã được nộp thành công!
              </p>
              <p className="text-xs text-muted-foreground">
                Giáo viên sẽ chấm điểm và đánh giá bài làm của bạn. Vui lòng quay lại sau để xem kết quả.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Số câu hỏi</p>
                <p className="text-xl font-bold">{submission.answers.length}</p>
              </div>

              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Thời gian làm bài</p>
                <p className="text-xl font-bold">{formatTime(submission.timeSpent)}</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mt-4">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Đã nộp lúc {new Date(submission.submittedAt).toLocaleString('vi-VN')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Violations Summary (if any) */}
        {submission.violations && submission.violations.length > 0 && (
          <Card className="border-orange-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <XCircle className="h-5 w-5" />
                Vi phạm trong bài thi
              </CardTitle>
              <CardDescription>
                Tổng cộng {submission.violations.reduce((sum, v) => sum + v.count, 0)} vi phạm đã được ghi nhận
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {submission.violations.map((violation, index) => {
                  const violationLabels: {[key: string]: string} = {
                    'tab-switch': 'Chuyển tab',
                    'window-blur': 'Chuyển cửa sổ',
                    'copy-attempt': 'Thử copy',
                    'paste-attempt': 'Thử paste',
                    'cut-attempt': 'Thử cut',
                    'devtools-attempt': 'Thử mở DevTools',
                    'alt-tab': 'Sử dụng Alt+Tab',
                  };

                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200">
                      <span className="text-sm font-medium text-orange-800 dark:text-orange-400">
                        {violationLabels[violation.type] || violation.type}
                      </span>
                      <Badge variant="destructive">
                        {violation.count} lần
                      </Badge>
                    </div>
                  );
                })}
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Lưu ý: Các vi phạm này đã được ghi lại và giáo viên có thể xem chi tiết.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-center">
          <Button onClick={() => router.push('/student/dashboard')}>
            <Home className="h-4 w-4 mr-2" />
            Về Trang Chủ
          </Button>
        </div>
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
          <CardTitle className="text-3xl">Bài thi đã hoàn thành!</CardTitle>
          <CardDescription>
            Đây là kết quả của bạn
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Điểm</p>
              <p className="text-2xl font-bold">
                {submission.score}/{submission.totalPoints}
              </p>
            </div>

            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Phần trăm</p>
              <p className={`text-2xl font-bold ${getGradeColor(submission.percentage)}`}>
                {submission.percentage}%
              </p>
            </div>

            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Xếp loại</p>
              <p className={`text-2xl font-bold ${getGradeColor(submission.percentage)}`}>
                {getGrade(submission.percentage)}
              </p>
            </div>

            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Thời gian</p>
              <p className="text-2xl font-bold">
                {formatTime(submission.timeSpent)}
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nộp bài vào {new Date(submission.submittedAt).toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Violations Summary */}
      {submission.violations && submission.violations.length > 0 && (
        <Card className="border-orange-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <XCircle className="h-5 w-5" />
              Vi phạm trong bài thi
            </CardTitle>
            <CardDescription>
              Tổng cộng {submission.violations.reduce((sum, v) => sum + v.count, 0)} vi phạm đã được ghi nhận
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {submission.violations.map((violation, index) => {
                const violationLabels: {[key: string]: string} = {
                  'tab-switch': 'Chuyển tab',
                  'window-blur': 'Chuyển cửa sổ',
                  'copy-attempt': 'Thử copy',
                  'paste-attempt': 'Thử paste',
                  'cut-attempt': 'Thử cut',
                  'devtools-attempt': 'Thử mở DevTools',
                  'alt-tab': 'Sử dụng Alt+Tab',
                };

                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200">
                    <span className="text-sm font-medium text-orange-800 dark:text-orange-400">
                      {violationLabels[violation.type] || violation.type}
                    </span>
                    <Badge variant="destructive">
                      {violation.count} lần
                    </Badge>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Lưu ý: Các vi phạm này đã được ghi lại và giáo viên có thể xem chi tiết.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Answer Review */}
      <Card>
        <CardHeader>
          <CardTitle>Đánh giá câu trả lời</CardTitle>
          <CardDescription>
            {submission.answers.filter(a => a.isCorrect).length} trong số {submission.answers.length} đúng
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
                  {answer.points} / {answer.points} điểm
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Thời gian: {formatTime(answer.timeTaken)}
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
