/**
 * Quiz API Usage Examples
 * 
 * This file demonstrates how to use the quiz API functions
 * for adding, editing, and deleting quizzes.
 */

import { quizAPI, type CreateQuizData, type UpdateQuizData, type QuizQuestion } from '@/lib/api/quiz-api';

// Example: Creating a quiz with multiple choice and essay questions
export const createExampleQuiz = async () => {
  try {
    const questions: QuizQuestion[] = [
      {
        text: "What is React?",
        type: "multiple-choice",
        options: [
          "A JavaScript library for building user interfaces",
          "A database management system", 
          "A web server",
          "A CSS framework"
        ],
        correctIndex: 0,
        points: 2,
        difficulty: "easy",
        explanation: "React is indeed a JavaScript library developed by Facebook for building user interfaces."
      },
      {
        text: "Explain the concept of component lifecycle in React and provide examples of when you would use different lifecycle methods.",
        type: "essay",
        maxWords: 300,
        points: 5,
        difficulty: "medium",
        rubric: "Should mention mounting, updating, and unmounting phases. Examples of lifecycle methods like componentDidMount, componentDidUpdate, etc."
      }
    ];

    const quizData: CreateQuizData = {
      lessonId: "lesson_id_here", // Replace with actual lesson ID
      title: "React Fundamentals Quiz",
      description: "A comprehensive quiz covering React basics and advanced concepts",
      questions,
      timeLimit: 1800, // 30 minutes in seconds
      passingScore: 70,
      allowMultipleAttempts: true,
      maxAttempts: 3,
      showCorrectAnswers: true,
      shuffleQuestions: false,
      shuffleOptions: true
    };

    const result = await quizAPI.createQuiz(quizData);
    console.log('Quiz created:', result.data);
    return result.data;
  } catch (error) {
    console.error('Error creating quiz:', error);
    throw error;
  }
};

// Example: Getting all quizzes with filtering
export const getFilteredQuizzes = async () => {
  try {
    const result = await quizAPI.getQuizzes({
      page: 1,
      limit: 10,
      isActive: true,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    
    console.log('Quizzes:', result.data);
    console.log('Pagination:', result.pagination);
    return result;
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    throw error;
  }
};

// Example: Updating a quiz
export const updateExampleQuiz = async (quizId: string) => {
  try {
    const updateData: UpdateQuizData = {
      title: "Updated React Fundamentals Quiz",
      passingScore: 75,
      timeLimit: 2400, // 40 minutes
      questions: [
        {
          text: "What are React Hooks?",
          type: "multiple-choice",
          options: [
            "Functions that let you use state and lifecycle features",
            "CSS styling methods",
            "Database connections",
            "Server-side rendering techniques"
          ],
          correctIndex: 0,
          points: 3,
          difficulty: "medium"
        }
      ]
    };

    const result = await quizAPI.updateQuiz(quizId, updateData);
    console.log('Quiz updated:', result.data);
    return result.data;
  } catch (error) {
    console.error('Error updating quiz:', error);
    throw error;
  }
};

// Example: Getting quizzes by lesson
export const getQuizzesByLesson = async (lessonId: string) => {
  try {
    const result = await quizAPI.getQuizzesByLesson(lessonId, {
      isActive: true
    });
    
    console.log(`Quizzes for lesson ${lessonId}:`, result.data);
    return result.data;
  } catch (error) {
    console.error('Error fetching quizzes by lesson:', error);
    throw error;
  }
};

// Example: Searching quizzes
export const searchQuizzes = async (searchTerm: string) => {
  try {
    const result = await quizAPI.searchQuizzes(searchTerm, {
      isActive: true,
      limit: 20
    });
    
    console.log(`Search results for "${searchTerm}":`, result.data);
    return result.data;
  } catch (error) {
    console.error('Error searching quizzes:', error);
    throw error;
  }
};

// Example: Soft deleting a quiz (deactivate)
export const deactivateQuiz = async (quizId: string) => {
  try {
    const result = await quizAPI.deleteQuiz(quizId, false); // soft delete
    console.log('Quiz deactivated:', result.message);
    return result;
  } catch (error) {
    console.error('Error deactivating quiz:', error);
    throw error;
  }
};

// Example: Hard deleting a quiz (permanent removal - admin only)
export const permanentlyDeleteQuiz = async (quizId: string) => {
  try {
    const result = await quizAPI.deleteQuiz(quizId, true); // hard delete
    console.log('Quiz permanently deleted:', result.message);
    return result;
  } catch (error) {
    console.error('Error permanently deleting quiz:', error);
    throw error;
  }
};

// Example: Getting a specific quiz by ID
export const getQuizDetails = async (quizId: string) => {
  try {
    const result = await quizAPI.getQuizById(quizId);
    console.log('Quiz details:', result.data);
    return result.data;
  } catch (error) {
    console.error('Error fetching quiz details:', error);
    throw error;
  }
};

// Example: Batch operations - get multiple quiz details
export const getBatchQuizDetails = async (quizIds: string[]) => {
  try {
    const results = await Promise.all(
      quizIds.map(id => quizAPI.getQuizById(id))
    );
    
    const quizzes = results.map(result => result.data);
    console.log('Batch quiz details:', quizzes);
    return quizzes;
  } catch (error) {
    console.error('Error fetching batch quiz details:', error);
    throw error;
  }
};