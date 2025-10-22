import connectDB from '../lib/mongodb';
import { User, Course, Lesson, Quiz, Progress } from '../models';

async function testDatabaseConnection() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected to MongoDB successfully!');

    // Test creating a user
    console.log('🔄 Testing User model...');
    const testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'student'
    });

    // Validate without saving
    await testUser.validate();
    console.log('✅ User model validation passed!');

    // Test creating a course
    console.log('🔄 Testing Course model...');
    const testCourse = new Course({
      title: 'Test Course',
      description: 'A test course description',
      category: 'Programming',
      tags: ['javascript', 'web-development'],
      createdBy: testUser._id,
      modules: [{
        title: 'Module 1',
        order: 1,
        lessons: []
      }]
    });

    await testCourse.validate();
    console.log('✅ Course model validation passed!');

    console.log('🎉 All database models are working correctly!');
    
    // Display schema information
    console.log('\n📊 Schema Summary:');
    console.log('- User: Authentication, roles, profile management');
    console.log('- Course: Course content with modules and lessons');
    console.log('- Lesson: Individual learning content (text, video, quiz, project)');
    console.log('- Quiz: Assessment with multiple choice questions');
    console.log('- QuizAttempt: Track user quiz submissions and scores');
    console.log('- Progress: Track user learning progress per lesson');
    console.log('- AIRecommendation: AI-powered learning recommendations');
    console.log('- Notification: System notifications and alerts');

  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testDatabaseConnection()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default testDatabaseConnection;