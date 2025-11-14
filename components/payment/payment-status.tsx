'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Clock, AlertTriangle, XCircle } from 'lucide-react';

interface PaymentStatusProps {
  courseId: string;
  onStatusChange?: (status: AccessStatus) => void;
}

interface AccessStatus {
  isEnrolled: boolean;
  hasPaid: boolean;
  hasPendingPayment: boolean;
  enrollmentStatus: string | null;
  paymentId: string | null;
  pendingPaymentId: string | null;
}

export function PaymentStatus({ courseId, onStatusChange }: PaymentStatusProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<AccessStatus | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch access status
  const fetchStatus = async () => {
    if (!user || !courseId) return;
    
    try {
      setLoading(true);
      
      const response = await fetch(`/api/payment/check-access?courseId=${courseId}`);
      
      if (!response.ok) {
        throw new Error('Failed to check access status');
      }
      
      const data: AccessStatus = await response.json();
      setStatus(data);
      onStatusChange?.(data);
      
    } catch (error) {
      console.error('Error checking access status:', error);
      toast({
        title: "Error",
        description: "Failed to check course access status",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchStatus();
    }
  }, [user, authLoading, courseId]);

  // Don't render anything if not authenticated or loading
  if (authLoading || loading || !user) {
    return null;
  }

  // Don't render if no status data
  if (!status) {
    return null;
  }

  // User is enrolled and has paid
  if (status.isEnrolled && status.hasPaid) {
    return (
      <Alert className="border-green-200 bg-green-50 dark:bg-green-950/50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800 dark:text-green-200">
          <div className="flex items-center justify-between">
            <span>You have access to this course</span>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Enrolled
            </Badge>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // User has pending payment
  if (status.hasPendingPayment) {
    return (
      <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/50">
        <Clock className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800 dark:text-yellow-200">
          <div className="flex items-center justify-between">
            <span>Payment is being processed. You'll get access once payment is confirmed.</span>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              Pending
            </Badge>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // User is enrolled but hasn't paid (might be a free course)
  if (status.isEnrolled && !status.hasPaid) {
    return (
      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/50">
        <CheckCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 dark:text-blue-200">
          <div className="flex items-center justify-between">
            <span>You are enrolled in this course</span>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Enrolled
            </Badge>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // No access - this will show the purchase button elsewhere
  return null;
}

// Hook to use payment status in other components
export function usePaymentStatus(courseId: string) {
  const { user, isLoading: authLoading } = useAuth();
  const [status, setStatus] = useState<AccessStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    if (!user || !courseId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/payment/check-access?courseId=${courseId}`);
      
      if (!response.ok) {
        throw new Error('Failed to check access status');
      }
      
      const data: AccessStatus = await response.json();
      setStatus(data);
      
    } catch (error) {
      console.error('Error checking access status:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchStatus();
    }
  }, [user, authLoading, courseId]);

  return {
    status,
    loading: loading || authLoading,
    error,
    refetch: fetchStatus
  };
}