// API utility functions for course management

export interface CreateCourseData {
  title: string;
  description: string;
  category: string;
  tags: string[];
  thumbnail?: string;
  price?: number;
  visibility?: 'public' | 'private';
}

export interface CreateModuleData {
  title: string;
  order?: number;
}

export interface CreateLessonData {
  title: string;
  type: 'text' | 'video' | 'quiz' | 'project';
  content?: string;
  videoUrl?: string;
  resources?: string[];
  duration?: number;
  order?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string[];
  message?: string;
}

// Get auth token from localStorage or cookies
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  // Try localStorage first
  const token = localStorage.getItem('auth-token');
  if (token) return token;
  
  // Fallback to cookies
  const cookies = document.cookie.split(';');
  const authCookie = cookies.find(cookie => cookie.trim().startsWith('auth-token='));
  return authCookie ? authCookie.split('=')[1] : null;
};

// Base API call function with auth headers
const apiCall = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const token = getAuthToken();
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`/api${endpoint}`, config);
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'An error occurred',
        details: data.details,
      };
    }
    
    return data;
  } catch (error) {
    console.error('API call failed:', error);
    return {
      success: false,
      error: 'Network error. Please check your connection.',
    };
  }
};

// Course API functions
export const courseApi = {
  // Create a new course
  create: async (courseData: CreateCourseData): Promise<ApiResponse<any>> => {
    return apiCall('/courses', {
      method: 'POST',
      body: JSON.stringify(courseData),
    });
  },

  // Get all courses with filtering
  getAll: async (params?: {
    page?: number;
    limit?: number;
    q?: string;
    category?: string;
    tag?: string;
    visibility?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<any>> => {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = searchParams.toString();
    return apiCall(`/courses${queryString ? `?${queryString}` : ''}`);
  },

  // Get course by ID
  getById: async (id: string): Promise<ApiResponse<any>> => {
    return apiCall(`/courses/${id}`);
  },

  // Update course
  update: async (id: string, courseData: Partial<CreateCourseData>): Promise<ApiResponse<any>> => {
    return apiCall(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(courseData),
    });
  },

  // Delete course
  delete: async (id: string): Promise<ApiResponse<any>> => {
    return apiCall(`/courses/${id}`, {
      method: 'DELETE',
    });
  },

  // Add module to course
  addModule: async (courseId: string, moduleData: CreateModuleData): Promise<ApiResponse<any>> => {
    return apiCall(`/courses/${courseId}/modules`, {
      method: 'POST',
      body: JSON.stringify(moduleData),
    });
  },

  // Get course modules
  getModules: async (courseId: string): Promise<ApiResponse<any>> => {
    return apiCall(`/courses/${courseId}/modules`);
  },
};

// Module API functions
export const moduleApi = {
  // Add lesson to module
  addLesson: async (moduleId: string, lessonData: CreateLessonData): Promise<ApiResponse<any>> => {
    return apiCall(`/modules/${moduleId}/lessons`, {
      method: 'POST',
      body: JSON.stringify(lessonData),
    });
  },

  // Get module lessons
  getLessons: async (moduleId: string): Promise<ApiResponse<any>> => {
    return apiCall(`/modules/${moduleId}/lessons`);
  },
};

// Lesson API functions
export const lessonApi = {
  // Get lesson by ID
  getById: async (id: string): Promise<ApiResponse<any>> => {
    return apiCall(`/lessons/${id}`);
  },

  // Update lesson
  update: async (id: string, lessonData: Partial<CreateLessonData>): Promise<ApiResponse<any>> => {
    return apiCall(`/lessons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(lessonData),
    });
  },

  // Delete lesson
  delete: async (id: string): Promise<ApiResponse<any>> => {
    return apiCall(`/lessons/${id}`, {
      method: 'DELETE',
    });
  },
};

// Student API functions
export const studentApi = {
  // Get enrolled courses for student dashboard
  getEnrolledCourses: async (): Promise<ApiResponse<any>> => {
    return apiCall('/enrollments')
  }
}

// Enrollment API functions
export const enrollmentApi = {
  // Enroll in a course
  enroll: async (courseId: string): Promise<ApiResponse<any>> => {
    return apiCall('/enrollments', {
      method: 'POST',
      body: JSON.stringify({ courseId }),
    })
  },

  // Get user's enrollments
  getAll: async (params?: {
    status?: string
    page?: number
    limit?: number
  }): Promise<ApiResponse<any>> => {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.append('status', params.status)
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const endpoint = queryParams.toString() ? `/enrollments?${queryParams}` : '/enrollments'
    return apiCall(endpoint)
  },

  // Get enrollment progress for a specific course
  getProgress: async (enrollmentId: string): Promise<ApiResponse<any>> => {
    return apiCall(`/enrollments/${enrollmentId}/progress`)
  },

  // Update lesson progress
  updateProgress: async (
    enrollmentId: string,
    lessonId: string,
    action: string,
    data?: any
  ): Promise<ApiResponse<any>> => {
    return apiCall(`/enrollments/${enrollmentId}/progress`, {
      method: 'PUT',
      body: JSON.stringify({ lessonId, action, data }),
    })
  },

  // Check if user is enrolled in a course
  checkEnrollment: async (courseId: string): Promise<ApiResponse<any>> => {
    const response = await apiCall('/enrollments')
    if (response.success && response.data) {
      const data = response.data as any
      // Filter out enrollments with null courses and find the matching one
      const enrollment = data.enrollments?.find((e: any) => 
        e.course && (e.course._id === courseId || e.course.id === courseId)
      )
      return {
        success: true,
        data: enrollment || null
      }
    }
    return response
  }
}

// Utility function to handle API errors
export const handleApiError = (error: string | undefined, details?: string[]): string => {
  if (details && details.length > 0) {
    return `${error}: ${details.join(', ')}`;
  }
  return error || 'An unexpected error occurred';
};