import { Suspense } from 'react'
import { PaymentSuccessContent } from '@/components/payment/payment-success'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'

function PaymentSuccessLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Suspense fallback={<PaymentSuccessLoader />}>
          <PaymentSuccessContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}