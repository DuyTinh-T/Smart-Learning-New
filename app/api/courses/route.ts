import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';
import { authenticate, requireRole } from '@/lib/auth';

// GET /api/courses - Get all courses with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const keyword = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const tag = searchParams.get('tag') || '';
    const visibility = searchParams.get('visibility') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build filter query
    const filter: any = {};

    // Add keyword search
    if (keyword) {
      filter.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
        { tags: { $in: [new RegExp(keyword, 'i')] } }
      ];
    }

    // Add category filter
    if (category) {
      filter.category = { $regex: category, $options: 'i' };
    }

    // Add tag filter
    if (tag) {
      filter.tags = { $in: [new RegExp(tag, 'i')] };
    }

    // Add visibility filter (only if specified, otherwise show public courses)
    if (visibility) {
      filter.visibility = visibility;
    } else {
      filter.visibility = 'public';
    }

    // By default, only show active courses. Admins can include inactive via includeInactive=1
    const includeInactive = searchParams.get('includeInactive') || '0';
    if (includeInactive !== '1') {
      filter.isActive = true
    } else {
      // If includeInactive requested, validate requester is admin — otherwise still hide inactive
      try {
        const { user } = await authenticate(request);
        if (!user || user.role !== 'admin') {
          filter.isActive = true
        } else {
          // admin may see all, do not add isActive filter
        }
      } catch (e) {
        filter.isActive = true
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const [courses, totalCount] = await Promise.all([
      Course.find(filter)
        .populate('createdBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Course.countDocuments(filter)
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({
      success: true,
      data: courses,
      meta: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage
      }
    });

  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

// POST /api/courses - Create a new course (teacher/admin only)
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Authenticate user
    const { user, error } = await authenticate(request);
    if (error || !user) {
      return NextResponse.json(
        { success: false, error: error || 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user has permission to create courses
    const roleCheck = requireRole(['teacher', 'admin'])(user);
    if (!roleCheck.authorized) {
      return NextResponse.json(
        { success: false, error: roleCheck.error },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    const { title, description, category, tags, thumbnail, price, visibility } = body;
    
    if (!title || !description) {
      return NextResponse.json(
        { success: false, error: 'Title and description are required' },
        { status: 400 }
      );
    }

    // Create course data
    const courseData = {
      title,
      description,
      category: category || '',
      tags: Array.isArray(tags) ? tags : [],
      thumbnail: thumbnail || '',
      price: price || 0,
      visibility: visibility || 'public',
      createdBy: user._id,
      modules: [] // Start with empty modules
    };

    // Create new course
    const course = new Course(courseData);
    await course.save();

    // Populate creator info for response
    await course.populate('createdBy', 'name email');

    return NextResponse.json(
      {
        success: true,
        data: course,
        message: 'Course created successfully'
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Error creating course:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'Course with this title already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create course' },
      { status: 500 }
    );
  }
}