import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { CreateRoomDialog } from './create-room-dialog';
import { RoomCard } from './room-card';
import { Search, Filter, RefreshCw } from 'lucide-react';

interface Quiz {
  _id: string;
  title: string;
  questionCount: number;
  timeLimit?: number;
}

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

export function TeacherRoomManagement() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const { toast } = useToast();
  const { token: authToken, user: authUser, isLoading: authLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    // Wait until auth has been initialized to avoid sending `Authorization: Bearer null`.
    if (!authLoading) {
      fetchRooms();
    }
  }, [authLoading, authToken]);

  const fetchRooms = async () => {
    try {
      const headers: Record<string,string> = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      const response = await fetch('/api/rooms', { headers });

      if (!response.ok) {
        throw new Error('Failed to fetch rooms');
      }

      const data = await response.json();
      setRooms(data.rooms || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast({
        title: 'Error',
        description: 'Failed to load rooms',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizzes = async () => {
    try {
      const headers: Record<string,string> = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      const response = await fetch('/api/quizzes', { headers });

      const data = await response.json();

      if (response.ok) {
        setQuizzes(data.quizzes || []);
      }
    } catch (error: any) {
      console.error('Failed to fetch quizzes:', error);
    }
  };

  const handleRoomCreated = (newRoom: Room) => {
    setRooms([newRoom, ...rooms]);
    toast({
      title: 'Room Created',
      description: `Room "${newRoom.title}" has been created with code ${newRoom.roomCode}`,
    });
  };

  const handleRoomUpdated = (updatedRoom: Room) => {
    setRooms(rooms.map(room => 
      room._id === updatedRoom._id ? updatedRoom : room
    ));
  };

  const handleRoomDeleted = async (roomId: string) => {
    const room = rooms.find(r => r._id === roomId);
    if (!room) {
      toast({
        title: 'Error',
        description: 'Room not found',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete room "${room.title}" (${room.roomCode})?`)) {
      return;
    }

    try {
      const headers: Record<string,string> = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const response = await fetch(`/api/rooms/${room.roomCode}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete room');
      }

      setRooms(rooms.filter(r => r._id !== roomId));
      
      toast({
        title: 'Room Deleted',
        description: `"${room.title}" has been deleted successfully`,
      });

    } catch (error: any) {
      console.error('Error deleting room:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete room',
        variant: 'destructive',
      });
    }
  };

  // Filter rooms based on search term and status
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.roomCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (room.examQuizId?.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || room.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusCount = (status: string) => {
    return rooms.filter(room => room.status === status).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Exam Rooms</h1>
          <p className="text-muted-foreground">
            Create and manage exam rooms for your quizzes
          </p>
        </div>
        <CreateRoomDialog 
          onRoomCreated={handleRoomCreated} 
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Rooms</CardDescription>
            <CardTitle className="text-2xl">{rooms.length}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Waiting</CardDescription>
            <CardTitle className="text-2xl text-blue-600">
              {getStatusCount('waiting')}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Running</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {getStatusCount('running')}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ended</CardDescription>
            <CardTitle className="text-2xl text-gray-600">
              {getStatusCount('ended')}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search rooms by title, code, or quiz..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="waiting">Waiting</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="ended">Ended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              onClick={fetchRooms}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Rooms Grid */}
      {filteredRooms.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">
              {searchTerm || statusFilter !== 'all' ? 'No rooms found' : 'No rooms yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Create your first exam room to get started'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <CreateRoomDialog 
                onRoomCreated={handleRoomCreated} 
              />
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredRooms.map((room) => (
            <RoomCard
              key={room._id}
              room={room}
              onRoomUpdated={handleRoomUpdated}
              onRoomDeleted={handleRoomDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}