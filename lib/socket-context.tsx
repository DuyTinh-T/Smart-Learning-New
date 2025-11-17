'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000', {
      // include a trailing slash to avoid server redirect from /api/socketio/ -> /api/socketio
      path: '/api/socketio/',
      // prefer websocket first, fallback to polling if necessary
      transports: ['websocket', 'polling'],
      // automatic reconnection with sensible backoff
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from server');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

// Custom hooks for specific socket events
export const useRoomSocket = () => {
  const { socket } = useSocket();

  const joinRoom = (data: {
    roomCode: string;
    userId: string;
    userName: string;
    role: 'teacher' | 'student';
  }) => {
    socket?.emit('join-room', data);
  };

  const startExam = (data: { roomCode: string; teacherId: string }) => {
    socket?.emit('start-exam', data);
  };

  const submitExam = (data: {
    roomCode: string;
    studentId: string;
    answers: any[];
  }) => {
    socket?.emit('submit-exam', data);
  };

  const getStatistics = (data: { roomCode: string; teacherId: string }) => {
    socket?.emit('get-statistics', data);
  };

  return {
    joinRoom,
    startExam,
    submitExam,
    getStatistics,
  };
};