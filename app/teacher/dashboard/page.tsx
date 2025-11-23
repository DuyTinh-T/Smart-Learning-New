import { TeacherDashboard } from "@/components/teacher/teacher-dashboard"
import { Header } from "@/components/header"
import { RoleGuard } from "@/components/auth/role-guard"
import { Footer } from "@/components/footer"

export default function TeacherDashboardPage() {
  return (
    <RoleGuard allowedRoles={['teacher']}>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-muted/30">
          <TeacherDashboard />
        </main>
      <Footer />
      </div>
    </RoleGuard>
  )
}
