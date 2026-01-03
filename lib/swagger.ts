import { apiPaths } from './swagger-paths';

export const getApiDocs = () => {
  const spec = {
    openapi: '3.0.0',
    info: {
      title: 'Learning Platform API Documentation',
      version: '1.0.0',
      description: 'Comprehensive API documentation for the Learning Management System',
      contact: {
        name: 'API Support',
        email: 'support@learningplatform.com',
      },
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://your-production-url.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'auth_token',
          description: 'Authentication cookie',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', example: 'john@example.com' },
            role: { 
              type: 'string', 
              enum: ['student', 'teacher', 'admin'],
              example: 'student'
            },
            avatar: { type: 'string', example: 'https://example.com/avatar.jpg' },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            lastLogin: { type: 'string', format: 'date-time' },
          },
        },
        Course: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            title: { type: 'string', example: 'Introduction to React' },
            description: { type: 'string', example: 'Learn React from basics to advanced' },
            category: { type: 'string', example: 'Web Development' },
            level: { 
              type: 'string',
              enum: ['beginner', 'intermediate', 'advanced'],
              example: 'intermediate'
            },
            price: { type: 'number', example: 49.99 },
            thumbnail: { type: 'string', example: 'https://example.com/thumbnail.jpg' },
            tags: { type: 'array', items: { type: 'string' }, example: ['react', 'javascript', 'frontend'] },
            visibility: { type: 'string', enum: ['public', 'private', 'draft'], example: 'public' },
            isActive: { type: 'boolean', example: true },
            teacherId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            teacher: { $ref: '#/components/schemas/User' },
            enrollmentCount: { type: 'number', example: 150 },
            rating: { type: 'number', example: 4.5 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Module: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            courseId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            title: { type: 'string', example: 'Getting Started with React' },
            description: { type: 'string', example: 'Introduction to React fundamentals' },
            order: { type: 'number', example: 1 },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Lesson: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            moduleId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            title: { type: 'string', example: 'Introduction to JSX' },
            content: { type: 'string', example: 'Learn about JSX syntax...' },
            videoUrl: { type: 'string', example: 'https://youtube.com/watch?v=xxx' },
            duration: { type: 'number', example: 15 },
            order: { type: 'number', example: 1 },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Enrollment: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            student: { type: 'string', example: '507f1f77bcf86cd799439011' },
            course: { type: 'string', example: '507f1f77bcf86cd799439011' },
            status: { 
              type: 'string',
              enum: ['active', 'completed', 'dropped'],
              example: 'active'
            },
            progress: { type: 'number', example: 65 },
            enrolledAt: { type: 'string', format: 'date-time' },
            completedAt: { type: 'string', format: 'date-time' },
          },
        },
        Quiz: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            lessonId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            title: { type: 'string', example: 'React Basics Quiz' },
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
        ExamRoom: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            code: { type: 'string', example: 'EXAM123' },
            title: { type: 'string', example: 'Final Exam - React Advanced' },
            teacherId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            quizId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            startTime: { type: 'string', format: 'date-time' },
            endTime: { type: 'string', format: 'date-time' },
            duration: { type: 'number', example: 60 },
            isActive: { type: 'boolean', example: true },
            participants: { type: 'array', items: { type: 'string' } },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Payment: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            courseId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            amount: { type: 'number', example: 49.99 },
            currency: { type: 'string', example: 'USD' },
            status: {
              type: 'string',
              enum: ['pending', 'completed', 'failed', 'refunded'],
              example: 'completed'
            },
            stripeSessionId: { type: 'string', example: 'cs_test_xxx' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Error message' },
            message: { type: 'string', example: 'Detailed error description' },
            statusCode: { type: 'number', example: 400 },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation successful' },
            data: { type: 'object' },
          },
        },
      },
    },
    tags: [
      { name: 'Authentication', description: 'User authentication endpoints' },
      { name: 'Courses', description: 'Course management endpoints' },
      { name: 'Modules', description: 'Course module endpoints' },
      { name: 'Lessons', description: 'Lesson management endpoints' },
      { name: 'Enrollments', description: 'Course enrollment endpoints' },
      { name: 'Quizzes', description: 'Quiz and assessment endpoints' },
      { name: 'Exam Rooms', description: 'Exam room management endpoints' },
      { name: 'Students', description: 'Student management endpoints' },
      { name: 'Teachers', description: 'Teacher management endpoints' },
      { name: 'Admin', description: 'Admin dashboard and management endpoints' },
      { name: 'Payment', description: 'Payment processing endpoints' },
      { name: 'Bookmarks', description: 'Course bookmark endpoints' },
      { name: 'Reviews', description: 'Course review endpoints' },
      { name: 'AI', description: 'AI-powered features endpoints' },
    ],
    paths: apiPaths,
  };

  return spec;
};
