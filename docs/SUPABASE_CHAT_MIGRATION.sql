-- Create exam_chat_messages table in Supabase

CREATE TABLE IF NOT EXISTS exam_chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code VARCHAR(10) NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  mentioned_question_id VARCHAR(50),
  role VARCHAR(20) NOT NULL CHECK (role IN ('STUDENT', 'TEACHER', 'AI')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_room_code ON exam_chat_messages(room_code);
CREATE INDEX IF NOT EXISTS idx_chat_created_at ON exam_chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_room_question ON exam_chat_messages(room_code, mentioned_question_id);
CREATE INDEX IF NOT EXISTS idx_chat_role ON exam_chat_messages(role);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_exam_chat_messages_updated_at
  BEFORE UPDATE ON exam_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE exam_chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Allow all authenticated users to read messages
CREATE POLICY "Allow authenticated users to read messages"
  ON exam_chat_messages
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow all authenticated users to insert messages
CREATE POLICY "Allow authenticated users to insert messages"
  ON exam_chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow service role to do everything (for server-side operations)
CREATE POLICY "Allow service role full access"
  ON exam_chat_messages
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create a view for chat statistics
CREATE OR REPLACE VIEW chat_question_stats AS
SELECT 
  room_code,
  mentioned_question_id,
  COUNT(*) as mention_count,
  COUNT(CASE WHEN role = 'AI' THEN 1 END) as ai_response_count,
  MAX(created_at) as last_mentioned
FROM exam_chat_messages
WHERE mentioned_question_id IS NOT NULL
GROUP BY room_code, mentioned_question_id;

-- Grant access to the view
GRANT SELECT ON chat_question_stats TO authenticated, anon;
