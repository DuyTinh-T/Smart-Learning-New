import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useSocket, useRoomSocket } from '@/lib/socket-context';
import { useAuth } from '@/lib/auth-context';
import { 
  Clock, 
  Send, 
  CheckCircle, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  FileText
} from 'lucide-react';

interface Question {
  _id: string;
  text: string;
  type: 'multiple-choice' | 'essay';
  points: number;
  options?: string[];
  correctIndex?: number;
  maxWords?: number;
  explanation?: string;
}

interface ExamQuiz {
  _id: string;
  title: string;
  questions: Question[];
}

interface Room {
  _id: string;
  title: string;
  roomCode: string;
  status: 'waiting' | 'running' | 'ended';
  duration: number;
  examQuizId?: ExamQuiz;
  startTime?: string;
  endTime?: string;
}

interface StudentExamInterfaceProps {
  roomCode: string;
}

export function StudentExamInterface({ roomCode }: StudentExamInterfaceProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [startTime] = useState(Date.now());
  const [violations, setViolations] = useState<{type: string, count: number}[]>([]);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  
  const { socket, isConnected } = useSocket();
  const { submitExam } = useRoomSocket();
  const { user: authUser, token } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const fetchRoomData = useCallback(async () => {
    try {
      if (!token) {
        throw new Error('Please login to continue');
      }

      const response = await fetch(`/api/rooms/${roomCode}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch room data');
      }

      if (data.room.status !== 'running') {
        if (data.room.status === 'waiting') {
          router.push(`/student/room/${roomCode}`);
        } else if (data.room.status === 'ended') {
          router.push(`/student/results/${roomCode}`);
        }
        return;
      }

      setRoom(data.room);

      // Initialize answers array
      const initialAnswers = data.room.examQuizId?.questions.map((question: Question, index: number) => ({
        questionId: question._id,
        answer: question.type === 'multiple-choice' ? null : '',
        timeTaken: 0,
        startTime: null,
      })) || [];
      
      setAnswers(initialAnswers);

      // Calculate time remaining
      if (data.room.startTime) {
        const startTime = new Date(data.room.startTime).getTime();
        const duration = data.room.duration * 60 * 1000; // Convert to ms
        const endTime = startTime + duration;
        const remaining = Math.max(0, endTime - Date.now());
        setTimeRemaining(Math.floor(remaining / 1000));
      }

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load exam data',
        variant: 'destructive',
      });
      router.push('/student/dashboard');
    } finally {
      setLoading(false);
    }
  }, [roomCode, router, toast, token]);

  useEffect(() => {
    fetchRoomData();
  }, [fetchRoomData]);

  // Track violations
  const recordViolation = useCallback((type: string, message: string) => {
    setViolations(prev => {
      const existing = prev.find(v => v.type === type);
      if (existing) {
        return prev.map(v => v.type === type ? {...v, count: v.count + 1} : v);
      }
      return [...prev, {type, count: 1}];
    });

    // Show warning to student
    setWarningMessage(message);
    setShowWarning(true);
    setTimeout(() => setShowWarning(false), 5000);

    // Send violation to server
    if (socket && authUser) {
      socket.emit('exam-violation', {
        roomCode,
        studentId: authUser._id,
        studentName: authUser.name,
        type,
        timestamp: new Date().toISOString(),
      });
    }

    // Log to console
    console.warn('⚠️ Exam Violation:', type, message);
  }, [socket, authUser, roomCode]);

  // Monitor tab/window visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !isSubmitted) {
        recordViolation('tab-switch', 'Phát hiện chuyển tab! Vui lòng không rời khỏi trang thi.');
      }
    };

    const handleBlur = () => {
      if (!isSubmitted) {
        recordViolation('window-blur', 'Phát hiện chuyển cửa sổ! Vui lòng tập trung vào bài thi.');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isSubmitted, recordViolation]);

  // Disable copy, paste, and dangerous shortcuts
  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      recordViolation('copy-attempt', 'Copy đã bị vô hiệu hóa trong bài thi.');
      return false;
    };

    const handlePaste = (e: ClipboardEvent) => {
      // Allow paste in textarea for essay questions
      const target = e.target as HTMLElement;
      if (target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        recordViolation('paste-attempt', 'Paste chỉ được phép trong câu hỏi tự luận.');
        return false;
      }
    };

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      recordViolation('cut-attempt', 'Cut đã bị vô hiệu hóa trong bài thi.');
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U (DevTools)
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && e.key === 'U')
      ) {
        e.preventDefault();
        recordViolation('devtools-attempt', 'Công cụ phát triển đã bị vô hiệu hóa.');
        return false;
      }

      // Prevent Ctrl+C (copy) but allow in textarea
      if (e.ctrlKey && e.key === 'c') {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'TEXTAREA' && target.tagName !== 'INPUT') {
          e.preventDefault();
          recordViolation('copy-attempt', 'Copy đã bị vô hiệu hóa.');
          return false;
        }
      }

      // Prevent Ctrl+V (paste) outside textarea
      if (e.ctrlKey && e.key === 'v') {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          recordViolation('paste-attempt', 'Paste chỉ được phép trong câu hỏi tự luận.');
          return false;
        }
      }

      // Prevent Alt+Tab (can't actually prevent but can detect)
      if (e.altKey && e.key === 'Tab') {
        recordViolation('alt-tab', 'Phát hiện Alt+Tab.');
      }
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('cut', handleCut);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [recordViolation]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining <= 0 || isSubmitted) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, isSubmitted]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on('exam-ended', (data) => {
      toast({
        title: 'Exam Ended',
        description: data.message,
      });
      if (!isSubmitted && !submitting) {
        handleAutoSubmit();
      }
    });

    socket.on('exam-submitted', (data) => {
      toast({
        title: 'Exam Submitted',
        description: data.message,
      });
      setIsSubmitted(true);
      router.push(`/student/results/${roomCode}`);
    });

    socket.on('error', (data) => {
      toast({
        title: 'Error',
        description: data.message,
        variant: 'destructive',
      });
      setSubmitting(false);
    });

    return () => {
      socket.off('exam-ended');
      socket.off('exam-submitted');
      socket.off('error');
    };
  }, [socket, isConnected, roomCode, router, toast, isSubmitted]);

  // Track time spent on current question
  useEffect(() => {
    const now = Date.now();
    setAnswers(prev => prev.map((answer, index) => 
      index === currentQuestionIndex
        ? { ...answer, startTime: answer.startTime || now }
        : answer
    ));
  }, [currentQuestionIndex]);

  const handleAnswerChange = (value: any) => {
    const now = Date.now();
    setAnswers(prev => prev.map((answer, index) => {
      if (index === currentQuestionIndex) {
        const timeTaken = answer.startTime 
          ? Math.floor((now - answer.startTime) / 1000)
          : 0;
        
        return {
          ...answer,
          answer: value,
          timeTaken: Math.max(timeTaken, answer.timeTaken),
        };
      }
      return answer;
    }));
  };

  const handleAutoSubmit = useCallback(() => {
    if (isSubmitted || submitting) return;
    
    toast({
      title: 'Time Up!',
      description: 'Your exam is being submitted automatically',
    });
    
    handleSubmit(true);
  }, [isSubmitted, submitting]);

  const handleSubmit = async (isAutoSubmit = false) => {
    if (submitting || isSubmitted) {
      console.log('⚠️ Submit blocked:', { submitting, isSubmitted });
      return;
    }

    if (!authUser || !token) {
      toast({
        title: 'Authentication Error',
        description: 'Please login to submit',
        variant: 'destructive',
      });
      return;
    }

    console.log('🚀 Starting submit:', { isAutoSubmit, submitting, isSubmitted });
    setSubmitting(true);

    try {
      const finalAnswers = answers.map(answer => ({
        questionId: answer.questionId,
        answer: answer.answer,
        timeTaken: answer.timeTaken,
      }));

      console.log('📤 Submitting exam:', { 
        roomCode, 
        studentId: authUser._id, 
        answersCount: finalAnswers.length,
        violationsCount: violations.length,
        violations: violations
      });

      // Submit via API with violations data
      const response = await fetch(`/api/rooms/${roomCode}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          answers: finalAnswers,
          violations: violations,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('❌ Submit failed:', data);
        throw new Error(data.error || 'Failed to submit exam');
      }

      const result = await response.json();
      console.log('✅ Exam submitted successfully:', result);

      // Mark as submitted to prevent double submission
      setIsSubmitted(true);

      // Also submit via socket for real-time updates
      submitExam({
        roomCode,
        studentId: authUser._id,
        answers: finalAnswers,
      });

      // Show success and redirect
      toast({
        title: 'Exam Submitted',
        description: 'Your answers have been submitted successfully',
      });

      setTimeout(() => {
        router.push(`/student/results/${roomCode}`);
      }, 2000);

    } catch (error: any) {
      toast({
        title: 'Submission Error',
        description: error.message || 'Failed to submit exam',
        variant: 'destructive',
      });
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    const answeredCount = answers.filter(answer => 
      answer.answer !== null && answer.answer !== ''
    ).length;
    return (answeredCount / answers.length) * 100;
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
        <h2 className="text-xl font-semibold mb-2">Exam not found</h2>
        <p className="text-muted-foreground">
          The exam you're looking for is not available.
        </p>
      </div>
    );
  }

  if (!room.examQuizId || !room.examQuizId.questions || room.examQuizId.questions.length === 0) {
    return (
      <div className="text-center p-8">
        <h2 className="text-xl font-semibold mb-2">Exam not available</h2>
        <p className="text-muted-foreground">
          The exam questions are not available.
        </p>
      </div>
    );
  }

  const currentQuestion = room.examQuizId.questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestionIndex];

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Warning Banner */}
      {showWarning && (
        <Card className="border-red-500 bg-red-50 dark:bg-red-950/20 animate-pulse">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-semibold">{warningMessage}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Violations Summary (for student awareness) */}
      {violations.length > 0 && (
        <Card className="border-orange-300 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-orange-800 dark:text-orange-400 mb-1">
                  Cảnh báo vi phạm
                </p>
                <p className="text-xs text-orange-700 dark:text-orange-500">
                  {violations.reduce((sum, v) => sum + v.count, 0)} vi phạm đã được ghi nhận. 
                  Giáo viên có thể xem chi tiết các vi phạm này.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header with timer and progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {room.title}
              </CardTitle>
              <CardDescription>
                Question {currentQuestionIndex + 1} of {room.examQuizId.questions.length}
              </CardDescription>
            </div>
            
            <div className="text-right">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4" />
                <span className={`font-mono text-lg ${timeRemaining < 300 ? 'text-red-500' : ''}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {Math.round(getProgress())}% completed
              </div>
            </div>
          </div>
          
          <Progress value={getProgress()} className="mt-2" />
        </CardHeader>
      </Card>

      {/* Question */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Badge variant="outline" className="mb-2">
                {currentQuestion.type === 'multiple-choice' ? 'Multiple Choice' : 'Essay'}
              </Badge>
              <CardTitle className="text-lg leading-relaxed">
                {currentQuestion.text}
              </CardTitle>
            </div>
            <Badge variant="secondary">
              {currentQuestion.points} point{currentQuestion.points !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {currentQuestion.type === 'multiple-choice' ? (
            <RadioGroup
              value={currentAnswer?.answer?.toString() || ''}
              onValueChange={(value) => handleAnswerChange(parseInt(value))}
            >
              {currentQuestion.options?.map((option: string, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          ) : (
            <div className="space-y-2">
              <Textarea
                placeholder="Type your answer here..."
                value={currentAnswer?.answer || ''}
                onChange={(e) => handleAnswerChange(e.target.value)}
                rows={6}
                maxLength={currentQuestion.maxWords ? currentQuestion.maxWords * 6 : undefined}
              />
              {currentQuestion.maxWords && (
                <div className="text-xs text-muted-foreground text-right">
                  {currentAnswer?.answer?.split(' ').filter(Boolean).length || 0} / {currentQuestion.maxWords} words
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
          disabled={currentQuestionIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>

        <div className="flex gap-2">
          {room.examQuizId.questions.map((_: any, index: number) => {
            const answer = answers[index];
            const isAnswered = answer?.answer !== null && answer?.answer !== '';
            const isCurrent = index === currentQuestionIndex;

            return (
              <Button
                key={index}
                variant={isCurrent ? "default" : isAnswered ? "outline" : "ghost"}
                size="sm"
                className="w-8 h-8 p-0"
                onClick={() => setCurrentQuestionIndex(index)}
              >
                {isAnswered ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : (
                  <span className="text-xs">{index + 1}</span>
                )}
              </Button>
            );
          })}
        </div>

        {currentQuestionIndex === room.examQuizId.questions.length - 1 ? (
          <Button
            onClick={() => handleSubmit()}
            disabled={submitting || isSubmitted}
            className="bg-green-600 hover:bg-green-700"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-1" />
            )}
            Submit Exam
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentQuestionIndex(prev => Math.min((room.examQuizId?.questions.length || 1) - 1, prev + 1))}
            disabled={currentQuestionIndex === (room.examQuizId?.questions.length || 1) - 1}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>

      {/* Warning for time */}
      {timeRemaining < 300 && timeRemaining > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                Warning: Only {formatTime(timeRemaining)} remaining!
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}