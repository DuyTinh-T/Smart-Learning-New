'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

interface PendingPayment {
  id: string;
  stripeSessionId: string;
  userId: any;
  courseId: any;
  amount: number;
  currency: string;
  createdAt: string;
  metadata: any;
}

export function PendingPaymentsAdmin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);

  // Fetch pending payments
  const fetchPendingPayments = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/payment/resolve');
      if (!response.ok) {
        throw new Error('Failed to fetch pending payments');
      }
      
      const data = await response.json();
      setPayments(data.payments || []);
      
    } catch (error) {
      console.error('Error fetching pending payments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch pending payments",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Resolve payment
  const resolvePayment = async (paymentId: string, action: 'complete' | 'fail') => {
    try {
      setResolving(paymentId);
      
      const response = await fetch('/api/payment/resolve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId,
          action
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to resolve payment');
      }

      const result = await response.json();
      
      toast({
        title: "Success",
        description: result.message,
        variant: "default"
      });

      // Refresh the list
      fetchPendingPayments();
      
    } catch (error) {
      console.error('Error resolving payment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to resolve payment',
        variant: "destructive"
      });
    } finally {
      setResolving(null);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchPendingPayments();
    }
  }, [user]);

  // Only show to admins
  if (!user || user.role !== 'admin') {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Admin access required to view pending payments.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Pending Payments</h2>
          <p className="text-muted-foreground">
            Manage payments that are stuck in pending status
          </p>
        </div>
        <Button onClick={fetchPendingPayments} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : payments.length === 0 ? (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            No pending payments found. All payments have been processed.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Found {payments.length} pending payment{payments.length !== 1 ? 's' : ''}. 
              These payments may need manual resolution if webhooks failed.
            </AlertDescription>
          </Alert>

          {payments.map((payment) => (
            <Card key={payment.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      Payment #{payment.id.slice(-8)}
                    </CardTitle>
                    <CardDescription className="space-y-1">
                      <div>Session: {payment.stripeSessionId}</div>
                      <div>Created: {format(new Date(payment.createdAt), 'MMM d, yyyy HH:mm')}</div>
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    <Clock className="h-3 w-3 mr-1" />
                    Pending
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Payment Details</h4>
                    <div className="space-y-1 text-sm">
                      <div><strong>Amount:</strong> ${payment.amount} {payment.currency.toUpperCase()}</div>
                      <div><strong>User:</strong> {payment.userId?.name || payment.userId?.email || 'Unknown'}</div>
                      <div><strong>Course:</strong> {payment.courseId?.title || 'Unknown Course'}</div>
                      <div><strong>Course ID:</strong> {payment.courseId?._id || 'N/A'}</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Metadata</h4>
                    <div className="text-xs bg-muted p-2 rounded">
                      <pre>{JSON.stringify(payment.metadata, null, 2)}</pre>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={() => resolvePayment(payment.id, 'complete')}
                    disabled={resolving === payment.id}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Mark as Completed
                  </Button>
                  <Button
                    onClick={() => resolvePayment(payment.id, 'fail')}
                    disabled={resolving === payment.id}
                    variant="destructive"
                    size="sm"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Mark as Failed
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}