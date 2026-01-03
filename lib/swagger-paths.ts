export const apiPaths = {
  // ==================== AUTHENTICATION APIs ====================
  '/api/auth/login': {
    post: {
      tags: ['Authentication'],
      summary: 'User login',
      description: 'Authenticate user with email and password',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password'],
              properties: {
                email: {
                  type: 'string',
                  format: 'email',
                  example: 'user@example.com',
                },
                password: {
                  type: 'string',
                  format: 'password',
                  example: 'password123',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Login successful',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
                  user: { $ref: '#/components/schemas/User' },
                },
              },
            },
          },
        },
        400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        401: { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        403: { description: 'Account disabled', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
      },
    },
  },
  '/api/auth/register': {
    post: {
      tags: ['Authentication'],
      summary: 'User registration',
      description: 'Register a new user account',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'email', 'password', 'role'],
              properties: {
                name: { type: 'string', example: 'John Doe' },
                email: { type: 'string', format: 'email', example: 'john@example.com' },
                password: { type: 'string', format: 'password', minLength: 6, example: 'password123' },
                role: { type: 'string', enum: ['student', 'teacher'], example: 'student' },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Registration successful',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'User registered successfully' },
                  userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
                },
              },
            },
          },
        },
        400: { description: 'Validation error or email already exists' },
      },
    },
  },
  '/api/auth/logout': {
    post: {
      tags: ['Authentication'],
      summary: 'User logout',
      description: 'Logout user and clear authentication cookie',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: {
          description: 'Logout successful',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Logged out successfully' },
                },
              },
            },
          },
        },
      },
    },
  },
  '/api/auth/me': {
    get: {
      tags: ['Authentication'],
      summary: 'Get current user',
      description: 'Get authenticated user information',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: {
          description: 'User information',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  user: { $ref: '#/components/schemas/User' },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
      },
    },
  },
  '/api/auth/profile': {
    get: {
      tags: ['Authentication'],
      summary: 'Get user profile',
      description: 'Get detailed user profile information',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: {
          description: 'User profile',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } },
        },
        401: { description: 'Unauthorized' },
      },
    },
    put: {
      tags: ['Authentication'],
      summary: 'Update user profile',
      description: 'Update authenticated user profile',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'John Doe Updated' },
                avatar: { type: 'string', example: 'https://example.com/avatar.jpg' },
                bio: { type: 'string', example: 'Software developer' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Profile updated successfully' },
        401: { description: 'Unauthorized' },
      },
    },
  },

  // ==================== COURSES APIs ====================
  '/api/courses': {
    get: {
      tags: ['Courses'],
      summary: 'Get all courses',
      description: 'Get list of courses with filtering, searching, and pagination',
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 }, description: 'Page number' },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 }, description: 'Items per page' },
        { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Search keyword' },
        { name: 'category', in: 'query', schema: { type: 'string' }, description: 'Filter by category' },
        { name: 'tag', in: 'query', schema: { type: 'string' }, description: 'Filter by tag' },
        { name: 'visibility', in: 'query', schema: { type: 'string', enum: ['public', 'private', 'draft'] } },
        { name: 'sortBy', in: 'query', schema: { type: 'string', default: 'createdAt' }, description: 'Sort field' },
        { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' } },
      ],
      responses: {
        200: {
          description: 'List of courses',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Course' },
                  },
                  pagination: {
                    type: 'object',
                    properties: {
                      total: { type: 'number', example: 100 },
                      page: { type: 'number', example: 1 },
                      limit: { type: 'number', example: 20 },
                      totalPages: { type: 'number', example: 5 },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    post: {
      tags: ['Courses'],
      summary: 'Create new course',
      description: 'Create a new course (Teacher/Admin only)',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['title', 'description', 'category', 'level'],
              properties: {
                title: { type: 'string', example: 'Introduction to React' },
                description: { type: 'string', example: 'Learn React from basics to advanced' },
                category: { type: 'string', example: 'Web Development' },
                level: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'], example: 'intermediate' },
                price: { type: 'number', example: 49.99 },
                thumbnail: { type: 'string', example: 'https://example.com/thumbnail.jpg' },
                tags: { type: 'array', items: { type: 'string' }, example: ['react', 'javascript'] },
                visibility: { type: 'string', enum: ['public', 'private', 'draft'], default: 'draft' },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Course created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Course created successfully' },
                  course: { $ref: '#/components/schemas/Course' },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden - Teacher/Admin only' },
      },
    },
  },
  '/api/courses/{id}': {
    get: {
      tags: ['Courses'],
      summary: 'Get course by ID',
      description: 'Get detailed information about a specific course',
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Course ID' },
      ],
      responses: {
        200: {
          description: 'Course details',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  course: { $ref: '#/components/schemas/Course' },
                },
              },
            },
          },
        },
        404: { description: 'Course not found' },
      },
    },
    put: {
      tags: ['Courses'],
      summary: 'Update course',
      description: 'Update course information (Teacher/Admin only)',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Course ID' },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                category: { type: 'string' },
                level: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
                price: { type: 'number' },
                thumbnail: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' } },
                visibility: { type: 'string', enum: ['public', 'private', 'draft'] },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Course updated successfully' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Course not found' },
      },
    },
    delete: {
      tags: ['Courses'],
      summary: 'Delete course',
      description: 'Delete a course (Teacher/Admin only)',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Course ID' },
      ],
      responses: {
        200: { description: 'Course deleted successfully' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Course not found' },
      },
    },
  },
  '/api/courses/{id}/modules': {
    get: {
      tags: ['Modules'],
      summary: 'Get course modules',
      description: 'Get all modules for a specific course',
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Course ID' },
      ],
      responses: {
        200: {
          description: 'List of modules',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  modules: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Module' },
                  },
                },
              },
            },
          },
        },
        404: { description: 'Course not found' },
      },
    },
    post: {
      tags: ['Modules'],
      summary: 'Create module',
      description: 'Create a new module for a course (Teacher/Admin only)',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Course ID' },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['title', 'description'],
              properties: {
                title: { type: 'string', example: 'Getting Started with React' },
                description: { type: 'string', example: 'Introduction to React fundamentals' },
                order: { type: 'number', example: 1 },
              },
            },
          },
        },
      },
      responses: {
        201: { description: 'Module created successfully' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
      },
    },
  },

  // ==================== ENROLLMENTS APIs ====================
  '/api/enrollments': {
    get: {
      tags: ['Enrollments'],
      summary: 'Get user enrollments',
      description: 'Get all enrollments for the authenticated user',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: {
          description: 'List of enrollments',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  enrollments: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Enrollment' },
                  },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
      },
    },
    post: {
      tags: ['Enrollments'],
      summary: 'Enroll in course',
      description: 'Enroll the authenticated user in a course',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['courseId'],
              properties: {
                courseId: { type: 'string', example: '507f1f77bcf86cd799439011' },
              },
            },
          },
        },
      },
      responses: {
        201: { description: 'Enrollment successful' },
        400: { description: 'Already enrolled or validation error' },
        401: { description: 'Unauthorized' },
        404: { description: 'Course not found' },
      },
    },
  },
  '/api/enrollments/{id}/progress': {
    get: {
      tags: ['Enrollments'],
      summary: 'Get enrollment progress',
      description: 'Get detailed progress for a specific enrollment',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Enrollment ID' },
      ],
      responses: {
        200: {
          description: 'Enrollment progress',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  progress: {
                    type: 'object',
                    properties: {
                      completionPercentage: { type: 'number', example: 65 },
                      completedLessons: { type: 'array', items: { type: 'string' } },
                      totalLessons: { type: 'number', example: 20 },
                      quizScores: { type: 'array', items: { type: 'object' } },
                    },
                  },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
        404: { description: 'Enrollment not found' },
      },
    },
    put: {
      tags: ['Enrollments'],
      summary: 'Update enrollment progress',
      description: 'Update progress for a specific enrollment',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Enrollment ID' },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                lessonId: { type: 'string', example: '507f1f77bcf86cd799439011' },
                completed: { type: 'boolean', example: true },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Progress updated successfully' },
        401: { description: 'Unauthorized' },
        404: { description: 'Enrollment not found' },
      },
    },
  },

  // ==================== QUIZZES APIs ====================
  '/api/quizzes': {
    get: {
      tags: ['Quizzes'],
      summary: 'Get all quizzes',
      description: 'Get list of quizzes',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: {
          description: 'List of quizzes',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  quizzes: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Quiz' },
                  },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
      },
    },
    post: {
      tags: ['Quizzes'],
      summary: 'Create quiz',
      description: 'Create a new quiz (Teacher/Admin only)',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['title', 'questions'],
              properties: {
                title: { type: 'string', example: 'React Basics Quiz' },
                lessonId: { type: 'string', example: '507f1f77bcf86cd799439011' },
                questions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      question: { type: 'string', example: 'What is JSX?' },
                      options: { type: 'array', items: { type: 'string' } },
                      correctAnswer: { type: 'number', example: 0 },
                      explanation: { type: 'string', example: 'JSX is...' },
                    },
                  },
                },
                timeLimit: { type: 'number', example: 30 },
                passingScore: { type: 'number', example: 70 },
              },
            },
          },
        },
      },
      responses: {
        201: { description: 'Quiz created successfully' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
      },
    },
  },
  '/api/quizzes/{id}': {
    get: {
      tags: ['Quizzes'],
      summary: 'Get quiz by ID',
      description: 'Get detailed information about a specific quiz',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Quiz ID' },
      ],
      responses: {
        200: {
          description: 'Quiz details',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  quiz: { $ref: '#/components/schemas/Quiz' },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
        404: { description: 'Quiz not found' },
      },
    },
  },

  // ==================== EXAM ROOMS APIs ====================
  '/api/rooms': {
    get: {
      tags: ['Exam Rooms'],
      summary: 'Get all exam rooms',
      description: 'Get list of exam rooms (Teacher/Admin)',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: {
          description: 'List of exam rooms',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  rooms: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/ExamRoom' },
                  },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
      },
    },
    post: {
      tags: ['Exam Rooms'],
      summary: 'Create exam room',
      description: 'Create a new exam room (Teacher/Admin only)',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['title', 'quizId', 'duration'],
              properties: {
                title: { type: 'string', example: 'Final Exam - React Advanced' },
                quizId: { type: 'string', example: '507f1f77bcf86cd799439011' },
                duration: { type: 'number', example: 60 },
                startTime: { type: 'string', format: 'date-time' },
                endTime: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
      responses: {
        201: { description: 'Exam room created successfully' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
      },
    },
  },
  '/api/rooms/{code}': {
    get: {
      tags: ['Exam Rooms'],
      summary: 'Get exam room by code',
      description: 'Get exam room details by room code',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [
        { name: 'code', in: 'path', required: true, schema: { type: 'string' }, description: 'Room code' },
      ],
      responses: {
        200: {
          description: 'Exam room details',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  room: { $ref: '#/components/schemas/ExamRoom' },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
        404: { description: 'Room not found' },
      },
    },
  },
  '/api/rooms/{code}/join': {
    post: {
      tags: ['Exam Rooms'],
      summary: 'Join exam room',
      description: 'Student joins an exam room',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [
        { name: 'code', in: 'path', required: true, schema: { type: 'string' }, description: 'Room code' },
      ],
      responses: {
        200: { description: 'Joined exam room successfully' },
        401: { description: 'Unauthorized' },
        403: { description: 'Exam already started or ended' },
        404: { description: 'Room not found' },
      },
    },
  },
  '/api/rooms/{code}/submit': {
    post: {
      tags: ['Exam Rooms'],
      summary: 'Submit exam answers',
      description: 'Submit student answers for exam',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [
        { name: 'code', in: 'path', required: true, schema: { type: 'string' }, description: 'Room code' },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['answers'],
              properties: {
                answers: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      questionId: { type: 'string' },
                      answer: { type: 'number' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Submission successful' },
        401: { description: 'Unauthorized' },
        404: { description: 'Room not found' },
      },
    },
  },

  // ==================== PAYMENT APIs ====================
  '/api/payment/create-session': {
    post: {
      tags: ['Payment'],
      summary: 'Create payment session',
      description: 'Create a Stripe payment session for course purchase',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['courseId'],
              properties: {
                courseId: { type: 'string', example: '507f1f77bcf86cd799439011' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Payment session created',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  sessionId: { type: 'string', example: 'cs_test_xxx' },
                  url: { type: 'string', example: 'https://checkout.stripe.com/pay/cs_test_xxx' },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
        404: { description: 'Course not found' },
      },
    },
  },
  '/api/payment/webhook': {
    post: {
      tags: ['Payment'],
      summary: 'Payment webhook',
      description: 'Stripe webhook for payment events',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              description: 'Stripe webhook event',
            },
          },
        },
      },
      responses: {
        200: { description: 'Webhook processed' },
        400: { description: 'Invalid webhook' },
      },
    },
  },
  '/api/payment/history': {
    get: {
      tags: ['Payment'],
      summary: 'Get payment history',
      description: 'Get payment history for authenticated user',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: {
          description: 'Payment history',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  payments: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Payment' },
                  },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
      },
    },
  },

  // ==================== ADMIN APIs ====================
  '/api/admin/stats': {
    get: {
      tags: ['Admin'],
      summary: 'Get admin statistics',
      description: 'Get overall platform statistics (Admin only)',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: {
          description: 'Platform statistics',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  stats: {
                    type: 'object',
                    properties: {
                      totalUsers: { type: 'number', example: 1500 },
                      totalCourses: { type: 'number', example: 50 },
                      totalEnrollments: { type: 'number', example: 3000 },
                      totalRevenue: { type: 'number', example: 50000 },
                      activeStudents: { type: 'number', example: 1200 },
                      activeTeachers: { type: 'number', example: 25 },
                    },
                  },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Admin access required' },
      },
    },
  },
  '/api/admin/students': {
    get: {
      tags: ['Admin'],
      summary: 'Get all students',
      description: 'Get list of all students with their stats (Admin only)',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: {
          description: 'List of students',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        email: { type: 'string' },
                        courses: { type: 'number' },
                        progress: { type: 'number' },
                        status: { type: 'string', enum: ['active', 'inactive'] },
                        joined: { type: 'string' },
                      },
                    },
                  },
                  total: { type: 'number', example: 1200 },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Admin access required' },
      },
    },
  },
  '/api/admin/students/{id}': {
    get: {
      tags: ['Admin'],
      summary: 'Get student details',
      description: 'Get detailed student information (Admin only)',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Student ID' },
      ],
      responses: {
        200: { description: 'Student details' },
        401: { description: 'Unauthorized' },
        403: { description: 'Admin access required' },
        404: { description: 'Student not found' },
      },
    },
    delete: {
      tags: ['Admin'],
      summary: 'Delete student',
      description: 'Delete a student account (Admin only)',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Student ID' },
      ],
      responses: {
        200: { description: 'Student deleted successfully' },
        401: { description: 'Unauthorized' },
        403: { description: 'Admin access required' },
        404: { description: 'Student not found' },
      },
    },
  },
  '/api/admin/students/{id}/status': {
    patch: {
      tags: ['Admin'],
      summary: 'Update student status',
      description: 'Activate or deactivate student account (Admin only)',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Student ID' },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['isActive'],
              properties: {
                isActive: { type: 'boolean', example: true },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Status updated successfully' },
        401: { description: 'Unauthorized' },
        403: { description: 'Admin access required' },
        404: { description: 'Student not found' },
      },
    },
  },
  '/api/admin/teachers': {
    get: {
      tags: ['Admin'],
      summary: 'Get all teachers',
      description: 'Get list of all teachers (Admin only)',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: {
          description: 'List of teachers',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Admin access required' },
      },
    },
  },
  '/api/admin/courses': {
    get: {
      tags: ['Admin'],
      summary: 'Get all courses (Admin)',
      description: 'Get all courses including private and draft courses (Admin only)',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: {
          description: 'List of all courses',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  courses: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Course' },
                  },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Admin access required' },
      },
    },
  },

  // ==================== TEACHER APIs ====================
  '/api/teacher/dashboard': {
    get: {
      tags: ['Teachers'],
      summary: 'Get teacher dashboard',
      description: 'Get teacher dashboard statistics and data',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [
        { name: 'teacherId', in: 'query', required: true, schema: { type: 'string' }, description: 'Teacher ID' },
      ],
      responses: {
        200: {
          description: 'Teacher dashboard data',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  stats: {
                    type: 'object',
                    properties: {
                      totalCourses: { type: 'number', example: 5 },
                      totalStudents: { type: 'number', example: 150 },
                      totalRevenue: { type: 'number', example: 7500 },
                      averageRating: { type: 'number', example: 4.5 },
                    },
                  },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Teacher access required' },
      },
    },
  },
  '/api/teacher/students': {
    get: {
      tags: ['Teachers'],
      summary: 'Get teacher students',
      description: 'Get list of students enrolled in teacher courses',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: {
          description: 'List of students',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  students: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Teacher access required' },
      },
    },
  },
  '/api/teacher/rooms': {
    get: {
      tags: ['Teachers'],
      summary: 'Get teacher exam rooms',
      description: 'Get list of exam rooms created by teacher',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: {
          description: 'List of exam rooms',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  rooms: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/ExamRoom' },
                  },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Teacher access required' },
      },
    },
  },

  // ==================== STUDENT APIs ====================
  '/api/student/courses': {
    get: {
      tags: ['Students'],
      summary: 'Get student courses',
      description: 'Get all courses enrolled by student',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: {
          description: 'List of enrolled courses',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  courses: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Course' },
                  },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
      },
    },
  },
  '/api/student/submissions': {
    get: {
      tags: ['Students'],
      summary: 'Get student submissions',
      description: 'Get all exam submissions by student',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: {
          description: 'List of submissions',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  submissions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        _id: { type: 'string' },
                        examCode: { type: 'string' },
                        score: { type: 'number' },
                        submittedAt: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
      },
    },
  },

  // ==================== BOOKMARKS APIs ====================
  '/api/bookmarks': {
    get: {
      tags: ['Bookmarks'],
      summary: 'Get user bookmarks',
      description: 'Get all bookmarked courses for authenticated user',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: {
          description: 'List of bookmarked courses',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  bookmarks: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Course' },
                  },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
      },
    },
  },
  '/api/bookmarks/{courseId}': {
    post: {
      tags: ['Bookmarks'],
      summary: 'Add bookmark',
      description: 'Bookmark a course',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [
        { name: 'courseId', in: 'path', required: true, schema: { type: 'string' }, description: 'Course ID' },
      ],
      responses: {
        200: { description: 'Bookmark added successfully' },
        401: { description: 'Unauthorized' },
        404: { description: 'Course not found' },
      },
    },
    delete: {
      tags: ['Bookmarks'],
      summary: 'Remove bookmark',
      description: 'Remove a bookmarked course',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [
        { name: 'courseId', in: 'path', required: true, schema: { type: 'string' }, description: 'Course ID' },
      ],
      responses: {
        200: { description: 'Bookmark removed successfully' },
        401: { description: 'Unauthorized' },
        404: { description: 'Bookmark not found' },
      },
    },
  },

  // ==================== REVIEWS APIs ====================
  '/api/reviews': {
    get: {
      tags: ['Reviews'],
      summary: 'Get course reviews',
      description: 'Get reviews for a specific course',
      parameters: [
        { name: 'courseId', in: 'query', required: true, schema: { type: 'string' }, description: 'Course ID' },
      ],
      responses: {
        200: {
          description: 'List of reviews',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  reviews: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        _id: { type: 'string' },
                        userId: { type: 'string' },
                        rating: { type: 'number', example: 4.5 },
                        comment: { type: 'string', example: 'Great course!' },
                        createdAt: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    post: {
      tags: ['Reviews'],
      summary: 'Create review',
      description: 'Create a review for a course',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['courseId', 'rating', 'comment'],
              properties: {
                courseId: { type: 'string', example: '507f1f77bcf86cd799439011' },
                rating: { type: 'number', minimum: 1, maximum: 5, example: 4.5 },
                comment: { type: 'string', example: 'Great course!' },
              },
            },
          },
        },
      },
      responses: {
        201: { description: 'Review created successfully' },
        401: { description: 'Unauthorized' },
        404: { description: 'Course not found' },
      },
    },
  },

  // ==================== AI APIs ====================
  '/api/ai/generate-lesson': {
    post: {
      tags: ['AI'],
      summary: 'Generate lesson with AI',
      description: 'Generate lesson content using AI (Teacher/Admin only)',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['topic', 'level'],
              properties: {
                topic: { type: 'string', example: 'Introduction to React Hooks' },
                level: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'], example: 'intermediate' },
                duration: { type: 'number', example: 15 },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Lesson content generated',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  content: { type: 'string', example: 'Generated lesson content...' },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
        403: { description: 'Teacher/Admin access required' },
      },
    },
  },
  '/api/ai/recommend-courses': {
    get: {
      tags: ['AI'],
      summary: 'Get AI course recommendations',
      description: 'Get personalized course recommendations based on user history',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: {
          description: 'Course recommendations',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  recommendations: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Course' },
                  },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
      },
    },
  },
};
