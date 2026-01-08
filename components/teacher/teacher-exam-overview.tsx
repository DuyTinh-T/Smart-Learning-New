'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { ExamChatDiscussion } from '../student/exam-chat-discussion';
import { 
  CheckCircle, 
  XCircle, 
  Award,
  Loader2,
  ArrowLeft,
  Users,
  BarChart3
} from 'lucide-react';
import { Header } from '../header';

interface Answer {
  questionId: string;
  answer: any;
  isCorrect: boolean;
  points: number;
  timeTaken: number;
}

interface Submission {
  _id: string;
  studentId: {
    _id: string;
    name: string;
    email: string;
  };
  score: number;
  totalPoints: number;
  percentage: number;
  status: string;
  submittedAt: string;
  timeSpent: number;
  answers: Answer[];
}

interface Room {
  _id: string;
  title: string;
  roomCode: string;
  examQuizId: {
    _id: string;
    title: string;
    questions: any[];
  };
  teacherId: {
    name: string;
    email: string;
  };
}

interface ExamOverviewProps {
  roomCode: string;
}

export function TeacherExamOverview({ roomCode }: ExamOverviewProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const { user: authUser, token } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchOverview();
  }, [roomCode]);

  const fetchOverview = async () => {
    try {
      if (!token) {
        throw new Error('Please login to view overview');
      }

      const response = await fetch(`/api/teacher/exam-overview/${roomCode}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch overview');
      }

      const data = await response.json();
      setRoom(data.room);
      setSubmissions(data.submissions);

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load overview',
        variant: 'destructive',
      });
      router.push('/teacher/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    if (submissions.length === 0) {
      return {
        totalSubmissions: 0,
        averageScore: 0,
        averagePercentage: 0,
        passRate: 0,
      };
    }

    const total = submissions.length;
    const totalScore = submissions.reduce((sum, s) => sum + s.score, 0);
    const totalPercentage = submissions.reduce((sum, s) => sum + s.percentage, 0);
    const passed = submissions.filter(s => s.percentage >= 60).length;

    return {
      totalSubmissions: total,
      averageScore: totalScore / total,
      averagePercentage: totalPercentage / total,
      passRate: (passed / total) * 100,
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="text-center p-8">
        <h2 className="text-xl font-semibold mb-2">Thông tin tổng quan không khả dụng</h2>
        <p className="text-muted-foreground mb-4">
          Không thể tải thông tin tổng quan bài kiểm tra.
        </p>
        <Button onClick={() => router.push('/teacher/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại Dashboard
        </Button>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <>
    <Header />
        <div className="flex h-screen overflow-hidden">
      {/* Left side - Overview (2/3) */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6 p-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{room.title}</h1>
              <p className="text-muted-foreground">
                {room.examQuizId.title} • Thống kê lớp học & Thảo luận
              </p>
            </div>
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
          </div>

          {/* Class Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Total Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
                <p className="text-xs text-muted-foreground">Submitted exams</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Average Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.averagePercentage.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.averageScore.toFixed(1)} points
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Pass Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.passRate.toFixed(0)}%</div>
                <p className="text-xs text-muted-foreground">
                  60% or higher
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Question Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Question Analysis</CardTitle>
              <CardDescription>
                Performance breakdown by question
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {room.examQuizId.questions.map((question: any, index: number) => {
                const questionAnswers = submissions
                  .map(s => s.answers[index])
                  .filter(a => a);
                
                const correctCount = questionAnswers.filter(a => a.isCorrect).length;
                const totalCount = questionAnswers.length;
                const correctRate = totalCount > 0 ? (correctCount / totalCount) * 100 : 0;

                return (
                  <div key={question._id || index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium">Question {index + 1}</p>
                        <p className="text-sm text-muted-foreground mt-1">{question.text}</p>
                      </div>
                      <Badge variant={correctRate >= 60 ? 'default' : 'destructive'}>
                        {correctRate.toFixed(0)}% correct
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm mt-3">
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        {correctCount} correct
                      </div>
                      <div className="flex items-center gap-1 text-red-600">
                        <XCircle className="h-4 w-4" />
                        {totalCount - correctCount} incorrect
                      </div>
                      <div className="text-muted-foreground">
                        {question.points} points
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                      <div 
                        className={`h-2 rounded-full ${correctRate >= 60 ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${correctRate}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right side - Chat Discussion (1/3) */}
      <div className="w-1/3 border-l border-border">
        <ExamChatDiscussion 
          roomCode={roomCode}
          questions={room.examQuizId.questions}
        />
      </div>
    </div>
    </>
  );
}
