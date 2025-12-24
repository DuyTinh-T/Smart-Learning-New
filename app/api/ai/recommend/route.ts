import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import connectDB from "@/lib/mongodb";
import Course from "@/models/Course";
import { Enrollment } from "@/models/Enrollment";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, studentProfile, learningHistory } = body;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Connect to database to get additional info
    await connectDB();
    
    // Get list of available courses
    const availableCourses = await Course.find({ isActive: true })
      .select("title description tags category")
      .limit(50);

    // Get student's enrollment history (only if userId is valid ObjectId)
    let enrollments = [];
    if (userId && userId.match(/^[0-9a-fA-F]{24}$/)) {
      enrollments = await Enrollment.find({ student: userId })
        .populate("course", "title tags");
    }

    const prompt = `You are an AI learning advisor for an online education platform.
Your task is to analyze student profiles and recommend the most suitable courses in Vietnamese.

# Student Information:
${JSON.stringify(studentProfile, null, 2)}

# Learning History:
${JSON.stringify(learningHistory, null, 2)}

# Enrolled Courses:
${JSON.stringify(enrollments.map((e: any) => ({
  title: e.course?.title,
  tags: e.course?.tags,
  progress: e.progress
})), null, 2)}

# Available Courses on Platform:
${JSON.stringify(availableCourses.map(c => ({
  title: c.title,
  description: c.description,
  tags: c.tags,
  category: c.category
})), null, 2)}

Analyze and recommend 5 most suitable courses for this student.
Consider these factors:
- Match with current skill level
- Connection with favorite subjects
- Current learning progress
- Potential for new skill development

Return result in JSON format (all text in Vietnamese):
{
  "recommendations": [
    {
      "title": "Course name",
      "reason": "Detailed recommendation reason in Vietnamese (2-3 sentences)",
      "difficulty": "beginner/intermediate/advanced",
      "matchScore": 95,
      "tags": ["tag1", "tag2"],
      "benefits": ["benefit 1 in Vietnamese", "benefit 2 in Vietnamese"]
    }
  ],
  "learningPath": "Overall learning path suggestion in Vietnamese",
  "focusAreas": ["Focus skill 1 in Vietnamese", "Focus skill 2 in Vietnamese"]
}

Only return JSON, no additional explanatory text.`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an AI learning advisor. Always respond with valid JSON only, no additional text."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const resultText = completion.choices[0]?.message?.content || "{}";
    
    // Parse JSON from response
    let parsedResult;
    try {
      // Extract JSON from response
      const jsonMatch = resultText.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : resultText;
      parsedResult = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      console.error("Raw response:", resultText);
      return NextResponse.json(
        { error: "Invalid response from AI", details: resultText },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: parsedResult,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("AI Recommendation Error:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate recommendations", 
        details: error.message 
      },
      { status: 500 }
    );
  }
}
