// Quiz API client functions

export interface QuizQuestion {
  text: string;
  type: 'multiple-choice' | 'essay';
  points?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  explanation?: string;
  
  // Multiple choice specific
  options?: string[];
  correctIndex?: number;
  
  // Essay specific
  maxWords?: number;
  rubric?: string;
}

export interface CreateQuizData {
  lessonId: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
  timeLimit?: number;
  passingScore?: number;
  allowMultipleAttempts?: boolean;
  maxAttempts?: number;
  showCorrectAnswers?: boolean;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
}

export interface UpdateQuizData extends Partial<CreateQuizData> {
  isActive?: boolean;
}

export interface QuizFilters {
  page?: number;
  limit?: number;
  lessonId?: string;
  createdBy?: string;
  isActive?: boolean;
  q?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class QuizAPI {
  private baseUrl = '/api/quizzes';

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Get all quizzes with optional filtering and pagination
  async getQuizzes(filters: QuizFilters = {}) {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });

    const queryString = params.toString();
    const endpoint = queryString ? `?${queryString}` : '';

    return this.request<{
      success: boolean;
      data: any[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
      };
    }>(`${endpoint}`);
  }

  // Get a specific quiz by ID
  async getQuizById(id: string) {
    return this.request<{
      success: boolean;
      data: any;
    }>(`/${id}`);
  }

  // Create a new quiz
  async createQuiz(data: CreateQuizData) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>('', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Update an existing quiz
  async updateQuiz(id: string, data: UpdateQuizData) {
    return this.request<{
      success: boolean;
      data: any;
      message: string;
    }>(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Delete a quiz (soft delete by default)
  async deleteQuiz(id: string, hardDelete = false) {
    const params = hardDelete ? '?hard=true' : '';
    return this.request<{
      success: boolean;
      data?: any;
      message: string;
    }>(`/${id}${params}`, {
      method: 'DELETE',
    });
  }

  // Get quizzes by lesson ID
  async getQuizzesByLesson(lessonId: string, filters: Omit<QuizFilters, 'lessonId'> = {}) {
    return this.getQuizzes({ ...filters, lessonId });
  }

  // Get quizzes created by a specific user
  async getQuizzesByCreator(createdBy: string, filters: Omit<QuizFilters, 'createdBy'> = {}) {
    return this.getQuizzes({ ...filters, createdBy });
  }

  // Search quizzes by keyword
  async searchQuizzes(keyword: string, filters: Omit<QuizFilters, 'q'> = {}) {
    return this.getQuizzes({ ...filters, q: keyword });
  }
}

// Create and export a singleton instance
export const quizAPI = new QuizAPI();

// Export individual functions for convenience
export const {
  getQuizzes,
  getQuizById,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getQuizzesByLesson,
  getQuizzesByCreator,
  searchQuizzes,
} = quizAPI;