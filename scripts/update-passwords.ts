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

const updatePasswords = async () => {
  try {
    await connectDB();

    console.log('🔐 Starting to update user passwords...');

    // Hashed password cho "12345678"
    const hashedPassword = '$2b$12$WKYjjqa/SSDm61Je.D/OTOlixj0aXgp87jPLpiieRvhMMKfOjdLBa';

    // Cập nhật password cho tất cả students và teachers
    const result = await User.updateMany(
      { 
        email: { $regex: /(student|teacher)\d+@gmail\.com/ } 
      },
      { 
        $set: { password: hashedPassword } 
      }
    );

    console.log(`✅ Updated passwords for ${result.modifiedCount} users`);
    console.log(`   - Password: 12345678`);
    console.log(`   - Hashed: ${hashedPassword}`);

    // Hiển thị một vài users đã cập nhật
    const sampleUsers = await User.find({ 
      email: { $regex: /(student|teacher)\d+@gmail\.com/ } 
    }).limit(5);

    console.log('\n📋 Sample updated users:');
    sampleUsers.forEach(user => {
      console.log(`   - ${user.email} | ${user.name} | ${user.role}`);
    });

  } catch (error: any) {
    console.error('❌ Error updating passwords:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  }
};

// Run the update function
updatePasswords();
