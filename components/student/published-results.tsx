'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { 
  Award,
  Loader2,
  Clock,
  Eye,
  FileText,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { Header } from '../header';

interface Submission {
  _id: string;
  score: number;
  totalPoints: number;
  percentage: number;
  submittedAt: string;
  timeSpent: number;
  roomId: {
    _id: string;
    title: string;
    roomCode: string;
    duration: number;
    examQuizId: {
      _id: string;
      title: string;
    };
    teacherId: {
      name: string;
      email: string;
    };
  };
}

export function PublishedResults() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const { user: authUser, token } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchPublishedResults();
  }, []);

  const fetchPublishedResults = async () => {
    try {
      if (!token) {
        throw new Error('Please login to view results');
      }

      const response = await fetch('/api/student/published-results', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch results');
      }

      const data = await response.json();
      setSubmissions(data.submissions);

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load published results',
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

  const getGradeColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
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

  return (
    <>
    <Header />
        <div className="max-w-7xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="h-8 w-8" />
          Kết quả thi đã được công bố
        </h1>
        <p className="text-muted-foreground mt-2">
          Xem lại kết quả thi đã được công bố và phân tích câu hỏi chi tiết
        </p>
      </div>

      {/* Results Cards */}
      {submissions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Không có kết quả nào được công bố.</h2>
            <p className="text-muted-foreground text-center">
              Giáo viên của bạn chưa công bố kết quả thi nào.
              <br />
              Vui lòng quay lại sau!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {submissions.map((submission) => (
            <Card key={submission._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{submission.roomId.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {submission.roomId.examQuizId.title}
                    </CardDescription>
                  </div>
                  <Badge className={`${getGradeColor(submission.percentage)} text-white text-lg px-3 py-1`}>
                    {getGrade(submission.percentage)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Score Display */}
                <div className="bg-muted rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Your Score</span>
                    <span className="text-2xl font-bold">
                      {submission.score}/{submission.totalPoints}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full ${getGradeColor(submission.percentage)}`}
                      style={{ width: `${submission.percentage}%` }}
                    />
                  </div>
                  <p className="text-center mt-2 text-sm font-semibold">
                    {submission.percentage}%
                  </p>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Teacher
                    </span>
                    <span className="font-medium">{submission.roomId.teacherId.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Time Spent
                    </span>
                    <span className="font-medium">{formatTime(submission.timeSpent)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Submitted
                    </span>
                    <span className="font-medium">
                      {new Date(submission.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button 
                    className="w-full"
                    onClick={() => router.push(`/student/exam-results/${submission.roomId.roomCode}`)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Xem lại bài thi đã làm 
                  </Button>
                  <Button 
                    className="w-full"
                    variant="outline"
                    onClick={() => router.push(`/student/exam-results/${submission.roomId.roomCode}/overview`)}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Xem thống kê lớp học
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
    </>
  );
}
