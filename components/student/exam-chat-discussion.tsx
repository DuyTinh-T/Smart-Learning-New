'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import io, { Socket } from 'socket.io-client';
import { 
  Send, 
  Bot, 
  User, 
  GraduationCap,
  AlertCircle,
  Loader2,
  Wifi,
  WifiOff
} from 'lucide-react';

interface Question {
  _id: string;
  text: string;
  points: number;
  correctAnswer?: any;
}

interface ChatMessage {
  id: string;
  room_code: string;
  user_id: string;
  user_name: string;
  user_email: string;
  content: string;
  mentioned_question_id?: string | null;
  role: 'STUDENT' | 'TEACHER' | 'AI';
  created_at: string;
}

interface ExamChatDiscussionProps {
  roomCode: string;
  questions: Question[];
}

export function ExamChatDiscussion({ roomCode, questions }: ExamChatDiscussionProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  
  const { user, token } = useAuth();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Socket.IO connection
  useEffect(() => {
    if (!user || !roomCode) {
      console.log('⚠️ Missing user or roomCode:', { user: !!user, roomCode });
      return;
    }

    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';
    console.log('🔌 Connecting to socket server:', SOCKET_URL);
    
    const socket = io(SOCKET_URL, {
      transports: ['polling', 'websocket'],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Socket connected, ID:', socket.id);
      setConnected(true);
      
      // Join chat room
      console.log('📤 Emitting join-chat:', { roomCode, userId: user._id, userName: user.name });
      socket.emit('join-chat', {
        roomCode,
        userId: user._id,
        userName: user.name,
      });
      
      // Load history
      console.log('📤 Emitting load-chat-history:', { roomCode });
      socket.emit('load-chat-history', { roomCode });
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setConnected(false);
    });

    socket.on('chat-history', (data: { messages: ChatMessage[] }) => {
      console.log('📜 Received chat history:', data.messages.length, 'messages');
      console.log('Messages:', data.messages);
      setMessages(data.messages);
    });

    socket.on('chat-message', (message: ChatMessage) => {
      console.log('💬 Received new message:', message);
      setMessages(prev => {
        // Avoid duplicates
        if (prev.some(m => m.id === message.id)) {
          console.log('⚠️ Duplicate message ignored');
          return prev;
        }
        console.log('✅ Message added to state');
        return [...prev, message];
      });
    });

    socket.on('error', (error: { message: string }) => {
      console.error('❌ Socket error:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
    });

    return () => {
      console.log('🔌 Disconnecting socket');
      socket.disconnect();
    };
  }, [roomCode, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || loading || !socketRef.current || !user) {
      console.log('⚠️ Cannot send message:', { 
        hasInput: !!input.trim(), 
        loading, 
        hasSocket: !!socketRef.current, 
        hasUser: !!user 
      });
      return;
    }

    setLoading(true);
    try {
      const messageData = {
        roomCode,
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        content: input,
        mentionedQuestionId: selectedQuestionId,
        role: user.role === 'teacher' ? 'TEACHER' : 'STUDENT',
      };
      
      console.log('📤 Emitting send-chat-message:', messageData);
      socketRef.current.emit('send-chat-message', messageData);
      
      setInput('');
      setSelectedQuestionId(null);
      console.log('✅ Message sent, cleared input');
      
    } catch (error: any) {
      console.error('❌ Error sending message:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);

    // Detect @ mention
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1 && lastAtIndex === value.length - 1) {
      setShowMentionDropdown(true);
      setMentionFilter('');
    } else if (lastAtIndex !== -1) {
      const afterAt = value.slice(lastAtIndex + 1);
      if (!afterAt.includes(' ')) {
        setShowMentionDropdown(true);
        setMentionFilter(afterAt.toLowerCase());
      } else {
        setShowMentionDropdown(false);
      }
    } else {
      setShowMentionDropdown(false);
    }
  };

  const handleQuestionSelect = (question: Question, index: number) => {
    const lastAtIndex = input.lastIndexOf('@');
    const beforeAt = input.slice(0, lastAtIndex);
    const mentionText = `@Question ${index + 1} `;
    
    setInput(beforeAt + mentionText);
    setSelectedQuestionId(question._id);
    setShowMentionDropdown(false);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getQuestionStats = (questionId: string) => {
    const mentionCount = messages.filter(m => m.mentioned_question_id === questionId).length;
    const hasAI = messages.some(m => m.mentioned_question_id === questionId && m.role === 'AI');
    return { mentionCount, hasAI };
  };

  const filteredQuestions = questions.filter((q, i) => 
    mentionFilter === '' || 
    `question ${i + 1}`.includes(mentionFilter) ||
    q.text.toLowerCase().includes(mentionFilter)
  );

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'AI':
        return <Bot className="h-4 w-4 text-blue-500" />;
      case 'TEACHER':
        return <GraduationCap className="h-4 w-4 text-purple-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'AI':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'TEACHER':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className="flex flex-col h-full bg-background mt-3">
      {/* Header */}
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-lg">Thảo luận lớp học</CardTitle>
          </div>
          {connected ? (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
              <Wifi className="h-3 w-3 mr-1" />
              Live
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
              <WifiOff className="h-3 w-3 mr-1" />
              Offline
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Sử dụng @Question để hỏi về các câu hỏi cụ thể.
        </p>
      </CardHeader>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Bot className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Chưa có tin nhắn nào. Bắt đầu thảo luận!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.user_id === user?._id;
            const isAI = message.role === 'AI';
            const mentionedQuestion = message.mentioned_question_id 
              ? questions.findIndex(q => q._id === message.mentioned_question_id)
              : -1;

            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isOwn && !isAI ? 'flex-row-reverse' : ''}`}
              >
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isAI ? 'bg-blue-100' : 
                    message.role === 'TEACHER' ? 'bg-purple-100' : 
                    'bg-gray-100'
                  }`}>
                    {getRoleIcon(message.role)}
                  </div>
                </div>
                
                <div className={`flex-1 ${isOwn && !isAI ? 'items-end' : ''}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">
                      {message.user_name}
                    </span>
                    <Badge variant="outline" className={`text-xs ${getRoleBadgeColor(message.role)}`}>
                      {message.role}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </span>
                  </div>

                  {mentionedQuestion !== -1 && (
                    <Badge variant="secondary" className="mb-2 text-xs">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Question {mentionedQuestion + 1}
                    </Badge>
                  )}

                  <div className={`rounded-lg px-4 py-2 ${
                    isAI ? 'bg-blue-50 border border-blue-200' :
                    message.role === 'TEACHER' ? 'bg-purple-50 border border-purple-200' :
                    isOwn ? 'bg-primary text-primary-foreground' :
                    'bg-muted'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Mention Dropdown */}
      {showMentionDropdown && (
        <div className="mx-4 mb-2 border rounded-lg shadow-lg bg-background max-h-48 overflow-y-auto">
          {filteredQuestions.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground">
              Không tìm thấy câu hỏi nào
            </div>
          ) : (
            filteredQuestions.map((question, index) => {
              const realIndex = questions.findIndex(q => q._id === question._id);
              const stats = getQuestionStats(question._id);
              
              return (
                <button
                  key={question._id}
                  onClick={() => handleQuestionSelect(question, realIndex)}
                  className="w-full text-left px-3 py-2 hover:bg-muted transition-colors border-b last:border-0"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          Question {realIndex + 1}
                        </span>
                        {stats.mentionCount > 0 && (
                          <Badge variant="outline" className="text-xs">
                            🔥 {stats.mentionCount} mentions
                          </Badge>
                        )}
                        {stats.hasAI && (
                          <Badge variant="outline" className="text-xs bg-blue-50">
                            <Bot className="h-3 w-3 mr-1" />
                            AI helped
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {question.text}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type @ to mention a question..."
            disabled={loading}
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!input.trim() || loading}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        {selectedQuestionId && (
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              <AlertCircle className="h-3 w-3 mr-1" />
              Mentioning: Question {questions.findIndex(q => q._id === selectedQuestionId) + 1}
            </Badge>
            <button
              onClick={() => {
                setSelectedQuestionId(null);
                setInput(input.replace(/@Question \d+ /g, ''));
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              ✕ Remove
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
