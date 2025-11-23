"use client"

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { Plus, Clock, Users, Settings, BookOpen, RefreshCw } from 'lucide-react';
import { CreateExamQuizDialog } from '@/components/exam-quiz/create-exam-quiz-dialog';

interface ExamQuiz {
  _id: string;
  title: string;
  questions: any[];
  timeLimit?: number;
  questionCount?: number;
  totalPoints?: number;
  estimatedTime?: number;
}

interface CreateRoomDialogProps {
  onRoomCreated: (room: any) => void;
}

export function CreateRoomDialog({ onRoomCreated }: CreateRoomDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [examQuizzes, setExamQuizzes] = useState<ExamQuiz[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    examQuizId: '',
    duration: 60,
    maxStudents: 50,
    settings: {
      shuffleQuestions: false,
      shuffleOptions: false,
      showCorrectAnswers: true,
      allowReview: true,
    },
  });

  const { toast } = useToast();
  const { token: authToken, user: authUser } = useAuth();

  // Load exam quizzes
  const loadExamQuizzes = async () => {
    setLoadingQuizzes(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      // Prefer token from auth context; if not present, cookie-based auth on server may still work
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const response = await fetch('/api/exam-quizzes', { headers });
      if (!response.ok) {
        throw new Error('Failed to fetch exam quizzes');
      }
      const data = await response.json();
      setExamQuizzes(data.examQuizzes || []);
    } catch (error) {
      console.error('Error loading exam quizzes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load exam quizzes',
        variant: 'destructive'
      });
    } finally {
      setLoadingQuizzes(false);
    }
  };

  // Load quizzes when dialog opens
  useEffect(() => {
    if (open) {
      loadExamQuizzes();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.examQuizId || !formData.duration) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    
    try {
      console.log('CreateRoomDialog: Auth token from context exists:', !!authToken);
      console.log('CreateRoomDialog: Token preview:', authToken ? authToken.substring(0, 20) + '...' : 'No token');

      // If we don't have a token in context, server-side cookie auth may still work. We only block when
      // there's definitely no token and no cookie-based auth available (best-effort: assume cookie present if authToken missing is falsey but user object exists).
      if (!authToken && !authUser) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers,
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log('CreateRoomDialog: Response:', { status: response.status, data });

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create room');
      }

      toast({
        title: 'Success',
        description: 'Room created successfully',
      });

      onRoomCreated(data.room);
      setOpen(false);
      setFormData({
        title: '',
        description: '',
        examQuizId: '',
        duration: 60,
        maxStudents: 50,
        settings: {
          shuffleQuestions: false,
          shuffleOptions: false,
          showCorrectAnswers: true,
          allowReview: true,
        },
      });

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create room',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedQuiz = examQuizzes.find((q: ExamQuiz) => q._id === formData.examQuizId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Room
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto dialog">
        <DialogHeader>
          <DialogTitle>Create Exam Room</DialogTitle>
          <DialogDescription>
            Set up a new exam room for students to join and take a quiz.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Room Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter room title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description for the room"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="quiz">Exam Quiz *</Label>
                  <div className="flex gap-2">
                    <CreateExamQuizDialog 
                      onQuizCreated={loadExamQuizzes}
                      trigger={
                        <Button type="button" variant="outline" size="sm">
                          <Plus className="h-3 w-3 mr-1" />
                          Create Quiz
                        </Button>
                      }
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={loadExamQuizzes}
                      disabled={loadingQuizzes}
                    >
                      <RefreshCw className={`h-3 w-3 mr-1 ${loadingQuizzes ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </div>
                {loadingQuizzes ? (
                  <div className="flex items-center justify-center p-4">
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Loading quizzes...
                  </div>
                ) : examQuizzes.length === 0 ? (
                  <div className="text-center p-4 text-muted-foreground">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No exam quizzes found. Create one to get started.</p>
                  </div>
                ) : (
                  <Select value={formData.examQuizId} onValueChange={(value) => setFormData({ ...formData, examQuizId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an exam quiz" />
                    </SelectTrigger>
                    <SelectContent>
                      {examQuizzes.map((quiz: ExamQuiz) => (
                        <SelectItem key={quiz._id} value={quiz._id}>
                          {quiz.title} ({quiz.questions?.length || 0} questions)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {selectedQuiz && (
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-4">
                        <span><strong>Questions:</strong> {selectedQuiz.questions?.length || 0}</span>
                        <span><strong>Total Points:</strong> {selectedQuiz.totalPoints || selectedQuiz.questions?.reduce((total: number, q: any) => total + q.points, 0) || 0}</span>
                      </div>
                      {selectedQuiz.timeLimit && (
                        <span><strong>Suggested Time:</strong> {Math.floor(selectedQuiz.timeLimit / 60)} minutes</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Exam Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="h-5 w-5" />
                Exam Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Duration (minutes) *
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    max="180"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxStudents" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Max Students
                  </Label>
                  <Input
                    id="maxStudents"
                    type="number"
                    min="1"
                    max="500"
                    value={formData.maxStudents}
                    onChange={(e) => setFormData({ ...formData, maxStudents: parseInt(e.target.value) || 50 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="shuffleQuestions" className="text-sm">
                    Shuffle Questions
                  </Label>
                  <Switch
                    id="shuffleQuestions"
                    checked={formData.settings.shuffleQuestions}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        settings: { ...formData.settings, shuffleQuestions: checked }
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="shuffleOptions" className="text-sm">
                    Shuffle Options
                  </Label>
                  <Switch
                    id="shuffleOptions"
                    checked={formData.settings.shuffleOptions}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        settings: { ...formData.settings, shuffleOptions: checked }
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="showCorrectAnswers" className="text-sm">
                    Show Correct Answers
                  </Label>
                  <Switch
                    id="showCorrectAnswers"
                    checked={formData.settings.showCorrectAnswers}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        settings: { ...formData.settings, showCorrectAnswers: checked }
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="allowReview" className="text-sm">
                    Allow Review
                  </Label>
                  <Switch
                    id="allowReview"
                    checked={formData.settings.allowReview}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        settings: { ...formData.settings, allowReview: checked }
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creating...' : 'Create Room'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}