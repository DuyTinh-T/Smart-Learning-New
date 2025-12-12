'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, BookOpen, Play, ArrowRight } from 'lucide-react';

export function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [courseId, setCourseId] = useState<string | null>(null);

  // Simulate webhook for test environment (since webhooks don't work on localhost)
  const simulateWebhook = async (sessionId: string) => {
    try {
      const response = await fetch('/api/payment/simulate-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        console.error('Failed to simulate webhook');
      } else {
        console.log('Webhook simulated successfully');
      }
    } catch (error) {
      console.error('Error simulating webhook:', error);
    }
  };

  useEffect(() => {
    // Get course ID and session ID from URL params
    const courseIdFromUrl = searchParams.get('courseId');
    const sessionId = searchParams.get('session_id');
    
    if (courseIdFromUrl) {
      setCourseId(courseIdFromUrl);
    }

    // Simulate webhook for test environment if session_id exists
    if (sessionId) {
      simulateWebhook(sessionId);
    }

    // Show success toast
    toast({
      title: "🎉 Payment Successful!",
      description: "Welcome to your new course! You now have lifetime access.",
      variant: "default",
      duration: 5000,
    });

    // Auto redirect after a delay
    if (courseIdFromUrl) {
      setTimeout(() => {
        router.push(`/student/courses/${courseIdFromUrl}`);
      }, 5000);
    }
  }, [searchParams, router, toast]);

  const handleStartLearning = () => {
    if (courseId) {
      router.push(`/student/courses/${courseId}`);
    } else {
      router.push('/courses');
    }
  };

  const handleViewAllCourses = () => {
    router.push('/courses');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-green-600 mb-2">Payment Successful!</h1>
          <p className="text-muted-foreground text-lg">
            Thank you for your purchase. Your enrollment has been confirmed.
          </p>
        </div>

        <Card className="border-green-200">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-green-700">🎓 Welcome to Your Course!</CardTitle>
            <CardDescription>
              You now have lifetime access to all course materials, including:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <Play className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-sm">Bài học video</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-sm">Tài liệu khóa học</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-sm">Theo dõi tiến độ</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <ArrowRight className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-sm">Truy cập trọn đời</span>
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={handleStartLearning}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Learning Now
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleViewAllCourses}
                  className="flex-1"
                  size="lg"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Browse More Courses
                </Button>
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>
                {courseId ? (
                  <>You'll be automatically redirected to your course in a few seconds...</>
                ) : (
                  <>Having trouble? Contact our support team for assistance.</>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            🎉 Welcome to the community of learners!
          </Badge>
        </div>
      </div>
    </div>
  );
}