import { TeacherDashboard } from "@/components/teacher/teacher-dashboard"
import { Header } from "@/components/header"

export default function TeacherDashboardPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <TeacherDashboard />
      </main>
    </div>
  )
}
