'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Trash2, Plus, Edit3 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ExamQuestion {
  _id?: string;
  text: string;
  type: 'multiple-choice' | 'essay';
  points: number;
  options?: string[];
  correctIndex?: number;
  maxWords?: number;
  explanation?: string;
}

interface CreateExamQuizDialogProps {
  onQuizCreated: () => void;
  trigger?: React.ReactNode;
}

export function CreateExamQuizDialog({ onQuizCreated, trigger }: CreateExamQuizDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Quiz form data
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeLimit, setTimeLimit] = useState<number | undefined>(undefined);
  const [passingScore, setPassingScore] = useState(60);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(true);
  
  // Questions
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<number | null>(null);
  
  // New question form
  const [newQuestion, setNewQuestion] = useState<ExamQuestion>({
    text: '',
    type: 'multiple-choice',
    points: 1,
    options: ['', ''],
    correctIndex: 0
  });

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTimeLimit(undefined);
    setPassingScore(60);
    setShuffleQuestions(false);
    setShuffleOptions(false);
    setShowCorrectAnswers(true);
    setQuestions([]);
    setEditingQuestion(null);
    setNewQuestion({
      text: '',
      type: 'multiple-choice',
      points: 1,
      options: ['', ''],
      correctIndex: 0
    });
  };

  const addOption = () => {
    if (newQuestion.options && newQuestion.options.length < 6) {
      setNewQuestion(prev => ({
        ...prev,
        options: [...(prev.options || []), '']
      }));
    }
  };

  const removeOption = (index: number) => {
    if (newQuestion.options && newQuestion.options.length > 2) {
      const newOptions = newQuestion.options.filter((_, i) => i !== index);
      setNewQuestion(prev => ({
        ...prev,
        options: newOptions,
        correctIndex: prev.correctIndex !== undefined && prev.correctIndex >= index ? 
          Math.max(0, prev.correctIndex - 1) : prev.correctIndex
      }));
    }
  };

  const updateOption = (index: number, value: string) => {
    setNewQuestion(prev => ({
      ...prev,
      options: prev.options?.map((opt, i) => i === index ? value : opt)
    }));
  };

  const addQuestion = () => {
    if (!newQuestion.text.trim()) {
      toast({
        title: 'Error',
        description: 'Question text is required',
        variant: 'destructive'
      });
      return;
    }

    if (newQuestion.type === 'multiple-choice') {
      if (!newQuestion.options || newQuestion.options.some(opt => !opt.trim())) {
        toast({
          title: 'Error',
          description: 'All options must be filled',
          variant: 'destructive'
        });
        return;
      }
    } else if (newQuestion.type === 'essay') {
      if (!newQuestion.maxWords || newQuestion.maxWords <= 0) {
        toast({
          title: 'Error',
          description: 'Max words must be a positive number',
          variant: 'destructive'
        });
        return;
      }
    }

    const questionToAdd = { ...newQuestion };
    if (questionToAdd.type === 'essay') {
      delete questionToAdd.options;
      delete questionToAdd.correctIndex;
    }

    if (editingQuestion !== null) {
      const updatedQuestions = [...questions];
      updatedQuestions[editingQuestion] = questionToAdd;
      setQuestions(updatedQuestions);
      setEditingQuestion(null);
    } else {
      setQuestions(prev => [...prev, questionToAdd]);
    }

    setNewQuestion({
      text: '',
      type: 'multiple-choice',
      points: 1,
      options: ['', ''],
      correctIndex: 0
    });
  };

  const editQuestion = (index: number) => {
    const question = questions[index];
    setNewQuestion({ ...question });
    setEditingQuestion(index);
  };

  const deleteQuestion = (index: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
    if (editingQuestion === index) {
      setEditingQuestion(null);
      setNewQuestion({
        text: '',
        type: 'multiple-choice',
        points: 1,
        options: ['', ''],
        correctIndex: 0
      });
    }
  };

  const cancelEdit = () => {
    setEditingQuestion(null);
    setNewQuestion({
      text: '',
      type: 'multiple-choice',
      points: 1,
      options: ['', ''],
      correctIndex: 0
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: 'Error',
        description: 'Quiz title is required',
        variant: 'destructive'
      });
      return;
    }

    if (questions.length === 0) {
      toast({
        title: 'Error',
        description: 'At least one question is required',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/exam-quizzes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          questions,
          timeLimit,
          passingScore,
          shuffleQuestions,
          shuffleOptions,
          showCorrectAnswers
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create exam quiz');
      }

      toast({
        title: 'Success',
        description: 'Exam quiz created successfully',
      });

      resetForm();
      setOpen(false);
      onQuizCreated();
    } catch (error) {
      console.error('Error creating exam quiz:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create exam quiz',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) {
        resetForm();
      }
    }}>
      <DialogTrigger asChild>
        {trigger || <Button>Create Exam Quiz</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Exam Quiz</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Quiz Info */}
          <div className="grid gap-4">
            <div>
              <Label htmlFor="title">Quiz Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter quiz title"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter quiz description (optional)"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="timeLimit">Time Limit (seconds)</Label>
                <Input
                  id="timeLimit"
                  type="number"
                  min="1"
                  max="7200"
                  value={timeLimit || ''}
                  onChange={(e) => setTimeLimit(e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="Optional (in seconds)"
                />
              </div>

              <div>
                <Label htmlFor="passingScore">Passing Score (%)</Label>
                <Input
                  id="passingScore"
                  type="number"
                  min="0"
                  max="100"
                  value={passingScore}
                  onChange={(e) => setPassingScore(parseInt(e.target.value))}
                />
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-3">
              <Label>Quiz Settings</Label>
              <div className="flex items-center justify-between">
                <Label htmlFor="shuffleQuestions">Shuffle Questions</Label>
                <Switch
                  id="shuffleQuestions"
                  checked={shuffleQuestions}
                  onCheckedChange={setShuffleQuestions}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="shuffleOptions">Shuffle Options</Label>
                <Switch
                  id="shuffleOptions"
                  checked={shuffleOptions}
                  onCheckedChange={setShuffleOptions}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="showCorrectAnswers">Show Correct Answers After Completion</Label>
                <Switch
                  id="showCorrectAnswers"
                  checked={showCorrectAnswers}
                  onCheckedChange={setShowCorrectAnswers}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Questions Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">Questions ({questions.length})</Label>
            </div>

            {/* Existing Questions */}
            {questions.map((question, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm">
                      Question {index + 1} ({question.type}) - {question.points} pts
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => editQuestion(index)}
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => deleteQuestion(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 mb-2">{question.text}</p>
                  {question.type === 'multiple-choice' && question.options && (
                    <ul className="text-xs space-y-1">
                      {question.options.map((option, optIndex) => (
                        <li key={optIndex} className={optIndex === question.correctIndex ? 'font-semibold text-green-600' : ''}>
                          {String.fromCharCode(65 + optIndex)}. {option}
                        </li>
                      ))}
                    </ul>
                  )}
                  {question.type === 'essay' && (
                    <p className="text-xs text-gray-500">Max words: {question.maxWords}</p>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Add New Question Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  {editingQuestion !== null ? 'Edit Question' : 'Add New Question'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="questionText">Question Text *</Label>
                  <Textarea
                    id="questionText"
                    value={newQuestion.text}
                    onChange={(e) => setNewQuestion(prev => ({ ...prev, text: e.target.value }))}
                    placeholder="Enter your question"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="questionType">Question Type</Label>
                    <Select
                      value={newQuestion.type}
                      onValueChange={(value: 'multiple-choice' | 'essay') => {
                        setNewQuestion(prev => ({
                          ...prev,
                          type: value,
                          ...(value === 'multiple-choice' ? {
                            options: ['', ''],
                            correctIndex: 0,
                            maxWords: undefined
                          } : {
                            options: undefined,
                            correctIndex: undefined,
                            maxWords: 100
                          })
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                        <SelectItem value="essay">Essay</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="questionPoints">Points</Label>
                    <Input
                      id="questionPoints"
                      type="number"
                      min="0.1"
                      max="10"
                      step="0.1"
                      value={newQuestion.points}
                      onChange={(e) => setNewQuestion(prev => ({ ...prev, points: parseFloat(e.target.value) }))}
                    />
                  </div>
                </div>

                {/* Multiple Choice Options */}
                {newQuestion.type === 'multiple-choice' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Answer Options</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addOption}
                        disabled={!newQuestion.options || newQuestion.options.length >= 6}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Option
                      </Button>
                    </div>

                    {newQuestion.options?.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={newQuestion.correctIndex === index}
                          onChange={() => setNewQuestion(prev => ({ ...prev, correctIndex: index }))}
                          className="mt-1"
                        />
                        <Input
                          placeholder={`Option ${String.fromCharCode(65 + index)}`}
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeOption(index)}
                          disabled={!newQuestion.options || newQuestion.options.length <= 2}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Essay Max Words */}
                {newQuestion.type === 'essay' && (
                  <div>
                    <Label htmlFor="maxWords">Maximum Words</Label>
                    <Input
                      id="maxWords"
                      type="number"
                      min="1"
                      max="5000"
                      value={newQuestion.maxWords || ''}
                      onChange={(e) => setNewQuestion(prev => ({ 
                        ...prev, 
                        maxWords: parseInt(e.target.value) 
                      }))}
                      placeholder="e.g., 100"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="explanation">Explanation (Optional)</Label>
                  <Textarea
                    id="explanation"
                    value={newQuestion.explanation || ''}
                    onChange={(e) => setNewQuestion(prev => ({ ...prev, explanation: e.target.value }))}
                    placeholder="Explanation for the correct answer"
                    rows={2}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="button" onClick={addQuestion}>
                    {editingQuestion !== null ? 'Update Question' : 'Add Question'}
                  </Button>
                  {editingQuestion !== null && (
                    <Button type="button" variant="outline" onClick={cancelEdit}>
                      Cancel Edit
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || questions.length === 0}>
              {loading ? 'Creating...' : 'Create Quiz'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}