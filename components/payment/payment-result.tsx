'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';

interface PaymentResultProps {
  onSuccess?: () => void;
  onError?: () => void;
  courseId?: string;
}

export function PaymentResult({ onSuccess, onError, courseId }: PaymentResultProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [result, setResult] = useState<'success' | 'cancelled' | 'error' | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const payment = searchParams.get('payment');
    const sessionId = searchParams.get('session_id');
    
    if (payment === 'success') {
      setResult('success');
      
      // If we're on course page with success, redirect to payment success page
      if (courseId) {
        const successUrl = `/payment/success?courseId=${courseId}`;
        if (sessionId) {
          window.location.href = `${successUrl}&session_id=${sessionId}`;
        } else {
          router.push(successUrl);
        }
        return;
      }
      
      // Show success toast for fallback
      toast({
        title: "🎉 Payment Successful!",
        description: "Your course purchase was completed successfully. You now have access to the course!",
        variant: "default",
        duration: 5000,
      });
      
      onSuccess?.();
      
      // Auto dismiss after a delay and clean URL
      setTimeout(() => {
        handleDismiss();
      }, 3000);
      
    } else if (payment === 'cancelled') {
      setResult('cancelled');
      
      // Show cancelled toast
      toast({
        title: "Payment Cancelled",
        description: "You cancelled the payment. You can try again anytime.",
        variant: "default",
        duration: 4000,
      });
      
      onError?.();
      
    } else if (payment === 'error') {
      setResult('error');
      
      // Show error toast  
      toast({
        title: "Payment Error",
        description: "There was an issue processing your payment. Please try again or contact support.",
        variant: "destructive",
        duration: 5000,
      });
      
      onError?.();
    }
  }, [searchParams, onSuccess, onError, toast]);

  const handleRetry = () => {
    setLoading(true);
    // Reload the page to retry
    window.location.reload();
  };

  const handleDismiss = () => {
    // Remove payment parameters from URL
    const url = new URL(window.location.href);
    url.searchParams.delete('payment');
    window.history.replaceState({}, '', url.toString());
    setResult(null);
  };

  const handleContinueLearning = () => {
    if (courseId) {
      router.push(`/student/courses/${courseId}`);
    } else {
      handleDismiss();
    }
  };

  if (!result) return null;

  return (
    <div className="mb-6">
      {result === 'success' && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950/50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">🎉 Payment Successful!</div>
                <div className="text-sm mt-1">
                  Welcome to the course! You now have lifetime access to all course materials.
                </div>
              </div>
              <div className="flex space-x-2">
                {courseId && (
                  <Button
                    size="sm"
                    onClick={handleContinueLearning}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Continue Learning
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="text-green-600 hover:text-green-700"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {result === 'cancelled' && (
        <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/50">
          <XCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">Payment Cancelled</div>
                <div className="text-sm mt-1">
                  No worries! Your payment was cancelled. You can try purchasing again whenever you're ready.
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="text-yellow-600 hover:text-yellow-700"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {result === 'error' && (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-950/50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">Payment Error</div>
                <div className="text-sm mt-1">
                  Something went wrong with your payment. Please try again or contact our support team.
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRetry}
                  disabled={loading}
                  className="text-red-600 hover:text-red-700"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    'Retry'
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="text-red-600 hover:text-red-700"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}