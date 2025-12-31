'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Award,
  Loader2,
  ArrowLeft,
  Users,
  TrendingUp,
  BarChart3,
  Download,
  AlertTriangle,
  Eye
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
  violations?: {type: string, count: number}[];
}

interface Room {
  _id: string;
  title: string;
  description?: string;
  roomCode: string;
  status: 'waiting' | 'running' | 'ended';
  duration: number;
  publishAnalysis?: boolean;
  examQuizId?: {
    _id: string;
    title: string;
    questions: any[];
  };
  teacherId: {
    name: string;
  };
  startTime?: string;
  endTime?: string;
}

interface RoomStatisticsProps {
  roomCode: string;
}

export function RoomStatistics({ roomCode }: RoomStatisticsProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [selectedViolations, setSelectedViolations] = useState<{student: string, violations: {type: string, count: number}[]} | null>(null);
  const { user: authUser, token } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchStatistics();
  }, [roomCode]);

  const fetchStatistics = async () => {
    try {
      if (!token) {
        throw new Error('Please login to view statistics');
      }

      console.log('📊 Fetching statistics for room:', roomCode);

      // Fetch room data
      const roomResponse = await fetch(`/api/rooms/${roomCode}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!roomResponse.ok) {
        throw new Error('Failed to fetch room data');
      }

      const roomData = await roomResponse.json();
      console.log('✅ Room data:', roomData);
      setRoom(roomData.room);

      // Fetch submissions
      const submissionsResponse = await fetch(`/api/rooms/${roomCode}/submissions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('📡 Submissions response status:', submissionsResponse.status);

      if (!submissionsResponse.ok) {
        const errorData = await submissionsResponse.json();
        console.error('❌ Submissions error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch submissions');
      }

      const submissionsData = await submissionsResponse.json();
      console.log('✅ Submissions data:', submissionsData);
      setSubmissions(submissionsData.submissions || []);

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load statistics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePublishToggle = async () => {
    try {
      setPublishing(true);
      
      const response = await fetch(`/api/rooms/${roomCode}/publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publish: !room?.publishAnalysis
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update publish status');
      }

      const data = await response.json();
      
      setRoom(prev => prev ? { ...prev, publishAnalysis: data.room.publishAnalysis } : null);
      
      toast({
        title: data.room.publishAnalysis ? 'Đã công bố kết quả' : 'Đã ẩn kết quả',
        description: data.room.publishAnalysis 
          ? 'Học sinh có thể xem phân tích câu hỏi' 
          : 'Học sinh không thể xem phân tích câu hỏi',
      });
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể cập nhật trạng thái công bố',
        variant: 'destructive',
      });
    } finally {
      setPublishing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const calculateStats = () => {
    if (submissions.length === 0) {
      return {
        totalSubmissions: 0,
        averageScore: 0,
        averagePercentage: 0,
        highestScore: 0,
        lowestScore: 0,
        averageTime: 0,
        passRate: 0,
      };
    }

    const completedSubmissions = submissions.filter(s => s.status === 'submitted');
    const total = completedSubmissions.length;
    
    if (total === 0) {
      return {
        totalSubmissions: submissions.length,
        averageScore: 0,
        averagePercentage: 0,
        highestScore: 0,
        lowestScore: 0,
        averageTime: 0,
        passRate: 0,
      };
    }

    const totalScore = completedSubmissions.reduce((sum, s) => sum + s.score, 0);
    const totalPercentage = completedSubmissions.reduce((sum, s) => sum + s.percentage, 0);
    const totalTime = completedSubmissions.reduce((sum, s) => sum + s.timeSpent, 0);
    const passed = completedSubmissions.filter(s => s.percentage >= 60).length;

    return {
      totalSubmissions: total,
      averageScore: totalScore / total,
      averagePercentage: totalPercentage / total,
      highestScore: Math.max(...completedSubmissions.map(s => s.score)),
      lowestScore: Math.min(...completedSubmissions.map(s => s.score)),
      averageTime: totalTime / total,
      passRate: (passed / total) * 100,
    };
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

  if (!room) {
    return (
      <div className="text-center p-8">
        <h2 className="text-xl font-semibold mb-2">Room not found</h2>
        <p className="text-muted-foreground mb-4">
          The room you're looking for doesn't exist.
        </p>
        <Button onClick={() => router.push('/teacher/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{room.title}</h1>
          <p className="text-muted-foreground">
            Room Code: {room.roomCode} • {room.examQuizId?.title || 'Exam'} • Status: {room.status}
          </p>
        </div>
        <div className="flex gap-2">
          {room.status === 'ended' && stats.totalSubmissions > 0 && (
            <Button 
              variant={room.publishAnalysis ? "destructive" : "default"}
              onClick={handlePublishToggle}
              disabled={publishing}
            >
              {publishing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : room.publishAnalysis ? (
                <XCircle className="h-4 w-4 mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              {room.publishAnalysis ? 'Ẩn kết quả' : 'Công bố kết quả'}
            </Button>
          )}
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
            <p className="text-xs text-muted-foreground">
              {submissions.length - stats.totalSubmissions} in progress
            </p>
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
              {stats.averageScore.toFixed(1)}/{room.examQuizId?.questions.reduce((sum, q) => sum + (q.points || 0), 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.averagePercentage.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
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

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Avg. Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(Math.floor(stats.averageTime))}</div>
            <p className="text-xs text-muted-foreground">
              of {room.duration} min
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Student Results Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Student Results
          </CardTitle>
          <CardDescription>
            Detailed breakdown of each student's performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No submissions yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Student</th>
                    <th className="text-left py-3 px-4 font-medium">Score</th>
                    <th className="text-left py-3 px-4 font-medium">Percentage</th>
                    <th className="text-left py-3 px-4 font-medium">Grade</th>
                    <th className="text-left py-3 px-4 font-medium">Time Spent</th>
                    <th className="text-left py-3 px-4 font-medium">Violations</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission) => (
                    <tr key={submission._id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{submission.studentId.name}</p>
                          <p className="text-xs text-muted-foreground">{submission.studentId.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {submission.score}/{submission.totalPoints}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-semibold ${getGradeColor(submission.percentage)}`}>
                          {submission.percentage}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getGradeColor(submission.percentage)}>
                          {getGrade(submission.percentage)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {formatTime(submission.timeSpent)}
                      </td>
                      <td className="py-3 px-4">
                        {submission.violations && submission.violations.length > 0 ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedViolations({
                              student: submission.studentId.name,
                              violations: submission.violations || []
                            })}
                            className="flex items-center gap-1"
                          >
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                            {submission.violations.reduce((sum, v) => sum + v.count, 0)}
                            <Eye className="h-3 w-3 ml-1" />
                          </Button>
                        ) : (
                          <Badge variant="outline" className="text-green-600">
                            Không vi phạm
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {submission.status === 'submitted' ? (
                          <Badge variant="default">Submitted</Badge>
                        ) : (
                          <Badge variant="secondary">In Progress</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {submission.submittedAt 
                          ? new Date(submission.submittedAt).toLocaleString()
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Question Analysis */}
      {stats.totalSubmissions > 0 && room.examQuizId && (
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
                .filter(s => s.status === 'submitted')
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
      )}

      {/* Violations Modal */}
      <AlertDialog open={!!selectedViolations} onOpenChange={() => setSelectedViolations(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Chi tiết vi phạm - {selectedViolations?.student}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tổng cộng {selectedViolations?.violations.reduce((sum, v) => sum + v.count, 0) || 0} vi phạm
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-3 mt-4">
            {selectedViolations?.violations.map((violation, index) => {
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
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-800 dark:text-orange-400">
                      {violationLabels[violation.type] || violation.type}
                    </span>
                  </div>
                  <Badge variant="destructive">
                    {violation.count} lần
                  </Badge>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={() => setSelectedViolations(null)}>
              Đóng
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
