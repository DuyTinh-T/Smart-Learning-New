import mongoose from 'mongoose';
import User from '../models/User';

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/learning-platform';
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Danh sách tên ngẫu nhiên cho students
const studentNames = [
  'Nguyễn Văn An', 'Trần Thị Bình', 'Lê Văn Cường', 'Phạm Thị Dung', 'Hoàng Văn Em',
  'Đặng Thị Phương', 'Vũ Văn Giang', 'Bùi Thị Hoa', 'Đinh Văn Hùng', 'Phan Thị Lan',
  'Đỗ Văn Minh', 'Ngô Thị Nga', 'Mai Văn Ơn', 'Tạ Thị Phương', 'Lý Văn Quân',
  'Dương Thị Rạng', 'Cao Văn Sơn', 'Trịnh Thị Thảo', 'Lưu Văn Uy', 'Võ Thị Vân'
];

// Danh sách tên ngẫu nhiên cho teachers
const teacherNames = [
  'Giáo sư Nguyễn Văn Anh', 'Tiến sĩ Trần Thị Bích', 'Thạc sĩ Lê Văn Cường',
  'Giáo sư Phạm Thị Duyên', 'Tiến sĩ Hoàng Văn Em', 'Thạc sĩ Đặng Thị Phương',
  'Giáo sư Vũ Văn Giang', 'Tiến sĩ Bùi Thị Hồng', 'Thạc sĩ Đinh Văn Hải',
  'Giáo sư Phan Thị Lan'
];

const seedUsers = async () => {
  try {
    await connectDB();

    console.log('🌱 Starting to seed users...');

    // Xóa users hiện có (optional - bỏ comment nếu muốn xóa)
    // await User.deleteMany({ email: { $regex: /(student|teacher)\d+@gmail\.com/ } });
    // console.log('🗑️  Cleared existing seeded users');

    const users = [];

    // Hashed password cho "12345678"
    const hashedPassword = '$2b$12$WKYjjqa/SSDm61Je.D/OTOlixj0aXgp87jPLpiieRvhMMKfOjdLBa';

    // Tạo 20 students
    console.log('📚 Creating 20 student users...');
    for (let i = 1; i <= 20; i++) {
      users.push({
        name: studentNames[i - 1],
        email: `student${i}@gmail.com`,
        password: hashedPassword,
        role: 'student',
        avatar: null,
        isActive: true,
        dailyStudyTime: 30,
        enrolledCourses: []
      });
    }

    // Tạo 10 teachers
    console.log('👨‍🏫 Creating 10 teacher users...');
    for (let i = 1; i <= 10; i++) {
      users.push({
        name: teacherNames[i - 1],
        email: `teacher${i}@gmail.com`,
        password: hashedPassword,
        role: 'teacher',
        avatar: null,
        isActive: true,
        dailyStudyTime: 0,
        enrolledCourses: []
      });
    }

    // Insert users vào database
    const createdUsers = await User.insertMany(users);
    
    console.log(`✅ Successfully created ${createdUsers.length} users:`);
    console.log(`   - 20 students (student1@gmail.com - student20@gmail.com)`);
    console.log(`   - 10 teachers (teacher1@gmail.com - teacher10@gmail.com)`);
    console.log(`   - Password for all: 12345678`);

    // Hiển thị một vài ví dụ
    console.log('\n📋 Sample users created:');
    console.log('Students:');
    createdUsers.slice(0, 3).forEach(user => {
      console.log(`   - ${user.email} | ${user.name}`);
    });
    console.log('Teachers:');
    createdUsers.slice(20, 23).forEach(user => {
      console.log(`   - ${user.email} | ${user.name}`);
    });

  } catch (error: any) {
    console.error('❌ Error seeding users:', error.message);
    if (error.code === 11000) {
      console.error('⚠️  Duplicate email found. Some users may already exist.');
    }
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
    process.exit(0);
  }
};

// Run the seed function
seedUsers();
