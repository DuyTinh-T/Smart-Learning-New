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

interface Quiz {
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
  quizId: Quiz;
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
  
  const { socket, isConnected } = useSocket();
  const { submitExam } = useRoomSocket();
  const { toast } = useToast();
  const router = useRouter();

  const fetchRoomData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
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
      const initialAnswers = data.room.quizId.questions.map((question: Question, index: number) => ({
        questionId: question._id,
        answer: question.type === 'multiple-choice' ? null : '',
        timeTaken: 0,
        startTime: null,
      }));
      
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
  }, [roomCode, router, toast]);

  useEffect(() => {
    fetchRoomData();
  }, [fetchRoomData]);

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
      if (!isSubmitted) {
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
    if (submitting || isSubmitted) return;

    setSubmitting(true);

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const finalAnswers = answers.map(answer => ({
        questionId: answer.questionId,
        answer: answer.answer,
        timeTaken: answer.timeTaken,
      }));

      // Submit via API
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/rooms/${roomCode}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          answers: finalAnswers,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit exam');
      }

      // Also submit via socket for real-time updates
      submitExam({
        roomCode,
        studentId: user._id,
        answers: finalAnswers,
      });

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

  const currentQuestion = room.quizId.questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestionIndex];

  return (
    <div className="max-w-4xl mx-auto space-y-4">
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
                Question {currentQuestionIndex + 1} of {room.quizId.questions.length}
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
              {currentQuestion.options?.map((option, index) => (
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
          {room.quizId.questions.map((_, index) => {
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

        {currentQuestionIndex === room.quizId.questions.length - 1 ? (
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
            onClick={() => setCurrentQuestionIndex(prev => Math.min(room.quizId.questions.length - 1, prev + 1))}
            disabled={currentQuestionIndex === room.quizId.questions.length - 1}
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