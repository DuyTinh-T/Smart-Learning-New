import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { RoleGuard } from "@/components/auth/role-guard"

export default function AdminPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <AdminDashboard />
    </RoleGuard>
  )
}
