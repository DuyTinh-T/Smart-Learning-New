import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSocket, useRoomSocket } from '@/lib/socket-context';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { RoomMonitorDialog } from './room-monitor-dialog';
import { 
  Play, 
  Users, 
  Clock, 
  Settings, 
  BarChart3, 
  Copy, 
  Eye, 
  Trash2,
  Share2,
  Loader2
} from 'lucide-react';

interface Room {
  _id: string;
  title: string;
  description?: string;
  roomCode: string;
  status: 'waiting' | 'running' | 'ended';
  duration: number;
  maxStudents?: number;
  examQuizId: {
    title: string;
    questions: any[];
  };
  teacherId: {
    name: string;
  };
  createdAt: string;
  startTime?: string;
  endTime?: string;
}

interface RoomCardProps {
  room: Room;
  onRoomUpdated: (room: Room) => void;
  onRoomDeleted: (roomId: string) => void;
}

export function RoomCard({ room, onRoomUpdated, onRoomDeleted }: RoomCardProps) {
  const [participants, setParticipants] = useState<any[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [isJoining, setIsJoining] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [showMonitor, setShowMonitor] = useState(false);
  const { socket, isConnected } = useSocket();
  const { joinRoom, startExam, getStatistics } = useRoomSocket();
  const { user: authUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!socket) {
      console.warn('⚠️ Socket not available in room-card');
      return;
    }

    console.log('🎧 Setting up socket listeners for room:', room.roomCode);

    // Listen for room updates
    const handleRoomUpdate = (data: any) => {
      console.log('📡 Room update received:', data);
      // Only update if this event is for THIS specific room
      if (data.room && data.room.roomCode === room.roomCode) {
        if (data.participants) {
          setParticipants(data.participants);
          setTotalStudents(data.totalStudents || 0);
        }
      }
    };

    const handleExamStarted = (data: any) => {
      console.log('🏁 Exam started:', data);
      // Only handle if this event is for THIS specific room
      if (data.roomCode === room.roomCode) {
        toast({
          title: 'Exam Started',
          description: data.message,
        });
        onRoomUpdated({ ...room, status: 'running', startTime: data.startTime, endTime: data.endTime });
        setIsStarting(false);
      }
    };

    const handleExamEnded = (data: any) => {
      console.log('⏱️ Exam ended:', data);
      // Only handle if this event is for THIS specific room
      if (data.roomCode === room.roomCode) {
        toast({
          title: 'Exam Ended',
          description: data.message,
        });
        onRoomUpdated({ ...room, status: 'ended' });
      }
    };

    const handleStudentSubmitted = (data: any) => {
      console.log('📝 Student submitted:', data);
      // Only show toast if this event is for THIS specific room
      if (data.roomCode === room.roomCode) {
        toast({
          title: 'Student Submitted',
          description: `A student has submitted their exam`,
        });
      }
    };

    const handleJoinedRoom = (data: any) => {
      console.log('✅ Successfully joined room:', data);
      // Only handle if this event is for THIS specific room
      if (data.room && data.room.roomCode === room.roomCode) {
        toast({
          title: 'Joined Room',
          description: data.message,
        });
        setIsJoining(false);
      }
    };

    const handleError = (data: any) => {
      console.error('❌ Socket error:', data);
      toast({
        title: 'Error',
        description: data.message,
        variant: 'destructive',
      });
      setIsJoining(false);
      setIsStarting(false);
    };

    socket.on('room-update', handleRoomUpdate);
    socket.on('exam-started', handleExamStarted);
    socket.on('exam-ended', handleExamEnded);
    socket.on('student-submitted', handleStudentSubmitted);
    socket.on('joined-room', handleJoinedRoom);
    socket.on('error', handleError);

    return () => {
      console.log('🧹 Cleaning up socket listeners for room:', room.roomCode);
      socket.off('room-update', handleRoomUpdate);
      socket.off('exam-started', handleExamStarted);
      socket.off('exam-ended', handleExamEnded);
      socket.off('student-submitted', handleStudentSubmitted);
      socket.off('joined-room', handleJoinedRoom);
      socket.off('error', handleError);
    };
  }, [socket, room, onRoomUpdated, toast]);

  const handleJoinAsTeacher = async () => {
    if (!socket || !authUser) {
      console.warn('Cannot join: socket =', socket, 'authUser =', authUser);
      if (!authUser) {
        toast({ 
          title: 'Authentication Error', 
          description: 'Please login again.', 
          variant: 'destructive' 
        });
      } else if (!socket) {
        toast({ 
          title: 'Socket not available', 
          description: 'Please refresh the page to initialize socket connection.', 
          variant: 'destructive' 
        });
      }
      return;
    }

    // Open monitor dialog
    setShowMonitor(true);
  };

  const handleStartExam = async () => {
    if (!socket || isStarting) {
      console.warn('Cannot start exam: socket =', socket, 'isStarting =', isStarting);
      if (!socket) {
        toast({ 
          title: 'Socket not available', 
          description: 'Please refresh the page to initialize socket connection.', 
          variant: 'destructive' 
        });
      }
      return;
    }

    setIsStarting(true);
    console.log('🏁 Starting exam, socket status:', { connected: socket.connected, id: socket.id });

    try {
      // If socket exists but isn't connected, attempt to (re)connect first
      if (!socket.connected) {
        console.log('🔄 Socket not connected, attempting to connect...');
        socket.connect();
        
        // Wait for connection
        const socketRef = socket; // Keep reference to avoid null checks
        await new Promise<void>((resolve, reject) => {
          const t = setTimeout(() => {
            socketRef.off('connect', onConnect);
            reject(new Error('Socket connect timeout'));
          }, 5000); // Increased timeout to 5s
          
          function onConnect() {
            console.log('✅ Socket connected successfully');
            clearTimeout(t);
            socketRef.off('connect', onConnect);
            resolve();
          }
          
          socketRef.on('connect', onConnect);
        });
      }

      if (!authUser) {
        console.error('❌ No authenticated user found');
        toast({ 
          title: 'Authentication Error', 
          description: 'Please login again.', 
          variant: 'destructive' 
        });
        setIsStarting(false);
        return;
      }

      console.log('🚀 Starting exam in room:', { roomCode: room.roomCode, teacherId: authUser._id });

      startExam({
        roomCode: room.roomCode,
        teacherId: authUser._id,
      });

      toast({
        title: 'Starting exam...',
        description: 'Initializing exam for all students',
      });

      // Reset loading after short delay (UI will update from socket events)
      setTimeout(() => setIsStarting(false), 3000);
    } catch (err: any) {
      console.error('❌ Failed to start exam:', err);
      toast({ 
        title: 'Error Starting Exam', 
        description: err.message || 'Unable to connect to server. Please try again.', 
        variant: 'destructive' 
      });
      setIsStarting(false);
    }
  };

  const handleCopyRoomCode = () => {
    navigator.clipboard.writeText(room.roomCode);
    toast({
      title: 'Copied!',
      description: 'Room code copied to clipboard',
    });
  };

  const handleViewStatistics = () => {
    // Navigate to statistics page or open modal
    window.open(`/teacher/rooms/${room.roomCode}/statistics`, '_blank');
  };

  const getStatusBadge = () => {
    switch (room.status) {
      case 'waiting':
        return <Badge variant="secondary">Waiting</Badge>;
      case 'running':
        return <Badge variant="default">Running</Badge>;
      case 'ended':
        return <Badge variant="outline">Ended</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getTimeRemaining = () => {
    if (room.status !== 'running' || !room.startTime) return null;
    
    const startTime = new Date(room.startTime).getTime();
    const duration = room.duration * 60 * 1000; // Convert to ms
    const endTime = startTime + duration;
    const now = Date.now();
    
    if (now >= endTime) return '00:00';
    
    const remaining = endTime - now;
    const minutes = Math.floor(remaining / (60 * 1000));
    const seconds = Math.floor((remaining % (60 * 1000)) / 1000);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              {room.title}
              {getStatusBadge()}
              {/* Socket connection indicator */}
              {socket && (
                <span className={`inline-flex h-2 w-2 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-yellow-500'
                }`} title={isConnected ? 'Socket connected' : 'Socket connecting...'} />
              )}
            </CardTitle>
            <CardDescription>
              {room.examQuizId.title} • {room.examQuizId.questions.length} questions • {room.duration} minutes
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyRoomCode}
            className="flex items-center gap-1"
          >
            <Copy className="h-3 w-3" />
            {room.roomCode}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {room.description && (
          <p className="text-sm text-muted-foreground">{room.description}</p>
        )}

        {/* Room Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            <span className="text-sm">
              {totalStudents} Student{totalStudents !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-green-500" />
            <span className="text-sm">
              {room.status === 'running' && getTimeRemaining() 
                ? `${getTimeRemaining()} left`
                : `${room.duration} min`}
            </span>
          </div>
          
          {room.maxStudents && (
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-purple-500" />
              <span className="text-sm">Max: {room.maxStudents}</span>
            </div>
          )}
          
          <div className="text-sm text-muted-foreground">
            Created {new Date(room.createdAt).toLocaleDateString()}
          </div>
        </div>

        {/* Participants List */}
        {participants.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Participants ({participants.length})</h4>
            <div className="flex flex-wrap gap-1">
              {participants.slice(0, 5).map((participant, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {participant.name}
                </Badge>
              ))}
              {participants.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{participants.length - 5} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {room.status === 'waiting' && (
            <>
              <Button
                onClick={handleJoinAsTeacher}
                // allow clicking to attempt reconnect if socket exists; only block when there is no socket instance
                disabled={!socket || !authUser}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Eye className="h-3 w-3" />
                Monitor
              </Button>
              
              <Button
                onClick={handleStartExam}
                // allow clicking to attempt reconnect if socket exists; only block when there is no socket instance
                disabled={isStarting || !socket || !authUser}
                size="sm"
                className="flex items-center gap-1"
              >
                {isStarting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Play className="h-3 w-3" />
                )}
                {isStarting ? 'Starting...' : 'Start Exam'}
              </Button>
            </>
          )}

          {room.status === 'running' && (
            <Button
              onClick={handleJoinAsTeacher}
              disabled={isJoining || !isConnected}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              {isJoining ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Eye className="h-3 w-3" />
              )}
              {isJoining ? 'Joining...' : 'Monitor'}
            </Button>
          )}

          {(room.status === 'ended' || room.status === 'running') && (
            <Button
              onClick={handleViewStatistics}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <BarChart3 className="h-3 w-3" />
              Statistics
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const shareUrl = `${window.location.origin}/student/join/${room.roomCode}`;
              navigator.clipboard.writeText(shareUrl);
              toast({
                title: 'Link Copied!',
                description: 'Share this link with students',
              });
            }}
            className="flex items-center gap-1"
          >
            <Share2 className="h-3 w-3" />
            Share
          </Button>

          {room.status === 'waiting' && (
            <Button
              onClick={() => onRoomDeleted(room._id)}
              variant="outline"
              size="sm"
              className="flex items-center gap-1 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </Button>
          )}
        </div>
      </CardContent>

      {/* Room Monitor Dialog */}
      {authUser && (
        <RoomMonitorDialog
          open={showMonitor}
          onOpenChange={setShowMonitor}
          room={room}
          teacherId={authUser._id}
          teacherName={authUser.name}
          onStartExam={handleStartExam}
        />
      )}
    </Card>
  );
}