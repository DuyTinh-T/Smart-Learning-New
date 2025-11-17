import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSocket } from '@/lib/socket-context';
import { 
  Users, 
  Clock, 
  BookOpen, 
  User, 
  Wifi, 
  WifiOff,
  Loader2,
  Play
} from 'lucide-react';

interface Room {
  _id: string;
  title: string;
  description?: string;
  roomCode: string;
  status: 'waiting' | 'running' | 'ended';
  duration: number;
  quizId: {
    _id: string;
    title: string;
    questionCount: number;
    questions: any[];
  };
  teacherId: {
    name: string;
    email: string;
  };
}

interface Participant {
  userId: string;
  name: string;
  role: 'teacher' | 'student';
  joinedAt: Date;
}

interface StudentRoomLobbyProps {
  roomCode: string;
}

export function StudentRoomLobby({ roomCode }: StudentRoomLobbyProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [examStarting, setExamStarting] = useState(false);
  const { socket, isConnected } = useSocket();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchRoomData();
  }, [roomCode]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for room updates
    socket.on('room-update', (data) => {
      if (data.participants) {
        setParticipants(data.participants);
        setTotalStudents(data.totalStudents || 0);
      }
      if (data.room) {
        setRoom(prev => prev ? { ...prev, ...data.room } : data.room);
      }
    });

    // Listen for exam start
    socket.on('exam-started', (data) => {
      toast({
        title: 'Exam Started!',
        description: data.message,
      });
      setExamStarting(true);
      
      // Navigate to exam interface after a short delay
      setTimeout(() => {
        router.push(`/student/exam/${roomCode}`);
      }, 2000);
    });

    // Listen for exam end
    socket.on('exam-ended', (data) => {
      toast({
        title: 'Exam Ended',
        description: data.message,
      });
      router.push(`/student/results/${roomCode}`);
    });

    // Listen for errors
    socket.on('error', (data) => {
      toast({
        title: 'Error',
        description: data.message,
        variant: 'destructive',
      });
    });

    return () => {
      socket.off('room-update');
      socket.off('exam-started');
      socket.off('exam-ended');
      socket.off('error');
    };
  }, [socket, isConnected, roomCode, router, toast]);

  const fetchRoomData = async () => {
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

      setRoom(data.room);

      // If exam is already running, redirect to exam page
      if (data.room.status === 'running') {
        router.push(`/student/exam/${roomCode}`);
        return;
      }

      // If exam has ended, redirect to results
      if (data.room.status === 'ended') {
        router.push(`/student/results/${roomCode}`);
        return;
      }

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load room data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
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
        <p className="text-muted-foreground">
          The room you're looking for doesn't exist or has been deleted.
        </p>
      </div>
    );
  }

  if (examStarting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <Play className="h-6 w-6 text-green-500" />
              Exam Starting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-green-500" />
              <p>Redirecting to exam...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const students = participants.filter(p => p.role === 'student');
  const teacher = participants.find(p => p.role === 'teacher');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {room.title}
                <Badge variant={room.status === 'waiting' ? 'secondary' : 'default'}>
                  {room.status}
                </Badge>
              </CardTitle>
              <CardDescription>
                Room Code: {room.roomCode} • Teacher: {room.teacherId.name}
              </CardDescription>
            </div>
            <div className="flex items-center gap-1">
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <span className="text-xs text-muted-foreground">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {room.description && (
            <p className="text-muted-foreground mb-4">{room.description}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-500" />
              <div className="text-sm">
                <p className="font-medium">{room.quizId.title}</p>
                <p className="text-muted-foreground">
                  {room.quizId.questionCount} questions
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-500" />
              <div className="text-sm">
                <p className="font-medium">{room.duration} minutes</p>
                <p className="text-muted-foreground">Time limit</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" />
              <div className="text-sm">
                <p className="font-medium">{totalStudents} students</p>
                <p className="text-muted-foreground">Joined</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Waiting Message */}
      <Card>
        <CardContent className="text-center py-8">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <Users className="h-8 w-8 text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-medium">Waiting for exam to start</h3>
              <p className="text-muted-foreground">
                Your teacher will start the exam when all students have joined
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Participants */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Teacher */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Teacher</CardTitle>
          </CardHeader>
          <CardContent>
            {teacher ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">{teacher.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Joined {new Date(teacher.joinedAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Teacher not connected</p>
            )}
          </CardContent>
        </Card>

        {/* Students */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Students ({students.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {students.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No other students have joined yet
                </p>
              ) : (
                students.map((student, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{student.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Joined {new Date(student.joinedAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Stay on this page until the exam starts</li>
            <li>• Make sure you have a stable internet connection</li>
            <li>• The exam will start automatically when your teacher begins it</li>
            <li>• You'll have {room.duration} minutes to complete {room.quizId.questionCount} questions</li>
            <li>• Your answers will be saved automatically</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}