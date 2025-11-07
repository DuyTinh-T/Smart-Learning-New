import { StudentDashboard } from "@/components/student/student-dashboard"
import { Header } from "@/components/header"
import { RoleGuard } from "@/components/auth/role-guard"

export default function StudentDashboardPage() {
  return (
    <RoleGuard allowedRoles={['student']}>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-muted/30">
          <StudentDashboard />
        </main>
      </div>
    </RoleGuard>
  )
}
