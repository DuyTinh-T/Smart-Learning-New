'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { CreditCard, ExternalLink, Calendar, DollarSign } from 'lucide-react';

interface Payment {
  id: string;
  courseId: string;
  courseName: string;
  courseSlug: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  createdAt: string;
  completedAt?: string | null;
  stripeSessionId: string;
}

interface PaymentHistoryResponse {
  payments: Payment[];
  total: number;
}

const statusColors = {
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
  refunded: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300'
};

const statusLabels = {
  completed: 'Completed',
  pending: 'Pending',
  failed: 'Failed',
  cancelled: 'Cancelled',
  refunded: 'Refunded'
};

export function PaymentHistory() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch payment history
  const fetchPayments = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/payment/history');
      
      if (!response.ok) {
        throw new Error('Failed to fetch payment history');
      }
      
      const data: PaymentHistoryResponse = await response.json();
      setPayments(data.payments);
      
    } catch (error) {
      console.error('Error fetching payments:', error);
      setError(error instanceof Error ? error.message : 'Failed to load payments');
      
      toast({
        title: "Error",
        description: "Failed to load payment history",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchPayments();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  // Format currency
  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount);
  };

  // Handle view course
  const handleViewCourse = (courseSlug: string) => {
    window.location.href = `/courses/${courseSlug}`;
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <CreditCard className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Payment History</h2>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
          <p className="text-muted-foreground text-center mb-4">
            Please log in to view your payment history.
          </p>
          <Button onClick={() => window.location.href = '/login'}>
            Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <div className="text-red-500 mb-4">⚠️</div>
          <h3 className="text-lg font-semibold mb-2">Error Loading Payments</h3>
          <p className="text-muted-foreground text-center mb-4">{error}</p>
          <Button onClick={fetchPayments}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (payments.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Payments Found</h3>
          <p className="text-muted-foreground text-center mb-4">
            You haven't made any course purchases yet.
          </p>
          <Button onClick={() => window.location.href = '/courses'}>
            Browse Courses
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CreditCard className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Payment History</h2>
        </div>
        <Badge variant="secondary">
          {payments.length} transaction{payments.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="space-y-4">
        {payments.map((payment) => (
          <Card key={payment.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{payment.courseName}</CardTitle>
                  <CardDescription className="flex items-center space-x-4">
                    <span className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(payment.createdAt), 'MMM d, yyyy')}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <DollarSign className="h-4 w-4" />
                      <span>{formatAmount(payment.amount, payment.currency)}</span>
                    </span>
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={statusColors[payment.status]}>
                    {statusLabels[payment.status]}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {payment.status === 'completed' && payment.completedAt && (
                    <span>
                      Completed on {format(new Date(payment.completedAt), 'MMM d, yyyy HH:mm')}
                    </span>
                  )}
                  {payment.status === 'pending' && (
                    <span>Payment is being processed...</span>
                  )}
                  {payment.status === 'failed' && (
                    <span>Payment failed. Please try again.</span>
                  )}
                  {payment.status === 'cancelled' && (
                    <span>Payment was cancelled.</span>
                  )}
                </div>
                
                {payment.courseSlug && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewCourse(payment.courseSlug)}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View Course
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}