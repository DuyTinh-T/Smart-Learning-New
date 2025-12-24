import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useSocket, useRoomSocket } from '@/lib/socket-context';
import { useAuth } from '@/lib/auth-context';
import { LogIn, Loader2, Users, Clock, BookOpen } from 'lucide-react';

interface Room {
  _id: string;
  title: string;
  description?: string;
  roomCode: string;
  status: 'waiting' | 'running' | 'ended';
  duration: number;
  examQuizId?: {
    title: string;
    questions: any[];
  };
  teacherId: {
    name: string;
  };
}

export function StudentJoinRoom() {
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const { socket, isConnected } = useSocket();
  const { joinRoom } = useRoomSocket();
  const { user: authUser, token } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on('joined-room', (data) => {
      toast({
        title: 'Joined Room',
        description: data.message,
      });
      setIsJoined(true);
      setLoading(false);
      
      // Navigate to room lobby
      router.push(`/student/room/${roomCode}`);
    });

    socket.on('error', (data) => {
      toast({
        title: 'Error',
        description: data.message,
        variant: 'destructive',
      });
      setLoading(false);
    });

    return () => {
      socket.off('joined-room');
      socket.off('error');
    };
  }, [socket, isConnected, roomCode, router, toast]);

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roomCode.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a room code',
        variant: 'destructive',
      });
      return;
    }

    if (!authUser || !token) {
      toast({
        title: 'Authentication Error',
        description: 'Please login to join a room',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    console.log('🎓 Student joining room:', { roomCode: roomCode.toUpperCase(), student: authUser.name });

    try {
      // First, get room info via API
      console.log('📡 Fetching room info...');
      const response = await fetch(`/api/rooms/${roomCode.toUpperCase()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Room fetch failed:', data);
        throw new Error(data.error || 'Room not found');
      }

      console.log('✅ Room found:', data.room);
      setRoom(data.room);

      // Then join the room via API to create submission
      console.log('📝 Creating submission...');
      const joinResponse = await fetch(`/api/rooms/${roomCode.toUpperCase()}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const joinData = await joinResponse.json();

      if (!joinResponse.ok) {
        console.error('❌ Join failed:', joinData);
        
        if (joinData.banned) {
          toast({
            title: '⛔ Bị Cấm Truy Cập',
            description: 'Bạn đã bị cấm từ phòng này bởi giáo viên. Vui lòng liên hệ với giáo viên để được giải quyết.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
        
        if (joinData.roomFull) {
          toast({
            title: 'Room Full',
            description: joinData.error || 'This exam room has reached maximum capacity',
            variant: 'default',
          });
          setLoading(false);
          return;
        }
        
        // For other errors, throw as usual
        throw new Error(joinData.error || 'Failed to join room');
      }

      console.log('✅ Submission created:', joinData);

      // Finally, connect via socket for real-time updates
      console.log('🔌 Connecting to socket...');
      joinRoom({
        roomCode: roomCode.toUpperCase(),
        userId: authUser._id,
        userName: authUser.name,
        role: 'student',
      });

    } catch (error: any) {
      console.error('❌ Join room error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to join room',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <LogIn className="h-5 w-5" />
            Join Exam Room
          </CardTitle>
          <CardDescription>
            Enter the room code provided by your teacher
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleJoinRoom} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="roomCode">Room Code</Label>
              <Input
                id="roomCode"
                type="text"
                placeholder="Enter 6-character code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="text-center text-lg font-mono tracking-widest"
                disabled={loading}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !isConnected || !authUser}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                'Join Room'
              )}
            </Button>

            {!authUser && (
              <p className="text-sm text-destructive text-center">
                Please login to join a room
              </p>
            )}

            {!isConnected && authUser && (
              <p className="text-sm text-muted-foreground text-center">
                Connecting to server...
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {room && (
        <Card>
          <CardHeader>
            <CardTitle>{room.title}</CardTitle>
            <CardDescription>
              {room.teacherId.name}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {room.description && (
              <p className="text-sm text-muted-foreground">
                {room.description}
              </p>
            )}

            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-500" />
                <span className="text-sm">
                  {room.examQuizId?.title || 'Exam'} ({room.examQuizId?.questions?.length || 0} questions)
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-green-500" />
                <span className="text-sm">
                  {room.duration} minutes
                </span>
              </div>
            </div>

            {room.status === 'ended' && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-800">
                  This exam has ended. You cannot join at this time.
                </p>
              </div>
            )}

            {room.status === 'running' && (
              <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
                <p className="text-sm text-orange-800">
                  This exam is currently running. You may still be able to join if time permits.
                </p>
              </div>
            )}

            {room.status === 'waiting' && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800">
                  Waiting for teacher to start the exam.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}