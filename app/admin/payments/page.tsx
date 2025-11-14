import { PendingPaymentsAdmin } from "@/components/payment/pending-payments-admin"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function AdminPaymentsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <PendingPaymentsAdmin />
        </div>
      </main>
      <Footer />
    </div>
  )
}