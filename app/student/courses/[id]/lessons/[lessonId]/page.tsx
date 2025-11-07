import { LessonView } from "@/components/course/lesson-view"
import { Header } from "@/components/header"
import { RoleGuard } from "@/components/auth/role-guard"

export default async function LessonPage({ params }: { params: Promise<{ id: string; lessonId: string }> }) {
  const { id, lessonId } = await params
  return (
    <RoleGuard allowedRoles={['student']}>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <LessonView courseId={id} lessonId={lessonId} />
        </main>
      </div>
    </RoleGuard>
  )
}
