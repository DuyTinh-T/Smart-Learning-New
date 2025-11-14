'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { PurchaseCourseButton, PaymentStatus, PaymentResult } from "@/components/payment"
import Link from "next/link"

interface Course {
  _id: string
  title: string
  description: string
  price: number
  slug: string
  instructor: string
  thumbnail?: string
  level: string
}

interface PaymentDemoProps {
  courseId?: string
}

export function PaymentDemo({ courseId = "674e1234567890abcdef0001" }: PaymentDemoProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  
  // Demo course data
  const [course] = useState<Course>({
    _id: courseId,
    title: "Complete Web Development Bootcamp",
    description: "Learn full-stack web development with React, Node.js, and MongoDB",
    price: 99.99,
    slug: "complete-web-development-bootcamp",
    instructor: "John Doe",
    level: "Beginner",
    thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500"
  })

  const [lastSessionId, setLastSessionId] = useState<string | null>(null)

  // Handle test complete payment (for demo purposes)
  const handleTestCompletePayment = async () => {
    if (!lastSessionId) {
      toast({
        title: "No Session",
        description: "You need to start a payment first to test completion",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch('/api/payment/simulate-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId: lastSessionId })
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Payment Completed!",
          description: result.message,
          variant: "default"
        })
        
        // Refresh page to show new status
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        throw new Error('Failed to complete payment')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to simulate payment completion",
        variant: "destructive"
      })
    }
  }

  const [isEnrolled, setIsEnrolled] = useState(false)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Payment Result */}
        <PaymentResult 
          courseId={course._id}
          onSuccess={() => {
            setIsEnrolled(true)
            toast({
              title: "Success!",
              description: "Payment completed successfully. You now have access to the course."
            })
          }}
        />

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Course Info */}
          <div className="space-y-6">
            <div>
              <Badge className="mb-2">{course.level}</Badge>
              <h1 className="text-3xl font-bold mb-4">{course.title}</h1>
              <p className="text-muted-foreground mb-4">{course.description}</p>
              <p className="text-sm">
                <span className="font-semibold">Instructor:</span> {course.instructor}
              </p>
            </div>

            {course.thumbnail && (
              <div className="aspect-video overflow-hidden rounded-lg">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Purchase Card */}
          <div className="lg:sticky lg:top-8">
            <Card>
              <CardContent className="p-6">
                {/* Payment Status */}
                <PaymentStatus 
                  courseId={course._id} 
                  onStatusChange={(status) => {
                    setIsEnrolled(status.isEnrolled)
                  }} 
                />

                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold">
                      ${course.price}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      One-time payment
                    </p>
                  </div>

                  {isEnrolled ? (
                    <div className="space-y-4">
                      <Badge className="w-full justify-center bg-green-100 text-green-800 py-2">
                        ✓ Enrolled
                      </Badge>
                      <Button className="w-full" asChild>
                        <Link href={`/student/courses/${course._id}`}>
                          Continue Learning
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <PurchaseCourseButton 
                        course={course}
                        isEnrolled={isEnrolled}
                      />

                      <div className="text-xs text-muted-foreground text-center">
                        <p>💳 Test with card: 4242 4242 4242 4242</p>
                        <p>Use any future date and CVC</p>
                        <p className="mt-2 pt-2 border-t">
                          If payment gets stuck as "pending", visit{' '}
                          <Link href="/admin/payments" className="text-blue-600 underline">
                            Admin Payments
                          </Link>{' '}
                          to manually resolve it.
                        </p>
                      </div>

                      {/* Debug button for testing payment completion */}
                      {lastSessionId && (
                        <div className="pt-4 border-t">
                          <p className="text-xs text-muted-foreground mb-2">
                            Demo: Simulate payment webhook completion
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={handleTestCompletePayment}
                          >
                            🔧 Test Complete Payment
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <h3 className="font-semibold mb-2">This course includes:</h3>
                    <ul className="text-sm space-y-1">
                      <li>✓ 25+ hours of video content</li>
                      <li>✓ Downloadable resources</li>
                      <li>✓ Lifetime access</li>
                      <li>✓ Certificate of completion</li>
                      <li>✓ 30-day money-back guarantee</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment History Link */}
            {user && (
              <div className="mt-4 text-center">
                <Button variant="outline" asChild>
                  <Link href="/profile?tab=payments">
                    View Payment History
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Demo Info */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            🧪 Payment Demo
          </h3>
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <p>This is a demo of the Stripe payment integration.</p>
            <p><strong>Test Mode:</strong> No real money will be charged.</p>
            <p><strong>Test Card:</strong> 4242 4242 4242 4242 (any future date, any CVC)</p>
            <p><strong>APIs Available:</strong></p>
            <ul className="list-disc list-inside ml-4 mt-2">
              <li>POST /api/payment/create-session - Create payment session</li>
              <li>POST /api/payment/webhook - Handle payment webhooks</li>
              <li>GET /api/payment/history - Get payment history</li>
              <li>GET /api/payment/check-access - Check course access</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}