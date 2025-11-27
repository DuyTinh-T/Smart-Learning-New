'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSocket } from '@/lib/socket-context';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Clock, 
  Play,
  Loader2,
  UserCircle,
  CheckCircle2
} from 'lucide-react';

interface Participant {
  userId: string;
  name: string;
  role: 'teacher' | 'student';
  joinedAt: Date;
}

interface RoomMonitorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: {
    _id: string;
    roomCode: string;
    title: string;
    status: 'waiting' | 'running' | 'ended';
    duration: number;
    startTime?: string;
    endTime?: string;
    examQuizId: {
      title: string;
      questions: any[];
    };
  };
  teacherId: string;
  teacherName: string;
  onStartExam: () => void;
}

export function RoomMonitorDialog({
  open,
  onOpenChange,
  room,
  teacherId,
  teacherName,
  onStartExam,
}: RoomMonitorDialogProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [hasJoined, setHasJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const { socket, isConnected } = useSocket();
  const { toast } = useToast();

  // Auto-join room when dialog opens
  useEffect(() => {
    if (!open || !socket || !isConnected || hasJoined || isJoining) return;

    const joinRoom = async () => {
      setIsJoining(true);
      console.log('🔌 Joining room for monitoring:', room.roomCode);

      socket.emit('join-room', {
        roomCode: room.roomCode,
        userId: teacherId,
        userName: teacherName,
        role: 'teacher',
      });
    };

    joinRoom();
  }, [open, socket, isConnected, room.roomCode, teacherId, teacherName, hasJoined, isJoining]);

  // Listen to socket events
  useEffect(() => {
    if (!socket) return;

    const handleJoinedRoom = (data: any) => {
      console.log('✅ Joined room for monitoring:', data);
      // Only handle if this event is for THIS specific room
      if (data.room && data.room.roomCode === room.roomCode) {
        setHasJoined(true);
        setIsJoining(false);
        toast({
          title: 'Monitoring Room',
          description: `Connected to ${room.roomCode}`,
        });
      }
    };

    const handleRoomUpdate = (data: any) => {
      console.log('📡 Room participants updated:', data);
      // Only update if this event is for THIS specific room
      if (data.room && data.room.roomCode === room.roomCode) {
        if (data.participants) {
          setParticipants(data.participants);
        }
      }
    };

    const handleExamStarted = (data: any) => {
      console.log('🏁 Exam started in monitor:', data);
      // Only handle if this event is for THIS specific room
      if (data.roomCode === room.roomCode) {
        toast({
          title: 'Exam Started!',
          description: data.message,
        });
      }
    };

    const handleStudentSubmitted = (data: any) => {
      console.log('📝 Student submitted:', data);
      // Only show toast if this event is for THIS specific room
      if (data.roomCode === room.roomCode) {
        toast({
          title: 'Student Submitted',
          description: 'A student has completed the exam',
        });
      }
    };

    const handleError = (data: any) => {
      console.error('❌ Monitor error:', data);
      toast({
        title: 'Error',
        description: data.message,
        variant: 'destructive',
      });
      setIsJoining(false);
    };

    socket.on('joined-room', handleJoinedRoom);
    socket.on('room-update', handleRoomUpdate);
    socket.on('exam-started', handleExamStarted);
    socket.on('student-submitted', handleStudentSubmitted);
    socket.on('error', handleError);

    return () => {
      socket.off('joined-room', handleJoinedRoom);
      socket.off('room-update', handleRoomUpdate);
      socket.off('exam-started', handleExamStarted);
      socket.off('student-submitted', handleStudentSubmitted);
      socket.off('error', handleError);
    };
  }, [socket, room.roomCode, toast]);

  // Leave room when dialog closes
  useEffect(() => {
    return () => {
      if (socket && hasJoined) {
        console.log('👋 Leaving room monitoring');
        socket.disconnect();
        socket.connect(); // Reconnect for other features
      }
    };
  }, [socket, hasJoined]);

  const students = participants.filter(p => p.role === 'student');
  const teachers = participants.filter(p => p.role === 'teacher');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Room Monitor: {room.title}
          </DialogTitle>
          <DialogDescription>
            Room Code: <span className="font-mono font-semibold">{room.roomCode}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Room Status */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={
                  room.status === 'waiting' ? 'secondary' :
                  room.status === 'running' ? 'default' : 'outline'
                }>
                  {room.status === 'waiting' && 'Waiting'}
                  {room.status === 'running' && 'Running'}
                  {room.status === 'ended' && 'Ended'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-semibold">{room.duration} minutes</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Questions</p>
                <p className="font-semibold">{room.examQuizId.questions.length}</p>
              </div>
            </div>

            {room.status === 'waiting' && (
              <Button onClick={onStartExam} size="sm" className="gap-2">
                <Play className="h-4 w-4" />
                Start Exam
              </Button>
            )}
          </div>

          {/* Connection Status */}
          {isJoining && (
            <div className="flex items-center justify-center gap-2 p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Connecting to room...</span>
            </div>
          )}

          {hasJoined && (
            <div className="flex items-center justify-center gap-2 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm text-green-600 dark:text-green-400">Connected to room</span>
            </div>
          )}

          {/* Participants */}
          <div className="space-y-4">
            {/* Students */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Students ({students.length})
                </h3>
              </div>
              
              {students.length === 0 ? (
                <div className="text-center p-8 border-2 border-dashed rounded-lg">
                  <Users className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No students have joined yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Share the room code: <span className="font-mono font-semibold">{room.roomCode}</span>
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {students.map((student, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-3 border rounded-lg"
                    >
                      <UserCircle className="h-5 w-5 text-blue-500" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{student.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Joined {new Date(student.joinedAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Teachers (if any other teachers monitoring) */}
            {teachers.length > 1 && (
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <UserCircle className="h-4 w-4" />
                  Teachers ({teachers.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {teachers.map((teacher, index) => (
                    <Badge key={index} variant="outline" className="gap-1">
                      <UserCircle className="h-3 w-3" />
                      {teacher.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="text-sm text-muted-foreground border-t pt-4">
            <p><strong>Tip:</strong> This monitor updates in real-time as students join.</p>
            {room.status === 'waiting' && (
              <p className="mt-1">Click "Start Exam" when all students are ready.</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
