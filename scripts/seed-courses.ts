import mongoose from 'mongoose';
import User from '../models/User';
import Course from '../models/Course';
import Lesson from '../models/Lesson';

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

// Dữ liệu courses theo các lĩnh vực
const coursesData = [
  // Lập trình (8 courses)
  {
    title: 'JavaScript Fundamentals từ Zero đến Hero',
    description: 'Học JavaScript từ cơ bản đến nâng cao, bao gồm ES6+, async/await, và DOM manipulation',
    category: 'Lập trình',
    tags: ['javascript', 'web', 'frontend', 'programming'],
    modules: [
      {
        title: 'Giới thiệu và Setup',
        lessons: [
          { title: 'JavaScript là gì?', type: 'video', duration: 15 },
          { title: 'Cài đặt môi trường phát triển', type: 'text', duration: 10 },
          { title: 'Hello World đầu tiên', type: 'video', duration: 20 }
        ]
      },
      {
        title: 'Biến và Kiểu dữ liệu',
        lessons: [
          { title: 'Khai báo biến với let, const, var', type: 'video', duration: 25 },
          { title: 'Các kiểu dữ liệu trong JS', type: 'text', duration: 20 },
          { title: 'Bài tập thực hành', type: 'quiz', duration: 15 }
        ]
      },
      {
        title: 'Functions và Arrow Functions',
        lessons: [
          { title: 'Function Declaration vs Expression', type: 'video', duration: 30 },
          { title: 'Arrow Functions ES6', type: 'video', duration: 25 },
          { title: 'Project: Tạo Calculator', type: 'project', duration: 60 }
        ]
      },
      {
        title: 'DOM Manipulation',
        lessons: [
          { title: 'Document Object Model là gì?', type: 'video', duration: 20 },
          { title: 'Query Selectors và Events', type: 'video', duration: 35 }
        ]
      }
    ]
  },
  {
    title: 'React.js - Xây dựng Web App hiện đại',
    description: 'Khóa học React.js toàn diện với Hooks, Context API, và React Router',
    category: 'Lập trình',
    tags: ['react', 'javascript', 'frontend', 'spa'],
    modules: [
      {
        title: 'React Basics',
        lessons: [
          { title: 'Giới thiệu React và JSX', type: 'video', duration: 20 },
          { title: 'Components và Props', type: 'video', duration: 30 },
          { title: 'State và Lifecycle', type: 'video', duration: 25 }
        ]
      },
      {
        title: 'React Hooks',
        lessons: [
          { title: 'useState và useEffect', type: 'video', duration: 40 },
          { title: 'useContext và useReducer', type: 'video', duration: 35 }
        ]
      },
      {
        title: 'Advanced React',
        lessons: [
          { title: 'React Router v6', type: 'video', duration: 30 },
          { title: 'State Management', type: 'text', duration: 25 },
          { title: 'Project: Todo App', type: 'project', duration: 90 }
        ]
      }
    ]
  },
  {
    title: 'Python cho Data Science',
    description: 'Học Python từ cơ bản và ứng dụng vào phân tích dữ liệu với Pandas, NumPy',
    category: 'Lập trình',
    tags: ['python', 'data-science', 'pandas', 'numpy'],
    modules: [
      {
        title: 'Python Fundamentals',
        lessons: [
          { title: 'Cài đặt Python và Jupyter', type: 'text', duration: 15 },
          { title: 'Variables và Data Types', type: 'video', duration: 25 },
          { title: 'Lists và Dictionaries', type: 'video', duration: 30 }
        ]
      },
      {
        title: 'NumPy và Arrays',
        lessons: [
          { title: 'Giới thiệu NumPy', type: 'video', duration: 20 },
          { title: 'Array Operations', type: 'video', duration: 35 }
        ]
      },
      {
        title: 'Pandas Data Analysis',
        lessons: [
          { title: 'DataFrames và Series', type: 'video', duration: 40 },
          { title: 'Data Cleaning', type: 'video', duration: 30 },
          { title: 'Quiz: Pandas Basics', type: 'quiz', duration: 20 }
        ]
      }
    ]
  },
  {
    title: 'Node.js và Express Backend Development',
    description: 'Xây dựng RESTful API với Node.js, Express và MongoDB',
    category: 'Lập trình',
    tags: ['nodejs', 'express', 'backend', 'api'],
    modules: [
      {
        title: 'Node.js Basics',
        lessons: [
          { title: 'Node.js là gì?', type: 'video', duration: 15 },
          { title: 'NPM và Package Management', type: 'text', duration: 20 },
          { title: 'First Server với HTTP Module', type: 'video', duration: 25 }
        ]
      },
      {
        title: 'Express Framework',
        lessons: [
          { title: 'Setup Express App', type: 'video', duration: 20 },
          { title: 'Routing và Middleware', type: 'video', duration: 35 }
        ]
      },
      {
        title: 'Database và Authentication',
        lessons: [
          { title: 'MongoDB và Mongoose', type: 'video', duration: 40 },
          { title: 'JWT Authentication', type: 'video', duration: 35 },
          { title: 'Project: Build REST API', type: 'project', duration: 120 }
        ]
      },
      {
        title: 'Deployment',
        lessons: [
          { title: 'Deploy lên Heroku/Render', type: 'video', duration: 30 },
          { title: 'Environment Variables', type: 'text', duration: 15 }
        ]
      }
    ]
  },
  {
    title: 'SQL và Database Design',
    description: 'Học SQL từ cơ bản đến nâng cao, thiết kế database hiệu quả',
    category: 'Lập trình',
    tags: ['sql', 'database', 'mysql', 'postgresql'],
    modules: [
      {
        title: 'SQL Fundamentals',
        lessons: [
          { title: 'Introduction to Databases', type: 'video', duration: 20 },
          { title: 'SELECT, WHERE, ORDER BY', type: 'video', duration: 30 },
          { title: 'JOINs in SQL', type: 'video', duration: 35 }
        ]
      },
      {
        title: 'Advanced SQL',
        lessons: [
          { title: 'Subqueries và CTEs', type: 'video', duration: 40 },
          { title: 'Indexes và Performance', type: 'text', duration: 25 }
        ]
      },
      {
        title: 'Database Design',
        lessons: [
          { title: 'Normalization', type: 'video', duration: 30 },
          { title: 'ERD Design', type: 'video', duration: 25 },
          { title: 'Quiz: Database Concepts', type: 'quiz', duration: 20 }
        ]
      }
    ]
  },
  {
    title: 'TypeScript - JavaScript nâng cao',
    description: 'Làm chủ TypeScript để viết code JavaScript type-safe và scalable',
    category: 'Lập trình',
    tags: ['typescript', 'javascript', 'types', 'frontend'],
    modules: [
      {
        title: 'TypeScript Basics',
        lessons: [
          { title: 'Why TypeScript?', type: 'video', duration: 15 },
          { title: 'Setup và Compiler', type: 'text', duration: 20 },
          { title: 'Basic Types', type: 'video', duration: 25 }
        ]
      },
      {
        title: 'Advanced Types',
        lessons: [
          { title: 'Interfaces vs Types', type: 'video', duration: 30 },
          { title: 'Generics', type: 'video', duration: 35 }
        ]
      },
      {
        title: 'TypeScript with React',
        lessons: [
          { title: 'React với TypeScript', type: 'video', duration: 40 },
          { title: 'Typing Props và State', type: 'video', duration: 30 },
          { title: 'Project: Typed React App', type: 'project', duration: 90 }
        ]
      }
    ]
  },
  {
    title: 'Git và GitHub cho Developer',
    description: 'Version control với Git, collaboration với GitHub',
    category: 'Lập trình',
    tags: ['git', 'github', 'version-control', 'devtools'],
    modules: [
      {
        title: 'Git Fundamentals',
        lessons: [
          { title: 'Git là gì?', type: 'video', duration: 15 },
          { title: 'Cài đặt và Config', type: 'text', duration: 10 },
          { title: 'Commit, Push, Pull', type: 'video', duration: 30 }
        ]
      },
      {
        title: 'Branching và Merging',
        lessons: [
          { title: 'Git Branches', type: 'video', duration: 25 },
          { title: 'Merge vs Rebase', type: 'video', duration: 30 }
        ]
      },
      {
        title: 'GitHub Collaboration',
        lessons: [
          { title: 'Pull Requests', type: 'video', duration: 20 },
          { title: 'GitHub Actions CI/CD', type: 'video', duration: 35 },
          { title: 'Quiz: Git Workflow', type: 'quiz', duration: 15 }
        ]
      }
    ]
  },
  {
    title: 'Docker - Container hóa ứng dụng',
    description: 'Học Docker để deploy và quản lý ứng dụng với container',
    category: 'Lập trình',
    tags: ['docker', 'devops', 'container', 'deployment'],
    modules: [
      {
        title: 'Docker Basics',
        lessons: [
          { title: 'Container là gì?', type: 'video', duration: 20 },
          { title: 'Cài đặt Docker', type: 'text', duration: 15 },
          { title: 'Docker Images và Containers', type: 'video', duration: 30 }
        ]
      },
      {
        title: 'Dockerfile',
        lessons: [
          { title: 'Viết Dockerfile', type: 'video', duration: 35 },
          { title: 'Build và Push Images', type: 'video', duration: 25 }
        ]
      },
      {
        title: 'Docker Compose',
        lessons: [
          { title: 'Multi-container Apps', type: 'video', duration: 40 },
          { title: 'Networks và Volumes', type: 'text', duration: 20 },
          { title: 'Project: Dockerize App', type: 'project', duration: 90 }
        ]
      }
    ]
  },

  // Marketing (6 courses)
  {
    title: 'Digital Marketing từ A-Z',
    description: 'Khóa học toàn diện về marketing online, SEO, SEM, Social Media',
    category: 'Marketing',
    tags: ['marketing', 'digital', 'seo', 'social-media'],
    modules: [
      {
        title: 'Digital Marketing Overview',
        lessons: [
          { title: 'Digital Marketing là gì?', type: 'video', duration: 20 },
          { title: 'Marketing Funnel', type: 'text', duration: 15 },
          { title: 'Customer Journey', type: 'video', duration: 25 }
        ]
      },
      {
        title: 'SEO Fundamentals',
        lessons: [
          { title: 'On-page SEO', type: 'video', duration: 35 },
          { title: 'Off-page SEO', type: 'video', duration: 30 }
        ]
      },
      {
        title: 'Social Media Marketing',
        lessons: [
          { title: 'Facebook Ads', type: 'video', duration: 40 },
          { title: 'Instagram Marketing', type: 'video', duration: 35 },
          { title: 'Quiz: Marketing Basics', type: 'quiz', duration: 20 }
        ]
      }
    ]
  },
  {
    title: 'Facebook Ads Mastery',
    description: 'Làm chủ Facebook Ads từ cơ bản đến nâng cao',
    category: 'Marketing',
    tags: ['facebook', 'ads', 'social-media', 'paid-advertising'],
    modules: [
      {
        title: 'Facebook Ads Setup',
        lessons: [
          { title: 'Tạo Business Manager', type: 'video', duration: 20 },
          { title: 'Pixel và Tracking', type: 'video', duration: 30 },
          { title: 'Campaign Structure', type: 'text', duration: 15 }
        ]
      },
      {
        title: 'Ad Creation',
        lessons: [
          { title: 'Targeting Audience', type: 'video', duration: 35 },
          { title: 'Ad Creative Design', type: 'video', duration: 40 }
        ]
      },
      {
        title: 'Optimization',
        lessons: [
          { title: 'A/B Testing', type: 'video', duration: 30 },
          { title: 'Scaling Campaigns', type: 'video', duration: 35 },
          { title: 'Project: Launch Campaign', type: 'project', duration: 120 }
        ]
      }
    ]
  },
  {
    title: 'Google Ads cho Beginners',
    description: 'Học quảng cáo Google Ads hiệu quả, tối ưu ROI',
    category: 'Marketing',
    tags: ['google-ads', 'sem', 'ppc', 'advertising'],
    modules: [
      {
        title: 'Google Ads Fundamentals',
        lessons: [
          { title: 'Google Ads Platform', type: 'video', duration: 20 },
          { title: 'Keyword Research', type: 'video', duration: 35 },
          { title: 'Campaign Types', type: 'text', duration: 15 }
        ]
      },
      {
        title: 'Search Campaigns',
        lessons: [
          { title: 'Text Ads Creation', type: 'video', duration: 30 },
          { title: 'Bidding Strategies', type: 'video', duration: 25 }
        ]
      },
      {
        title: 'Performance Max',
        lessons: [
          { title: 'Setup PMax Campaign', type: 'video', duration: 40 },
          { title: 'Conversion Tracking', type: 'video', duration: 30 },
          { title: 'Quiz: Google Ads', type: 'quiz', duration: 20 }
        ]
      }
    ]
  },
  {
    title: 'Email Marketing Automation',
    description: 'Xây dựng email marketing automation, nurture leads hiệu quả',
    category: 'Marketing',
    tags: ['email', 'automation', 'marketing', 'crm'],
    modules: [
      {
        title: 'Email Marketing Basics',
        lessons: [
          { title: 'Email Marketing là gì?', type: 'video', duration: 15 },
          { title: 'Building Email List', type: 'video', duration: 25 },
          { title: 'Email Design Best Practices', type: 'text', duration: 20 }
        ]
      },
      {
        title: 'Automation Workflows',
        lessons: [
          { title: 'Welcome Series', type: 'video', duration: 30 },
          { title: 'Drip Campaigns', type: 'video', duration: 35 }
        ]
      },
      {
        title: 'Advanced Strategies',
        lessons: [
          { title: 'Segmentation', type: 'video', duration: 25 },
          { title: 'A/B Testing Emails', type: 'video', duration: 30 },
          { title: 'Project: Email Campaign', type: 'project', duration: 90 }
        ]
      }
    ]
  },
  {
    title: 'Content Marketing Strategy',
    description: 'Xây dựng chiến lược content marketing thu hút khách hàng',
    category: 'Marketing',
    tags: ['content', 'strategy', 'marketing', 'blogging'],
    modules: [
      {
        title: 'Content Strategy',
        lessons: [
          { title: 'Content Marketing Overview', type: 'video', duration: 20 },
          { title: 'Audience Research', type: 'video', duration: 25 },
          { title: 'Content Planning', type: 'text', duration: 15 }
        ]
      },
      {
        title: 'Content Creation',
        lessons: [
          { title: 'Blog Writing', type: 'video', duration: 35 },
          { title: 'Video Content', type: 'video', duration: 30 }
        ]
      },
      {
        title: 'Distribution',
        lessons: [
          { title: 'Content Distribution Channels', type: 'video', duration: 25 },
          { title: 'Content Analytics', type: 'video', duration: 30 },
          { title: 'Quiz: Content Strategy', type: 'quiz', duration: 20 }
        ]
      }
    ]
  },
  {
    title: 'TikTok Marketing cho Business',
    description: 'Tận dụng TikTok để marketing sản phẩm hiệu quả',
    category: 'Marketing',
    tags: ['tiktok', 'social-media', 'video', 'viral'],
    modules: [
      {
        title: 'TikTok Basics',
        lessons: [
          { title: 'TikTok Algorithm', type: 'video', duration: 20 },
          { title: 'Business Account Setup', type: 'text', duration: 15 },
          { title: 'Content Strategy', type: 'video', duration: 25 }
        ]
      },
      {
        title: 'Video Creation',
        lessons: [
          { title: 'Video Editing Tips', type: 'video', duration: 35 },
          { title: 'Trending Content', type: 'video', duration: 30 }
        ]
      },
      {
        title: 'TikTok Ads',
        lessons: [
          { title: 'TikTok Ads Manager', type: 'video', duration: 40 },
          { title: 'Campaign Optimization', type: 'video', duration: 35 },
          { title: 'Project: Viral Video', type: 'project', duration: 120 }
        ]
      }
    ]
  },

  // Content Creation (3 courses)
  {
    title: 'Video Production và Editing',
    description: 'Học cách quay và dựng video chuyên nghiệp',
    category: 'Content Creation',
    tags: ['video', 'editing', 'production', 'premiere'],
    modules: [
      {
        title: 'Video Basics',
        lessons: [
          { title: 'Camera và Equipment', type: 'video', duration: 25 },
          { title: 'Lighting Basics', type: 'video', duration: 20 },
          { title: 'Audio Recording', type: 'text', duration: 15 }
        ]
      },
      {
        title: 'Premiere Pro',
        lessons: [
          { title: 'Interface và Workflow', type: 'video', duration: 30 },
          { title: 'Cutting và Transitions', type: 'video', duration: 35 }
        ]
      },
      {
        title: 'Advanced Editing',
        lessons: [
          { title: 'Color Grading', type: 'video', duration: 40 },
          { title: 'Effects và Motion Graphics', type: 'video', duration: 45 },
          { title: 'Project: Edit Video', type: 'project', duration: 120 }
        ]
      }
    ]
  },
  {
    title: 'Copywriting - Viết Content bán hàng',
    description: 'Nghệ thuật viết content thuyết phục và bán hàng hiệu quả',
    category: 'Content Creation',
    tags: ['copywriting', 'writing', 'content', 'sales'],
    modules: [
      {
        title: 'Copywriting Fundamentals',
        lessons: [
          { title: 'What is Copywriting?', type: 'video', duration: 20 },
          { title: 'Psychology of Persuasion', type: 'video', duration: 30 },
          { title: 'Writing Headlines', type: 'text', duration: 15 }
        ]
      },
      {
        title: 'Copy Formulas',
        lessons: [
          { title: 'AIDA Framework', type: 'video', duration: 25 },
          { title: 'PAS Formula', type: 'video', duration: 25 }
        ]
      },
      {
        title: 'Advanced Techniques',
        lessons: [
          { title: 'Storytelling in Copy', type: 'video', duration: 35 },
          { title: 'Call-to-Action Writing', type: 'video', duration: 30 },
          { title: 'Quiz: Copywriting', type: 'quiz', duration: 20 }
        ]
      }
    ]
  },
  {
    title: 'Graphic Design với Figma',
    description: 'Thiết kế UI/UX và graphics với Figma',
    category: 'Content Creation',
    tags: ['figma', 'design', 'ui-ux', 'graphics'],
    modules: [
      {
        title: 'Figma Basics',
        lessons: [
          { title: 'Interface và Tools', type: 'video', duration: 20 },
          { title: 'Frames và Layers', type: 'video', duration: 25 },
          { title: 'Typography Basics', type: 'text', duration: 15 }
        ]
      },
      {
        title: 'UI Design',
        lessons: [
          { title: 'Components và Variants', type: 'video', duration: 35 },
          { title: 'Auto Layout', type: 'video', duration: 30 }
        ]
      },
      {
        title: 'Prototyping',
        lessons: [
          { title: 'Interactive Prototypes', type: 'video', duration: 40 },
          { title: 'Design Systems', type: 'video', duration: 35 },
          { title: 'Project: Design App UI', type: 'project', duration: 120 }
        ]
      }
    ]
  },

  // Business & Productivity (3 courses)
  {
    title: 'Excel cho Business Analysis',
    description: 'Làm chủ Excel để phân tích dữ liệu và báo cáo',
    category: 'Business',
    tags: ['excel', 'data-analysis', 'business', 'spreadsheet'],
    modules: [
      {
        title: 'Excel Fundamentals',
        lessons: [
          { title: 'Interface và Basic Functions', type: 'video', duration: 20 },
          { title: 'Formulas và Functions', type: 'video', duration: 30 },
          { title: 'Data Formatting', type: 'text', duration: 15 }
        ]
      },
      {
        title: 'Advanced Excel',
        lessons: [
          { title: 'Pivot Tables', type: 'video', duration: 40 },
          { title: 'VLOOKUP và XLOOKUP', type: 'video', duration: 35 }
        ]
      },
      {
        title: 'Data Visualization',
        lessons: [
          { title: 'Charts và Graphs', type: 'video', duration: 30 },
          { title: 'Dashboard Creation', type: 'video', duration: 45 },
          { title: 'Project: Sales Dashboard', type: 'project', duration: 90 }
        ]
      }
    ]
  },
  {
    title: 'Quản lý Dự án với Agile',
    description: 'Học phương pháp Agile/Scrum để quản lý dự án hiệu quả',
    category: 'Business',
    tags: ['agile', 'scrum', 'project-management', 'productivity'],
    modules: [
      {
        title: 'Agile Fundamentals',
        lessons: [
          { title: 'Agile vs Waterfall', type: 'video', duration: 20 },
          { title: 'Agile Manifesto', type: 'text', duration: 15 },
          { title: 'Scrum Framework', type: 'video', duration: 25 }
        ]
      },
      {
        title: 'Scrum Events',
        lessons: [
          { title: 'Sprint Planning', type: 'video', duration: 30 },
          { title: 'Daily Standup', type: 'video', duration: 20 }
        ]
      },
      {
        title: 'Agile Tools',
        lessons: [
          { title: 'Jira cho Scrum', type: 'video', duration: 35 },
          { title: 'User Stories', type: 'video', duration: 30 },
          { title: 'Quiz: Agile Concepts', type: 'quiz', duration: 20 }
        ]
      }
    ]
  },
  {
    title: 'Instagram Marketing - Chiến lược tăng trưởng',
    description: 'Xây dựng thương hiệu và bán hàng hiệu quả trên Instagram',
    category: 'Marketing',
    tags: ['instagram', 'social-media', 'marketing', 'growth'],
    modules: [
      {
        title: 'Instagram Basics',
        lessons: [
          { title: 'Instagram Algorithm 2024', type: 'video', duration: 20 },
          { title: 'Profile Optimization', type: 'video', duration: 25 },
          { title: 'Content Strategy', type: 'text', duration: 15 }
        ]
      },
      {
        title: 'Content Creation',
        lessons: [
          { title: 'Reels vs Posts vs Stories', type: 'video', duration: 30 },
          { title: 'Hashtag Strategy', type: 'video', duration: 25 }
        ]
      },
      {
        title: 'Growth Strategies',
        lessons: [
          { title: 'Organic Growth Tactics', type: 'video', duration: 35 },
          { title: 'Instagram Ads', type: 'video', duration: 40 },
          { title: 'Project: Grow Account', type: 'project', duration: 120 }
        ]
      }
    ]
  }
];

const seedCourses = async () => {
  try {
    await connectDB();

    console.log('🌱 Starting to seed courses and lessons...');

    // Lấy danh sách teachers
    const teachers = await User.find({ 
      email: { $regex: /^teacher\d+@gmail\.com$/ } 
    }).limit(10);

    if (teachers.length === 0) {
      console.error('❌ No teachers found! Please run seed-users.ts first.');
      process.exit(1);
    }

    console.log(`✅ Found ${teachers.length} teachers`);

    // Kiểm tra số lượng courses hiện có
    const existingCoursesCount = await Course.countDocuments();
    console.log(`📊 Existing courses in database: ${existingCoursesCount}`);
    
    // Xóa courses và lessons cũ để tạo lại
    console.log('🗑️  Clearing existing courses and lessons...');
    await Course.deleteMany({});
    await Lesson.deleteMany({});
    console.log('✅ Cleared existing courses and lessons');

    let totalCoursesCreated = 0;
    let totalLessonsCreated = 0;

    for (const courseData of coursesData) {
      // Random teacher
      const randomTeacher = teachers[Math.floor(Math.random() * teachers.length)];
      
      // Random price
      const prices = [0, 199000, 299000, 399000, 499000, 599000, 799000, 999000];
      const randomPrice = prices[Math.floor(Math.random() * prices.length)];

      // Tạo course trước (không có modules)
      const course = await Course.create({
        title: courseData.title,
        description: courseData.description,
        category: courseData.category,
        tags: courseData.tags,
        price: randomPrice,
        createdBy: randomTeacher._id,
        visibility: 'public',
        isActive: true,
        modules: []
      });

      console.log(`📚 Created course: ${course.title} (${course.category}) - ${randomPrice.toLocaleString('vi-VN')}đ`);
      totalCoursesCreated++;

      // Tạo modules và lessons
      const modules = [];
      
      for (const moduleData of courseData.modules) {
        const lessonIds = [];
        let lessonOrder = 1;

        // Tạo lessons cho module này
        for (const lessonData of moduleData.lessons) {
          const lesson = await Lesson.create({
            title: lessonData.title,
            type: lessonData.type,
            duration: lessonData.duration,
            courseId: course._id,
            order: lessonOrder++,
            isActive: true,
            difficulty: 'beginner'
          });

          lessonIds.push(lesson._id);
          totalLessonsCreated++;
        }

        // Thêm module với lessonIds
        modules.push({
          title: moduleData.title,
          order: modules.length + 1,
          lessons: lessonIds as mongoose.Types.ObjectId[]
        });
      }

      // Update course với modules
      course.modules = modules;
      await course.save();

      console.log(`  ✓ Added ${modules.length} modules with ${totalLessonsCreated} lessons`);
    }

    console.log('\n✅ Seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Total courses created: ${totalCoursesCreated}`);
    console.log(`   - Total lessons created: ${totalLessonsCreated}`);
    console.log(`   - Assigned to ${teachers.length} teachers`);

    // Hiển thị một vài ví dụ
    const sampleCourses = await Course.find().limit(3).populate('createdBy', 'name email');
    console.log('\n📋 Sample courses:');
    for (const course of sampleCourses) {
      const totalLessons = course.modules.reduce((total, module) => total + module.lessons.length, 0);
      console.log(`   - ${course.title}`);
      console.log(`     Teacher: ${(course.createdBy as any).name}`);
      console.log(`     Price: ${course.price.toLocaleString('vi-VN')}đ`);
      console.log(`     Modules: ${course.modules.length}, Total Lessons: ${totalLessons}`);
    }

  } catch (error: any) {
    console.error('❌ Error seeding courses:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  }
};

// Run the seed function
seedCourses();
