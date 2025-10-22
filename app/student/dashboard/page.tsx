import { StudentDashboard } from "@/components/student/student-dashboard"
import { Header } from "@/components/header"

export default function StudentDashboardPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <StudentDashboard />
      </main>
    </div>
  )
}
