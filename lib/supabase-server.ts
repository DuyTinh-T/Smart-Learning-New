import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client với service role key
export const getSupabaseServerClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase service role key');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

// Chat message interface
export interface ChatMessageRecord {
  id?: string;
  room_code: string;
  user_id: string;
  user_name: string;
  user_email: string;
  content: string;
  mentioned_question_id?: string | null;
  role: 'STUDENT' | 'TEACHER' | 'AI';
  created_at?: string;
}

// Chat operations
export const ChatService = {
  // Lấy tất cả messages của room
  async getMessages(roomCode: string): Promise<ChatMessageRecord[]> {
    const supabase = getSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('exam_chat_messages')
      .select('*')
      .eq('room_code', roomCode)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  // Tạo message mới
  async createMessage(message: ChatMessageRecord): Promise<ChatMessageRecord> {
    const supabase = getSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('exam_chat_messages')
      .insert([{
        room_code: message.room_code,
        user_id: message.user_id,
        user_name: message.user_name,
        user_email: message.user_email,
        content: message.content,
        mentioned_question_id: message.mentioned_question_id || null,
        role: message.role,
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Lấy messages về 1 question cụ thể
  async getMessagesByQuestion(
    roomCode: string, 
    questionId: string
  ): Promise<ChatMessageRecord[]> {
    const supabase = getSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('exam_chat_messages')
      .select('*')
      .eq('room_code', roomCode)
      .eq('mentioned_question_id', questionId)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) throw error;
    return data || [];
  }
};
