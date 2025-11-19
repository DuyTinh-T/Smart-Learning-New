// Export all models for easy importing
export { default as User, type IUser } from './User';
export { default as Course, type ICourse, type IModule } from './Course';
export { default as Lesson, type ILesson } from './Lesson';
export { default as Quiz, type IQuiz, type IQuestion } from './Quiz';
export { default as QuizAttempt, type IQuizAttempt } from './QuizAttempt';
export { default as Progress, type IProgress } from './Progress';
export { default as AIRecommendation, type IAIRecommendation, type IRecommendation } from './AIRecommendation';
export { default as Notification, type INotification } from './Notification';
export { default as ProjectSubmission, type IProjectSubmission } from './ProjectSubmission';
export { Enrollment, type IEnrollment } from './Enrollment';
export { default as Payment, type IPayment } from './Payment';
export { default as Room, type IRoom } from './Room';
export { default as Submission, type ISubmission, type IAnswer } from './Submission';

// Export database connection
export { default as connectDB } from '../lib/mongodb';